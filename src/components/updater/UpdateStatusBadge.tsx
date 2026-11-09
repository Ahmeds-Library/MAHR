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
  currentVersion?: string;
  latestVersion?: string;
  hasUpdate: boolean;
  lastCheckedAt?: string | null;
  alwaysVisible?: boolean;
  onClick: () => void;
  className?: string;
}

export const UpdateStatusBadge: React.FC<UpdateStatusBadgeProps> = ({
  status,
  currentVersion = "2.4.1",
  latestVersion,
  hasUpdate,
  lastCheckedAt,
  alwaysVisible = true,
  onClick,
  className = ""
}) => {
  // If not alwaysVisible and no update pending, hide
  if (!alwaysVisible && !hasUpdate && status !== "ready-to-install" && status !== "checking") {
    return null;
  }

  const isChecking = status === "checking";
  const isReady = status === "ready-to-install";

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[10px] font-mono font-medium transition-all cursor-pointer ${
        hasUpdate || isReady
          ? "bg-gradient-to-r from-purple-500/25 via-indigo-500/25 to-cyan-500/25 hover:from-purple-500/35 hover:to-cyan-500/35 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-purple-200"
          : isChecking
          ? "bg-blue-950/40 border-blue-500/40 text-blue-200"
          : "bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-emerald-500/40 text-slate-300"
      } ${className}`}
      title={
        hasUpdate
          ? `New update v${latestVersion} ready to install`
          : `Auto-Updater active. Last checked: ${lastCheckedAt || "recently"}. Click to check now.`
      }
    >
      {hasUpdate || isReady ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
        </span>
      ) : isChecking ? (
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-spin" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      )}

      {isReady ? (
        <>
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span className="font-bold">Install v{latestVersion}</span>
        </>
      ) : hasUpdate ? (
        <>
          <Sparkles size={11} className="text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
          <span className="font-bold">Update v{latestVersion}</span>
        </>
      ) : isChecking ? (
        <span>Checking updates...</span>
      ) : (
        <>
          <span className="font-bold text-slate-200">v{currentVersion}</span>
          <span className="text-[9px] text-emerald-400 hidden sm:inline">• Auto-Sync</span>
        </>
      )}
    </motion.button>
  );
};
