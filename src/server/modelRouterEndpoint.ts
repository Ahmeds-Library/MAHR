import express from "express";
import {
  type WorkloadCategory,
  type TaskPriorityLevel,
  type ModelRoutingPolicy,
  WORKLOAD_ROUTING_MATRIX,
  type ModelRouteDecision,
  type ModelHealthTelemetry,
  resolveModelDisplayName,
} from "../modelRouter/layer1_data/modelRouterTypes.ts";
import { evaluateWorkloadAndSelectModel } from "../modelRouter/layer2_logic/modelScoringEngine.ts";

export const modelRouterEndpoint = express.Router();

// Backend singleton state for auto-routing policy, telemetry, and circuit breaker
interface BackendModelRouterState {
  policy: ModelRoutingPolicy;
  manualOverrideModelId: string | null;
  currentDecision: ModelRouteDecision;
  routeHistory: ModelRouteDecision[];
  healthMap: Record<string, ModelHealthTelemetry>;
  autoShiftCount: number;
  fallbackTriggerCount: number;
}

const initialHealthMap: Record<string, ModelHealthTelemetry> = {
  "gemini-3.1-flash-lite": {
    modelId: "gemini-3.1-flash-lite",
    status: "healthy",
    avgLatencyMs: 390,
    successRate: 99.8,
    cooldownUntil: null,
    activeRequests: 0,
  },
  "gemini-2.5-flash": {
    modelId: "gemini-2.5-flash",
    status: "healthy",
    avgLatencyMs: 680,
    successRate: 99.6,
    cooldownUntil: null,
    activeRequests: 0,
  },
  "gemini-2.5-pro": {
    modelId: "gemini-2.5-pro",
    status: "healthy",
    avgLatencyMs: 1450,
    successRate: 99.4,
    cooldownUntil: null,
    activeRequests: 0,
  },
  "gemini-3-flash-preview": {
    modelId: "gemini-3-flash-preview",
    status: "healthy",
    avgLatencyMs: 520,
    successRate: 99.7,
    cooldownUntil: null,
    activeRequests: 0,
  },
};

const routerState: BackendModelRouterState = {
  policy: "auto_intelligent",
  manualOverrideModelId: null,
  currentDecision: {
    selectedModelId: "gemini-3.1-flash-lite",
    selectedModelName: resolveModelDisplayName("gemini-3.1-flash-lite"),
    fallbackChain: ["gemini-2.5-flash", "gemini-3-flash-preview"],
    workloadCategory: "voice_realtime",
    priority: "critical_realtime",
    policyUsed: "auto_intelligent",
    complexityScore: 22,
    reason: "Initialized in Ultra-Low Latency Voice Orb mode for instant wake-word response.",
    isFallbackActive: false,
    estimatedLatencyMs: 390,
    timestamp: new Date().toISOString(),
  },
  routeHistory: [],
  healthMap: initialHealthMap,
  autoShiftCount: 1,
  fallbackTriggerCount: 0,
};

function getOverloadedModelIds(): string[] {
  const now = Date.now();
  const overloaded: string[] = [];
  for (const [modelId, telemetry] of Object.entries(routerState.healthMap)) {
    if (telemetry.cooldownUntil && telemetry.cooldownUntil > now) {
      overloaded.push(modelId);
    } else if (telemetry.cooldownUntil && telemetry.cooldownUntil <= now) {
      telemetry.cooldownUntil = null;
      telemetry.status = "healthy";
    }
  }
  return overloaded;
}

// GET /api/model-router/status - Full backend router telemetry & current decision
modelRouterEndpoint.get("/model-router/status", (_req, res) => {
  getOverloadedModelIds(); // Refresh expired cooldowns
  res.json({
    ok: true,
    policy: routerState.policy,
    manualOverrideModelId: routerState.manualOverrideModelId,
    currentDecision: routerState.currentDecision,
    routeHistory: routerState.routeHistory.slice(0, 12),
    healthMap: routerState.healthMap,
    autoShiftCount: routerState.autoShiftCount,
    fallbackTriggerCount: routerState.fallbackTriggerCount,
    matrix: WORKLOAD_ROUTING_MATRIX,
  });
});

