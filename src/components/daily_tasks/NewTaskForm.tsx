import React, { useState } from "react";
import { DailyTask } from "../../lib/subagentTypes";
import { Plus, X } from "lucide-react";
import { motion } from "motion/react";

interface NewTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<DailyTask, "id" | "createdAt">) => void;
  todayStr: string;
}

export const NewTaskForm: React.FC<NewTaskFormProps> = ({
  isOpen,
  onClose,
  onAddTask,
  todayStr,
}) => {
  const [title, setTitle] = useState("");
  const [timeBlock, setTimeBlock] = useState("Morning");
  const [priority, setPriority] = useState<DailyTask["priority"]>("medium");
  const [category, setCategory] = useState<DailyTask["category"]>("study");
  const [taskDate, setTaskDate] = useState(todayStr);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      text: title.trim(),
      timeBlock,
      priority,
      category,
      completed: false,
      date: taskDate || todayStr,
      reminder: true,
      notes: notes.trim(),
    });

    setTitle("");
    setNotes("");
    setTaskDate(todayStr);
    onClose();
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 bg-slate-900/90 border border-amber-500/35 rounded-2xl space-y-3.5 shadow-xl relative overflow-hidden"
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
          <Plus className="w-4 h-4 text-amber-400" /> New Schedule Task
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-mono text-slate-300 mb-1">Task Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master React Fiber Architecture & Complete Simulation"
            className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-300 mb-1">Time Block</label>
          <select
            value={timeBlock}
            onChange={(e) => setTimeBlock(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/80"
          >
            <option value="Morning Focus">Morning Focus (08:00 AM - 12:00 PM)</option>
            <option value="Afternoon Sprint">Afternoon Sprint (12:00 PM - 05:00 PM)</option>
            <option value="Evening Review">Evening Review (05:00 PM - 09:00 PM)</option>
            <option value="Night Recap">Night Recap (09:00 PM+)</option>
            <option value="Office Sprint">Office Sprint</option>
            <option value="Anytime">Anytime / Open</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/80"
          >
            <option value="study">Study & Academic</option>
            <option value="coding">Software & Code</option>
            <option value="Office Task">Office Task (Multi-Agent)</option>
            <option value="personal">Personal Goal</option>
            <option value="health">Health & Mindfulness</option>
            <option value="work">Work Project</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-300 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/80"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-300 mb-1">Schedule Date</label>
          <input
            type="date"
            value={taskDate}
            onChange={(e) => setTaskDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/80"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-mono text-slate-300 mb-1">Notes / Details</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Focus on Feynman active recall step 2"
            className="w-full px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02]"
        >
          Save Task
        </button>
      </div>
    </motion.form>
  );
};
