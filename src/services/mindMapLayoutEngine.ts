import { InteractiveMindMapNode, InteractiveMindMapEdge, MindMapLayoutMode } from "../types/mindMapTypes";

/**
 * Generates smooth SVG cubic Bezier path between two node centers or anchor points.
 */
export function generateOrganicSplinePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  mode: MindMapLayoutMode = "radial"
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (mode === "tree-horizontal") {
    const cp1x = from.x + Math.max(40, dx * 0.5);
    const cp1y = from.y;
    const cp2x = to.x - Math.max(40, dx * 0.5);
    const cp2y = to.y;
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  }

  if (mode === "tree-vertical") {
    const cp1x = from.x;
    const cp1y = from.y + Math.max(40, dy * 0.5);
    const cp2x = to.x;
    const cp2y = to.y - Math.max(40, dy * 0.5);
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  }

  // Radial / Organic mode: curve perpendicular to displacement line for gentle wave
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Slight curvature offset based on distance
  const curvature = Math.min(25, dist * 0.12);
  const perpX = -dy / (dist || 1) * curvature;
  const perpY = dx / (dist || 1) * curvature;

  const cp1x = from.x + (dx * 0.3) + perpX;
  const cp1y = from.y + (dy * 0.3) + perpY;
  const cp2x = to.x - (dx * 0.3) + perpX;
  const cp2y = to.y - (dy * 0.3) + perpY;

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

/**
 * Calculates radial orbital layout for Mind Map nodes.
 */
export function calculateRadialLayout(
  nodes: InteractiveMindMapNode[],
  edges: InteractiveMindMapEdge[],
  canvasCenter: { x: number; y: number } = { x: 700, y: 500 }
): InteractiveMindMapNode[] {
  if (nodes.length === 0) return [];

  const root = nodes.find((n) => n.isRoot || !n.parentId) || nodes[0];
  const childrenMap = new Map<string, string[]>();

  edges.forEach((edge) => {
    const list = childrenMap.get(edge.from) || [];
    list.push(edge.to);
    childrenMap.set(edge.from, list);
  });

  const updatedNodes = new Map<string, InteractiveMindMapNode>();

  // Position Root at Center
  const rootUpdated: InteractiveMindMapNode = {
    ...root,
    x: canvasCenter.x,
    y: canvasCenter.y,
    depth: 0,
    isRoot: true,
  };
  updatedNodes.set(root.id, rootUpdated);

  // Position Level 1 Branches in orbital ring
  const l1ChildrenIds = childrenMap.get(root.id) || [];
  const l1Count = l1ChildrenIds.length;
  const l1Radius = Math.max(220, Math.min(360, 180 + l1Count * 22));

  l1ChildrenIds.forEach((childId, idx) => {
    const childNode = nodes.find((n) => n.id === childId);
    if (!childNode) return;

    // Distribute angles evenly starting from -Math.PI / 2 (top)
    const angle = (2 * Math.PI * idx) / (l1Count || 1) - Math.PI / 2;
    const cx = canvasCenter.x + l1Radius * Math.cos(angle);
    const cy = canvasCenter.y + l1Radius * Math.sin(angle);

    updatedNodes.set(childId, {
      ...childNode,
      x: Math.round(cx),
      y: Math.round(cy),
      depth: 1,
      parentId: root.id,
    });

    // Position Level 2+ Sub-children
    const l2ChildrenIds = childrenMap.get(childId) || [];
    const l2Count = l2ChildrenIds.length;
    if (l2Count > 0) {
      const l2Radius = 180;
      const angleSpread = Math.min(1.2, 0.5 * l2Count);
      const startAngle = angle - angleSpread / 2;

      l2ChildrenIds.forEach((l2Id, l2Idx) => {
        const l2Node = nodes.find((n) => n.id === l2Id);
        if (!l2Node) return;

        const subAngle = l2Count === 1 ? angle : startAngle + (angleSpread * l2Idx) / (l2Count - 1);
        const l2x = cx + l2Radius * Math.cos(subAngle);
        const l2y = cy + l2Radius * Math.sin(subAngle);

        updatedNodes.set(l2Id, {
          ...l2Node,
          x: Math.round(l2x),
          y: Math.round(l2y),
          depth: 2,
          parentId: childId,
        });

        // Position Level 3+ Sub-children if any
        const l3ChildrenIds = childrenMap.get(l2Id) || [];
        const l3Count = l3ChildrenIds.length;
        if (l3Count > 0) {
          const l3Radius = 150;
          l3ChildrenIds.forEach((l3Id, l3Idx) => {
            const l3Node = nodes.find((n) => n.id === l3Id);
            if (!l3Node) return;
            const l3Angle = subAngle + ((l3Idx - (l3Count - 1) / 2) * 0.35);
            const l3x = l2x + l3Radius * Math.cos(l3Angle);
            const l3y = l2y + l3Radius * Math.sin(l3Angle);

            updatedNodes.set(l3Id, {
              ...l3Node,
              x: Math.round(l3x),
              y: Math.round(l3y),
              depth: 3,
              parentId: l2Id,
            });
          });
        }
      });
    }
  });

  // Preserve any independent/unconnected nodes
  nodes.forEach((n) => {
    if (!updatedNodes.has(n.id)) {
      updatedNodes.set(n.id, n);
    }
  });

  return Array.from(updatedNodes.values());
}

