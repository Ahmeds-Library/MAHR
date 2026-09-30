import React from "react";
import { Calendar, Plus, X, Sparkles } from "lucide-react";

interface TaskHeaderProps {
  totalCount: number;
  completedCount: number;
  isAdding: boolean;
  onToggleAdd: () => void;
  onClose: () => void;
  themeColor?: string;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({
  totalCount,
  completedCount,
  isAdding,
  onToggleAdd,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-slate-900/90 backdrop-blur-xl relative z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-mono flex items-center gap-2">
              MAHR Task & Schedule Core
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {completedCount}/{totalCount} Completed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Personal AI schedule manager. Synchronized across MAHR voice companion & virtual office.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleAdd}
          className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 shadow-md cursor-pointer ${
            isAdding
              ? "bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700"
              : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-500/20 hover:scale-[1.02]"
          }`}
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isAdding ? "Cancel" : "Add Task"}</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
