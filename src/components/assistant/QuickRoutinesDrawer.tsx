import React from "react";
import { X, Sparkles, Sun, Users, Focus, Brain, Edit3, Activity, ArrowRight, Play, Layers } from "lucide-react";

interface RoutineItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  category: "daily" | "workspace" | "focus" | "system";
  action: () => void;
}

interface QuickRoutinesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRunRoutine: (routineId: string) => void;
  onOpenOffice: () => void;
  onOpenChalkboard: () => void;
  onOpenTasks: () => void;
  onOpenMemories: () => void;
  onOpenSlides?: () => void;
}

export const QuickRoutinesDrawer: React.FC<QuickRoutinesDrawerProps> = ({
  isOpen,
  onClose,
  onRunRoutine,
  onOpenOffice,
  onOpenChalkboard,
  onOpenTasks,
  onOpenMemories,
  onOpenSlides,
}) => {
  if (!isOpen) return null;

  const routines: RoutineItem[] = [
    {
      id: "morning_briefing",
      title: "Daily Briefing Routine",
      subtitle: "Review your prioritized agenda, open tasks & system readiness.",
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      category: "daily",
      action: () => {
        onRunRoutine("morning_briefing");
        onOpenTasks();
      },
    },
    {
      id: "fmc_presentation_routine",
      title: "10-Slide FMC Master Deck",
      subtitle: "Quantitative data, infographics, value chain pillars & retail market metrics.",
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      category: "workspace",
      action: () => {
        onRunRoutine("fmc_presentation_routine");
        onOpenSlides?.();
        onClose();
      },
    },
    {
      id: "automated_pipeline_routine",
      title: "Automated 4-Step AI Pipeline",
      subtitle: "Gemini planning, Manim math animation (.mp4), Drive cloner & Slides injector.",
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      category: "workspace",
      action: () => {
        onRunRoutine("automated_pipeline_routine");
        onOpenSlides?.();
        onClose();
      },
    },
    {
      id: "boardroom_standup",
      title: "Office Standup & Task Delegation",
      subtitle: "Summon Michael, Jim, Pam & Dwight to the boardroom conference table.",
      icon: <Users className="w-5 h-5 text-indigo-400" />,
      category: "workspace",
      action: () => {
        onOpenOffice();
        onClose();
      },
    },
    {
      id: "chalkboard_brainstorm",
      title: "Interactive Chalkboard Lab",
      subtitle: "Collaborate on math derivations, system diagrams & flowcharts.",
      icon: <Edit3 className="w-5 h-5 text-emerald-400" />,
      category: "workspace",
      action: () => {
        onOpenChalkboard();
        onClose();
      },
    },
    {
      id: "vector_memory_search",
      title: "Unified Knowledge Graph Recall",
      subtitle: "Query long-term vector embeddings, user memories & session notes.",
      icon: <Brain className="w-5 h-5 text-cyan-400" />,
      category: "focus",
      action: () => {
        onOpenMemories();
        onClose();
      },
    },
    {
      id: "deep_focus_pomodoro",
      title: "Deep Focus Audio Stream",
      subtitle: "Configure cognitive ambient frequencies & minimize distractions.",
      icon: <Focus className="w-5 h-5 text-purple-400" />,
      category: "focus",
      action: () => {
        onRunRoutine("deep_focus_pomodoro");
        onClose();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div 
        className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Mahr Smart Routines</h2>
              <p className="text-xs text-slate-400">Pre-programmed autonomous actions for Mahr</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Routines List */}
        <div className="flex-1 py-6 space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Available Assistant Routines
          </div>

          {routines.map((routine) => (
            <div
              key={routine.id}
              onClick={routine.action}
              className="group p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 shadow-sm hover:shadow-cyan-950/20"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 group-hover:scale-105 transition-transform duration-200">
                  {routine.icon}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {routine.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {routine.subtitle}
                  </p>
                </div>
              </div>
              <div className="mt-1 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Assistant Command Prompt Tip */}
        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-900/40 text-xs text-cyan-300/90 leading-relaxed">
          <span className="font-semibold text-cyan-200">Voice Command Tip:</span> Say{" "}
          <span className="font-mono text-cyan-100">&quot;Hey Mahr, start morning briefing&quot;</span> or{" "}
          <span className="font-mono text-cyan-100">&quot;Hey Mahr, call standup&quot;</span> anytime hands-free.
        </div>
      </div>
    </div>
  );
};
