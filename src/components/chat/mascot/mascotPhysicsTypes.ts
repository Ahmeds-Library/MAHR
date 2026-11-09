export type TossablePropKind = "plasma_ball" | "butterfly" | "cyber_cube";

export const TOSSABLE_PROP_CYCLE: TossablePropKind[] = [
  "plasma_ball",
  "butterfly",
  "cyber_cube",
];

export type MascotSimMode =
  | "ambient_hover"
  | "prop_chase"
  | "patrol"
  | "star_ring_hop"
  | "mouse_play"
  | "hide_and_seek"
  | "backflip"
  | "screen_bonk"
  | "return_home";

export interface PhysicsVector2D {
  x: number;
  y: number;
}

export interface ViewportPlayBounds {
  /** Minimum X offset relative to bottom-right dock origin (left screen boundary) */
  minX: number;
  /** Maximum X offset relative to bottom-right dock origin (right screen boundary) */
  maxX: number;
  /** Minimum Y offset relative to bottom-right dock origin (top screen boundary) */
  minY: number;
  /** Maximum Y offset relative to bottom-right dock origin (bottom floor boundary) */
  maxY: number;
}

export interface MascotBodyPhysics {
  /** World offset X relative to dock home (0, 0) */
  x: number;
  /** World offset Y relative to dock home (0, 0) */
  y: number;
  /** Velocity X in px/sec */
  vx: number;
  /** Velocity Y in px/sec */
  vy: number;
  /** Banking or acrobatic tilt angle in degrees */
  tiltDeg: number;
  /** Dynamic landing / acrobatic scale multiplier */
  scale: number;
}

export interface ReturnFlightArcState {
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  elapsedSec: number;
  flightDurationSec: number;
  cushionDurationSec: number;
  phase: "arc_flight" | "landing_cushion";
  /** Horizontal travel direction (+1 moving right toward dock, -1 moving left) */
  flightDirX: number;
}

export interface TrickSplineState {
  elapsedSec: number;
  durationSec: number;
  targetX: number;
  targetY: number;
  bonkVariant: "front_glass" | "right_edge" | "bottom_edge";
  emittedMilestones: Record<string, boolean>;
}

export interface PropPhysicsEntity {
  active: boolean;
  kind: TossablePropKind;
  /** World offset X relative to dock home (0, 0) */
  x: number;
  /** World offset Y relative to dock home (0, 0) */
  y: number;
  /** Velocity X in px/sec */
  vx: number;
  /** Velocity Y in px/sec */
  vy: number;
  /** Gravity in px/sec^2 */
  gravity: number;
  /** Wall/floor restitution coefficient (0..1) */
  restitution: number;
  /** Air drag multiplier per second */
  airDrag: number;
  /** Rotation in degrees */
  rotation: number;
  /** Angular velocity in deg/sec */
  angularVelocity: number;
  /** Visual scale */
  scale: number;
  /** Total wall or floor bounces */
  bounceCount: number;
  /** Total mascot headbutt/boop hits */
  comboCount: number;
  /** Timestamp (ms) of last mascot boop to prevent double-collision in same frame */
  lastBoopAt: number;
  /** Elapsed simulation time in seconds */
  elapsedSec: number;
  /** Maximum lifetime in seconds before mascot catches & returns home */
  maxDurationSec: number;
}

export interface FlickDragState {
  isDragging: boolean;
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
  /** Drag vector X in px (direction of cursor drag) */
  deltaX: number;
  /** Drag vector Y in px (direction of cursor drag) */
  deltaY: number;
  /** Clamped launch velocity X in px/sec */
  launchVx: number;
  /** Clamped launch velocity Y in px/sec */
  launchVy: number;
  /** Normalized power 0..1 */
  powerRatio: number;
  /** Prop kind that will be tossed on release */
  propKind: TossablePropKind;
}

/**
 * Computes full-screen responsive play boundaries relative to the mascot's
 * bottom-right dock anchor (`fixed bottom-6 right-6`, center ~72px from right/bottom).
 */
export function getViewportPlayBounds(): ViewportPlayBounds {
  if (typeof window === "undefined") {
    return {
      minX: -680,
      maxX: 24,
      minY: -460,
      maxY: 20,
    };
  }
  const vw = Math.max(360, window.innerWidth);
  const vh = Math.max(420, window.innerHeight);
  const minX = -Math.max(220, vw - 140);
  const maxX = 24;
  const minY = -Math.max(180, vh - 140);
  const maxY = 20;

  return { minX, maxX, minY, maxY };
}

export function clamp01(val: number): number {
  return Math.max(0, Math.min(1, val));
}

export function easeInOutCubic(t: number): number {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

/**
 * Evaluates a 2D Quadratic Bezier curve B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
 */
export function evalQuadraticBezier(
  p0: PhysicsVector2D,
  p1: PhysicsVector2D,
  p2: PhysicsVector2D,
  t: number
): PhysicsVector2D {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/**
 * Evaluates instantaneous tangent velocity vector of a 2D Quadratic Bezier curve
 */
export function evalQuadraticBezierTangent(
  p0: PhysicsVector2D,
  p1: PhysicsVector2D,
  p2: PhysicsVector2D,
  t: number
): PhysicsVector2D {
  return {
    x: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
  };
}

/**
 * Builds a professional curved return-to-dock flight plan from any arena position (startX, startY)
 * back to (0, 0) with an elevated apex control point, braking flare window, and soft landing cushion.
 */
export function createReturnFlightArc(
  startX: number,
  startY: number
): ReturnFlightArcState {
  const dist = Math.hypot(startX, startY);
  // Dynamic duration scaled smoothly by distance (0.58s for nearby hops up to 0.98s for cross-screen flights)
  const flightDurationSec = Math.max(0.56, Math.min(0.98, 0.44 + dist / 1050));

  // Elevate the control point above the midpoint so the drone flies in a graceful upward swooping arc
  const arcLift = Math.max(46, Math.min(135, dist * 0.28 + 32));
  const controlX = startX * 0.46;
  const controlY = Math.min(startY * 0.5, -18) - arcLift;

  const flightDirX = startX < -4 ? 1 : startX > 4 ? -1 : 1;

  return {
    startX,
    startY,
    controlX,
    controlY,
    elapsedSec: 0,
    flightDurationSec,
    cushionDurationSec: 0.3,
    phase: dist < 8 ? "landing_cushion" : "arc_flight",
    flightDirX,
  };
}

/**
 * Computes 60fps soft landing cushion vertical offset and subtle squash/stretch scale
 * during the 0.30s dock touchdown phase.
 */
export function evalLandingCushionBounce(progress: number): {
  offsetY: number;
  scale: number;
  tiltDeg: number;
} {
  const t = clamp01(progress);
  // Damped single-cycle sine wave: dips down +5.6px then rebounds -2.1px then settles smoothly to 0
  const envelope = Math.pow(1 - t, 1.85);
  const wave = Math.sin(t * Math.PI * 2.15);
  const offsetY = wave * 6.4 * envelope;

  // Subtle cushion squash at peak dip, slight stretch on rebound
  const scale = 1 - wave * 0.045 * envelope;
  const tiltDeg = Math.sin(t * Math.PI * 2) * 2.2 * envelope;

  return { offsetY, scale, tiltDeg };
}

