import React, { RefObject, useRef } from "react";
import { LiveState } from "../../lib/audio";
import { AssistantStage } from "../layer1_data/assistantSessionTypes";
import { useMicEdgeWaveDomSync } from "../layer2_logic/useMicEdgeWaveSync";

interface MicSubtleEdgeWaveRingProps {
  session: any | null;
  state: LiveState;
  assistantStage?: AssistantStage;
  isMuted: boolean;
  micButtonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Layer 3 UI Component: Rotating Aurora Gradient Silk 360° Mic Wave Ring
 * Renders a compact, zero-lag coupled-spring Catmull-Rom Cubic Bezier silk wave
 * with continuously rotating aurora gradients tightly hugging the microphone button border.
 */
export const MicSubtleEdgeWaveRing: React.FC<MicSubtleEdgeWaveRingProps> = ({
  session,
  state,
  assistantStage,
  isMuted,
  micButtonRef,
}) => {
  const primaryPathRef = useRef<SVGPathElement | null>(null);
  const secondaryPathRef = useRef<SVGPathElement | null>(null);
  const silkRibbonPathRef = useRef<SVGPathElement | null>(null);
  const glowCircleRef = useRef<SVGCircleElement | null>(null);
  const primaryGradRef = useRef<SVGLinearGradientElement | null>(null);
  const secondaryGradRef = useRef<SVGLinearGradientElement | null>(null);

  const isStageVoiceListening = assistantStage
    ? assistantStage === "listen" || assistantStage === "follow_up"
    : state === "listening";
  const isListeningActive = isStageVoiceListening && !isMuted;

  useMicEdgeWaveDomSync({
    session,
    state,
    assistantStage,
    isMuted,
    primaryPathRef,
    secondaryPathRef,
    silkRibbonPathRef,
    glowCircleRef,
    primaryGradRef,
    secondaryGradRef,
    micButtonRef,
  });

  if (!isListeningActive) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 96 96"
      className="absolute w-[86px] h-[86px] sm:w-[96px] sm:h-[96px] pointer-events-none select-none z-10 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {/* Continuously Rotating Primary Aurora Silk Gradient (Centered at 48,48) */}
        <linearGradient
          ref={primaryGradRef}
          id="mic-aurora-primary-grad"
          gradientUnits="userSpaceOnUse"
          x1="8"
          y1="8"
          x2="88"
          y2="88"
        >
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="35%" stopColor="#22d3ee" />
          <stop offset="70%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>

        {/* Counter-Rotating Secondary Aurora Echo Gradient (Centered at 48,48) */}
        <linearGradient
          ref={secondaryGradRef}
          id="mic-aurora-secondary-grad"
          gradientUnits="userSpaceOnUse"
          x1="88"
          y1="8"
          x2="8"
          y2="88"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>

        <filter id="mic-edge-aurora-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft Reactive Vocal Perimeter Glow */}
      <circle
        ref={glowCircleRef}
        cx="48"
        cy="48"
        r="38.2"
        fill="none"
        stroke="url(#mic-aurora-primary-grad)"
        strokeWidth="2.2"
        opacity="0.18"
        filter="url(#mic-edge-aurora-glow)"
      />

      {/* Translucent Liquid Aurora Silk Ribbon Fill Between Outer Wave & Button Edge */}
      <path
        ref={silkRibbonPathRef}
        d=""
        fill="url(#mic-aurora-primary-grad)"
        fillRule="evenodd"
        fillOpacity="0.12"
      />

      {/* Secondary Counter-Rotating Harmonic Silk Echo Filament */}
      <path
        ref={secondaryPathRef}
        d=""
        fill="none"
        stroke="url(#mic-aurora-secondary-grad)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Primary High-Sensitivity Vocal Syllable Aurora Silk Bezier Filament */}
      <path
        ref={primaryPathRef}
        d=""
        fill="none"
        stroke="url(#mic-aurora-primary-grad)"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#mic-edge-aurora-glow)"
      />
    </svg>
  );
};
