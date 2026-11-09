import React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { BallPlayState } from "./mascotPlayTypes";

interface MascotEnergyBallPropProps {
  ballState: BallPlayState;
}

/**
 * Layer 3 Presentation Prop: Multi-Bounce Floating Plasma Ball with Wall Ricochets & Combo Counter
 * Appears when the mascot performs its `ball_play` screen-pet chase across the playground,
 * bouncing off viewport boundaries and the mascot's head with neon shockwaves.
 */
export const MascotEnergyBallProp: React.FC<MascotEnergyBallPropProps> = ({
  ballState,
}) => {
  return (
    <AnimatePresence>
      {ballState.active && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
          {/* Dynamic Ground Shadow under the Plasma Ball */}
          <motion.div
            key="plasma-ball-shadow"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: Math.max(0.18, 0.55 - Math.abs(ballState.ballY) * 0.004),
              scale: Math.max(0.45, 1.1 - Math.abs(ballState.ballY) * 0.005),
              x: ballState.ballX,
              y: 26,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              type: "tween",
              duration: 0.04,
              ease: "linear",
            }}
            className="absolute left-1/2 top-1/2 -ml-4 h-2.5 w-8 rounded-full bg-cyan-400/40 blur-[3px]"
          />

          {/* Bouncing Plasma Ball */}
          <motion.div
            key="plasma-ball"
            initial={{ opacity: 0, scale: 0.2, x: 0, y: -60 }}
            animate={{
              opacity: 1,
              scale: ballState.wallBounce !== "none" ? 1.14 : 1,
              x: ballState.ballX,
              y: ballState.ballY,
              rotate: ballState.bounceCount * 115,
            }}
            exit={{ opacity: 0, scale: 0, y: -95 }}
            transition={{
              type: "tween",
              duration: 0.04,
              ease: "linear",
            }}
            className="absolute left-1/2 top-1/2 -ml-4 -mt-4 h-8 w-8"
          >
            {/* Outer plasma aura */}
            <div className="absolute -inset-2 animate-pulse rounded-full bg-cyan-400/40 blur-md" />

            {/* Core 3D shaded plasma sphere */}
            <svg
              viewBox="0 0 36 36"
              className="h-full w-full overflow-visible drop-shadow-[0_0_14px_rgba(34,211,238,0.95)]"
            >
              <defs>
                <radialGradient id="mahrBallGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="30%" stopColor="#67E8F9" />
                  <stop offset="68%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#6366F1" />
                </radialGradient>
              </defs>
              <circle
                cx="18"
                cy="18"
                r="13.5"
                fill="url(#mahrBallGrad)"
                stroke="#CFFAFE"
                strokeWidth="1.5"
              />
              {/* Internal plasma filaments */}
              <path
                d="M9 15 Q18 9 27 16 M10 22 Q18 27 26 20"
                fill="none"
                stroke="#E0F2FE"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Orbit seam on the ball */}
              <ellipse
                cx="18"
                cy="18"
                rx="13"
                ry="5.2"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.8"
                transform="rotate(-24 18 18)"
              />
              {/* Specular highlight */}
              <ellipse
                cx="13.5"
                cy="12.5"
                rx="4.2"
                ry="2.4"
                fill="#FFFFFF"
                opacity="0.92"
                transform="rotate(-25 13.5 12.5)"
              />
            </svg>
          </motion.div>

          {/* Wall Ricochet Spark Ring when ball bounces off a boundary */}
          <AnimatePresence mode="popLayout">
            {ballState.wallBounce !== "none" && (
              <motion.div
                key={`wall-${ballState.bounceCount}-${ballState.wallBounce}`}
                initial={{
                  opacity: 0.95,
                  scale: 0.3,
                  x: ballState.ballX,
                  y: ballState.ballY,
                }}
                animate={{
                  opacity: 0,
                  scale: 2.1,
                  x: ballState.ballX,
                  y: ballState.ballY,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 -ml-4 -mt-4 h-8 w-8 rounded-full border-2 border-purple-300 shadow-[0_0_14px_rgba(192,132,252,0.9)]"
              />
            )}
          </AnimatePresence>

          {/* Header / Boop Impact Ring + Combo Counter Badge */}
          <AnimatePresence mode="popLayout">
            {ballState.hitTrigger > 0 && (
              <motion.div
                key={`hit-${ballState.hitTrigger}`}
                initial={{
                  opacity: 0.95,
                  scale: 0.35,
                  x: ballState.ballX,
                  y: ballState.ballY + 8,
                }}
                animate={{
                  opacity: 0,
                  scale: 1.9,
                  x: ballState.ballX,
                  y: ballState.ballY + 4,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 -ml-5 -mt-2.5 h-5 w-10 rounded-full border-2 border-cyan-300/90 shadow-[0_0_12px_rgba(34,211,238,0.85)]"
              />
            )}
          </AnimatePresence>

          {/* Floating Combo Callout Badge */}
          <AnimatePresence mode="popLayout">
            {ballState.comboCount >= 2 && (
              <motion.div
                key={`combo-${ballState.comboCount}`}
                initial={{
                  opacity: 0,
                  scale: 0.5,
                  x: ballState.ballX,
                  y: ballState.ballY - 12,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: ballState.ballX,
                  y: ballState.ballY - 26,
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 -ml-7 -mt-3 rounded-md border border-cyan-300/60 bg-slate-950/90 px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums text-cyan-200 shadow-md"
              >
                {ballState.comboCount}x BOOP!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
