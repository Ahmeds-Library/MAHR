export interface PolarWavePoint {
  x: number;
  y: number;
}

export interface MicDualFilamentConfig {
  centerX: number;
  centerY: number;
  baseRadius: number;
  maxDisplacement: number;
  numControlPoints: number;
  splineTension: number;
  springStiffness: number;
  springDamping: number;
  neighborCoupling: number;
  buttonSpringStiffness: number;
  buttonSpringDamping: number;
}

export const DEFAULT_MIC_DUAL_FILAMENT_CONFIG: MicDualFilamentConfig = {
  centerX: 48,
  centerY: 48,
  baseRadius: 38.2, // Tightly hugs the 64px / 72px mic button border
  maxDisplacement: 5.8, // Compact, fluid aurora silk wave ("halka sa chota sa")
  numControlPoints: 36,
  splineTension: 0.38,
  springStiffness: 265,
  springDamping: 17.5,
  neighborCoupling: 92,
  buttonSpringStiffness: 290,
  buttonSpringDamping: 18.5,
};

/**
 * Pure Layer 1 Math Utility:
 * Converts a ring of 2D points around 360° into a seamless, closed periodic
 * Catmull-Rom to Cubic Bezier (`C`) SVG path string with zero seam at 0°/360°.
 */
export function buildClosedCatmullRomBezierPath(
  points: PolarWavePoint[],
  tension: number = 0.38
): string {
  const n = points.length;
  if (n < 3) return "";

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const cp1x = p1.x + (p2.x - p0.x) * (tension / 2);
    const cp1y = p1.y + (p2.y - p0.y) * (tension / 2);
    const cp2x = p2.x - (p3.x - p1.x) * (tension / 2);
    const cp2y = p2.y - (p3.y - p1.y) * (tension / 2);

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  d += " Z";
  return d;
}

/**
 * Builds a compound SVG path (`fill-rule="evenodd"`) representing a liquid silk
 * aurora ribbon bounded between the outer dynamic wave path and the inner contour path.
 */
export function buildAuroraSilkRibbonPath(
  outerPoints: PolarWavePoint[],
  innerPoints: PolarWavePoint[],
  tension: number = 0.38
): string {
  const outerPath = buildClosedCatmullRomBezierPath(outerPoints, tension);
  const innerPath = buildClosedCatmullRomBezierPath(innerPoints, tension);
  if (!outerPath || !innerPath) return "";
  return `${outerPath} ${innerPath}`;
}

/**
 * Pure Layer 1 Coupled Circular Spring Solver:
 * Integrates a 360° closed ring of damped harmonic oscillators with neighbor-to-neighbor
 * wave tension (`F = -k*(x - target) - c*v + coupling*(x_left + x_right - 2*x)`).
 */
export function stepCircularCoupledSprings(
  positions: Float32Array,
  velocities: Float32Array,
  targets: Float32Array,
  dt: number,
  stiffness: number,
  damping: number,
  neighborCoupling: number
): void {
  const n = positions.length;
  // Sub-step twice for numerical stability at any frame rate
  const subDt = Math.min(0.012, dt * 0.5);

  for (let step = 0; step < 2; step++) {
    for (let i = 0; i < n; i++) {
      const prev = positions[(i - 1 + n) % n];
      const curr = positions[i];
      const next = positions[(i + 1) % n];

      const springForce = -stiffness * (curr - targets[i]);
      const neighborForce = neighborCoupling * (prev + next - 2 * curr);
      const dampingForce = -damping * velocities[i];

      const accel = springForce + neighborForce + dampingForce;
      velocities[i] += accel * subDt;
    }

    for (let i = 0; i < n; i++) {
      positions[i] += velocities[i] * subDt;
    }
  }
}
