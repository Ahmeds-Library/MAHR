import React, { useState } from "react";
import { motion } from "motion/react";
import { CharacterVideoLayer } from "../CharacterVideoLayer";

interface HolographicProjectionStageProps {
  characterState: "idle" | "thinking" | "talking";
  themeColor?: string;
}

/**
 * Holographic Projection Stage:
 * Displays MAHR's authentic avatar video (idle.mp4, thinking.mp4, talking.mp4)
 * full-screen and completely unmasked:
 * - Removed circular mask (no radial-gradient clip)
 * - Removed circular borders and inset glow rings
 * - Pure OLED black integration: seamlessly blends into pure pitch-black backdrop
 */
export const HolographicProjectionStage: React.FC<HolographicProjectionStageProps> = ({
  characterState,
}) => {
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
      {/* 
        Seamless Center Stage (Zero Card / Zero Border):
        - Fades outer edges into the mood background using an organic radial vignette
        - No rectangular card frame, no borders, no box shadow, no card backdrop
        - Only the center portion of Mahr is visible, melting seamlessly into the atmosphere
        - Generous 12% additional zoom-out (zoomScale: 0.76) for natural headroom and body presence
      */}
      <div 
        className="relative aspect-[9/16] h-[66vh] sm:h-[70vh] md:h-[74vh] max-h-[78vh] max-w-[90vw] mx-auto overflow-hidden flex items-center justify-center bg-transparent mb-12 sm:mb-16 md:mb-18"
        style={{
          maskImage: "radial-gradient(ellipse 60% 75% at 50% 46%, black 28%, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.65) 58%, rgba(0,0,0,0.22) 74%, transparent 92%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 75% at 50% 46%, black 28%, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.65) 58%, rgba(0,0,0,0.22) 74%, transparent 92%)",
        }}
      >
        {!videoUnavailable ? (
          <CharacterVideoLayer
            characterState={characterState}
            onErrorFallback={() => setVideoUnavailable(true)}
            className="w-full h-full"
            zoomScale={0.76}
          />
        ) : (
          /* High-tech WebGL Hologram Core Fallback if video files ever fail */
          <motion.div
            animate={{
              scale: characterState === "talking" ? [1, 1.08, 1] : [1, 1.03, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: characterState === "talking" ? 3 : 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-48 h-48 rounded-2xl border-2 border-cyan-400/60 flex items-center justify-center bg-cyan-950/40 shadow-[0_0_50px_rgba(34,211,238,0.5)]"
          >
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-500 blur-sm animate-pulse" />
          </motion.div>
        )}

        {/* Subtle Voice Lip-Sync Luminance Flare when speaking */}
        {characterState === "talking" && (
          <motion.div
            animate={{ opacity: [0.02, 0.08, 0.02] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-cyan-300 mix-blend-screen pointer-events-none z-20"
          />
        )}
      </div>
    </div>
  );
};

export default HolographicProjectionStage;
