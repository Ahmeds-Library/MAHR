import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MahrThemePalette } from "./useMascotMahrSync";

interface MascotMahrAuraProps {
  palette: MahrThemePalette;
  isSpeaking: boolean;
  isThinking: boolean;
  isActive: boolean;
  audioVolume: number;
}

/**
 * MascotMahrAura
 * Holographic vector energy aura & ripple rings around the mascot
 * seamlessly matching MahrCoreVisualizer's aesthetic and theme colors.
 */
export const MascotMahrAura: React.FC<MascotMahrAuraProps> = ({
  palette,
  isSpeaking,
  isThinking,
  isActive,
  audioVolume,
}) => {
  if (!isActive && !isSpeaking && !isThinking) {
    return null;
  }

  const dynamicScale = 1.0 + Math.min(0.4, audioVolume * 0.6);
  const ringCount = isSpeaking ? 3 : isThinking ? 2 : 1;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
      {/* Dynamic Ambient Energy Glow */}
      <motion.div
        animate={{
          scale: dynamicScale,
          opacity: isSpeaking ? [0.45, 0.75, 0.5] : isThinking ? [0.35, 0.6, 0.35] : 0.3,
        }}
        transition={{
          duration: isSpeaking ? 0.35 : 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full blur-xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${palette.glowRgba} 0%, transparent 70%)`,
        }}
      />

      {/* Holographic Vector Ripple Rings matching MahrCoreVisualizer */}
      <AnimatePresence>
        {Array.from({ length: ringCount }).map((_, idx) => (
          <motion.div
            key={`mahr-aura-ring-${idx}`}
            initial={{ opacity: 0.8, scale: 0.85 }}
            animate={{
              opacity: [0.75, 0.2, 0],
              scale: isSpeaking ? [0.9, 1.45 + idx * 0.25] : [0.95, 1.25 + idx * 0.15],
            }}
            transition={{
              duration: isSpeaking ? 1.1 + idx * 0.2 : 2.0 + idx * 0.4,
              repeat: Infinity,
              ease: [0.16, 1, 0.3, 1],
              delay: idx * 0.3,
            }}
            className="absolute rounded-full border pointer-events-none"
            style={{
              width: `${64 + idx * 14}px`,
              height: `${64 + idx * 14}px`,
              borderColor: palette.ringRgba,
              boxShadow: `0 0 10px ${palette.glowRgba}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
