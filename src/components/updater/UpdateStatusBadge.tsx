/**
 * Layer 1: UpdateStatusBadge (Presentation & GUI)
 * Subtle, pulsing glassmorphic status badge that displays in the header/desktop bar
 * when an update is available or while checking.
 */

import React from "react";
import { Sparkles, DownloadCloud, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { UpdateStatus } from "../../services/updater/versionTypes";

interface UpdateStatusBadgeProps {
  status: UpdateStatus;
  latestVersion?: string;
  hasUpdate: boolean;
  onClick: () => void;
  className?: string;
}

export const UpdateStatusBadge: React.FC<UpdateStatusBadgeProps> = ({
  status,
  latestVersion,
  hasUpdate,
  onClick,
  className = ""
}) => {
  if (!hasUpdate && status !== "ready-to-install") return null;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5 text-[10px] font-mono font-bold text-purple-200 transition-all cursor-pointer ${className}`}
      title="Click to view update details"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
      </span>

      {status === "ready-to-install" ? (
        <>
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>Install v{latestVersion}</span>
        </>
      ) : (
        <>
          <Sparkles size={11} className="text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
          <span>Update v{latestVersion} Available</span>
        </>
      )}
    </motion.button>
  );
};
