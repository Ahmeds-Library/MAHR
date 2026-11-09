import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Zap } from "lucide-react";
import type { BonkState } from "./mascotPlayTypes";

interface MascotScreenBonkFxProps {
  isActive: boolean;
  bonkState?: BonkState;
}

export const MascotScreenBonkFx: React.FC<MascotScreenBonkFxProps> = ({
  isActive,
  bonkState,
}) => {
  const impactX = bonkState?.impactX ?? 0;
  const impactY = bonkState?.impactY ?? 0;
  const label = bonkState?.label || "BONK!";
  const variant = bonkState?.variant || "front_glass";

  return (
    <AnimatePresence>
      {isActive && (
        <div
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-visible"
          style={{
            transform: `translate3d(${impactX}px, ${impactY}px, 0)`,
          }}
        >
          {/* Directional Boundary Wall Flash Bar when colliding with Right or Bottom edge */}
          {variant === "right_edge" && (
            <motion.div
              initial={{ opacity: 1, scaleY: 0.3 }}
              animate={{ opacity: 0, scaleY: 1.5 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute right-0 h-28 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_20px_#22d3ee]"
            />
          )}
          {variant === "bottom_edge" && (
            <motion.div
              initial={{ opacity: 1, scaleX: 0.3 }}
              animate={{ opacity: 0, scaleX: 1.5 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute bottom-0 h-1.5 w-28 rounded-full bg-cyan-300 shadow-[0_0_20px_#22d3ee]"
            />
          )}

          {/* Primary Glass Impact Shockwave Ring */}
          <motion.div
            initial={{ scale: 0.25, opacity: 1, borderWidth: 4 }}
            animate={{ scale: 2.5, opacity: 0, borderWidth: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="absolute h-20 w-20 rounded-full border border-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.9)]"
          />

          {/* Secondary Glass Ripple Wave */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.85 }}
            animate={{ scale: 1.95, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.52, delay: 0.07, ease: "easeOut" }}
            className="absolute h-16 w-16 rounded-full border border-purple-400"
          />

          {/* Glass Fracture Spider-Lines */}
          <motion.svg
            viewBox="0 0 100 100"
            initial={{ scale: 0.35, opacity: 0.95 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.58, ease: "easeOut" }}
            className="absolute h-26 w-26 overflow-visible"
          >
            <g
              stroke="#67E8F9"
              strokeWidth="1.9"
              strokeLinecap="round"
              opacity="0.9"
            >
              <line x1="50" y1="50" x2="22" y2="24" />
              <line x1="50" y1="50" x2="78" y2="20" />
              <line x1="50" y1="50" x2="86" y2="62" />
              <line x1="50" y1="50" x2="20" y2="74" />
              <line x1="50" y1="50" x2="52" y2="16" />
              <line x1="35" y1="36" x2="43" y2="23" />
              <line x1="65" y1="34" x2="76" y2="42" />
              <line x1="34" y1="62" x2="24" y2="54" />
            </g>
          </motion.svg>

          {/* Orbiting Cartoon Dizzy Stars Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              rotate: { repeat: Infinity, duration: 1.3, ease: "linear" },
              opacity: { duration: 0.2 },
            }}
            className="absolute flex h-24 w-24 items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
              className="absolute -top-1"
            >
              <Star
                size={14}
                className="fill-amber-300 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.9)]"
              />
            </motion.div>

            <motion.div
              animate={{ scale: [1.3, 1, 1.3] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
              className="absolute -bottom-1 right-1"
            >
              <Star
                size={12}
                className="fill-cyan-300 text-cyan-300 drop-shadow-[0_0_6px_rgba(103,232,249,0.9)]"
              />
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
              className="absolute -left-2 top-1/2"
            >
              <Zap
                size={13}
                className="fill-pink-400 text-pink-400 drop-shadow-[0_0_6px_rgba(244,114,182,0.9)]"
              />
            </motion.div>
          </motion.div>

          {/* Comic Impact Callout Badge */}
          <motion.div
            initial={{ scale: 0, y: -8, opacity: 0 }}
            animate={{ scale: [0, 1.25, 1], y: -38, opacity: [0, 1, 1] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="absolute -top-2 whitespace-nowrap rounded-full border border-amber-200 bg-amber-400/95 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg"
          >
            {label}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
