import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCircle2, X, Sparkles } from "lucide-react";
import { DailyTask } from "../lib/subagentTypes";

interface ProactiveTaskReminderToastProps {
  task: DailyTask | null;
  onDismiss: () => void;
  onCompleteTask?: (taskId: string) => void;
  themeColor?: string;
}

export const ProactiveTaskReminderToast: React.FC<ProactiveTaskReminderToastProps> = ({
  task,
  onDismiss,
  onCompleteTask,
  themeColor = "purple",
}) => {
  if (!task) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-20 right-6 z-[120] max-w-sm w-full"
      >
        <div className="bg-slate-950/90 border border-purple-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col gap-2.5 group">
          {/* Holographic Glowing Accent */}
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/30 transition-all" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Bell size={14} className="animate-bounce" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold flex items-center gap-1">
                <Sparkles size={10} className="text-amber-400" />
                MAHR Proactive Task Reminder
              </span>
            </div>

            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
            >
              <X size={14} />
            </button>
          </div>

          <div className="pl-1">
            <p className="text-xs font-semibold text-slate-100 leading-snug">
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                task.priority === "high" 
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                  : task.priority === "medium" 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}>
                {task.priority} Priority
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                Category: {task.timeCategory}
              </span>
            </div>
          </div>

          {onCompleteTask && (
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  onCompleteTask(task.id);
                  onDismiss();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold transition cursor-pointer"
              >
                <CheckCircle2 size={12} />
                <span>Mark Done</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
