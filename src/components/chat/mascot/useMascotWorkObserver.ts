import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import {
  ActiveWorkspacePage,
  MascotAttentionReaction,
  UserInteractionContext,
  UserWorkActionType,
} from "@/core/mascot/mascotPageContextTypes";
import {
  computeMascotWorkReaction,
  extractElementContextLabel,
  isFullScreenWorkspacePage,
} from "@/core/mascot/mascotWorkReactionEngine";

const IDLE_TIMEOUT_MS = 10000; // 10 seconds of no typing, clicking, or drawing
const BUBBLE_DISPLAY_MS = 4100; // Duration for authentic companion remark bubble
const MIN_BUBBLE_COOLDOWN_MS = 6800; // Minimum gap between random speech bubbles

export interface UseMascotWorkObserverParams {
  activePage: ActiveWorkspacePage;
  isChatOpen: boolean;
  isMascotHovered: boolean;
  mascotRef: RefObject<HTMLElement | null>;
}

export interface MascotWorkObserverState {
  isUserActivelyWorking: boolean;
  lastWorkAction: UserWorkActionType;
  activeReaction: MascotAttentionReaction | null;
  showAttentionBubble: boolean;
  workPulseKey: number;
  isEdgePeeking: boolean;
  workFocusGaze: { x: number; y: number } | null;
}

