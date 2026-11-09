import {
  type WorkloadCategory,
  type TaskPriorityLevel,
  type ModelRoutingPolicy,
  WORKLOAD_ROUTING_MATRIX,
  type ModelRouteDecision,
  resolveModelDisplayName,
} from "../layer1_data/modelRouterTypes.ts";

export interface WorkloadEvaluationInput {
  queryText?: string;
  isVoiceActive?: boolean;
  isWhiteboardOpen?: boolean;
  isStudyPadOpen?: boolean;
  isScreenSharing?: boolean;
  isSimulationOpen?: boolean;
  isClassroomOpen?: boolean;
  isCodingMode?: boolean;
  activeContextTokens?: number;
  policy?: ModelRoutingPolicy;
  manualOverrideModelId?: string | null;
  overloadedModels?: string[];
}

const CODING_KEYWORDS = [
  "code",
  "function",
  "typescript",
  "javascript",
  "python",
  "react",
  "algorithm",
  "bug",
  "compile",
  "refactor",
  "class",
  "sql",
  "database",
  "api",
  "architecture",
  "regex",
  "terminal",
];

const MATH_REASONING_KEYWORDS = [
  "prove",
  "theorem",
  "equation",
  "calculus",
  "derivative",
  "integral",
  "matrix",
  "physics",
  "quantum",
  "formula",
  "solve",
  "feynman",
  "derive",
  "simulation",
  "probability",
];

const RESEARCH_KEYWORDS = [
  "summarize",
  "flashcard",
  "study pack",
  "quiz",
  "essay",
  "research",
  "compare",
  "literature",
  "assignment",
  "classroom",
  "comprehensive",
  "notes",
];

export function evaluateWorkloadAndSelectModel(
  input: WorkloadEvaluationInput
): ModelRouteDecision {
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
    policy = "auto_intelligent",
    manualOverrideModelId = null,
    overloadedModels = [],
  } = input;

  const lower = queryText.toLowerCase();

  // 1. Classify Workload Category & Priority
  let category: WorkloadCategory = "voice_realtime";
  let priority: TaskPriorityLevel = "critical_realtime";
  let complexityScore = 24;
  let reason = "Low-latency real-time voice interaction prioritized.";

  const hasCodingIntent =
    isCodingMode || CODING_KEYWORDS.some((kw) => lower.includes(kw));
  const hasMathIntent =
    isSimulationOpen || MATH_REASONING_KEYWORDS.some((kw) => lower.includes(kw));
  const hasResearchIntent =
    isStudyPadOpen ||
    isClassroomOpen ||
    RESEARCH_KEYWORDS.some((kw) => lower.includes(kw));

  if (isScreenSharing) {
    category = "multimodal_vision";
    priority = "critical_realtime";
    complexityScore = 76;
    reason =
      "Live multimodal screen vision active: routed to high-speed vision & OCR engine.";
  } else if (hasMathIntent) {
    category = "math_reasoning";
    priority = "high_interactive";
    complexityScore = 92;
    reason =
      "High-complexity mathematical reasoning or simulation detected: shifted to Deep Reasoning Pro engine.";
  } else if (hasCodingIntent || isWhiteboardOpen) {
    category = "deep_coding";
    priority = "high_interactive";
    complexityScore = 88;
    reason =
      "Interactive Chalkboard / Code Lab workload active: shifted to Pro coding & architecture model.";
  } else if (hasResearchIntent || activeContextTokens > 35000) {
    category = "research_synthesis";
    priority = "standard";
    complexityScore = 81;
    reason =
      activeContextTokens > 35000
        ? `High context volume (${activeContextTokens.toLocaleString()} tokens): routed to long-context synthesis engine.`
        : "Study Pad / Classroom synthesis workload active: routed to deep academic synthesis engine.";
  } else if (queryText.trim().length > 140) {
    category = "quick_chat";
    priority = "high_interactive";
    complexityScore = 52;
    reason =
      "Multi-sentence interactive query: balanced between speed and depth.";
  } else if (isVoiceActive) {
    category = "voice_realtime";
    priority = "critical_realtime";
    complexityScore = 22;
    reason =
      "Active voice conversation: prioritized sub-second response latency.";
  } else {
    category = "quick_chat";
    priority = "high_interactive";
    complexityScore = 35;
    reason = "Standard assistant standby & quick command routing.";
  }

  const rule = WORKLOAD_ROUTING_MATRIX[category];

  // 2. Apply Policy Overrides
  let candidateChain: string[] = [
    rule.primaryModelId,
    rule.secondaryFallbackId,
    rule.emergencyFallbackId,
  ];

  if (policy === "manual_override" && manualOverrideModelId) {
    candidateChain = [
      manualOverrideModelId,
      rule.primaryModelId,
      rule.secondaryFallbackId,
    ];
    reason = `Manual override locked to ${resolveModelDisplayName(manualOverrideModelId)} via Settings.`;
  } else if (policy === "low_latency_first") {
    candidateChain = [
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-3-flash-preview",
    ];
    reason = `Low-Latency Priority policy active (${rule.label}).`;
  } else if (policy === "deep_reasoning_first") {
    candidateChain = [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
    ];
    reason = `Deep-Reasoning Priority policy active (${rule.label}).`;
  }

  // Deduplicate candidate chain
  const uniqueChain = Array.from(new Set(candidateChain));

  // 3. Circuit Breaker / Quota & Latency Fallback Resolution
  const overloadedSet = new Set(overloadedModels);
  let selectedModelId = uniqueChain[0];
  let isFallbackActive = false;

  for (const candidate of uniqueChain) {
    if (!overloadedSet.has(candidate)) {
      selectedModelId = candidate;
      break;
    }
    isFallbackActive = true;
  }

  if (isFallbackActive) {
    reason = `Primary model in cooldown/high-load; auto-shifted to fallback ${resolveModelDisplayName(selectedModelId)}.`;
  }

  const estimatedLatencyMs = selectedModelId.includes("flash-lite")
    ? 390
    : selectedModelId.includes("pro")
      ? 1420
      : 680;

  return {
    selectedModelId,
    selectedModelName: resolveModelDisplayName(selectedModelId),
    fallbackChain: uniqueChain.filter((id) => id !== selectedModelId),
    workloadCategory: category,
    priority,
    policyUsed: policy,
    complexityScore,
    reason,
    isFallbackActive,
    estimatedLatencyMs,
    timestamp: new Date().toISOString(),
  };
}
