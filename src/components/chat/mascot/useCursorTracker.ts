import { useState, useEffect, useRef, useCallback } from "react";
import {
  Spring2DState,
  TrackerBlinkPattern,
  evaluateTrackerBlinkProgress,
  getTrackerBlinkDurationMs,
  pickNextTrackerBlinkDelayMs,
  pickTrackerBlinkPattern,
  stepDampedSpring2D,
} from "./mascotBlinkAndDampingMath";

export interface GazeTarget {
  lookX: number; // -1 to 1 smoothly damped head horizontal orientation
  lookY: number; // -1 to 1 smoothly damped head vertical orientation
  eyeLookX: number; // -1 to 1 responsive damped eye horizontal orientation
  eyeLookY: number; // -1 to 1 responsive damped eye vertical orientation
  headYaw: number; // -48 to 48 deg damped 3D head yaw
  headPitch: number; // -28 to 28 deg damped 3D head pitch
  rotateZ: number; // -12 to 12 deg damped head tilt/roll
  offsetX: number; // -6.5 to 6.5 px damped body lean toward cursor
  offsetY: number; // -5.0 to 5.0 px damped body lean toward cursor
  distance: number; // pixel distance from mascot center to cursor
  isPointerActive: boolean; // true while user is moving cursor or interacting with page components
  isInteractingWithComponent: boolean; // true when cursor is over or interacting with an active UI control
  blinkProgress: number; // 0 to 1 randomized lifelike eye blink progress
  isBlinking: boolean; // true when eyelids are closing/closed during a blink
}

const INITIAL_GAZE: GazeTarget = {
  lookX: 0,
  lookY: 0,
  eyeLookX: 0,
  eyeLookY: 0,
  headYaw: 0,
  headPitch: 0,
  rotateZ: 0,
  offsetX: 0,
  offsetY: 0,
  distance: 999,
  isPointerActive: false,
  isInteractingWithComponent: false,
  blinkProgress: 0,
  isBlinking: false,
};

/**
 * useCursorTracker
 * Calculates the user's real-time cursor & component interaction position on the screen,
 * applying dual-stage spring-velocity damping to head and eye movements so gaze tracks
 * the cursor naturally without snapping, while driving a lifelike randomized blinking
 * animation right inside the tracking loop.
 */
