import React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ToyPropState } from "./mascotPlayTypes";

interface MascotToyboxPropsFxProps {
  toyProp: ToyPropState;
}

/**
 * Layer 3 Presentation Prop: Multi-Item Screen-Pet Toybox
 * Renders:
 * 1. Holographic Laser Butterfly (`butterfly`)
 * 2. Levitating Isometric Cyber-Cube (`cyber_cube`)
 * 3. Sonic Star Rings (`star_rings`)
 */
export const MascotToyboxPropsFx: React.FC<MascotToyboxPropsFxProps> = ({
  toyProp,
}) => {
  return (
    <AnimatePresence>
      {toyProp.active && toyProp.toyType !== "none" && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
          {/* 1. HOLOGRAPHIC LASER BUTTERFLY */}
          {toyProp.toyType === "butterfly" && (
            <motion.div
              key="toy-butterfly"
              initial={{ opacity: 0, scale: 0.2, x: 0, y: -40 }}
              animate={{
                opacity: 1,
                scale: toyProp.scale,
                x: toyProp.x,
                y: toyProp.y,
                rotate: toyProp.rotation,
              }}
              exit={{ opacity: 0, scale: 0, y: -90 }}
              transition={{
                type: "tween",
                duration: 0.04,
                ease: "linear",
              }}
              className="absolute left-1/2 top-1/2 -ml-4 -mt-4 h-8 w-8"
            >
              <div className="absolute -inset-2 animate-pulse rounded-full bg-fuchsia-400/35 blur-md" />
              <motion.svg
                viewBox="0 0 40 40"
                animate={{ scaleX: [1, 0.45, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.26,
                  ease: "easeInOut",
                }}
                className="h-full w-full overflow-visible drop-shadow-[0_0_10px_rgba(232,121,249,0.95)]"
              >
                {/* Left upper & lower holo wings */}
                <path
                  d="M20 20 C11 6, 2 10, 6 20 C9 25, 16 23, 20 20 Z"
                  fill="rgba(232,121,249,0.75)"
                  stroke="#F5D0FE"
                  strokeWidth="1.3"
                />
                <path
                  d="M20 21 C12 24, 7 32, 13 33 C17 34, 19 27, 20 21 Z"
                  fill="rgba(56,189,248,0.75)"
                  stroke="#BAE6FD"
                  strokeWidth="1.2"
                />
                {/* Right upper & lower holo wings */}
                <path
                  d="M20 20 C29 6, 38 10, 34 20 C31 25, 24 23, 20 20 Z"
                  fill="rgba(232,121,249,0.75)"
                  stroke="#F5D0FE"
                  strokeWidth="1.3"
                />
                <path
                  d="M20 21 C28 24, 33 32, 27 33 C23 34, 21 27, 20 21 Z"
                  fill="rgba(56,189,248,0.75)"
                  stroke="#BAE6FD"
                  strokeWidth="1.2"
                />
                {/* Glowing cyan body */}
                <rect
                  x="18.8"
                  y="13"
                  width="2.4"
                  height="14"
                  rx="1.2"
                  fill="#FFFFFF"
                />
              </motion.svg>
            </motion.div>
          )}

          {/* 2. LEVITATING ISOMETRIC CYBER-CUBE */}
          {toyProp.toyType === "cyber_cube" && (
            <motion.div
              key="toy-cyber-cube"
              initial={{ opacity: 0, scale: 0.2, x: 0, y: -70 }}
              animate={{
                opacity: 1,
                scale: toyProp.scale,
                x: toyProp.x,
                y: toyProp.y,
                rotate: toyProp.rotation,
              }}
              exit={{ opacity: 0, scale: 0, y: -95 }}
              transition={{
                type: "tween",
                duration: 0.04,
                ease: "linear",
              }}
              className="absolute left-1/2 top-1/2 -ml-4 -mt-4 h-8 w-8"
            >
              <div className="absolute -inset-2 animate-pulse rounded-full bg-emerald-400/35 blur-md" />
              <svg
                viewBox="0 0 40 40"
                className="h-full w-full overflow-visible drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]"
              >
                {/* Top isometric face */}
                <polygon
                  points="20,5 34,13 20,21 6,13"
                  fill="#6EE7B7"
                  stroke="#ECFDF5"
                  strokeWidth="1.2"
                />
                {/* Left isometric face */}
                <polygon
                  points="6,13 20,21 20,35 6,27"
                  fill="#10B981"
                  stroke="#A7F3D0"
                  strokeWidth="1.2"
                />
                {/* Right isometric face */}
                <polygon
                  points="34,13 20,21 20,35 34,27"
                  fill="#06B6D4"
                  stroke="#CFFAFE"
                  strokeWidth="1.2"
                />
                {/* Glowing inner quantum core */}
                <circle cx="20" cy="21" r="3.2" fill="#FFFFFF" />
              </svg>

              {toyProp.phase === "boop" && (
                <motion.div
                  initial={{ scale: 0.4, opacity: 0.95 }}
                  animate={{ scale: 2.1, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 rounded-lg border-2 border-emerald-300"
                />
              )}
            </motion.div>
          )}

          {/* 3. SONIC STAR RINGS */}
          {toyProp.toyType === "star_rings" && (
            <motion.div
              key="toy-star-rings"
              initial={{ opacity: 0, scale: 0.3, x: -30, y: -35 }}
              animate={{
                opacity: 1,
                scale: toyProp.scale,
                x: toyProp.x,
                y: toyProp.y,
                rotate: toyProp.rotation,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 18,
              }}
              className="absolute left-1/2 top-1/2 -ml-5 -mt-5 h-10 w-10"
            >
              <div className="absolute -inset-2 animate-pulse rounded-full bg-amber-400/35 blur-md" />
              <svg
                viewBox="0 0 44 44"
                className="h-full w-full overflow-visible drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]"
              >
                <defs>
                  <linearGradient
                    id="starRingGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
                <ellipse
                  cx="22"
                  cy="22"
                  rx="16"
                  ry="9.5"
                  fill="none"
                  stroke="url(#starRingGrad)"
                  strokeWidth="3.2"
                  transform="rotate(-18 22 22)"
                />
                <ellipse
                  cx="22"
                  cy="22"
                  rx="16"
                  ry="9.5"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  strokeDasharray="5 4"
                  opacity="0.85"
                  transform="rotate(-18 22 22)"
                />
              </svg>

              {toyProp.phase === "boop" && (
                <motion.div
                  key={`ring-burst-${toyProp.step}`}
                  initial={{ scale: 0.6, opacity: 1 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.42, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.9)]"
                />
              )}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
