import {
  AssistantFsmEvent,
  AssistantSessionState,
  canTransitionToFollowUp,
  FOLLOW_UP_WINDOW_DURATION_MS,
  WAKE_ECHO_COOLDOWN_MS,
} from "../layer1_data/assistantSessionTypes";

/**
 * Pure Layer 2 Helper:
 * Extracts a wake-word trigger and any trailing one-breath command from a spoken transcript.
 * Example: "Hey MAHR open whiteboard and explain gravity"
 * -> { matched: true, wakePhrase: "hey mahr", trailingCommand: "open whiteboard and explain gravity" }
 */
export function parseWakeWordAndTrailingCommand(
  transcript: string,
  agentFirstName: string = "MAHR"
): {
  matched: boolean;
  isSleepCommand: boolean;
  wakePhrase: string;
  trailingCommand: string | null;
} {
  const raw = String(transcript || "").trim();
  const lower = raw.toLowerCase();
  if (!lower) {
    return { matched: false, isSleepCommand: false, wakePhrase: "", trailingCommand: null };
  }

  const sleepPatterns = [
    "go to sleep mahr",
    "mahr sleep",
    "stop listening mahr",
    "goodnight mahr",
    "go to sleep myraa",
    "myraa sleep",
    "stop listening myraa",
    "goodnight myraa",
    "so jao mahr",
    "mahr so jao",
    "so jao",
    "sleep now",
  ];

  for (const sp of sleepPatterns) {
    if (lower.includes(sp)) {
      return {
        matched: false,
        isSleepCommand: true,
        wakePhrase: sp,
        trailingCommand: null,
      };
    }
  }

  const agentLower = agentFirstName.toLowerCase();
  const wakePrefixes = [
    `hey ${agentLower}`,
    `hello ${agentLower}`,
    `wake up ${agentLower}`,
    `${agentLower} wake up`,
    `listen ${agentLower}`,
    "hey mahr",
    "hello mahr",
    "wake up mahr",
    "mahr wake up",
    "listen mahr",
    "hey myraa",
    "hello myraa",
    "wake up myraa",
    "myraa wake up",
    "listen myraa",
    "uth jao mahr",
    "uth jao",
    "wake up",
  ];

  for (const prefix of wakePrefixes) {
    const idx = lower.indexOf(prefix);
    if (idx !== -1) {
      const afterIndex = idx + prefix.length;
      const rawTrailing = raw
        .slice(afterIndex)
        .replace(/^[\s,.:;!\-]+/, "")
        .trim();
      return {
        matched: true,
        isSleepCommand: false,
        wakePhrase: prefix,
        trailingCommand: rawTrailing.length >= 3 ? rawTrailing : null,
      };
    }
  }

  return { matched: false, isSleepCommand: false, wakePhrase: "", trailingCommand: null };
}

/**
 * Single Authoritative Assistant Session Reducer:
 * Owns all transitions across `standby -> wake -> listen -> think_or_tool -> speak -> follow_up`.
 */