export function useMascotWorkObserver({
  activePage,
  isChatOpen,
  isMascotHovered,
  mascotRef,
}: UseMascotWorkObserverParams): MascotWorkObserverState {
  const [isUserActivelyWorking, setIsUserActivelyWorking] =
    useState<boolean>(false);
  const [lastWorkAction, setLastWorkAction] =
    useState<UserWorkActionType>("idle");
  const [activeReaction, setActiveReaction] =
    useState<MascotAttentionReaction | null>(null);
  const [showAttentionBubble, setShowAttentionBubble] =
    useState<boolean>(false);
  const [workPulseKey, setWorkPulseKey] = useState<number>(0);
  const [isEdgePeeking, setIsEdgePeeking] = useState<boolean>(false);
  const [workFocusGaze, setWorkFocusGaze] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const lastPhysicalNoticeTimeRef = useRef<number>(0);
  const lastBubbleTimeRef = useRef<number>(0);
  const reactionTickRef = useRef<number>(0);
  const prevPageRef = useRef<ActiveWorkspacePage>(activePage);

  const updateWorkGazeFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (typeof window === "undefined") return;
      const dockX = window.innerWidth - 68;
      const dockY = window.innerHeight - 68;
      const dx = clientX - dockX;
      const dy = clientY - dockY;
      const dist = Math.hypot(dx, dy) || 1;
      const factor = Math.min(dist / 260, 1);
      setWorkFocusGaze({
        x: (dx / dist) * factor,
        y: (dy / dist) * factor,
      });
    },
    []
  );

  const registerWorkActivity = useCallback(
    (
      actionType: UserWorkActionType,
      clientCoords?: { x: number; y: number },
      context?: UserInteractionContext
    ) => {
      if (isChatOpen) return;

      const now = Date.now();
      setIsUserActivelyWorking(true);
      setLastWorkAction(actionType);

      if (clientCoords) {
        updateWorkGazeFromPoint(clientCoords.x, clientCoords.y);
      }

      // 1. Notice EVERY action physically (expression, head nod/tilt, eye lock-on)
      const elapsedSincePhysical = now - lastPhysicalNoticeTimeRef.current;
      if (elapsedSincePhysical > 220 || actionType === "page_switch") {
        lastPhysicalNoticeTimeRef.current = now;
        reactionTickRef.current += 1;

        // 2. Decide RANDOMLY whether to show a warm conversational speech bubble
        const elapsedSinceLastBubble = now - lastBubbleTimeRef.current;
        const canTriggerBubble = elapsedSinceLastBubble > MIN_BUBBLE_COOLDOWN_MS;
        const bubbleProbability =
          actionType === "page_switch"
            ? 0.65
            : context?.targetLabel
            ? 0.42
            : actionType === "clicking" || actionType === "drawing"
            ? 0.32
            : 0.24;

        const shouldTriggerRandomBubble =
          canTriggerBubble && Math.random() < bubbleProbability;

        const reaction = computeMascotWorkReaction(
          activePage,
          actionType,
          reactionTickRef.current,
          context,
          shouldTriggerRandomBubble
        );

        setActiveReaction(reaction);
        setWorkPulseKey((prev) => prev + 1);

        if (shouldTriggerRandomBubble) {
          lastBubbleTimeRef.current = now;
          setShowAttentionBubble(true);
          if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
          bubbleTimerRef.current = setTimeout(() => {
            setShowAttentionBubble(false);
          }, BUBBLE_DISPLAY_MS);
        }
      }

      // Reset the 10-second inactivity timer
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsUserActivelyWorking(false);
        setLastWorkAction("idle");
        setShowAttentionBubble(false);
        setWorkFocusGaze(null);
      }, IDLE_TIMEOUT_MS);
    },
    [activePage, isChatOpen, updateWorkGazeFromPoint]
  );

  // Detect workspace/page navigation immediately
  useEffect(() => {
    if (prevPageRef.current !== activePage) {
      prevPageRef.current = activePage;
      registerWorkActivity(
        "page_switch",
        typeof window !== "undefined"
          ? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 }
          : undefined
      );
    }
  }, [activePage, registerWorkActivity]);

  // Listen to global typing, clicking, drawing, and scrolling across all pages
  useEffect(() => {
    if (isChatOpen) {
      setIsUserActivelyWorking(false);
      setShowAttentionBubble(false);
      return;
    }

    const isEventInsideMascot = (target: EventTarget | null): boolean => {
      if (!target || !mascotRef.current) return false;
      return mascotRef.current.contains(target as Node);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta"
      ) {
        return;
      }

      let coords = {
        x: window.innerWidth * 0.48,
        y: window.innerHeight * 0.45,
      };
      const activeEl = document.activeElement;
      if (activeEl && activeEl !== document.body) {
        const rect = activeEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          coords = {
            x: rect.left + rect.width * 0.5,
            y: rect.top + rect.height * 0.5,
          };
        }
      }

      const context = extractElementContextLabel(activeEl);
      registerWorkActivity("typing", coords, context);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (isEventInsideMascot(e.target)) return;
      isPointerDownRef.current = true;

      const context = extractElementContextLabel(e.target);
      const isCanvasOrDrawSurface =
        activePage === "whiteboard" ||
        activePage === "simulation_studio" ||
        context.targetTag === "canvas";

      registerWorkActivity(
        isCanvasOrDrawSurface && !context.targetLabel ? "drawing" : "clicking",
        { x: e.clientX, y: e.clientY },
        context
      );
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (
        isFullScreenWorkspacePage(activePage) &&
        !isMascotHovered &&
        !isEventInsideMascot(e.target)
      ) {
        const distToBottomRight = Math.hypot(
          window.innerWidth - e.clientX,
          window.innerHeight - e.clientY
        );
        setIsEdgePeeking(distToBottomRight < 175 && isPointerDownRef.current);
      } else {
        setIsEdgePeeking(false);
      }

      if (!isPointerDownRef.current) return;
      if (isEventInsideMascot(e.target)) return;

      registerWorkActivity("drawing", { x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
      setIsEdgePeeking(false);
    };

    const handleWheel = (e: WheelEvent) => {
      if (isEventInsideMascot(e.target)) return;
      if (activePage !== "home" || isUserActivelyWorking) {
        registerWorkActivity("scrolling", { x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [
    activePage,
    isChatOpen,
    isMascotHovered,
    isUserActivelyWorking,
    mascotRef,
    registerWorkActivity,
  ]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  return {
    isUserActivelyWorking,
    lastWorkAction,
    activeReaction,
    showAttentionBubble: showAttentionBubble && !isChatOpen,
    workPulseKey,
    isEdgePeeking: isEdgePeeking && !isMascotHovered && !isChatOpen,
    workFocusGaze,
  };
}
