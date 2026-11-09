import gsap from "gsap";
import type { MascotActivity, EyeExpression } from "../mascotPlayTypes";

export type BlinkPatternType =
  | "single"
  | "double"
  | "flutter_squint"
  | "slow_drowsy";

export interface BlinkRandomizerTarget {
  blinkProgress: number;
}

export interface BlinkRandomizerContext {
  activity: MascotActivity;
  eyeExpression: EyeExpression;
  isSleeping: boolean;
  isAngry: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}

export interface BlinkRandomizerController {
  start: () => void;
  stop: () => void;
  updateContext: (ctx: BlinkRandomizerContext) => void;
  triggerImmediateBlink: (pattern?: BlinkPatternType) => void;
}

/**
 * Layer 1 Utility: Blink Randomizer for the mascot's glowing hollow cyan ring eyes.
 * Produces rhythmic, organic, and expression-aware eye blinks that drive the SVG
 * morph-target system (`blinkProgress` in [0..1]).
 */
export function createBlinkRandomizer(
  target: BlinkRandomizerTarget,
  initialContext: BlinkRandomizerContext
): BlinkRandomizerController {
  let ctx: BlinkRandomizerContext = { ...initialContext };
  let isRunning = false;
  let timerTween: gsap.core.Tween | null = null;
  let activeTimeline: gsap.core.Timeline | null = null;

  const pickPattern = (): BlinkPatternType => {
    if (ctx.activity === "idle_drowsy") {
      return Math.random() < 0.72 ? "slow_drowsy" : "single";
    }
    if (
      ctx.activity === "stare_curious" ||
      ctx.activity === "looking_around" ||
      ctx.activity === "mouse_play"
    ) {
      const roll = Math.random();
      if (roll < 0.35) return "flutter_squint";
      if (roll < 0.68) return "double";
      return "single";
    }
    if (
      ctx.activity === "ball_play" ||
      ctx.activity === "wiggle" ||
      ctx.activity === "roam" ||
      ctx.isSpeaking
    ) {
      return Math.random() < 0.42 ? "double" : "single";
    }

    const r = Math.random();
    if (r < 0.58) return "single";
    if (r < 0.84) return "double";
    if (r < 0.94) return "flutter_squint";
    return "slow_drowsy";
  };

  const computeNextDelay = (): number => {
    if (ctx.isSleeping) return 2.5;
    if (ctx.activity === "idle_drowsy") {
      return 1.3 + Math.random() * 1.4;
    }
    if (
      ctx.activity === "ball_play" ||
      ctx.activity === "mouse_play" ||
      ctx.activity === "looking_around" ||
      ctx.isSpeaking
    ) {
      return 1.2 + Math.random() * 1.6;
    }
    // Natural rhythmic baseline: 1.5s to 3.8s with organic jitter
    return 1.5 + Math.random() * 2.3;
  };

  const executeBlinkPattern = (
    pattern: BlinkPatternType,
    onDone?: () => void
  ) => {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }

    // If sleeping, keep eyelids gently closed
    if (ctx.isSleeping || ctx.activity === "sleeping") {
      gsap.to(target, {
        blinkProgress: 0.92,
        duration: 0.35,
        ease: "sine.inOut",
        overwrite: "auto",
        onComplete: onDone,
      });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        activeTimeline = null;
        if (onDone) onDone();
      },
    });
    activeTimeline = tl;

    switch (pattern) {
      case "single": {
        tl.to(target, {
          blinkProgress: 1,
          duration: 0.065,
          ease: "power2.in",
        }).to(target, {
          blinkProgress: 0,
          duration: 0.115,
          ease: "power2.out",
        });
        break;
      }

      case "double": {
        tl.to(target, {
          blinkProgress: 1,
          duration: 0.058,
          ease: "power2.in",
        })
          .to(target, {
            blinkProgress: 0.08,
            duration: 0.085,
            ease: "power2.out",
          })
          .to(
            target,
            {
              blinkProgress: 1,
              duration: 0.055,
              ease: "power2.in",
            },
            "+=0.045"
          )
          .to(target, {
            blinkProgress: 0,
            duration: 0.12,
            ease: "power2.out",
          });
        break;
      }

      case "flutter_squint": {
        // Playful half-squint flutter before snapping wide open
        tl.to(target, {
          blinkProgress: 0.54,
          duration: 0.09,
          ease: "sine.out",
        })
          .to(target, {
            blinkProgress: 0.96,
            duration: 0.06,
            ease: "power2.in",
          })
          .to(target, {
            blinkProgress: 0.35,
            duration: 0.08,
            ease: "sine.out",
          })
          .to(
            target,
            {
              blinkProgress: 0,
              duration: 0.14,
              ease: "back.out(1.6)",
            },
            "+=0.06"
          );
        break;
      }

      case "slow_drowsy": {
        tl.to(target, {
          blinkProgress: 0.98,
          duration: 0.22,
          ease: "sine.inOut",
        })
          .to(target, {
            blinkProgress: 0.98,
            duration: 0.12,
          })
          .to(target, {
            blinkProgress: 0,
            duration: 0.28,
            ease: "sine.out",
          });
        break;
      }
    }
  };

  const scheduleNext = () => {
    if (!isRunning) return;
    if (timerTween) {
      timerTween.kill();
      timerTween = null;
    }

    const delay = computeNextDelay();
    timerTween = gsap.delayedCall(delay, () => {
      if (!isRunning) return;

      // Skip interrupting intense dizzy or angry states, just reschedule
      if (ctx.isAngry || ctx.eyeExpression === "dizzy") {
        scheduleNext();
        return;
      }

      const pattern = pickPattern();
      executeBlinkPattern(pattern, () => {
        scheduleNext();
      });
    });
  };

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      scheduleNext();
    },
    stop: () => {
      isRunning = false;
      if (timerTween) {
        timerTween.kill();
        timerTween = null;
      }
      if (activeTimeline) {
        activeTimeline.kill();
        activeTimeline = null;
      }
    },
    updateContext: (nextCtx: BlinkRandomizerContext) => {
      const wasSleeping = ctx.isSleeping || ctx.activity === "sleeping";
      const nowSleeping = nextCtx.isSleeping || nextCtx.activity === "sleeping";
      ctx = { ...nextCtx };

      // When waking up from a micro-nap, snap eyes open with a double-blink
      if (wasSleeping && !nowSleeping && isRunning) {
        executeBlinkPattern("double", () => {
          scheduleNext();
        });
      }
    },
    triggerImmediateBlink: (pattern: BlinkPatternType = "single") => {
      if (!isRunning) return;
      executeBlinkPattern(pattern, () => {
        scheduleNext();
      });
    },
  };
}
