import React, { useState } from "react";
import { SimulationStudyChallenge } from "../../lib/simulationTypes";
import { GraduationCap, Award, HelpCircle, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

interface SimulationStudyGuideProps {
  challenges?: SimulationStudyChallenge[];
  activeModelName: string;
  onAskTutor?: (question: string) => void;
}

export const SimulationStudyGuide: React.FC<SimulationStudyGuideProps> = ({
  challenges,
  activeModelName,
  onAskTutor
}) => {
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});

  if (!challenges || challenges.length === 0) {
    return (
      <div id="no-challenges-card" className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
        No active guided challenges for this topic. Freely explore with parameter sliders!
      </div>
    );
  }

  const current = challenges[activeChallengeIndex] || challenges[0];
  const isDone = completedChallenges[current.id];

  const handleToggleComplete = (id: string) => {
    setCompletedChallenges((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div id="simulation-study-guide-panel" className="flex flex-col gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>Interactive Learning Lab</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Challenge {activeChallengeIndex + 1} of {challenges.length}
        </div>
      </div>

      {/* Challenge Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {challenges.map((c, idx) => {
          const finished = completedChallenges[c.id];
          const isCurrent = idx === activeChallengeIndex;
          return (
            <button
              key={c.id}
              id={`tab-challenge-${c.id}`}
              onClick={() => {
                setActiveChallengeIndex(idx);
                setShowHint(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isCurrent
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : finished
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {finished ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[9px]">{idx + 1}</span>}
              <span className="truncate max-w-[130px]">{c.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Challenge Card */}
      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{current.title}</span>
          </h4>
          <button
            id="btn-mark-challenge-done"
            onClick={() => handleToggleComplete(current.id)}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
              isDone
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{isDone ? "Completed" : "Mark Done"}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {current.instruction}
        </p>

        {showHint ? (
          <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/90 leading-normal flex flex-col gap-1 animate-fadeIn">
            <span className="font-semibold text-amber-300 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Intuition Hint:
            </span>
            <span>{current.hint}</span>
          </div>
        ) : (
          <button
            id="btn-show-hint"
            onClick={() => setShowHint(true)}
            className="self-start flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Need a Hint?</span>
          </button>
        )}

        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 truncate max-w-[200px]" title={current.explanation}>
            {current.explanation}
          </span>
          {onAskTutor && (
            <button
              id="btn-ask-mahr-tutor"
              onClick={() => onAskTutor(`Explain the physical concepts behind ${current.title} in the ${activeModelName} simulation.`)}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors shrink-0 ml-2"
            >
              <span>Ask MAHR Tutor</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
