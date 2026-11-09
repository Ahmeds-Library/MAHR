import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MahrThemePalette } from "./useMascotMahrSync";

interface MascotNeuralRingProps {
  isThinking: boolean;
  palette: MahrThemePalette;
}

/**
 * MascotNeuralRing
 * Futuristic holographic orbital ring that rotates around the mascot's head
 * with pulsing nodes when Mahr is actively reasoning or thinking.
 */
export const MascotNeuralRing: React.FC<MascotNeuralRingProps> = ({
  isThinking,
  palette,
}) => {
  if (!isThinking) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        {/* Revolving Elliptical Orbit Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 360,
          }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{
            opacity: { duration: 0.25 },
            scale: { duration: 0.3, type: "spring" },
            rotate: { duration: 3.2, repeat: Infinity, ease: "linear" },
          }}
          className="absolute w-14 h-7 rounded-full border border-dashed pointer-events-none"
          style={{
            borderColor: palette.glow,
            boxShadow: `0 0 10px ${palette.glowRgba}`,
            transform: "rotateX(60deg)",
          }}
        >
          {/* Orbital Data Pulse Node 1 */}
          <motion.div
            animate={{
              scale: [0.8, 1.4, 0.8],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              backgroundColor: palette.primary,
              boxShadow: `0 0 6px ${palette.glow}`,
            }}
          />

          {/* Orbital Data Pulse Node 2 */}
          <motion.div
            animate={{
              scale: [1.2, 0.7, 1.2],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              backgroundColor: palette.secondary,
              boxShadow: `0 0 6px ${palette.glow}`,
            }}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
