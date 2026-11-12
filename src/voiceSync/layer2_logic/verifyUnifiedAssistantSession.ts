import fs from "fs";
import path from "path";
import {
  INITIAL_ASSISTANT_SESSION_STATE,
  AssistantSessionState,
} from "../layer1_data/assistantSessionTypes";
import { evaluateToolSafety } from "../layer1_data/toolSafetyPolicyTypes";
import {
  assistantSessionReducer,
  parseWakeWordAndTrailingCommand,
} from "./assistantSessionReducer";
import { MicLeaseCoordinator } from "./micLeaseCoordinator";
import { SessionEpochAbortManager } from "./sessionEpochAbortManager";

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runUnifiedAssistantAcceptanceVerification(): Promise<void> {
  console.log("=== Running Unified Continuous Voice State Machine Acceptance Suite (AC-1 .. AC-8) ===");

  // AC-1: Wake + Command in One Breath
  {
    const parsed = parseWakeWordAndTrailingCommand(
      "Hey MAHR open the whiteboard and draw a binary tree",
      "MAHR"
    );
    assertCondition(parsed.matched === true, "AC-1: Wake word should match");
    assertCondition(
      parsed.trailingCommand === "open the whiteboard and draw a binary tree",
      `AC-1: Trailing command mismatch: ${parsed.trailingCommand}`
    );

    let s: AssistantSessionState = INITIAL_ASSISTANT_SESSION_STATE;
    s = assistantSessionReducer(s, {
      type: "WAKE_DETECTED",
      phrase: parsed.wakePhrase,
      trailingCommand: parsed.trailingCommand,
    });
    assertCondition(s.stage === "wake", "AC-1: Should transition standby -> wake");
    assertCondition(s.isSessionPinned === false, "AC-1: Voice wake should not pin session");
    assertCondition(
      s.queuedWakeCommand === "open the whiteboard and draw a binary tree",
      "AC-1: State should retain queuedWakeCommand"
    );

    s = assistantSessionReducer(s, { type: "WS_CONNECTED" });
    assertCondition(
      s.stage === "think_or_tool",
      "AC-1: WS_CONNECTED with queuedWakeCommand should transition immediately to think_or_tool"
    );
    console.log("✅ AC-1 Passed: Wake + Command in One Breath");
  }

  // AC-2: Fail-Safe Mic Lease Handoff (normal release + stuck SpeechRecognition timeout)
  {
    // Case A: Normal release
    let endedA = false;
    const coordOk = new MicLeaseCoordinator();
    coordOk.registerWakeRecognizer({
      stop: () => {
        endedA = true;
      },
      abort: () => {
        endedA = true;
      },
      isEnded: () => endedA,
      waitForEnd: async () => true,
    });
    const resOk = await coordOk.releaseWakeRecognizerWithFailSafe();
    assertCondition(resOk.released === true, "AC-2A: Normal wake recognizer release should succeed");

    // Case B: Stuck recognizer that never emits onend within 250ms + 2x150ms
    const coordFail = new MicLeaseCoordinator();
    coordFail.registerWakeRecognizer({
      stop: () => {},
      abort: () => {},
      isEnded: () => false,
      waitForEnd: async () => false,
    });
    const resFail = await coordFail.releaseWakeRecognizerWithFailSafe();
    assertCondition(resFail.released === false, "AC-2B: Stuck recognizer must fail-safe return released: false");
    assertCondition(Boolean(resFail.diagnostic), "AC-2B: Diagnostic message must be populated");

    let s: AssistantSessionState = assistantSessionReducer(INITIAL_ASSISTANT_SESSION_STATE, {
      type: "WAKE_DETECTED",
      phrase: "Hey MAHR",
    });
    s = assistantSessionReducer(s, {
      type: "MIC_HANDOFF_FAILED",
      diagnostic: resFail.diagnostic || "Timeout",
    });
    assertCondition(s.stage === "standby", "AC-2B: MIC_HANDOFF_FAILED must revert FSM to standby");
    assertCondition(Boolean(s.lastErrorDiagnostic), "AC-2B: FSM must store lastErrorDiagnostic");
    console.log("✅ AC-2 Passed: Fail-Safe Mic Lease Handoff");
  }

  // AC-3: Barge-In Interruption
  {
    let s: AssistantSessionState = {
      ...INITIAL_ASSISTANT_SESSION_STATE,
      stage: "speak",
      activePcmSourcesCount: 2,
      followUpRemainingMs: null,
    };
    s = assistantSessionReducer(s, { type: "BARGE_IN_INTERRUPTED" });
    assertCondition(s.stage === "listen", "AC-3: Barge-in must immediately transition speak -> listen");
    assertCondition(s.activePcmSourcesCount === 0, "AC-3: Barge-in must zero activePcmSourcesCount");
    assertCondition(s.followUpRemainingMs === null, "AC-3: Barge-in must clear followUpRemainingMs");
    console.log("✅ AC-3 Passed: Barge-In Interruption");
  }

  // AC-4: Multi-Condition Follow-Up Gate
  {
    let s: AssistantSessionState = {
      ...INITIAL_ASSISTANT_SESSION_STATE,
      stage: "listen",
      micLeaseOwner: "live_pcm_vad",
    };
    // Start tool call
    s = assistantSessionReducer(s, {
      type: "TOOL_CALL_START",
      toolId: "tool_1",
      toolName: "updateWhiteboard",
    });
    assertCondition(s.stage === "think_or_tool", "AC-4: Tool start transitions to think_or_tool");

    // Gemini sends turnComplete early while tool_1 is still running AND audio is playing
    s = assistantSessionReducer(s, {
      type: "AUDIO_PLAYBACK_UPDATED",
      activePcmSourcesCount: 1,
      pendingSpeechQueueCount: 0,
    });
    s = assistantSessionReducer(s, { type: "GEMINI_TURN_COMPLETE" });
    assertCondition(
      s.stage !== "follow_up",
      "AC-4: Must NOT enter follow_up while tool is pending or PCM audio is active"
    );

    // Tool finishes, but PCM audio is still playing
    s = assistantSessionReducer(s, { type: "TOOL_CALL_COMPLETED", toolId: "tool_1" });
    assertCondition(
      s.stage === "speak",
      "AC-4: Must remain in speak while activePcmSourcesCount > 0"
    );

    // PCM audio finishes -> all conditions satisfied -> enters follow_up (8000ms)
    s = assistantSessionReducer(s, {
      type: "AUDIO_PLAYBACK_UPDATED",
      activePcmSourcesCount: 0,
      pendingSpeechQueueCount: 0,
    });
    assertCondition(s.stage === "follow_up", "AC-4: Must enter follow_up once tool + audio complete");
    assertCondition(s.followUpRemainingMs === 8000, "AC-4: Follow-up window must initialize to 8000ms");
    console.log("✅ AC-4 Passed: Multi-Condition Follow-Up Gate");
  }

  // AC-5: 8s Countdown & Typed Chat in Follow-Up
  {
    let s: AssistantSessionState = {
      ...INITIAL_ASSISTANT_SESSION_STATE,
      stage: "follow_up",
      followUpRemainingMs: 8000,
      turnCompleteSignalReceived: true,
    };
    s = assistantSessionReducer(s, { type: "FOLLOW_UP_TICK", deltaMs: 2000 });
    assertCondition(s.followUpRemainingMs === 6000, "AC-5: Tick should decrement followUpRemainingMs to 6000");

    // User submits typed chat during follow-up
    s = assistantSessionReducer(s, { type: "CHAT_REQUEST_START" });
    assertCondition(s.stage === "think_or_tool", "AC-5: Typed chat during follow_up transitions to think_or_tool");
    assertCondition(s.followUpRemainingMs === null, "AC-5: Typed chat cancels follow_up countdown");

    // Chat request completes -> fresh 8000ms follow_up window
    s = assistantSessionReducer(s, { type: "CHAT_REQUEST_COMPLETE" });
    assertCondition(s.stage === "follow_up", "AC-5: Chat complete enters fresh follow_up window");
    assertCondition(s.followUpRemainingMs === 8000, "AC-5: Fresh follow_up window is 8000ms");
    console.log("✅ AC-5 Passed: 8s Countdown & Typed Chat in Follow-Up");
  }

  // AC-6: Pinning, Sleep & Power Override, and Post-Power Wake-Word
  {
    // Unpinned expiry -> standby
    let unpinned: AssistantSessionState = {
      ...INITIAL_ASSISTANT_SESSION_STATE,
      stage: "follow_up",
      isSessionPinned: false,
      followUpRemainingMs: 200,
    };
    unpinned = assistantSessionReducer(unpinned, { type: "FOLLOW_UP_EXPIRED" });
    assertCondition(unpinned.stage === "standby", "AC-6A: Unpinned follow_up expiry returns to standby");

    // Pinned expiry -> listen
    let pinned: AssistantSessionState = {
      ...INITIAL_ASSISTANT_SESSION_STATE,
      stage: "follow_up",
      isSessionPinned: true,
      followUpRemainingMs: 200,
    };
    pinned = assistantSessionReducer(pinned, { type: "FOLLOW_UP_EXPIRED" });
    assertCondition(pinned.stage === "listen", "AC-6B: Pinned follow_up expiry loops back to listen");

    // Power button click overrides pin, sets suppressAutoReconnect = true, forces standby
    const afterPower = assistantSessionReducer(pinned, { type: "POWER_BUTTON_CLICK" });
    assertCondition(afterPower.stage === "standby", "AC-6C: Power click forces standby");
    assertCondition(afterPower.isSessionPinned === false, "AC-6C: Power click clears isSessionPinned");
    assertCondition(
      afterPower.suppressAutoReconnect === true,
      "AC-6C: Power click sets suppressAutoReconnect = true"
    );

    // Crucial: User says "Hey MAHR" after Power click -> wakes up despite suppressAutoReconnect!
    const reWoken = assistantSessionReducer(afterPower, {
      type: "WAKE_DETECTED",
      phrase: "Hey MAHR",
      now: Date.now() + 3000,
    });
    assertCondition(
      reWoken.stage === "wake",
      "AC-6D: 'Hey MAHR' wake-word MUST wake assistant even after Power click"
    );
    assertCondition(
      reWoken.suppressAutoReconnect === false,
      "AC-6D: Wake-word clears suppressAutoReconnect"
    );
    console.log("✅ AC-6 Passed: Pinning, Sleep/Power Override & Post-Power 'Hey MAHR' Wake-Up");
  }

  // AC-7: Abort & Late-Result Quarantine
  {
    const epochMgr = new SessionEpochAbortManager();
    epochMgr.syncState(1, "think_or_tool");
    const capturedEpoch = epochMgr.getEpochId();
    const signal = epochMgr.getTurnAbortSignal();
    assertCondition(epochMgr.isEpochActive(capturedEpoch) === true, "AC-7: Epoch initially active");
    assertCondition(signal.aborted === false, "AC-7: Signal initially not aborted");

    // Trigger Sleep/Power
    const nextEpoch = epochMgr.advanceEpochAndAbortAll("sleep_command");
    assertCondition(nextEpoch === 2, "AC-7: Epoch incremented to 2");
    assertCondition(signal.aborted === true, "AC-7: In-flight AbortSignal aborted on sleep");
    assertCondition(
      epochMgr.isEpochActive(capturedEpoch) === false,
      "AC-7: Stale tool completion epoch is quarantined"
    );

    let quarantinedCalled: boolean = false;
    let mutatedUi: boolean = false;
    epochMgr.runIfEpochActive(
      capturedEpoch,
      () => {
        mutatedUi = true;
      },
      {
        onQuarantined: () => {
          quarantinedCalled = true;
        },
      }
    );
    assertCondition(!mutatedUi && Boolean(quarantinedCalled), "AC-7: Late callback quarantined");
    console.log("✅ AC-7 Passed: AbortController & Late-Result Epoch Quarantine");
  }

  // AC-8: Default-Deny Tool Safety Gate & Credential Cleanup
  {
    const t1 = evaluateToolSafety("updateWhiteboard", { title: "Calculus" });
    assertCondition(
      t1.allowedImmediate && t1.tier === "tier1_auto_allow",
      "AC-8A: updateWhiteboard is Tier-1 safe"
    );

    const t2 = evaluateToolSafety("deleteMemory", { id: "mem_123" });
    assertCondition(
      !t2.allowedImmediate && t2.requiresApproval && t2.tier === "tier2_require_approval",
      "AC-8B: deleteMemory requires Tier-2 user approval"
    );

    const t3Unknown = evaluateToolSafety("executeRawBashCommand", { cmd: "rm -rf /" });
    assertCondition(
      !t3Unknown.allowedImmediate && !t3Unknown.requiresApproval && t3Unknown.tier === "tier3_hard_deny",
      "AC-8C: Unknown tool is denied by default-deny policy"
    );

    const t3Traversal = evaluateToolSafety("updateWhiteboard", {
      notes: "../../certs/codesign.key",
    });
    assertCondition(
      !t3Traversal.allowedImmediate && t3Traversal.tier === "tier3_hard_deny",
      "AC-8D: Path traversal / key reference is blocked"
    );

    const certsDirExists = fs.existsSync(path.resolve(process.cwd(), "certs"));
    assertCondition(!certsDirExists, "AC-8E: /certs directory must be removed from workspace");

    const gitignoreContent = fs.readFileSync(path.resolve(process.cwd(), ".gitignore"), "utf-8");
    assertCondition(
      gitignoreContent.includes("*.key") && gitignoreContent.includes("*.pfx"),
      "AC-8F: .gitignore must block *.key and *.pfx"
    );
    console.log("✅ AC-8 Passed: Default-Deny Tool Safety Gate & Credential Cleanup");
  }

  console.log("=== ALL 8 ACCEPTANCE CRITERIA (AC-1 .. AC-8) PASSED SUCCESSFULLY ===");
}
