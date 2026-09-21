import { DrawCommand } from "../lib/diagramLayout";

export interface DeduplicationReport {
  originalCount: number;
  deduplicatedCount: number;
  removedCount: number;
  textDuplicatesRemoved: number;
  shapeDuplicatesRemoved: number;
  edgeDuplicatesRemoved: number;
  timestamp: number;
  appliedRule: string;
}

/**
 * Calculates Euclidean distance between two 2D points on a 0-100 normalized canvas.
 */
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalizes text for semantic duplicate comparison.
 */
function normalizeText(text?: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Checks if two draw commands are identical or near-identical within spatial tolerance.
 */
function areCommandsNearlyIdentical(a: DrawCommand, b: DrawCommand, tolerance: number = 1.2): boolean {
  if (a.type !== b.type) return false;

  const posDist = getDistance(a.x1, a.y1, b.x1, b.y1);
  if (posDist > tolerance) return false;

  if (a.x2 !== undefined && b.x2 !== undefined && a.y2 !== undefined && b.y2 !== undefined) {
    const endDist = getDistance(a.x2, a.y2, b.x2, b.y2);
    if (endDist > tolerance) return false;
  }

  if (a.text !== undefined || b.text !== undefined) {
    return normalizeText(a.text) === normalizeText(b.text);
  }

  return true;
}

/**
 * Checks if two edges (lines or arrows) are connecting the same endpoints (in forward or reverse direction).
 */
function areEdgesRedundant(a: DrawCommand, b: DrawCommand, tolerance: number = 2.5): boolean {
  if (!["line", "arrow"].includes(a.type) || !["line", "arrow"].includes(b.type)) {
    return false;
  }

  const ax2 = a.x2 ?? a.x1;
  const ay2 = a.y2 ?? a.y1;
  const bx2 = b.x2 ?? b.x1;
  const by2 = b.y2 ?? b.y1;

  // Forward match
  const forwardMatch =
    getDistance(a.x1, a.y1, bx1Match(b), by1Match(b)) <= tolerance &&
    getDistance(ax2, ay2, bx2, by2) <= tolerance;

  if (forwardMatch) return true;

  // Reverse match (e.g. line from B to A when A to B already exists)
  const reverseMatch =
    getDistance(a.x1, a.y1, bx2, by2) <= tolerance &&
    getDistance(ax2, ay2, bx1Match(b), by1Match(b)) <= tolerance;

  return reverseMatch;
}

function bx1Match(b: DrawCommand): number {
  return b.x1;
}
function by1Match(b: DrawCommand): number {
  return b.y1;
}

/**
 * Background Deduplication Pass for Chalkboard drawings state.
 * Filters out duplicate texts, redundant shapes, overlapping connector loops,
 * and zero-length artifacts to keep the visual chalkboard slate concise and crisp.
 */
export function deduplicateDrawingsState(
  drawings: DrawCommand[],
  options: {
    spatialTolerance?: number;
    preserveOrdering?: boolean;
    removeZeroLengthEdges?: boolean;
  } = {}
): { cleanedDrawings: DrawCommand[]; report: DeduplicationReport } {
  if (!drawings || drawings.length === 0) {
    return {
      cleanedDrawings: [],
      report: {
        originalCount: 0,
        deduplicatedCount: 0,
        removedCount: 0,
        textDuplicatesRemoved: 0,
        shapeDuplicatesRemoved: 0,
        edgeDuplicatesRemoved: 0,
        timestamp: Date.now(),
        appliedRule: "empty_slate",
      },
    };
  }

  const tolerance = options.spatialTolerance ?? 2.0;
  const removeZeroLength = options.removeZeroLengthEdges ?? true;

  const cleaned: DrawCommand[] = [];
  let textDups = 0;
  let shapeDups = 0;
  let edgeDups = 0;

  // Track existing elements to avoid quadratic explosion on massive slates
  const seenTexts: { text: string; x: number; y: number }[] = [];
  const seenEdges: DrawCommand[] = [];
  const seenShapes: { type: string; cx: number; cy: number }[] = [];

  for (const cmd of drawings) {
    if (!cmd || !cmd.type) continue;

    // 1. Check for degenerate zero-length edges
    if (removeZeroLength && (cmd.type === "line" || cmd.type === "arrow")) {
      const x2 = cmd.x2 ?? cmd.x1;
      const y2 = cmd.y2 ?? cmd.y1;
      if (getDistance(cmd.x1, cmd.y1, x2, y2) < 0.8) {
        edgeDups++;
        continue;
      }
    }

    // 2. Check for text node duplicates
    if (cmd.type === "text" || cmd.text) {
      const norm = normalizeText(cmd.text);
      if (norm) {
        const isDuplicateText = seenTexts.some(
          (t) => t.text === norm && getDistance(t.x, t.y, cmd.x1, cmd.y1) < 4.5
        );
        if (isDuplicateText) {
          textDups++;
          continue;
        }
        seenTexts.push({ text: norm, x: cmd.x1, y: cmd.y1 });
      }
    }

    // 3. Check for redundant edges/lines/arrows
    if (cmd.type === "line" || cmd.type === "arrow") {
      const isRedundantEdge = seenEdges.some((existingEdge) =>
        areEdgesRedundant(cmd, existingEdge, tolerance)
      );
      if (isRedundantEdge) {
        edgeDups++;
        continue;
      }
      seenEdges.push(cmd);
    }

    // 4. Check for redundant overlapping shapes
    if (["circle", "rect", "rounded_rect", "container", "diamond"].includes(cmd.type)) {
      const x2 = cmd.x2 ?? cmd.x1;
      const y2 = cmd.y2 ?? cmd.y1;
      const cx = (cmd.x1 + x2) / 2;
      const cy = (cmd.y1 + y2) / 2;

      const isDuplicateShape = seenShapes.some(
        (s) => s.type === cmd.type && getDistance(s.cx, s.cy, cx, cy) < 2.5
      );
      if (isDuplicateShape) {
        shapeDups++;
        continue;
      }
      seenShapes.push({ type: cmd.type, cx, cy });
    }

    // 5. Check exact command overlap with existing cleaned items
    const isExactDuplicate = cleaned.some((existing) =>
      areCommandsNearlyIdentical(cmd, existing, tolerance * 0.75)
    );
    if (isExactDuplicate) {
      shapeDups++;
      continue;
    }

    cleaned.push(cmd);
  }

  const removedCount = drawings.length - cleaned.length;

  const report: DeduplicationReport = {
    originalCount: drawings.length,
    deduplicatedCount: cleaned.length,
    removedCount,
    textDuplicatesRemoved: textDups,
    shapeDuplicatesRemoved: shapeDups,
    edgeDuplicatesRemoved: edgeDups,
    timestamp: Date.now(),
    appliedRule: removedCount > 0 ? "slate_pruned_and_consolidated" : "slate_already_optimal",
  };

  return { cleanedDrawings: cleaned, report };
}
