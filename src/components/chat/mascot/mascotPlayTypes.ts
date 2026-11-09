export type MascotActivity =
  | "idle"
  | "idle_yawn"
  | "idle_spin"
  | "idle_antenna_pulse"
  | "idle_drowsy"
  | "sleeping"
  | "roam"
  | "screen_bonk"
  | "stare_curious"
  | "hide_and_seek"
  | "greeting_wave"
  | "backflip"
  | "wiggle"
  | "stretch"
  | "looking_around"
  | "cursor_track"
  | "sleepy"
  | "angry_tantrum"
  | "tickle"
  | "ball_play"
  | "mouse_play"
  | "butterfly_chase"
  | "cyber_cube_juggle"
  | "star_ring_hop";

export type EyeExpression =
  | "normal"
  | "happy"
  | "wink"
  | "curious"
  | "sleepy"
  | "dizzy"
  | "excited"
  | "bonked"
  | "angry"
  | "yawn"
  | "drowsy"
  | "thinking"
  | "talking"
  | "loving"
  | "analytical";

export type HideStage = "none" | "hiding" | "peeking" | "revealed";

export interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  type: "star" | "heart" | "sparkle";
  color: string;
}

export interface BallPlayState {
  active: boolean;
  /** Ball X offset in px relative to mascot center */
  ballX: number;
  /** Ball Y offset in px relative to mascot center */
  ballY: number;
  /** Current bounce count for squash & shadow */
  bounceCount: number;
  /** Impact ripple trigger counter */
  hitTrigger: number;
  /** Boundary wall ricochet indicator */
  wallBounce: "none" | "left" | "right" | "bottom" | "top";
  /** Headbutt combo counter */
  comboCount: number;
}

export type ToyPropType = "none" | "butterfly" | "cyber_cube" | "star_rings";

export interface ToyPropState {
  active: boolean;
  toyType: ToyPropType;
  /** Prop X offset relative to mascot container */
  x: number;
  /** Prop Y offset relative to mascot container */
  y: number;
  /** Rotation in degrees */
  rotation: number;
  /** Prop scale */
  scale: number;
  /** Lifecycle phase */
  phase: "spawn" | "play" | "boop" | "collect";
  /** Sequence step index (1..4) */
  step: number;
}

export interface BonkState {
  active: boolean;
  /** Impact X offset relative to mascot center */
  impactX: number;
  /** Impact Y offset relative to mascot center */
  impactY: number;
  /** Collision surface type */
  variant: "front_glass" | "right_edge" | "bottom_edge";
  /** Impact callout text */
  label: string;
}

export interface CursorPlayState {
  active: boolean;
  /** Target X offset relative to mascot container */
  targetX: number;
  /** Target Y offset relative to mascot container */
  targetY: number;
  /** Phase of cursor play */
  phase: "stalking" | "pouncing" | "boop";
}

/**
 * Playful screen-pet behaviors for the non-repeating shuffle-bag scheduler.
 * Includes full toybox props (plasma ball chase, holo-butterfly, cyber-cube, star rings),
 * acrobatic backflips, directional glass bonks, screen-edge hide-and-seek, cursor pouncing,
 * and full-screen playground roaming.
 */
export const SCREEN_PET_IDLE_POOL: MascotActivity[] = [
  "ball_play",
  "butterfly_chase",
  "cyber_cube_juggle",
  "star_ring_hop",
  "backflip",
  "screen_bonk",
  "hide_and_seek",
  "mouse_play",
  "roam",
  "idle_spin",
  "wiggle",
  "stare_curious",
  "looking_around",
  "greeting_wave",
  "idle_antenna_pulse",
  "stretch",
];

export type TrickCategory =
  | "prop_chase"
  | "spatial_acrobatic"
  | "expressive_emote";

export function getTrickCategory(activity: MascotActivity): TrickCategory {
  switch (activity) {
    case "ball_play":
    case "butterfly_chase":
    case "cyber_cube_juggle":
    case "star_ring_hop":
      return "prop_chase";
    case "roam":
    case "backflip":
    case "screen_bonk":
    case "hide_and_seek":
    case "mouse_play":
      return "spatial_acrobatic";
    default:
      return "expressive_emote";
  }
}

/**
 * Shuffles an array using Fisher-Yates so the mascot cycles through rich
 * screen-pet tricks without repeating recent behaviors.
 */
export function createShuffledActivityBag(
  recentHistory: MascotActivity[] = []
): MascotActivity[] {
  const bag = [...SCREEN_PET_IDLE_POOL];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  // Occasionally (~20% of bags) include a brief self-waking micro-nap
  if (Math.random() < 0.2) {
    const insertIdx = Math.max(4, Math.floor(Math.random() * bag.length));
    bag.splice(insertIdx, 0, "sleeping");
  }

  // Ensure the front of the new bag does not collide with the last 5 performed tricks
  const blocked = new Set(recentHistory.slice(-5));
  if (blocked.size > 0) {
    const allowed: MascotActivity[] = [];
    const deferred: MascotActivity[] = [];
    for (const item of bag) {
      if (blocked.has(item)) {
        deferred.push(item);
      } else {
        allowed.push(item);
      }
    }
    return [...allowed, ...deferred];
  }

  return bag;
}

/**
 * Selects the next playful activity using a continuous shuffle-bag combined with
 * a strict 5-trick anti-repeat history window and category alternation so the loop
 * feels organic, varied, and never repetitive.
 */
export function pickNextNonRepeatingActivity(
  recentHistory: MascotActivity[],
  bagRef: { current: MascotActivity[] }
): MascotActivity {
  const recentFive = recentHistory.slice(-5);
  const recentSet = new Set(recentFive);
  const lastTrick =
    recentFive.length > 0 ? recentFive[recentFive.length - 1] : undefined;
  const lastCategory = lastTrick ? getTrickCategory(lastTrick) : undefined;

  if (bagRef.current.length === 0) {
    bagRef.current = createShuffledActivityBag(recentFive);
  }

  // Try to find the first item in the bag that is NOT in the last 5 tricks AND differs in category from the immediate last trick
  let chosenIdx = bagRef.current.findIndex(
    (act) =>
      !recentSet.has(act) &&
      (!lastCategory || getTrickCategory(act) !== lastCategory)
  );

  // Fallback 1: Any item in the bag NOT in the last 5 tricks
  if (chosenIdx === -1) {
    chosenIdx = bagRef.current.findIndex((act) => !recentSet.has(act));
  }

  // Fallback 2: Refill the bag fresh and pick a non-repeating candidate
  if (chosenIdx === -1) {
    bagRef.current = createShuffledActivityBag(recentFive);
    chosenIdx = bagRef.current.findIndex((act) => !recentSet.has(act));
    if (chosenIdx === -1) chosenIdx = 0;
  }

  const [chosen] = bagRef.current.splice(chosenIdx, 1);
  return chosen || "ball_play";
}

/**
 * Computes a playful full-screen or playground roam coordinate across the viewport.
 */
export function pickPlaygroundRoamOffset(): { x: number; y: number } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const maxLeft = -Math.max(220, Math.min(vw - 160, vw * 0.78));
  const maxUp = -Math.max(160, Math.min(vh - 160, vh * 0.72));

  return {
    x: Math.round(maxLeft * (0.18 + Math.random() * 0.78)),
    y: Math.round(maxUp * (0.15 + Math.random() * 0.78)),
  };
}


