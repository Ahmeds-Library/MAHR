import { EyeExpression } from "../useMascotPlayEngine";

/**
 * Layer 1: Multi-Layered Holographic Eye Optics & Emotional Expression Math
 * Computes precision optical iris segments, reactive pupil dilation, starlight catchlights,
 * and expressive curvature paths so the mascot's eyes feel ultra-expressive and alive at 60fps.
 */

export interface IrisTickSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isMajor: boolean;
}

export interface HolographicEyeMetrics {
  /** Outer torus ring radius */
  outerRadius: number;
  /** Segmented rotating optical iris ring radius */
  irisRadius: number;
  /** Reactive inner pupil core radius */
  pupilRadius: number;
  /** Primary top-left starlight catchlight offset & size */
  primaryCatchlight: { cx: number; cy: number; rx: number; ry: number };
  /** Secondary bottom-right opposing rim catchlight */
  secondaryCatchlight: { cx: number; cy: number; r: number };
  /** 8 precision radial iris aperture tick marks */
  irisTicks: IrisTickSegment[];
}

export function computeHolographicEyeMetrics(
  baseRadius: number,
  expression: EyeExpression,
  side: "left" | "right",
  pupilScale: number,
  voiceBoost: number
): HolographicEyeMetrics {
  // Asymmetric curious / wink aperture sizing
  const expressionScale =
    expression === "curious" && side === "right"
      ? 1.18
      : expression === "curious" && side === "left"
      ? 0.88
      : expression === "wink" && side === "right"
      ? 1.08
      : expression === "surprised" || expression === "excited"
      ? 1.12
      : 1.0;

  const outerRadius = baseRadius * voiceBoost * expressionScale;
  const irisRadius = outerRadius * 0.72;
  const pupilRadius = Math.max(
    1.25,
    outerRadius * 0.34 * Math.max(0.72, Math.min(1.35, pupilScale))
  );

  // Radial aperture tick segments inside the hollow optical torus
  const irisTicks: IrisTickSegment[] = [];
  const tickCount = 8;
  for (let i = 0; i < tickCount; i++) {
    const angle = (i * Math.PI * 2) / tickCount;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const isMajor = i % 2 === 0;
    const innerR = outerRadius * (isMajor ? 0.52 : 0.6);
    const outerR = outerRadius * 0.82;

    irisTicks.push({
      x1: cos * innerR,
      y1: sin * innerR,
      x2: cos * outerR,
      y2: sin * outerR,
      isMajor,
    });
  }

  return {
    outerRadius,
    irisRadius,
    pupilRadius,
    primaryCatchlight: {
      cx: -outerRadius * 0.42,
      cy: -outerRadius * 0.42,
      rx: outerRadius * 0.24,
      ry: outerRadius * 0.15,
    },
    secondaryCatchlight: {
      cx: outerRadius * 0.44,
      cy: outerRadius * 0.42,
      r: outerRadius * 0.11,
    },
    irisTicks,
  };
}

/**
 * Generates a miniature glowing heart SVG path centered at (0, 0) for the `loving` expression
 */
export function buildMiniHeartPath(scale: number = 1): string {
  const s = scale;
  return [
    `M 0 ${(1.6 * s).toFixed(2)}`,
    `C ${(-2.2 * s).toFixed(2)} ${(0.2 * s).toFixed(2)}, ${(-2.6 * s).toFixed(2)} ${(
      -1.8 * s
    ).toFixed(2)}, ${(-1.1 * s).toFixed(2)} ${(-2.1 * s).toFixed(2)}`,
    `C ${(-0.4 * s).toFixed(2)} ${(-2.2 * s).toFixed(2)}, 0 ${(-1.5 * s).toFixed(
      2
    )}, 0 ${(-1.0 * s).toFixed(2)}`,
    `C 0 ${(-1.5 * s).toFixed(2)}, ${(0.4 * s).toFixed(2)} ${(-2.2 * s).toFixed(
      2
    )}, ${(1.1 * s).toFixed(2)} ${(-2.1 * s).toFixed(2)}`,
    `C ${(2.6 * s).toFixed(2)} ${(-1.8 * s).toFixed(2)}, ${(2.2 * s).toFixed(
      2
    )} ${(0.2 * s).toFixed(2)}, 0 ${(1.6 * s).toFixed(2)}`,
    "Z",
  ].join(" ");
}

/**
 * Generates a 4-point starlight sparkle path centered at (cx, cy) for `excited` / `happy` eyes
 */
export function buildStarlightSparklePath(
  cx: number,
  cy: number,
  radius: number
): string {
  const rOut = radius;
  const rIn = radius * 0.32;
  return [
    `M ${cx.toFixed(2)} ${(cy - rOut).toFixed(2)}`,
    `Q ${(cx + rIn).toFixed(2)} ${(cy - rIn).toFixed(2)} ${(cx + rOut).toFixed(2)} ${cy.toFixed(2)}`,
    `Q ${(cx + rIn).toFixed(2)} ${(cy + rIn).toFixed(2)} ${cx.toFixed(2)} ${(cy + rOut).toFixed(2)}`,
    `Q ${(cx - rIn).toFixed(2)} ${(cy + rIn).toFixed(2)} ${(cx - rOut).toFixed(2)} ${cy.toFixed(2)}`,
    `Q ${(cx - rIn).toFixed(2)} ${(cy - rIn).toFixed(2)} ${cx.toFixed(2)} ${(cy - rOut).toFixed(2)}`,
    "Z",
  ].join(" ");
}