export function assistantSessionReducer(
  state: AssistantSessionState,
  event: AssistantFsmEvent
): AssistantSessionState {
  switch (event.type) {
    case "WAKE_DETECTED": {
      const now = event.now ?? Date.now();
      // Echo cooldown guard after sleep/power so speaker decay doesn't self-wake immediately
      if (state.lastSleepTimestamp > 0 && now - state.lastSleepTimestamp < WAKE_ECHO_COOLDOWN_MS) {
        return state;
      }

      // If already awake, and a trailing command was spoken, forward it into think_or_tool
      if (state.stage !== "standby") {
        if (event.trailingCommand) {
          return {
            ...state,
            stage: "think_or_tool",
            followUpRemainingMs: null,
            turnCompleteSignalReceived: false,
            queuedWakeCommand: event.trailingCommand,
            activeToolName: "Processing Voice Command",
          };
        }
        return state;
      }

      // NOTE: suppressAutoReconnect NEVER blocks "Hey MAHR" wake word!
      return {
        ...state,
        stage: "wake",
        isSessionPinned: false,
        suppressAutoReconnect: false,
        sessionEpochId: state.sessionEpochId + 1,
        turnId: state.turnId + 1,
        followUpRemainingMs: null,
        pendingToolIds: [],
        activeToolName: event.trailingCommand ? "Queued Wake Command" : null,
        activePcmSourcesCount: 0,
        pendingSpeechQueueCount: 0,
        pendingChatRequestsCount: 0,
        turnCompleteSignalReceived: false,
        queuedWakeCommand: event.trailingCommand || null,
        micLeaseOwner: "releasing_wake",
        lastErrorDiagnostic: null,
        pendingApprovalRequest: null,
      };
    }

    case "MANUAL_CONNECT_CLICK": {
      if (state.stage !== "standby") {
        return state;
      }
      return {
        ...state,
        stage: "wake",
        isSessionPinned: event.pinSession ?? true,
        suppressAutoReconnect: false,
        sessionEpochId: state.sessionEpochId + 1,
        turnId: state.turnId + 1,
        followUpRemainingMs: null,
        pendingToolIds: [],
        activeToolName: null,
        activePcmSourcesCount: 0,
        pendingSpeechQueueCount: 0,
        pendingChatRequestsCount: 0,
        turnCompleteSignalReceived: false,
        queuedWakeCommand: null,
        micLeaseOwner: "releasing_wake",
        lastErrorDiagnostic: null,
        pendingApprovalRequest: null,
      };
    }

    case "PIN_TOGGLED": {
      const nextPinned =
        event.pinned !== undefined ? event.pinned : !state.isSessionPinned;
      return {
        ...state,
        isSessionPinned: nextPinned,
      };
    }

    case "MIC_LEASE_CHANGED": {
      return {
        ...state,
        micLeaseOwner: event.owner,
      };
    }

    case "MIC_HANDOFF_FAILED": {
      // Fail-safe: revert to standby without opening dual mic streams
      return {
        ...state,
        stage: "standby",
        isSessionPinned: false,
        suppressAutoReconnect: true,
        followUpRemainingMs: null,
        queuedWakeCommand: null,
        micLeaseOwner: "none",
        lastErrorDiagnostic: event.diagnostic,
      };
    }

    case "WS_CONNECTED": {
      if (state.stage === "standby") {
        return state;
      }
      const hasQueuedCommand = Boolean(
        state.queuedWakeCommand && state.queuedWakeCommand.trim().length > 0
      );
      return {
        ...state,
        stage: hasQueuedCommand ? "think_or_tool" : "listen",
        micLeaseOwner: "live_pcm_vad",
        lastErrorDiagnostic: null,
        activeToolName: hasQueuedCommand ? "Executing Wake Command" : state.activeToolName,
      };
    }

    case "QUEUED_COMMAND_CONSUMED": {
      return {
        ...state,
        queuedWakeCommand: null,
      };
    }

    case "VAD_SPEECH_START": {
      if (state.stage === "standby" || state.stage === "wake") {
        return state;
      }
      // Speaking during follow_up or listen immediately cancels the 8s countdown and starts/continues listening
      if (state.stage === "follow_up" || state.stage === "listen") {
        return {
          ...state,
          stage: "listen",
          turnId: state.stage === "follow_up" ? state.turnId + 1 : state.turnId,
          followUpRemainingMs: null,
          turnCompleteSignalReceived: false,
          activeToolName: null,
        };
      }
      return state;
    }

    case "BARGE_IN_INTERRUPTED": {
      if (state.stage === "standby") {
        return state;
      }
      return {
        ...state,
        stage: "listen",
        turnId: state.turnId + 1,
        followUpRemainingMs: null,
        activePcmSourcesCount: 0,
        pendingSpeechQueueCount: 0,
        turnCompleteSignalReceived: false,
        activeToolName: null,
      };
    }

    case "THINKING_START": {
      if (state.stage === "standby") {
        return state;
      }
      return {
        ...state,
        stage: state.stage === "speak" ? "speak" : "think_or_tool",
        followUpRemainingMs: null,
        turnCompleteSignalReceived: false,
        activeToolName: event.label || "Thinking...",
      };
    }

    case "TOOL_CALL_START": {
      if (state.stage === "standby") {
        return state;
      }
      const nextToolIds = state.pendingToolIds.includes(event.toolId)
        ? state.pendingToolIds
        : [...state.pendingToolIds, event.toolId];
      return {
        ...state,
        stage: state.stage === "speak" ? "speak" : "think_or_tool",
        pendingToolIds: nextToolIds,
        activeToolName: event.toolName,
        followUpRemainingMs: null,
        turnCompleteSignalReceived: false,
      };
    }

    case "TOOL_CALL_COMPLETED": {
      if (state.stage === "standby") {
        return state;
      }
      const nextToolIds = state.pendingToolIds.filter((id) => id !== event.toolId);
      const candidate: AssistantSessionState = {
        ...state,
        pendingToolIds: nextToolIds,
        activeToolName: nextToolIds.length === 0 ? null : state.activeToolName,
      };

      if (canTransitionToFollowUp(candidate)) {
        return {
          ...candidate,
          stage: "follow_up",
          followUpRemainingMs: FOLLOW_UP_WINDOW_DURATION_MS,
        };
      }
      return candidate;
    }

    case "TOOL_APPROVAL_REQUIRED": {
      if (state.stage === "standby") {
        return state;
      }
      return {
        ...state,
        stage: "think_or_tool",
        pendingApprovalRequest: event.request,
        activeToolName: `Approval Needed: ${event.request.toolName}`,
        followUpRemainingMs: null,
      };
    }

    case "TOOL_APPROVAL_RESOLVED": {
      if (
        !state.pendingApprovalRequest ||
        state.pendingApprovalRequest.id !== event.requestId
      ) {
        return state;
      }
      const candidate: AssistantSessionState = {
        ...state,
        pendingApprovalRequest: null,
        activeToolName: event.approved ? state.activeToolName : null,
      };
      if (canTransitionToFollowUp(candidate)) {
        return {
          ...candidate,
          stage: "follow_up",
          followUpRemainingMs: FOLLOW_UP_WINDOW_DURATION_MS,
        };
      }
      return candidate;
    }

    case "CHAT_REQUEST_START": {
      // Submitting a chat request cancels any follow-up timer and enters think_or_tool
      const nextStage =
        state.stage === "standby"
          ? "think_or_tool"
          : state.stage === "speak"
          ? "speak"
          : "think_or_tool";
      return {
        ...state,
        stage: nextStage,
        turnId: state.turnId + 1,
        pendingChatRequestsCount: state.pendingChatRequestsCount + 1,
        followUpRemainingMs: null,
        turnCompleteSignalReceived: false,
        activeToolName: event.label || "Ask MAHR Reasoning",
      };
    }

    case "CHAT_REQUEST_COMPLETE": {
      const nextCount = Math.max(0, state.pendingChatRequestsCount - 1);
      const candidate: AssistantSessionState = {
        ...state,
        pendingChatRequestsCount: nextCount,
        turnCompleteSignalReceived:
          nextCount === 0 ? true : state.turnCompleteSignalReceived,
        activeToolName:
          nextCount === 0 && state.pendingToolIds.length === 0
            ? null
            : state.activeToolName,
      };

      if (canTransitionToFollowUp(candidate)) {
        return {
          ...candidate,
          stage: "follow_up",
          followUpRemainingMs: FOLLOW_UP_WINDOW_DURATION_MS,
        };
      }
      return candidate;
    }

    case "AUDIO_PLAYBACK_UPDATED": {
      if (state.stage === "standby") {
        return state;
      }
      const isPlaying =
        event.activePcmSourcesCount > 0 || event.pendingSpeechQueueCount > 0;
      const candidate: AssistantSessionState = {
        ...state,
        stage: isPlaying ? "speak" : state.stage,
        activePcmSourcesCount: event.activePcmSourcesCount,
        pendingSpeechQueueCount: event.pendingSpeechQueueCount,
        followUpRemainingMs: isPlaying ? null : state.followUpRemainingMs,
      };

      if (!isPlaying && canTransitionToFollowUp(candidate)) {
        return {
          ...candidate,
          stage: "follow_up",
          followUpRemainingMs: FOLLOW_UP_WINDOW_DURATION_MS,
          activeToolName: null,
        };
      }
      return candidate;
    }

    case "GEMINI_TURN_COMPLETE": {
      if (state.stage === "standby") {
        return state;
      }
      const candidate: AssistantSessionState = {
        ...state,
        turnCompleteSignalReceived: true,
      };
      if (canTransitionToFollowUp(candidate)) {
        return {
          ...candidate,
          stage: "follow_up",
          followUpRemainingMs: FOLLOW_UP_WINDOW_DURATION_MS,
          activeToolName: null,
        };
      }
      return candidate;
    }

    case "FOLLOW_UP_TICK": {
      if (state.stage !== "follow_up" || state.followUpRemainingMs === null) {
        return state;
      }
      const nextRemaining = Math.max(0, state.followUpRemainingMs - event.deltaMs);
      return {
        ...state,
        followUpRemainingMs: nextRemaining,
      };
    }

    case "FOLLOW_UP_EXPIRED": {
      if (state.stage !== "follow_up") {
        return state;
      }
      // If manually pinned, stay connected and return to continuous `listen`
      if (state.isSessionPinned) {
        return {
          ...state,
          stage: "listen",
          followUpRemainingMs: null,
          turnCompleteSignalReceived: false,
          activeToolName: null,
        };
      }
      // If wake-triggered (unpinned), return to `standby` after 8s silence
      return {
        ...state,
        stage: "standby",
        isSessionPinned: false,
        suppressAutoReconnect: true,
        followUpRemainingMs: null,
        pendingToolIds: [],
        activeToolName: null,
        activePcmSourcesCount: 0,
        pendingSpeechQueueCount: 0,
        pendingChatRequestsCount: 0,
        turnCompleteSignalReceived: false,
        queuedWakeCommand: null,
        micLeaseOwner: "none",
      };
    }

    case "SLEEP_COMMAND":
    case "POWER_BUTTON_CLICK": {
      const now = event.now ?? Date.now();
      // Hard override from ANY stage:
      // - Resets isSessionPinned = false
      // - Sets suppressAutoReconnect = true (blocks WS auto-reconnect, does NOT block "Hey MAHR" wake word)
      // - Increments sessionEpochId to quarantine any in-flight tool or HTTP request
      return {
        ...state,
        stage: "standby",
        isSessionPinned: false,
        suppressAutoReconnect: true,
        sessionEpochId: state.sessionEpochId + 1,
        followUpRemainingMs: null,
        pendingToolIds: [],
        activeToolName: null,
        activePcmSourcesCount: 0,
        pendingSpeechQueueCount: 0,
        pendingChatRequestsCount: 0,
        turnCompleteSignalReceived: false,
        queuedWakeCommand: null,
        micLeaseOwner: "none",
        pendingApprovalRequest: null,
        lastSleepTimestamp: now,
      };
    }

    case "CLEAR_DIAGNOSTIC": {
      return {
        ...state,
        lastErrorDiagnostic: null,
      };
    }

    default:
      return state;
  }
}
