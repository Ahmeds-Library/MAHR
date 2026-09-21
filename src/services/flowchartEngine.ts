import { StepNode, FlowchartEdge } from "../types/flowchartTypes";

export interface NodeAnchors {
  top: { x: number; y: number };
  bottom: { x: number; y: number };
  left?: { x: number; y: number };
  right?: { x: number; y: number };
}

export interface NodeMetrics {
  x: number; // Center X in pixels
  y: number; // Top Y in pixels
  w: number; // Width in pixels
  h: number; // Height in pixels
}

/**
 * Calculates anchor connection points for a node given its pixel geometry
 */
export function calculateNodeAnchors(metrics: NodeMetrics): NodeAnchors {
  const { x, y, w, h } = metrics;
  return {
    top: { x, y },
    bottom: { x, y: y + h },
    left: { x: x - w / 2, y: y + h / 2 },
    right: { x: x + w / 2, y: y + h / 2 },
  };
}

/**
 * Generates an SVG cubic bezier path string connecting two anchor points
 */
export function generateBezierPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  curvature: number = 0.5
): string {
  const dy = Math.max(20, (b.y - a.y) * curvature);
  const cp1x = a.x;
  const cp1y = a.y + dy;
  const cp2x = b.x;
  const cp2y = b.y - dy;

  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/**
 * Clamps node X coordinate within canvas margins
 */
export function clampNodeX(
  newCenterX: number,
  nodeWidth: number,
  canvasWidth: number,
  padding: number = 32
): number {
  const halfW = nodeWidth / 2;
  const minX = padding + halfW;
  const maxX = canvasWidth - padding - halfW;

  if (maxX <= minX) return 0.5; // fallback to center

  const clampedPixelX = Math.max(minX, Math.min(maxX, newCenterX));
  return clampedPixelX / canvasWidth;
}
