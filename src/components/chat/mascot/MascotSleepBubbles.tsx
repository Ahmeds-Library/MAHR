import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface MascotSleepBubblesProps {
  isSleeping: boolean;
  isDrowsy?: boolean;
}

/**
 * MascotSleepBubbles
 * Floats cozy translucent dream bubbles, rhythmic sleeping aura rings,
 * sleepy Zzz's, and twinkling stars around the mascot during idle naps and 45s deep sleep.
 */
export const MascotSleepBubbles: React.FC<MascotSleepBubblesProps> = ({
  isSleeping,
  isDrowsy = false,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-visible select-none">
      <AnimatePresence>
        {isSleeping && (
          <>
            {/* Soft Breathing Indigo-Cyan Sleeping Halo Ring */}
            <motion.div
              key="sleep-halo"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{
                opacity: [0.18, 0.42, 0.18],
                scale: [0.92, 1.08, 0.92],
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{
                duration: 4.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-1 rounded-full border border-indigo-300/35 bg-indigo-500/10 blur-[2px]"
            />

            {/* Floating Translucent Dream Bubble (Top-Left) */}
            <motion.div
              key="dream-bubble-main"
              initial={{ opacity: 0, scale: 0.4, x: -6, y: -4 }}
              animate={{
                opacity: [0, 0.92, 0.92, 0],
                scale: [0.55, 1.0, 1.06, 0.85],
                x: [-8, -18, -24, -28],
                y: [-6, -24, -36, -46],
              }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{
                duration: 4.4,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.25, 0.78, 1],
              }}
              className="absolute -top-2 left-0 flex h-7 w-9 items-center justify-center rounded-full border border-indigo-200/45 bg-slate-900/75 shadow-[0_0_14px_rgba(129,140,248,0.45)] backdrop-blur-md"
            >
              <span className="text-[11px] text-amber-200 drop-shadow-[0_0_5px_rgba(253,224,71,0.85)]">
                🌙✨
              </span>
              {/* Tiny trail bubbles */}
              <span className="absolute -bottom-1.5 right-1 h-1.5 w-1.5 rounded-full border border-indigo-200/45 bg-slate-900/80" />
              <span className="absolute -bottom-3 right-0 h-1 w-1 rounded-full border border-indigo-200/40 bg-slate-900/75" />
            </motion.div>

            {/* Zzz particle 1 (Small, rising softly) */}
            <motion.span
              key="zzz-1"
              initial={{ opacity: 0, scale: 0.5, x: 16, y: 2 }}
              animate={{
                opacity: [0, 0.95, 0.9, 0],
                scale: [0.6, 0.95, 1.15],
                x: [16, 24, 32],
                y: [2, -16, -34],
                rotate: [-6, 4, -4],
              }}
              transition={{
                duration: 3.0,
                repeat: Infinity,
                ease: "easeOut",
                times: [0, 0.22, 0.78, 1],
              }}
              className="absolute -top-1 right-2 font-mono text-xs font-bold text-indigo-300 drop-shadow-[0_0_6px_rgba(165,180,252,0.9)]"
            >
              z
            </motion.span>

            {/* Zzz particle 2 (Medium) */}
            <motion.span
              key="zzz-2"
              initial={{ opacity: 0, scale: 0.6, x: 20, y: -4 }}
              animate={{
                opacity: [0, 0.92, 0.88, 0],
                scale: [0.7, 1.15, 1.35],
                x: [20, 30, 40],
                y: [-4, -26, -48],
                rotate: [5, -6, 6],
              }}
              transition={{
                duration: 3.0,
                repeat: Infinity,
                delay: 1.0,
                ease: "easeOut",
                times: [0, 0.22, 0.78, 1],
              }}
              className="absolute -top-1 right-2 font-mono text-sm font-extrabold text-violet-300 drop-shadow-[0_0_8px_rgba(196,181,253,0.9)]"
            >
              Z
            </motion.span>

            {/* Zzz particle 3 (Large) */}
            <motion.span
              key="zzz-3"
              initial={{ opacity: 0, scale: 0.75, x: 24, y: -10 }}
              animate={{
                opacity: [0, 0.88, 0.85, 0],
                scale: [0.85, 1.35, 1.6],
                x: [24, 36, 48],
                y: [-10, -36, -62],
                rotate: [-4, 8, -5],
              }}
              transition={{
                duration: 3.0,
                repeat: Infinity,
                delay: 2.0,
                ease: "easeOut",
                times: [0, 0.22, 0.78, 1],
              }}
              className="absolute -top-1 right-2 font-mono text-base font-black text-sky-200 drop-shadow-[0_0_10px_rgba(186,230,253,0.9)]"
            >
              Z
            </motion.span>

            {/* Dream Star Sparkles */}
            <motion.div
              key="star-1"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0.4, 1.1, 0.4],
                rotate: [0, 90],
              }}
              transition={{ duration: 2.6, repeat: Infinity, delay: 0.4 }}
              className="absolute -top-6 left-3 text-xs text-amber-200 drop-shadow-[0_0_6px_rgba(253,224,71,0.8)]"
            >
              ✦
            </motion.div>

            <motion.div
              key="star-2"
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{
                opacity: [0, 0.85, 0],
                scale: [0.3, 1, 0.3],
                rotate: [45, 135],
              }}
              transition={{ duration: 2.9, repeat: Infinity, delay: 1.4 }}
              className="absolute -top-8 right-6 text-[10px] text-cyan-200 drop-shadow-[0_0_6px_rgba(103,232,249,0.8)]"
            >
              ⋆
            </motion.div>
          </>
        )}

        {/* Drowsy pre-sleep nod particles */}
        {isDrowsy && !isSleeping && (
          <motion.div
            key="drowsy-hint"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: [0, 0.85, 0], y: [0, -14], x: [0, 6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            className="absolute -top-4 right-2 font-mono text-xs font-semibold text-indigo-300/90 drop-shadow-[0_0_6px_rgba(165,180,252,0.75)]"
          >
            z z...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
