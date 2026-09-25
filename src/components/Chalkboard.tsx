import React, { useEffect, useRef, useState, useCallback } from "react";
import { dbGet, dbSet, dbRemove } from "../lib/db";
import { 
  X, 
  Palette, 
  Eraser, 
  Trash2, 
  Sparkles, 
  FileText, 
  Layers, 
  ChevronRight, 
  Download,
  BookOpen,
  Maximize2,
  Minimize2,
  RefreshCw,
  HelpCircle,
  HelpCircle as QuestionIcon,
  PenTool,
  Mic,
  Play,
  Square,
  Activity,
  Sliders,
  Check,
  Undo,
  Redo,
  GitCommit,
  ArrowUpRight,
  Hand,
  Wand2,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Film,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Copy,
  ArrowUp,
  ArrowDown,
  Combine,
  SlidersHorizontal,
  Feather,
  Droplets,
  Highlighter as HighlighterIcon,
  Edit3,
  Pencil,
  Zap,
  Volume2,
  VolumeX,
  Grid,
  FileDown,
  Brain,
  Presentation
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatMathText } from "../lib/mathFormatter";
import {
  BrushProfile,
  BRUSH_PROFILES,
  getBrushProfileById,
  renderProfileStrokeOnCtx,
  calculateCalligraphyAngleWidth,
  calculateProfileOpacity,
  calculateProfileWidthMultiplier,
  evaluatePressureCurve
} from "../lib/brushProfiles";
import {
  playChalkTap,
  playChalkFriction,
  playEraserSwipe,
  playShapeSnapChime,
  setChalkSoundEnabled,
  isChalkSoundEnabled
} from "../lib/chalkAudio";
import { BrushProfilesModal } from "./BrushProfilesModal";
import { SimulationCanvas } from "./SimulationCanvas";
import { UniversalSimulationStudio } from "./simulation/UniversalSimulationStudio";
import { FlowchartCanvas } from "./flowchart/FlowchartCanvas";
import { InteractiveMindMapCanvas } from "./mindmap/InteractiveMindMapCanvas";
import { SlideStudioWhiteboard } from "./slides/SlideStudioWhiteboard";
import { deduplicateDrawingsState, DeduplicationReport } from "../services/slateDeduplicationService";
import { SlateDeduplicatorModal } from "./SlateDeduplicatorModal";
import { FLOWCHART_PRESETS } from "../lib/flowchartPresets";
import { WhiteboardHeader } from "./whiteboard/WhiteboardHeader";
import { WhiteboardFloatingDock } from "./whiteboard/WhiteboardFloatingDock";
import { WhiteboardUtilityDrawer } from "./whiteboard/WhiteboardUtilityDrawer";
import { WhiteboardAIImageModal } from "./whiteboard/WhiteboardAIImageModal";
import { MahrVoiceCompanion } from "./whiteboard/MahrVoiceCompanion";
import { WhiteboardZoomBar } from "./whiteboard/WhiteboardZoomBar";
import { WhiteboardStylusHUD } from "./whiteboard/WhiteboardStylusHUD";
import { WhiteboardVoiceAction } from "../services/whiteboard/whiteboardVoiceIntentEngine";

interface Point {
  x: number;
  y: number;
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface HistorySnapshot {
  layers: {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    dataUrl: string;
    bounds?: { x: number; y: number; width: number; height: number };
  }[];
  activeLayerId: string;
}

export interface ShapeRecognitionResult {
  type:
    | "line"
    | "circle"
    | "ellipse"
    | "rectangle"
    | "square"
    | "rounded_rect"
    | "triangle"
    | "right_triangle"
    | "arrow"
    | "double_arrow"
    | "diamond"
    | "star"
    | "heart"
    | "speech_bubble"
    | "cloud"
    | "pentagon"
    | "hexagon"
    | "octagon"
    | "curve"
    | "checkmark"
    | "cross_x"
    | "smart_text"
    | "scribble_erase";
  name: string;
  data: any;
}

function perpendicularDistance(pt: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) {
    return Math.sqrt((pt.x - lineStart.x) ** 2 + (pt.y - lineStart.y) ** 2);
  }
  const u = ((pt.x - lineStart.x) * dx + (pt.y - lineStart.y) * dy) / (mag * mag);
  const clampedU = Math.max(0, Math.min(1, u));
  const projX = lineStart.x + clampedU * dx;
  const projY = lineStart.y + clampedU * dy;
  return Math.sqrt((pt.x - projX) ** 2 + (pt.y - projY) ** 2);
}

function rdp(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;
  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = rdp(points.slice(0, index + 1), epsilon);
    const recResults2 = rdp(points.slice(index), epsilon);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
}

// Smooth points using Chaikin's corner cutting algorithm for silky curves
function smoothPointsChaikin(pts: Point[], iterations: number = 2): Point[] {
  if (pts.length <= 2) return pts;
  let current = pts;
  for (let iter = 0; iter < iterations; iter++) {
    const next: Point[] = [current[0]];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];
      const q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
      const r = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
      next.push(q);
      next.push(r);
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

function snapLineAngle(start: Point, end: Point): { end: Point; label: string } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 5) return { end, label: "" };

  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  const snapTargets = [
    { deg: 0, label: "0° Horizontal" },
    { deg: 45, label: "45° Diagonal" },
    { deg: 90, label: "90° Vertical" },
    { deg: 135, label: "135° Diagonal" },
    { deg: 180, label: "180° Horizontal" },
    { deg: -45, label: "-45° Diagonal" },
    { deg: -90, label: "-90° Vertical" },
    { deg: -135, label: "-135° Diagonal" },
    { deg: -180, label: "-180° Horizontal" },
  ];

  for (const t of snapTargets) {
    let diff = Math.abs(angleDeg - t.deg);
    if (diff > 180) diff = Math.abs(diff - 360);
    if (diff <= 8) {
      const rad = (t.deg * Math.PI) / 180;
      return {
        end: {
          x: start.x + dist * Math.cos(rad),
          y: start.y + dist * Math.sin(rad)
        },
        label: ` (${t.label})`
      };
    }
  }

  return { end, label: "" };
}

export function recognizeSmartPenShape(pts: Point[], isHoldRefined?: boolean): ShapeRecognitionResult {
  if (!pts || pts.length < 2) {
    const start = pts?.[0] || { x: 0, y: 0 };
    return {
      type: "line",
      name: "Point Dot •",
      data: { start, end: start }
    };
  }

  let minX = pts[0].x, maxX = pts[0].x;
  let minY = pts[0].y, maxY = pts[0].y;
  let totalLength = 0;
  let xDirectionFlips = 0;
  let yDirectionFlips = 0;
  let prevDx = 0;
  let prevDy = 0;

  for (let i = 0; i < pts.length; i++) {
    minX = Math.min(minX, pts[i].x);
    maxX = Math.max(maxX, pts[i].x);
    minY = Math.min(minY, pts[i].y);
    maxY = Math.max(maxY, pts[i].y);
    if (i > 0) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      totalLength += Math.hypot(dx, dy);

      if (Math.abs(dx) > 1.5) {
        if (prevDx !== 0 && ((dx > 0 && prevDx < 0) || (dx < 0 && prevDx > 0))) {
          xDirectionFlips++;
        }
        prevDx = dx;
      }
      if (Math.abs(dy) > 1.5) {
        if (prevDy !== 0 && ((dy > 0 && prevDy < 0) || (dy < 0 && prevDy > 0))) {
          yDirectionFlips++;
        }
        prevDy = dy;
      }
    }
  }

  const width = Math.max(2, maxX - minX);
  const height = Math.max(2, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const startPt = pts[0];
  const endPt = pts[pts.length - 1];
  const startEndDist = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
  const diag = Math.hypot(width, height);
  const aspectRatio = width / height;

  // 1. Gesture: Scribble Erase (Rapid zig-zag in a bounding area)
  if ((xDirectionFlips >= 5 || yDirectionFlips >= 5) && width < 140 && height < 120 && totalLength > 130) {
    return {
      type: "scribble_erase",
      name: "Scribble Erase 🧹",
      data: { minX, minY, width, height }
    };
  }

  // 2. Check: Straight Line / Vector Arrow / Double Arrow
  // Calculate maximum perpendicular deviation from the line between startPt and endPt
  let maxPerpDev = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    maxPerpDev = Math.max(maxPerpDev, perpendicularDistance(pts[i], startPt, endPt));
  }
  const isLineCandidate =
    (startEndDist > 18 && totalLength / startEndDist < 1.32) ||
    (startEndDist > 25 && maxPerpDev / startEndDist < 0.12);

  if (isLineCandidate) {
    const lastChunk = pts.slice(Math.max(0, pts.length - 8));
    const firstChunk = pts.slice(0, Math.min(8, pts.length));
    let hasEndArrow = false;
    let hasStartArrow = false;

    if (lastChunk.length >= 4) {
      const tip = lastChunk[lastChunk.length - 1];
      const prev = lastChunk[0];
      const tipDist = Math.hypot(tip.x - prev.x, tip.y - prev.y);
      if (tipDist < totalLength * 0.35 && tipDist > 8) hasEndArrow = true;
    }

    if (firstChunk.length >= 4) {
      const tip = firstChunk[0];
      const prev = firstChunk[firstChunk.length - 1];
      const tipDist = Math.hypot(tip.x - prev.x, tip.y - prev.y);
      if (tipDist < totalLength * 0.35 && tipDist > 8) hasStartArrow = true;
    }

    const snapped = snapLineAngle(startPt, endPt);
    if (hasEndArrow && hasStartArrow) {
      return {
        type: "double_arrow",
        name: `Double Arrow ↔${snapped.label}`,
        data: { start: startPt, end: snapped.end }
      };
    }
    if (hasEndArrow) {
      return {
        type: "arrow",
        name: `Vector Arrow ➔${snapped.label}`,
        data: { start: startPt, end: snapped.end }
      };
    }

    return {
      type: "line",
      name: `Straight Line${snapped.label}`,
      data: { start: startPt, end: snapped.end }
    };
  }

  // 3. Circle & Ellipse Auto-Completion Algorithm
  // Calculate centroid and radial distribution
  let sumX = 0, sumY = 0;
  pts.forEach((p) => { sumX += p.x; sumY += p.y; });
  const cx = sumX / pts.length;
  const cy = sumY / pts.length;

  const radii = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
  const meanRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
  const variance = radii.reduce((a, b) => a + (b - meanRadius) ** 2, 0) / radii.length;
  const stdDev = Math.sqrt(variance);
  const radiusRatioStd = stdDev / (meanRadius || 1);

  // Compute angular coverage around center to detect partial/closed circles
  let totalAngularSweep = 0;
  for (let i = 1; i < pts.length; i++) {
    const a1 = Math.atan2(pts[i - 1].y - cy, pts[i - 1].x - cx);
    const a2 = Math.atan2(pts[i].y - cy, pts[i].x - cx);
    let diff = a2 - a1;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    totalAngularSweep += diff;
  }
  const absAngularSweep = Math.abs(totalAngularSweep);

  const isClosedLoop = startEndDist < Math.max(38, diag * 0.32) || (totalLength > 70 && startEndDist / totalLength < 0.28);
  const isCircleOrArc = (isClosedLoop || absAngularSweep >= 3.6) && radiusRatioStd < 0.32 && pts.length >= 6;

  if (isCircleOrArc) {
    if (aspectRatio >= 0.72 && aspectRatio <= 1.38) {
      return {
        type: "circle",
        name: `Perfect Circle ⭕ (${Math.round(meanRadius)}px)`,
        data: { cx, cy, radius: meanRadius }
      };
    } else {
      return {
        type: "ellipse",
        name: `Ellipse / Oval ⭕ (${Math.round(width)}×${Math.round(height)})`,
        data: { cx, cy, rx: width / 2, ry: height / 2 }
      };
    }
  }

  // 4. Polygon & Corner Analysis using Douglas-Peucker (RDP)
  const epsilon = Math.max(6, diag * 0.07);
  const simplified = rdp(pts, epsilon);
  const corners = [...simplified];
  if (corners.length > 2) {
    const first = corners[0];
    const last = corners[corners.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 30) {
      corners.pop();
    }
  }
  const numCorners = corners.length;

  // 5. Square & Rectangle Auto-Detection & Completion
  // If user draws a box or 3-4 sides with corners
  const isBoxCandidate =
    (isClosedLoop && (numCorners === 4 || numCorners === 5)) ||
    (pts.length >= 8 && (numCorners === 3 || numCorners === 4) && totalLength > diag * 1.5);

  if (isBoxCandidate) {
    // Check if corners have curvature (Rounded Rectangle)
    if (pts.length > 15 && totalLength > 80) {
      const cornerCurvatures = pts.filter(
        (p) =>
          (p.x < minX + width * 0.15 || p.x > maxX - width * 0.15) &&
          (p.y < minY + height * 0.15 || p.y > maxY - height * 0.15)
      );
      if (cornerCurvatures.length > 6) {
        return {
          type: "rounded_rect",
          name: `Rounded Rectangle 📱 (${Math.round(width)}×${Math.round(height)})`,
          data: { x: minX, y: minY, width, height, radius: Math.min(18, Math.min(width, height) * 0.18) }
        };
      }
    }

    // Check for Diamond / Rhombus
    const isDiamond = corners.some(
      (c) =>
        Math.abs(c.x - centerX) < width * 0.2 &&
        (Math.abs(c.y - minY) < height * 0.2 || Math.abs(c.y - maxY) < height * 0.2)
    );
    if (isDiamond && aspectRatio >= 0.7 && aspectRatio <= 1.4) {
      return {
        type: "diamond",
        name: `Diamond / Rhombus 💎 (${Math.round(width)}×${Math.round(height)})`,
        data: { cx: centerX, cy: centerY, width, height }
      };
    }

    // Square vs Rectangle Auto-Completion
    if (aspectRatio >= 0.78 && aspectRatio <= 1.28) {
      const side = (width + height) / 2;
      return {
        type: "square",
        name: `Perfect Square ⬛ (${Math.round(side)}×${Math.round(side)})`,
        data: { x: centerX - side / 2, y: centerY - side / 2, size: side }
      };
    } else {
      return {
        type: "rectangle",
        name: `Rectangle ▭ (${Math.round(width)}×${Math.round(height)})`,
        data: { x: minX, y: minY, width, height }
      };
    }
  }

  // 6. Triangle Recognition & Geometry Completion
  if (numCorners === 3 && (isClosedLoop || totalLength > diag * 1.3)) {
    const [p1, p2, p3] = corners;
    const a2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
    const b2 = (p3.x - p2.x) ** 2 + (p3.y - p2.y) ** 2;
    const c2 = (p1.x - p3.x) ** 2 + (p1.y - p3.y) ** 2;
    const sides = [a2, b2, c2].sort((a, b) => a - b);
    if (Math.abs(sides[0] + sides[1] - sides[2]) / (sides[2] || 1) < 0.28) {
      return {
        type: "right_triangle",
        name: "Right Triangle 📐",
        data: { p1, p2, p3 }
      };
    }
    return {
      type: "triangle",
      name: "Triangle 📐",
      data: { p1, p2, p3 }
    };
  }

  // 7. Regular Polygons
  if (isClosedLoop && numCorners === 5) {
    return {
      type: "pentagon",
      name: "Regular Pentagon ⬟",
      data: { cx: centerX, cy: centerY, radius: Math.max(width, height) / 2 }
    };
  }

  if (isClosedLoop && numCorners === 6) {
    return {
      type: "hexagon",
      name: "Regular Hexagon ⬢",
      data: { cx: centerX, cy: centerY, radius: Math.max(width, height) / 2 }
    };
  }

  if (isClosedLoop && (numCorners === 7 || numCorners === 8)) {
    return {
      type: "octagon",
      name: "Regular Octagon 🛑",
      data: { cx: centerX, cy: centerY, radius: Math.max(width, height) / 2 }
    };
  }

  // 8. Star, Heart, Speech Bubble, Cloud
  if (isClosedLoop && numCorners >= 9 && numCorners <= 12) {
    return {
      type: "star",
      name: "5-Point Star ⭐",
      data: {
        cx: centerX,
        cy: centerY,
        outerRadius: Math.max(width, height) / 2,
        innerRadius: Math.max(width, height) / 4
      }
    };
  }

  if (pts.length >= 8 && startEndDist < Math.max(35, diag * 0.35)) {
    const topCenterY = minY + height * 0.35;
    let minTopYCount = 0;
    pts.forEach((p) => {
      if (p.y < topCenterY && Math.abs(p.x - centerX) < width * 0.45) {
        minTopYCount++;
      }
    });
    if (minTopYCount >= 2 && (endPt.y > centerY || startPt.y > centerY)) {
      return {
        type: "heart",
        name: "Heart Shape ❤️",
        data: { cx: centerX, cy: centerY, width, height }
      };
    }
  }

  // 9. Smooth Spline Curve for organic drawings
  const smoothed = smoothPointsChaikin(pts, 2);
  return {
    type: "curve",
    name: "Smooth Curve 〰️",
    data: { points: smoothed }
  };
}

export function drawVectorShapeOnCtx(
  oCtx: CanvasRenderingContext2D,
  shapeResult: ShapeRecognitionResult,
  color: string,
  brushSize: number,
  chalkColors: { name: string; code: string; shadow: string }[],
  offset?: { x: number; y: number }
) {
  oCtx.save();
  if (offset) {
    oCtx.translate(-offset.x, -offset.y);
  }
  oCtx.globalCompositeOperation = "source-over";
  oCtx.lineWidth = brushSize;
  oCtx.strokeStyle = color;
  oCtx.lineCap = "round";
  oCtx.lineJoin = "round";
  oCtx.shadowBlur = 4;
  const chalkCol = chalkColors.find(c => c.code === color);
  oCtx.shadowColor = chalkCol ? chalkCol.code : color;

  const { type, data } = shapeResult;

  if (type === "scribble_erase") {
    oCtx.globalCompositeOperation = "destination-out";
    oCtx.fillRect(data.minX, data.minY, data.width, data.height);
    oCtx.restore();
    return;
  }

  if (type === "smart_text") {
    const { text, x, y, fontSize } = data;
    oCtx.save();
    oCtx.font = `600 ${fontSize || 24}px 'Caveat', 'Architects Daughter', 'Comic Sans MS', cursive, sans-serif`;
    oCtx.fillStyle = color;
    oCtx.shadowBlur = 8;
    oCtx.shadowColor = color;
    oCtx.fillText(text, x, y);
    oCtx.restore();
    oCtx.restore();
    return;
  }

  oCtx.beginPath();
  if (type === "line") {
    oCtx.moveTo(data.start.x, data.start.y);
    oCtx.lineTo(data.end.x, data.end.y);
    oCtx.stroke();
  } else if (type === "circle") {
    oCtx.arc(data.cx, data.cy, Math.max(2, data.radius), 0, Math.PI * 2);
    oCtx.stroke();
  } else if (type === "ellipse") {
    oCtx.ellipse(data.cx, data.cy, Math.max(2, data.rx), Math.max(2, data.ry), 0, 0, Math.PI * 2);
    oCtx.stroke();
  } else if (type === "square") {
    oCtx.strokeRect(data.x, data.y, data.size, data.size);
  } else if (type === "rectangle") {
    oCtx.strokeRect(data.x, data.y, data.width, data.height);
  } else if (type === "rounded_rect") {
    const { x, y, width, height, radius } = data;
    const r = Math.min(radius || 12, width / 2, height / 2);
    oCtx.moveTo(x + r, y);
    oCtx.lineTo(x + width - r, y);
    oCtx.quadraticCurveTo(x + width, y, x + width, y + r);
    oCtx.lineTo(x + width, y + height - r);
    oCtx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    oCtx.lineTo(x + r, y + height);
    oCtx.quadraticCurveTo(x, y + height, x, y + height - r);
    oCtx.lineTo(x, y + r);
    oCtx.quadraticCurveTo(x, y, x + r, y);
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "triangle" || type === "right_triangle") {
    oCtx.moveTo(data.p1.x, data.p1.y);
    oCtx.lineTo(data.p2.x, data.p2.y);
    oCtx.lineTo(data.p3.x, data.p3.y);
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "arrow") {
    oCtx.moveTo(data.start.x, data.start.y);
    oCtx.lineTo(data.end.x, data.end.y);
    oCtx.stroke();
    const angle = Math.atan2(data.end.y - data.start.y, data.end.x - data.start.x);
    const headLength = Math.max(12, brushSize * 3);
    oCtx.beginPath();
    oCtx.moveTo(data.end.x, data.end.y);
    oCtx.lineTo(data.end.x - headLength * Math.cos(angle - Math.PI / 6), data.end.y - headLength * Math.sin(angle - Math.PI / 6));
    oCtx.moveTo(data.end.x, data.end.y);
    oCtx.lineTo(data.end.x - headLength * Math.cos(angle + Math.PI / 6), data.end.y - headLength * Math.sin(angle + Math.PI / 6));
    oCtx.stroke();
  } else if (type === "double_arrow") {
    oCtx.moveTo(data.start.x, data.start.y);
    oCtx.lineTo(data.end.x, data.end.y);
    oCtx.stroke();
    const angle = Math.atan2(data.end.y - data.start.y, data.end.x - data.start.x);
    const headLength = Math.max(12, brushSize * 3);
    // End arrow
    oCtx.beginPath();
    oCtx.moveTo(data.end.x, data.end.y);
    oCtx.lineTo(data.end.x - headLength * Math.cos(angle - Math.PI / 6), data.end.y - headLength * Math.sin(angle - Math.PI / 6));
    oCtx.moveTo(data.end.x, data.end.y);
    oCtx.lineTo(data.end.x - headLength * Math.cos(angle + Math.PI / 6), data.end.y - headLength * Math.sin(angle + Math.PI / 6));
    // Start arrow
    oCtx.moveTo(data.start.x, data.start.y);
    oCtx.lineTo(data.start.x + headLength * Math.cos(angle - Math.PI / 6), data.start.y + headLength * Math.sin(angle - Math.PI / 6));
    oCtx.moveTo(data.start.x, data.start.y);
    oCtx.lineTo(data.start.x + headLength * Math.cos(angle + Math.PI / 6), data.start.y + headLength * Math.sin(angle + Math.PI / 6));
    oCtx.stroke();
  } else if (type === "diamond") {
    const hw = data.width / 2;
    const hh = data.height / 2;
    oCtx.moveTo(data.cx, data.cy - hh);
    oCtx.lineTo(data.cx + hw, data.cy);
    oCtx.lineTo(data.cx, data.cy + hh);
    oCtx.lineTo(data.cx - hw, data.cy);
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "pentagon") {
    const r = data.radius;
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = data.cx + r * Math.cos(a);
      const py = data.cy + r * Math.sin(a);
      if (i === 0) oCtx.moveTo(px, py);
      else oCtx.lineTo(px, py);
    }
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "hexagon") {
    const r = data.radius;
    for (let i = 0; i < 6; i++) {
      const a = (i * 2 * Math.PI) / 6 - Math.PI / 2;
      const px = data.cx + r * Math.cos(a);
      const py = data.cy + r * Math.sin(a);
      if (i === 0) oCtx.moveTo(px, py);
      else oCtx.lineTo(px, py);
    }
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "octagon") {
    const r = data.radius;
    for (let i = 0; i < 8; i++) {
      const a = (i * 2 * Math.PI) / 8 - Math.PI / 8;
      const px = data.cx + r * Math.cos(a);
      const py = data.cy + r * Math.sin(a);
      if (i === 0) oCtx.moveTo(px, py);
      else oCtx.lineTo(px, py);
    }
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "star") {
    const outerR = data.outerRadius;
    const innerR = data.innerRadius || outerR * 0.45;
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = data.cx + r * Math.cos(a);
      const py = data.cy + r * Math.sin(a);
      if (i === 0) oCtx.moveTo(px, py);
      else oCtx.lineTo(px, py);
    }
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "heart") {
    const { cx, cy, width, height } = data;
    const w = width / 2;
    const h = height / 2;
    oCtx.moveTo(cx, cy + h * 0.75);
    oCtx.bezierCurveTo(cx - w * 1.2, cy - h * 0.2, cx - w * 0.8, cy - h * 1.1, cx, cy - h * 0.35);
    oCtx.bezierCurveTo(cx + w * 0.8, cy - h * 1.1, cx + w * 1.2, cy - h * 0.2, cx, cy + h * 0.75);
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "speech_bubble") {
    const { x, y, width, height } = data;
    const r = Math.min(12, width * 0.15, height * 0.15);
    oCtx.moveTo(x + r, y);
    oCtx.lineTo(x + width - r, y);
    oCtx.quadraticCurveTo(x + width, y, x + width, y + r);
    oCtx.lineTo(x + width, y + height - r);
    oCtx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    oCtx.lineTo(x + width * 0.4, y + height);
    oCtx.lineTo(x + width * 0.2, y + height + 16);
    oCtx.lineTo(x + width * 0.28, y + height);
    oCtx.lineTo(x + r, y + height);
    oCtx.quadraticCurveTo(x, y + height, x, y + height - r);
    oCtx.lineTo(x, y + r);
    oCtx.quadraticCurveTo(x, y, x + r, y);
    oCtx.closePath();
    oCtx.stroke();
  } else if (type === "cloud") {
    const { cx, cy, width, height } = data;
    const rx = width / 2;
    const ry = height / 2;
    oCtx.save();
    oCtx.translate(cx, cy);
    oCtx.beginPath();
    oCtx.arc(-rx * 0.4, 0, ry * 0.5, Math.PI * 0.8, Math.PI * 1.85);
    oCtx.arc(0, -ry * 0.3, ry * 0.65, Math.PI * 1.1, Math.PI * 1.9);
    oCtx.arc(rx * 0.4, 0, ry * 0.5, Math.PI * 1.15, Math.PI * 0.2);
    oCtx.arc(rx * 0.2, ry * 0.3, ry * 0.45, Math.PI * 0.1, Math.PI * 0.8);
    oCtx.arc(-rx * 0.2, ry * 0.3, ry * 0.45, Math.PI * 0.2, Math.PI * 0.9);
    oCtx.closePath();
    oCtx.stroke();
    oCtx.restore();
  } else if (type === "checkmark") {
    oCtx.moveTo(data.p1.x, data.p1.y);
    oCtx.lineTo(data.p2.x, data.p2.y);
    oCtx.lineTo(data.p3.x, data.p3.y);
    oCtx.stroke();
  } else if (type === "cross_x") {
    const { minX, minY, width, height } = data;
    oCtx.moveTo(minX, minY);
    oCtx.lineTo(minX + width, minY + height);
    oCtx.moveTo(minX + width, minY);
    oCtx.lineTo(minX, minY + height);
    oCtx.stroke();
  } else if (type === "curve") {
    const pts = data.points;
    if (pts && pts.length > 0) {
      oCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        oCtx.lineTo(pts[i].x, pts[i].y);
      }
      oCtx.stroke();
    }
  }
  oCtx.restore();
}

