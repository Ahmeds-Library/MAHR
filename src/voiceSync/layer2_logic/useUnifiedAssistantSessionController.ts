import { useReducer, useEffect, useRef, useCallback } from "react";
import {
  AssistantFsmEvent,
  AssistantSessionState,
  INITIAL_ASSISTANT_SESSION_STATE,
  mapStageToLegacyLiveState,
  ToolApprovalRequest,
} from "../layer1_data/assistantSessionTypes";
import { evaluateToolSafety } from "../layer1_data/toolSafetyPolicyTypes";
import { assistantSessionReducer } from "./assistantSessionReducer";
import { MicLeaseCoordinator } from "./micLeaseCoordinator";
import { globalSessionEpochManager } from "./sessionEpochAbortManager";
import type { LiveState } from "../../lib/audio";

interface UseUnifiedAssistantSessionControllerOptions {
  onStageLegacySync?: (legacyState: LiveState) => void;
  onFollowUpExpiredDisconnect?: () => void;
}

export function useUnifiedAssistantSessionController({
  onStageLegacySync,
  onFollowUpExpiredDisconnect,
}: UseUnifiedAssistantSessionControllerOptions = {}) {
  const [fsmState, dispatch] = useReducer(
    assistantSessionReducer,
    INITIAL_ASSISTANT_SESSION_STATE
  );

  const fsmStateRef = useRef<AssistantSessionState>(fsmState);
  fsmStateRef.current = fsmState;

  const micLeaseCoordinatorRef = useRef<MicLeaseCoordinator>(
    new MicLeaseCoordinator((owner) => {
      dispatch({ type: "MIC_LEASE_CHANGED", owner });
    })
  );

  const approvalCallbacksRef = useRef<
    Map<string, (approved: boolean) => void>
  >(new Map());

  // Synchronize Epoch & AbortController Manager on every state update
  useEffect(() => {
    globalSessionEpochManager.syncState(fsmState.sessionEpochId, fsmState.stage);
  }, [fsmState.sessionEpochId, fsmState.stage]);

  // Synchronize legacy 4-state LiveState (`disconnected | connecting | listening | speaking`)
  useEffect(() => {
    const legacy = mapStageToLegacyLiveState(fsmState.stage);
    onStageLegacySync?.(legacy);
  }, [fsmState.stage, onStageLegacySync]);

  // 8-Second Follow-Up Window Countdown Timer (Ticks every 100ms ONLY while stage === "follow_up")
  useEffect(() => {
    if (fsmState.stage !== "follow_up") {
      return;
    }

    const intervalId = setInterval(() => {
      const current = fsmStateRef.current;
      if (current.stage !== "follow_up" || current.followUpRemainingMs === null) {
        return;
      }

      if (current.followUpRemainingMs <= 100) {
        const wasPinned = current.isSessionPinned;
        dispatch({ type: "FOLLOW_UP_EXPIRED" });
        if (!wasPinned) {
          onFollowUpExpiredDisconnect?.();
        }
      } else {
        dispatch({ type: "FOLLOW_UP_TICK", deltaMs: 100 });
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [fsmState.stage, onFollowUpExpiredDisconnect]);

  // 15-Second Auto-Deny Countdown for Tier-2 Pending Tool Approval
  useEffect(() => {
    const req = fsmState.pendingApprovalRequest;
    if (!req) return;

    const remainingMs = Math.max(100, req.expiresAt - Date.now());
    const timerId = setTimeout(() => {
      const cb = approvalCallbacksRef.current.get(req.id);
      if (cb) {
        approvalCallbacksRef.current.delete(req.id);
        cb(false);
      }
      dispatch({
        type: "TOOL_APPROVAL_RESOLVED",
        requestId: req.id,
        approved: false,
      });
    }, remainingMs);

    return () => clearTimeout(timerId);
  }, [fsmState.pendingApprovalRequest]);

  const dispatchEvent = useCallback((event: AssistantFsmEvent) => {
    dispatch(event);
  }, []);

  const togglePinSession = useCallback(() => {
    const nextPinned = !fsmStateRef.current.isSessionPinned;
    try {
      localStorage.setItem("mahr_pin_preference", nextPinned ? "true" : "false");
    } catch {}
    dispatch({ type: "PIN_TOGGLED", pinned: nextPinned });
  }, []);

  /**
   * Evaluates a tool against the Default-Deny Tool Safety Gate and executes it
   * inside the active sessionEpochId quarantine wrapper.
   */
  const executeGuardedTool = useCallback(
    (
      toolName: string,
      args: Record<string, any>,
      runToolFn: (
        epochGuard: <T>(fn: () => T) => T | undefined,
        abortSignal: AbortSignal
      ) => void,
      onRejected?: (reason: string) => void
    ) => {
      const safety = evaluateToolSafety(toolName, args);
      const capturedEpoch = fsmStateRef.current.sessionEpochId;
      const toolId = `tool_${toolName}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;

      if (safety.tier === "tier3_hard_deny") {
        console.warn(`[ToolSafetyGate] Denied tool "${toolName}":`, safety.reason);
        onRejected?.(safety.reason);
        return;
      }

      const epochGuard = <T,>(fn: () => T): T | undefined => {
        return globalSessionEpochManager.runIfEpochActive(capturedEpoch, fn);
      };

      const wrapCompletion = () => {
        dispatch({
          type: "TOOL_CALL_START",
          toolId,
          toolName: safety.displayLabel,
        });
        const signal = globalSessionEpochManager.getTurnAbortSignal();
        runToolFn(
          <T,>(fn: () => T) => {
            return epochGuard(() => {
              const res = fn();
              dispatch({ type: "TOOL_CALL_COMPLETED", toolId });
              return res;
            });
          },
          signal
        );
      };

      if (safety.requiresApproval) {
        const reqId = `approval_${Date.now()}`;
        const request: ToolApprovalRequest = {
          id: reqId,
          toolName: safety.displayLabel,
          args,
          reason: safety.reason,
          createdAt: Date.now(),
          expiresAt: Date.now() + 15000,
          epochId: capturedEpoch,
        };

        approvalCallbacksRef.current.set(reqId, (approved: boolean) => {
          if (!approved) {
            onRejected?.(`User declined permission for "${safety.displayLabel}".`);
            return;
          }
          epochGuard(() => {
            wrapCompletion();
          });
        });

        dispatch({ type: "TOOL_APPROVAL_REQUIRED", request });
        return;
      }

      wrapCompletion();
    },
    []
  );

  const resolvePendingToolApproval = useCallback((approved: boolean) => {
    const req = fsmStateRef.current.pendingApprovalRequest;
    if (!req) return;
    const cb = approvalCallbacksRef.current.get(req.id);
    if (cb) {
      approvalCallbacksRef.current.delete(req.id);
      cb(approved);
    }
    dispatch({
      type: "TOOL_APPROVAL_RESOLVED",
      requestId: req.id,
      approved,
    });
  }, []);

  return {
    fsmState,
    fsmStateRef,
    micLeaseCoordinator: micLeaseCoordinatorRef.current,
    dispatchEvent,
    togglePinSession,
    executeGuardedTool,
    resolvePendingToolApproval,
  };
}
