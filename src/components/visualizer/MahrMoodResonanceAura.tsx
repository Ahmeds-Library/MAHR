import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoodResonanceProfile } from "@/services/ml/adaptiveMoodModel";
import { Sparkles, Activity } from "lucide-react";

interface MahrMoodResonanceAuraProps {
  isResponding: boolean;
  pulseScale: number;
  auraOpacity: number;
  profile: MoodResonanceProfile;
  characterState: "idle" | "thinking" | "talking";
}

export const MahrMoodResonanceAura: React.FC<MahrMoodResonanceAuraProps> = ({
  isResponding,
  pulseScale,
  auraOpacity,
  profile,
  characterState,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
      {/* 1. Dynamic Chromatic Mood Resonance Aura Field */}
      <motion.div
        animate={{
          scale: pulseScale * 1.05,
          opacity: auraOpacity,
        }}
        transition={{ duration: 0.15, ease: "linear" }}
        className="absolute rounded-[3rem] blur-[60px] pointer-events-none transition-all duration-300"
        style={{
          width: "90%",
          height: "90%",
          background: `radial-gradient(ellipse at center, ${profile.primaryHex}44 0%, ${profile.secondaryHex}22 55%, transparent 75%)`,
        }}
      />

      {/* 2. Concentric Synchronized Micro-Pulse Rings when AI is actively responding */}
      <AnimatePresence>
        {isResponding && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: profile.ringCount }).map((_, idx) => (
              <motion.div
                key={`resonance-ring-${profile.mood}-${idx}`}
                initial={{ opacity: 0.8, scale: 0.88 }}
                animate={{
                  opacity: [0.75, 0],
                  scale: [0.92, 1.28 + idx * 0.14],
                }}
                transition={{
                  duration: 1.6 / (profile.defaultFrequencyHz / 1.5) + idx * 0.25,
                  repeat: Infinity,
                  ease: [0.16, 1, 0.3, 1],
                  delay: idx * 0.35,
                }}
                className="absolute rounded-[3rem] border pointer-events-none"
                style={{
                  width: "88%",
                  height: "88%",
                  borderColor: `${profile.primaryHex}77`,
                  boxShadow: `0 0 35px ${profile.primaryHex}44, inset 0 0 20px ${profile.secondaryHex}22`,
                }}
              />
            ))}

            {/* 3. Emotional Feedback Micro-Interaction Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute -top-3 sm:top-2 px-3.5 py-1.5 rounded-full border backdrop-blur-xl flex items-center gap-2 shadow-2xl z-30"
              style={{
                backgroundColor: "rgba(5, 6, 15, 0.88)",
                borderColor: `${profile.primaryHex}55`,
                boxShadow: `0 0 25px ${profile.primaryHex}33`,
              }}
            >
              <Activity
                className="w-3.5 h-3.5 animate-pulse"
                style={{ color: profile.primaryHex }}
              />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-slate-200">
                {profile.badgeLabel}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: profile.secondaryHex }}
              />
              <span className="text-[9px] font-mono text-slate-400">
                {characterState === "talking" ? "ACTIVE HARMONY" : "SYNCING"}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
