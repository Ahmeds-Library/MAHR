import React, { useState } from "react";
import { FolderPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CreateTaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList: (title: string) => Promise<any>;
}

export const CreateTaskListModal: React.FC<CreateTaskListModalProps> = ({
  isOpen,
  onClose,
  onCreateList,
}) => {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateList(title.trim());
      setTitle("");
      onClose();
    } catch (err) {
      console.error("[CreateTaskListModal] Failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/15 p-5 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <FolderPlus className="w-4 h-4 text-blue-400" />
              <span>Create Google Task List</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-mono">List Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Work, Study, Project Apollo"
                autoFocus
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-40"
              >
                {isSubmitting ? "Creating..." : "Create List"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
