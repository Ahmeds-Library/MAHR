import { InteractiveMindMapNode, InteractiveMindMapEdge, MindMapLayoutMode } from "../../types/mindMapTypes";

export type HierarchyVisualType = "circular" | "tree-structured" | "grid";

export interface TopicDensityMetrics {
  nodeCount: number;
  edgeCount: number;
  maxDepth: number;
  avgBranchingFactor: number;
  clusterCount: number;
  leafRatio: number;
  densityScore: number; // 0 to 1
  isCyclic: boolean;
  classifiedDensity: "radial-dense" | "dendritic-hierarchical" | "multi-cluster-matrix";
}

export interface NodeTargetCoordinate {
  id: string;
  x: number;
  y: number;
  depth?: number;
  clusterName?: string;
}

export interface SmartLayoutPlan {
  visualType: HierarchyVisualType;
  layoutMode: MindMapLayoutMode;
  reason: string;
  metrics: TopicDensityMetrics;
  targetCoordinates: Map<string, NodeTargetCoordinate>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}
