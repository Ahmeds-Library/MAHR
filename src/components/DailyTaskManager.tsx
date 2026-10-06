import React, { useState, useMemo, useEffect } from "react";
import { DailyTask } from "../lib/subagentTypes";
import { normalizeDailyTaskList, getLocalTodayDateString } from "../lib/taskSchema";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, CheckCircle2, CloudLightning, Sparkles } from "lucide-react";
import { GoogleTaskSyncHeader } from "./daily_tasks/GoogleTaskSyncHeader";
import { GoogleTasksConnectHero } from "./daily_tasks/GoogleTasksConnectHero";
import { GoogleTaskQuickAdd } from "./daily_tasks/GoogleTaskQuickAdd";
import { TaskFilterTabs, ViewScope } from "./daily_tasks/TaskFilterTabs";
import { TaskProgressBar } from "./daily_tasks/TaskProgressBar";
import { TaskItemCard } from "./daily_tasks/TaskItemCard";
import { DeleteTaskConfirmModal } from "./daily_tasks/DeleteTaskConfirmModal";
import { CreateTaskListModal } from "./daily_tasks/CreateTaskListModal";
import { GoogleTaskList } from "../services/google/googleWorkspaceTypes";

export interface DailyTaskManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DailyTask[];
  onAddTask: (task: Omit<DailyTask, "id" | "createdAt">) => Promise<any>;
  onToggleTask: (id: string) => Promise<any>;
  onDeleteTask: (id: string) => Promise<any>;
  onUpdateTask?: (task: DailyTask) => Promise<any>;
  isGoogleConnected?: boolean;
  userEmail?: string | null;
  userName?: string | null;
  taskLists?: GoogleTaskList[];
  activeListId?: string;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
  onSwitchList?: (listId: string) => void;
  onCreateTaskList?: (title: string) => Promise<any>;
  onRefresh?: () => void;
  onConnectGoogle?: () => void;
  onClearCompleted?: () => void;
}

/**
 * Recreated Pure Google Tasks Command Center (Layer 3: UI & Presentation)
 * Guaranteed 100% cloud sync with Google Tasks API — zero local divergent state.
 */
export function DailyTaskManager({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  isGoogleConnected = false,
  userEmail = null,
  userName = null,
  taskLists = [{ id: "@default", title: "My Tasks" }],
  activeListId = "@default",
  isSyncing = false,
  lastSyncedAt = null,
  onSwitchList,
  onCreateTaskList,
  onRefresh,
  onConnectGoogle,
  onClearCompleted,
}: DailyTaskManagerProps) {
  const [viewScope, setViewScope] = useState<ViewScope>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [taskPendingDeletion, setTaskPendingDeletion] = useState<DailyTask | null>(null);
  const [isCreateListOpen, setIsCreateListOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const todayStr = useMemo(() => getLocalTodayDateString(), []);

  // Normalize tasks safely
  const normalizedTasks = useMemo(() => {
    return normalizeDailyTaskList(tasks, todayStr);
  }, [tasks, todayStr]);

  const activeListName = useMemo(() => {
    const found = taskLists.find((l) => l.id === activeListId);
    return found ? found.title : "My Tasks";
  }, [taskLists, activeListId]);

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

  // Available categories
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    normalizedTasks.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [normalizedTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return normalizedTasks.filter((t) => {
      // Scope filter
      if (viewScope === "today") {
        const matchesDate = t.date === todayStr || (!t.completed && (!t.date || t.date <= todayStr));
        if (!matchesDate) return false;
      } else if (viewScope === "pending" && t.completed) {
        return false;
      } else if (viewScope === "completed" && !t.completed) {
        return false;
      }

      // Category filter
      if (activeCategory !== "all" && t.category?.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (t.title || t.text || "").toLowerCase().includes(query);
        const matchesNotes = (t.notes || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes) return false;
      }

      return true;
    });
  }, [normalizedTasks, viewScope, activeCategory, searchQuery, todayStr]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !taskPendingDeletion && !isCreateListOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, taskPendingDeletion, isCreateListOpen, onClose]);

  const handleConfirmDelete = async () => {
    if (taskPendingDeletion) {
      await onDeleteTask(taskPendingDeletion.id);
      setTaskPendingDeletion(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950 border border-white/15 shadow-2xl overflow-hidden text-white"
          >
            {/* Header */}
            {isGoogleConnected ? (
              <GoogleTaskSyncHeader
                taskLists={taskLists}
                activeListId={activeListId}
                onSwitchList={onSwitchList || (() => {})}
                onCreateListClick={() => setIsCreateListOpen(true)}
                onRefresh={onRefresh || (() => {})}
                onClose={onClose}
                isSyncing={isSyncing}
                userEmail={userEmail}
                lastSyncedAt={lastSyncedAt}
              />
            ) : (
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudLightning className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-base">Google Tasks</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {!isGoogleConnected ? (
                /* Disconnected Hero Screen */
                <GoogleTasksConnectHero
                  onConnect={onConnectGoogle || (() => {})}
                  isLoading={isSyncing}
                />
              ) : (
                /* Connected Live Google Tasks UI */
                <>
                  {/* Progress Bar */}
                  <TaskProgressBar
                    totalCount={normalizedTasks.length}
                    completedCount={completedTasks.length}
                  />

                  {/* Quick Add Bar: Adds directly to Google Tasks API */}
                  <GoogleTaskQuickAdd
                    onAddTask={onAddTask}
                    activeListName={activeListName}
                    todayStr={todayStr}
                  />

                  {/* Filter Tabs (All, Today, Pending, Completed) */}
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

                  {/* Tasks List */}
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6 bg-slate-900/30">
                      <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
                      <h4 className="text-sm font-semibold text-slate-300 font-mono">
                        No Google Tasks in this view
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                        {viewScope === "today"
                          ? "No tasks scheduled for today. Type above to add one directly to your Google Tasks!"
                          : "Type in the field above to add a new task directly to your Google Tasks list."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredTasks.map((task) => (
                        <TaskItemCard
                          key={task.id}
                          task={task}
                          todayStr={todayStr}
                          onToggle={onToggleTask}
                          onDelete={(id) => {
                            const target = normalizedTasks.find((t) => t.id === id);
                            if (target) setTaskPendingDeletion(target);
                          }}
                          onUpdate={onUpdateTask}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {isGoogleConnected && (
              <div className="px-5 py-3 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Tasks Real-Time API Synced</span>
                </span>
                <div className="flex items-center gap-3">
                  {completedTasks.length > 0 && onClearCompleted && (
                    <button
                      type="button"
                      onClick={onClearCompleted}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 transition-colors cursor-pointer"
                    >
                      Clear {completedTasks.length} Completed
                    </button>
                  )}
                  <span>
                    Showing {filteredTasks.length} of {normalizedTasks.length} Google Tasks
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteTaskConfirmModal
        isOpen={Boolean(taskPendingDeletion)}
        taskTitle={taskPendingDeletion?.title || "this task"}
        isGoogleConnected={isGoogleConnected}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskPendingDeletion(null)}
      />

      {/* Create Task List Modal */}
      {onCreateTaskList && (
        <CreateTaskListModal
          isOpen={isCreateListOpen}
          onClose={() => setIsCreateListOpen(false)}
          onCreateList={onCreateTaskList}
        />
      )}
    </>
  );
}
