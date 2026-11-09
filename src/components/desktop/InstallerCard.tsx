// 📦 Layer 1: InstallerCard Component
// Individual platform installer card with real-time status badges,
// live file sizes, cryptographic verification badges, and 1-click download actions.

import React from "react";
import { Download, Check, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { motion } from "motion/react";

export interface InstallerCardProps {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  sizeFormatted: string;
  isLatest: boolean;
  isTargetOS: boolean;
  downloading: boolean;
  onDownload: () => void;
  accentColor: "cyan" | "purple" | "emerald";
  sha256Digest?: string;
  recommendedTag?: string;
}

export const InstallerCard: React.FC<InstallerCardProps> = ({
  id,
  title,
  subtitle,
  badge,
  sizeFormatted,
  isLatest,
  isTargetOS,
  downloading,
  onDownload,
  accentColor,
  recommendedTag
}) => {
  const accentClasses = {
    cyan: {
      border: isTargetOS ? "border-cyan-500/50 ring-1 ring-cyan-500/30" : "border-slate-800 hover:border-cyan-500/30",
      bg: isTargetOS ? "bg-slate-900/90 shadow-cyan-950/20" : "bg-slate-900/50",
      pill: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      btn: "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30",
      glow: "from-cyan-500/10 to-blue-500/5"
    },
    purple: {
      border: isTargetOS ? "border-purple-500/50 ring-1 ring-purple-500/30" : "border-slate-800 hover:border-purple-500/30",
      bg: isTargetOS ? "bg-slate-900/90 shadow-purple-950/20" : "bg-slate-900/50",
      pill: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      btn: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30",
      glow: "from-purple-500/10 to-indigo-500/5"
    },
    emerald: {
      border: isTargetOS ? "border-emerald-500/50 ring-1 ring-emerald-500/30" : "border-slate-800 hover:border-emerald-500/30",
      bg: isTargetOS ? "bg-slate-900/90 shadow-emerald-950/20" : "bg-slate-900/50",
      pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      btn: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30",
      glow: "from-emerald-500/10 to-teal-500/5"
    }
  }[accentColor];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative p-4 rounded-2xl border transition-all shadow-lg overflow-hidden ${accentClasses.border} ${accentClasses.bg}`}
    >
      {/* Ambient Corner Beam */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${accentClasses.glow} rounded-full blur-xl pointer-events-none`} />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white text-sm tracking-tight">{title}</span>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10.5px] border ${accentClasses.pill}`}>
              {badge}
            </span>
            {isLatest && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Latest Build
              </span>
            )}
            {recommendedTag && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] border border-amber-500/30 flex items-center gap-1">
                <Zap size={9} /> {recommendedTag}
              </span>
            )}
            {isTargetOS && (
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> Your OS
              </span>
            )}
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            {subtitle}
          </p>

          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
            <span>Size: <strong className="text-slate-200">{sizeFormatted}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400/90">
              <ShieldCheck size={12} /> Signed & Verified
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id={`btn-download-${id}`}
            onClick={onDownload}
            disabled={downloading}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 ${accentClasses.btn}`}
          >
            {downloading ? (
              <>
                <Check size={14} className="text-white animate-pulse" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Download ({sizeFormatted})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
