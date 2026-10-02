import { InteractiveMindMapNode, InteractiveMindMapEdge, MindMapLayoutMode } from "../../types/mindMapTypes";
import {
  HierarchyVisualType,
  NodeTargetCoordinate,
  SmartLayoutPlan,
} from "./smartLayoutTypes";
import { analyzeTopicDensity, classifyLayoutHierarchy } from "./densityClassifier";

interface CanvasCenter {
  x: number;
  y: number;
}

/**
 * 1. Circular / Concentric Orbital Layout Solver
 * Positions root at center and child nodes into concentric orbital rings
 * based on depth and angular sectors.
 */
export function computeConcentricCircularLayout(
  nodes: InteractiveMindMapNode[],
  edges: InteractiveMindMapEdge[],
  center: CanvasCenter = { x: 750, y: 500 }
): Map<string, NodeTargetCoordinate> {
  const result = new Map<string, NodeTargetCoordinate>();
  if (nodes.length === 0) return result;

  const root = nodes.find((n) => n.isRoot || !n.parentId) || nodes[0];
  const childrenMap = new Map<string, string[]>();

  edges.forEach((e) => {
    const list = childrenMap.get(e.from) || [];
    list.push(e.to);
    childrenMap.set(e.from, list);
  });

  // 1. Position Root at Center
  result.set(root.id, {
    id: root.id,
    x: center.x,
    y: center.y,
    depth: 0,
    clusterName: root.clusterName,
  });

  const l1Children = childrenMap.get(root.id) || [];
  const l1Count = l1Children.length;
  const l1Radius = Math.max(220, Math.min(360, 180 + l1Count * 24));

  l1Children.forEach((childId, idx) => {
    const angle = (2 * Math.PI * idx) / (l1Count || 1) - Math.PI / 2;
    const cx = Math.round(center.x + l1Radius * Math.cos(angle));
    const cy = Math.round(center.y + l1Radius * Math.sin(angle));

    result.set(childId, {
      id: childId,
      x: cx,
      y: cy,
      depth: 1,
    });

    // Ring 2: Children of Level 1
    const l2Children = childrenMap.get(childId) || [];
    const l2Count = l2Children.length;
    if (l2Count > 0) {
      const l2Radius = 180;
      const angleSpread = Math.min(1.3, 0.45 * l2Count);
      const startAngle = angle - angleSpread / 2;

      l2Children.forEach((l2Id, l2Idx) => {
        const subAngle = l2Count === 1 ? angle : startAngle + (angleSpread * l2Idx) / (l2Count - 1);
        const l2x = Math.round(cx + l2Radius * Math.cos(subAngle));
        const l2y = Math.round(cy + l2Radius * Math.sin(subAngle));

        result.set(l2Id, {
          id: l2Id,
          x: l2x,
          y: l2y,
          depth: 2,
        });

        // Ring 3: Children of Level 2
        const l3Children = childrenMap.get(l2Id) || [];
        const l3Count = l3Children.length;
        if (l3Count > 0) {
          const l3Radius = 150;
          l3Children.forEach((l3Id, l3Idx) => {
            const l3Angle = subAngle + (l3Idx - (l3Count - 1) / 2) * 0.35;
            const l3x = Math.round(l2x + l3Radius * Math.cos(l3Angle));
            const l3y = Math.round(l2y + l3Radius * Math.sin(l3Angle));

            result.set(l3Id, {
              id: l3Id,
              x: l3x,
              y: l3y,
              depth: 3,
            });
          });
        }
      });
    }
  });

  // Preserve any unconnected nodes along outer orbit
  let unplacedIdx = 0;
  nodes.forEach((n) => {
    if (!result.has(n.id)) {
      const orphanRadius = l1Radius + 280;
      const angle = (2 * Math.PI * unplacedIdx) / 8 + Math.PI / 4;
      result.set(n.id, {
        id: n.id,
        x: Math.round(center.x + orphanRadius * Math.cos(angle)),
        y: Math.round(center.y + orphanRadius * Math.sin(angle)),
        depth: 1,
      });
      unplacedIdx++;
    }
  });

  return result;
}

