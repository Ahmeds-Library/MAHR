import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MahrThemePalette } from "./useMascotMahrSync";

interface MascotAudioWaveformProps {
  isSpeaking: boolean;
  frequencies: number[];
  palette: MahrThemePalette;
}

/**
 * MascotAudioWaveform
 * Futuristic vector audio spectrum equalizer floating near the mascot
 * that vibrates with real-time speech amplitude and vocal resonance.
 */
export const MascotAudioWaveform: React.FC<MascotAudioWaveformProps> = ({
  isSpeaking,
  frequencies,
  palette,
}) => {
  if (!isSpeaking) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-[2.5px] px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-lg pointer-events-none"
        style={{
          boxShadow: `0 0 12px ${palette.glowRgba}`,
        }}
      >
        {frequencies.map((freq, index) => {
          // Normalize height between 3px and 14px
          const barHeight = Math.max(3, Math.min(14, freq * 14));
          return (
            <motion.div
              key={`waveform-bar-${index}`}
              animate={{
                height: `${barHeight}px`,
                backgroundColor: index === 2 ? palette.primary : palette.glow,
              }}
              transition={{
                duration: 0.08,
                ease: "easeOut",
              }}
              className="w-[2px] rounded-full"
              style={{
                boxShadow: `0 0 4px ${palette.glow}`,
              }}
            />
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};
