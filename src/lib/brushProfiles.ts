import { getStroke, StrokeOptions } from "perfect-freehand";

export type PressureCurveType =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "sigmoid"
  | "logarithmic"
  | "exponential"
  | "power"
  | "highlighter-flat"
  | "watercolor-wash";

export type NibShape = "round" | "chisel" | "flat" | "feathered" | "textured" | "chisel-calligraphy";

export type TextureGrainType = "none" | "chalk_dust" | "graphite_grain" | "watercolor_wash" | "rough_paper";

export interface PressureMappingConfig {
  curve: PressureCurveType;
  minOpacity: number;
  maxOpacity: number;
  minSizeMultiplier: number;
  maxSizeMultiplier: number;
  gamma?: number;
}

export interface BrushProfile {
  id: string;
  name: string;
  category: "classic" | "calligraphy" | "artistic" | "academic" | "marking";
  iconName: string;
  description: string;
  baseOpacity: number;
  blendMode: GlobalCompositeOperation;
  nibShape: NibShape;
  nibAngleDeg: number; // For chisel/calligraphy ribbons
  nibAspectRatio: number; // Ratio of width to height for chisel (e.g., 3.5:1)
  pressureMapping: PressureMappingConfig;
  strokeOptions: StrokeOptions;
  textureGrain: TextureGrainType;
  glowBlur?: number;
  glowColorOpacity?: number;
  watercolorBleed?: boolean;
  watercolorGranulation?: number;
}

/**
 * Mathematical curve transformers for Pressure -> Opacity and Pressure -> Size
 */
export function evaluatePressureCurve(
  pressure: number, // normalized 0..1
  curveType: PressureCurveType,
  gamma: number = 1.0
): number {
  const p = Math.max(0, Math.min(1, pressure));

  switch (curveType) {
    case "linear":
      return p;

    case "ease-in":
      return Math.pow(p, 2 * gamma);

    case "ease-out":
      return 1 - Math.pow(1 - p, 2 * gamma);

    case "sigmoid":
      // Smooth S-curve (logistic-like)
      return 1 / (1 + Math.exp(-8 * (p - 0.5) * gamma));

    case "logarithmic":
      // Responsive at very light touches
      return Math.log(1 + 9 * p) / Math.log(10);

    case "exponential":
      return (Math.exp(p * 3 * gamma) - 1) / (Math.exp(3 * gamma) - 1);

    case "power":
      return Math.pow(p, 1.6 * gamma);

    case "highlighter-flat":
      // Constant high transparency, slightly darker on extreme heavy press
      return 0.38 + p * 0.15;

    case "watercolor-wash":
      // Soft translucent buildup (low pressure = soft glaze, high pressure = deep wash)
      return 0.22 + Math.pow(p, 1.4) * 0.65;

    default:
      return p;
  }
}

/**
 * Compute final opacity from raw pressure & brush profile
 */
export function calculateProfileOpacity(
  profile: BrushProfile,
  rawPressure: number
): number {
  const { curve, minOpacity, maxOpacity, gamma } = profile.pressureMapping;
  const curved = evaluatePressureCurve(rawPressure, curve, gamma);
  return minOpacity + curved * (maxOpacity - minOpacity);
}

/**
 * Compute final stroke width multiplier from raw pressure & brush profile
 */
export function calculateProfileWidthMultiplier(
  profile: BrushProfile,
  rawPressure: number
): number {
  const { curve, minSizeMultiplier, maxSizeMultiplier, gamma } = profile.pressureMapping;
  const curved = evaluatePressureCurve(rawPressure, curve, gamma);
  return minSizeMultiplier + curved * (maxSizeMultiplier - minSizeMultiplier);
}

/**
 * Compute dynamic chisel angle width modulation for Calligraphy & Chisel nibs
 */
export function calculateCalligraphyAngleWidth(
  dx: number,
  dy: number,
  nibAngleDeg: number,
  baseWidth: number,
  aspectRatio: number = 3.5
): number {
  const strokeAngle = Math.atan2(dy, dx);
  const nibAngleRad = (nibAngleDeg * Math.PI) / 180;
  
  // Angle difference between movement vector and nib angle
  const angleDiff = Math.abs(strokeAngle - nibAngleRad);
  // Cross section formula: perpendicular = widest, parallel = thinnest
  const sinAngle = Math.abs(Math.sin(angleDiff));
  const minNib = baseWidth / aspectRatio;
  return minNib + (baseWidth - minNib) * Math.max(0.18, sinAngle);
}

/**
 * Library of pre-defined Brush Profiles
 */
