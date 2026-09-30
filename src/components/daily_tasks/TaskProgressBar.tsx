import React from "react";
import { Target, Sparkles, Flame, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface TaskProgressBarProps {
  completedCount: number;
  totalCount: number;
  isGenerating?: boolean;
  onAutoGenerate?: () => Promise<void>;
}

export const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  completedCount,
  totalCount,
  isGenerating = false,
  onAutoGenerate
}) => {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-3.5 sm:p-4 bg-slate-950/70 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold text-white flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            Productivity Momentum
            {percent === 100 && totalCount > 0 && (
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> All Done!
              </span>
            )}
          </span>
          <span className="font-mono text-emerald-400 font-bold text-xs">
            {completedCount}/{totalCount} Completed ({percent}%)
          </span>
        </div>
        <div className="w-full bg-slate-800/80 h-2 sm:h-2.5 rounded-full overflow-hidden border border-white/5 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          />
        </div>
      </div>

      {onAutoGenerate && (
        <button
          onClick={onAutoGenerate}
          disabled={isGenerating}
          className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-all shrink-0 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
        >
          <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isGenerating ? "animate-spin" : ""}`} />
          <span>{isGenerating ? "Synthesizing Tasks..." : "Auto-Organize Day"}</span>
        </button>
      )}
    </div>
  );
};
