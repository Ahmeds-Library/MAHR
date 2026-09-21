import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Power, Sparkles, Brain, BookOpen, PenTool, Calendar } from "lucide-react";
import { useMyraaAudioVisualizer } from "../hooks/useMyraaAudioVisualizer";
import { getThemeConfig } from "../services/themeService";

interface FooterVisualizerProps {
  session: any | null;
  state: "disconnected" | "connecting" | "listening" | "speaking";
  themeColor: string;
  voiceConfidence: number;
  isMuted: boolean;
  isFocusMode: boolean;
  activeSubAgentName?: string;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onToggleFocusMode: () => void;
  onOpenWhiteboard?: () => void;
  onOpenStudyPad?: () => void;
  onOpenTasks?: () => void;
  onOpenRecalls?: () => void;
}

export const FooterVisualizer: React.FC<FooterVisualizerProps> = ({
  session,
  state,
  themeColor,
  voiceConfidence,
  isMuted,
  isFocusMode,
  activeSubAgentName = "MAHR",
  onToggleConnect,
  onToggleMute,
  onToggleFocusMode,
  onOpenWhiteboard,
  onOpenStudyPad,
  onOpenTasks,
  onOpenRecalls
}) => {
  const visualizerRef = useRef<HTMLDivElement | null>(null);
  const themeConfig = getThemeConfig(themeColor);

  const [localConfidence, setLocalConfidence] = React.useState<number>(voiceConfidence);

  // Bind real-time audio visualizer hook with dynamic themeColor glow
  useMyraaAudioVisualizer({
    session,
    state,
    themeColor,
    visualizerRef,
    setVoiceConfidence: (score) => setLocalConfidence(score)
  });

  if (isFocusMode) {
    return null;
  }

  return (
    <footer className="relative z-20 w-full max-w-2xl mx-auto flex flex-col items-center gap-4 mt-auto pb-4 select-none">
      {/* Dynamic Minimalist Waveform Visualizer with Theme Glow */}
      <div
        ref={visualizerRef}
        className="flex items-center justify-center gap-1.5 h-9 w-64 px-4 py-1 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg"
        title={`Audio Visualizer Glow Color: ${themeConfig.name}`}
      >
        {Array.from({ length: 24 }).map((_, idx) => (
          <div
            key={idx}
            className={`w-1 rounded-full transition-all duration-75 ${themeConfig.barColor}`}
            style={{
              height: "4px",
              backgroundColor: themeConfig.barGlowInlineStyle.backgroundColor,
              boxShadow: state === "speaking" || state === "listening" ? themeConfig.barGlowInlineStyle.boxShadow : "none"
            }}
          />
        ))}
      </div>

      {/* Glossy Primary Core Connector Button with Dynamic Confidence Ring */}
      <div className="flex items-center justify-center relative my-1">
        {state === "listening" && (
          <svg className="absolute w-[98px] h-[98px] -rotate-90 pointer-events-none z-10">
            {/* Background ring */}
            <circle
              cx="49"
              cy="49"
              r="43"
              className="stroke-white/10 fill-none"
              strokeWidth="3"
            />
            {/* Real-time Confidence Ring */}
            <motion.circle
              cx="49"
              cy="49"
              r="43"
              className={`fill-none transition-colors duration-300 ${
                localConfidence >= 75
                  ? "stroke-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                  : localConfidence >= 45
                  ? themeConfig.activeRingColor
                  : "stroke-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.7)]"
              }`}
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 43}
              strokeDashoffset={2 * Math.PI * 43 * (1 - localConfidence / 100)}
              strokeLinecap="round"
              animate={{ strokeDashoffset: 2 * Math.PI * 43 * (1 - localConfidence / 100) }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
            />
          </svg>
        )}

        <button
          onClick={onToggleConnect}
          className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
            state === "listening"
              ? "bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-[0_0_35px_rgba(99,102,241,0.6)] scale-105"
              : state === "speaking"
              ? "bg-gradient-to-br from-purple-500 via-pink-600 to-purple-700 shadow-[0_0_40px_rgba(168,85,247,0.7)] scale-105"
              : state === "connecting"
              ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse"
              : "bg-slate-900/90 hover:bg-slate-800/90 border border-white/20 hover:border-white/40 shadow-inner"
          }`}
          title={state === "disconnected" ? "Connect with MAHR Voice AI" : "Disconnect Call"}
        >
          {state === "disconnected" ? (
            <Power size={28} className="text-slate-300 group-hover:text-white group-hover:scale-110 transition-transform" />
          ) : (
            <Sparkles size={30} className="text-white animate-spin-slow" />
          )}
        </button>

        {/* Quick Mic Mute Floating Button */}
        {state !== "disconnected" && (
          <button
            onClick={onToggleMute}
            className={`absolute -right-12 h-10 w-10 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              isMuted
                ? "bg-rose-500/30 border-rose-500/60 text-rose-300 shadow-rose-950/60"
                : "bg-black/50 border-white/20 text-slate-300 hover:text-white hover:bg-black/70"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}
      </div>

      {/* Connection & Active Sub-Agent Status Text */}
      <div className="flex items-center gap-2 text-xs font-mono tracking-wide">
        <span
          className={`w-2 h-2 rounded-full ${
            state === "listening"
              ? "bg-emerald-400 animate-ping"
              : state === "speaking"
              ? "bg-purple-400 animate-pulse"
              : state === "connecting"
              ? "bg-amber-400 animate-bounce"
              : "bg-slate-500"
          }`}
        />
        <span className="text-slate-300 font-semibold uppercase">
          {state === "listening"
            ? `${activeSubAgentName} Listening (${localConfidence}%)`
            : state === "speaking"
            ? `${activeSubAgentName} Speaking`
            : state === "connecting"
            ? "Establishing Realtime Link..."
            : "Offline (Click orb to connect)"}
        </span>
      </div>

      {/* Quick Action Dock Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
        {onOpenWhiteboard && (
          <button
            onClick={onOpenWhiteboard}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all cursor-pointer"
            title="Open Blackboard"
          >
            <PenTool size={16} />
          </button>
        )}
        {onOpenStudyPad && (
          <button
            onClick={onOpenStudyPad}
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-white/5 transition-all cursor-pointer"
            title="Open Study Pad"
          >
            <BookOpen size={16} />
          </button>
        )}
        {onOpenTasks && (
          <button
            onClick={onOpenTasks}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-white/5 transition-all cursor-pointer"
            title="Open Daily Tasks"
          >
            <Calendar size={16} />
          </button>
        )}
        {onOpenRecalls && (
          <button
            onClick={onOpenRecalls}
            className="p-2 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-white/5 transition-all cursor-pointer"
            title="Open Recollections Memory"
          >
            <Brain size={16} />
          </button>
        )}
      </div>
    </footer>
  );
};
