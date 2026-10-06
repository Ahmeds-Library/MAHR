import React, { useState } from "react";
import { Plus, Calendar, AlignLeft, X, Sparkles, Check } from "lucide-react";
import { DailyTask } from "../../lib/subagentTypes";

interface GoogleTaskQuickAddProps {
  onAddTask: (task: Omit<DailyTask, "id" | "createdAt">) => Promise<any>;
  activeListName?: string;
  todayStr: string;
}

export const GoogleTaskQuickAdd: React.FC<GoogleTaskQuickAddProps> = ({
  onAddTask,
  activeListName = "My Tasks",
  todayStr,
}) => {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(todayStr);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: title.trim(),
        text: title.trim(),
        notes: notes.trim(),
        date: dueDate || todayStr,
        completed: false,
        priority: "medium",
        category: "Google Task",
        timeBlock: "Scheduled",
        reminder: true,
      });

      setTitle("");
      setNotes("");
      setShowDetails(false);
    } catch (err) {
      console.error("[GoogleTaskQuickAdd] Task creation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg space-y-3 transition-all focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
          <Plus className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Add a task to ${activeListName}... (Press Enter)`}
          disabled={isSubmitting}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              showDetails || notes
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
            title="Add notes or set due date"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Details</span>
          </button>
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Notes & Due Date */}
      {showDetails && (
        <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
          <div className="sm:col-span-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details, notes, or agenda..."
              rows={2}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      )}
    </form>
  );
};
