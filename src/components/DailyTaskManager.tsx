import React, { useState, useMemo, useEffect } from "react";
import { DailyTask } from "../lib/subagentTypes";
import { normalizeDailyTaskList, getLocalTodayDateString } from "../lib/taskSchema";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Sparkles, ArrowRightCircle, CheckCircle2 } from "lucide-react";
import { TaskHeader } from "./daily_tasks/TaskHeader";
import { TaskProgressBar } from "./daily_tasks/TaskProgressBar";
import { TaskFilterTabs, ViewScope } from "./daily_tasks/TaskFilterTabs";
import { TaskItemCard } from "./daily_tasks/TaskItemCard";
import { NewTaskForm } from "./daily_tasks/NewTaskForm";

export interface DailyTaskManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DailyTask[];
  onAddTask: (task: Omit<DailyTask, "id" | "createdAt">) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask?: (task: DailyTask) => void;
  onAutoGenerateTasks?: () => Promise<void>;
  themeColor?: string;
}

export function DailyTaskManager({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onAutoGenerateTasks,
  themeColor = "violet",
}: DailyTaskManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [viewScope, setViewScope] = useState<ViewScope>("today");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const todayStr = useMemo(() => getLocalTodayDateString(), []);

  // Safe normalized tasks to guarantee title and date presence across all environments
  const normalizedTasks = useMemo(() => {
    return normalizeDailyTaskList(tasks, todayStr);
  }, [tasks, todayStr]);

  const todayTasks = useMemo(
    () => normalizedTasks.filter((t) => t.date === todayStr || (!t.completed && (!t.date || t.date <= todayStr))),
    [normalizedTasks, todayStr]
  );
  const pendingTasks = useMemo(
    () => normalizedTasks.filter((t) => !t.completed),
    [normalizedTasks]
  );
  const completedTasks = useMemo(
    () => normalizedTasks.filter((t) => t.completed),
    [normalizedTasks]
  );

  // Auto-select "all" scope if today has 0 tasks but total tasks exist, or "today" if today has tasks
  useEffect(() => {
    if (isOpen) {
      if (todayTasks.length === 0 && normalizedTasks.length > 0) {
        setViewScope("all");
      } else if (todayTasks.length > 0) {
        setViewScope("today");
      }
    }
  }, [isOpen, todayTasks.length, normalizedTasks.length]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Extract unique categories present in actual tasks
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    normalizedTasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    // Ensure standard categories exist if user wants them
    ["study", "coding", "Office Task"].forEach((c) => set.add(c));
    return Array.from(set);
  }, [normalizedTasks]);

  // Filter tasks based on active scope and category
  const filteredTasks = useMemo(() => {
    let list: DailyTask[] = [];
    switch (viewScope) {
      case "today":
        list = todayTasks;
        break;
      case "pending":
        list = pendingTasks;
        break;
      case "completed":
        list = completedTasks;
        break;
      case "all":
      default:
        list = normalizedTasks;
        break;
    }

    if (activeCategory !== "all") {
      list = list.filter(
        (t) => t.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    return list;
  }, [viewScope, activeCategory, normalizedTasks, todayTasks, pendingTasks, completedTasks]);

  const handleGenerateClick = async () => {
    if (!onAutoGenerateTasks) return;
    setIsGenerating(true);
    try {
      await onAutoGenerateTasks();
      setViewScope("today");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleAllPendingToToday = () => {
    if (!onUpdateTask) return;
    pendingTasks.forEach((t) => {
      if (t.date !== todayStr) {
        onUpdateTask({ ...t, date: todayStr });
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-3xl overflow-hidden bg-slate-950/95 border border-white/15 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60 pointer-events-none" />

          {/* 1. Header */}
          <TaskHeader
            totalCount={normalizedTasks.length}
            completedCount={completedTasks.length}
            isAdding={isAdding}
            onToggleAdd={() => setIsAdding(!isAdding)}
            onClose={onClose}
            themeColor={themeColor}
          />

          {/* 2. Progress Tracker Bar */}
          <TaskProgressBar
            completedCount={completedTasks.length}
            totalCount={normalizedTasks.length}
            isGenerating={isGenerating}
            onAutoGenerate={onAutoGenerateTasks ? handleGenerateClick : undefined}
          />

          {/* 3. Main Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
            {/* New Task Form */}
            <NewTaskForm
              isOpen={isAdding}
              onClose={() => setIsAdding(false)}
              onAddTask={onAddTask}
              todayStr={todayStr}
            />

            {/* Filter Tabs (Scope + Category) */}
            <TaskFilterTabs
              viewScope={viewScope}
              onSelectViewScope={setViewScope}
              allCount={normalizedTasks.length}
              todayCount={todayTasks.length}
              pendingCount={pendingTasks.length}
              completedCount={completedTasks.length}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              availableCategories={availableCategories}
            />

            {/* Quick Helper Banner if today is empty but tasks exist */}
            {viewScope === "today" && todayTasks.length === 0 && normalizedTasks.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-200">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    No tasks scheduled specifically for today, but you have <strong>{normalizedTasks.length} total tasks</strong> in your active backlog!
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewScope("all")}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    View All {normalizedTasks.length}
                  </button>
                  {onUpdateTask && pendingTasks.length > 0 && (
                    <button
                      onClick={handleScheduleAllPendingToToday}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white font-mono text-[11px] font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      Schedule All to Today
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6 bg-slate-900/40">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
                <h4 className="text-sm font-semibold text-slate-300 font-mono">
                  No tasks found in this view
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  {viewScope === "today"
                    ? "Click 'View All' to see your complete backlog or click 'Add Task' to schedule today's goals!"
                    : "Create a new task or click 'Auto-Organize Day' to let MAHR prepare your schedule!"}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {normalizedTasks.length > 0 && (
                    <button
                      onClick={() => {
                        setViewScope("all");
                        setActiveCategory("all");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold font-mono transition-colors cursor-pointer"
                    >
                      Reset Filters & View All ({normalizedTasks.length})
                    </button>
                  )}
                  <button
                    onClick={() => setIsAdding(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold font-mono transition-colors cursor-pointer"
                  >
                    + Add New Task
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => (
                  <TaskItemCard
                    key={task.id}
                    task={task}
                    todayStr={todayStr}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onMoveToToday={onUpdateTask}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-5 py-3 bg-slate-950 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice & Multimodal Sync Active</span>
            </span>
            <span>
              Showing {filteredTasks.length} of {normalizedTasks.length} tasks
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
