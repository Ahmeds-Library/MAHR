import { EyeExpression, MascotActivity } from "../useMascotPlayEngine";

export type DronePoseAngle =
  | "front"
  | "three_quarter_left"
  | "three_quarter_right"
  | "side_left"
  | "side_right"
  | "three_quarter_back_left"
  | "three_quarter_back_right"
  | "back"
  | "top_down"
  | "bottom_up"
  | "dynamic_tilt";

export interface DronePerspectiveState {
  /** Horizontal rotation angle in degrees (-180 to 180). 0 = Front, ±38 = 3/4 Front, ±88 = Side, ±135 = 3/4 Back, ±180 = Back */
  yaw: number;
  /** Vertical tilt angle in degrees (-45 to 45). Negative = looking up (Bottom-Up view), Positive = looking down (Top-Down view) */
  pitch: number;
  /** Head cock / banking tilt angle in degrees (-30 to 30). Matches Dynamic Tilt View */
  roll: number;
  /** Vertical hover bob offset in SVG units (-6 to 6) */
  hoverBobY: number;
  /** Horizontal subtle drift offset in SVG units (-3 to 3) */
  hoverDriftX: number;
  /** Subtle squash-and-stretch horizontal scale (0.94 to 1.06) */
  squashX: number;
  /** Subtle squash-and-stretch vertical scale (0.94 to 1.06) */
  squashY: number;
  /** Thruster plasma intensity (0.25 to 1.0) */
  thrusterIntensity: number;
  /** Resolved semantic turnaround pose label */
  activePose: DronePoseAngle;
  /** Smoothly interpolated eyelid closure (0 = wide open ring, 1 = closed neon slit) */
  blinkProgress: number;
  /** Whether blink is currently past threshold */
  isBlinking: boolean;
  /** Autonomous + cursor horizontal eye saccade offset inside the visor (-3.5 to 3.5) */
  eyeGazeX: number;
  /** Autonomous + cursor vertical eye saccade offset inside the visor (-2.5 to 2.5) */
  eyeGazeY: number;
  /** Continuous 60fps phase angle (radians) driving high-frequency plasma flame turbulence & sparks */
  flamePhase: number;
  /** [0..1] Golden-orange afterburner thermal boost intensity during high-speed flight, leaps & braking flares */
  afterburnerIntensity: number;
  /** Dynamic thruster nozzle gimbal vectoring angle in degrees (-18 to 18) */
  nozzleGimbalDeg: number;
  /** Continuous 60fps holographic iris aperture ring rotation in degrees */
  irisRotationDeg: number;
  /** Reactive pupil aperture dilation scale (0.72 to 1.32) */
  pupilScale: number;
}

/**
 * Shared Spherical Projection Geometry
 * Computes locked coordinates for the sphere center, visor bezel, crown dome,
 * lateral ear pods, and lower propulsion collar so all seams connect with 0px drift
 * and upward pitch progressively reveals the underside thruster manifold with zero sudden jumps.
 */
export interface DroneSphericalProjection {
  CX: number;
  CY: number;
  R: number;
  sinYaw: number;
  cosYaw: number;
  sinPitch: number;
  cosPitch: number;
  /** Smoothly normalized [0..1] factor representing how much the drone is looking upward (pitch < 0) */
  upwardTiltFactor: number;
  // Crown dome
  crownX: number;
  crownY: number;
  crownRx: number;
  crownRy: number;
  // Visor Bezel (locked to front hemisphere)
  visorCenterX: number;
  visorCenterY: number;
  visorWidth: number;
  visorHeight: number;
  visorRx: number;
  visorLeft: number;
  visorRight: number;
  visorTop: number;
  visorBottom: number;
  // Lateral Ear Pods (±90° longitude)
  leftEarX: number;
  rightEarX: number;
  earY: number;
  leftEarRx: number;
  rightEarRx: number;
  earRy: number;
  leftEarInFront: boolean;
  rightEarInFront: boolean;
  // Lower Propulsion Collar & Progressive Underside Thruster Manifold
  collarX: number;
  collarY: number;
  collarRx: number;
  collarRy: number;
}

