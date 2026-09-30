import React from "react";
import {
  Brain,
  Building2,
  Calendar,
  Layers,
  MessageSquare,
  Mic,
  MicOff,
  PenTool,
  Sparkles,
  Zap
} from "lucide-react";

interface MahrDockQuickActionsProps {
  isWakeWordEnabled?: boolean;
  onToggleWakeWord?: () => void;
  onOpenWhiteboard?: () => void;
  onOpenStudyPad?: () => void;
  onOpenTasks?: () => void;
  onOpenRecalls?: () => void;
  onOpenOffice?: () => void;
  onOpenSlides?: () => void;
  onOpenRoutines?: () => void;
  onOpenAskMahr?: () => void;
}

export const MahrDockQuickActions: React.FC<MahrDockQuickActionsProps> = ({
  isWakeWordEnabled = true,
  onToggleWakeWord,
  onOpenWhiteboard,
  onOpenStudyPad,
  onOpenTasks,
  onOpenRecalls,
  onOpenOffice,
  onOpenSlides,
  onOpenRoutines,
  onOpenAskMahr,
}) => {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl max-w-full overflow-x-auto scrollbar-none">
      {/* Wake Word Listener Toggle ("Hey Mahr") */}
      {onToggleWakeWord && (
        <button
          onClick={onToggleWakeWord}
          className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isWakeWordEnabled
              ? "text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          }`}
          title={isWakeWordEnabled ? "Wake word active ('Hey Mahr')" : "Wake word paused"}
        >
          {isWakeWordEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>
      )}

      {/* Vector Knowledge Graph & Semantic Memory Recall */}
      {onOpenRecalls && (
        <button
          onClick={onOpenRecalls}
          className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all cursor-pointer flex items-center gap-1"
          title="Vector Memory & Knowledge Graph"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
        </button>
      )}

      {/* Multi-Agent Virtual Office Floor */}
      {onOpenOffice && (
        <button
          onClick={onOpenOffice}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30 transition-all cursor-pointer"
          title="MAHR Virtual Office Floor (Michael, Jim, Pam, Dwight)"
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
        </button>
      )}

      {/* Presentation Studio & Google Slides */}
      {onOpenSlides && (
        <button
          onClick={onOpenSlides}
          className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-amber-950/30 transition-all cursor-pointer"
          title="Presentation & Slides Studio"
        >
          <Layers className="w-4 h-4 text-amber-400" />
        </button>
      )}

      {/* Interactive Chalkboard */}
      {onOpenWhiteboard && (
        <button
          onClick={onOpenWhiteboard}
          className="p-2 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30 transition-all cursor-pointer"
          title="Classroom Chalkboard & Collaborative Canvas"
        >
          <PenTool className="w-4 h-4 text-emerald-400" />
        </button>
      )}

      {/* Study Pad & Notes */}
      {onOpenStudyPad && (
        <button
          onClick={onOpenStudyPad}
          className="p-2 rounded-xl text-slate-400 hover:text-teal-300 hover:bg-teal-950/30 transition-all cursor-pointer"
          title="Study Pad & AI Learning Notes"
        >
          <MessageSquare className="w-4 h-4 text-teal-400" />
        </button>
      )}

      {/* Daily Task Planner */}
      {onOpenTasks && (
        <button
          onClick={onOpenTasks}
          className="p-2 rounded-xl text-slate-400 hover:text-orange-300 hover:bg-orange-950/30 transition-all cursor-pointer"
          title="Daily Task & Memory Tracker"
        >
          <Calendar className="w-4 h-4 text-orange-400" />
        </button>
      )}

      {/* Smart Routines Drawer */}
      {onOpenRoutines && (
        <button
          onClick={onOpenRoutines}
          className="p-2 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-purple-950/30 transition-all cursor-pointer"
          title="Mahr Smart Routines (Briefings, FMC Deck, Pipeline)"
        >
          <Zap className="w-4 h-4 text-purple-400" />
        </button>
      )}

      {/* Quick Ask Mahr Dialog Trigger */}
      {onOpenAskMahr && (
        <button
          onClick={onOpenAskMahr}
          className="p-2 rounded-xl text-slate-400 hover:text-yellow-300 hover:bg-yellow-950/30 transition-all cursor-pointer"
          title="Ask Mahr (Console Query)"
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </button>
      )}
    </div>
  );
};
