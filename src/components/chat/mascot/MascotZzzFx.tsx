import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface MascotZzzFxProps {
  isSleepy: boolean;
}

export const MascotZzzFx: React.FC<MascotZzzFxProps> = ({ isSleepy }) => {
  return (
    <AnimatePresence>
      {isSleepy && (
        <div className="absolute inset-0 pointer-events-none z-30 select-none">
          {/* Cartoon Sleeping Snot/Snore Bubble gently expanding and floating */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{
              scale: [0.3, 1.15, 0.4],
              opacity: [0.3, 0.85, 0.3],
              x: [0, 6, 2],
              y: [0, -8, -2],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-cyan-400/40 via-sky-300/60 to-white/70 border border-white/60 blur-[0.4px] shadow-[0_0_8px_rgba(56,189,248,0.7)]"
          />

          {/* Floating Drift Cartoon "Zzz" Letters */}
          <div className="absolute -top-7 -right-3">
            {["z", "Z", "Z"].map((letter, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.95, 0],
                  scale: [0.5, 1.25, 0.9],
                  x: [0, 10 + idx * 9],
                  y: [0, -22 - idx * 14],
                  rotate: [0, idx % 2 === 0 ? 12 : -12],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.4,
                  delay: idx * 0.7,
                  ease: "easeOut",
                }}
                className="absolute font-mono font-black text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                style={{
                  fontSize: `${11 + idx * 3}px`,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