interface ChalkboardProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  onTextChange: (newText: string) => void;
  diagramType: string;
  statusAlert: string | null;
  activeMode: "text" | "canvas" | "split";
  setActiveMode: (mode: "text" | "canvas" | "split") => void;
  themeColor: string;
  drawings: any[];
  clearCounter?: number;
  customModelData?: any | null;
  memories?: any[];
  onTriggerSaveSimulation?: (name: string, modelType: string, scriptText: string, description: string) => void;
  voiceSketchTriggerText?: string | null;
  onClearVoiceSketchTrigger?: () => void;
  onAskMahr?: (question: string) => void;
  onAskMyraa?: (question: string) => void;
  onVoiceToMindMap?: (spokenText: string) => void;
  onUpdateDrawings?: (newDrawings: any[]) => void;
  initialSlidesTopic?: string;
}

const CHALK_COLORS = [
  { name: "White", code: "#f8fafc", shadow: "rgba(248, 250, 252, 0.4)" },
  { name: "Neon Cyan", code: "#06b6d4", shadow: "rgba(6, 182, 212, 0.6)" },
  { name: "Neon Rose", code: "#f43f5e", shadow: "rgba(244, 63, 94, 0.6)" },
  { name: "Neon Gold", code: "#f59e0b", shadow: "rgba(245, 158, 11, 0.6)" },
  { name: "Neon Mint", code: "#10b981", shadow: "rgba(16, 185, 129, 0.6)" },
  { name: "Neon Purple", code: "#a855f7", shadow: "rgba(168, 85, 247, 0.6)" },
];

export const VOICE_PRESETS = [
  {
    name: "Feedforward Neural Network",
    description: "simple feedforward artificial intelligence neural network node layer diagram",
    commands: [
      { type: "text", x1: 20, y1: 15, text: "Input Layer", color: "cyan" },
      { type: "text", x1: 50, y1: 15, text: "Hidden Layer", color: "purple" },
      { type: "text", x1: 80, y1: 15, text: "Output Layer", color: "gold" },
      { type: "circle", x1: 20, y1: 30, x2: 24, y2: 30, color: "cyan" },
      { type: "circle", x1: 20, y1: 50, x2: 24, y2: 50, color: "cyan" },
      { type: "circle", x1: 20, y1: 70, x2: 24, y2: 70, color: "cyan" },
      { type: "circle", x1: 50, y1: 30, x2: 54, y2: 30, color: "purple" },
      { type: "circle", x1: 50, y1: 50, x2: 54, y2: 50, color: "purple" },
      { type: "circle", x1: 50, y1: 70, x2: 54, y2: 70, color: "purple" },
      { type: "circle", x1: 80, y1: 40, x2: 84, y2: 40, color: "gold" },
      { type: "circle", x1: 80, y1: 60, x2: 84, y2: 60, color: "gold" },
      { type: "arrow", x1: 23, y1: 30, x2: 47, y2: 30, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 30, x2: 47, y2: 50, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 50, x2: 47, y2: 30, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 50, x2: 47, y2: 50, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 50, x2: 47, y2: 70, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 70, x2: 47, y2: 50, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 70, x2: 47, y2: 70, color: "white", thickness: 1 },
      { type: "arrow", x1: 53, y1: 30, x2: 77, y2: 40, color: "white", thickness: 1 },
      { type: "arrow", x1: 53, y1: 50, x2: 77, y2: 40, color: "white", thickness: 1 },
      { type: "arrow", x1: 53, y1: 50, x2: 77, y2: 60, color: "white", thickness: 1 },
      { type: "arrow", x1: 53, y1: 70, x2: 77, y2: 60, color: "white", thickness: 1 }
    ]
  },
  {
    name: "Parallel Electrical Circuit",
    description: "schematic diagram of a parallel resistor loop electrical circuit",
    commands: [
      { type: "line", x1: 15, y1: 25, x2: 15, y2: 75, color: "rose" },
      { type: "line", x1: 15, y1: 25, x2: 85, y2: 25, color: "white" },
      { type: "line", x1: 15, y1: 75, x2: 85, y2: 75, color: "white" },
      { type: "rect", x1: 11, y1: 45, x2: 19, y2: 55, color: "rose" },
      { type: "text", x1: 11, y1: 38, text: "9V BATTERY", color: "rose" },
      { type: "line", x1: 45, y1: 25, x2: 45, y2: 40, color: "white" },
      { type: "rect", x1: 41, y1: 40, x2: 49, y2: 60, color: "mint" },
      { type: "text", x1: 37, y1: 35, text: "R1: 220Ω", color: "mint" },
      { type: "line", x1: 45, y1: 60, x2: 45, y2: 75, color: "white" },
      { type: "line", x1: 75, y1: 25, x2: 75, y2: 40, color: "white" },
      { type: "rect", x1: 71, y1: 40, x2: 79, y2: 60, color: "gold" },
      { type: "text", x1: 67, y1: 35, text: "R2: 10k", color: "gold" },
      { type: "line", x1: 75, y1: 60, x2: 75, y2: 75, color: "white" }
    ]
  },
  {
    name: "Feedback Control Loop System",
    description: "control theory automation feedback loop with plant process and sum block",
    commands: [
      { type: "text", x1: 10, y1: 40, text: "Input R(s)", color: "white" },
      { type: "arrow", x1: 10, y1: 50, x2: 23, y2: 50, color: "white" },
      { type: "circle", x1: 25, y1: 50, x2: 29, y2: 50, color: "rose" },
      { type: "text", x1: 24, y1: 44, text: "∑", color: "rose" },
      { type: "arrow", x1: 29, y1: 50, x2: 40, y2: 50, color: "white" },
      { type: "rect", x1: 40, y1: 40, x2: 55, y2: 60, color: "cyan" },
      { type: "text", x1: 42, y1: 35, text: "Controller G(s)", color: "cyan" },
      { type: "arrow", x1: 55, y1: 50, x2: 68, y2: 50, color: "white" },
      { type: "rect", x1: 68, y1: 40, x2: 81, y2: 60, color: "purple" },
      { type: "text", x1: 70, y1: 35, text: "Plant H(s)", color: "purple" },
      { type: "arrow", x1: 81, y1: 50, x2: 95, y2: 50, color: "white" },
      { type: "text", x1: 85, y1: 40, text: "Output Y(s)", color: "gold" },
      { type: "line", x1: 86, y1: 50, x2: 86, y2: 75, color: "white" },
      { type: "line", x1: 86, y1: 75, x2: 25, y2: 75, color: "white" },
      { type: "arrow", x1: 25, y1: 75, x2: 25, y2: 54, color: "white" },
      { type: "text", x1: 20, y1: 82, text: "Feedback (-)", color: "rose" }
    ]
  },
  {
    name: "Binary Decision Tree",
    description: "binary hierarchical decision tree structure cascading downwards",
    commands: [
      { type: "circle", x1: 50, y1: 20, x2: 54, y2: 20, color: "cyan" },
      { type: "text", x1: 44, y1: 14, text: "Root [X > 55]", color: "cyan" },
      { type: "arrow", x1: 48, y1: 23, x2: 32, y2: 42, color: "white" },
      { type: "arrow", x1: 52, y1: 23, x2: 68, y2: 42, color: "white" },
      { type: "circle", x1: 30, y1: 45, x2: 34, y2: 45, color: "mint" },
      { type: "text", x1: 22, y1: 39, text: "Left Node", color: "mint" },
      { type: "circle", x1: 70, y1: 45, x2: 74, y2: 45, color: "rose" },
      { type: "text", x1: 66, y1: 39, text: "Right Node", color: "rose" },
      { type: "arrow", x1: 29, y1: 48, x2: 19, y2: 68, color: "white" },
      { type: "arrow", x1: 31, y1: 48, x2: 41, y2: 68, color: "white" },
      { type: "arrow", x1: 69, y1: 48, x2: 59, y2: 68, color: "white" },
      { type: "arrow", x1: 71, y1: 48, x2: 81, y2: 68, color: "white" },
      { type: "circle", x1: 17, y1: 72, x2: 21, y2: 72, color: "gold" },
      { type: "text", x1: 13, y1: 82, text: "Leaf A", color: "gold" },
      { type: "circle", x1: 43, y1: 72, x2: 47, y2: 72, color: "gold" },
      { type: "text", x1: 39, y1: 82, text: "Leaf B", color: "gold" },
      { type: "circle", x1: 57, y1: 72, x2: 61, y2: 72, color: "gold" },
      { type: "text", x1: 53, y1: 82, text: "Leaf C", color: "gold" },
      { type: "circle", x1: 83, y1: 72, x2: 87, y2: 72, color: "gold" },
      { type: "text", x1: 79, y1: 82, text: "Leaf D", color: "gold" }
    ]
  },
  {
    name: "Entity-Relationship Diagram (ERD)",
    description: "database entity relationship diagram with tables, primary keys, and cardinality links",
    commands: [
      // USERS Entity
      { type: "rect", x1: 10, y1: 45, x2: 24, y2: 55, color: "cyan" },
      { type: "text", x1: 14, y1: 51, text: "USERS", color: "cyan" },

      // USERS Attributes (Ovals)
      { type: "oval", x1: 2, y1: 15, x2: 14, y2: 23, color: "mint" },
      { type: "text", x1: 4, y1: 20, text: "user_id (PK)", color: "mint" },
      { type: "line", x1: 8, y1: 23, x2: 14, y2: 45, color: "white" },

      { type: "oval", x1: 16, y1: 15, x2: 26, y2: 23, color: "mint" },
      { type: "text", x1: 18, y1: 20, text: "name", color: "mint" },
      { type: "line", x1: 21, y1: 23, x2: 17, y2: 45, color: "white" },

      // PLACES Relationship
      { type: "diamond", x1: 28, y1: 42, x2: 40, y2: 58, color: "rose" },
      { type: "text", x1: 30, y1: 51, text: "places", color: "rose" },

      // PLACES Connections & Cardinalities
      { type: "line", x1: 24, y1: 50, x2: 28, y2: 50, color: "white" },
      { type: "text", x1: 25, y1: 46, text: "1", color: "white" },

      { type: "line", x1: 40, y1: 50, x2: 44, y2: 50, color: "white" },
      { type: "text", x1: 42, y1: 46, text: "N", color: "white" },

      // ORDERS Entity
      { type: "rect", x1: 44, y1: 45, x2: 58, y2: 55, color: "gold" },
      { type: "text", x1: 48, y1: 51, text: "ORDERS", color: "gold" },

      // ORDERS Attributes (Ovals)
      { type: "oval", x1: 34, y1: 15, x2: 46, y2: 23, color: "mint" },
      { type: "text", x1: 35, y1: 20, text: "order_id (PK)", color: "mint" },
      { type: "line", x1: 40, y1: 23, x2: 46, y2: 45, color: "white" },

      { type: "oval", x1: 48, y1: 15, x2: 60, y2: 23, color: "mint" },
      { type: "text", x1: 49, y1: 20, text: "user_id (FK)", color: "mint" },
      { type: "line", x1: 54, y1: 23, x2: 51, y2: 45, color: "white" },

      { type: "oval", x1: 50, y1: 72, x2: 60, y2: 80, color: "mint" },
      { type: "text", x1: 52, y1: 77, text: "total", color: "mint" },
      { type: "line", x1: 55, y1: 72, x2: 51, y2: 55, color: "white" },

      // CONTAINS Relationship
      { type: "diamond", x1: 62, y1: 42, x2: 74, y2: 58, color: "rose" },
      { type: "text", x1: 64, y1: 51, text: "contains", color: "rose" },

      // CONTAINS Connections & Cardinalities
      { type: "line", x1: 58, y1: 50, x2: 62, y2: 50, color: "white" },
      { type: "text", x1: 59, y1: 46, text: "M", color: "white" },

      { type: "line", x1: 74, y1: 50, x2: 78, y2: 50, color: "white" },
      { type: "text", x1: 76, y1: 46, text: "N", color: "white" },

      // PRODUCTS Entity
      { type: "rect", x1: 78, y1: 45, x2: 92, y2: 55, color: "mint" },
      { type: "text", x1: 80, y1: 51, text: "PRODUCTS", color: "mint" },

      // PRODUCTS Attributes (Ovals)
      { type: "oval", x1: 66, y1: 15, x2: 78, y2: 23, color: "mint" },
      { type: "text", x1: 67, y1: 20, text: "prod_id (PK)", color: "mint" },
      { type: "line", x1: 72, y1: 23, x2: 80, y2: 45, color: "white" },

      { type: "oval", x1: 80, y1: 15, x2: 90, y2: 23, color: "mint" },
      { type: "text", x1: 82, y1: 20, text: "price", color: "mint" },
      { type: "line", x1: 85, y1: 23, x2: 85, y2: 45, color: "white" },

      { type: "oval", x1: 82, y1: 72, x2: 92, y2: 80, color: "mint" },
      { type: "text", x1: 84, y1: 77, text: "stock", color: "mint" },
      { type: "line", x1: 87, y1: 72, x2: 85, y2: 55, color: "white" }
    ]
  },
  {
    name: "Interactive Mind Map",
    description: "visual brainstorm diagram radiating outward from a central concept",
    commands: [
      { type: "rect", x1: 40, y1: 42, x2: 60, y2: 58, color: "purple" },
      { type: "text", x1: 43, y1: 52, text: "💡 CENTRAL IDEA", color: "purple" },

      { type: "line", x1: 40, y1: 50, x2: 20, y2: 30, color: "cyan" },
      { type: "circle", x1: 20, y1: 30, x2: 24, y2: 30, color: "cyan" },
      { type: "text", x1: 12, y1: 24, text: "🚀 Creativity", color: "cyan" },

      { type: "line", x1: 60, y1: 50, x2: 80, y2: 30, color: "gold" },
      { type: "circle", x1: 80, y1: 30, x2: 84, y2: 30, color: "gold" },
      { type: "text", x1: 76, y1: 24, text: "📈 Strategy", color: "gold" },

      { type: "line", x1: 40, y1: 50, x2: 20, y2: 70, color: "rose" },
      { type: "circle", x1: 20, y1: 70, x2: 24, y2: 70, color: "rose" },
      { type: "text", x1: 12, y1: 78, text: "📊 Analytics", color: "rose" },

      { type: "line", x1: 60, y1: 50, x2: 80, y2: 70, color: "mint" },
      { type: "circle", x1: 80, y1: 70, x2: 84, y2: 70, color: "mint" },
      { type: "text", x1: 76, y1: 78, text: "🎨 Design", color: "mint" }
    ]
  },
  {
    name: "Interactive Flowchart: E-Commerce Fraud Filter",
    description: "live trigger card linked with an if/else condition chip filter and measured bezier connectors",
    isFlowchart: true,
    flowchartPresetId: "order-fraud-trigger",
    commands: []
  },
  {
    name: "Interactive Flowchart: AI Agent Tool Loop",
    description: "ReAct reasoning loop with tool calling, context evaluation and memory sync",
    isFlowchart: true,
    flowchartPresetId: "ai-agent-loop",
    commands: []
  },
  {
    name: "Interactive Flowchart: Algorithm Decision Tree",
    description: "sorting algorithm decision tree with element swapping and termination checks",
    isFlowchart: true,
    flowchartPresetId: "bubble-sort-flowchart",
    commands: []
  },
  {
    name: "Interactive Flowchart: OAuth 2.0 & JWT Security",
    description: "multi-step authentication verification, 2FA challenge and token exchange",
    isFlowchart: true,
    flowchartPresetId: "user-auth-flow",
    commands: []
  }
];

const colorMap: Record<string, string> = {
  cyan: "#06b6d4",
  rose: "#f43f5e",
  gold: "#f59e0b",
  mint: "#10b981",
  purple: "#a855f7",
  white: "#f8fafc"
};

