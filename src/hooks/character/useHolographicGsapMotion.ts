import { useEffect, useRef } from "react";
import gsap from "gsap";

interface HolographicMotionOptions {
  characterState: "idle" | "thinking" | "talking";
  pulseScale?: number;
  isResponding?: boolean;
}

/**
 * Domain Motion Hook:
 * Orchestrates lifelike holographic floating physics, natural breathing,
 * and speech-reactive excitation using GSAP.
 */
export const useHolographicGsapMotion = ({
  characterState,
  pulseScale = 1.0,
  isResponding = false,
}: HolographicMotionOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Steady grounded position - breathing animation completely removed as requested
      gsap.to(containerRef.current, {
        y: 0,
        rotation: 0,
        duration: 0.4,
        ease: "power2.out",
      });

      // Subtle reactive glow for state feedback without bouncy motion
      if (glowRef.current) {
        if (characterState === "talking") {
          gsap.to(glowRef.current, {
            scale: 1.05,
            opacity: 0.8,
            duration: 0.3,
            ease: "power2.out",
          });
        } else if (characterState === "thinking") {
          gsap.to(glowRef.current, {
            scale: 1.02,
            opacity: 0.6,
            duration: 0.4,
            ease: "power2.out",
          });
        } else {
          gsap.to(glowRef.current, {
            scale: 1.0,
            opacity: 0.35,
            duration: 0.5,
            ease: "power2.out",
          });
        }
      }
    }, containerRef);

    return () => ctx.revert();
  }, [characterState]);

  // Dynamic Scale Adjustment on Audio Volume Pulses (only active during speaking/thinking)
  useEffect(() => {
    if (!containerRef.current) return;
    const targetScale = characterState === "idle" ? 1.0 : pulseScale;
    gsap.to(containerRef.current, {
      scale: targetScale,
      duration: 0.15,
      ease: "power1.out",
    });
  }, [pulseScale, characterState]);

  return { containerRef, glowRef };
};

export default useHolographicGsapMotion;
