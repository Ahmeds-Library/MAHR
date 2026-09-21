import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Mic, Volume2, Brain, X } from "lucide-react";

interface VoiceDialogueToastProps {
  modelCaption?: string | null;
  userCaption?: string | null;
  activeSkill?: { name: string; description?: string } | null;
  state?: string;
  onDismiss?: () => void;
}

export const VoiceDialogueToast: React.FC<VoiceDialogueToastProps> = ({
  modelCaption,
  userCaption,
  activeSkill,
  state,
  onDismiss,
}) => {
  const hasContent = Boolean(modelCaption || userCaption || activeSkill);

  if (!hasContent) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 pointer-events-none">
      <AnimatePresence mode="wait">
        {/* Active Voice Command Skill Pill Popup */}
        {activeSkill && (
          <motion.div
            key="active-skill-toast"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-2 mx-auto w-fit px-3 py-1.5 rounded-full border border-cyan-500/30 bg-slate-950/85 backdrop-blur-md text-cyan-300 font-mono text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-950/50 pointer-events-auto"
          >
            <Brain size={12} className="text-cyan-400 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
            <span className="font-bold tracking-widest text-slate-400 text-[9px]">ACTIVE SKILL:</span>
            <span className="font-bold text-cyan-300">{activeSkill.name}</span>
          </motion.div>
        )}

        {/* Dialogue / Speech Toast Notification */}
        {(modelCaption || userCaption) && (
          <motion.div
            key={modelCaption ? `model-${modelCaption.slice(0, 15)}` : `user-${userCaption?.slice(0, 15)}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto bg-slate-950/90 border border-white/10 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl relative overflow-hidden flex items-start gap-3 group"
          >
            {/* Subtle glow accent */}
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
              modelCaption ? "bg-cyan-500/20" : "bg-purple-500/20"
            }`} />

            {/* Icon Avatar Badge */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              modelCaption 
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                : "bg-purple-500/15 border-purple-500/30 text-purple-300"
            }`}>
              {modelCaption ? (
                <Volume2 size={16} className="animate-pulse" />
              ) : (
                <Mic size={16} className="animate-pulse" />
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  modelCaption ? "text-cyan-400" : "text-purple-400"
                }`}>
                  {modelCaption ? "MAHR Assistant" : "You"}
                </span>
                <span className="text-slate-600 text-[9px]">•</span>
                <span className="text-slate-500 text-[9px] font-mono uppercase">
                  {modelCaption ? "Speech Audio" : "Voice Input"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed tracking-normal line-clamp-3">
                {modelCaption || userCaption}
              </p>
            </div>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-slate-500 hover:text-slate-200 p-1 rounded-lg hover:bg-white/5 transition shrink-0 cursor-pointer"
                title="Dismiss notification"
              >
                <X size={14} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