const executeDrawCommands = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  commands: any[]
) => {
  ctx.globalCompositeOperation = "source-over";
  commands.forEach((cmd) => {
    const colValue = colorMap[cmd.color?.toLowerCase()] || cmd.color || "#06b6d4";
    ctx.strokeStyle = colValue;
    ctx.fillStyle = colValue;
    // Set glowing shadow for neon classroom effect (decreased blur for readability)
    ctx.shadowBlur = 2;
    ctx.shadowColor = colValue;
    ctx.lineWidth = cmd.thickness || 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const x1 = (cmd.x1 / 100) * width;
    const y1 = (cmd.y1 / 100) * height;
    const x2 = cmd.x2 !== undefined ? (cmd.x2 / 100) * width : x1;
    const y2 = cmd.y2 !== undefined ? (cmd.y2 / 100) * height : y1;

    switch (cmd.type?.toLowerCase()) {
      case "line": {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
      }
      case "rect": {
        ctx.beginPath();
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
        ctx.stroke();
        break;
      }
      case "oval":
      case "ellipse": {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2 || 10;
        const ry = Math.abs(y2 - y1) / 2 || 10;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
      case "diamond": {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2 || 10;
        const ry = Math.abs(y2 - y1) / 2 || 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ry); // Top
        ctx.lineTo(cx + rx, cy); // Right
        ctx.lineTo(cx, cy + ry); // Bottom
        ctx.lineTo(cx - rx, cy); // Left
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case "circle": {
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) || 20;
        ctx.beginPath();
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
      case "arrow": {
        // Draw main line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 12; // length of head in pixels
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        break;
      }
      case "text": {
        ctx.shadowBlur = 1; // extremely low shadow blur for crisp text readability
        ctx.font = "bold 13px 'JetBrains Mono', Courier, monospace";
        ctx.fillText(cmd.text || "", x1, y1);
        break;
      }
      default:
        break;
    }
  });
};

/* =========================================================================
   🔬 BIOLOGY LAB: DYNAMIC HIGH-FIDELITY HUMAN LUNGS COMPONENT
   ========================================================================= */
function LungsSimulation() {
  const [bpm, setBpm] = useState(16);
  const [isBreathing, setIsBreathing] = useState(true);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, type: "o2" | "co2", opacity: number}>>([]);

  const labels = [
    { name: "Trachea (Windpipe)", x: 50, y: 22, desc: "Rigid muscular conduit lined with rings of protective cartilage driving atmospheric oxygen safely into the chest." },
    { name: "Bronchial Tubes", x: 50, y: 38, desc: "Primary left & right dividing pathways splitting trachea airflow symmetrically into respective pulmonary lung branches." },
    { name: "Right Pulmonary Lobe", x: 38, y: 58, desc: "Organ section pulling in high volume of air. Highly flexible tissue that expands and contracts under vacuum." },
    { name: "Left Pulmonary Lobe", x: 62, y: 58, desc: "Working seamlessly with the right lobe to filter carbon dioxide waste out of deoxygenated blood streams." },
    { name: "Microscopic Alveoli", x: 32, y: 72, desc: "Microscopic elastic air-sacs wrapped in venous capillaries where physical gas diffusion processes operate." },
    { name: "Diaphragm Muscle", x: 50, y: 88, desc: "Strong dome muscle that contracts downwards to create a negative pressure vacuum during inhalation cycles." }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 500;
    let height = canvas.height = canvas.parentElement?.clientHeight || 450;

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const drawLungs = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Blackboard grid lines background
      ctx.strokeStyle = "rgba(255,255,255,0.015)";
      ctx.lineWidth = 1;
      const spacing = 18;
      for (let x = 0; x < width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Physics animation accumulator
      if (isBreathing) {
        phaseRef.current += (bpm / 60) * 0.045;
      }
      const scaleMultiplier = 1.05 + Math.sin(phaseRef.current) * 0.08;
      const isDrawingInFlow = Math.cos(phaseRef.current) > 0;

      const cx = width / 2;
      const cy = height / 2 - 20;

      // Draw expandable Diaphragm at bottom
      const diaY = cy + 130 + Math.sin(phaseRef.current) * 12;
      ctx.beginPath();
      ctx.moveTo(cx - 160, cy + 145);
      ctx.quadraticCurveTo(cx, diaY, cx + 160, cy + 145);
      ctx.strokeStyle = "#10b981"; // neon green
      ctx.lineWidth = 7;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw human rib cage outlines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 3;
      for (let r = 0; r < 5; r++) {
        const ry = cy - 25 + r * 28;
        const widthSpread = 95 + r * 15;
        // Right Rib elements
        ctx.beginPath();
        ctx.arc(cx + 15, ry, widthSpread, -Math.PI / 3, Math.PI / 45);
        ctx.stroke();
        // Left Rib elements
        ctx.beginPath();
        ctx.arc(cx - 15, ry, widthSpread, Math.PI + Math.PI / 3, Math.PI - Math.PI / 45, true);
        ctx.stroke();
      }

      // DRAW PULMONARY ORGAN LUNG LOBES (Expanding beautiful organic vector silhouettes)
      const lw = 70 * scaleMultiplier;
      const lh = 105 * scaleMultiplier;

      // Left lobe (visual page-right)
      const leftGrad = ctx.createRadialGradient(cx + 60, cy + 40, 10, cx + 60, cy + 40, lw * 1.3);
      leftGrad.addColorStop(0, "rgba(244, 63, 94, 0.4)"); // Neon Rose
      leftGrad.addColorStop(0.55, "rgba(244, 63, 94, 0.18)");
      leftGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = leftGrad;

      ctx.beginPath();
      ctx.ellipse(cx + 62, cy + 40, lw, lh, Math.PI / 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "rgba(244, 63, 94, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Right lobe (visual page-left)
      const rightGrad = ctx.createRadialGradient(cx - 60, cy + 40, 10, cx - 60, cy + 40, lw * 1.3);
      rightGrad.addColorStop(0, "rgba(244, 63, 94, 0.4)");
      rightGrad.addColorStop(0.55, "rgba(244, 63, 94, 0.18)");
      rightGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rightGrad;

      ctx.beginPath();
      ctx.ellipse(cx - 62, cy + 40, lw, lh, -Math.PI / 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "rgba(244, 63, 94, 0.75)";
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Main Trachea tube
      ctx.strokeStyle = "rgba(248, 250, 252, 0.65)";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy - 140);
      ctx.lineTo(cx, cy - 30);
      ctx.stroke();

      // Trachea cartilaginous ridges
      ctx.strokeStyle = "rgba(168, 85, 247, 0.5)"; // glow violet
      ctx.lineWidth = 2.5;
      for (let ty = cy - 125; ty < cy - 30; ty += 16) {
        ctx.beginPath();
        ctx.moveTo(cx - 8, ty);
        ctx.quadraticCurveTo(cx, ty + 3, cx + 8, ty);
        ctx.stroke();
      }

      // Bifurcated Bronchial splitting system (Neon Cyan glow)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
      ctx.lineWidth = 6.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy - 30);
      ctx.quadraticCurveTo(cx - 15, cy - 10, cx - 42, cy + 10);
      ctx.quadraticCurveTo(cx - 52, cy + 22, cx - 72, cy + 46);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy - 30);
      ctx.quadraticCurveTo(cx + 15, cy - 10, cx + 42, cy + 10);
      ctx.quadraticCurveTo(cx + 52, cy + 22, cx + 72, cy + 46);
      ctx.stroke();

      // Trace finer Bronchioles subdivisions
      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.lineWidth = 2;
      // Left branches
      ctx.beginPath();
      ctx.moveTo(cx - 42, cy + 10); ctx.lineTo(cx - 75, cy + 5); ctx.lineTo(cx - 90, cy + 12);
      ctx.moveTo(cx - 72, cy + 46); ctx.lineTo(cx - 102, cy + 62); ctx.lineTo(cx - 108, cy + 85);
      // Right branches
      ctx.moveTo(cx + 42, cy + 10); ctx.lineTo(cx + 75, cy + 5); ctx.lineTo(cx + 90, cy + 12);
      ctx.moveTo(cx + 72, cy + 46); ctx.lineTo(cx + 102, cy + 62); ctx.lineTo(cx + 108, cy + 85);
      ctx.stroke();

      // Gas flow particle generator inside lungs
      if (isBreathing && Math.random() < 0.22) {
        if (isDrawingInFlow) {
          // Blue/Cyan Oxygen inhalation particles entering
          particlesRef.current.push({
            x: cx,
            y: cy - 150,
            vx: 0,
            vy: 2.2 + Math.random() * 2,
            type: "o2",
            opacity: 1
          });
        } else {
          // Gold Carbon Dioxide gas waste flowing out
          particlesRef.current.push({
            x: cx - 45 + Math.random() * 90,
            y: cy + 15 + Math.random() * 45,
            vx: (Math.random() - 0.5) * 1.8,
            vy: -2.8 - Math.random() * 1.2,
            type: "co2",
            opacity: 1
          });
        }
      }

      // Update gas transport coordinates
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.0075;

        if (p.type === "o2") {
          if (p.y > cy - 30 && p.vx === 0) {
            p.vx = Math.random() < 0.5 ? -2 : 2;
            p.vy = 1;
          }
          ctx.fillStyle = "#06b6d4"; // blue
          ctx.shadowColor = "#06b6d4";
        } else {
          // Carbon Dioxide flows out tracheal windpipe
          if (p.y < cy - 30) {
            p.x += (cx - p.x) * 0.16;
            p.vx = 0;
            p.vy = -3.8;
          }
          ctx.fillStyle = "#f59e0b"; // gold
          ctx.shadowColor = "#f59e0b";
        }

        ctx.beginPath();
        ctx.shadowBlur = 5;
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Filter faded particles
      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0 && p.y > cy - 160 && p.y < cy + 150);

      // Render Anchor hotzones
      labels.forEach(lbl => {
        const lx = (lbl.x / 100) * width;
        const ly = (lbl.y / 100) * height;
        const isHovered = activeLabel === lbl.name;

        ctx.beginPath();
        ctx.arc(lx, ly, isHovered ? 13 : 8, 0, 2 * Math.PI);
        ctx.fillStyle = isHovered ? "rgba(168, 85, 247, 0.45)" : "rgba(6, 182, 212, 0.25)";
        ctx.strokeStyle = isHovered ? "#a855f7" : "#06b6d4";
        ctx.lineWidth = 1.8;
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 9.5px 'JetBrains Mono', Courier, monospace";
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255,255,255,0.75)";
        ctx.fillText(lbl.name, lx + 14, ly + 3);
      });

      // Air flow HUD metrics
      ctx.font = "bold 10.5px 'JetBrains Mono', Courier, monospace";
      ctx.fillStyle = isDrawingInFlow ? "#06b6d4" : "#f43f5e";
      ctx.fillText(`RESPIRATION AIR FLOW: ${isDrawingInFlow ? "▼ INHALATION (FILTRATING OXY-DOTS)" : "▲ EXHALATION (DISCHARGING CO₂)"}`, 24, 25);

      animationRef.current = requestAnimationFrame(drawLungs);
    };

    drawLungs();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [bpm, isBreathing, activeLabel]);

  const handleLungsClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cw = canvas.width;
    const ch = canvas.height;

    let matchFound = false;
    labels.forEach(lbl => {
      const lx = (lbl.x / 100) * cw;
      const ly = (lbl.y / 100) * ch;
      const dist = Math.sqrt((mx - lx)**2 + (my - ly)**2);
      if (dist < 18) {
        setActiveLabel(lbl.name);
        matchFound = true;
      }
    });
    if (!matchFound) setActiveLabel(null);
  };

  const currentDesc = labels.find(l => l.name === activeLabel)?.desc;

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-auto h-full w-full bg-[#020206]">
      <div className="flex-1 relative h-0">
        <canvas
          ref={canvasRef}
          onClick={handleLungsClick}
          className="absolute inset-0 w-full h-full cursor-pointer"
        />

        {/* Info detail overlay panel */}
        <div className="absolute bottom-4 left-4 right-4 p-4.5 rounded-2xl border border-white/5 bg-[#030308]/90 backdrop-blur-xl pointer-events-auto shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <h4 className="font-sans font-black text-white text-sm flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
                {activeLabel ? activeLabel : "🔬 Interactive Respiratory Anatomy Lab"}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                {currentDesc 
                  ? currentDesc 
                  : "Interactive physical biology simulator. Point and click on the glowing anatomical hotspot targets on the chalkboard lung lobes to explore tracheal tubes, respiration structures, and oxygenation systems."
                }
              </p>
            </div>

            {/* Speeds */}
            <div className="flex items-center gap-5 shrink-0">
              <div className="flex flex-col">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1">Breathing Speed</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="6"
                    max="35"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="accent-purple-500 h-1.5 w-24 bg-white/10 rounded-lg cursor-ew-resize appearance-none"
                  />
                  <span className="text-xs text-purple-300 font-mono w-12 font-bold">{bpm} BPM</span>
                </div>
              </div>

              <button
                onClick={() => setIsBreathing(!isBreathing)}
                className={`px-3.5 py-1.5 text-xs font-bold font-mono rounded-xl border transition cursor-pointer ${
                  isBreathing 
                    ? "bg-purple-500/15 border-purple-500/30 text-purple-400" 
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {isBreathing ? "Pause Motion" : "Resume Breath"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   🪞 PHYSICS LAB: DYNAMIC OPTICS LIGHT & MIRRORS SIMULATOR
   ========================================================================= */
function MirrorSimulation() {
  const [mirrorType, setMirrorType] = useState<"concave" | "convex" | "plane">("concave");
  const [objectDistance, setObjectDistance] = useState<number>(200); // from mirror axis
  const [objectHeight, setObjectHeight] = useState<number>(85);
  const [focalLength, setFocalLength] = useState<number>(120);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 500;
    let height = canvas.height = canvas.parentElement?.clientHeight || 450;

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const drawOptics = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const cy = height / 2;
      const mirrorX = width - 150; // Position of mirror boundary

      // Blackboard grid backing
      ctx.strokeStyle = "rgba(255,255,255,0.015)";
      ctx.lineWidth = 1;
      const stepValue = 18;
      for (let x = 0; x < width; x += stepValue) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += stepValue) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Principal axis line
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(30, cy);
      ctx.lineTo(width - 30, cy);
      ctx.stroke();
      ctx.setLineDash([]); // clear dash

      // Light Reflection math formulas
      let di = 0;
      let m = 1;
      let realF = focalLength;
      let orientationState = "Concave Focus";

      if (mirrorType === "plane") {
        di = -objectDistance;
        m = 1;
        orientationState = "Virtual, Upright & Identical Size";
      } else if (mirrorType === "convex") {
        realF = -focalLength; // Convex mirror has negative focal length
        di = 1 / (1 / realF - 1 / objectDistance);
        m = -di / objectDistance;
        orientationState = "Virtual, Upright & Reduced Size";
      } else {
        // Concave mirror formulas (1/f = 1/do + 1/di)
        realF = focalLength;
        const doValue = objectDistance;
        if (doValue === realF) {
          di = Infinity;
          m = -Infinity;
          orientationState = "Image formed at Infinity";
        } else {
          di = 1 / (1 / realF - 1 / doValue);
          m = -di / doValue;
          if (di < 0) {
            orientationState = "Virtual, Upright & Magnified";
          } else {
            orientationState = "Real, Inverted & " + (Math.abs(m) > 1 ? "Magnified" : "Reduced");
          }
        }
      }

      const FX = mirrorX - realF;
      const CX = mirrorX - (2 * realF);

      // Draw Focus target point F & Curvature point C
      if (mirrorType !== "plane") {
        ctx.beginPath();
        ctx.arc(FX, cy, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = "#a855f7"; // violet
        ctx.fill();
        ctx.font = "bold 9.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#a855f7";
        ctx.fillText("F (Focal Point)", FX - 30, cy - 14);

        if (mirrorType === "concave") {
          ctx.beginPath();
          ctx.arc(CX, cy, 5.5, 0, 2 * Math.PI);
          ctx.fillStyle = "#06b6d4"; // cyan
          ctx.fill();
          ctx.fillStyle = "#06b6d4";
          ctx.fillText("C (Curvature Center = 2F)", CX - 50, cy - 14);
        }
      }

      // Draw physical Mirror outline on the chalkboard
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(248, 250, 252, 0.4)";
      ctx.shadowColor = "#f8fafc";
      ctx.shadowBlur = 4;
      ctx.beginPath();

      if (mirrorType === "plane") {
        ctx.moveTo(mirrorX, cy - 150);
        ctx.lineTo(mirrorX, cy + 150);
        ctx.stroke();
      } else if (mirrorType === "concave") {
        ctx.arc(mirrorX + 105, cy, 185, Math.PI - 0.45, Math.PI + 0.45);
        ctx.stroke();
      } else {
        ctx.arc(mirrorX - 105, cy, 185, -0.45, 0.45);
        ctx.stroke();
      }
      ctx.shadowBlur = 0; // stop glow

      // Draw original Candle Object (Gold vector lines)
      const oX = mirrorX - objectDistance;
      const oY = cy - objectHeight;

      ctx.strokeStyle = "#f59e0b"; // Gold
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(oX, cy);
      ctx.lineTo(oX, oY);
      ctx.stroke();

      // Flame tip circle
      ctx.beginPath();
      ctx.arc(oX, oY - 6, 7.5, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(245, 158, 11, 0.85)";
      ctx.fill();

      // Object label header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px 'JetBrains Mono', Courier, monospace";
      ctx.fillText("CANDLE OBJECT", oX - 35, oY - 18);

      // Draw resulting reflecting Image (Mint color)
      const imX = mirrorX - di;
      const imY = cy + (objectHeight * m);

      if (Number.isFinite(di)) {
        ctx.strokeStyle = "#10b981"; // mint green
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(imX, cy);
        ctx.lineTo(imX, imY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(imX, imY + (m < 0 ? 5 : -5), 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
        ctx.fill();

        ctx.fillStyle = "#10b981";
        ctx.font = "bold 9px 'JetBrains Mono', Courier, monospace";
        ctx.fillText("FORMED IMAGE", imX - 35, imY + (m < 0 ? 16 : -16));
      }

      // DRAW WAVEFRONT PHYSICAL RAY TRACES (In glowing colors)
      if (mirrorType !== "plane" && Number.isFinite(di)) {
        // Parallel Incident & Reflected Ray (Cyan)
        ctx.strokeStyle = "rgba(6, 182, 212, 0.65)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(oX, oY);
        ctx.lineTo(mirrorX, oY);
        ctx.lineTo(mirrorX - realF, cy); // reflects through focus
        ctx.lineTo(imX, imY);
        ctx.stroke();

        // Focal Incident & Reflected Ray (Rose)
        ctx.strokeStyle = "rgba(244, 63, 94, 0.65)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(oX, oY);
        ctx.lineTo(mirrorX - realF, cy); // passes through focus
        ctx.lineTo(mirrorX, imY); // hits mirror
        ctx.lineTo(imX, imY); // parallel exit
        ctx.stroke();

        // Center of Curvature Ray (Purple)
        if (mirrorType === "concave") {
          ctx.strokeStyle = "rgba(168, 85, 247, 0.55)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(oX, oY);
          ctx.lineTo(CX, cy); // center curvature line
          ctx.lineTo(imX, imY);
          ctx.stroke();
        }
      } else if (mirrorType === "plane") {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.65)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(oX, oY);
        ctx.lineTo(mirrorX, oY);
        ctx.lineTo(oX, cy + objectHeight); // reflects same angle
        ctx.stroke();

        // virtual dot line
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(mirrorX, oY);
        ctx.lineTo(imX, imY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw real-time variables table on screen
      ctx.font = "10px 'JetBrains Mono', Courier, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`Optics Formula: 1 / f = 1 / d_o + 1 / d_i`, 25, 40);
      ctx.fillText(`Magnification : m   = -d_i / d_o`, 25, 55);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'JetBrains Mono', Courier, monospace";
      ctx.fillText(`GEOMETRICAL CALIBRATION HUD:`, 25, height - 70);
      ctx.font = "10px 'JetBrains Mono', Courier, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`Focal Length (f)      : ${mirrorType === "plane" ? "Infinity" : realF + " px"}`, 25, height - 52);
      ctx.fillText(`Object Distance (d_o) : ${objectDistance} px`, 25, height - 37);
      ctx.fillText(`Image Distance (d_i)  : ${Number.isFinite(di) ? di.toFixed(1) + " px" : "Infinity"}`, 25, height - 22);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 10px 'JetBrains Mono', Courier, monospace";
      ctx.fillText(`Image Character : ${orientationState}`, 25, height - 90);
    };

    drawOptics();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [mirrorType, objectDistance, objectHeight, focalLength]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cy = canvas.height / 2;
    const mirrorX = canvas.width - 150;

    const dragDistance = Math.max(15, Math.min(canvas.width - 250, mirrorX - mx));
    const dragHeight = Math.max(10, Math.min(170, cy - my));

    setObjectDistance(Math.round(dragDistance));
    setObjectHeight(Math.round(dragHeight));
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-auto h-full w-full bg-[#020206]">
      {/* Mirror controls bar */}
      <div className="px-5 py-2.5 border-b border-white/5 bg-[#030308]/40 shrink-0 flex flex-wrap items-center justify-between pointer-events-auto gap-4">
        <div className="flex gap-1.5">
          {(["concave", "convex", "plane"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMirrorType(type)}
              className={`px-3 py-1.5 text-xs font-mono capitalize rounded-xl border transition cursor-pointer ${
                mirrorType === type 
                  ? "bg-purple-500/15 border-purple-500/30 text-purple-300" 
                  : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {type} Mirror
            </button>
          ))}
        </div>

        {mirrorType !== "plane" && (
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-slate-400">f-length (f):</span>
            <input
              type="range"
              min="50"
              max="180"
              value={focalLength}
              onChange={(e) => setFocalLength(Number(e.target.value))}
              className="accent-purple-500 h-1.5 w-24 bg-white/10 rounded-lg cursor-ew-resize appearance-none"
            />
            <span className="text-xs font-mono text-purple-300 font-bold">{focalLength}px</span>
          </div>
        )}
      </div>

      <div className="flex-grow relative h-0">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onTouchStart={() => setIsDragging(true)}
          onTouchMove={(e) => {
            if (!isDragging) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const mx = touch.clientX - rect.left;
            const my = touch.clientY - rect.top;
            const cy = canvas.height / 2;
            const mirrorX = canvas.width - 150;
            setObjectDistance(Math.round(Math.max(15, Math.min(canvas.width - 250, mirrorX - mx))));
            setObjectHeight(Math.round(Math.max(10, Math.min(170, cy - my))));
          }}
          onTouchEnd={stopDragging}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        />

        <div className="absolute top-4 right-4 pointer-events-none p-3.5 rounded-2xl border border-white/5 bg-slate-950/80 backdrop-blur-md">
          <p className="text-[10px] font-mono text-slate-350 leading-relaxed max-w-[280px]">🗣️ DRAG the orange candle to adjust placement distance and scale! Traced light rays recalculate reflections automatically in real-time.</p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   🪐 COSMOLOGY LAB: ORBITAL NEWTON GRAVITY SIMULATOR
   ========================================================================= */
function GravitySimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [mass, setMass] = useState<number>(3000);
  const [trailCount, setTrailCount] = useState<number>(100);

  const satRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    trail: Array<{x: number, y: number}>;
  }>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    trail: []
  });

  const launchSatellite = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    satRef.current = {
      x: cx,
      y: cy - 110,
      vx: 4.8, // horizontal orbit launch vector
      vy: 0,
      trail: []
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 500;
    let height = canvas.height = canvas.parentElement?.clientHeight || 450;

    launchSatellite(width, height);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      launchSatellite(width, height);
    };
    window.addEventListener("resize", handleResize);

    const loop = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Blackboard subtle grids
      ctx.strokeStyle = "rgba(255,255,255,0.015)";
      ctx.lineWidth = 1;
      const spacing = 18;
      for (let x = 0; x < width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Kepler gravitational calculus
      const sat = satRef.current;
      const dx = cx - sat.x;
      const dy = cy - sat.y;
      const distSqr = dx*dx + dy*dy;
      const distance = Math.sqrt(distSqr);

      // Force (F = G * M * m / r^2)
      const G = 0.04;
      const forceMag = (G * mass) / Math.max(100, distSqr);

      const fx = (dx / distance) * forceMag;
      const fy = (dy / distance) * forceMag;

      sat.vx += fx;
      sat.vy += fy;

      sat.x += sat.vx * 0.98;
      sat.y += sat.vy * 0.98;

      if (!sat.trail || !Array.isArray(sat.trail)) {
        sat.trail = [];
      }
      sat.trail.push({ x: sat.x, y: sat.y });
      if (sat.trail.length > trailCount) {
        sat.trail.shift();
      }

      // Draw Orbit Trails (Cyan tracing)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      sat.trail.forEach((pos, idx) => {
        if (idx === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      });
      ctx.stroke();

      // DRAW CENTRAL STAR (Heavy sun halo)
      const sunGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 32);
      sunGrad.addColorStop(0, "#f59e0b"); // glowing gold
      sunGrad.addColorStop(0.3, "rgba(244, 63, 94, 0.9)");
      sunGrad.addColorStop(0.7, "rgba(168, 85, 247, 0.4)");
      sunGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 9px 'JetBrains Mono', Courier, monospace";
      ctx.fillText("☀️ DEEP STAR SYNC", cx - 45, cy - 38);

      // DRAW ORBITING PLANET (Cyan core)
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, 9, 0, 2 * Math.PI);
      ctx.fillStyle = "#06b6d4";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#06b6d4";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw vector lines (Red is pulling force, Green is speed vector)
      ctx.strokeStyle = "#f43f5e"; // Gravity pull vector
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sat.x, sat.y);
      ctx.lineTo(sat.x + (dx/distance) * 40, sat.y + (dy/distance) * 40);
      ctx.stroke();

      ctx.strokeStyle = "#10b981"; // Velocity vector
      ctx.beginPath();
      ctx.moveTo(sat.x, sat.y);
      const speedMag = Math.sqrt(sat.vx**2 + sat.vy**2);
      ctx.lineTo(sat.x + (sat.vx/speedMag) * 30, sat.y + (sat.vy/speedMag) * 30);
      ctx.stroke();

      // Vector labels
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#f43f5e";
      ctx.fillText("F_gravity", sat.x + (dx/distance)*45 - 12, sat.y + (dy/distance)*45);
      ctx.fillStyle = "#10b981";
      ctx.fillText("V_orbital", sat.x + (sat.vx/speedMag)*35 - 20, sat.y + (sat.vy/speedMag)*35);

      // Print live astrophysics variables on chalkboard
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px 'JetBrains Mono', Courier, monospace";
      ctx.fillText(`Orbit Dist : ${distance.toFixed(1)} km`, 25, 40);
      ctx.fillText(`Orbit Velocity: ${speedMag.toFixed(2)} mach`, 25, 55);
      ctx.fillText(`Newtonian Formula: F = G * (M * m) / r²`, 25, 70);

      animationRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mass, trailCount]);

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-auto h-full w-full bg-[#020206]">
      {/* Gravity controls bar */}
      <div className="px-5 py-2.5 border-b border-white/5 bg-[#030308]/40 shrink-0 flex flex-wrap items-center justify-between pointer-events-auto gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">Star Gravity:</span>
            <input
              type="range"
              min="1000"
              max="9000"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              className="accent-purple-500 h-1.5 w-24 bg-white/10 rounded-lg cursor-ew-resize appearance-none"
            />
            <span className="text-xs font-mono text-purple-300 font-bold">{mass}M</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">Path Trails:</span>
            <input
              type="range"
              min="10"
              max="300"
              value={trailCount}
              onChange={(e) => setTrailCount(Number(e.target.value))}
              className="accent-purple-500 h-1.5 w-24 bg-white/10 rounded-lg cursor-ew-resize appearance-none"
            />
            <span className="text-xs font-mono text-purple-300 font-bold">{trailCount} pts</span>
          </div>
        </div>

        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) launchSatellite(canvas.width, canvas.height);
          }}
          className="px-3.5 py-1.5 bg-white/5 border border-white/15 hover:bg-white/10 text-white font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw size={11} className="animate-spin-slow" />
          <span>Fling Launch</span>
        </button>
      </div>

      <div className="flex-grow relative h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute top-4 right-4 pointer-events-none p-4 rounded-xl border border-white/5 bg-slate-950/80 backdrop-blur-md">
          <p className="text-[10px] font-mono text-slate-355 leading-normal max-w-[280px]">🪐 Gravity Orbit sandbox! Watch Kepler elliptical loops or adjust Star Gravity parameters to trigger space slinging velocities!</p>
        </div>
      </div>
    </div>
  );
}

