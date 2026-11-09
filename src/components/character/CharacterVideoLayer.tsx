import React, { useRef, useEffect, useState } from "react";
import { AssistantMotionState } from "@/hooks/useMahrCharacterState";

interface CharacterVideoLayerProps {
  characterState: AssistantMotionState;
  onErrorFallback: () => void;
  className?: string;
  zoomScale?: number;
}

/**
 * Presentation component: Seamlessly plays idle.mp4, thinking.mp4, and talking.mp4
 * with zero-flicker cross-fades, natural 9:16 portrait framing, and 15% zoom-out.
 */
export const CharacterVideoLayer: React.FC<CharacterVideoLayerProps> = ({
  characterState,
  onErrorFallback,
  className = "",
  zoomScale = 0.88,
}) => {
  const idleVideoRef = useRef<HTMLVideoElement | null>(null);
  const thinkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const talkingVideoRef = useRef<HTMLVideoElement | null>(null);

  const [idleLoaded, setIdleLoaded] = useState(false);
  const [thinkingLoaded, setThinkingLoaded] = useState(false);
  const [talkingLoaded, setTalkingLoaded] = useState(false);

  useEffect(() => {
    const playCurrentVideo = async () => {
      try {
        if (characterState === "idle") {
          if (idleVideoRef.current) {
            idleVideoRef.current.currentTime = 0;
            idleVideoRef.current.muted = true;
            await idleVideoRef.current.play().catch(() => {});
          }
        } else if (characterState === "thinking") {
          if (thinkingVideoRef.current) {
            thinkingVideoRef.current.currentTime = 0;
            thinkingVideoRef.current.muted = true;
            await thinkingVideoRef.current.play().catch(() => {});
          }
        } else if (characterState === "talking") {
          if (talkingVideoRef.current) {
            talkingVideoRef.current.currentTime = 0;
            talkingVideoRef.current.muted = true;
            await talkingVideoRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        console.warn("[CharacterVideoLayer] Autoplay deferred:", err);
      }
    };

    playCurrentVideo();
  }, [characterState]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none pointer-events-none bg-transparent ${className}`}>
      {/* 1. Idle Video Loop */}
      <video
        ref={idleVideoRef}
        src="/assets/idle.mp4"
        loop
        muted
        playsInline
        autoPlay
        preload="auto"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "center center",
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 will-change-transform ${
          characterState === "idle" && idleLoaded ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
        onCanPlay={() => setIdleLoaded(true)}
        onError={onErrorFallback}
      />

      {/* 2. Thinking Video Loop */}
      <video
        ref={thinkingVideoRef}
        src="/assets/thinking.mp4"
        loop
        muted
        playsInline
        preload="auto"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "center center",
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 will-change-transform ${
          characterState === "thinking" && thinkingLoaded ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
        onCanPlay={() => setThinkingLoaded(true)}
        onError={onErrorFallback}
      />

      {/* 3. Talking Video Loop */}
      <video
        ref={talkingVideoRef}
        src="/assets/talking.mp4"
        loop
        muted
        playsInline
        preload="auto"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "center center",
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 will-change-transform ${
          characterState === "talking" && talkingLoaded ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
        onCanPlay={() => setTalkingLoaded(true)}
        onError={onErrorFallback}
      />
    </div>
  );
};

