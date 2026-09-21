import React, { useEffect, useState, useRef } from "react";
import { HumanMoodType, HUMAN_MOOD_CONFIGS, SvgMeshGradientConfig } from "../services/humanEmotionEngine";

interface GranularMeshGradientBackgroundProps {
  currentMood: HumanMoodType;
  fallbackGradient?: string;
  autoShiftBackground?: boolean;
  intensity?: number;
}

// Fallback mesh gradient if mood config is missing
const DEFAULT_MESH: SvgMeshGradientConfig = {
  id: "neutral",
  baseBackground: "#030208",
  blendMode: "screen",
  meshStops: [
    { cx: "20%", cy: "25%", r: "45%", color: "#6366f1", opacity: 0.35 },
    { cx: "80%", cy: "30%", r: "50%", color: "#8b5cf6", opacity: 0.28 },
    { cx: "50%", cy: "80%", r: "55%", color: "#3b82f6", opacity: 0.25 },
    { cx: "85%", cy: "85%", r: "40%", color: "#a855f7", opacity: 0.20 },
  ],
};

export const GranularMeshGradientBackground: React.FC<GranularMeshGradientBackgroundProps> = ({
  currentMood,
  autoShiftBackground = true,
  intensity = 1.0,
}) => {
  // Dual-buffer states for seamless crossfade transition
  const [activeMood, setActiveMood] = useState<HumanMoodType>(currentMood);
  const [previousMood, setPreviousMood] = useState<HumanMoodType | null>(null);
  const [transitionProgress, setTransitionProgress] = useState<number>(1.0); // 1.0 means active is 100% visible
  const prevMoodRef = useRef<HumanMoodType>(currentMood);

  useEffect(() => {
    if (currentMood !== prevMoodRef.current) {
      setPreviousMood(prevMoodRef.current);
      setActiveMood(currentMood);
      setTransitionProgress(0);

      prevMoodRef.current = currentMood;

      const startTime = performance.now();
      const duration = 1200; // 1.2s crossfade transition

      const step = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        setTransitionProgress(progress);

        if (progress < 1.0) {
          requestAnimationFrame(step);
        } else {
          setPreviousMood(null);
        }
      };

      requestAnimationFrame(step);
    }
  }, [currentMood]);

  const activeConfig = HUMAN_MOOD_CONFIGS[activeMood]?.svgMeshGradient || DEFAULT_MESH;
  const prevConfig = previousMood ? HUMAN_MOOD_CONFIGS[previousMood]?.svgMeshGradient || DEFAULT_MESH : null;

  return (
    <div 
      id="granular-mesh-gradient-viewport"
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Layer 1: Previous Mood SVG Mesh Gradient (fading out) */}
      {prevConfig && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: (1 - transitionProgress) * intensity,
            background: prevConfig.baseBackground,
          }}
        >
          <RenderSvgMesh config={prevConfig} idPrefix="prev" />
        </div>
      )}

      {/* Layer 2: Active Mood SVG Mesh Gradient (fading in) */}
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: transitionProgress * intensity,
          background: activeConfig.baseBackground,
        }}
      >
        <RenderSvgMesh config={activeConfig} idPrefix="active" />
      </div>

      {/* Fine Organic Film Grain Overlay for optical depth & texture */}
      <div 
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none bg-repeat"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 0)`,
          backgroundSize: "24px 24px"
        }}
      />
    </div>
  );
};

interface RenderSvgMeshProps {
  config: SvgMeshGradientConfig;
  idPrefix: string;
}

const RenderSvgMesh: React.FC<RenderSvgMeshProps> = ({ config, idPrefix }) => {
  return (
    <svg
      className="w-full h-full object-cover"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft Organic Gaussian Blur Filter */}
        <filter id={`${idPrefix}-mesh-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          {config.turbulence && (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency={config.turbulence.baseFrequency}
                numOctaves={config.turbulence.numOctaves}
                result="noise"
              />
              <feDisplacementMap in="blur" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
            </>
          )}
        </filter>

        {/* Dynamic Multi-Stop Radial Mesh Centers */}
        {config.meshStops.map((stop, idx) => (
          <radialGradient
            key={idx}
            id={`${idPrefix}-grad-${idx}`}
            cx={stop.cx}
            cy={stop.cy}
            r={stop.r}
            fx={stop.cx}
            fy={stop.cy}
          >
            <stop offset="0%" stopColor={stop.color} stopOpacity={stop.opacity} />
            <stop offset="60%" stopColor={stop.color} stopOpacity={stop.opacity * 0.45} />
            <stop offset="100%" stopColor={stop.color} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>

      {/* Canvas base rect */}
      <rect width="100%" height="100%" fill={config.baseBackground} />

      {/* Mesh Nodes Group with filter and blend-mode */}
      <g filter={`url(#${idPrefix}-mesh-blur)`} style={{ mixBlendMode: config.blendMode }}>
        {config.meshStops.map((stop, idx) => (
          <rect
            key={idx}
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${idPrefix}-grad-${idx})`}
          />
        ))}
      </g>
    </svg>
  );
};
