import { useState, useRef, useCallback, useEffect } from "react";
import {
  FlickDragState,
  TossablePropKind,
  TOSSABLE_PROP_CYCLE,
} from "./mascotPhysicsTypes";

interface UseMascotFlickTossParams {
  disabled: boolean;
  selectedTossProp: TossablePropKind;
  onSelectNextProp: (next: TossablePropKind) => void;
  onTossProp: (kind: TossablePropKind, vx: number, vy: number) => void;
}

const DRAG_THRESHOLD_PX = 8;
const MAX_DRAG_DISTANCE_PX = 160;
const VELOCITY_MULTIPLIER = 6.2;

const INITIAL_DRAG_STATE: FlickDragState = {
  isDragging: false,
  startClientX: 0,
  startClientY: 0,
  currentClientX: 0,
  currentClientY: 0,
  deltaX: 0,
  deltaY: 0,
  launchVx: 0,
  launchVy: 0,
  powerRatio: 0,
  propKind: "plasma_ball",
};

/**
 * Layer 2 Gesture Controller: Direct Click-and-Drag Flick Throw
 * Lets the user click and drag directly from the mascot in any direction to launch
 * a toybox prop (Plasma Ball, Holo Butterfly, or Cyber Cube) into the full-screen arena.
 */
export function useMascotFlickToss({
  disabled,
  selectedTossProp,
  onSelectNextProp,
  onTossProp,
}: UseMascotFlickTossParams) {
  const [flickState, setFlickState] =
    useState<FlickDragState>(INITIAL_DRAG_STATE);

  const pointerActiveRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didExceedThresholdRef = useRef(false);
  const activePropRef = useRef<TossablePropKind>(selectedTossProp);
  activePropRef.current = selectedTossProp;

  const computeLaunchVector = useCallback((dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(MAX_DRAG_DISTANCE_PX, dist);
    const scale = dist > 0 ? clampedDist / dist : 0;
    const effDx = dx * scale;
    const effDy = dy * scale;

    // Direct flick throw in the direction of cursor drag, with a slight upward arc boost
    // so horizontal throws still travel gracefully across the viewport before bouncing
    const vx = effDx * VELOCITY_MULTIPLIER;
    const vy = effDy * VELOCITY_MULTIPLIER - 140;
    const powerRatio = Math.min(1, dist / MAX_DRAG_DISTANCE_PX);

    return { vx, vy, powerRatio };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;

      pointerActiveRef.current = true;
      didExceedThresholdRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      setFlickState({
        isDragging: false,
        startClientX: e.clientX,
        startClientY: e.clientY,
        currentClientX: e.clientX,
        currentClientY: e.clientY,
        deltaX: 0,
        deltaY: 0,
        launchVx: 0,
        launchVy: 0,
        powerRatio: 0,
        propKind: activePropRef.current,
      });
    },
    [disabled]
  );

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!pointerActiveRef.current) return;

      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      const dist = Math.hypot(dx, dy);

      if (!didExceedThresholdRef.current && dist >= DRAG_THRESHOLD_PX) {
        didExceedThresholdRef.current = true;
      }

      if (didExceedThresholdRef.current) {
        const { vx, vy, powerRatio } = computeLaunchVector(dx, dy);
        setFlickState({
          isDragging: true,
          startClientX: startPosRef.current.x,
          startClientY: startPosRef.current.y,
          currentClientX: e.clientX,
          currentClientY: e.clientY,
          deltaX: dx,
          deltaY: dy,
          launchVx: vx,
          launchVy: vy,
          powerRatio,
          propKind: activePropRef.current,
        });
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (!pointerActiveRef.current) return;
      pointerActiveRef.current = false;

      if (didExceedThresholdRef.current) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;
        const { vx, vy } = computeLaunchVector(dx, dy);
        const launchedKind = activePropRef.current;

        onTossProp(launchedKind, vx, vy);

        // Cycle to the next toybox prop for the next flick throw
        const idx = TOSSABLE_PROP_CYCLE.indexOf(launchedKind);
        const nextProp =
          TOSSABLE_PROP_CYCLE[(idx + 1) % TOSSABLE_PROP_CYCLE.length];
        onSelectNextProp(nextProp);
      }

      setFlickState(INITIAL_DRAG_STATE);
    };

    window.addEventListener("pointermove", handleWindowPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [computeLaunchVector, onSelectNextProp, onTossProp]);

  /**
   * Used by the mascot button's `onClick` handler to ignore synthetic click events
   * immediately following a flick-toss drag release.
   */
  const consumeDidDrag = useCallback(() => {
    if (didExceedThresholdRef.current) {
      didExceedThresholdRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    flickState,
    handlePointerDown,
    consumeDidDrag,
  };
}
