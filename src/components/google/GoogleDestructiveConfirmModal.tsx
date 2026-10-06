import React from "react";
import { AlertTriangle, X, Check } from "lucide-react";

interface GoogleDestructiveConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GoogleDestructiveConfirmModal: React.FC<GoogleDestructiveConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-zinc-950 p-6 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div
            className={`p-3 rounded-xl border ${
              isDanger
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-cyan-600 hover:bg-cyan-500 text-white"
            } disabled:opacity-50`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isLoading ? "Processing..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