// POST /api/model-router/evaluate - Evaluate workload, priority & health to auto-shift model
modelRouterEndpoint.post("/model-router/evaluate", (req, res) => {
  try {
    const {
      queryText = "",
      isVoiceActive = false,
      isWhiteboardOpen = false,
      isStudyPadOpen = false,
      isScreenSharing = false,
      isSimulationOpen = false,
      isClassroomOpen = false,
      isCodingMode = false,
      activeContextTokens = 1450,
      policyOverride,
      manualModelId,
    } = req.body || {};

    if (policyOverride) {
      routerState.policy = policyOverride as ModelRoutingPolicy;
    }
    if (manualModelId !== undefined) {
      routerState.manualOverrideModelId = manualModelId;
    }

    const overloadedModels = getOverloadedModelIds();

    const decision = evaluateWorkloadAndSelectModel({
      queryText,
      isVoiceActive,
      isWhiteboardOpen,
      isStudyPadOpen,
      isScreenSharing,
      isSimulationOpen,
      isClassroomOpen,
      isCodingMode,
      activeContextTokens,
      policy: routerState.policy,
      manualOverrideModelId: routerState.manualOverrideModelId,
      overloadedModels,
    });

    const prevModelId = routerState.currentDecision.selectedModelId;
    const prevCategory = routerState.currentDecision.workloadCategory;

    if (prevModelId !== decision.selectedModelId || prevCategory !== decision.workloadCategory) {
      routerState.autoShiftCount += 1;
      routerState.routeHistory = [decision, ...routerState.routeHistory].slice(0, 15);
    }
    if (decision.isFallbackActive) {
      routerState.fallbackTriggerCount += 1;
    }

    routerState.currentDecision = decision;

    res.json({
      ok: true,
      shifted: prevModelId !== decision.selectedModelId,
      decision,
      autoShiftCount: routerState.autoShiftCount,
      fallbackTriggerCount: routerState.fallbackTriggerCount,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || "Failed to evaluate model route",
    });
  }
});

// POST /api/model-router/policy - Update backend routing policy or manual override
modelRouterEndpoint.post("/model-router/policy", (req, res) => {
  const { policy, manualOverrideModelId } = req.body || {};
  if (policy) {
    routerState.policy = policy as ModelRoutingPolicy;
  }
  if (manualOverrideModelId !== undefined) {
    routerState.manualOverrideModelId = manualOverrideModelId;
  }

  const overloadedModels = getOverloadedModelIds();
  const updatedDecision = evaluateWorkloadAndSelectModel({
    queryText: "",
    isVoiceActive: true,
    policy: routerState.policy,
    manualOverrideModelId: routerState.manualOverrideModelId,
    overloadedModels,
  });

  routerState.currentDecision = updatedDecision;
  routerState.routeHistory = [updatedDecision, ...routerState.routeHistory].slice(0, 15);

  res.json({
    ok: true,
    policy: routerState.policy,
    manualOverrideModelId: routerState.manualOverrideModelId,
    currentDecision: routerState.currentDecision,
  });
});

// POST /api/model-router/fallback - Report latency spike or rate limit (429/503) and auto-shift to fallback
modelRouterEndpoint.post("/model-router/fallback", (req, res) => {
  const { failedModelId, reason = "High latency / rate limit detected", cooldownMs = 45000 } = req.body || {};

  if (failedModelId) {
    const existing = routerState.healthMap[failedModelId] || {
      modelId: failedModelId,
      status: "degraded",
      avgLatencyMs: 2500,
      successRate: 92.0,
      cooldownUntil: null,
      activeRequests: 0,
    };
    existing.status = "cooldown";
    existing.cooldownUntil = Date.now() + Number(cooldownMs);
    routerState.healthMap[failedModelId] = existing;
  }

  const overloadedModels = getOverloadedModelIds();
  const nextDecision = evaluateWorkloadAndSelectModel({
    queryText: "",
    isVoiceActive: routerState.currentDecision.workloadCategory === "voice_realtime",
    isWhiteboardOpen: routerState.currentDecision.workloadCategory === "deep_coding",
    isStudyPadOpen: routerState.currentDecision.workloadCategory === "research_synthesis",
    isScreenSharing: routerState.currentDecision.workloadCategory === "multimodal_vision",
    policy: routerState.policy === "manual_override" ? "auto_intelligent" : routerState.policy,
    manualOverrideModelId: null,
    overloadedModels,
  });

  nextDecision.isFallbackActive = true;
  nextDecision.reason = `Auto-Fallback triggered (${reason}): shifted from ${failedModelId || "primary"} to ${nextDecision.selectedModelName}.`;

  routerState.currentDecision = nextDecision;
  routerState.fallbackTriggerCount += 1;
  routerState.autoShiftCount += 1;
  routerState.routeHistory = [nextDecision, ...routerState.routeHistory].slice(0, 15);

  res.json({
    ok: true,
    decision: nextDecision,
    healthMap: routerState.healthMap,
    fallbackTriggerCount: routerState.fallbackTriggerCount,
  });
});
