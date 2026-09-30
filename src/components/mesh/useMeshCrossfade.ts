import { useEffect, useRef, useState } from "react";
import { HumanMoodType, HUMAN_MOOD_CONFIGS, SvgMeshGradientConfig } from "@/services/humanEmotionEngine";

// Fallback mesh gradient configuration
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

/**
 * Organic ease-in-out cubic easing for smooth, natural emotional blending.
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Blends two hex colors according to weight ratio [0..1]
 */
export function blendColors(colorA: string, colorB: string, weight: number): string {
  const parseHex = (hex: string) => {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16),
      ];
    }
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  };

  const [r1, g1, b1] = parseHex(colorA);
  const [r2, g2, b2] = parseHex(colorB);

  const r = Math.round(r1 + (r2 - r1) * weight);
  const g = Math.round(g1 + (g2 - g1) * weight);
  const b = Math.round(b1 + (b2 - b1) * weight);

  return `rgb(${r}, ${g}, ${b})`;
}

interface UseMeshCrossfadeOptions {
  currentMood: HumanMoodType;
  transitionDurationMs?: number;
}

export function useMeshCrossfade({
  currentMood,
  transitionDurationMs = 1800,
}: UseMeshCrossfadeOptions) {
  const [activeMood, setActiveMood] = useState<HumanMoodType>(currentMood);
  const [previousMood, setPreviousMood] = useState<HumanMoodType | null>(null);
  const [progress, setProgress] = useState<number>(1.0); // 0.0 -> 1.0

  const activeMoodRef = useRef<HumanMoodType>(currentMood);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentMood === activeMoodRef.current) return;

    // Set up crossfade
    setPreviousMood(activeMoodRef.current);
    setActiveMood(currentMood);
    activeMoodRef.current = currentMood;
    setProgress(0);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startTime = performance.now();
    const duration = transitionDurationMs;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawLinear = Math.min(1.0, elapsed / duration);
      const easedProgress = easeInOutCubic(rawLinear);

      setProgress(easedProgress);

      if (rawLinear < 1.0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setPreviousMood(null);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentMood, transitionDurationMs]);

  const activeConfig = HUMAN_MOOD_CONFIGS[activeMood]?.svgMeshGradient || DEFAULT_MESH;
  const prevConfig = previousMood ? HUMAN_MOOD_CONFIGS[previousMood]?.svgMeshGradient || DEFAULT_MESH : null;

  // Base background smooth color blend
  const blendedBackground = prevConfig
    ? blendColors(prevConfig.baseBackground, activeConfig.baseBackground, progress)
    : activeConfig.baseBackground;

  return {
    activeConfig,
    prevConfig,
    progress,
    blendedBackground,
    isTransitioning: progress < 1.0 && prevConfig !== null,
  };
}
