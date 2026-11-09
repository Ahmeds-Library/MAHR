import React from "react";
import { motion } from "motion/react";

interface HolographicLightRaysProps {
  themeColor?: string;
  characterState: "idle" | "thinking" | "talking";
}

/**
 * Holographic Light Rays & Emitter Base
 * Renders an ethereal, upward-projected conic light beam and floor reflection halo
 * that gives the character avatar a true 3D holographic projection presence in space.
 */
export const HolographicLightRays: React.FC<HolographicLightRaysProps> = ({
  themeColor = "celestial",
  characterState,
}) => {
  const getBeamGradient = () => {
    switch (themeColor) {
      case "crimson":
        return "from-rose-500/20 via-red-600/5 to-transparent";
      case "emerald":
        return "from-emerald-500/20 via-teal-600/5 to-transparent";
      case "gold":
        return "from-amber-500/20 via-yellow-600/5 to-transparent";
      case "violet":
        return "from-purple-500/20 via-fuchsia-600/5 to-transparent";
      default:
        return "from-cyan-400/20 via-indigo-600/5 to-transparent";
    }
  };

  const getEmitterGlow = () => {
    switch (themeColor) {
      case "crimson":
        return "bg-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.6)]";
      case "emerald":
        return "bg-emerald-400/40 shadow-[0_0_50px_rgba(16,185,129,0.6)]";
      case "gold":
        return "bg-amber-400/40 shadow-[0_0_50px_rgba(245,158,11,0.6)]";
      case "violet":
        return "bg-purple-400/40 shadow-[0_0_50px_rgba(168,85,247,0.6)]";
      default:
        return "bg-cyan-400/40 shadow-[0_0_50px_rgba(34,211,238,0.6)]";
    }
  };

  const isExcited = characterState === "talking";

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-10">
      {/* 1. Upward Hologram Projection Cone */}
      <motion.div
        animate={{
          opacity: isExcited ? [0.6, 0.9, 0.6] : [0.35, 0.55, 0.35],
          scaleY: isExcited ? [1, 1.08, 1] : [1, 1.03, 1],
        }}
        transition={{
          duration: isExcited ? 1.4 : 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute bottom-[-10%] w-[85%] h-[90%] bg-gradient-to-t ${getBeamGradient()} blur-2xl origin-bottom rounded-full pointer-events-none mix-blend-screen`}
      />

      {/* 2. Concentric Projection Emitter Disc at Base */}
      <motion.div
        animate={{
          scale: isExcited ? [0.95, 1.15, 0.95] : [0.98, 1.04, 0.98],
          opacity: isExcited ? [0.7, 0.95, 0.7] : [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: isExcited ? 1.2 : 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute bottom-[-4%] w-48 sm:w-64 h-8 rounded-full ${getEmitterGlow()} blur-md pointer-events-none`}
      />

      {/* 3. Subtle Holographic Scan-lines shimmer */}
      <div className="absolute inset-0 rounded-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-30 pointer-events-none mix-blend-overlay" />
    </div>
  );
};

export default HolographicLightRays;