export function useCursorTracker(
  elementRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
): GazeTarget {
  const [gaze, setGaze] = useState<GazeTarget>(INITIAL_GAZE);

  // Target normalized coordinates from raw cursor/focus events
  const targetNormRef = useRef<{
    x: number;
    y: number;
    distance: number;
    isPointerActive: boolean;
    isInteractingWithComponent: boolean;
  }>({
    x: 0,
    y: 0,
    distance: 999,
    isPointerActive: false,
    isInteractingWithComponent: false,
  });

  // Dual-stage 2nd-order critically damped spring states:
  // 1. Eyes lead with agile, velvety damping (stiffness 170, damping 23)
  const eyeSpringRef = useRef<Spring2DState>({ x: 0, y: 0, vx: 0, vy: 0 });
  // 2. Head/hull follows with heavier, cushioned inertia (stiffness 72, damping 15.5)
  const headSpringRef = useRef<Spring2DState>({ x: 0, y: 0, vx: 0, vy: 0 });

  // Lifelike randomized blinking state inside the cursor tracker
  const blinkStateRef = useRef<{
    activePattern: TrackerBlinkPattern | null;
    blinkStartTime: number;
    nextScheduledBlinkTime: number;
    lastGazeX: number;
    lastGazeY: number;
  }>({
    activePattern: null,
    blinkStartTime: 0,
    nextScheduledBlinkTime: performance.now() + 1800,
    lastGazeX: 0,
    lastGazeY: 0,
  });

  const lastInteractionTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const triggerNaturalBlink = useCallback(
    (now: number, isLargeShift = false) => {
      const b = blinkStateRef.current;
      // Avoid interrupting an already active blink
      if (b.activePattern !== null) return;
      b.activePattern = pickTrackerBlinkPattern(isLargeShift);
      b.blinkStartTime = now;
      b.nextScheduledBlinkTime =
        now +
        getTrackerBlinkDurationMs(b.activePattern) +
        pickNextTrackerBlinkDelayMs(targetNormRef.current.isPointerActive);
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateTargetFromScreenPoint = (
      clientX: number,
      clientY: number,
      targetNode?: EventTarget | null
    ) => {
      const now = performance.now();
      lastInteractionTimeRef.current = now;

      let centerX = window.innerWidth - 64;
      let centerY = window.innerHeight - 64;
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          centerX = rect.left + rect.width / 2;
          centerY = rect.top + rect.height / 2;
        }
      }

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      const maxDistX = Math.max(420, window.innerWidth * 0.68);
      const maxDistY = Math.max(380, window.innerHeight * 0.68);

      const normX = Math.max(
        -1,
        Math.min(1, Math.tanh((dx / maxDistX) * 1.65))
      );
      const normY = Math.max(
        -1,
        Math.min(1, Math.tanh((dy / maxDistY) * 1.55))
      );

      let isComponent = false;
      if (targetNode && targetNode instanceof HTMLElement) {
        isComponent =
          targetNode.closest(
            "button, a, input, textarea, select, canvas, [role='button'], [tabindex]"
          ) !== null;
      }

      if (isActive) {
        // If the cursor jumped across a wide angle (> 0.65 normalized delta),
        // occasionally trigger a natural gaze-shift micro-blink (just like human eyes do!)
        const b = blinkStateRef.current;
        const gazeJump = Math.hypot(normX - b.lastGazeX, normY - b.lastGazeY);
        if (
          gazeJump > 0.68 &&
          now - b.blinkStartTime > 900 &&
          Math.random() < 0.42
        ) {
          triggerNaturalBlink(now, true);
        }
        b.lastGazeX = normX;
        b.lastGazeY = normY;

        targetNormRef.current = {
          x: normX,
          y: normY,
          distance,
          isPointerActive: true,
          isInteractingWithComponent: isComponent,
        };
      } else {
        targetNormRef.current = {
          x: 0,
          y: 0,
          distance,
          isPointerActive: false,
          isInteractingWithComponent: false,
        };
      }
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      updateTargetFromScreenPoint(e.clientX, e.clientY, e.target);
    };

    const handlePointerDown = (e: PointerEvent) => {
      updateTargetFromScreenPoint(e.clientX, e.clientY, e.target);
    };

    const handleFocusOrKeyInteraction = () => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        activeEl !== document.body &&
        activeEl instanceof HTMLElement
      ) {
        const rect = activeEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          updateTargetFromScreenPoint(
            rect.left + Math.min(rect.width * 0.5, 220),
            rect.top + Math.min(rect.height * 0.5, 120),
            activeEl
          );
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("focusin", handleFocusOrKeyInteraction, {
      passive: true,
    });
    window.addEventListener("keydown", handleFocusOrKeyInteraction, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("focusin", handleFocusOrKeyInteraction);
      window.removeEventListener("keydown", handleFocusOrKeyInteraction);
    };
  }, [elementRef, isActive, triggerNaturalBlink]);

  // 60fps Damped Spring-Velocity Loop + Randomized Blinking Envelope
  useEffect(() => {
    let isRunning = true;
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (!isRunning) return;

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const timeSinceInteraction = now - lastInteractionTimeRef.current;
      // Relax gaze gently back toward center after 8 seconds of pointer stillness
      if (
        timeSinceInteraction > 8000 &&
        targetNormRef.current.distance > 95 &&
        targetNormRef.current.isPointerActive
      ) {
        targetNormRef.current = {
          x: 0,
          y: 0,
          distance: 999,
          isPointerActive: false,
          isInteractingWithComponent: false,
        };
      }

      const tgt = isActive
        ? targetNormRef.current
        : {
            x: 0,
            y: 0,
            distance: 999,
            isPointerActive: false,
            isInteractingWithComponent: false,
          };

      // 1. Step damped 2D spring for EYES (faster, responsive yet smooth glide)
      stepDampedSpring2D(
        eyeSpringRef.current,
        tgt.x,
        tgt.y,
        tgt.isPointerActive ? 165 : 95,
        tgt.isPointerActive ? 22.5 : 18,
        dt
      );

      // 2. Step damped 2D spring for HEAD/BODY (softer, heavier inertia so head glides smoothly behind eyes)
      stepDampedSpring2D(
        headSpringRef.current,
        tgt.x,
        tgt.y,
        tgt.isPointerActive ? 74 : 48,
        tgt.isPointerActive ? 15.8 : 13.5,
        dt
      );

      // 3. Evaluate randomized lifelike blinking state machine
      let blinkProgress = 0;
      const b = blinkStateRef.current;
      if (isActive) {
        if (b.activePattern === null && now >= b.nextScheduledBlinkTime) {
          triggerNaturalBlink(now, false);
        }

        if (b.activePattern !== null) {
          const elapsed = now - b.blinkStartTime;
          const duration = getTrackerBlinkDurationMs(b.activePattern);
          if (elapsed >= duration) {
            b.activePattern = null;
            blinkProgress = 0;
          } else {
            blinkProgress = evaluateTrackerBlinkProgress(
              b.activePattern,
              elapsed
            );
          }
        }
      } else {
        b.activePattern = null;
      }

      const headX = headSpringRef.current.x;
      const headY = headSpringRef.current.y;
      const eyeX = eyeSpringRef.current.x;
      const eyeY = eyeSpringRef.current.y;

      setGaze({
        lookX: Number(headX.toFixed(3)),
        lookY: Number(headY.toFixed(3)),
        eyeLookX: Number(eyeX.toFixed(3)),
        eyeLookY: Number(eyeY.toFixed(3)),
        headYaw: Number((headX * 48).toFixed(2)),
        headPitch: Number((headY * 28).toFixed(2)),
        rotateZ: Number((headX * 11).toFixed(2)),
        offsetX: Number((headX * 6.0).toFixed(2)),
        offsetY: Number((headY * 4.6).toFixed(2)),
        distance: tgt.distance,
        isPointerActive: tgt.isPointerActive,
        isInteractingWithComponent: tgt.isInteractingWithComponent,
        blinkProgress: Number(blinkProgress.toFixed(3)),
        isBlinking: blinkProgress > 0.6,
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, triggerNaturalBlink]);

  return gaze;
}
