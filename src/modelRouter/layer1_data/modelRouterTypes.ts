import { SUPPORTED_AI_MODELS, type AIModelConfig } from "../../lib/subagentTypes.ts";

export type WorkloadCategory =
  | "voice_realtime"
  | "quick_chat"
  | "deep_coding"
  | "math_reasoning"
  | "multimodal_vision"
  | "research_synthesis"
  | "background_memory";

export type TaskPriorityLevel =
  | "critical_realtime"
  | "high_interactive"
  | "standard"
  | "background_batch";

export type ModelRoutingPolicy =
  | "auto_intelligent"
  | "low_latency_first"
  | "deep_reasoning_first"
  | "manual_override";

export interface WorkloadRoutingRule {
  category: WorkloadCategory;
  label: string;
  description: string;
  defaultPriority: TaskPriorityLevel;
  primaryModelId: string;
  secondaryFallbackId: string;
  emergencyFallbackId: string;
  maxTargetLatencyMs: number;
  complexityWeight: number;
}

export interface ModelRouteDecision {
  selectedModelId: string;
  selectedModelName: string;
  fallbackChain: string[];
  workloadCategory: WorkloadCategory;
  priority: TaskPriorityLevel;
  policyUsed: ModelRoutingPolicy;
  complexityScore: number; // 0 - 100
  reason: string;
  isFallbackActive: boolean;
  estimatedLatencyMs: number;
  timestamp: string;
}

export interface ModelHealthTelemetry {
  modelId: string;
  status: "healthy" | "degraded" | "cooldown";
  avgLatencyMs: number;
  successRate: number;
  cooldownUntil: number | null;
  activeRequests: number;
}

export const WORKLOAD_ROUTING_MATRIX: Record<WorkloadCategory, WorkloadRoutingRule> = {
  voice_realtime: {
    category: "voice_realtime",
    label: "Real-Time Voice & Wake-Word Orb",
    description: "Ultra-low latency conversational speech and instant assistant commands.",
    defaultPriority: "critical_realtime",
    primaryModelId: "gemini-3.1-flash-lite",
    secondaryFallbackId: "gemini-2.5-flash",
    emergencyFallbackId: "gemini-3-flash-preview",
    maxTargetLatencyMs: 650,
    complexityWeight: 22,
  },
  quick_chat: {
    category: "quick_chat",
    label: "Interactive Assistant Q&A",
    description: "Fast daily task scheduling, reminders, and conversational tutoring.",
    defaultPriority: "high_interactive",
    primaryModelId: "gemini-2.5-flash",
    secondaryFallbackId: "gemini-3.1-flash-lite",
    emergencyFallbackId: "gemini-3-flash-preview",
    maxTargetLatencyMs: 950,
    complexityWeight: 38,
  },
  deep_coding: {
    category: "deep_coding",
    label: "Chalkboard Code Lab & Architecture",
    description: "Complex code debugging, algorithm synthesis, and full-stack refactoring.",
    defaultPriority: "high_interactive",
    primaryModelId: "gemini-2.5-pro",
    secondaryFallbackId: "gemini-2.5-flash",
    emergencyFallbackId: "gemini-3.1-flash-lite",
    maxTargetLatencyMs: 2400,
    complexityWeight: 88,
  },
  math_reasoning: {
    category: "math_reasoning",
    label: "Math Proofs & Scientific Simulation",
    description: "Multi-step mathematical derivations, physics simulations, and Feynman breakdowns.",
    defaultPriority: "high_interactive",
    primaryModelId: "gemini-2.5-pro",
    secondaryFallbackId: "gemini-2.5-flash",
    emergencyFallbackId: "gemini-3.1-flash-lite",
    maxTargetLatencyMs: 2600,
    complexityWeight: 92,
  },
  multimodal_vision: {
    category: "multimodal_vision",
    label: "Live Screen Vision & Diagram Analysis",
    description: "Real-time screen-share inspection, compiler error OCR, and ERD comprehension.",
    defaultPriority: "critical_realtime",
    primaryModelId: "gemini-2.5-flash",
    secondaryFallbackId: "gemini-2.5-pro",
    emergencyFallbackId: "gemini-3.1-flash-lite",
    maxTargetLatencyMs: 1200,
    complexityWeight: 74,
  },
  research_synthesis: {
    category: "research_synthesis",
    label: "Study Pack, Flashcards & Long Context",
    description: "High-token study notes synthesis, Google Classroom homework, and deep research.",
    defaultPriority: "standard",
    primaryModelId: "gemini-2.5-pro",
    secondaryFallbackId: "gemini-2.5-flash",
    emergencyFallbackId: "gemini-3.1-flash-lite",
    maxTargetLatencyMs: 2800,
    complexityWeight: 81,
  },
  background_memory: {
    category: "background_memory",
    label: "Autonomous Memory & Knowledge Graph",
    description: "Background vector indexing, fact extraction, and routine synchronization.",
    defaultPriority: "background_batch",
    primaryModelId: "gemini-3.1-flash-lite",
    secondaryFallbackId: "gemini-2.5-flash",
    emergencyFallbackId: "gemini-3-flash-preview",
    maxTargetLatencyMs: 1500,
    complexityWeight: 30,
  },
};

export function resolveModelDisplayName(modelId: string, customModels?: AIModelConfig[]): string {
  const list = customModels && customModels.length > 0 ? customModels : SUPPORTED_AI_MODELS;
  const found = list.find((m) => m.id === modelId);
  if (found) return found.name;
  if (modelId.includes("pro")) return "Gemini 2.5 Pro (Deep Reasoning)";
  if (modelId.includes("flash-lite")) return "Gemini 3.1 Flash Lite (Ultra-Fast)";
  if (modelId.includes("flash")) return "Gemini 2.5 Flash (Balanced Multimodal)";
  return modelId;
}