/**
 * 2. Tree-Structured Dendrogram Layout Solver
 * Formats hierarchy into directed sequential tiers with zero node overlap.
 */
export function computeHierarchicalTreeLayout(
  nodes: InteractiveMindMapNode[],
  edges: InteractiveMindMapEdge[],
  center: CanvasCenter = { x: 750, y: 500 }
): Map<string, NodeTargetCoordinate> {
  const result = new Map<string, NodeTargetCoordinate>();
  if (nodes.length === 0) return result;

  const root = nodes.find((n) => n.isRoot || !n.parentId) || nodes[0];
  const childrenMap = new Map<string, string[]>();

  edges.forEach((e) => {
    const list = childrenMap.get(e.from) || [];
    list.push(e.to);
    childrenMap.set(e.from, list);
  });

  const LEVEL_X_GAP = 280;
  const NODE_Y_GAP = 120;

  function countLeaves(nodeId: string): number {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return 1;
    return children.reduce((sum, cId) => sum + countLeaves(cId), 0);
  }

  const totalLeaves = countLeaves(root.id);
  const totalTreeHeight = totalLeaves * NODE_Y_GAP;
  const startX = Math.max(180, center.x - 450);
  const startY = center.y - totalTreeHeight / 2;

  function layoutSubtree(nodeId: string, level: number, topY: number): number {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return topY;

    const children = childrenMap.get(nodeId) || [];
    const leaves = countLeaves(nodeId);
    const subtreeHeight = Math.max(1, leaves) * NODE_Y_GAP;
    const centerY = topY + subtreeHeight / 2;

    result.set(nodeId, {
      id: nodeId,
      x: Math.round(startX + level * LEVEL_X_GAP),
      y: Math.round(centerY),
      depth: level,
    });

    let currentChildTop = topY;
    children.forEach((cId) => {
      const childLeaves = countLeaves(cId);
      layoutSubtree(cId, level + 1, currentChildTop);
      currentChildTop += childLeaves * NODE_Y_GAP;
    });

    return topY + subtreeHeight;
  }

  layoutSubtree(root.id, 0, startY);

  // Preserve unplaced nodes in right column
  let orphanOffset = 0;
  nodes.forEach((n) => {
    if (!result.has(n.id)) {
      result.set(n.id, {
        id: n.id,
        x: Math.round(startX + LEVEL_X_GAP * 3),
        y: Math.round(startY + orphanOffset * NODE_Y_GAP),
        depth: 2,
      });
      orphanOffset++;
    }
  });

  return result;
}

/**
 * 3. Categorical Matrix / Cluster Grid Layout Solver
 * Arranges nodes into a responsive 2D matrix grouped by cluster/category.
 */
