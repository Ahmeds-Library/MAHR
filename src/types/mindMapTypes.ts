export type MindMapColor = "purple" | "cyan" | "emerald" | "amber" | "rose" | "indigo" | "blue" | "teal";

export interface InteractiveMindMapNode {
  id: string;
  title: string;
  description?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: MindMapColor;
  parentId?: string | null;
  depth: number;
  isRoot?: boolean;
  isExpanded?: boolean;
  isExpanding?: boolean;
  isCollapsed?: boolean;
  vectorSimilarity?: number; // 0.0 - 1.0 match score from vector memory engine
  clusterName?: string;
  sourceMemoryId?: string;
  details?: string[];
  tags?: string[];
  notes?: string;
  status?: "idle" | "expanding" | "expanded";
  expansionCount?: number;
}

export interface InteractiveMindMapEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  similarity?: number;
  animated?: boolean;
  color?: string;
}

export type MindMapLayoutMode = "radial" | "tree-horizontal" | "tree-vertical" | "organic";

export interface RecalledMemorySummary {
  id: string;
  label: string;
  description: string;
  cluster: string;
  similarity: number;
}

export interface VectorExpansionResult {
  parentTopic: string;
  newNodes: InteractiveMindMapNode[];
  newEdges: InteractiveMindMapEdge[];
  recalledCount: number;
  avgSimilarity: number;
  recalledMemories: RecalledMemorySummary[];
  aiSynthesizedNote?: string;
}

export interface MindMapPreset {
  id: string;
  name: string;
  category: string;
  rootTopic: string;
  description: string;
  nodes: InteractiveMindMapNode[];
  edges: InteractiveMindMapEdge[];
}

export const MINDMAP_COLOR_PALETTES: Record<MindMapColor, {
  border: string;
  bg: string;
  glow: string;
  text: string;
  badge: string;
  edgeGradient: string;
  hex: string;
}> = {
  purple: {
    border: "border-purple-500/50",
    bg: "bg-purple-950/40",
    glow: "rgba(168, 85, 247, 0.35)",
    text: "text-purple-300",
    badge: "bg-purple-500/20 text-purple-200 border-purple-500/30",
    edgeGradient: "#a855f7",
    hex: "#a855f7",
  },
  cyan: {
    border: "border-cyan-500/50",
    bg: "bg-cyan-950/40",
    glow: "rgba(6, 182, 212, 0.35)",
    text: "text-cyan-300",
    badge: "bg-cyan-500/20 text-cyan-200 border-cyan-500/30",
    edgeGradient: "#06b6d4",
    hex: "#06b6d4",
  },
  emerald: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-950/40",
    glow: "rgba(16, 185, 129, 0.35)",
    text: "text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    edgeGradient: "#10b981",
    hex: "#10b981",
  },
  amber: {
    border: "border-amber-500/50",
    bg: "bg-amber-950/40",
    glow: "rgba(245, 158, 11, 0.35)",
    text: "text-amber-300",
    badge: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    edgeGradient: "#f59e0b",
    hex: "#f59e0b",
  },
  rose: {
    border: "border-rose-500/50",
    bg: "bg-rose-950/40",
    glow: "rgba(244, 63, 94, 0.35)",
    text: "text-rose-300",
    badge: "bg-rose-500/20 text-rose-200 border-rose-500/30",
    edgeGradient: "#f43f5e",
    hex: "#f43f5e",
  },
  indigo: {
    border: "border-indigo-500/50",
    bg: "bg-indigo-950/40",
    glow: "rgba(99, 102, 241, 0.35)",
    text: "text-indigo-300",
    badge: "bg-indigo-500/20 text-indigo-200 border-indigo-500/30",
    edgeGradient: "#6366f1",
    hex: "#6366f1",
  },
  blue: {
    border: "border-blue-500/50",
    bg: "bg-blue-950/40",
    glow: "rgba(59, 130, 246, 0.35)",
    text: "text-blue-300",
    badge: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    edgeGradient: "#3b82f6",
    hex: "#3b82f6",
  },
  teal: {
    border: "border-teal-500/50",
    bg: "bg-teal-950/40",
    glow: "rgba(20, 184, 166, 0.35)",
    text: "text-teal-300",
    badge: "bg-teal-500/20 text-teal-200 border-teal-500/30",
    edgeGradient: "#14b8a6",
    hex: "#14b8a6",
  },
};
