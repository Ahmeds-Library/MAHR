import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface MascotGreetingWaveProps {
  isWaving: boolean;
  showBubble?: boolean;
  onDismissBubble?: () => void;
}

export const MascotGreetingWave: React.FC<MascotGreetingWaveProps> = ({
  isWaving,
}) => {
  return (
    <>
      {/* Animated Cyber Waving Hand / Arm (Pure Visual, Silent) */}
      <AnimatePresence>
        {isWaving && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -30, x: -6, y: -2 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: [-15, 32, -22, 28, -15, 20, 0],
              x: -14,
              y: -8,
            }}
            exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.25 } }}
            transition={{
              rotate: { repeat: Infinity, duration: 1.1, ease: "easeInOut" },
              scale: { duration: 0.3 },
              opacity: { duration: 0.25 },
            }}
            className="absolute top-2 -left-2 pointer-events-none z-20 origin-bottom-right"
          >
            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-1 shadow-[0_0_12px_rgba(168,85,247,0.7)] border border-white/50">
              <span className="text-sm select-none" role="img" aria-label="wave">
                👋
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
