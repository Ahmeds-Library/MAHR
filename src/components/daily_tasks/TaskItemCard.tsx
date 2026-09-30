import React from "react";
import { DailyTask } from "../../lib/subagentTypes";
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Sun, 
  Sunset, 
  Moon, 
  Clock, 
  Building2, 
  Calendar, 
  ArrowRightCircle,
  Sparkles
} from "lucide-react";

interface TaskItemCardProps {
  task: DailyTask;
  todayStr: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveToToday?: (task: DailyTask) => void;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  todayStr,
  onToggle,
  onDelete,
  onMoveToToday,
}) => {
  const isToday = task.date === todayStr;
  const displayTitle = task.title || task.text || "Untitled Task";

  const getPriorityBadge = (p: DailyTask["priority"]) => {
    switch (p) {
      case "high":
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/35 font-mono font-bold">High</span>;
      case "medium":
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35 font-mono font-medium">Medium</span>;
      case "low":
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10 font-mono">Low</span>;
      default:
        return null;
    }
  };

  const getTimeBlockIcon = (block: string = "") => {
    const lower = block.toLowerCase();
    if (lower.includes("office") || lower.includes("sprint")) return <Building2 className="w-3.5 h-3.5 text-purple-400" />;
    if (lower.includes("morning") || lower.includes("am")) return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    if (lower.includes("afternoon")) return <Sunset className="w-3.5 h-3.5 text-orange-400" />;
    if (lower.includes("evening") || lower.includes("night") || lower.includes("pm")) return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  const getCategoryBadge = (category: string = "") => {
    if (category.toLowerCase() === "office task") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/35 flex items-center gap-1 font-mono font-medium">
          <Building2 className="w-3 h-3 text-purple-400" /> Office Task
        </span>
      );
    }
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-white/10 font-mono capitalize">
        {category}
      </span>
    );
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 group ${
        task.completed
          ? "bg-slate-950/40 border-white/5 opacity-60 line-through"
          : "bg-slate-900/70 hover:bg-slate-850 border-white/10 hover:border-amber-500/30 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer focus:outline-none"
          title={task.completed ? "Mark incomplete" : "Mark completed"}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
          ) : (
            <Circle className="w-5 h-5 text-slate-500 hover:text-emerald-400" />
          )}
        </button>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs sm:text-sm font-semibold leading-snug break-words ${task.completed ? "text-slate-400" : "text-white"}`}>
              {displayTitle}
            </span>
            {getPriorityBadge(task.priority)}
            {getCategoryBadge(task.category)}
          </div>

          {task.notes && (
            <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
              {task.notes}
            </p>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] text-slate-400 pt-0.5 flex-wrap">
            <span className="flex items-center gap-1 font-mono text-slate-300">
              {getTimeBlockIcon(task.timeBlock)} {task.timeBlock || "Anytime"}
            </span>

            <span>•</span>

            <span className="flex items-center gap-1 font-mono text-[10px]">
              <Calendar className="w-3 h-3 text-slate-500" />
              {isToday ? (
                <span className="text-amber-400/90 font-semibold">Today</span>
              ) : (
                <span className="text-slate-400">{task.date || "Scheduled"}</span>
              )}
            </span>

            {!isToday && !task.completed && onMoveToToday && (
              <button
                onClick={() => onMoveToToday({ ...task, date: todayStr })}
                className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono font-medium transition-colors cursor-pointer ml-auto sm:ml-0"
                title="Move task to today's schedule"
              >
                <ArrowRightCircle className="w-3 h-3" /> Move to Today
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer shrink-0"
        title="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
