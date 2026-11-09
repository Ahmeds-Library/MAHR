import { useState, useEffect, useCallback, useRef } from "react";
import {
  ModelRoutingPolicy,
  ModelRouteDecision,
  ModelHealthTelemetry,
  WORKLOAD_ROUTING_MATRIX,
  resolveModelDisplayName,
} from "../layer1_data/modelRouterTypes";
import { evaluateWorkloadAndSelectModel } from "./modelScoringEngine";
import { dbGet, dbSet } from "../../lib/db";

export interface UseAutoModelRouterOptions {
  activeModelId: string;
  onShiftModel: (modelId: string) => void;
  isVoiceActive: boolean;
  isWhiteboardOpen: boolean;
  isStudyPadOpen: boolean;
  isScreenSharing: boolean;
  isSimulationOpen: boolean;
  isClassroomOpen: boolean;
  activeContextTokens: number;
  lastUserQuery?: string;
}

export function useAutoModelRouter({
  activeModelId,
  onShiftModel,
  isVoiceActive,
  isWhiteboardOpen,
  isStudyPadOpen,
  isScreenSharing,
  isSimulationOpen,
  isClassroomOpen,
  activeContextTokens,
  lastUserQuery = "",
}: UseAutoModelRouterOptions) {
  const [policy, setPolicy] = useState<ModelRoutingPolicy>("auto_intelligent");
  const [manualOverrideModelId, setManualOverrideModelId] = useState<string | null>(null);
  const [currentDecision, setCurrentDecision] = useState<ModelRouteDecision>(() =>
    evaluateWorkloadAndSelectModel({
      isVoiceActive: true,
      policy: "auto_intelligent",
    })
  );
  const [routeHistory, setRouteHistory] = useState<ModelRouteDecision[]>([]);
  const [healthMap, setHealthMap] = useState<Record<string, ModelHealthTelemetry>>({});
  const [autoShiftCount, setAutoShiftCount] = useState<number>(1);
  const [fallbackTriggerCount, setFallbackTriggerCount] = useState<number>(0);

  const onShiftModelRef = useRef(onShiftModel);
  useEffect(() => {
    onShiftModelRef.current = onShiftModel;
  }, [onShiftModel]);

  // Load persisted router policy from IndexedDB & backend on mount
  useEffect(() => {
    (async () => {
      try {
        const savedPolicy = (await dbGet("mahr_model_routing_policy")) as ModelRoutingPolicy | null;
        const savedManual = (await dbGet("mahr_model_manual_override")) as string | null;
        if (savedPolicy) setPolicy(savedPolicy);
        if (savedManual) setManualOverrideModelId(savedManual);

        const res = await fetch("/api/model-router/status");
        if (res.ok) {
          const data = await res.json();
          if (data.currentDecision) setCurrentDecision(data.currentDecision);
          if (data.routeHistory) setRouteHistory(data.routeHistory);
          if (data.healthMap) setHealthMap(data.healthMap);
          if (typeof data.autoShiftCount === "number") setAutoShiftCount(data.autoShiftCount);
          if (typeof data.fallbackTriggerCount === "number") setFallbackTriggerCount(data.fallbackTriggerCount);
        }
      } catch {
        // Fallback to local evaluation if offline
      }
    })();
  }, []);

  // Automatically evaluate workload & shift model in background whenever workspace or query changes
  useEffect(() => {
    let isCancelled = false;

    const evaluateAndRoute = async () => {
      // 1. Instant local computation for zero-delay responsiveness
      const localDecision = evaluateWorkloadAndSelectModel({
        queryText: lastUserQuery,
        isVoiceActive,
        isWhiteboardOpen,
        isStudyPadOpen,
        isScreenSharing,
        isSimulationOpen,
        isClassroomOpen,
        activeContextTokens,
        policy,
        manualOverrideModelId,
      });

      if (!isCancelled) {
        setCurrentDecision(localDecision);
        if (localDecision.selectedModelId !== activeModelId) {
          onShiftModelRef.current(localDecision.selectedModelId);
        }
      }

      // 2. Sync with backend router & circuit breaker health
      try {
        const res = await fetch("/api/model-router/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queryText: lastUserQuery,
            isVoiceActive,
            isWhiteboardOpen,
            isStudyPadOpen,
            isScreenSharing,
            isSimulationOpen,
            isClassroomOpen,
            activeContextTokens,
            policyOverride: policy,
            manualModelId: manualOverrideModelId,
          }),
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.decision) {
            setCurrentDecision(data.decision);
            setRouteHistory((prev) => {
              if (prev[0]?.selectedModelId === data.decision.selectedModelId &&
                  prev[0]?.workloadCategory === data.decision.workloadCategory) {
                return prev;
              }
              return [data.decision, ...prev].slice(0, 12);
            });
            if (typeof data.autoShiftCount === "number") setAutoShiftCount(data.autoShiftCount);
            if (typeof data.fallbackTriggerCount === "number") setFallbackTriggerCount(data.fallbackTriggerCount);

            if (data.decision.selectedModelId !== activeModelId) {
              onShiftModelRef.current(data.decision.selectedModelId);
            }
          }
        }
      } catch {
        // Local decision already applied
      }
    };

    evaluateAndRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    isVoiceActive,
    isWhiteboardOpen,
    isStudyPadOpen,
    isScreenSharing,
    isSimulationOpen,
    isClassroomOpen,
    activeContextTokens,
    lastUserQuery,
    policy,
    manualOverrideModelId,
    activeModelId,
  ]);

  const updateRoutingPolicy = useCallback(
    async (newPolicy: ModelRoutingPolicy, overrideModelId?: string | null) => {
      setPolicy(newPolicy);
      dbSet("mahr_model_routing_policy", newPolicy);

      const nextManual =
        overrideModelId !== undefined ? overrideModelId : manualOverrideModelId;
      setManualOverrideModelId(nextManual);
      dbSet("mahr_model_manual_override", nextManual);

      if (newPolicy === "manual_override" && nextManual) {
        onShiftModelRef.current(nextManual);
      }

      try {
        const res = await fetch("/api/model-router/policy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policy: newPolicy,
            manualOverrideModelId: nextManual,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.currentDecision) {
            setCurrentDecision(data.currentDecision);
            onShiftModelRef.current(data.currentDecision.selectedModelId);
          }
        }
      } catch {}
    },
    [manualOverrideModelId]
  );

  const triggerManualModelLock = useCallback(
    (modelId: string) => {
      updateRoutingPolicy("manual_override", modelId);
    },
    [updateRoutingPolicy]
  );

  const reportModelLatencyOrQuotaSpike = useCallback(
    async (failedModelId: string, reason?: string) => {
      try {
        const res = await fetch("/api/model-router/fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ failedModelId, reason }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.decision) {
            setCurrentDecision(data.decision);
            if (data.healthMap) setHealthMap(data.healthMap);
            if (typeof data.fallbackTriggerCount === "number") {
              setFallbackTriggerCount(data.fallbackTriggerCount);
            }
            onShiftModelRef.current(data.decision.selectedModelId);
          }
        }
      } catch {}
    },
    []
  );

  return {
    policy,
    manualOverrideModelId,
    currentDecision,
    routeHistory,
    healthMap,
    autoShiftCount,
    fallbackTriggerCount,
    matrix: WORKLOAD_ROUTING_MATRIX,
    updateRoutingPolicy,
    triggerManualModelLock,
    reportModelLatencyOrQuotaSpike,
    resolveModelDisplayName,
  };
}