/**
 * Calculates Horizontal Tree layout (Left to Right hierarchy)
 */
export function calculateHorizontalTreeLayout(
  nodes: InteractiveMindMapNode[],
  edges: InteractiveMindMapEdge[],
  startX: number = 200,
  startY: number = 400
): InteractiveMindMapNode[] {
  if (nodes.length === 0) return [];

  const root = nodes.find((n) => n.isRoot || !n.parentId) || nodes[0];
  const childrenMap = new Map<string, string[]>();

  edges.forEach((edge) => {
    const list = childrenMap.get(edge.from) || [];
    list.push(edge.to);
    childrenMap.set(edge.from, list);
  });

  const updatedNodes = new Map<string, InteractiveMindMapNode>();
  const LEVEL_X_GAP = 280;
  const NODE_Y_GAP = 110;

  // Recursive leaf-counting for vertical distribution
  function countLeaves(nodeId: string): number {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return 1;
    return children.reduce((sum, cId) => sum + countLeaves(cId), 0);
  }

  function layoutSubtree(nodeId: string, level: number, topY: number): number {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return topY;

    const children = childrenMap.get(nodeId) || [];
    const leaves = countLeaves(nodeId);
    const subtreeHeight = Math.max(1, leaves) * NODE_Y_GAP;
    const centerY = topY + subtreeHeight / 2;

    updatedNodes.set(nodeId, {
      ...node,
      x: startX + level * LEVEL_X_GAP,
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

  layoutSubtree(root.id, 0, startY - (countLeaves(root.id) * NODE_Y_GAP) / 2);

  nodes.forEach((n) => {
    if (!updatedNodes.has(n.id)) {
      updatedNodes.set(n.id, n);
    }
  });

  return Array.from(updatedNodes.values());
}

/**
 * Calculates new child node coordinates expanding from a specific parent node.
 * Uses available angular slots or offsets away from the center to prevent overlaps.
 */
export function calculateDynamicExpansionCoordinates(
  parent: InteractiveMindMapNode,
  newChildIndex: number,
  totalNewChildren: number,
  existingNodes: InteractiveMindMapNode[],
  canvasCenter: { x: number; y: number } = { x: 700, y: 500 }
): { x: number; y: number } {
  // Determine vector from canvas center to parent
  const dx = parent.x - canvasCenter.x;
  const dy = parent.y - canvasCenter.y;
  let baseAngle = Math.atan2(dy, dx);

  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
    baseAngle = -Math.PI / 2; // Default upward if parent is at center
  }

  const branchDistance = parent.isRoot ? 240 : 170;
  const spread = Math.min(1.4, Math.max(0.6, totalNewChildren * 0.35));
  const startAngle = baseAngle - spread / 2;
  const angle = totalNewChildren === 1
    ? baseAngle
    : startAngle + (spread * newChildIndex) / (totalNewChildren - 1);

  let targetX = Math.round(parent.x + branchDistance * Math.cos(angle));
  let targetY = Math.round(parent.y + branchDistance * Math.sin(angle));

  // Small collision avoidance check against existing nodes
  for (const existing of existingNodes) {
    const distSq = (targetX - existing.x) ** 2 + (targetY - existing.y) ** 2;
    if (distSq < 110 * 110) {
      // Offset slightly outward
      targetX += Math.round(45 * Math.cos(angle));
      targetY += Math.round(45 * Math.sin(angle));
    }
  }

  return { x: targetX, y: targetY };
}
