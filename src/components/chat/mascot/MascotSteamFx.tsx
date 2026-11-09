import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface MascotSteamFxProps {
  isAngry: boolean;
}

export const MascotSteamFx: React.FC<MascotSteamFxProps> = ({ isAngry }) => {
  return (
    <AnimatePresence>
      {isAngry && (
        <div className="absolute inset-0 pointer-events-none z-30 select-none">
          {/* Left Ear Steam Puffs */}
          <div className="absolute -top-3 -left-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`steam-l-${i}`}
                initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.85, 0],
                  scale: [0.3, 1 + i * 0.25, 0.8],
                  x: [0, -14 - i * 8],
                  y: [0, -10 - i * 8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.35,
                  ease: "easeOut",
                }}
                className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-white/90 via-slate-100/80 to-white/60 blur-[1px] shadow-[0_0_10px_rgba(255,255,255,0.7)]"
              />
            ))}
          </div>

          {/* Right Ear Steam Puffs */}
          <div className="absolute -top-3 -right-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`steam-r-${i}`}
                initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.85, 0],
                  scale: [0.3, 1 + i * 0.25, 0.8],
                  x: [0, 14 + i * 8],
                  y: [0, -10 - i * 8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.35 + 0.15,
                  ease: "easeOut",
                }}
                className="absolute w-4 h-4 rounded-full bg-gradient-to-tl from-white/90 via-slate-100/80 to-white/60 blur-[1px] shadow-[0_0_10px_rgba(255,255,255,0.7)]"
              />
            ))}
          </div>

          {/* Anime-style cartoon Anger Cross-mark (💢) pulsing above right forehead */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{
              scale: [0.8, 1.2, 0.9, 1.15],
              opacity: [0.8, 1, 0.9, 1],
              rotate: [-12, -4, -10, -5],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="absolute -top-6 right-2 w-6 h-6 flex items-center justify-center text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full text-rose-500"
            >
              {/* Cute manga anger mark curves */}
              <path d="M7 4 C 7 8, 8 9, 12 9 C 8 9, 7 10, 7 14" />
              <path d="M17 4 C 17 8, 16 9, 12 9 C 16 9, 17 10, 17 14" />
              <path d="M4 7 C 8 7, 9 8, 9 12 C 9 8, 10 7, 14 7" />
              <path d="M4 17 C 8 17, 9 16, 9 12 C 9 16, 10 17, 14 17" />
            </svg>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
