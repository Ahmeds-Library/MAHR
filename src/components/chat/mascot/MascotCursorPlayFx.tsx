import React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CursorPlayState } from "./mascotPlayTypes";

interface MascotCursorPlayFxProps {
  cursorPlay: CursorPlayState;
}

/**
 * Layer 3 Presentation Prop: Cursor Pounce & Laser-Butterfly Play FX
 * Renders when the mascot is in `mouse_play` mode—stalking, wiggling, and playfully
 * pouncing at a virtual holo-cursor / user pointer like a screen pet.
 */
export const MascotCursorPlayFx: React.FC<MascotCursorPlayFxProps> = ({
  cursorPlay,
}) => {
  return (
    <AnimatePresence>
      {cursorPlay.active && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
          {/* Playful Holo-Firefly / Cursor Target */}
          <motion.div
            key="cursor-play-target"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: 1,
              scale: cursorPlay.phase === "boop" ? 1.35 : 1,
              x: cursorPlay.targetX,
              y: cursorPlay.targetY,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
            }}
            className="absolute left-1/2 top-1/2 -ml-4 -mt-4 flex h-8 w-8 items-center justify-center"
          >
            {/* Outer lock ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-cyan-300/80 shadow-[0_0_10px_rgba(34,211,238,0.55)]"
            />

            {/* Glowing holo-cursor / laser dot */}
            <div className="relative h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]">
              <div className="absolute -inset-1 animate-ping rounded-full bg-cyan-300/60" />
            </div>

            {/* Pounce / Boop impact bursts */}
            {cursorPlay.phase === "boop" && (
              <motion.div
                initial={{ scale: 0.4, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-sky-300"
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
