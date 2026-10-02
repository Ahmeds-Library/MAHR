import { InteractiveMindMapNode, InteractiveMindMapEdge } from "../../types/mindMapTypes";
import { TopicDensityMetrics, HierarchyVisualType } from "./smartLayoutTypes";

/**
 * Analyzes the structural graph density of mind map nodes and edges
 * to classify the optimal visual hierarchy.
 */
export function analyzeTopicDensity(
  nodes: InteractiveMindMapNode[],
  edges: InteractiveMindMapEdge[]
): TopicDensityMetrics {
  const nodeCount = nodes.length;
  if (nodeCount <= 1) {
    return {
      nodeCount,
      edgeCount: edges.length,
      maxDepth: 0,
      avgBranchingFactor: 0,
      clusterCount: 1,
      leafRatio: 1,
      densityScore: 0,
      isCyclic: false,
      classifiedDensity: "radial-dense",
    };
  }

  // Build adjacency maps
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  const inDegree = new Map<string, number>();

  nodes.forEach((n) => {
    childrenMap.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach((edge) => {
    const list = childrenMap.get(edge.from) || [];
    list.push(edge.to);
    childrenMap.set(edge.from, list);
    parentMap.set(edge.to, edge.from);
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  });

  // Identify roots (nodes with 0 in-degree, or explicitly marked isRoot)
  const roots = nodes.filter((n) => n.isRoot || (inDegree.get(n.id) || 0) === 0);
  const primaryRoot = roots[0] || nodes[0];

  // Measure depths and branching
  let maxDepth = 0;
  let totalBranching = 0;
  let branchingNodesCount = 0;
  let leafCount = 0;

  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: primaryRoot.id, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    if (depth > maxDepth) maxDepth = depth;

    const children = childrenMap.get(id) || [];
    if (children.length > 0) {
      totalBranching += children.length;
      branchingNodesCount++;
    } else {
      leafCount++;
    }

    for (const childId of children) {
      if (!visited.has(childId)) {
        queue.push({ id: childId, depth: depth + 1 });
      }
    }
  }

  // Account for any unvisited nodes
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      leafCount++;
    }
  });

  const avgBranchingFactor = branchingNodesCount > 0 ? totalBranching / branchingNodesCount : 0;
  const leafRatio = nodeCount > 0 ? leafCount / nodeCount : 0;

  // Measure Clusters (either by clusterName or connected components)
  const clusterNames = new Set<string>();
  nodes.forEach((n) => {
    if (n.clusterName && n.clusterName.trim()) {
      clusterNames.add(n.clusterName.trim());
    }
  });
  const clusterCount = Math.max(1, clusterNames.size);

  // Density score: ratio of actual edges to possible tree edges (N-1)
  const maxTreeEdges = Math.max(1, nodeCount - 1);
  const densityScore = Math.min(1, edges.length / maxTreeEdges);

  // Classification Logic:
  // 1. Grid/Matrix: When there are multiple independent clusters (>= 3), or high node count with shallow depth (maxDepth <= 1 and nodeCount >= 6)
  // 2. Tree-Structured: When depth is high (maxDepth >= 3), or sequential hierarchical flow (leafRatio < 0.6 and maxDepth >= 2)
  // 3. Circular/Orbital: When radial density is balanced, central concept with orbital breadth (maxDepth <= 2 and avgBranchingFactor >= 2.5)
  let classifiedDensity: "radial-dense" | "dendritic-hierarchical" | "multi-cluster-matrix";

  if (clusterCount >= 3 && nodeCount >= 6) {
    classifiedDensity = "multi-cluster-matrix";
  } else if (maxDepth >= 3 || (maxDepth >= 2 && avgBranchingFactor < 2.2 && nodeCount >= 5)) {
    classifiedDensity = "dendritic-hierarchical";
  } else if (nodeCount >= 7 && maxDepth <= 1) {
    classifiedDensity = "multi-cluster-matrix";
  } else {
    classifiedDensity = "radial-dense";
  }

  return {
    nodeCount,
    edgeCount: edges.length,
    maxDepth,
    avgBranchingFactor,
    clusterCount,
    leafRatio,
    densityScore,
    isCyclic: edges.length >= nodeCount,
    classifiedDensity,
  };
}

/**
 * Classifies topic density into one of three visual layout hierarchies.
 */
export function classifyLayoutHierarchy(
  metrics: TopicDensityMetrics
): { visualType: HierarchyVisualType; reason: string } {
  switch (metrics.classifiedDensity) {
    case "multi-cluster-matrix":
      return {
        visualType: "grid",
        reason: `Categorical Matrix: Detected ${metrics.clusterCount} semantic clusters across ${metrics.nodeCount} conceptual nodes. Formatted into aligned cluster grids.`,
      };
    case "dendritic-hierarchical":
      return {
        visualType: "tree-structured",
        reason: `Hierarchical Tree: Detected deep sequential progression (Depth: ${metrics.maxDepth}, ${metrics.nodeCount} nodes). Formatted into directed dendritic hierarchy.`,
      };
    case "radial-dense":
    default:
      return {
        visualType: "circular",
        reason: `Concentric Orbital: Detected high central topic density with radial branch distribution (${metrics.nodeCount} nodes). Formatted into concentric orbital rings.`,
      };
  }
}
