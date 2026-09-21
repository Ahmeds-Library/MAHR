// 🏢 Layer 3: BossTaskDelegator Component
// The Boss Command Console where MAHR delegates missions to the office team

import React, { useState } from "react";
import { Crown, Sparkles, Send, Bot, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

interface BossTaskDelegatorProps {
  onDelegateMission: (goal: string) => void;
  isDelegating: boolean;
  bossSpeech: string;
}

const PRESET_MISSIONS = [
  {
    title: "🔍 Full-Stack Code & TypeScript Audit",
    goal: "Audit the codebase for TypeScript interface mismatches, potential memory leaks in React hooks, and unhandled async errors."
  },
  {
    title: "🏛️ Design Pragmatic 3-Layer Architecture",
    goal: "Design a clean 3-layer architecture for our active application modules with decoupled domain services and high-polish responsive UI."
  },
  {
    title: "📚 Synthesize Study Notes & Vector Memory",
    goal: "Synthesize all current discussion notes into structured active-recall study flashcards and prepare whiteboard diagram layouts."
  },
  {
    title: "⚡ Optimize Token Quota & Request Latency",
    goal: "Analyze prompt overhead, compress instructions for maximum token efficiency, and optimize API round-trip latency."
  }
];

export function BossTaskDelegator({
  onDelegateMission,
  isDelegating,
  bossSpeech
}: BossTaskDelegatorProps) {
  const [missionInput, setMissionInput] = useState<string>("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!missionInput.trim() || isDelegating) return;
    onDelegateMission(missionInput);
    setMissionInput("");
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-900/90 border border-purple-500/35 p-4 md:p-5 flex flex-col gap-3.5 shadow-2xl">
      {/* Boss Speech & Persona Header */}
      <div className="flex items-start gap-3">
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 flex items-center justify-center text-2xl shadow-lg border border-purple-300/40 shrink-0">
          👑
          <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-amber-400">
            <Sparkles size={10} className="text-amber-300" />
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-white tracking-wide">MAHR</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-bold">
              👑 Executive Regional Manager
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono font-bold hidden sm:inline">
              ⚡ Always Latest Flagship
            </span>
          </div>

          {/* Boss Speech Bubble */}
          <div className="mt-1.5 p-3 rounded-xl bg-slate-900/80 border border-purple-500/25 text-xs text-purple-100 font-mono leading-relaxed relative">
            <div className="absolute -top-1.5 left-4 w-3 h-3 bg-slate-900 border-t border-l border-purple-500/25 transform rotate-45" />
            "{bossSpeech}"
          </div>
        </div>
      </div>

      {/* Input Box for Boss Delegation */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={missionInput}
          onChange={(e) => setMissionInput(e.target.value)}
          placeholder="Boss, assign a new mission to the office floor (e.g. 'Audit code for memory leaks')..."
          disabled={isDelegating}
          className="flex-1 h-11 px-4 rounded-xl bg-slate-950/80 border border-purple-500/40 focus:border-cyan-400 text-xs text-white placeholder-slate-400 font-mono outline-none shadow-inner transition-colors"
        />

        <button
          type="submit"
          disabled={isDelegating || !missionInput.trim()}
          className="h-11 px-4 md:px-5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-purple-900/50 hover:shadow-cyan-900/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 shrink-0"
        >
          {isDelegating ? (
            <>
              <Sparkles size={14} className="animate-spin" />
              <span>Delegating...</span>
            </>
          ) : (
            <>
              <Crown size={14} className="text-amber-300" />
              <span>Delegate to Team</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Mission Presets */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-[10px] text-slate-400 font-mono font-semibold">Quick Missions:</span>
        {PRESET_MISSIONS.map((preset, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onDelegateMission(preset.goal)}
            className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-400/60 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
          >
            <span>{preset.title}</span>
            <ArrowRight size={10} className="text-purple-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
