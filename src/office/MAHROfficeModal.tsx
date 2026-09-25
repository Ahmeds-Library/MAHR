import React, { useState } from 'react';
import { MAHROfficeFloorView } from './MAHROfficeFloorView';
import { 
  Building2, 
  Download, 
  Laptop, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Terminal,
  Monitor,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDesktopApp } from '../hooks/useDesktopApp';

interface MAHROfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBrowser?: boolean;
  activeModelId?: string;
  onSelectModel?: (id: string) => void;
  totalTokensUsed?: number;
  totalMaxTokens?: number;
  onUpdateWhiteboardText?: (notes: string) => void;
  onUpdateStudyPadText?: (notes: string) => void;
  onNotifyUser?: (msg: string) => void;
}

export function MAHROfficeModal({
  isOpen,
  onClose,
  isBrowser = false,
  activeModelId,
  totalTokensUsed = 0,
  totalMaxTokens = 1000000,
  onUpdateWhiteboardText,
  onUpdateStudyPadText,
  onNotifyUser
}: MAHROfficeModalProps) {
  const [bypassToSimulation, setBypassToSimulation] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(isOpen);

  React.useEffect(() => {
    if (isOpen) {
      setHasEverOpened(true);
    }
  }, [isOpen]);

  const { 
    installDesktopApp, 
    downloadWindowsExe, 
    downloadLinuxDeb 
  } = useDesktopApp();

  // If user has not opened the office floor yet, do not mount to preserve resources
  if (!hasEverOpened && !isOpen) return null;

  // On website (browser), redirect user to desktop app with installer links and deep-link launcher
  if (isBrowser && !bypassToSimulation && isOpen) {
    const handleInstall = async () => {
      setInstalling(true);
      // Try launching protocol deep-link first
      try {
        window.location.href = "mahr://office";
      } catch {}

      const installed = await installDesktopApp();
      if (!installed) {
        // Fallback: Enable desktop shell mode directly
        try {
          localStorage.setItem('mahr_desktop_mode', 'true');
        } catch {}
        setBypassToSimulation(true);
      }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
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
            <h3 className="text-xl font-bold text-white tracking-wide">MAHR Office</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 font-mono font-bold">
              Native App Experience
            </span>
          </div>

          {/* Clear Instruction */}
          <p className="text-sm text-slate-200 mb-1 leading-relaxed font-medium">
            Virtual Office Floor access karne ke liye MAHR Desktop App use karein.
          </p>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed max-w-sm">
            High-performance PixiJS pixel-art engine, multi-agent terminal harness, and local worktrees are optimized for the Desktop App.
          </p>

          {/* Download Alert Toast */}
          <AnimatePresence>
            {downloadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="w-full mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 text-left"
              >
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span className="flex-1 font-mono">{downloadSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action 1: Install / Open Desktop App */}
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-600 text-white font-semibold text-sm shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer mb-3 disabled:opacity-50"
          >
            <Laptop size={18} />
            <span>{installing ? "Launching Desktop App..." : "Open / Install Desktop App"}</span>
          </button>

          {/* Action 2: Direct Installers */}
          <div className="grid grid-cols-2 gap-2 w-full mb-4">
            <button
              onClick={handleDownloadWin}
              className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download size={14} className="text-purple-400" />
              <span>Windows (.exe)</span>
            </button>
            <button
              onClick={handleDownloadLinux}
              className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download size={14} className="text-purple-400" />
              <span>Linux (.deb)</span>
            </button>
          </div>

          {/* Action 3: Interactive Floor Preview Bypass */}
          <div className="pt-3 border-t border-slate-800/80 w-full flex flex-col items-center">
            <button
              onClick={() => setBypassToSimulation(true)}
              className="text-xs text-purple-300 hover:text-purple-200 font-mono flex items-center gap-1.5 transition underline cursor-pointer"
            >
              <Play size={12} className="text-purple-400" />
              <span>Launch Interactive Office Floor Preview</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Native desktop app mode OR web preview mode with keep-alive persistence:
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        visibility: isOpen ? 'visible' : 'hidden',
      }}
      aria-hidden={!isOpen}
    >
      <MAHROfficeFloorView
        isOpen={isOpen}
        onClose={onClose}
        onNotifyUser={onNotifyUser}
        onUpdateWhiteboard={onUpdateWhiteboardText}
        onUpdateStudyPadText={onUpdateStudyPadText}
      />
    </div>
  );
}
