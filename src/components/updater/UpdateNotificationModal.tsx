/**
 * Layer 1: UpdateNotificationModal (Presentation & GUI)
 * Premium holographic modal notifying the user of continuous GitHub Actions releases.
 * Features GSAP/Motion smooth animations, version badges, changelog, and live progress bar.
 */

import React from "react";
import { 
  Sparkles, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  ExternalLink,
  RefreshCw,
  Zap,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UpdateCheckResult, UpdateStatus, DownloadProgress } from "../../services/updater/versionTypes";

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: UpdateStatus;
  updateInfo: UpdateCheckResult | null;
  downloadProgress: DownloadProgress | null;
  errorMessage: string | null;
  onStartDownload: () => void;
  onInstallAndRestart: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  isOpen,
  onClose,
  status,
  updateInfo,
  downloadProgress,
  errorMessage,
  onStartDownload,
  onInstallAndRestart
}) => {
  if (!isOpen || !updateInfo) return null;

  const isDownloading = status === "downloading";
  const isReady = status === "ready-to-install";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-950/95 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.25)] backdrop-blur-2xl overflow-hidden flex flex-col text-slate-100"
        >
          {/* Top Decorative Atmosphere Beam */}
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-cyan-400 to-indigo-500 animate-pulse" />

          {/* Modal Header */}
          <div className="p-6 pb-4 flex items-start justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/50 flex items-center justify-center text-white shadow-lg shadow-purple-950/50">
                <Sparkles size={20} className="animate-spin" style={{ animationDuration: "8s" }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide font-mono">
                    NEW UPDATE AVAILABLE
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-semibold border border-purple-500/40">
                    GitHub Actions CI/CD
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  An automated build was compiled and released to GitHub.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close update dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Version Diffing Stage Banner */}
          <div className="px-6 py-3 bg-purple-950/30 border-b border-purple-500/20 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Current:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-300">
                v{updateInfo.currentVersion}
              </span>
            </div>

            <ArrowRight size={14} className="text-purple-400" />

            <div className="flex items-center gap-2">
              <span className="text-purple-300 font-semibold">Latest:</span>
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-600/40 to-cyan-600/40 border border-purple-400/60 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                v{updateInfo.latestVersion}
              </span>
            </div>
          </div>

          {/* Release Notes / Changelog List */}
          <div className="p-6 space-y-4 max-h-60 overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5 mb-2">
                <Zap size={13} className="text-amber-400" />
                <span>What&apos;s New in this Release:</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {updateInfo.releaseNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Error banner if download failed */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Live Download Progress Bar */}
            {isDownloading && downloadProgress && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span className="flex items-center gap-1">
                    <RefreshCw size={11} className="animate-spin text-cyan-400" />
                    <span>Downloading package...</span>
                  </span>
                  <span className="text-cyan-400 font-bold">{downloadProgress.percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${downloadProgress.percent}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{(downloadProgress.transferredBytes / (1024 * 1024)).toFixed(1)} MB transferred</span>
                  <span>{downloadProgress.etaSeconds > 0 ? `~${downloadProgress.etaSeconds}s remaining` : "Completing..."}</span>
                </div>
              </div>
            )}

            {/* Success state banner */}
            {isReady && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>Update package downloaded successfully! Ready to install.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-3 border-t border-white/10 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            {updateInfo.githubReleaseUrl ? (
              <a
                href={updateInfo.githubReleaseUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <ExternalLink size={12} />
                <span>View on GitHub</span>
              </a>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <ShieldCheck size={13} />
                <span>Verified Release</span>
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
              >
                Later
              </button>

              {isReady ? (
                <button
                  onClick={onInstallAndRestart}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Launch Installer</span>
                </button>
              ) : (
                <button
                  onClick={onStartDownload}
                  disabled={isDownloading}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold text-xs font-mono shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin text-cyan-200" />
                      <span>Downloading ({downloadProgress?.percent || 0}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} className="text-cyan-300" />
                      <span>Update Now (1-Click)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