export function Chalkboard({
  isOpen,
  onClose,
  text,
  onTextChange,
  diagramType,
  statusAlert,
  activeMode,
  setActiveMode,
  themeColor,
  drawings,
  clearCounter,
  customModelData,
  memories = [],
  onTriggerSaveSimulation,
  voiceSketchTriggerText,
  onClearVoiceSketchTrigger,
  onAskMahr,
  onAskMyraa,
  onVoiceToMindMap,
  onUpdateDrawings,
  initialSlidesTopic
}: ChalkboardProps) {
  const handleAskTutor = onAskMahr || onAskMyraa;
  // Visual Slate Auto-Deduplication Background Tool State
  const [isSlateDeduplicatorActive, setIsSlateDeduplicatorActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("myraa_chalkboard_auto_deduplicate");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [deduplicationReport, setDeduplicationReport] = useState<DeduplicationReport | null>(null);
  const [showDeduplicatorModal, setShowDeduplicatorModal] = useState<boolean>(false);
  const [slateDeduplicationToast, setSlateDeduplicationToast] = useState<string | null>(null);
  const lastDeduplicatedFingerprintRef = useRef<string>("");

  const isSlidesInitial = diagramType.toLowerCase().includes("slide") || diagramType.toLowerCase().includes("presentation") || diagramType.toLowerCase().includes("ppt");
  const isMindMapInitial = !isSlidesInitial && (diagramType.toLowerCase().includes("mind") || diagramType.toLowerCase().includes("map"));
  const isFlowchartInitial = !isSlidesInitial && !isMindMapInitial && (diagramType === "flowchart");
  const [chalkboardEngineMode, setChalkboardEngineMode] = useState<string>(
    isSlidesInitial
      ? "slides"
      : isMindMapInitial
      ? "mindmap"
      : isFlowchartInitial
      ? "flowchart"
      : diagramType === "simulation" || diagramType === "ai-simulation" || diagramType === "runtime-engine"
      ? "3d-simulation"
      : diagramType === "dld" || diagramType === "logic" || diagramType === "digital-logic"
      ? "dld-logic"
      : "chalkboard"
  );
  const [simulationInitialMode, setSimulationInitialMode] = useState<"2d-liquid" | "3d-webgl" | "dld-logic">(
    diagramType === "simulation" || diagramType === "ai-simulation" || diagramType === "runtime-engine"
      ? "3d-webgl"
      : diagramType === "dld" || diagramType === "logic" || diagramType === "digital-logic"
      ? "dld-logic"
      : "2d-liquid"
  );
  const [showAiSimulation, setShowAiSimulation] = useState<boolean>(
    diagramType === "simulation" || diagramType === "ai-simulation" || diagramType === "runtime-engine" || diagramType === "dld" || diagramType === "logic" || diagramType === "digital-logic"
  );
  const [showFlowchartCanvas, setShowFlowchartCanvas] = useState<boolean>(isFlowchartInitial);
  const [showMindMapCanvas, setShowMindMapCanvas] = useState<boolean>(isMindMapInitial);
  const [showSlidesCanvas, setShowSlidesCanvas] = useState<boolean>(isSlidesInitial);
  const [activeFlowchartPresetId, setActiveFlowchartPresetId] = useState<string>("order-fraud-trigger");
  const [activeSlidesTopic, setActiveSlidesTopic] = useState<string>(initialSlidesTopic || "");

  useEffect(() => {
    if (diagramType.toLowerCase().includes("slide") || diagramType.toLowerCase().includes("presentation") || diagramType.toLowerCase().includes("ppt")) {
      setChalkboardEngineMode("slides");
      setShowSlidesCanvas(true);
      setShowMindMapCanvas(false);
      setShowFlowchartCanvas(false);
      setShowAiSimulation(false);
    } else if (diagramType.toLowerCase().includes("mind") || diagramType.toLowerCase().includes("map")) {
      setChalkboardEngineMode("mindmap");
      setShowMindMapCanvas(true);
      setShowFlowchartCanvas(false);
      setShowAiSimulation(false);
      setShowSlidesCanvas(false);
    } else if (diagramType === "simulation" || diagramType === "ai-simulation" || diagramType === "runtime-engine") {
      setChalkboardEngineMode("3d-simulation");
      setSimulationInitialMode("3d-webgl");
      setShowAiSimulation(true);
      setShowFlowchartCanvas(false);
      setShowMindMapCanvas(false);
      setShowSlidesCanvas(false);
    } else if (diagramType === "dld" || diagramType === "logic" || diagramType === "digital-logic") {
      setChalkboardEngineMode("dld-logic");
      setSimulationInitialMode("dld-logic");
      setShowAiSimulation(true);
      setShowFlowchartCanvas(false);
      setShowMindMapCanvas(false);
      setShowSlidesCanvas(false);
    } else if (diagramType === "flowchart") {
      setChalkboardEngineMode("flowchart");
      setShowFlowchartCanvas(true);
      setShowAiSimulation(false);
      setShowMindMapCanvas(false);
      setShowSlidesCanvas(false);
    }
  }, [diagramType]);

  useEffect(() => {
    if (initialSlidesTopic) {
      setActiveSlidesTopic(initialSlidesTopic);
    }
  }, [initialSlidesTopic]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [color, setColor] = useState<string>("#06b6d4"); // defaults to glowing cyan
  const [brushSize, setBrushSize] = useState<number>(4);
  const [tool, setTool] = useState<"pen" | "smartpen" | "line" | "arrow" | "eraser" | "pan">("pen");
  const [activeBrushProfile, setActiveBrushProfileState] = useState<BrushProfile>(BRUSH_PROFILES[0]); // Default to Calligraphy Pen
  const activeBrushProfileRef = useRef<BrushProfile>(BRUSH_PROFILES[0]);
  const setActiveBrushProfile = useCallback((prof: BrushProfile) => {
    activeBrushProfileRef.current = prof;
    setActiveBrushProfileState(prof);
  }, []);

  const [showUtilityDrawer, setShowUtilityDrawer] = useState<boolean>(false);
  const [showAIImageModal, setShowAIImageModal] = useState<boolean>(false);
  const [isMahrVoiceCompanionOpen, setIsMahrVoiceCompanionOpen] = useState<boolean>(false);

  const handleSelectEngineMode = useCallback((mode: string) => {
    setChalkboardEngineMode(mode);
    if (mode === "slides") {
      setShowSlidesCanvas(true);
      setShowMindMapCanvas(false);
      setShowFlowchartCanvas(false);
      setShowAiSimulation(false);
    } else if (mode === "mindmap") {
      setShowMindMapCanvas(true);
      setShowSlidesCanvas(false);
      setShowFlowchartCanvas(false);
      setShowAiSimulation(false);
    } else if (mode === "flowchart") {
      setShowFlowchartCanvas(true);
      setShowSlidesCanvas(false);
      setShowMindMapCanvas(false);
      setShowAiSimulation(false);
    } else if (mode === "3d-simulation" || mode === "2d-fluid") {
      setShowAiSimulation(true);
      setSimulationInitialMode(mode === "2d-fluid" ? "2d-liquid" : "3d-webgl");
      setShowSlidesCanvas(false);
      setShowMindMapCanvas(false);
      setShowFlowchartCanvas(false);
    } else if (mode === "dld") {
      setShowAiSimulation(true);
      setSimulationInitialMode("dld-logic");
      setShowSlidesCanvas(false);
      setShowMindMapCanvas(false);
      setShowFlowchartCanvas(false);
    } else {
      // "chalkboard"
      setShowSlidesCanvas(false);
      setShowMindMapCanvas(false);
      setShowFlowchartCanvas(false);
      setShowAiSimulation(false);
    }
  }, []);

  const [gridType, setGridType] = useState<"none" | "dot-grid" | "graph-paper" | "isometric" | "blueprint">("dot-grid");
  const [showGridMenu, setShowGridMenu] = useState<boolean>(false);
  const [isAudioFeedbackEnabled, setIsAudioFeedbackEnabledState] = useState<boolean>(true);
  const setIsAudioFeedbackEnabled = useCallback((enabled: boolean) => {
    setIsAudioFeedbackEnabledState(enabled);
    setChalkSoundEnabled(enabled);
  }, []);

  const [showBrushProfilesModal, setShowBrushProfilesModal] = useState<boolean>(false);
  const [showBrushQuickMenu, setShowBrushQuickMenu] = useState<boolean>(false);
  const [isDrawing, setIsDrawingState] = useState<boolean>(false);
  const isDrawingRef = useRef<boolean>(false);

  const setIsDrawing = useCallback((val: boolean) => {
    isDrawingRef.current = val;
    setIsDrawingState(val);
  }, []);

  // Smart Pen & Vector Auto-Correction States & Refs
  const smartPenPointsRef = useRef<Point[]>([]);
  const smartPenStartSnapshotRef = useRef<ImageData | null>(null);
  const [smartPenToast, setSmartPenToast] = useState<string | null>(null);
  const smartPenHoldTimerRef = useRef<any>(null);
  const lastHoldPosRef = useRef<{ x: number; y: number } | null>(null);
  const isHoldRefinedRef = useRef<boolean>(false);

  // Velocity-based Pressure Sensitivity & Smooth Path Interpolation Refs
  const lastDrawTimeRef = useRef<number>(0);
  const currentLineWidthRef = useRef<number>(4);
  const strokePointsQueueRef = useRef<{ x: number; y: number; pressure?: number; width?: number }[]>([]);

  // Real-time Stylus / Pointer Pressure Dynamics HUD State
  const [showPressureHUD, setShowPressureHUD] = useState<boolean>(true);
  const [livePressureTelemetry, setLivePressureTelemetry] = useState<{
    pressure: number;
    width: number;
    opacity: number;
    pointerType: string;
  } | null>(null);
  const lastTelemetryUpdateRef = useRef<number>(0);

  // Playback Feature States & Refs
  interface RecordedStroke {
    id: string;
    type?: "draw" | "erase" | "shape" | "pan_zoom" | "voice_sketch" | "clear";
    tool: string;
    color: string;
    brushSize: number;
    shapeResult?: ShapeRecognitionResult;
    points?: Point[];
    commands?: any[];
    viewport?: { zoom: number; panX: number; panY: number };
    description?: string;
    dataUrl?: string;
    name: string;
    timestamp: number;
  }

  const [recordedStrokes, setRecordedStrokes] = useState<RecordedStroke[]>([]);
  const recordedStrokesRef = useRef<RecordedStroke[]>([]);
  useEffect(() => {
    recordedStrokesRef.current = recordedStrokes;
  }, [recordedStrokes]);

  const resetStrokeCounter = useCallback(() => {
    setRecordedStrokes([]);
    recordedStrokesRef.current = [];
    setPlaybackStep(0);
    setIsPlaybackPlaying(false);
    setIsPlaybackMode(false);
    dbRemove("myraa_chalkboard_strokes").catch(() => {});
    setSmartPenToast("🔄 Recorded action timeline reset to 0!");
    setTimeout(() => setSmartPenToast(null), 3000);
  }, []);

  const playbackBackupRef = useRef<{ id: string; dataUrl: string }[] | null>(null);

  const [isPlaybackMode, setIsPlaybackMode] = useState<boolean>(false);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState<boolean>(false);
  const [playbackStep, setPlaybackStep] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const playbackTimerRef = useRef<any>(null);

  // Zooming & Panning interactive states and references
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoomState] = useState<number>(1);
  const [panX, setPanXState] = useState<number>(0);
  const [panY, setPanYState] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const zoomRef = useRef<number>(1);
  const panXRef = useRef<number>(0);
  const panYRef = useRef<number>(0);
  const isPanningRef = useRef<boolean>(false);

  const setZoom = (val: number | ((prev: number) => number)) => {
    setZoomState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      zoomRef.current = next;
      return next;
    });
  };

  const setPanX = (val: number | ((prev: number) => number)) => {
    setPanXState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      panXRef.current = next;
      return next;
    });
  };

  const setPanY = (val: number | ((prev: number) => number)) => {
    setPanYState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      panYRef.current = next;
      return next;
    });
  };

  const setIsPanningWithRef = (val: boolean) => {
    setIsPanning(val);
    isPanningRef.current = val;
  };

  const startPanMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const smoothedPressureRef = useRef<number>(0.5);
  const smoothedPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const pendingRedrawFrameRef = useRef<number | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const z = zoomRef.current;
    const px = panXRef.current;
    const py = panYRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid patterns
    if (gridType !== "none") {
      ctx.save();
      const step = Math.max(20, 40 * z);
      const offsetX = ((px % step) + step) % step;
      const offsetY = ((py % step) + step) % step;

      if (gridType === "dot-grid") {
        ctx.fillStyle = "rgba(148, 163, 184, 0.25)";
        const dotRadius = Math.max(0.75, Math.min(2, 1.2 * z));
        for (let x = offsetX; x < canvas.width; x += step) {
          for (let y = offsetY; y < canvas.height; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (gridType === "graph-paper") {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = offsetX; x < canvas.width; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
        }
        for (let y = offsetY; y < canvas.height; y += step) {
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();

        // Major axis grid lines every 4 units
        const majorStep = step * 4;
        const majorOffsetX = ((px % majorStep) + majorStep) % majorStep;
        const majorOffsetY = ((py % majorStep) + majorStep) % majorStep;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
        ctx.beginPath();
        for (let x = majorOffsetX; x < canvas.width; x += majorStep) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
        }
        for (let y = majorOffsetY; y < canvas.height; y += majorStep) {
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      } else if (gridType === "isometric") {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
        ctx.lineWidth = 1;
        const tanIso = 0.577; // tan(30 deg)
        ctx.beginPath();
        for (let x = offsetX - canvas.height * tanIso; x < canvas.width + canvas.height * tanIso; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x + canvas.height * tanIso, canvas.height);
          ctx.moveTo(x + canvas.height * tanIso, 0);
          ctx.lineTo(x, canvas.height);
        }
        for (let y = offsetY; y < canvas.height; y += step * 0.866) {
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      } else if (gridType === "blueprint") {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = offsetX; x < canvas.width; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
        }
        for (let y = offsetY; y < canvas.height; y += step) {
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(z, z);

    layersRef.current.forEach((layer) => {
      if (layer.visible && layer.opacity > 0) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        const bx = layer.bounds?.x || 0;
        const by = layer.bounds?.y || 0;
        ctx.drawImage(layer.canvas, bx, by);
        ctx.restore();
      }
    });

    ctx.restore();
  }, [gridType]);

  const scheduleRedraw = useCallback(() => {
    if (pendingRedrawFrameRef.current !== null) return;
    pendingRedrawFrameRef.current = requestAnimationFrame(() => {
      pendingRedrawFrameRef.current = null;
      redraw();
    });
  }, [redraw]);

  const ensureLayerBounds = useCallback((layer: CanvasLayer, worldX: number, worldY: number) => {
    if (!layer.bounds) {
      layer.bounds = {
        x: 0,
        y: 0,
        width: Math.max(2560, layer.canvas.width || 2560),
        height: Math.max(1440, layer.canvas.height || 1440)
      };
    }
    const b = layer.bounds;
    const padding = 1000;
    const isOutside =
      worldX < b.x + 50 ||
      worldX > b.x + b.width - 50 ||
      worldY < b.y + 50 ||
      worldY > b.y + b.height - 50;

    if (isOutside) {
      const minX = Math.floor(Math.min(b.x, worldX - padding));
      const minY = Math.floor(Math.min(b.y, worldY - padding));
      const maxX = Math.ceil(Math.max(b.x + b.width, worldX + padding));
      const maxY = Math.ceil(Math.max(b.y + b.height, worldY + padding));
      const newW = Math.min(8192, maxX - minX);
      const newH = Math.min(8192, maxY - minY);

      const newCanvas = document.createElement("canvas");
      newCanvas.width = newW;
      newCanvas.height = newH;
      const nCtx = newCanvas.getContext("2d");
      if (nCtx) {
        nCtx.drawImage(layer.canvas, b.x - minX, b.y - minY);
      }
      layer.canvas = newCanvas;
      layer.bounds = { x: minX, y: minY, width: newW, height: newH };
    }
  }, []);

  // Redraw when scale or offset parameters alter
  useEffect(() => {
    redraw();
  }, [zoom, panX, panY, redraw]);

  // Connection snapping and preview refs
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const startSnappedShapeRef = useRef<any | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);

  // Snapping helper methods
  const findNearestSnapShape = (x: number, y: number, canvas: HTMLCanvasElement) => {
    if (!drawings || drawings.length === 0) return null;
    const w = canvas.width;
    const h = canvas.height;

    let closestShape: any = null;
    let minDist = 45; // pixel snapping radius threshold

    drawings.forEach((cmd) => {
      const typeLower = cmd.type?.toLowerCase();
      if (!["rect", "roundrect", "diamond", "rhombus", "circle", "oval", "ellipse"].includes(typeLower)) {
        return;
      }

      // Compute shape center in pixels
      let cx = 0;
      let cy = 0;
      let shapeW = 12;
      let shapeH = 6;

      if (typeLower === "circle") {
        cx = (cmd.x1 / 100) * w;
        cy = (cmd.y1 / 100) * h;
        const rad = cmd.x2 !== undefined ? Math.abs(cmd.x2 - cmd.x1) : 2.5;
        shapeW = rad * 2;
        shapeH = rad * 2;
      } else {
        const sx1 = (cmd.x1 / 100) * w;
        const sy1 = (cmd.y1 / 100) * h;
        const sx2 = cmd.x2 !== undefined ? (cmd.x2 / 100) * w : sx1;
        const sy2 = cmd.y2 !== undefined ? (cmd.y2 / 100) * h : sy1;

        cx = (sx1 + sx2) / 2;
        cy = (sy1 + sy2) / 2;
        shapeW = Math.abs(cmd.x2 - cmd.x1) || 12;
        shapeH = Math.abs(cmd.y2 - cmd.y1) || 6;
      }

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        closestShape = {
          cmd,
          cx,
          cy,
          w: (shapeW / 100) * w,
          h: (shapeH / 100) * h,
          type: typeLower
        };
      }
    });

    return closestShape;
  };

  const getShapeSnapPoint = (shape: any, targetX: number, targetY: number) => {
    const phi = Math.atan2(targetY - shape.cy, targetX - shape.cx);
    const dx = Math.cos(phi);
    const dy = Math.sin(phi);
    const W = shape.w / 2;
    const H = shape.h / 2;

    if (shape.type === "circle") {
      const R = 2.5 * 0.01 * (canvasRef.current?.width || 800);
      return {
        x: shape.cx + R * dx,
        y: shape.cy + R * dy
      };
    } else if (shape.type === "diamond" || shape.type === "rhombus") {
      const denom = Math.abs(dx) / W + Math.abs(dy) / H;
      const t = denom > 0.0001 ? 1 / denom : 0;
      return {
        x: shape.cx + t * dx,
        y: shape.cy + t * dy
      };
    } else {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const tX = absDx > 0.0001 ? W / absDx : Infinity;
      const tY = absDy > 0.0001 ? H / absDy : Infinity;
      const t = Math.min(tX, tY);
      return {
        x: shape.cx + t * dx,
        y: shape.cy + (t === Infinity ? 0 : t * dy)
      };
    }
  };

  const [showHelper, setShowHelper] = useState<boolean>(true);
  const [isCanvasFullScreen, setIsCanvasFullScreen] = useState<boolean>(false);

  // New states for real-time mini interactive DLD gate simulator and voice-to-sketch
  const [showMiniDld, setShowMiniDld] = useState<boolean>(false);
  const [showVoiceSketch, setShowVoiceSketch] = useState<boolean>(false);
  const [voiceSketchActive, setVoiceSketchActive] = useState<boolean>(false);
  const [voiceSketchProgress, setVoiceSketchProgress] = useState<string>("");
  const [voicePromptText, setVoicePromptText] = useState<string>("");

  // Layer Management state and refs
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>("");
  const [showLayersPanel, setShowLayersPanel] = useState<boolean>(false);
  const [layerToast, setLayerToast] = useState<string | null>(null);

  const layersRef = useRef<CanvasLayer[]>([]);
  const activeLayerIdRef = useRef<string>("");

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);

  // Ensure active layer exists helper
  const ensureActiveLayer = useCallback((w?: number, h?: number): CanvasLayer => {
    const canvas = canvasRef.current;
    const width = Math.max(w || 0, canvas?.width || 0, 2560);
    const height = Math.max(h || 0, canvas?.height || 0, 1440);

    if (layersRef.current.length === 0) {
      const defaultCanvas = document.createElement("canvas");
      defaultCanvas.width = width;
      defaultCanvas.height = height;
      const defaultLayerId = "layer_1";
      const defaultLayer: CanvasLayer = {
        id: defaultLayerId,
        name: "Layer 1",
        visible: true,
        locked: false,
        opacity: 1,
        canvas: defaultCanvas,
        bounds: { x: 0, y: 0, width, height }
      };
      layersRef.current = [defaultLayer];
      setLayers([defaultLayer]);
      activeLayerIdRef.current = defaultLayerId;
      setActiveLayerId(defaultLayerId);
      return defaultLayer;
    }

    let active = layersRef.current.find((l) => l.id === activeLayerIdRef.current);
    if (!active) {
      active = layersRef.current[0];
      activeLayerIdRef.current = active.id;
      setActiveLayerId(active.id);
    }
    if (!active.bounds) {
      active.bounds = { x: 0, y: 0, width: active.canvas.width || width, height: active.canvas.height || height };
    }
    return active;
  }, []);

  // Comprehensive Undo/Redo Snapshots
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  // Composite all visible layers onto offscreen buffer
  const compositeLayers = useCallback(() => {
    redraw();
  }, [redraw]);

  // Save full canvas/layers history snapshot
  const pushHistorySnapshot = useCallback(() => {
    if (layersRef.current.length === 0) return;

    const snapshotLayers = layersRef.current.map((l) => ({
      id: l.id,
      name: l.name,
      visible: l.visible,
      locked: l.locked,
      opacity: l.opacity,
      dataUrl: l.canvas.toDataURL(),
      bounds: l.bounds ? { ...l.bounds } : { x: 0, y: 0, width: l.canvas.width, height: l.canvas.height }
    }));

    const snapshot: HistorySnapshot = {
      layers: snapshotLayers,
      activeLayerId: activeLayerIdRef.current
    };

    setHistory((prev) => {
      const updated = [...prev, snapshot];
      if (updated.length > 30) return updated.slice(updated.length - 30);
      return updated;
    });
    setRedoStack([]);
  }, []);

  // Apply history snapshot to layers
  const applyHistorySnapshot = useCallback((snapshot: HistorySnapshot) => {
    if (!snapshot || !snapshot.layers) return;

    const newLayers: CanvasLayer[] = snapshot.layers.map((lData) => {
      const lCanvas = document.createElement("canvas");
      const b = lData.bounds || { x: 0, y: 0, width: 1200, height: 800 };
      lCanvas.width = b.width;
      lCanvas.height = b.height;

      if (lData.dataUrl) {
        const img = new Image();
        img.onload = () => {
          const ctx = lCanvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          compositeLayers();
        };
        img.src = lData.dataUrl;
      }

      return {
        id: lData.id,
        name: lData.name,
        visible: lData.visible,
        locked: lData.locked,
        opacity: lData.opacity,
        canvas: lCanvas,
        bounds: { ...b }
      };
    });

    setLayers(newLayers);
    layersRef.current = newLayers;
    setActiveLayerId(snapshot.activeLayerId);
    activeLayerIdRef.current = snapshot.activeLayerId;
    compositeLayers();
  }, [compositeLayers]);

  const handleStampImageToCanvas = useCallback((imageUrl: string) => {
    const active = ensureActiveLayer();
    const lCtx = active.canvas.getContext("2d");
    if (!lCtx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      pushHistorySnapshot();
      const targetW = Math.min(active.canvas.width * 0.65, 520);
      const targetH = (img.height / img.width) * targetW;
      const posX = (active.canvas.width - targetW) / 2;
      const posY = (active.canvas.height - targetH) / 2;
      lCtx.drawImage(img, posX, posY, targetW, targetH);
      compositeLayers();
      playChalkTap();
    };
    img.src = imageUrl;
  }, [ensureActiveLayer, pushHistorySnapshot, compositeLayers]);

  // Robust Undo handler
  const undo = useCallback(() => {
    if (history.length === 0) return;

    const currentSnapshot: HistorySnapshot = {
      layers: layersRef.current.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        locked: l.locked,
        opacity: l.opacity,
        dataUrl: l.canvas.toDataURL()
      })),
      activeLayerId: activeLayerIdRef.current
    };

    const targetSnapshot = history[history.length - 1];
    const remainingHistory = history.slice(0, -1);

    setHistory(remainingHistory);
    setRedoStack((prev) => [currentSnapshot, ...prev]);

    applyHistorySnapshot(targetSnapshot);
  }, [history, applyHistorySnapshot]);

  // Robust Redo handler
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const currentSnapshot: HistorySnapshot = {
      layers: layersRef.current.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        locked: l.locked,
        opacity: l.opacity,
        dataUrl: l.canvas.toDataURL()
      })),
      activeLayerId: activeLayerIdRef.current
    };

    const targetSnapshot = redoStack[0];
    const remainingRedo = redoStack.slice(1);

    setRedoStack(remainingRedo);
    setHistory((prev) => [...prev, currentSnapshot]);

    applyHistorySnapshot(targetSnapshot);
  }, [redoStack, applyHistorySnapshot]);

  // Keyboard listener for Ctrl+Z / Cmd+Z and Ctrl+Y / Cmd+Y
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.getAttribute("contenteditable") === "true")) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, undo, redo]);

  // Layer manipulation handlers
  const handleAddLayer = () => {
    pushHistorySnapshot();
    const w = canvasRef.current?.width || 800;
    const h = canvasRef.current?.height || 600;

    const newCanvas = document.createElement("canvas");
    newCanvas.width = w;
    newCanvas.height = h;

    const newLayerId = "layer_" + Date.now();
    const newLayerName = `Layer ${layers.length + 1}`;

    const newLayer: CanvasLayer = {
      id: newLayerId,
      name: newLayerName,
      visible: true,
      locked: false,
      opacity: 1,
      canvas: newCanvas
    };

    const updatedLayers = [...layers, newLayer];
    setLayers(updatedLayers);
    layersRef.current = updatedLayers;
    setActiveLayerId(newLayerId);
    activeLayerIdRef.current = newLayerId;

    compositeLayers();
    setLayerToast(`✨ Added ${newLayerName}`);
    setTimeout(() => setLayerToast(null), 2500);
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) {
      setLayerToast("⚠️ Cannot delete the only remaining layer!");
      setTimeout(() => setLayerToast(null), 2500);
      return;
    }

    pushHistorySnapshot();
    const updatedLayers = layers.filter((l) => l.id !== id);
    setLayers(updatedLayers);
    layersRef.current = updatedLayers;

    if (activeLayerId === id) {
      const fallbackId = updatedLayers[updatedLayers.length - 1].id;
      setActiveLayerId(fallbackId);
      activeLayerIdRef.current = fallbackId;
    }

    compositeLayers();
    setLayerToast("🗑️ Layer deleted");
    setTimeout(() => setLayerToast(null), 2500);
  };

  const handleToggleVisibility = (id: string) => {
    pushHistorySnapshot();
    const updatedLayers = layers.map((l) => l.id === id ? { ...l, visible: !l.visible } : l);
    setLayers(updatedLayers);
    layersRef.current = updatedLayers;
    compositeLayers();
  };

  const handleToggleLock = (id: string) => {
    pushHistorySnapshot();
    const updatedLayers = layers.map((l) => l.id === id ? { ...l, locked: !l.locked } : l);
    setLayers(updatedLayers);
    layersRef.current = updatedLayers;
  };

  const handleSetOpacity = (id: string, opacity: number) => {
    const updatedLayers = layers.map((l) => l.id === id ? { ...l, opacity } : l);
    setLayers(updatedLayers);
    layersRef.current = updatedLayers;
    compositeLayers();
  };

  const handleMoveLayer = (id: string, direction: "up" | "down") => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    if (direction === "up" && idx === layers.length - 1) return;
    if (direction === "down" && idx === 0) return;

    pushHistorySnapshot();
    const targetIdx = direction === "up" ? idx + 1 : idx - 1;
    const updated = [...layers];
    const [removed] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, removed);

    setLayers(updated);
    layersRef.current = updated;
    compositeLayers();
  };

  const handleDuplicateLayer = (id: string) => {
    const sourceLayer = layers.find((l) => l.id === id);
    if (!sourceLayer) return;

    pushHistorySnapshot();
    const w = sourceLayer.canvas.width;
    const h = sourceLayer.canvas.height;
    const dupCanvas = document.createElement("canvas");
    dupCanvas.width = w;
    dupCanvas.height = h;

    const dupCtx = dupCanvas.getContext("2d");
    dupCtx?.drawImage(sourceLayer.canvas, 0, 0);

    const dupId = "layer_" + Date.now();
    const dupLayer: CanvasLayer = {
      id: dupId,
      name: `${sourceLayer.name} (Copy)`,
      visible: sourceLayer.visible,
      locked: false,
      opacity: sourceLayer.opacity,
      canvas: dupCanvas
    };

    const idx = layers.findIndex((l) => l.id === id);
    const updated = [...layers];
    updated.splice(idx + 1, 0, dupLayer);

    setLayers(updated);
    layersRef.current = updated;
    setActiveLayerId(dupId);
    activeLayerIdRef.current = dupId;

    compositeLayers();
    setLayerToast(`📋 Duplicated ${sourceLayer.name}`);
    setTimeout(() => setLayerToast(null), 2500);
  };

  const handleMergeDown = (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx <= 0) {
      setLayerToast("⚠️ Cannot merge down bottom layer!");
      setTimeout(() => setLayerToast(null), 2500);
      return;
    }

    pushHistorySnapshot();
    const topLayer = layers[idx];
    const bottomLayer = layers[idx - 1];

    const bCtx = bottomLayer.canvas.getContext("2d");
    if (bCtx) {
      bCtx.save();
      bCtx.globalAlpha = topLayer.opacity;
      bCtx.drawImage(topLayer.canvas, 0, 0);
      bCtx.restore();
    }

    const updated = layers.filter((l) => l.id !== id);
    setLayers(updated);
    layersRef.current = updated;
    setActiveLayerId(bottomLayer.id);
    activeLayerIdRef.current = bottomLayer.id;

    compositeLayers();
    setLayerToast(`🥞 Merged ${topLayer.name} into ${bottomLayer.name}`);
    setTimeout(() => setLayerToast(null), 2500);
  };

  const handleClearLayer = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;

    pushHistorySnapshot();
    const ctx = layer.canvas.getContext("2d");
    ctx?.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

    compositeLayers();
    setLayerToast(`🧹 Cleared ${layer.name}`);
    setTimeout(() => setLayerToast(null), 2500);
  };

  const handleRenameLayer = (id: string, name: string) => {
    const updated = layers.map((l) => l.id === id ? { ...l, name } : l);
    setLayers(updated);
    layersRef.current = updated;
  };

  // Load saved recorded strokes from IndexedDB on component mount
  useEffect(() => {
    dbGet("myraa_chalkboard_strokes").then((saved) => {
      if (saved && Array.isArray(saved)) {
        setRecordedStrokes(saved);
      }
    }).catch(() => {});
  }, []);

  const saveStrokesToDb = useCallback((strokes: RecordedStroke[]) => {
    setRecordedStrokes(strokes);
    dbSet("myraa_chalkboard_strokes", strokes).catch(() => {});
  }, []);

  // Playback frame rendering function
  const renderPlaybackFrame = useCallback((stepIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeLayer = ensureActiveLayer(canvas.width, canvas.height);
    if (!activeLayer) return;

    // Clear active layer canvas to draw step strokes
    const aCtx = activeLayer.canvas.getContext("2d");
    if (!aCtx) return;

    aCtx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);

    const bx = activeLayer.bounds?.x || 0;
    const by = activeLayer.bounds?.y || 0;

    const currentStrokes = recordedStrokesRef.current;
    if (currentStrokes.length > 0) {
      const strokesToDraw = currentStrokes.slice(0, stepIndex);
      strokesToDraw.forEach((stroke) => {
        if (stroke.type === "clear") {
          aCtx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        } else if (stroke.viewport) {
          zoomRef.current = stroke.viewport.zoom;
          setZoomState(stroke.viewport.zoom);
          panXRef.current = stroke.viewport.panX;
          setPanXState(stroke.viewport.panX);
          panYRef.current = stroke.viewport.panY;
          setPanYState(stroke.viewport.panY);
        } else if (stroke.shapeResult) {
          drawVectorShapeOnCtx(aCtx, stroke.shapeResult, stroke.color, stroke.brushSize, CHALK_COLORS, { x: bx, y: by });
        } else if ((stroke as any).commands && (stroke as any).commands.length > 0) {
          executeDrawCommands(aCtx, activeLayer.canvas.width, activeLayer.canvas.height, (stroke as any).commands);
        } else if (stroke.points && stroke.points.length > 0) {
          aCtx.save();
          aCtx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
          aCtx.lineWidth = stroke.tool === "eraser" ? stroke.brushSize * 2.5 : stroke.brushSize;
          aCtx.strokeStyle = stroke.color;
          aCtx.lineCap = "round";
          aCtx.lineJoin = "round";
          aCtx.shadowBlur = 0;

          aCtx.beginPath();
          aCtx.moveTo(stroke.points[0].x - bx, stroke.points[0].y - by);
          for (let i = 1; i < stroke.points.length; i++) {
            aCtx.lineTo(stroke.points[i].x - bx, stroke.points[i].y - by);
          }
          aCtx.stroke();
          aCtx.restore();
        } else if (stroke.dataUrl) {
          const img = new Image();
          img.onload = () => {
            aCtx.drawImage(img, 0, 0);
            redraw();
          };
          img.src = stroke.dataUrl;
        }
      });
      redraw();
    } else if (history.length > 0) {
      const historyIndex = Math.min(stepIndex, history.length - 1);
      if (historyIndex >= 0 && history[historyIndex]) {
        applyHistorySnapshot(history[historyIndex]);
      }
    }
  }, [ensureActiveLayer, history, applyHistorySnapshot, redraw]);

  // Playback animation timer
  useEffect(() => {
    if (isPlaybackPlaying && isPlaybackMode) {
      const totalSteps = recordedStrokes.length > 0 ? recordedStrokes.length : history.length;
      if (totalSteps === 0) {
        setIsPlaybackPlaying(false);
        return;
      }

      const intervalMs = Math.max(120, Math.round(800 / playbackSpeed));
      playbackTimerRef.current = setInterval(() => {
        setPlaybackStep((prev) => {
          if (prev >= totalSteps) {
            setIsPlaybackPlaying(false);
            clearInterval(playbackTimerRef.current);
            return totalSteps;
          }
          const next = prev + 1;
          renderPlaybackFrame(next);
          return next;
        });
      }, intervalMs);

      return () => {
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      };
    }
  }, [isPlaybackPlaying, isPlaybackMode, playbackSpeed, recordedStrokes.length, history.length, renderPlaybackFrame]);

  const handleStartPlayback = () => {
    const totalSteps = recordedStrokes.length > 0 ? recordedStrokes.length : history.length;
    if (totalSteps === 0) return;

    // Save backup of current active layers before entering playback
    playbackBackupRef.current = layersRef.current.map((l) => ({
      id: l.id,
      dataUrl: l.canvas.toDataURL()
    }));

    setIsPlaybackMode(true);
    setPlaybackStep(0);
    renderPlaybackFrame(0);
    setIsPlaybackPlaying(true);
  };

  const handleExitPlayback = () => {
    setIsPlaybackMode(false);
    setIsPlaybackPlaying(false);
    if (playbackBackupRef.current) {
      playbackBackupRef.current.forEach((bak) => {
        const layer = layersRef.current.find((l) => l.id === bak.id);
        if (layer) {
          const img = new Image();
          img.onload = () => {
            const ctx = layer.canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
              ctx.drawImage(img, 0, 0);
              redraw();
            }
          };
          img.src = bak.dataUrl;
        }
      });
      playbackBackupRef.current = null;
    } else {
      redraw();
    }
  };

  const handleScrubPlayback = (step: number) => {
    setPlaybackStep(step);
    renderPlaybackFrame(step);
  };



  // Trigger real-time Voice-to-sketch drawing automatically when verbal description starts
  useEffect(() => {
    if (voiceSketchTriggerText) {
      if (activeMode === "text") {
        setActiveMode("split");
      }
      handleLocalVoiceSketch(voiceSketchTriggerText);
      if (onClearVoiceSketchTrigger) {
        onClearVoiceSketchTrigger();
      }
    }
  }, [voiceSketchTriggerText]);

  // Handle core chalkboard manual clearing triggered by Myraa AI update
  useEffect(() => {
    if (clearCounter && clearCounter > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          dbRemove("myraa_chalkboard_canvas");
        }
      }
    }
  }, [clearCounter]);

  // Background Tool: Automatically runs a deduplication pass on whiteboardDrawings whenever a new mind map is generated
  useEffect(() => {
    if (!isSlateDeduplicatorActive || !drawings || drawings.length === 0) return;

    // Detect if current context is a mind map, workflow, or visual diagram
    const isMindMapContext =
      diagramType.toLowerCase().includes("mind") ||
      diagramType.toLowerCase().includes("map") ||
      diagramType.toLowerCase().includes("flow") ||
      diagramType.toLowerCase().includes("workflow") ||
      diagramType.toLowerCase().includes("diagram") ||
      diagramType.toLowerCase().includes("relationship");

    // Compute fingerprint to avoid redundant runs on already-processed states
    const fingerprint = `${diagramType}_${drawings.length}_${drawings
      .slice(0, 15)
      .map((d) => `${d.type}:${Math.round(d.x1)}:${Math.round(d.y1)}:${d.text || ""}`)
      .join(";")}`;

    if (lastDeduplicatedFingerprintRef.current === fingerprint) {
      return;
    }

    const { cleanedDrawings, report } = deduplicateDrawingsState(drawings, {
      spatialTolerance: isMindMapContext ? 2.5 : 1.8,
      removeZeroLengthEdges: true,
    });

    setDeduplicationReport(report);

    if (report.removedCount > 0) {
      const newFingerprint = `${diagramType}_${cleanedDrawings.length}_${cleanedDrawings
        .slice(0, 15)
        .map((d) => `${d.type}:${Math.round(d.x1)}:${Math.round(d.y1)}:${d.text || ""}`)
        .join(";")}`;
      lastDeduplicatedFingerprintRef.current = newFingerprint;

      if (onUpdateDrawings) {
        onUpdateDrawings(cleanedDrawings);
      }

      setSlateDeduplicationToast(
        `✨ Visual Slate Optimized: Deduplicated ${report.removedCount} redundant elements for a concise mind map.`
      );
      setTimeout(() => setSlateDeduplicationToast(null), 4000);
    } else {
      lastDeduplicatedFingerprintRef.current = fingerprint;
    }
  }, [drawings, diagramType, isSlateDeduplicatorActive, onUpdateDrawings]);

  const handleManualDeduplicationPass = () => {
    if (!drawings || drawings.length === 0) {
      setSlateDeduplicationToast("ℹ️ Visual slate is currently empty.");
      setTimeout(() => setSlateDeduplicationToast(null), 3000);
      return;
    }

    const { cleanedDrawings, report } = deduplicateDrawingsState(drawings, {
      spatialTolerance: 2.5,
      removeZeroLengthEdges: true,
    });

    setDeduplicationReport(report);

    if (report.removedCount > 0) {
      const newFingerprint = `${diagramType}_${cleanedDrawings.length}_${cleanedDrawings
        .slice(0, 15)
        .map((d) => `${d.type}:${Math.round(d.x1)}:${Math.round(d.y1)}:${d.text || ""}`)
        .join(";")}`;
      lastDeduplicatedFingerprintRef.current = newFingerprint;

      if (onUpdateDrawings) {
        onUpdateDrawings(cleanedDrawings);
      }
      setSlateDeduplicationToast(
        `✨ Slate Optimized: Removed ${report.removedCount} duplicates (${report.deduplicatedCount} concise elements active).`
      );
    } else {
      setSlateDeduplicationToast(`✅ Slate is already concise & optimal (${drawings.length} clean elements).`);
    }
    setTimeout(() => setSlateDeduplicationToast(null), 3500);
  };

  // Render AI drawings with step-by-step stroke level animations (Voice-to-Sketch streaming)
  useEffect(() => {
    if (activeMode !== "text" && canvasRef.current && drawings && drawings.length > 0) {
      const canvas = canvasRef.current;
      setTimeout(() => {
        const activeLayer = ensureActiveLayer(canvas.width, canvas.height);
        if (!activeLayer) return;
        const aCtx = activeLayer.canvas.getContext("2d");
        if (!aCtx) return;

        setVoiceSketchActive(true);
        setVoiceSketchProgress("📡 Decoding verbal coordinates from MAHR...");
        
        let idx = 0;
        const delay = Math.max(10, Math.min(30, 400 / drawings.length));
        const newStrokes: RecordedStroke[] = [];

        const drawNextCmd = () => {
          if (idx >= drawings.length) {
            setVoiceSketchActive(false);
            setVoiceSketchProgress("");
            saveStrokesToDb([...recordedStrokesRef.current, ...newStrokes]);
            pushHistorySnapshot();
            return;
          }
          const cmd = drawings[idx];
          setVoiceSketchProgress(`✍️ Rendering: AI diagram shape (${idx + 1}/${drawings.length})`);
          executeDrawCommands(aCtx, activeLayer.canvas.width, activeLayer.canvas.height, [cmd]);
          
          newStrokes.push({
            id: `ai_stroke_${Date.now()}_${idx}`,
            tool: "voice_sketch",
            color: cmd.color || "cyan",
            brushSize: cmd.thickness || 2,
            commands: [cmd],
            name: `AI Diagram Shape ${idx + 1}`,
            timestamp: Date.now()
          } as any);

          redraw();
          idx++;
          setTimeout(drawNextCmd, delay);
        };
        
        drawNextCmd();
      }, 350);
    }
  }, [drawings, activeMode, isOpen, ensureActiveLayer, pushHistorySnapshot, saveStrokesToDb, redraw]);

  // Handle local simulation of Voice-to-sketch technical parsing
  const handleLocalVoiceSketch = (description: string) => {
    const lower = description.toLowerCase();

    // Direct trigger to real-time AI Mind Map / Workflow Generator
    if (onVoiceToMindMap && (lower.includes("mind") || lower.includes("map") || lower.includes("relationship"))) {
      setShowVoiceSketch(false);
      onVoiceToMindMap(description);
      return;
    }

    // Check if flowchart or workflow requested
    if (
      lower.includes("flow") ||
      lower.includes("chart") ||
      lower.includes("workflow") ||
      lower.includes("if/else") ||
      lower.includes("condition") ||
      lower.includes("pipeline") ||
      lower.includes("decision")
    ) {
      let presetId = "order-fraud-trigger";
      if (lower.includes("agent") || lower.includes("ai") || lower.includes("tool")) {
        presetId = "ai-agent-loop";
      } else if (lower.includes("sort") || lower.includes("search") || lower.includes("algo")) {
        presetId = "bubble-sort-flowchart";
      } else if (lower.includes("auth") || lower.includes("login") || lower.includes("jwt")) {
        presetId = "user-auth-flow";
      }
      setActiveFlowchartPresetId(presetId);
      setShowFlowchartCanvas(true);
      setShowAiSimulation(false);
      setChalkboardEngineMode("flowchart");
      setShowVoiceSketch(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let selectedCommands: any[] = [];
    let detectedName = "Dynamic Schematic";

    if (lower.includes("neural") || lower.includes("artificial") || lower.includes("network") || lower.includes("ai") || lower.includes("layer")) {
      selectedCommands = VOICE_PRESETS[0].commands;
      detectedName = VOICE_PRESETS[0].name;
    } else if (lower.includes("circuit") || lower.includes("parallel") || lower.includes("resistor") || lower.includes("electrical")) {
      selectedCommands = VOICE_PRESETS[1].commands;
      detectedName = VOICE_PRESETS[1].name;
    } else if (lower.includes("feedback") || lower.includes("control") || lower.includes("loop") || lower.includes("system")) {
      selectedCommands = VOICE_PRESETS[2].commands;
      detectedName = VOICE_PRESETS[2].name;
    } else if (lower.includes("tree") || lower.includes("binary") || lower.includes("decision") || lower.includes("hierarchy")) {
      selectedCommands = VOICE_PRESETS[3].commands;
      detectedName = VOICE_PRESETS[3].name;
    } else if (lower.includes("erd") || lower.includes("entity") || lower.includes("relationship") || lower.includes("database") || lower.includes("table")) {
      selectedCommands = VOICE_PRESETS[4].commands;
      detectedName = VOICE_PRESETS[4].name;
    } else if (lower.includes("mind") || lower.includes("map") || lower.includes("brainstorm") || lower.includes("diagram")) {
      selectedCommands = VOICE_PRESETS[5].commands;
      detectedName = VOICE_PRESETS[5].name;
    } else {
      detectedName = "Verbal Waveform Matrix";
      const count = 18;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 4;
        const r = 10 + i * 2;
        const x1 = 50 + Math.cos(angle) * r;
        const y1 = 50 + Math.sin(angle) * r;
        const x2 = 50 + Math.cos(angle + 0.5) * (r + r * 0.1);
        const y2 = 50 + Math.sin(angle + 0.5) * (r + r * 0.1);
        selectedCommands.push({
          type: "line",
          x1,
          y1,
          x2,
          y2,
          color: i % 2 === 0 ? "cyan" : "purple",
          thickness: 2
        });
      }
      selectedCommands.push({ type: "text", x1: 35, y1: 15, text: "PROCESSED COGNITIVE MATRIX", color: "gold" });
    }

    setVoiceSketchActive(true);
    setVoiceSketchProgress(`🎙️ Processing description: "${description}"...`);

    const activeLayer = ensureActiveLayer(canvas.width, canvas.height);
    if (!activeLayer) return;
    const aCtx = activeLayer.canvas.getContext("2d");
    if (!aCtx) return;

    let idx = 0;
    const newStrokes: RecordedStroke[] = [];

    const drawNext = () => {
      if (idx >= selectedCommands.length) {
        setVoiceSketchActive(false);
        setVoiceSketchProgress("");
        saveStrokesToDb([...recordedStrokesRef.current, ...newStrokes]);
        pushHistorySnapshot();
        return;
      }
      const cmd = selectedCommands[idx];
      setVoiceSketchProgress(`✍️ Voice sketching: ${detectedName} (${idx + 1}/${selectedCommands.length})`);
      executeDrawCommands(aCtx, activeLayer.canvas.width, activeLayer.canvas.height, [cmd]);
      
      newStrokes.push({
        id: `voice_stroke_${Date.now()}_${idx}`,
        tool: "voice_sketch",
        color: cmd.color || "cyan",
        brushSize: cmd.thickness || 2,
        commands: [cmd],
        name: `Voice Sketch (${detectedName})`,
        timestamp: Date.now()
      } as any);

      redraw();
      idx++;
      setTimeout(drawNext, 20);
    };

    setTimeout(drawNext, 50);
  };

  const autoSaveDebounceTimerRef = useRef<any>(null);

  // Debounced auto-save mechanism for whiteboard drawings to IndexedDB
  const triggerDebouncedCanvasSave = useCallback(() => {
    if (autoSaveDebounceTimerRef.current) {
      clearTimeout(autoSaveDebounceTimerRef.current);
    }
    autoSaveDebounceTimerRef.current = setTimeout(() => {
      if (offscreenCanvasRef.current) {
        try {
          const dataUrl = offscreenCanvasRef.current.toDataURL();
          dbSet("myraa_chalkboard_canvas", dataUrl);
        } catch (err) {
          console.warn("[Whiteboard Debounced AutoSave] Failed saving drawing to IndexedDB:", err);
        }
      }
    }, 400);
  }, []);

  // Flush immediate drawing save on unmount or browser reload/tab close
  useEffect(() => {
    const flushSave = () => {
      if (offscreenCanvasRef.current) {
        try {
          const dataUrl = offscreenCanvasRef.current.toDataURL();
          dbSet("myraa_chalkboard_canvas", dataUrl);
        } catch (e) {}
      }
    };
    window.addEventListener("beforeunload", flushSave);
    return () => {
      window.removeEventListener("beforeunload", flushSave);
      if (autoSaveDebounceTimerRef.current) {
        clearTimeout(autoSaveDebounceTimerRef.current);
      }
      flushSave();
    };
  }, []);

  // Retrieve canvas drawing cache if available
  useEffect(() => {
    if (activeMode !== "text" && canvasRef.current) {
      dbGet("myraa_chalkboard_canvas").then((savedCanvas) => {
        if (savedCanvas) {
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const w = canvas.width || 800;
            const h = canvas.height || 600;

            if (!offscreenCanvasRef.current) {
              offscreenCanvasRef.current = document.createElement("canvas");
            }
            offscreenCanvasRef.current.width = w;
            offscreenCanvasRef.current.height = h;

            const activeLayer = ensureActiveLayer(w, h);
            const aCtx = activeLayer.canvas.getContext("2d");
            if (aCtx) {
              aCtx.clearRect(0, 0, w, h);
              aCtx.drawImage(img, 0, 0);
            }

            compositeLayers();
          };
          img.src = savedCanvas;
        } else {
          ensureActiveLayer();
        }
      });
    }
  }, [activeMode, isOpen, ensureActiveLayer, compositeLayers]);

  // Adjust canvas size to fit bounding client rect
  const handleResizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    if (canvas.width === w && canvas.height === h) {
      return;
    }

    canvas.width = w;
    canvas.height = h;

    ensureActiveLayer(w, h);
    redraw();
  }, [ensureActiveLayer, redraw]);

  useEffect(() => {
    if (!isOpen || activeMode === "text") return;

    handleResizeCanvas();

    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const observer = new ResizeObserver(() => {
      handleResizeCanvas();
    });
    observer.observe(canvas.parentElement);

    window.addEventListener("resize", handleResizeCanvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResizeCanvas);
    };
  }, [isOpen, activeMode, handleResizeCanvas]);

  // Canvas mouse wheel zoom handler with focus centering on mouse cursor
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement> | WheelEvent) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const zoomFactor = 1.12;
    let newZoom = zoomRef.current;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoomRef.current * zoomFactor, 12);
    } else {
      newZoom = Math.max(zoomRef.current / zoomFactor, 0.05);
    }

    const dx = mouseX - panXRef.current;
    const dy = mouseY - panYRef.current;

    const newPanX = mouseX - dx * (newZoom / zoomRef.current);
    const newPanY = mouseY - dy * (newZoom / zoomRef.current);

    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, []);

  // Precise coordinate mapping helper accounting for bounding rect offsets and CSS scale factor
  const getCanvasCoords = useCallback((clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const unzoomedX = (canvasX - panXRef.current) / zoomRef.current;
    const unzoomedY = (canvasY - panYRef.current) / zoomRef.current;

    return { canvasX, canvasY, unzoomedX, unzoomedY };
  }, []);

  // Canvas drawing event triggers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | PointerEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    let clientX = 0;
    let clientY = 0;
    let rawPressure = 0.5;
    let hasHardwarePressure = false;
    const nativeEv = (e as any).nativeEvent || e;

    // Access PointerEvent.pressure dynamically from hardware stylus, Apple Pencil or touch force
    if (typeof nativeEv.pressure === "number" && nativeEv.pressure > 0) {
      rawPressure = nativeEv.pressure;
      hasHardwarePressure = true;
    } else if (typeof (e as any).pressure === "number" && (e as any).pressure > 0) {
      rawPressure = (e as any).pressure;
      hasHardwarePressure = true;
    } else if ("touches" in e && (e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
      clientX = (e as TouchEvent).touches[0].clientX;
      clientY = (e as TouchEvent).touches[0].clientY;
      const touch = (e as TouchEvent).touches[0];
      if ("force" in touch && (touch as any).force > 0) {
        rawPressure = (touch as any).force;
        hasHardwarePressure = true;
      }
    }

    if (!clientX && !clientY) {
      if ("clientX" in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      } else {
        return;
      }
    }

    const isMiddleButton = "button" in e && (e as MouseEvent).button === 1;
    const isRightButton = "button" in e && (e as MouseEvent).button === 2;
    const shouldPan = tool === "pan" || isMiddleButton || isRightButton;

    if (shouldPan) {
      setIsPanningWithRef(true);
      startPanMouseRef.current = { x: clientX, y: clientY };
      startPanOffsetRef.current = { x: panXRef.current, y: panYRef.current };
      return;
    }

    const activeLayer = ensureActiveLayer(canvas.width, canvas.height);
    if (activeLayer.locked) {
      setLayerToast("🔒 Active layer is locked! Unlock it to draw.");
      setTimeout(() => setLayerToast(null), 2500);
      return;
    }
    if (!activeLayer.visible) {
      setLayerToast("👁️ Active layer is hidden! Unhide it to draw.");
      setTimeout(() => setLayerToast(null), 2500);
      return;
    }

    const coords = getCanvasCoords(clientX, clientY, canvas);
    const unzoomedX = coords.unzoomedX;
    const unzoomedY = coords.unzoomedY;

    setIsDrawing(true);
    if (smartPenHoldTimerRef.current) {
      clearTimeout(smartPenHoldTimerRef.current);
      smartPenHoldTimerRef.current = null;
    }
    isHoldRefinedRef.current = false;
    lastHoldPosRef.current = { x: unzoomedX, y: unzoomedY };

    startPosRef.current = { x: unzoomedX, y: unzoomedY };
    lastPosRef.current = { x: unzoomedX, y: unzoomedY };
    smartPenPointsRef.current = [{ x: unzoomedX, y: unzoomedY }];

    smoothedPressureRef.current = rawPressure;
    smoothedPosRef.current = { x: unzoomedX, y: unzoomedY };
    lastDrawTimeRef.current = performance.now();

    const curBrushProfile = activeBrushProfileRef.current || activeBrushProfile;
    if (tool === "eraser") {
      playEraserSwipe(15);
    } else if (tool === "pen" || tool === "smartpen") {
      playChalkTap(rawPressure);
    }

    const baseWidth = tool === "eraser" 
      ? brushSize * 2.5 
      : (curBrushProfile.id === "highlighter" ? brushSize * 3.2 : brushSize);
    
    // Dynamic lineWidth & opacity computation based on PointerEvent.pressure & active brush profile curve
    const initialWidth = baseWidth * calculateProfileWidthMultiplier(curBrushProfile, rawPressure);
    const initialOpacity = calculateProfileOpacity(curBrushProfile, rawPressure);
    currentLineWidthRef.current = initialWidth;

    const initialPt = { x: unzoomedX, y: unzoomedY, pressure: rawPressure, width: initialWidth };
    strokePointsQueueRef.current = [initialPt, initialPt];

    // Update real-time stylus pressure telemetry
    const pointerType = (e as any).pointerType || ("touches" in e ? "touch" : "mouse");
    setLivePressureTelemetry({
      pressure: rawPressure,
      width: initialWidth,
      opacity: initialOpacity,
      pointerType
    });

    ensureLayerBounds(activeLayer, unzoomedX, unzoomedY);
    const bx = activeLayer.bounds?.x || 0;
    const by = activeLayer.bounds?.y || 0;
    const lx = unzoomedX - bx;
    const ly = unzoomedY - by;

    if (activeLayer) {
      const aCtx = activeLayer.canvas.getContext("2d");
      if (aCtx) {
        smartPenStartSnapshotRef.current = aCtx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);

        if (tool === "pen" || tool === "smartpen" || tool === "eraser") {
          aCtx.lineCap = curBrushProfile.nibShape === "chisel" ? "square" : "round";
          aCtx.lineJoin = "round";
          aCtx.lineWidth = initialWidth;
          if (tool === "eraser") {
            aCtx.globalCompositeOperation = "destination-out";
            aCtx.strokeStyle = "rgba(0,0,0,1)";
            aCtx.fillStyle = "rgba(0,0,0,1)";
            aCtx.globalAlpha = 1.0;
            aCtx.shadowBlur = 0;
          } else {
            aCtx.globalCompositeOperation = curBrushProfile.blendMode;
            aCtx.globalAlpha = initialOpacity;
            aCtx.strokeStyle = color;
            aCtx.fillStyle = color;
            if (curBrushProfile.glowBlur) {
              aCtx.shadowColor = color;
              aCtx.shadowBlur = curBrushProfile.glowBlur * (0.6 + rawPressure * 0.7);
            } else {
              aCtx.shadowBlur = 0;
            }
          }
        }
      }
    }

    if (tool === "line" || tool === "arrow") {
      const snapStart = findNearestSnapShape(unzoomedX, unzoomedY, canvas);
      startSnappedShapeRef.current = snapStart;
      baseImageRef.current = null;
    } else {
      startSnappedShapeRef.current = null;
      baseImageRef.current = null;
    }
  }, [tool, color, brushSize, activeBrushProfile, ensureActiveLayer, ensureLayerBounds, getCanvasCoords, scheduleRedraw, setIsDrawing]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | PointerEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let clientX = 0;
    let clientY = 0;
    let eventPressure: number | null = null;
    let hasHardwarePressure = false;
    const nativeEv = (e as any).nativeEvent || e;

    // Access PointerEvent.pressure dynamically
    if (typeof nativeEv.pressure === "number" && nativeEv.pressure > 0) {
      eventPressure = nativeEv.pressure;
      hasHardwarePressure = true;
    } else if (typeof (e as any).pressure === "number" && (e as any).pressure > 0) {
      eventPressure = (e as any).pressure;
      hasHardwarePressure = true;
    } else if ("touches" in e && (e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
      clientX = (e as TouchEvent).touches[0].clientX;
      clientY = (e as TouchEvent).touches[0].clientY;
      const touch = (e as TouchEvent).touches[0];
      if ("force" in touch && (touch as any).force > 0) {
        eventPressure = (touch as any).force;
        hasHardwarePressure = true;
      }
    }

    if (!clientX && !clientY) {
      if ("clientX" in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      } else {
        return;
      }
    }

    if (isPanningRef.current) {
      const dx = clientX - startPanMouseRef.current.x;
      const dy = clientY - startPanMouseRef.current.y;
      setPanX(startPanOffsetRef.current.x + dx);
      setPanY(startPanOffsetRef.current.y + dy);
      return;
    }

    if (!isDrawingRef.current) return;

    const coords = getCanvasCoords(clientX, clientY, canvas);
    const unzoomedX = coords.unzoomedX;
    const unzoomedY = coords.unzoomedY;

    if (tool === "eraser" || tool === "pen" || tool === "smartpen") {
      const prevUnzoomed = lastPosRef.current || { x: unzoomedX, y: unzoomedY };
      const now = performance.now();
      const dt = Math.max(1, now - (lastDrawTimeRef.current || now));
      lastDrawTimeRef.current = now;

      const dx = unzoomedX - prevUnzoomed.x;
      const dy = unzoomedY - prevUnzoomed.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.2) return;

      const velocity = dist / dt;

      let rawPressure = 0.5;
      if (eventPressure !== null && eventPressure > 0) {
        rawPressure = eventPressure;
      } else {
        // Natural speed-to-pressure response when using standard non-pressure mouse
        const speedFactor = Math.min(1.0, velocity / 2.2);
        rawPressure = Math.max(0.2, 1.15 - speedFactor * 0.7);
      }

      // Smooth pressure interpolation to eliminate jitter
      smoothedPressureRef.current += (rawPressure - smoothedPressureRef.current) * (hasHardwarePressure ? 0.65 : 0.35);
      const currPressure = smoothedPressureRef.current;

      const prevSmooth = smoothedPosRef.current;
      const smoothX = prevSmooth.x + (unzoomedX - prevSmooth.x) * 0.55;
      const smoothY = prevSmooth.y + (unzoomedY - prevSmooth.y) * 0.55;
      smoothedPosRef.current = { x: smoothX, y: smoothY };

      smartPenPointsRef.current.push({ x: smoothX, y: smoothY });

      const curBrushProfile = activeBrushProfileRef.current || activeBrushProfile;
      const baseWidth = tool === "eraser" 
        ? brushSize * 2.5 
        : (curBrushProfile.id === "highlighter" ? brushSize * 3.2 : brushSize);
      
      // Calculate dynamic stroke width and opacity from brush profile pressure curves
      let targetWidth = baseWidth * calculateProfileWidthMultiplier(curBrushProfile, currPressure);

      // Chisel / Calligraphy dynamic angle modulation
      if (
        (curBrushProfile.nibShape === "chisel" || curBrushProfile.nibShape === "chisel-calligraphy") &&
        tool !== "eraser"
      ) {
        targetWidth = calculateCalligraphyAngleWidth(
          dx,
          dy,
          curBrushProfile.nibAngleDeg,
          targetWidth,
          curBrushProfile.nibAspectRatio
        );
      }

      currentLineWidthRef.current += (targetWidth - currentLineWidthRef.current) * 0.4;
      const lineW = currentLineWidthRef.current;
      const targetOpacity = calculateProfileOpacity(curBrushProfile, currPressure);

      if (tool === "eraser") {
        playEraserSwipe(dist);
      } else {
        playChalkFriction(dist, lineW);
      }

      // Update live pressure telemetry at 30-60fps
      if (now - lastTelemetryUpdateRef.current > 30) {
        lastTelemetryUpdateRef.current = now;
        const pointerType = (e as any).pointerType || ("touches" in e ? "touch" : "mouse");
        setLivePressureTelemetry({
          pressure: currPressure,
          width: lineW,
          opacity: targetOpacity,
          pointerType
        });
      }

      const newPoint = { x: smoothX, y: smoothY, pressure: currPressure, width: lineW };
      strokePointsQueueRef.current.push(newPoint);

      const activeLayer = ensureActiveLayer(canvas.width, canvas.height);
      ensureLayerBounds(activeLayer, smoothX, smoothY);

      const bx = activeLayer.bounds?.x || 0;
      const by = activeLayer.bounds?.y || 0;
      const aCtx = activeLayer.canvas.getContext("2d");

      if (aCtx) {
        aCtx.lineCap = curBrushProfile.nibShape === "chisel" ? "square" : "round";
        aCtx.lineJoin = "round";
        
        // DYNAMIC CONTEXT ADJUSTMENT: lineWidth & opacity (globalAlpha)
        aCtx.lineWidth = lineW;

        if (tool === "eraser") {
          aCtx.globalCompositeOperation = "destination-out";
          aCtx.strokeStyle = "rgba(0,0,0,1)";
          aCtx.fillStyle = "rgba(0,0,0,1)";
          aCtx.globalAlpha = 1.0;
          aCtx.shadowBlur = 0;
        } else {
          aCtx.globalCompositeOperation = curBrushProfile.blendMode;
          // Dynamically adjust context opacity from pressure curve
          aCtx.globalAlpha = targetOpacity;
          aCtx.strokeStyle = color;
          aCtx.fillStyle = color;
          if (curBrushProfile.glowBlur) {
            aCtx.shadowColor = color;
            aCtx.shadowBlur = curBrushProfile.glowBlur * (0.6 + currPressure * 0.7);
          } else {
            aCtx.shadowBlur = 0;
          }
        }

        const pts = strokePointsQueueRef.current;
        if (pts.length >= 3) {
          const p0 = pts[pts.length - 3];
          const p1 = pts[pts.length - 2];
          const p2 = pts[pts.length - 1];

          const midPrev = { x: (p0.x + p1.x) / 2 - bx, y: (p0.y + p1.y) / 2 - by };
          const midCurr = { x: (p1.x + p2.x) / 2 - bx, y: (p1.y + p2.y) / 2 - by };

          aCtx.beginPath();
          aCtx.moveTo(midPrev.x, midPrev.y);
          aCtx.quadraticCurveTo(p1.x - bx, p1.y - by, midCurr.x, midCurr.y);
          aCtx.stroke();
        } else if (pts.length === 2) {
          const p0 = pts[0];
          const p1 = pts[1];
          aCtx.beginPath();
          aCtx.moveTo(p0.x - bx, p0.y - by);
          aCtx.lineTo(p1.x - bx, p1.y - by);
          aCtx.stroke();
        }

        aCtx.globalAlpha = 1.0;
        scheduleRedraw();
      }

      lastPosRef.current = { x: unzoomedX, y: unzoomedY };

      if (tool === "smartpen") {
        const moveDistFromLastHold = lastHoldPosRef.current
          ? Math.hypot(unzoomedX - lastHoldPosRef.current.x, unzoomedY - lastHoldPosRef.current.y)
          : 0;

        lastHoldPosRef.current = { x: unzoomedX, y: unzoomedY };

        if (!isHoldRefinedRef.current) {
          if (moveDistFromLastHold < 6) {
            if (!smartPenHoldTimerRef.current) {
              smartPenHoldTimerRef.current = setTimeout(() => {
                const currentPts = smartPenPointsRef.current;
                if (currentPts.length > 3 && isDrawingRef.current) {
                  isHoldRefinedRef.current = true;
                  playShapeSnapChime();
                  const shapeResult = recognizeSmartPenShape(currentPts, true);
                  const aCtx = activeLayer.canvas.getContext("2d");
                  if (aCtx) {
                    if (smartPenStartSnapshotRef.current) {
                      aCtx.putImageData(smartPenStartSnapshotRef.current, 0, 0);
                    }
                    drawVectorShapeOnCtx(aCtx, shapeResult, color, brushSize, CHALK_COLORS, { x: bx, y: by });
                    scheduleRedraw();
                    setSmartPenToast(`✨ Smart Pen Auto-Snapped: ${shapeResult.name}`);
                    setTimeout(() => setSmartPenToast(null), 3000);
                  }
                }
              }, 220);
            }
          } else {
            if (smartPenHoldTimerRef.current) {
              clearTimeout(smartPenHoldTimerRef.current);
              smartPenHoldTimerRef.current = null;
            }
          }
        }
      }
    } else if (tool === "line" || tool === "arrow") {
      scheduleRedraw();

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.translate(panXRef.current, panYRef.current);
        ctx.scale(zoomRef.current, zoomRef.current);

        let startPt = startPosRef.current || { x: unzoomedX, y: unzoomedY };
        let endPt = { x: unzoomedX, y: unzoomedY };

        const snapEnd = findNearestSnapShape(unzoomedX, unzoomedY, canvas);
        const startShape = startSnappedShapeRef.current;

        if (startShape && snapEnd) {
          startPt = getShapeSnapPoint(startShape, snapEnd.cx, snapEnd.cy);
          endPt = getShapeSnapPoint(snapEnd, startShape.cx, startShape.cy);
        } else if (startShape) {
          startPt = getShapeSnapPoint(startShape, unzoomedX, unzoomedY);
        } else if (snapEnd) {
          endPt = getShapeSnapPoint(snapEnd, startPt.x, startPt.y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();

        if (tool === "arrow") {
          const angle = Math.atan2(endPt.y - startPt.y, endPt.x - startPt.x);
          const headLength = Math.max(12, brushSize * 3);
          ctx.beginPath();
          ctx.moveTo(endPt.x, endPt.y);
          ctx.lineTo(endPt.x - headLength * Math.cos(angle - Math.PI / 6), endPt.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(endPt.x, endPt.y);
          ctx.lineTo(endPt.x - headLength * Math.cos(angle + Math.PI / 6), endPt.y - headLength * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }

        ctx.restore();
      }

      lastPosRef.current = { x: unzoomedX, y: unzoomedY };
    }
  }, [tool, brushSize, color, ensureActiveLayer, ensureLayerBounds, getCanvasCoords, scheduleRedraw]);

  const stopDrawing = useCallback(() => {
    if (smartPenHoldTimerRef.current) {
      clearTimeout(smartPenHoldTimerRef.current);
      smartPenHoldTimerRef.current = null;
    }
    lastHoldPosRef.current = null;

    if (isPanningRef.current) {
      const dx = Math.abs(panXRef.current - startPanOffsetRef.current.x);
      const dy = Math.abs(panYRef.current - startPanOffsetRef.current.y);
      if (dx > 8 || dy > 8) {
        const panStroke: RecordedStroke = {
          id: "stroke_" + Date.now(),
          type: "pan_zoom",
          tool: "pan",
          color: "gray",
          brushSize: 1,
          viewport: { zoom: zoomRef.current, panX: panXRef.current, panY: panYRef.current },
          description: `🔍 Panned Viewport (${Math.round(panXRef.current)}px, ${Math.round(panYRef.current)}px)`,
          name: "Viewport Navigation",
          timestamp: Date.now()
        };
        saveStrokesToDb([...recordedStrokesRef.current, panStroke]);
      }
      setIsPanningWithRef(false);
      return;
    }

    if (!isDrawingRef.current) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeLayer = ensureActiveLayer(canvas.width, canvas.height);
    const bx = activeLayer.bounds?.x || 0;
    const by = activeLayer.bounds?.y || 0;

    if (tool === "smartpen") {
      const pts = smartPenPointsRef.current;
      if (activeLayer && pts.length > 1) {
        const aCtx = activeLayer.canvas.getContext("2d");
        if (aCtx) {
          if (smartPenStartSnapshotRef.current) {
            aCtx.putImageData(smartPenStartSnapshotRef.current, 0, 0);
          } else {
            aCtx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
          }

          const shapeResult = recognizeSmartPenShape(pts, isHoldRefinedRef.current);
          drawVectorShapeOnCtx(aCtx, shapeResult, color, brushSize, CHALK_COLORS, { x: bx, y: by });
          redraw();

          setSmartPenToast(`✨ Smart Pen Auto-Corrected: ${shapeResult.name}`);
          setTimeout(() => setSmartPenToast(null), 3500);

          try {
            pushHistorySnapshot();

            const newStroke: RecordedStroke = {
              id: "stroke_" + Date.now(),
              type: "shape",
              tool: "smartpen",
              color,
              brushSize,
              shapeResult,
              points: pts,
              description: `📐 Auto-Corrected: ${shapeResult.name}`,
              name: `Smart Pen ${shapeResult.name}`,
              timestamp: Date.now()
            };
            saveStrokesToDb([...recordedStrokesRef.current, newStroke]);
          } catch (err) {
            console.warn("Smart Pen save failed:", err);
          }
        }
      }
    } else if (tool === "line" || tool === "arrow") {
      const startPt = startPosRef.current || { x: 0, y: 0 };
      const lastX = lastPosRef.current?.x ?? startPt.x;
      const lastY = lastPosRef.current?.y ?? startPt.y;

      const snapEnd = findNearestSnapShape(lastX, lastY, canvas);
      const startShape = startSnappedShapeRef.current;

      let finalStart = { ...startPt };
      let finalEnd = { x: lastX, y: lastY };

      if (startShape && snapEnd) {
        finalStart = getShapeSnapPoint(startShape, snapEnd.cx, snapEnd.cy);
        finalEnd = getShapeSnapPoint(snapEnd, startShape.cx, startShape.cy);
      } else if (startShape) {
        finalStart = getShapeSnapPoint(startShape, lastX, lastY);
      } else if (snapEnd) {
        finalEnd = getShapeSnapPoint(snapEnd, startPt.x, startPt.y);
      }

      ensureLayerBounds(activeLayer, finalStart.x, finalStart.y);
      ensureLayerBounds(activeLayer, finalEnd.x, finalEnd.y);

      const curBx = activeLayer.bounds?.x || 0;
      const curBy = activeLayer.bounds?.y || 0;

      if (activeLayer) {
        const aCtx = activeLayer.canvas.getContext("2d");
        if (aCtx) {
          aCtx.globalCompositeOperation = "source-over";
          aCtx.lineWidth = brushSize;
          aCtx.strokeStyle = color;
          aCtx.shadowBlur = 0;

          aCtx.beginPath();
          aCtx.moveTo(finalStart.x - curBx, finalStart.y - curBy);
          aCtx.lineTo(finalEnd.x - curBx, finalEnd.y - curBy);
          aCtx.stroke();

          if (tool === "arrow") {
            const angle = Math.atan2(finalEnd.y - finalStart.y, finalEnd.x - finalStart.x);
            const headLength = Math.max(12, brushSize * 3);
            aCtx.beginPath();
            aCtx.moveTo(finalEnd.x - curBx, finalEnd.y - curBy);
            aCtx.lineTo(finalEnd.x - curBx - headLength * Math.cos(angle - Math.PI / 6), finalEnd.y - curBy - headLength * Math.sin(angle - Math.PI / 6));
            aCtx.moveTo(finalEnd.x - curBx, finalEnd.y - curBy);
            aCtx.lineTo(finalEnd.x - curBx - headLength * Math.cos(angle + Math.PI / 6), finalEnd.y - curBy - headLength * Math.sin(angle + Math.PI / 6));
            aCtx.stroke();
          }
        }
      }

      redraw();

      try {
        pushHistorySnapshot();

        const newStroke: RecordedStroke = {
          id: "stroke_" + Date.now(),
          type: "shape",
          tool,
          color,
          brushSize,
          shapeResult: {
            type: tool === "arrow" ? "arrow" : "line",
            name: tool === "arrow" ? "Arrow" : "Line",
            data: { start: finalStart, end: finalEnd }
          },
          description: `📏 Drew ${tool === "arrow" ? "Arrow" : "Line"} Connection`,
          name: tool === "arrow" ? "Relationship Arrow" : "Relationship Line",
          timestamp: Date.now()
        };
        saveStrokesToDb([...recordedStrokesRef.current, newStroke]);
      } catch (err) {
        console.warn("Canvas save failed:", err);
      }
    } else {
      if (activeLayer) {
        const pts = smartPenPointsRef.current;
        if (pts.length <= 1 && startPosRef.current) {
          const aCtx = activeLayer.canvas.getContext("2d");
          if (aCtx) {
            const curBrushProfile = activeBrushProfileRef.current || activeBrushProfile;
            const tapX = startPosRef.current.x - bx;
            const tapY = startPosRef.current.y - by;
            const tapWidth = currentLineWidthRef.current || brushSize;
            aCtx.beginPath();
            if (tool === "eraser") {
              aCtx.globalCompositeOperation = "destination-out";
              aCtx.fillStyle = "rgba(0,0,0,1)";
              aCtx.globalAlpha = 1.0;
            } else {
              aCtx.globalCompositeOperation = curBrushProfile.blendMode;
              aCtx.fillStyle = color;
              aCtx.globalAlpha = 1.0;
            }
            aCtx.arc(tapX, tapY, Math.max(1, tapWidth / 2), 0, Math.PI * 2);
            aCtx.fill();
          }
        }
      }

      redraw();

      try {
        pushHistorySnapshot();

        const isEraser = tool === "eraser";
        const newStroke: RecordedStroke = {
          id: "stroke_" + Date.now(),
          type: isEraser ? "erase" : "draw",
          tool,
          color,
          brushSize,
          points: [...smartPenPointsRef.current],
          description: isEraser ? "🧹 Erased Canvas Section" : `✍️ Drew ${color} Stroke`,
          name: isEraser ? "Felt Eraser" : "Liquid Chalk Scribble",
          timestamp: Date.now()
        };
        saveStrokesToDb([...recordedStrokesRef.current, newStroke]);
      } catch (err) {
        console.warn("Canvas save failed:", err);
      }
    }

    triggerDebouncedCanvasSave();

    startPosRef.current = null;
    lastPosRef.current = null;
    startSnappedShapeRef.current = null;
    baseImageRef.current = null;
    strokePointsQueueRef.current = [];

    // Fade live telemetry display gracefully after stroke release
    setTimeout(() => {
      if (!isDrawingRef.current) {
        setLivePressureTelemetry(null);
      }
    }, 1200);
  }, [isDrawing, tool, brushSize, color, ensureActiveLayer, ensureLayerBounds, compositeLayers, pushHistorySnapshot, saveStrokesToDb, recordedStrokes]);

  // Non-passive wheel event listener to support smooth zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();
      handleWheel(e);
    };

    canvas.addEventListener("wheel", handleWheelNative, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheelNative);
    };
  }, [isOpen, handleWheel]);

  const clearCanvas = () => {
    pushHistorySnapshot();

    layersRef.current.forEach((layer) => {
      const ctx = layer.canvas.getContext("2d");
      ctx?.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    });

    setZoom(1);
    setPanX(0);
    setPanY(0);

    setRecordedStrokes([]);
    recordedStrokesRef.current = [];

    compositeLayers();
    dbRemove("myraa_chalkboard_canvas");
    dbRemove("myraa_chalkboard_strokes");
  };

  const handleExecuteMahrVoiceAction = useCallback((action: WhiteboardVoiceAction) => {
    if (action.type === "switch_studio" && action.targetStudio) {
      handleSelectEngineMode(action.targetStudio);
      if (action.presetId) {
        setActiveFlowchartPresetId(action.presetId);
      }
      if (action.diagramTopic) {
        if (action.targetStudio === "slides") {
          setActiveSlidesTopic(action.diagramTopic);
        } else if (action.targetStudio === "mindmap") {
          onVoiceToMindMap?.(action.diagramTopic);
        }
      }
    } else if (action.type === "generate_slides") {
      if (action.diagramTopic) {
        setActiveSlidesTopic(action.diagramTopic);
      }
      handleSelectEngineMode("slides");
    } else if (action.type === "present_slides") {
      handleSelectEngineMode("slides");
    } else if (action.type === "sketch_diagram") {
      handleSelectEngineMode("chalkboard");
      if (action.diagramTopic) {
        handleLocalVoiceSketch(action.diagramTopic);
      }
    } else if (action.type === "clear_canvas") {
      clearCanvas();
    } else if (action.type === "toggle_split") {
      setActiveMode(activeMode === "canvas" ? "split" : "canvas");
    } else if (action.type === "change_color" && action.color) {
      setColor(action.color);
    } else if (action.type === "change_tool" && action.tool) {
      setTool(action.tool);
    } else if (action.type === "undo") {
      undo();
    } else if (action.type === "redo") {
      redo();
    } else if (action.type === "ask_tutor" && action.diagramTopic) {
      handleAskTutor?.(action.diagramTopic);
    }
  }, [handleSelectEngineMode, activeMode, setActiveMode, clearCanvas, undo, redo, handleAskTutor, onVoiceToMindMap]);

  const exportCanvasImage = () => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = mainCanvas.width;
    exportCanvas.height = mainCanvas.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Fill chalkboard dark theme background
    ctx.fillStyle = "#090d12";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Apply viewport scale/pan transform
    ctx.save();
    ctx.translate(panXRef.current, panYRef.current);
    ctx.scale(zoomRef.current, zoomRef.current);

    // Composite visible layers
    layersRef.current.forEach((layer) => {
      if (layer.visible && layer.opacity > 0) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        const bx = layer.bounds?.x || 0;
        const by = layer.bounds?.y || 0;
        ctx.drawImage(layer.canvas, bx, by);
        ctx.restore();
      }
    });

    ctx.restore();

    const link = document.createElement("a");
    link.download = `mahr_chalkboard_${new Date().toISOString().substring(0, 10)}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  // Crude parser to render markdown cleanly without react-markdown size overhead
  const renderSimpleMarkdown = (markdownText: string) => {
    const lines = markdownText.split("\n");
    return lines.map((line, i) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("# ")) {
        return <h2 key={i} className="text-xl font-bold font-sans text-cyan-400 mt-5 border-b border-white/10 pb-2 tracking-tight">{trimmed.replace("# ", "")}</h2>;
      }
      if (trimmed.startsWith("## ")) {
        return <h3 key={i} className="text-lg font-bold font-sans text-purple-400 mt-4 tracking-tight">{trimmed.replace("## ", "")}</h3>;
      }
      if (trimmed.startsWith("### ")) {
        return <h4 key={i} className="text-sm font-semibold tracking-wider font-mono text-slate-200 mt-3 uppercase">{trimmed.replace("### ", "")}</h4>;
      }

      // Codeblocks
      if (trimmed.startsWith("```")) {
        return null; // hide raw wrappers
      }

      // Bullets
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const boldSplit = line.replace(/^\s*[-*]\s+/, "");
        return (
          <li key={i} className="ml-4 list-disc text-sm text-slate-300 leading-relaxed font-sans mb-1.5 pl-1 decoration-cyan-400">
            {parseInlineStyles(boldSplit)}
          </li>
        );
      }

      // Equations blocks or centered items
      if (trimmed.startsWith("$$") || trimmed.endsWith("$$")) {
        return (
          <div key={i} className="my-4 p-3.5 rounded-2xl bg-cyan-950/25 border border-cyan-500/20 text-center font-mono text-cyan-300 text-sm overflow-x-auto shadow-inner leading-relaxed">
            {formatMathText(trimmed.replace(/\$\$/g, ""))}
          </div>
        );
      }

      // Step lists / numbered items
      if (/^\s*\d+\.\s+/.test(line)) {
        const itemText = line.replace(/^\s*\d+\.\s+/, "");
        const num = line.match(/^\s*(\d+)\.\s+/)?.[1] || "1";
        return (
          <div key={i} className="flex gap-2.5 items-start text-sm leading-relaxed text-slate-300 mb-2 font-sans pl-2">
            <span className="font-mono text-cyan-400 font-bold shrink-0">{num}.</span>
            <span className="flex-1">{parseInlineStyles(itemText)}</span>
          </div>
        );
      }

      // Empty line
      if (!trimmed) {
        return <div key={i} className="h-2" />;
      }

      // Standard copy text
      return (
        <p key={i} className="text-sm text-slate-300/95 leading-relaxed font-sans mb-2 pl-1.5">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  const parseInlineStyles = (raw: string) => {
    // Basic inline bold formatter (e.g. **important**)
    const parts = raw.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      // odd indexes are bold
      if (index % 2 === 1) {
        return (
          <strong key={index} className="text-white font-bold bg-white/5 px-1 py-0.5 rounded border border-white/5">
            {formatMathText(part)}
          </strong>
        );
      }
      // basic inline code formatter (e.g. `formula`)
      const codeParts = part.split(/`([^`]+)`/g);
      return codeParts.map((sub, sidx) => {
        if (sidx % 2 === 1) {
          return (
            <code key={sidx} className="font-mono text-xs text-amber-300 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-500/15">
              {formatMathText(sub)}
            </code>
          );
        }
        
        // Find single $...$ for inline math formatting
        const mathParts = sub.split(/\$([^$]+)\$/g);
        return mathParts.map((mSub, midx) => {
          if (midx % 2 === 1) {
            return (
              <span key={midx} className="font-mono text-cyan-300 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/10 italic">
                {formatMathText(mSub)}
              </span>
            );
          }
          return formatMathText(mSub);
        });
      });
    });
  };

  // Helper template buttons for students to pre-seed text if they like
  const seedChalkboardTemplate = (type: "math" | "physics" | "coding" | "chemistry") => {
    let t = "";
    if (type === "math") {
      t = `# 📐 Math Workout Board\n- Goal: Prove Quadratic Equation roots.\n- Equation:\n$$ax^2 + bx + c = 0$$\n\n- Proof notes:\n1. Divide both sides by \`a\`: \`x^2 + (b/a)x + c/a = 0\`\n2. Shift constant term: \`x^2 + (b/a)x = -c/a\`\n3. Complete the square by adding \`(b/(2a))^2\` to both sides!\n4. Take root of brackets to finalize quadratic formula:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nMAHR, please check my steps and advise if correct!`;
    } else if (type === "physics") {
      t = `# 🌌 Physics Dynamics\n- Topic: Newton's second law of motion & gravitational physics\n- Standard formula:\n$$F = m \\cdot a$$\n\n- Key Concepts:\n1. Force is equal to mass multiplied by acceleration.\n2. In a vacuum, gravitational acceleration is constant ($\`g = 9.81 m/s^2\`).\n3. Kinetic energy of moving mass: \`E_k = 0.5 * m * v^2\`\n\nAsk MAHR: "Explain gravitational drag coefficient step by step!"`;
    } else if (type === "coding") {
      t = `# 💻 Coding & Data Structures\n- Topic: Bubble Sort Algorithm analysis\n- Complexity: \`O(N^2)\` worst case.\n\n- Bubble Sort Pseudocode:\n\`\`\`typescript\nfunction bubbleSort(arr: number[]) {\n  const len = arr.length;\n  for (let i = 0; i < len; i++) {\n    for (let j = 0; j < len - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        // Swap elements\n        let tmp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = tmp;\n      }\n    }\n  }\n  return arr;\n}\n\`\`\`\nLet's ask MAHR: "Analyze worst-case sorting scenario with me!"`;
    } else {
      t = `# 🧪 Chemistry Molecular Structure\n- Molecule: Water (H2O)\n- Formula: 2 Atoms of Hydrogen + 1 Atom of Oxygen covalently bonded.\n- Diagram description:\n  - Oxygen center with two lonely electron clouds\n  - Polar charging makes hydrogen carry positive bias.\n\nAsk MAHR: "Explain hydrogen bonding on the chalkboard!"`;
    }
    onTextChange(t);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] w-full h-full h-[100dvh] bg-[#02040b] flex flex-col overflow-hidden select-none p-0 m-0"
        >
          {/* Unified Top Studio Header with Dropdown & Branding */}
          <WhiteboardHeader
              engineMode={chalkboardEngineMode}
              onSelectEngineMode={handleSelectEngineMode}
              canUndo={history.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={undo}
              onRedo={redo}
              layersCount={layers.length}
              showLayersPanel={showLayersPanel}
              onToggleLayersPanel={() => setShowLayersPanel(!showLayersPanel)}
              onOpenUtilities={() => setShowUtilityDrawer(true)}
              onClearCanvas={clearCanvas}
              onExportCanvas={exportCanvasImage}
              onToggleFullScreen={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch(() => {});
                  setIsCanvasFullScreen(true);
                } else {
                  document.exitFullscreen?.().catch(() => {});
                  setIsCanvasFullScreen(false);
                }
                setTimeout(handleResizeCanvas, 150);
              }}
              onToggleHelp={() => setShowHelper(!showHelper)}
              showHelper={showHelper}
              onClose={onClose}
              activeLayoutMode={activeMode}
              onSelectLayoutMode={(m) => setActiveMode(m)}
              onToggleMahrVoice={() => setIsMahrVoiceCompanionOpen((prev) => !prev)}
              isMahrVoiceOpen={isMahrVoiceCompanionOpen}
            />

            {/* Ambient MAHR Voice Companion Bar */}
            <MahrVoiceCompanion
              isOpen={isMahrVoiceCompanionOpen}
              onClose={() => setIsMahrVoiceCompanionOpen(false)}
              onExecuteAction={handleExecuteMahrVoiceAction}
            />

          {/* STATUS NOTIFICATION OVERLAY */}
          {statusAlert && (
            <div className="absolute top-18 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
              <div className="px-4 py-2 border border-purple-500/30 bg-purple-950/80 backdrop-blur-xl shadow-lg rounded-xl text-xs font-mono text-purple-200 flex items-center gap-2 animate-bounce">
                <Sparkles size={13} className="text-purple-400 shrink-0" />
                <span>{statusAlert}</span>
              </div>
            </div>
          )}

          {/* CONTENT WORK AREA */}
          <div className="flex-1 flex overflow-hidden min-h-0 bg-[#020205]">
            {/* 1. LECTURE NOTES AREA (Active in split or text mode) */}
            {(activeMode === "split" || activeMode === "text") && (
              <div className={`h-full flex flex-col border-r border-white/5 ${
                activeMode === "text" ? "w-full" : "w-1/2"
              }`}>
                {/* Notes sub header */}
                <div className="px-5 py-3 border-b border-white/5 bg-slate-950/30 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-bold font-mono tracking-widest text-slate-200 uppercase">Interactive Lesson Notes</span>
                  </div>
                  {activeMode === "split" && (
                    <div className="flex gap-1">
                      {["math", "physics", "coding", "chemistry"].map((type) => (
                        <button
                          key={type}
                          onClick={() => seedChalkboardTemplate(type as any)}
                          className="px-2 py-0.5 rounded text-[9px] font-mono capitalize border border-white/5 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit & Live Render panels */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                  {/* Markdown raw text area */}
                  <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col border-r border-white/5 bg-[#030308]/40">
                    <div className="bg-slate-950/40 px-3.5 py-1.5 text-[10px] font-mono text-slate-500 tracking-wider font-semibold uppercase border-b border-white/5">
                      ✏️ Edit Pad
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => {
                        onTextChange(e.target.value);
                        dbSet("myraa_whiteboard_text", e.target.value);
                      }}
                      className="flex-1 p-4 bg-transparent border-0 outline-none font-mono text-xs text-slate-350 focus:text-white leading-relaxed resize-none overflow-y-auto"
                      placeholder="Write lessons, equations or scripts. MAHR will write here automatically to teach you!"
                    />
                  </div>

                  {/* Rendered output area */}
                  <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-[#020205]">
                    <div className="bg-slate-950/40 px-3.5 py-1.5 text-[10px] font-mono text-cyan-400 tracking-wider font-semibold uppercase border-b border-white/5 flex justify-between">
                      <span>👁️ Lecture blackboard Screen</span>
                      {diagramType !== "notes" && (
                        <span className="text-purple-400 uppercase font-black tracking-widest text-[8px] bg-purple-500/10 px-1 rounded">
                          {diagramType} Mode
                        </span>
                      )}
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto select-text scrollbar-thin scrollbar-thumb-slate-800">
                      <div className="space-y-3 prose prose-invert max-w-none">
                        {renderSimpleMarkdown(text)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DIGITAL DRAWING CHALKBOARD AREA (Active in split or canvas mode) */}
            {(activeMode === "split" || activeMode === "canvas") && (
              <div className={`h-full flex flex-col relative ${
                activeMode === "canvas" ? "w-full" : "w-1/2"
              }`}>
                {/* HELP CARD SIDE DRAWER OVERLAY (HINT CARD) */}
                <AnimatePresence>
                  {showHelper && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute top-18 right-4 w-72 p-4.5 rounded-2xl border border-purple-500/20 bg-slate-900/90 backdrop-blur-xl shadow-2xl z-20 text-xs"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono text-purple-400 font-bold tracking-widest uppercase">🎓 Classroom Coach Tips</span>
                        <button onClick={() => setShowHelper(false)} className="text-slate-500 hover:text-white cursor-pointer select-none">
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-slate-300 leading-relaxed mb-3">
                        Draw math derivatives, flow paths, or diagrams freehand. You can say to MAHR:
                        <br />
                        <span className="italic text-cyan-400 font-medium">
                          &quot;Expan gravity on the board&quot;
                        </span> or 
                        <span className="italic text-cyan-400 font-medium ml-1">
                          &quot;Draw a sorting flowchart&quot;
                        </span>.
                      </p>
                      <p className="text-[10px] text-slate-400 border-t border-white/5 pt-2 font-mono">
                        💡 Since MAHR can see your viewport when screen sharing is active, you can write formulas and ask to explain them!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actual canvas painting layer */}
                <div className="flex-1 relative bg-[#080812] select-none flex flex-col min-h-0 overflow-hidden w-full h-full">
                  <div className={`chalkboard-canvas-container flex-1 w-full h-full relative ${
                    isPanning ? "cursor-grabbing" : tool === "pan" ? "cursor-grab" : "cursor-crosshair"
                  }`}>
                      <canvas
                        ref={canvasRef}
                        onPointerDown={(e) => {
                          try {
                            (e.target as HTMLElement).setPointerCapture(e.pointerId);
                          } catch (err) {}
                          startDrawing(e);
                        }}
                        onPointerMove={(e) => {
                          draw(e);
                        }}
                        onPointerUp={(e) => {
                          try {
                            if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
                              (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                            }
                          } catch (err) {}
                          stopDrawing();
                        }}
                        onPointerCancel={(e) => {
                          try {
                            if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
                              (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                            }
                          } catch (err) {}
                          stopDrawing();
                        }}
                        className="chalkboard-canvas absolute inset-0 w-full h-full select-none touch-none"
                        style={{ touchAction: "none" }}
                      />

                      {/* Smart Pen Auto-Correction Feedback Toast */}
                      <AnimatePresence>
                        {smartPenToast && (
                          <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/40 px-4 py-2 rounded-xl text-amber-300 font-mono text-xs shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 backdrop-blur-md pointer-events-none"
                          >
                            <Wand2 size={14} className="text-amber-400 animate-pulse" />
                            <span>{smartPenToast}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Real-time Stylus Pressure Dynamics HUD */}
                      <WhiteboardStylusHUD
                        isVisible={showPressureHUD && Boolean(livePressureTelemetry || isDrawing)}
                        livePressureTelemetry={livePressureTelemetry}
                        isDrawing={isDrawing}
                        activeBrushName={activeBrushProfile.name}
                        defaultWidth={currentLineWidthRef.current || brushSize || 4}
                        onDismiss={() => setShowPressureHUD(false)}
                      />

                      {/* Playback Control Bar */}
                      <AnimatePresence>
                        {isPlaybackMode && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/40 px-5 py-3 rounded-2xl text-white shadow-[0_0_25px_rgba(0,0,0,0.8)] flex items-center gap-4 backdrop-blur-xl pointer-events-auto max-w-xl w-[92%]"
                          >
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleScrubPlayback(0)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
                                title="Rewind to start (Step 0)"
                              >
                                <RotateCcw size={12} />
                              </button>
                              <button
                                onClick={() => setIsPlaybackPlaying(!isPlaybackPlaying)}
                                className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                                title={isPlaybackPlaying ? "Pause Playback" : "Play Action Sequence"}
                              >
                                {isPlaybackPlaying ? <Pause size={14} /> : <Play size={14} />}
                              </button>
                            </div>

                            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 gap-2 overflow-hidden">
                                <span className="truncate text-amber-300 font-medium">
                                  {recordedStrokes[playbackStep - 1]?.description ||
                                    recordedStrokes[playbackStep - 1]?.name ||
                                    (playbackStep === 0 ? "🎬 Action Recording Ready" : `Action Step #${playbackStep}`)}
                                </span>
                                <span className="text-amber-300 font-bold shrink-0">
                                  {playbackStep} / {recordedStrokes.length > 0 ? recordedStrokes.length : history.length} Steps
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={recordedStrokes.length > 0 ? recordedStrokes.length : history.length}
                                value={playbackStep}
                                onChange={(e) => handleScrubPlayback(parseInt(e.target.value))}
                                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {[0.5, 1, 2, 4].map((spd) => (
                                <button
                                  key={spd}
                                  onClick={() => setPlaybackSpeed(spd)}
                                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition cursor-pointer ${
                                    playbackSpeed === spd
                                      ? "bg-amber-500 text-slate-950 font-bold"
                                      : "bg-white/5 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  {spd}x
                                </button>
                              ))}
                              <button
                                onClick={resetStrokeCounter}
                                className="p-1.5 ml-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition cursor-pointer"
                                title="Reset stroke recording counter to 0"
                              >
                                <RotateCcw size={12} className="text-rose-400" />
                              </button>
                              <button
                                onClick={handleExitPlayback}
                                className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                title="Close Playback"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Layer Management Floating Panel Overlay */}
                      <AnimatePresence>
                        {showLayersPanel && (
                          <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-4 right-4 z-40 w-80 bg-slate-950/95 border border-purple-500/30 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col max-h-[calc(100%-2rem)] overflow-hidden text-slate-200"
                          >
                            {/* Panel Header */}
                            <div className="p-3.5 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-2">
                                <Layers size={15} className="text-purple-400" />
                                <span className="text-xs font-bold font-mono text-white">Layer Stack</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {layers.length}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={handleAddLayer}
                                  className="px-2.5 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-mono text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                                  title="Add new transparent layer on top"
                                >
                                  <Plus size={11} />
                                  <span>Add Layer</span>
                                </button>
                                <button
                                  onClick={() => setShowLayersPanel(false)}
                                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Layer Stack Items (Top layer rendered on top) */}
                            <div className="p-3 overflow-y-auto space-y-2.5 flex-1 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-800">
                              {[...layers].reverse().map((layer, reverseIndex) => {
                                const realIndex = layers.length - 1 - reverseIndex;
                                const isActive = layer.id === activeLayerId;

                                return (
                                  <div
                                    key={layer.id}
                                    onClick={() => {
                                      setActiveLayerId(layer.id);
                                      activeLayerIdRef.current = layer.id;
                                    }}
                                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                                      isActive
                                        ? "bg-purple-500/15 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                        : "bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900/90"
                                    }`}
                                  >
                                    {/* Layer Info & Core Controls */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleVisibility(layer.id);
                                          }}
                                          className={`p-1 rounded transition cursor-pointer ${
                                            layer.visible ? "text-purple-300 hover:text-white" : "text-slate-600 hover:text-slate-400"
                                          }`}
                                          title={layer.visible ? "Hide Layer" : "Show Layer"}
                                        >
                                          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleLock(layer.id);
                                          }}
                                          className={`p-1 rounded transition cursor-pointer ${
                                            layer.locked ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                                          }`}
                                          title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                                        >
                                          {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                                        </button>

                                        <input
                                          type="text"
                                          value={layer.name}
                                          onChange={(e) => handleRenameLayer(layer.id, e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="bg-transparent text-xs font-mono font-medium text-slate-200 focus:text-white outline-none border-b border-transparent focus:border-purple-400 px-1 py-0.5 flex-1 min-w-0"
                                        />
                                      </div>

                                      {/* Reorder & Duplicate */}
                                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          onClick={() => handleMoveLayer(layer.id, "up")}
                                          disabled={realIndex === layers.length - 1}
                                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition"
                                          title="Move Layer Up"
                                        >
                                          <ArrowUp size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleMoveLayer(layer.id, "down")}
                                          disabled={realIndex === 0}
                                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition"
                                          title="Move Layer Down"
                                        >
                                          <ArrowDown size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleDuplicateLayer(layer.id)}
                                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                                          title="Duplicate Layer"
                                        >
                                          <Copy size={12} />
                                        </button>
                                        {realIndex > 0 && (
                                          <button
                                            onClick={() => handleMergeDown(layer.id)}
                                            className="p-1 rounded hover:bg-white/10 text-amber-400 hover:text-amber-300 transition"
                                            title="Merge Down to Layer Below"
                                          >
                                            <Combine size={12} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteLayer(layer.id)}
                                          disabled={layers.length <= 1}
                                          className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 disabled:opacity-20 disabled:cursor-not-allowed transition"
                                          title="Delete Layer"
                                        >
                                          <X size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Opacity slider */}
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-1" onClick={(e) => e.stopPropagation()}>
                                      <span className="shrink-0 w-12">Opacity:</span>
                                      <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={layer.opacity}
                                        onChange={(e) => handleSetOpacity(layer.id, parseFloat(e.target.value))}
                                        className="flex-1 accent-purple-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                                      />
                                      <span className="shrink-0 w-8 text-right text-slate-300 font-bold">
                                        {Math.round(layer.opacity * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Layer Toast Alert */}
                      <AnimatePresence>
                        {layerToast && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-4 right-4 z-50 bg-slate-900/95 border border-purple-500/40 px-4 py-2 rounded-xl text-purple-200 font-mono text-xs shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2 backdrop-blur-md pointer-events-none"
                          >
                            <Sparkles size={13} className="text-purple-400" />
                            <span>{layerToast}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Zoom and Pan interactive HUD controls */}
                      <WhiteboardZoomBar
                        zoom={zoom}
                        onZoomIn={() => setZoom((prev) => Math.min(prev * 1.15, 8))}
                        onZoomOut={() => setZoom((prev) => Math.max(prev / 1.15, 0.4))}
                        onResetZoom={() => {
                          setZoom(1);
                          setPanX(0);
                          setPanY(0);
                        }}
                      />
                      
                      {/* Subtle Blackboard grid texture */}
                      <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                      {/* Real-time Voice to Sketch visual parser feedback */}
                      {voiceSketchActive && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#090916]/90 border border-cyan-500/20 rounded-full px-5 py-2 flex items-center gap-2.5 shadow-[0_0_20px_rgba(6,182,212,0.1)] backdrop-blur-sm pointer-events-none">
                          <Activity size={12} className="text-cyan-400 animate-spin" />
                          <span className="font-mono text-[9px] text-cyan-300 uppercase tracking-widest tracking-tight">
                            {voiceSketchProgress || "Anharmonic Sketching Stream..."}
                          </span>
                        </div>
                      )}

                      {/* Real-time DLD Gate simulator overlay */}
                      {showMiniDld && (
                        <div 
                          className="absolute right-4 bottom-4 z-40 bg-slate-950/90 border border-purple-500/30 rounded-2xl p-4 w-96 shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-md pointer-events-auto"
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                            <span className="font-mono text-[10px] uppercase font-black tracking-widest text-purple-400 flex items-center gap-1.5">
                              🕹️ Interactive DLD Gate simulator
                            </span>
                            <button 
                              onClick={() => setShowMiniDld(false)}
                              className="text-slate-500 hover:text-white cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <MiniDldSimulator />
                        </div>
                      )}

                      {/* Real-time Voice to Sketch controller overlay */}
                      {showVoiceSketch && (
                        <div 
                          className="absolute left-4 bottom-4 z-40 bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 w-80 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md pointer-events-auto"
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                            <span className="font-mono text-[10px] uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5 align-middle">
                              🎙️ Voice-To-Sketch command center
                            </span>
                            <button 
                              onClick={() => setShowVoiceSketch(false)}
                              className="text-slate-500 hover:text-white cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="space-y-3 font-mono text-[10px]">
                            <p className="text-slate-450 leading-normal text-[8.5px]">
                              Say any verbal system description or click one of the preset subjects below to animate the sketching sequence stroke-by-stroke in real-time.
                            </p>
                            
                            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                              {VOICE_PRESETS.map((p, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleLocalVoiceSketch(p.name)}
                                  className="w-full text-left p-1.5 bg-slate-900/60 hover:bg-slate-900 hover:border-cyan-500/30 border border-white/5 rounded-lg text-slate-300 transition text-[9px] cursor-pointer"
                                >
                                  <span className="font-bold text-cyan-400 block pb-0.5">🎤 &quot;Draw {p.name}&quot;</span>
                                  <span className="text-[7.5px] text-slate-500 block line-clamp-1">{p.description}</span>
                                </button>
                              ))}
                            </div>

                            <div className="flex gap-1.5 pt-1">
                              <input 
                                type="text"
                                placeholder="State any custom sketch logic here..."
                                value={voicePromptText}
                                onChange={(e) => setVoicePromptText(e.target.value)}
                                className="flex-1 bg-slate-900 border border-white/5 rounded px-2 py-1 text-slate-200 text-[8.5px] outline-none focus:border-cyan-400"
                              />
                              <button
                                onClick={() => voicePromptText && handleLocalVoiceSketch(voicePromptText)}
                                className="px-2 py-1 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded text-[9px] font-black cursor-pointer hover:bg-cyan-900/40 active:scale-95 transition-all"
                              >
                                SKETCH
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 🧠 Interactive Mind Map Studio Layer (Vector Memory Driven) */}
                      {showMindMapCanvas && (
                        <div className="absolute inset-0 z-30 bg-[#050510] flex flex-col pointer-events-auto">
                          <InteractiveMindMapCanvas
                            initialTopic={
                              text?.startsWith("# 🧠 ")
                                ? text.replace(/^# 🧠 /, "").split("\n")[0]?.trim()
                                : undefined
                            }
                            onAskMahr={(q) => handleAskTutor?.(q)}
                            onAskMyraa={(q) => handleAskTutor?.(q)}
                            onUpdateWhiteboardText={(md) => onTextChange(md)}
                            onClose={() => {
                              setShowMindMapCanvas(false);
                              setChalkboardEngineMode("chalkboard");
                            }}
                            className="w-full h-full"
                          />
                        </div>
                      )}

                      {/* 🔀 Interactive Flowchart & Workflow Canvas Layer */}
                      {showFlowchartCanvas && (
                        <div className="absolute inset-0 z-30 bg-[#070712] flex flex-col pointer-events-auto">
                          <FlowchartCanvas
                            initialPresetId={activeFlowchartPresetId}
                            onAskMahr={(q) => handleAskTutor?.(q)}
                            onAskMyraa={(q) => handleAskTutor?.(q)}
                            onClose={() => {
                              setShowFlowchartCanvas(false);
                              setChalkboardEngineMode("chalkboard");
                            }}
                            className="w-full h-full"
                          />
                        </div>
                      )}

                      {/* 🌌 Universal AI Simulation Engine (2D Liquid State & 3D WebGL Physics) */}
                      {showAiSimulation && (
                        <div className="absolute inset-0 z-30 bg-[#03030c] flex flex-col pointer-events-auto">
                          <UniversalSimulationStudio
                            isOpen={true}
                            embedded={true}
                            initialMode={simulationInitialMode}
                            initialPrompt="Human lungs breathing with asthma"
                            onAskMahr={(q) => handleAskTutor?.(q)}
                            onAskMyraa={(q) => handleAskTutor?.(q)}
                            onClose={() => {
                              setShowAiSimulation(false);
                              setChalkboardEngineMode("chalkboard");
                            }}
                          />
                        </div>
                      )}

                      {/* 📊 Presentation & Google Slides Studio Layer */}
                      {showSlidesCanvas && (
                        <div className="absolute inset-0 z-30 bg-[#050510] flex flex-col pointer-events-auto">
                          <SlideStudioWhiteboard
                            initialTopic={activeSlidesTopic || initialSlidesTopic || (text?.startsWith("# 🎓 ") ? text.replace(/^# 🎓 /, "").split("\n")[0]?.trim() : undefined)}
                            onBackToSlate={() => {
                              setShowSlidesCanvas(false);
                              setChalkboardEngineMode("chalkboard");
                            }}
                            onAskMahr={(q) => handleAskTutor?.(q)}
                          />
                        </div>
                      )}

                      {/* Floating Bottom Dock for Drawing Tools, Colors & Brushes - ONLY in 2D Slate mode */}
                      {chalkboardEngineMode === "chalkboard" && !showMindMapCanvas && !showFlowchartCanvas && !showAiSimulation && !showSlidesCanvas && (
                        <WhiteboardFloatingDock
                          tool={tool as any}
                          onSelectTool={(t) => setTool(t as any)}
                          color={color}
                          onSelectColor={(c) => setColor(c)}
                          brushSize={brushSize}
                          onSelectBrushSize={(s) => setBrushSize(s)}
                          activeBrushProfile={activeBrushProfile}
                          onSelectBrushProfile={setActiveBrushProfile}
                          onOpenBrushTuner={() => setShowBrushProfilesModal(true)}
                          showVoiceSketch={showVoiceSketch}
                          onToggleVoiceSketch={() => setShowVoiceSketch(!showVoiceSketch)}
                          showMiniDld={showMiniDld}
                          onToggleMiniDld={() => setShowMiniDld(!showMiniDld)}
                          isPlaybackMode={isPlaybackMode}
                          onTogglePlayback={() => setIsPlaybackMode(!isPlaybackMode)}
                        />
                      )}

                      {/* Settings & Utilities Drawer */}
                      <WhiteboardUtilityDrawer
                        isOpen={showUtilityDrawer}
                        onClose={() => setShowUtilityDrawer(false)}
                        gridType={gridType}
                        onSelectGridType={setGridType}
                        isAudioFeedbackEnabled={isAudioFeedbackEnabled}
                        onToggleAudioFeedback={() => setIsAudioFeedbackEnabled(!isAudioFeedbackEnabled)}
                        showPressureHUD={showPressureHUD}
                        onTogglePressureHUD={() => setShowPressureHUD(!showPressureHUD)}
                        onOpenDeduplicator={() => setShowDeduplicatorModal(true)}
                        onResetStrokeCounter={resetStrokeCounter}
                        onToggleVoiceSketch={() => setShowVoiceSketch(!showVoiceSketch)}
                        onToggleMiniDld={() => setShowMiniDld(!showMiniDld)}
                      />

                      {/* AI Image Generation & Stamping Modal */}
                      <WhiteboardAIImageModal
                        isOpen={showAIImageModal}
                        onClose={() => setShowAIImageModal(false)}
                        onStampToCanvas={handleStampImageToCanvas}
                      />
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* CHALKBOARD FOOTER - SIMPLE METRIC LABELS */}
          <div className="px-6 py-2 border-t border-white/5 bg-slate-950/80 shrink-0 flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest pointer-events-none select-none">
            <span>Room session link: ACTIVE</span>
            <span>Chalk Glow: Core Engine</span>
          </div>

          {/* Real-time Slate Deduplication & Optimization Toast */}
          <AnimatePresence>
            {slateDeduplicationToast && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
              >
                <div className="px-4 py-2 rounded-2xl bg-purple-950/90 border border-purple-500/40 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.35)] text-xs font-mono text-purple-200 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-400 animate-spin-slow shrink-0" />
                  <span>{slateDeduplicationToast}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VISUAL SLATE DEDUPLICATOR & OPTIMIZER MODAL */}
          <SlateDeduplicatorModal
            isOpen={showDeduplicatorModal}
            onClose={() => setShowDeduplicatorModal(false)}
            isAutoDeduplicateActive={isSlateDeduplicatorActive}
            onToggleAutoDeduplicate={(active) => {
              setIsSlateDeduplicatorActive(active);
              try {
                localStorage.setItem("myraa_chalkboard_auto_deduplicate", String(active));
              } catch {}
            }}
            onRunManualPass={handleManualDeduplicationPass}
            report={deduplicationReport}
            currentSlateCount={drawings ? drawings.length : 0}
          />

          {/* BRUSH PROFILES & PRESSURE DYNAMICS MODAL */}
          <BrushProfilesModal
            isOpen={showBrushProfilesModal}
            onClose={() => setShowBrushProfilesModal(false)}
            activeProfile={activeBrushProfile}
            onSelectProfile={(prof) => {
              setActiveBrushProfile(prof);
              setTool("pen");
            }}
            currentColor={color}
          />
      </motion.div>
    )}
  </AnimatePresence>
);
}

// Interactive Mini DLD Trainer Board Component for real-time signal propagation
export function MiniDldSimulator() {
  const [activeGate, setActiveGate] = useState<"AND" | "OR" | "NOT">("AND");
  const [inA, setInA] = useState<boolean>(false);
  const [inB, setInB] = useState<boolean>(false);
  const [inNot, setInNot] = useState<boolean>(false);

  // Compute signal propagation
  const outputVal = activeGate === "AND" 
    ? inA && inB 
    : activeGate === "OR" 
      ? inA || inB 
      : !inNot;

  return (
    <div className="flex flex-col gap-3 font-mono text-xs select-none p-1 text-slate-200">
      {/* Gate Tabs Selector */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
        {(["AND", "OR", "NOT"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setActiveGate(g)}
            className={`flex-1 py-1 px-2 rounded-lg border text-[9px] font-black tracking-widest transition-all cursor-pointer ${
              activeGate === g
                ? "bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {g} GATE
          </button>
        ))}
      </div>

      {/* Logic Gate Trainer Board Graphic */}
      <div className="bg-slate-950/40 rounded-xl border border-white/5 p-3 flex items-center justify-between gap-1 relative overflow-hidden">
        {/* Schematic matrix lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

        {/* Inputs Column */}
        <div className="flex flex-col gap-4 relative z-10">
          {activeGate !== "NOT" ? (
            <>
              <div className="flex flex-col items-start gap-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Input A</span>
                <button
                  onClick={() => setInA(!inA)}
                  className={`px-2 py-0.5 border rounded-md text-center cursor-pointer font-bold transition-all text-[9px] ${
                    inA 
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-350 shadow-[0_0_8px_rgba(52,211,153,0.15)]" 
                      : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {inA ? "HIGH (1)" : "LOW (0)"}
                </button>
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Input B</span>
                <button
                  onClick={() => setInB(!inB)}
                  className={`px-2 py-0.5 border rounded-md text-center cursor-pointer font-bold transition-all text-[9px] ${
                    inB 
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-350 shadow-[0_0_8px_rgba(52,211,153,0.15)]" 
                      : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {inB ? "HIGH (1)" : "LOW (0)"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-start gap-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Input IN</span>
              <button
                onClick={() => setInNot(!inNot)}
                className={`px-2 py-0.5 border rounded-md text-center cursor-pointer font-bold transition-all text-[9px] ${
                  inNot 
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-350 shadow-[0_0_8px_rgba(52,211,153,0.15)]" 
                    : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {inNot ? "HIGH (1)" : "LOW (0)"}
              </button>
            </div>
          )}
        </div>

        {/* Connecting signal lines */}
        <div className="flex-1 flex flex-col justify-around h-16 relative pointer-events-none mx-2">
          {activeGate !== "NOT" ? (
            <>
              {/* Wire A */}
              <div className="w-full h-1 relative">
                <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors duration-300 ${inA ? "bg-emerald-450 shadow-[0_0_6px_#10b981]" : "bg-white/10"}`} />
              </div>
              {/* Wire B */}
              <div className="w-full h-1 relative mt-2">
                <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors duration-300 ${inB ? "bg-emerald-450 shadow-[0_0_6px_#10b981]" : "bg-white/10"}`} />
              </div>
            </>
          ) : (
            <div className="w-full h-1 relative">
              <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors duration-300 ${inNot ? "bg-emerald-450 shadow-[0_0_6px_#10b981]" : "bg-white/10"}`} />
            </div>
          )}
        </div>

        {/* Central Gate Node */}
        <div className="relative z-10 select-none mx-1">
          <div className="w-16 h-12 rounded-xl bg-slate-900/90 border border-purple-500/40 flex flex-col items-center justify-center p-1 text-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <span className="text-purple-300 text-[9px] font-black tracking-widest uppercase">
              {activeGate}
            </span>
            <span className="text-[7px] font-mono text-slate-500 mt-0.5">
              {activeGate === "AND" ? "A • B" : activeGate === "OR" ? "A + B" : "NOT A"}
            </span>
          </div>
        </div>

        {/* Connecting output signal lines */}
        <div className="flex-1 h-1 relative pointer-events-none mx-2">
          <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors duration-300 ${outputVal ? "bg-emerald-450 shadow-[0_0_6px_#10b981]" : "bg-white/10"}`} />
        </div>

        {/* Output Lamp */}
        <div className="flex flex-col items-end gap-1 relative z-10 w-16 justify-center">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Output</span>
          <div className="flex items-center gap-1">
            <div 
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                outputVal 
                  ? "bg-yellow-450/20 border-yellow-400 text-yellow-300 shadow-[0_0_12px_#f59e0b]" 
                  : "bg-slate-900 border-white/5 text-slate-600"
              }`}
            >
              <Sparkles size={10} className={outputVal ? "animate-pulse" : ""} />
            </div>
            <span className={`text-[8.5px] font-black ${outputVal ? "text-yellow-400 animate-pulse" : "text-slate-500"}`}>
              {outputVal ? "1" : "0"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-white/5 pt-1.5">
        <span>📶 Signal latency: 0ns</span>
        <button 
          onClick={() => {
            setInA(false);
            setInB(false);
            setInNot(false);
          }}
          className="text-[7.5px] px-1.5 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-mono text-slate-350 cursor-pointer"
        >
          CLEAR SWITCHES
        </button>
      </div>
    </div>
  );
}
