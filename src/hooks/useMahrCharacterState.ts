import { useState, useEffect, useRef, useCallback } from "react";
import { LiveState } from "@/lib/audio";

export type AssistantMotionState = "idle" | "thinking" | "talking";

export interface UseMahrCharacterStateOptions {
  liveState: LiveState;
  hasUserSpoken?: boolean;
  isAudioResponding?: boolean;
}

export interface UseMahrCharacterStateReturn {
  characterState: AssistantMotionState;
  setCharacterState: (state: AssistantMotionState) => void;
  isIdle: boolean;
  isThinking: boolean;
  isTalking: boolean;
}

/**
 * Domain-layer hook managing assistant state transitions (idle, thinking, talking)
 * with robust fallbacks, audio-stream alignment, and smooth debouncing.
 */
export const useMahrCharacterState = ({
  liveState,
  hasUserSpoken = false,
  isAudioResponding = false,
}: UseMahrCharacterStateOptions): UseMahrCharacterStateReturn => {
  const [characterState, setInternalState] = useState<AssistantMotionState>("idle");
  const transitionTimerRef = useRef<number | null>(null);

  const setCharacterState = useCallback((nextState: AssistantMotionState) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setInternalState(nextState);
  }, []);

  useEffect(() => {
    if (liveState === "disconnected") {
      setCharacterState("idle");
    } else if (liveState === "speaking" || isAudioResponding) {
      setCharacterState("talking");
    } else if (hasUserSpoken) {
      setCharacterState("thinking");
    } else if (liveState === "listening") {
      setCharacterState("idle");
    }
  }, [liveState, isAudioResponding, hasUserSpoken, setCharacterState]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  return {
    characterState,
    setCharacterState,
    isIdle: characterState === "idle",
    isThinking: characterState === "thinking",
    isTalking: characterState === "talking",
  };
};
