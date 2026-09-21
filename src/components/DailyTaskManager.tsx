import React, { useState } from "react";
import { DailyTask } from "../lib/subagentTypes";
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  Sparkles, 
  Flame, 
  Target, 
  AlertCircle,
  Filter,
  Check,
  Sun,
  Sunset,
  Moon,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DailyTaskManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DailyTask[];
  onAddTask: (task: Omit<DailyTask, "id" | "createdAt">) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
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
  onAutoGenerateTasks,
  themeColor = "violet"
}: DailyTaskManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [timeBlock, setTimeBlock] = useState("Morning");
  const [priority, setPriority] = useState<DailyTask["priority"]>("medium");
  const [category, setCategory] = useState<DailyTask["category"]>("study");
  const [notes, setNotes] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => t.date === todayStr);

  const completedCount = todayTasks.filter(t => t.completed).length;
  const progressPercent = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      timeBlock,
      priority,
      category,
      completed: false,
      date: todayStr,
      reminder: true,
      notes: notes.trim()
    });

    setTitle("");
    setNotes("");
    setIsAdding(false);
  };

  const handleGenerateClick = async () => {
    if (!onAutoGenerateTasks) return;
    setIsGenerating(true);
    try {
      await onAutoGenerateTasks();
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityBadge = (p: DailyTask["priority"]) => {
    switch (p) {
      case "high":
        return <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">High Priority</span>;
      case "medium":
        return <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Medium</span>;
      case "low":
        return <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">Low</span>;
    }
  };

  const getTimeBlockIcon = (block: string) => {
    const lower = block.toLowerCase();
    if (lower.includes("morning") || lower.includes("am")) return <Sun className="w-4 h-4 text-amber-400" />;
    if (lower.includes("afternoon")) return <Sunset className="w-4 h-4 text-orange-400" />;
    return <Moon className="w-4 h-4 text-indigo-400" />;
  };

  const filteredTasks = filterCategory === "all"
    ? todayTasks
    : todayTasks.filter(t => t.category === filterCategory);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-3xl overflow-hidden bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
          >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Daily Task & Memory Tracker
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Today's Goals
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Organize your daily schedule. MAHR remembers these tasks across voice and chat sessions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/30"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Tracker Bar */}
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" /> Daily Completion Rate
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {completedCount}/{todayTasks.length} Done ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                />
              </div>
            </div>

            {onAutoGenerateTasks && (
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {isGenerating ? "Structuring..." : "Auto-Organize Day"}
              </button>
            )}
          </div>

          {/* Main Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* Form */}
            {isAdding && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleCreateTask}
                className="p-4 bg-slate-800/80 border border-amber-500/30 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-400" /> Add New Daily Task
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Task Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Solve 3 calculus integration problems"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Time Block</label>
                    <select
                      value={timeBlock}
                      onChange={(e) => setTimeBlock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Morning">Morning (08:00 AM - 12:00 PM)</option>
                      <option value="Afternoon">Afternoon (12:00 PM - 05:00 PM)</option>
                      <option value="Evening">Evening (05:00 PM - 09:00 PM)</option>
                      <option value="Night">Night Review (09:00 PM+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="study">Study & Academic</option>
                      <option value="coding">Software & Code</option>
                      <option value="personal">Personal Goal</option>
                      <option value="health">Health & Mind</option>
                      <option value="work">Work Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Notes / Sub-Goal Details</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Focus on trigonometric substitution step 2"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs transition-colors"
                  >
                    Save Daily Task
                  </button>
                </div>
              </motion.form>
            )}

            {/* Task Filters */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium">Category:</span>
                {["all", "study", "coding", "personal", "health", "work"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      filterCategory === cat
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                        : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950/40">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-300">No daily tasks scheduled</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Click "Add Task" or ask MAHR to automatically structure today's priorities into actionable schedule blocks!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      task.completed
                        ? "bg-slate-950/40 border-slate-800 opacity-60 line-through"
                        : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 hover:text-emerald-400" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${task.completed ? "text-slate-400" : "text-white"}`}>
                            {task.title}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {task.notes && (
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {task.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1 font-mono text-slate-400">
                            {getTimeBlockIcon(task.timeBlock)} {task.timeBlock}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{task.category}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-amber-400" />
              <span>Tasks are automatically synced with MAHR's memory system.</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
}
