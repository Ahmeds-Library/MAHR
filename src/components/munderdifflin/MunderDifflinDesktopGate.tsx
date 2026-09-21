// 🏢 Layer 3: MunderDifflinDesktopGate Component
// Professional Native Installer Prompt for Office with Bytecode & Source Protection
import React, { useState } from "react";
import { 
  Building2, 
  Download, 
  Laptop, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Terminal,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDesktopApp } from "../../hooks/useDesktopApp";

interface MunderDifflinDesktopGateProps {
  onBypassToSimulation?: () => void;
  onClose: () => void;
}

export function MunderDifflinDesktopGate({
  onClose
}: MunderDifflinDesktopGateProps) {
  const { 
    installDesktopApp, 
    downloadWindowsExe, 
    downloadLinuxDeb 
  } = useDesktopApp();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    await installDesktopApp();
    setInstalling(false);
  };

  const handleDownloadWin = () => {
    downloadWindowsExe();
    setDownloadSuccess("Windows Setup Installer (MAHR-Setup-v2.4.0.exe) download shuru ho gaya hai!");
    setTimeout(() => setDownloadSuccess(null), 4500);
  };

  const handleDownloadLinux = () => {
    downloadLinuxDeb();
    setDownloadSuccess("Linux Debian Package (mahr-desktop_2.4.0_amd64.deb) download shuru ho gaya hai!");
    setTimeout(() => setDownloadSuccess(null), 4500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-950/95 border border-purple-500/40 shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center text-slate-100"
    >
      {/* Top Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Close"
      >
        <X size={18} />
      </button>

      {/* Office Icon with Soft Cybernetic Halo */}
      <div className="relative mb-3">
        <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.35)]">
          <Building2 size={32} />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-emerald-500/60 text-emerald-400">
          <Lock size={12} />
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-xl font-bold text-white tracking-wide">Office</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 font-mono font-bold">
          Native App Only
        </span>
      </div>

      {/* Clear Instruction */}
      <p className="text-sm text-slate-200 mb-2 leading-relaxed font-medium">
        Office access karne ke liye MAHR Desktop App install karein.
      </p>
      <p className="text-xs text-slate-400 mb-5 leading-relaxed max-w-sm">
        Please install the native desktop application to launch the multi-agent office floor and workspace.
      </p>

      {/* Download Alert Toast */}
      <AnimatePresence>
        {downloadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 text-left"
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span className="truncate">{downloadSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons: Native .EXE and .DEB Installers */}
      <div className="flex flex-col gap-3 w-full">
        {/* Windows and Linux Native Installers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          {/* Windows .EXE Installer */}
          <button
            onClick={handleDownloadWin}
            className="group relative p-3.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-purple-950/50 hover:to-slate-900 border border-slate-800 hover:border-purple-500/60 text-left transition-all duration-200 cursor-pointer shadow-lg hover:shadow-purple-900/20 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition-transform">
                <Monitor size={18} />
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                .EXE (64-bit)
              </span>
            </div>
            <div className="font-semibold text-xs text-white group-hover:text-purple-200 flex items-center gap-1.5">
              <span>Windows Installer</span>
              <Download size={13} className="text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              MAHR-Setup-v2.4.0.exe
            </div>
          </button>

          {/* Linux .DEB Package */}
          <button
            onClick={handleDownloadLinux}
            className="group relative p-3.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:from-purple-950/50 hover:to-slate-900 border border-slate-800 hover:border-purple-500/60 text-left transition-all duration-200 cursor-pointer shadow-lg hover:shadow-purple-900/20 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform">
                <Terminal size={18} />
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono font-bold">
                .DEB Package
              </span>
            </div>
            <div className="font-semibold text-xs text-white group-hover:text-purple-200 flex items-center gap-1.5">
              <span>Linux (Ubuntu/Debian)</span>
              <Download size={13} className="text-purple-400 group-hover:translate-y-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              mahr-desktop_2.4.0_amd64.deb
            </div>
          </button>
        </div>

        {/* 1-Click PWA App Install Alternative */}
        <button
          onClick={handleInstall}
          disabled={installing}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/40 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
        >
          <Laptop size={14} className="text-indigo-400" />
          <span>{installing ? "Installing Application..." : "1-Click Direct Browser App Install"}</span>
        </button>

        {/* Security & Intellectual Property Protection Notice */}
        <div className="mt-2 p-3 rounded-2xl bg-purple-950/20 border border-purple-500/25 flex items-start gap-2.5 text-left">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-slate-300">
            <span className="text-white font-semibold block mb-0.5">🔒 Bytecode Encrypted &amp; Source Protected:</span>
            Application compiled with V8 bytecode encryption and ASAR native encapsulation. Source code is securely locked and protected against extraction or decompilation.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
