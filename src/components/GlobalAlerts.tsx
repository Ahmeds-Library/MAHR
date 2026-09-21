import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CircleAlert } from "lucide-react";

interface GlobalAlertsProps {
  errorText: string | null;
  isMicDenied: boolean;
  connectionState: string;
  onDismissError: () => void;
}

export const GlobalAlerts: React.FC<GlobalAlertsProps> = ({
  errorText,
  isMicDenied,
  connectionState,
  onDismissError
}) => {
  const [dismissMicToast, setDismissMicToast] = React.useState(false);

  if (!errorText && (!isMicDenied || connectionState === "disconnected" || dismissMicToast)) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[140] w-full max-w-md px-4 flex flex-col gap-2 pointer-events-none">
      {/* Global Error Toast */}
      <AnimatePresence>
        {errorText && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border border-rose-500/30 bg-slate-950/90 backdrop-blur-xl shadow-2xl w-full text-left"
          >
            <CircleAlert className="text-rose-400 shrink-0 mt-0.5" size={16} />
            <div className="flex-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-300 font-mono">System Protocol Alert</h4>
              <p className="text-xs text-rose-100/90 mt-0.5 leading-relaxed">{errorText}</p>
            </div>
            <button
              onClick={onDismissError}
              className="text-[10px] font-mono px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic Fallback Toast */}
      <AnimatePresence>
        {isMicDenied && connectionState !== "disconnected" && !dismissMicToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border border-amber-500/30 bg-slate-950/90 backdrop-blur-xl shadow-2xl w-full text-left"
          >
            <CircleAlert className="text-amber-400 shrink-0 mt-0.5" size={16} />
            <div className="flex-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-300 font-mono">Mic Restricted in Preview</h4>
              <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
                Microphone is restricted in the iframe. Open in a new tab to talk, or use the interactive study pad.
              </p>
            </div>
            <button
              onClick={() => setDismissMicToast(true)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
