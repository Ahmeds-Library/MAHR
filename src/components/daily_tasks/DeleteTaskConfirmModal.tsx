import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteTaskConfirmModalProps {
  isOpen: boolean;
  taskTitle: string;
  isGoogleConnected: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteTaskConfirmModal: React.FC<DeleteTaskConfirmModalProps> = ({
  isOpen,
  taskTitle,
  isGoogleConnected,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/20 rounded-2xl p-5 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">
              Delete Task{isGoogleConnected ? " from Google Tasks" : ""}?
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              Are you sure you want to delete <span className="font-semibold text-rose-200">"{taskTitle}"</span>?
            </p>
            {isGoogleConnected && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                This action will permanently delete the task from your Google Account. This cannot be undone.
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
