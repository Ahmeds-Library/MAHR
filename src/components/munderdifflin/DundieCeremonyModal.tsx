// 🏢 Layer 3: DundieCeremonyModal Component
// Authentic "The Dundies" award presentation ceremony modal for Munder-Difflin

import React from "react";
import { Trophy, Sparkles, X, Heart, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DundieCeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  winnerName: string;
  awardTitle: string;
  speech: string;
}

export function DundieCeremonyModal({
  isOpen,
  onClose,
  winnerName,
  awardTitle,
  speech
}: DundieCeremonyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        className="relative w-full max-w-lg p-6 rounded-3xl bg-gradient-to-b from-[#1b120c] via-[#150d18] to-[#0a0712] border-2 border-amber-400/60 shadow-[0_0_50px_rgba(251,191,36,0.3)] flex flex-col items-center text-center gap-4 overflow-hidden"
      >
        {/* Golden Sparkle Glows */}
        <div className="absolute top-0 inset-x-0 h-32 bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Trophy Visual */}
        <div className="relative mt-2">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-[#1a0f05] flex items-center justify-center">
              <Trophy size={48} className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse" />
            </div>
          </div>
          <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg">
            <Sparkles size={14} />
          </span>
        </div>

        {/* Ceremony Header */}
        <div>
          <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
            <Award size={12} />
            <span>20th Annual Dundie Awards</span>
          </div>

          <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
            "{awardTitle}"
          </h3>

          <p className="text-sm font-bold text-white mt-1">
            Presented to: <span className="text-amber-300">{winnerName}</span>
          </p>
        </div>

        {/* Michael Scott / MAHR Speech */}
        <div className="w-full p-4 rounded-2xl bg-black/50 border border-amber-400/30 text-xs font-mono text-amber-100 leading-relaxed italic text-left">
          {speech}
        </div>

        {/* Chili's Restaurant Reference Footer */}
        <div className="text-[11px] text-slate-400 font-mono">
          🏆 Commemorative Dundie Plaque officially certified by Munder-Difflin Executive Branch
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-mono font-bold text-sm tracking-wide shadow-lg cursor-pointer transition-all"
        >
          Accept Dundie Award With Honor
        </button>
      </motion.div>
    </div>
  );
}