export const BRUSH_PROFILES: BrushProfile[] = [
  {
    id: "calligraphy",
    name: "Calligraphy Pen",
    category: "calligraphy",
    iconName: "Feather",
    description: "45° Chiseled nib with velocity dynamics, sharp hairlines, and rich tapered ink flow.",
    baseOpacity: 0.95,
    blendMode: "source-over",
    nibShape: "chisel-calligraphy",
    nibAngleDeg: 42,
    nibAspectRatio: 4.2,
    pressureMapping: {
      curve: "power",
      minOpacity: 0.75,
      maxOpacity: 1.0,
      minSizeMultiplier: 0.25,
      maxSizeMultiplier: 1.6,
      gamma: 1.2
    },
    strokeOptions: {
      thinning: 0.72,
      smoothing: 0.62,
      streamline: 0.55,
      simulatePressure: true,
      start: { taper: 18, cap: true },
      end: { taper: 24, cap: true }
    },
    textureGrain: "none",
    glowBlur: 0
  },
  {
    id: "watercolor",
    name: "Watercolor Brush",
    category: "artistic",
    iconName: "Droplets",
    description: "Soft feathered wet wash with organic pigment diffusion, layering glazes, and edge pooling.",
    baseOpacity: 0.45,
    blendMode: "source-over",
    nibShape: "feathered",
    nibAngleDeg: 0,
    nibAspectRatio: 1.0,
    pressureMapping: {
      curve: "watercolor-wash",
      minOpacity: 0.18,
      maxOpacity: 0.78,
      minSizeMultiplier: 0.5,
      maxSizeMultiplier: 2.2,
      gamma: 1.3
    },
    strokeOptions: {
      thinning: -0.25, // Widens softly with pressure
      smoothing: 0.85,
      streamline: 0.7,
      simulatePressure: true,
      start: { taper: 8, cap: true },
      end: { taper: 12, cap: true }
    },
    textureGrain: "watercolor_wash",
    watercolorBleed: true,
    watercolorGranulation: 0.4
  },
  {
    id: "highlighter",
    name: "Fluorescent Highlighter",
    category: "marking",
    iconName: "Highlighter",
    description: "Translucent flat chisel marker ribbon with blend modes to emphasize text and formulas without obscuring.",
    baseOpacity: 0.38,
    blendMode: "source-over",
    nibShape: "chisel",
    nibAngleDeg: 12,
    nibAspectRatio: 3.2,
    pressureMapping: {
      curve: "highlighter-flat",
      minOpacity: 0.32,
      maxOpacity: 0.48,
      minSizeMultiplier: 0.9,
      maxSizeMultiplier: 1.15,
      gamma: 1.0
    },
    strokeOptions: {
      thinning: 0.05,
      smoothing: 0.75,
      streamline: 0.8,
      simulatePressure: false,
      start: { taper: 2, cap: true },
      end: { taper: 2, cap: true }
    },
    textureGrain: "none",
    glowBlur: 4,
    glowColorOpacity: 0.25
  },
  {
    id: "chalk",
    name: "Liquid Chalk Marker",
    category: "classic",
    iconName: "PenTool",
    description: "Vibrant glowing chalkboard ink with powdery chalk dust halo and balanced pressure sensitivity.",
    baseOpacity: 0.95,
    blendMode: "source-over",
    nibShape: "round",
    nibAngleDeg: 0,
    nibAspectRatio: 1.0,
    pressureMapping: {
      curve: "sigmoid",
      minOpacity: 0.8,
      maxOpacity: 1.0,
      minSizeMultiplier: 0.45,
      maxSizeMultiplier: 1.35,
      gamma: 1.0
    },
    strokeOptions: {
      thinning: 0.35,
      smoothing: 0.65,
      streamline: 0.5,
      simulatePressure: true,
      start: { taper: 4, cap: true },
      end: { taper: 6, cap: true }
    },
    textureGrain: "chalk_dust",
    glowBlur: 6,
    glowColorOpacity: 0.35
  },
  {
    id: "fountain",
    name: "Fountain Pen",
    category: "calligraphy",
    iconName: "Edit3",
    description: "Flex steel nib with deep ink pooling on slow strokes and crisp hairline loops.",
    baseOpacity: 1.0,
    blendMode: "source-over",
    nibShape: "round",
    nibAngleDeg: 30,
    nibAspectRatio: 2.0,
    pressureMapping: {
      curve: "exponential",
      minOpacity: 0.85,
      maxOpacity: 1.0,
      minSizeMultiplier: 0.2,
      maxSizeMultiplier: 1.8,
      gamma: 1.4
    },
    strokeOptions: {
      thinning: 0.85,
      smoothing: 0.55,
      streamline: 0.48,
      simulatePressure: true,
      start: { taper: 14, cap: true },
      end: { taper: 20, cap: true }
    },
    textureGrain: "none"
  },
  {
    id: "pencil",
    name: "Graphite / Charcoal Pencil",
    category: "artistic",
    iconName: "Pencil",
    description: "Textured sketch graphite with pressure-controlled grain density and organic shading.",
    baseOpacity: 0.7,
    blendMode: "source-over",
    nibShape: "textured",
    nibAngleDeg: 0,
    nibAspectRatio: 1.0,
    pressureMapping: {
      curve: "logarithmic",
      minOpacity: 0.25,
      maxOpacity: 0.92,
      minSizeMultiplier: 0.35,
      maxSizeMultiplier: 1.25,
      gamma: 1.1
    },
    strokeOptions: {
      thinning: 0.4,
      smoothing: 0.45,
      streamline: 0.35,
      simulatePressure: true,
      start: { taper: 6, cap: true },
      end: { taper: 8, cap: true }
    },
    textureGrain: "graphite_grain"
  },
  {
    id: "neon",
    name: "Cyber Neon Glow",
    category: "marking",
    iconName: "Zap",
    description: "High-intensity luminescent beam with multi-layer atmospheric bloom for dark chalkboard emphasis.",
    baseOpacity: 1.0,
    blendMode: "screen",
    nibShape: "round",
    nibAngleDeg: 0,
    nibAspectRatio: 1.0,
    pressureMapping: {
      curve: "linear",
      minOpacity: 0.9,
      maxOpacity: 1.0,
      minSizeMultiplier: 0.6,
      maxSizeMultiplier: 1.4,
      gamma: 1.0
    },
    strokeOptions: {
      thinning: 0.2,
      smoothing: 0.7,
      streamline: 0.6,
      simulatePressure: true,
      start: { taper: 8, cap: true },
      end: { taper: 8, cap: true }
    },
    textureGrain: "none",
    glowBlur: 14,
    glowColorOpacity: 0.8
  }
];

