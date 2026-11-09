import React from "react";
import { Volume2, Brain, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { MahrEmotion } from "../MahrCoreVisualizer";

interface AssistantStatusIndicatorProps {
  characterState: "idle" | "thinking" | "talking";
  activeEmotion?: MahrEmotion;
  chipClass: string;
}

/**
 * Presentation component: MAHR status badge and live telemetry indicator.
 */
export const AssistantStatusIndicator: React.FC<AssistantStatusIndicatorProps> = ({
  characterState,
  activeEmotion = "idle",
  chipClass,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex flex-col items-center gap-1.5 z-30"
    >
      <div
        className={`px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-xl flex items-center gap-2.5 transition-all duration-300 ${chipClass}`}
      >
        {characterState === "talking" ? (
          <>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
            <Volume2 className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-200">
              MAHR • SPEAKING
            </span>
          </>
        ) : characterState === "thinking" ? (
          <>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400" />
            </span>
            <Brain
              className="w-3.5 h-3.5 text-purple-300 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-purple-200">
              MAHR • REASONING
            </span>
          </>
        ) : (
          <>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-200">
              MAHR • READY TO ASSIST
            </span>
          </>
        )}

        {/* Emotion Badge */}
        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 font-mono text-slate-300 tracking-tight">
          {activeEmotion.toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
};
