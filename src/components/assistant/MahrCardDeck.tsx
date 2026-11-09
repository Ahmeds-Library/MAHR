import React, { useEffect, useRef } from "react";
import {
  Sparkles,
  CheckSquare,
  Brain,
  Compass,
  Bot,
  Play,
  Check,
  Clock,
  Zap,
  ChevronRight,
  Mic,
  Volume2,
  Calendar,
} from "lucide-react";
import { DailyTask, SubAgent } from "@lib/subagentTypes";
import { Memory } from "@lib/memoryTypes";
import { LiveState } from "@lib/audio";
import { animateCardDeckReveal } from "@/core/animations/gsapHolographicTransitions";

export interface MahrCardDeckProps {
  tasks: DailyTask[];
  memories: Memory[];
  liveState: LiveState;
  activeSubAgent: SubAgent;
  onOpenTasks: () => void;
  onOpenChalkboard: () => void;
  onOpenMemories: () => void;
  onOpenOffice: () => void;
  onOpenRoutines: () => void;
  onToggleTask: (id: string) => void;
  onRunVoiceRoutine: (routine: string) => void;
  themeColor: string;
}

export const MahrCardDeck: React.FC<MahrCardDeckProps> = ({
  tasks,
  memories,
  liveState,
  activeSubAgent,
  onOpenTasks,
  onOpenChalkboard,
  onOpenMemories,
  onOpenOffice,
  onOpenRoutines,
  onToggleTask,
  onRunVoiceRoutine,
  themeColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const cleanup = animateCardDeckReveal(containerRef.current, ".mahr-smart-card");
      return cleanup;
    }
  }, []);

  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 3);
  const latestMemory = memories && memories.length > 0 ? memories[0] : null;

  return (
    <div
      ref={containerRef}
      className="w-full max-w-5xl mx-auto px-4 py-2 pointer-events-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: MAHR Smart Status & Voice Routines */}
        <div className="mahr-smart-card relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl p-4 shadow-xl transition-all duration-300 hover:border-cyan-500/40 hover:shadow-cyan-500/10 hover:shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white tracking-wide">
                  MAHR Smart Deck
                </h4>
                <p className="text-[10px] text-zinc-400">
                  {liveState === "speaking"
                    ? "Speaking response..."
                    : liveState === "listening"
                    ? "Listening intently..."
                    : "Say 'Hey Mahr' or tap routines"}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenRoutines}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Routines</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5 my-2">
            <button
              onClick={() => onRunVoiceRoutine("briefing")}
              className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-xs text-zinc-200 flex items-center justify-between transition-all group cursor-pointer"
            >
              <span className="flex items-center gap-2 text-[11px]">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Morning Briefing & Schedule</span>
              </span>
              <Play className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => onRunVoiceRoutine("study")}
              className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-xs text-zinc-200 flex items-center justify-between transition-all group cursor-pointer"
            >
              <span className="flex items-center gap-2 text-[11px]">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Deep Focus Study Sprint</span>
              </span>
              <Play className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-zinc-400">
            <span>Persona: <span className="text-zinc-200 font-medium">{activeSubAgent.name}</span></span>
            <span className="text-emerald-400 font-mono">100% Real-Time</span>
          </div>
        </div>

        {/* Card 2: Today's Priorities / Google Tasks */}
        <div className="mahr-smart-card relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl p-4 shadow-xl transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-500/10 hover:shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white tracking-wide">
                  Daily Priorities
                </h4>
                <p className="text-[10px] text-zinc-400">
                  {pendingTasks.length} pending task{pendingTasks.length === 1 ? "" : "s"} today
                </p>
              </div>
            </div>
            <button
              onClick={onOpenTasks}
              className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5 my-2">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onToggleTask(t.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-[11px] text-zinc-200 cursor-pointer transition-colors"
                >
                  <span className="truncate pr-2">{t.title}</span>
                  <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center hover:border-emerald-400">
                    {t.completed && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-3 text-center text-zinc-500 text-[11px]">
                No pending tasks. You are all caught up!
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-zinc-400">
            <span>Tasks: <span className="text-zinc-200 font-medium">{tasks.length} total</span></span>
            <button
              onClick={onOpenTasks}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              View All
            </button>
          </div>
        </div>

        {/* Card 3: Memory Recall & Workspace Hub */}
        <div className="mahr-smart-card relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl p-4 shadow-xl transition-all duration-300 hover:border-purple-500/40 hover:shadow-purple-500/10 hover:shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white tracking-wide">
                  Memory & Brain
                </h4>
                <p className="text-[10px] text-zinc-400">
                  {memories.length} vector facts connected
                </p>
              </div>
            </div>
            <button
              onClick={onOpenMemories}
              className="text-[10px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Graph</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="my-2 p-2 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-zinc-300 line-clamp-2 italic">
              {latestMemory ? `"${latestMemory.text}"` : "Speak with MAHR to automatically store long-term recollections."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/5">
            <button
              onClick={onOpenChalkboard}
              className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-zinc-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Chalkboard</span>
            </button>
            <button
              onClick={onOpenOffice}
              className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-zinc-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Bot className="w-3 h-3 text-amber-400" />
              <span>Office Floor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
