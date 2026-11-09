import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PenTool,
  Code2,
  Sparkles,
  CheckCircle2,
  BookOpen,
  BrainCircuit,
  Compass,
  Heart,
} from "lucide-react";
import { MascotAttentionReaction } from "@/core/mascot/mascotPageContextTypes";

interface MascotWorkAttentionBubbleProps {
  visible: boolean;
  reaction: MascotAttentionReaction | null;
}

export const MascotWorkAttentionBubble: React.FC<
  MascotWorkAttentionBubbleProps
> = ({ visible, reaction }) => {
  const renderIcon = () => {
    if (!reaction) return <Sparkles className="h-3.5 w-3.5 text-cyan-300" />;
    switch (reaction.badgeIcon) {
      case "pen":
        return <PenTool className="h-3.5 w-3.5 text-cyan-300" />;
      case "code":
        return <Code2 className="h-3.5 w-3.5 text-emerald-300" />;
      case "sparkles":
        return <Sparkles className="h-3.5 w-3.5 text-amber-300" />;
      case "check":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />;
      case "book":
        return <BookOpen className="h-3.5 w-3.5 text-purple-300" />;
      case "brain":
        return <BrainCircuit className="h-3.5 w-3.5 text-fuchsia-300" />;
      case "compass":
        return <Compass className="h-3.5 w-3.5 text-sky-300" />;
      case "heart":
        return <Heart className="h-3.5 w-3.5 text-rose-300" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-cyan-300" />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {visible && reaction && (
        <motion.div
          key={reaction.id}
          initial={{ opacity: 0, y: 10, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.92 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 24,
          }}
          className="pointer-events-none absolute -top-14 right-0 z-30 flex max-w-[240px] items-center gap-2 rounded-2xl border border-cyan-400/35 bg-slate-950/92 px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.72)] backdrop-blur-xl sm:max-w-[270px]"
          style={{
            boxShadow: `0 10px 28px rgba(0,0,0,0.72), 0 0 18px ${reaction.accentColor}30`,
          }}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
            {renderIcon()}
          </span>
          <span className="font-sans text-[11.5px] leading-snug font-medium tracking-tight text-slate-100">
            {reaction.statusText}
          </span>

          {/* Speech Pointer Triangle */}
          <div className="absolute -bottom-1 right-7 h-2.5 w-2.5 rotate-45 border-b border-r border-cyan-400/35 bg-slate-950/92" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
