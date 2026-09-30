import React from "react";
import { Filter, Layers, Calendar, Clock, CheckCircle2, Building2, BookOpen, Code, Heart, User, Briefcase } from "lucide-react";

export type ViewScope = "all" | "today" | "pending" | "completed";

interface TaskFilterTabsProps {
  viewScope: ViewScope;
  onSelectViewScope: (scope: ViewScope) => void;
  allCount: number;
  todayCount: number;
  pendingCount: number;
  completedCount: number;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  availableCategories: string[];
}

export const TaskFilterTabs: React.FC<TaskFilterTabsProps> = ({
  viewScope,
  onSelectViewScope,
  allCount,
  todayCount,
  pendingCount,
  completedCount,
  activeCategory,
  onSelectCategory,
  availableCategories,
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "office task":
        return <Building2 className="w-3 h-3 text-purple-400" />;
      case "study":
        return <BookOpen className="w-3 h-3 text-cyan-400" />;
      case "coding":
        return <Code className="w-3 h-3 text-emerald-400" />;
      case "health":
        return <Heart className="w-3 h-3 text-rose-400" />;
      case "personal":
        return <User className="w-3 h-3 text-amber-400" />;
      case "work":
        return <Briefcase className="w-3 h-3 text-blue-400" />;
      default:
        return <Layers className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-2.5 pb-2">
      {/* Primary Scope Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => onSelectViewScope("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            viewScope === "all"
              ? "bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Tasks</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 font-bold">
            {allCount}
          </span>
        </button>

        <button
          onClick={() => onSelectViewScope("today")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            viewScope === "today"
              ? "bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-slate-800"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Today</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 font-bold">
            {todayCount}
          </span>
        </button>

        <button
          onClick={() => onSelectViewScope("pending")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            viewScope === "pending"
              ? "bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-slate-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 font-bold">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => onSelectViewScope("completed")}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            viewScope === "completed"
              ? "bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-slate-800"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 font-bold">
            {completedCount}
          </span>
        </button>
      </div>

      {/* Secondary Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 text-xs">
        <Filter className="w-3 h-3 text-slate-500 shrink-0 ml-1" />
        <span className="text-[11px] font-mono text-slate-400 shrink-0">Filter:</span>
        <button
          onClick={() => onSelectCategory("all")}
          className={`px-2.5 py-0.8 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
            activeCategory === "all"
              ? "bg-white/20 text-white border border-white/30 font-semibold"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-300 border border-white/5"
          }`}
        >
          All Categories
        </button>
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-2.5 py-0.8 rounded-lg text-[11px] font-medium capitalize flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeCategory === cat
                ? "bg-white/20 text-white border border-white/30 font-semibold"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-300 border border-white/5"
            }`}
          >
            {getCategoryIcon(cat)}
            <span>{cat}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