export function computeDroneSphericalProjection(
  yaw: number,
  pitch: number
): DroneSphericalProjection {
  const CX = 60;
  const CY = 55;
  const R = 36;

  const yawRad = (yaw * Math.PI) / 180;
  const pitchRad = (pitch * Math.PI) / 180;

  const sinYaw = Math.sin(yawRad);
  const cosYaw = Math.cos(yawRad);
  const sinPitch = Math.sin(pitchRad);
  const cosPitch = Math.cos(pitchRad);

  // Continuous [0..1] upward tilt factor as pitch goes from -2° to -32° (looking up)
  const upwardTiltFactor = Math.max(0, Math.min(1, (-pitch - 2) / 30));

  // 1. Crown Dome (Top Pole of the sphere — recedes smoothly toward top rim when looking up)
  const crownX = CX + sinYaw * 3.5;
  const crownY = CY - R * 0.82 * Math.cos(pitchRad * 0.6) + sinPitch * 14.5;
  const crownRx = 22.5 + Math.max(0, sinPitch * 4.5) - upwardTiltFactor * 3.5;
  const crownRy = Math.max(3.2, 9.2 + sinPitch * 11.5);

  // 2. Recessed Visor Bezel (Front Equator of the sphere — glides smoothly up the curvature when looking up)
  const visorCenterX = CX + sinYaw * 21.5;
  const visorCenterY = CY - 1 + sinPitch * 16.5;
  const visorWidth = Math.max(11, 46.5 * Math.max(0.2, Math.abs(cosYaw)));
  const visorHeight = Math.max(15.5, 24.5 * Math.cos(pitchRad * 0.48));
  const visorRx = Math.min(visorWidth / 2, visorHeight / 2);

  const visorLeft = visorCenterX - visorWidth / 2;
  const visorRight = visorCenterX + visorWidth / 2;
  const visorTop = visorCenterY - visorHeight / 2;
  const visorBottom = visorCenterY + visorHeight / 2;

  // 3. Lateral Ear Pods (Anchored at ±90° longitude along the sphere equator)
  const leftEarX = CX - R * 0.94 * cosYaw;
  const rightEarX = CX + R * 0.94 * cosYaw;
  const earY = CY + sinPitch * 2.5;

  const earDiscFactor = Math.abs(sinYaw);
  const leftEarRx = 3.8 + earDiscFactor * 12.8;
  const rightEarRx = 3.8 + earDiscFactor * 12.8;
  const earRy = 16.5;

  const leftEarInFront = yaw > 2;
  const rightEarInFront = yaw < -2;

  // 4. Lower Propulsion Collar (Bottom Pole of the sphere)
  // As the drone looks up (sinPitch < 0), the bottom pole smoothly rotates forward & upward into view!
  const collarX = CX + sinYaw * 3.2;
  const collarY = CY + R * 0.88 + sinPitch * 12.5;
  const collarRx = 22.5 + upwardTiltFactor * 2.2;
  const collarRy = Math.max(5.2, 6.2 + Math.max(0, -sinPitch * 11.5));

  return {
    CX,
    CY,
    R,
    sinYaw,
    cosYaw,
    sinPitch,
    cosPitch,
    upwardTiltFactor,
    crownX,
    crownY,
    crownRx,
    crownRy,
    visorCenterX,
    visorCenterY,
    visorWidth,
    visorHeight,
    visorRx,
    visorLeft,
    visorRight,
    visorTop,
    visorBottom,
    leftEarX,
    rightEarX,
    earY,
    leftEarRx,
    rightEarRx,
    earRy,
    leftEarInFront,
    rightEarInFront,
    collarX,
    collarY,
    collarRx,
    collarRy,
  };
}

export interface DroneColorTokens {
  hullHighlight: string;
  hullMid: string;
  hullShadow: string;
  hullDeepShadow: string;
  hullRim: string;
  crownLight: string;
  crownMid: string;
  lavenderLight: string;
  lavenderMid: string;
  lavenderDark: string;
  visorGlassTop: string;
  visorGlassBottom: string;
  eyeCore: string;
  eyeRing: string;
  eyeGlow: string;
  thrusterCore: string;
  thrusterPlume: string;
  afterburnerCore: string;
  afterburnerSheath: string;
  visorHudGrid: string;
}

/**
 * Authentic color palette extracted from the user's 10-view spherical drone character sheet:
 * High-gloss 3D pearl-titanium shell, pastel ice-blue crown dome, metallic lavender-silver bezels,
 * deep holographic obsidian visor, bioluminescent cyan ring eyes, and adaptive plasma-afterburner jet.
 */
export function getDroneColorTokens(
  expression: EyeExpression,
  isRealtimeConnected: boolean = false,
  accentOverride?: string
): DroneColorTokens {
  const isAngry = expression === "angry";
  const isLoving = expression === "loving";

  let eyeRing = "#5CE1E6";
  let eyeGlow = "#00B4D8";
  let eyeCore = "#F0FDFA";

  if (isAngry) {
    eyeRing = "#FB7185";
    eyeGlow = "#E11D48";
    eyeCore = "#FFE4E6";
  } else if (isLoving) {
    eyeRing = "#F472B6";
    eyeGlow = "#DB2777";
    eyeCore = "#FCE7F3";
  } else if (isRealtimeConnected) {
    eyeRing = "#67E8F9";
    eyeGlow = "#06B6D4";
    eyeCore = "#ECFEFF";
  } else if (accentOverride && accentOverride !== "#38bdf8") {
    eyeGlow = accentOverride;
  }

  return {
    hullHighlight: "#FFFFFF",
    hullMid: "#F4F7FB",
    hullShadow: "#CBD5E1",
    hullDeepShadow: "#8E9EB3",
    hullRim: "#75859D",
    crownLight: "#E8F3FE",
    crownMid: "#C3DDF2",
    lavenderLight: "#EAE5FF",
    lavenderMid: "#C4B5FD",
    lavenderDark: "#947EF2",
    visorGlassTop: "#0F172A",
    visorGlassBottom: "#02050D",
    eyeCore,
    eyeRing,
    eyeGlow,
    thrusterCore: isAngry ? "#FDA4AF" : "#E0F2FE",
    thrusterPlume: isAngry ? "#F43F5E" : "#38BDF8",
    afterburnerCore: "#FEF08A",
    afterburnerSheath: "#F97316",
    visorHudGrid: isAngry ? "#FB7185" : "#38BDF8",
  };
}

export interface MahrSphericalDroneProps {
  expression?: EyeExpression;
  themeHex?: string;
  activity?: MascotActivity;
  isHovered?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  isRealtimeConnected?: boolean;
  gaze?: {
    x: number;
    y: number;
    eyeX?: number;
    eyeY?: number;
    blinkProgress?: number;
  };
  audioFrequencies?: number[];
  audioVolume?: number;
  velocityTilt?: number;
  size?: number;
  className?: string;
  forcePose?: DronePoseAngle;
  showGroundShadow?: boolean;
}
