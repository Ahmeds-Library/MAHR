import React from "react";
import { motion } from "motion/react";

interface MahrLightRingProps {
  characterState: "idle" | "thinking" | "talking";
  themeRingColor: string;
  themeHalo: string;
  pulseScale?: number;
  className?: string;
}

/**
 * Presentation component: MAHR reactive holographic lighting rings.
 * Provides ambient cyan/purple/theme pulsating glow, orbital rings, and audio-reactive ripple waves.
 */
export const MahrLightRing: React.FC<MahrLightRingProps> = ({
  characterState,
  themeHalo,
  pulseScale = 1.0,
  className = "",
}) => {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300 ${className}`}
      style={{ transform: `scale(${pulseScale})` }}
    >
      {/* 1. Soft Ambient Radial Backlight */}
      <div
        className={`absolute inset-[-15%] rounded-full bg-gradient-radial ${themeHalo} blur-3xl opacity-75 group-hover:opacity-95 transition-opacity duration-700 pointer-events-none`}
      />

      {/* 2. MAHR Outer Holographic Quantum Orbit Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: characterState === "talking" ? 7 : characterState === "thinking" ? 12 : 24,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-[-10px] rounded-full border border-dashed border-cyan-400/35 pointer-events-none"
      />

      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: characterState === "talking" ? 9 : characterState === "thinking" ? 8 : 32,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-[-20px] rounded-full border border-dotted border-indigo-400/30 pointer-events-none"
      />

      {/* 3. Voice Active Ripple Wave (Talking state) */}
      {characterState === "talking" && (
        <>
          <motion.div
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: [1, 1.28, 1], opacity: [0.8, 0.15, 0.8] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[-30px] rounded-full border-2 border-cyan-300/70 pointer-events-none shadow-[0_0_45px_rgba(34,211,238,0.5)]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: [0.95, 1.45, 0.95], opacity: [0.6, 0.05, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="absolute inset-[-42px] rounded-full border border-cyan-400/40 pointer-events-none"
          />
        </>
      )}

      {/* 4. Neural Reasoning Glow (Thinking state) */}
      {characterState === "thinking" && (
        <>
          <motion.div
            animate={{ scale: [0.98, 1.1, 0.98], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[-24px] rounded-full border-2 border-purple-400/80 pointer-events-none shadow-[0_0_40px_rgba(168,85,247,0.5)]"
          />
          <motion.div
            animate={{ rotate: 180 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[-34px] rounded-full border border-indigo-400/50 pointer-events-none"
          />
        </>
      )}

      {/* 5. Idle ambient breathing ring */}
      {characterState === "idle" && (
        <motion.div
          animate={{ scale: [0.99, 1.03, 0.99], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-14px] rounded-full border border-cyan-500/30 pointer-events-none shadow-[0_0_25px_rgba(6,182,212,0.2)]"
        />
      )}
    </div>
  );
};