export function getBrushProfileById(id: string): BrushProfile {
  return BRUSH_PROFILES.find((p) => p.id === id) || BRUSH_PROFILES[3]; // Default to Chalk
}

/**
 * Generates an SVG path data string from perfect-freehand stroke points
 */
export function getSvgPathFromStroke(stroke: number[][], closed: boolean = true): string {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"] as (string | number)[]
  );
  if (closed) d.push("Z");
  return d.join(" ");
}

/**
 * Render a complete vector freehand stroke using perfect-freehand onto a Canvas2D Context
 */
export function renderProfileStrokeOnCtx(
  ctx: CanvasRenderingContext2D,
  rawPoints: { x: number; y: number; pressure?: number }[],
  profile: BrushProfile,
  color: string,
  baseSize: number,
  offset: { x: number; y: number } = { x: 0, y: 0 }
) {
  if (!rawPoints || rawPoints.length < 2) return;

  // Transform input points for perfect-freehand
  const inputPoints = rawPoints.map((p) => {
    const rawP = p.pressure ?? 0.5;
    const computedPressure = evaluatePressureCurve(rawP, profile.pressureMapping.curve, profile.pressureMapping.gamma);
    return [p.x - offset.x, p.y - offset.y, computedPressure];
  });

  const avgPressure =
    rawPoints.reduce((acc, p) => acc + (p.pressure ?? 0.5), 0) / rawPoints.length;
  const currentOpacity = calculateProfileOpacity(profile, avgPressure);
  const sizeMultiplier = calculateProfileWidthMultiplier(profile, avgPressure);
  const finalSize = baseSize * sizeMultiplier;

  ctx.save();
  ctx.globalCompositeOperation = profile.blendMode;
  ctx.globalAlpha = currentOpacity;

  // Compute stroke polygon with perfect-freehand
  const stroke = getStroke(inputPoints, {
    size: finalSize,
    thinning: profile.strokeOptions.thinning,
    smoothing: profile.strokeOptions.smoothing,
    streamline: profile.strokeOptions.streamline,
    simulatePressure: profile.strokeOptions.simulatePressure,
    start: profile.strokeOptions.start,
    end: profile.strokeOptions.end
  });

  if (stroke.length < 2) {
    ctx.restore();
    return;
  }

  // Handle special effects based on brush profile
  if (profile.glowBlur && profile.glowBlur > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = profile.glowBlur;
  }

  // Draw main stroke polygon
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(stroke[0][0], stroke[0][1]);
  for (let i = 1; i < stroke.length; i++) {
    ctx.lineTo(stroke[i][0], stroke[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  // Watercolor wet soft bloom pass (smooth, no noise dots)
  if (profile.watercolorBleed) {
    ctx.save();
    ctx.globalAlpha = currentOpacity * 0.25;
    ctx.filter = "blur(4px)";
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