export function computeClusterGridLayout(
  nodes: InteractiveMindMapNode[],
  edges: InteractiveMindMapEdge[],
  center: CanvasCenter = { x: 750, y: 500 }
): Map<string, NodeTargetCoordinate> {
  const result = new Map<string, NodeTargetCoordinate>();
  if (nodes.length === 0) return result;

  // Group nodes by clusterName or fallback to category
  const clusters = new Map<string, InteractiveMindMapNode[]>();
  nodes.forEach((n) => {
    const cName = n.clusterName?.trim() || (n.isRoot ? "Central Topic" : "General Concepts");
    const list = clusters.get(cName) || [];
    list.push(n);
    clusters.set(cName, list);
  });

  const clusterList = Array.from(clusters.entries());
  const clusterCount = clusterList.length;

  // Layout parameters
  const CARD_WIDTH = 240;
  const CARD_HEIGHT = 110;
  const GAP_X = 50;
  const GAP_Y = 40;

  // If few clusters, place clusters in columns; within each cluster, stack cards vertically
  if (clusterCount <= 4) {
    const totalCols = clusterCount;
    const totalWidth = totalCols * CARD_WIDTH + (totalCols - 1) * GAP_X;
    const startX = center.x - totalWidth / 2 + CARD_WIDTH / 2;

    clusterList.forEach(([cName, clusterNodes], colIdx) => {
      const colX = Math.round(startX + colIdx * (CARD_WIDTH + GAP_X));
      const colHeight = clusterNodes.length * CARD_HEIGHT + (clusterNodes.length - 1) * GAP_Y;
      const startY = center.y - colHeight / 2 + CARD_HEIGHT / 2;

      clusterNodes.forEach((node, rowIdx) => {
        const nodeY = Math.round(startY + rowIdx * (CARD_HEIGHT + GAP_Y));
        result.set(node.id, {
          id: node.id,
          x: colX,
          y: nodeY,
          depth: node.isRoot ? 0 : 1,
          clusterName: cName,
        });
      });
    });
  } else {
    // 2D grid matrix of cards
    const cols = Math.ceil(Math.sqrt(nodes.length * 1.3));
    const rows = Math.ceil(nodes.length / cols);
    const totalWidth = cols * CARD_WIDTH + (cols - 1) * GAP_X;
    const totalHeight = rows * CARD_HEIGHT + (rows - 1) * GAP_Y;
    const startX = center.x - totalWidth / 2 + CARD_WIDTH / 2;
    const startY = center.y - totalHeight / 2 + CARD_HEIGHT / 2;

    nodes.forEach((node, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const nx = Math.round(startX + col * (CARD_WIDTH + GAP_X));
      const ny = Math.round(startY + row * (CARD_HEIGHT + GAP_Y));

      result.set(node.id, {
        id: node.id,
        x: nx,
        y: ny,
        depth: node.isRoot ? 0 : 1,
      });
    });
  }

  return result;
}

/**
 * Main Smart Layout solver: Analyzes density, selects optimal visual hierarchy,
 * and calculates exact target coordinates for each node.
 */
export function computeSmartLayout(
  nodes: InteractiveMindMapNode[],
  edges: InteractiveMindMapEdge[],
  canvasSize: { width: number; height: number } = { width: 1400, height: 900 }
): SmartLayoutPlan {
  const center: CanvasCenter = {
    x: Math.round(canvasSize.width / 2) || 750,
    y: Math.round(canvasSize.height / 2) || 500,
  };

  const metrics = analyzeTopicDensity(nodes, edges);
  const { visualType, reason } = classifyLayoutHierarchy(metrics);

  let targetCoordinates: Map<string, NodeTargetCoordinate>;
  let layoutMode: MindMapLayoutMode;

  switch (visualType) {
    case "grid":
      targetCoordinates = computeClusterGridLayout(nodes, edges, center);
      layoutMode = "grid";
      break;
    case "tree-structured":
      targetCoordinates = computeHierarchicalTreeLayout(nodes, edges, center);
      layoutMode = "tree-horizontal";
      break;
    case "circular":
    default:
      targetCoordinates = computeConcentricCircularLayout(nodes, edges, center);
      layoutMode = "radial";
      break;
  }

  // Calculate bounding box of targets
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  targetCoordinates.forEach((coord) => {
    if (coord.x < minX) minX = coord.x;
    if (coord.x > maxX) maxX = coord.x;
    if (coord.y < minY) minY = coord.y;
    if (coord.y > maxY) maxY = coord.y;
  });

  if (!isFinite(minX)) {
    minX = center.x - 200;
    maxX = center.x + 200;
    minY = center.y - 150;
    maxY = center.y + 150;
  }

  const bounds = {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };

  return {
    visualType,
    layoutMode,
    reason,
    metrics,
    targetCoordinates,
    bounds,
  };
}
