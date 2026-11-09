/**
 * Layer 1 Math & Waveform Utilities for Cursor-Tracking Damping & Lifelike Randomized Blinking
 */

export type TrackerBlinkPattern = "single" | "double" | "flutter" | "slow";

export interface Spring2DState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Advances a 2D critically-damped spring-velocity state toward (targetX, targetY).
 * Ensures smooth, natural acceleration and deceleration rather than instantaneous snapping.
 */
export function stepDampedSpring2D(
  state: Spring2DState,
  targetX: number,
  targetY: number,
  stiffness: number,
  damping: number,
  dt: number
): void {
  const safeDt = Math.min(0.05, Math.max(0.001, dt));
  const ax = (targetX - state.x) * stiffness - state.vx * damping;
  const ay = (targetY - state.y) * stiffness - state.vy * damping;

  state.vx += ax * safeDt;
  state.vy += ay * safeDt;

  state.x += state.vx * safeDt;
  state.y += state.vy * safeDt;
}

/**
 * Picks the next randomized interval (in ms) between natural eye blinks while gazing at the cursor.
 */
export function pickNextTrackerBlinkDelayMs(isPointerActive: boolean): number {
  if (isPointerActive) {
    // Slightly more attentive, lifelike blink cadence while actively tracking cursor (1.8s - 4.2s)
    return 1800 + Math.random() * 2400;
  }
  // Relaxed baseline cadence (2.2s - 4.8s)
  return 2200 + Math.random() * 2600;
}

/**
 * Selects a natural blink pattern with weighted probabilities.
 */
export function pickTrackerBlinkPattern(
  isLargeGazeShift = false
): TrackerBlinkPattern {
  if (isLargeGazeShift) {
    return Math.random() < 0.35 ? "double" : "single";
  }
  const r = Math.random();
  if (r < 0.64) return "single";
  if (r < 0.86) return "double";
  if (r < 0.95) return "flutter";
  return "slow";
}

/**
 * Returns the total duration (in ms) for a given blink pattern.
 */
export function getTrackerBlinkDurationMs(pattern: TrackerBlinkPattern): number {
  switch (pattern) {
    case "single":
      return 190;
    case "double":
      return 360;
    case "flutter":
      return 340;
    case "slow":
      return 440;
  }
}

/**
 * Evaluates normalized eyelid closure `blinkProgress` in [0..1] for elapsed time `elapsedMs`.
 */
export function evaluateTrackerBlinkProgress(
  pattern: TrackerBlinkPattern,
  elapsedMs: number
): number {
  const duration = getTrackerBlinkDurationMs(pattern);
  if (elapsedMs <= 0 || elapsedMs >= duration) return 0;

  const t = elapsedMs / duration; // 0..1

  switch (pattern) {
    case "single": {
      // Fast close (first 38%), smooth open (remaining 62%)
      if (t < 0.38) {
        const p = t / 0.38;
        return Math.sin((p * Math.PI) / 2);
      }
      const p = (t - 0.38) / 0.62;
      return Math.cos((p * Math.PI) / 2);
    }

    case "double": {
      // Two crisp blinks in rapid succession
      if (t < 0.42) {
        const p = t / 0.42;
        return Math.sin(p * Math.PI);
      }
      if (t < 0.54) {
        return 0.12;
      }
      const p = (t - 0.54) / 0.46;
      return Math.sin(p * Math.PI);
    }

    case "flutter": {
      // Cute half-squint flutter before opening wide
      if (t < 0.3) {
        return (t / 0.3) * 0.68;
      }
      if (t < 0.65) {
        const p = (t - 0.3) / 0.35;
        return 0.68 + Math.sin(p * Math.PI) * 0.32;
      }
      const p = (t - 0.65) / 0.35;
      return (1 - p) * 0.68;
    }

    case "slow": {
      // Soft, expressive slow blink
      return Math.sin(t * Math.PI);
    }
  }
}
