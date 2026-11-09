import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface MascotAntennaRippleProps {
  isActive: boolean;
  color?: string;
}

/**
 * MascotAntennaRipple
 * Displays an expanding, fading holographic sonar/energy ripple above the mascot's antenna
 * when transmitting pulses or during playful spins.
 */
export const MascotAntennaRipple: React.FC<MascotAntennaRippleProps> = ({
  isActive,
  color = "#38bdf8",
}) => {
  return (
    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-8 pointer-events-none flex items-center justify-center z-20">
      <AnimatePresence>
        {isActive && (
          <>
            {/* Wave 1 */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0.9, y: 0 }}
              animate={{ scale: [0.3, 2.2], opacity: [0.9, 0], y: [-2, -14] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute w-4 h-4 rounded-full border border-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
              style={{ borderColor: color }}
            />
            {/* Wave 2 (delayed echo) */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0.8, y: 0 }}
              animate={{ scale: [0.2, 1.8], opacity: [0.8, 0], y: [-1, -11] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
              className="absolute w-3 h-3 rounded-full border border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
