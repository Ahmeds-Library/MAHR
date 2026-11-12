import type { LiveState } from "../../lib/audio";

/**
 * Canonical 6-Stage Continuous Voice Assistant Lifecycle:
 * standby -> wake -> listen -> think_or_tool -> speak -> follow_up
 */
export type AssistantStage =
  | "standby"
  | "wake"
  | "listen"
  | "think_or_tool"
  | "speak"
  | "follow_up";

/**
 * Exclusive Microphone Lease Ownership:
 * Guarantees browser SpeechRecognition and Web Audio 16kHz getUserMedia never run concurrently.
 */
export type MicLeaseOwner =
  | "none"
  | "wake_recognizer"
  | "releasing_wake"
  | "live_pcm_vad";

export type ToolSafetyTier = "tier1_auto_allow" | "tier2_require_approval" | "tier3_hard_deny";

export interface ToolApprovalRequest {
  id: string;
  toolName: string;
  args: Record<string, any>;
  reason: string;
  createdAt: number;
  expiresAt: number;
  epochId: number;
}

export interface AssistantSessionState {
  stage: AssistantStage;
  isSessionPinned: boolean;
  /**
   * Blocks automatic WebSocket reconnect loops after Power click or Sleep command,
   * while NEVER blocking the user from saying "Hey MAHR" in standby when wake-word is enabled.
   */
  suppressAutoReconnect: boolean;
  /**
   * Monotonically increasing epoch ID incremented on every Sleep, Power disconnect, or new session.
   * Any async tool or HTTP callback with a stale epochId is quarantined and discarded.
   */
  sessionEpochId: number;
  turnId: number;
  /**
   * Remaining milliseconds in the 8-second (8000ms) follow-up window, or null when not in follow_up.
   */
  followUpRemainingMs: number | null;
  pendingToolIds: string[];
  activeToolName: string | null;
  activePcmSourcesCount: number;
  pendingSpeechQueueCount: number;
  pendingChatRequestsCount: number;
  turnCompleteSignalReceived: boolean;
  /**
   * Trailing command spoken in one breath with the wake phrase (e.g., "Hey MAHR open whiteboard").
   */
  queuedWakeCommand: string | null;
  micLeaseOwner: MicLeaseOwner;
  lastErrorDiagnostic: string | null;
  pendingApprovalRequest: ToolApprovalRequest | null;
  lastSleepTimestamp: number;
}

export const FOLLOW_UP_WINDOW_DURATION_MS = 8000;
export const WAKE_ECHO_COOLDOWN_MS = 2000;

export const INITIAL_ASSISTANT_SESSION_STATE: AssistantSessionState = {
  stage: "standby",
  isSessionPinned: false,
  suppressAutoReconnect: true,
  sessionEpochId: 1,
  turnId: 0,
  followUpRemainingMs: null,
  pendingToolIds: [],
  activeToolName: null,
  activePcmSourcesCount: 0,
  pendingSpeechQueueCount: 0,
  pendingChatRequestsCount: 0,
  turnCompleteSignalReceived: false,
  queuedWakeCommand: null,
  micLeaseOwner: "none",
  lastErrorDiagnostic: null,
  pendingApprovalRequest: null,
  lastSleepTimestamp: 0,
};

export type AssistantFsmEvent =
  | {
      type: "WAKE_DETECTED";
      phrase: string;
      trailingCommand?: string | null;
      now?: number;
    }
  | {
      type: "MANUAL_CONNECT_CLICK";
      pinSession?: boolean;
    }
  | {
      type: "PIN_TOGGLED";
      pinned?: boolean;
    }
  | {
      type: "MIC_LEASE_CHANGED";
      owner: MicLeaseOwner;
    }
  | {
      type: "MIC_HANDOFF_FAILED";
      diagnostic: string;
    }
  | {
      type: "WS_CONNECTED";
    }
  | {
      type: "QUEUED_COMMAND_CONSUMED";
    }
  | {
      type: "VAD_SPEECH_START";
    }
  | {
      type: "THINKING_START";
      label?: string;
    }
  | {
      type: "TOOL_CALL_START";
      toolId: string;
      toolName: string;
    }
  | {
      type: "TOOL_CALL_COMPLETED";
      toolId: string;
    }
  | {
      type: "TOOL_APPROVAL_REQUIRED";
      request: ToolApprovalRequest;
    }
  | {
      type: "TOOL_APPROVAL_RESOLVED";
      requestId: string;
      approved: boolean;
    }
  | {
      type: "CHAT_REQUEST_START";
      label?: string;
    }
  | {
      type: "CHAT_REQUEST_COMPLETE";
    }
  | {
      type: "AUDIO_PLAYBACK_UPDATED";
      activePcmSourcesCount: number;
      pendingSpeechQueueCount: number;
    }
  | {
      type: "GEMINI_TURN_COMPLETE";
    }
  | {
      type: "BARGE_IN_INTERRUPTED";
    }
  | {
      type: "FOLLOW_UP_TICK";
      deltaMs: number;
    }
  | {
      type: "FOLLOW_UP_EXPIRED";
    }
  | {
      type: "SLEEP_COMMAND";
      now?: number;
    }
  | {
      type: "POWER_BUTTON_CLICK";
      now?: number;
    }
  | {
      type: "CLEAR_DIAGNOSTIC";
    };

/**
 * Pure helper mapping the 6-stage AssistantStage to legacy 4-state LiveState
 * so existing visualizers and components stay 100% compatible.
 */
export function mapStageToLegacyLiveState(stage: AssistantStage): LiveState {
  switch (stage) {
    case "standby":
      return "disconnected";
    case "wake":
      return "connecting";
    case "listen":
    case "follow_up":
    case "think_or_tool":
      return "listening";
    case "speak":
      return "speaking";
    default:
      return "disconnected";
  }
}

/**
 * Multi-Condition Gate: Determines whether the turn has truly completed and is ready
 * to enter the 8-second `follow_up` window.
 */
export function canTransitionToFollowUp(state: AssistantSessionState): boolean {
  if (state.stage !== "speak" && state.stage !== "think_or_tool") {
    return false;
  }
  return (
    state.turnCompleteSignalReceived === true &&
    state.pendingToolIds.length === 0 &&
    state.activePcmSourcesCount === 0 &&
    state.pendingSpeechQueueCount === 0 &&
    state.pendingChatRequestsCount === 0 &&
    state.pendingApprovalRequest === null
  );
}
