import React, { useState } from "react";
import { DailyTask } from "../../lib/subagentTypes";
import {
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  CheckSquare,
  Edit2,
  Check,
  X,
  Clock
} from "lucide-react";

interface TaskItemCardProps {
  task: DailyTask;
  todayStr: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (task: DailyTask) => void;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  todayStr,
  onToggle,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title || task.text || "");
  const [editNotes, setEditNotes] = useState(task.notes || "");
  const [editDate, setEditDate] = useState(task.date || todayStr);

  const isToday = task.date === todayStr;
  const displayTitle = task.title || task.text || "Untitled Task";

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate?.({
      ...task,
      title: editTitle.trim(),
      text: editTitle.trim(),
      notes: editNotes.trim(),
      date: editDate,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title || task.text || "");
    setEditNotes(task.notes || "");
    setEditDate(task.date || todayStr);
    setIsEditing(false);
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 group ${
        task.completed
          ? "bg-slate-950/40 border-white/5 opacity-60"
          : "bg-slate-900/80 hover:bg-slate-850 border-white/10 hover:border-blue-500/30 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0 cursor-pointer focus:outline-none"
        title={task.completed ? "Mark incomplete in Google Tasks" : "Mark completed in Google Tasks"}
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
        ) : (
          <Circle className="w-5 h-5 text-slate-500 hover:text-emerald-400 transition-colors" />
        )}
      </button>

      {/* Content or Edit Form */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
              placeholder="Task title"
              autoFocus
            />
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none resize-none"
              placeholder="Notes or agenda"
              rows={2}
            />
            <div className="flex items-center justify-between gap-2">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 outline-none"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Save to Google Tasks
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs sm:text-sm font-semibold leading-snug break-words ${
                  task.completed ? "text-slate-400 line-through" : "text-white"
                }`}
              >
                {displayTitle}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                <CheckSquare className="w-3 h-3 text-blue-400" /> Google Task
              </span>
            </div>

            {task.notes && (
              <p
                className={`text-xs text-slate-400 leading-relaxed font-sans line-clamp-2 ${
                  task.completed ? "line-through opacity-75" : ""
                }`}
              >
                {task.notes}
              </p>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5 font-mono">
              <span className="flex items-center gap-1 text-[10px]">
                <Calendar className="w-3 h-3 text-slate-500" />
                {isToday ? (
                  <span className="text-amber-400/90 font-semibold">Today</span>
                ) : (
                  <span>{task.date || "No due date"}</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons (Edit & Delete) */}
      {!isEditing && (
        <div className="flex items-center gap-1 shrink-0">
          {onUpdate && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
              title="Edit task in Google Tasks"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
            title="Delete from Google Tasks"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
