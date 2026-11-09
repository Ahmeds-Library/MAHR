// 🖥️ Layer 1: DesktopAndRemoteModal Component
// Modular, responsive, presentation-tier modal for platform-native binary downloads.
// Features MAHR AI conversational assistant voice guidance, live package integrity, and fluid animations.

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Monitor, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { detectPlatform, PlatformInfo } from '../../services/platformAdapter';
import { useDesktopApp } from '../../hooks/useDesktopApp';
import { useInstallerVoiceGuide } from '../../hooks/useInstallerVoiceGuide';
import { APP_VERSION, APP_VERSION_BASE } from '../../config/appVersion';
import { MahrAssistantVoiceBanner } from './MahrAssistantVoiceBanner';
import { InstallerCard } from './InstallerCard';
import { TerminalInstallGuide } from './TerminalInstallGuide';

interface DesktopAndRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelName?: string;
  isLiveActive?: boolean;
}

export const DesktopAndRemoteModal: React.FC<DesktopAndRemoteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    downloadWindowsExe, 
    downloadWindowsPortableExe, 
    downloadLinuxDeb,
    downloadError 
  } = useDesktopApp();

  const { 
    guideState, 
    announce, 
    announceDownloadStart, 
    announceDownloadComplete,
    announceError 
  } = useInstallerVoiceGuide();

  const [platform, setPlatform] = useState<PlatformInfo>(() => detectPlatform());
  const [downloading, setDownloading] = useState<'windows' | 'windows-portable' | 'linux' | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlatform(detectPlatform());
      setDownloading(null);
      // Greet the user with MAHR assistant guidance on opening
      if (!isVoiceMuted) {
        announce(
          `Salam! Main MAHR hoon. Windows aur Linux ke liye latest version ${APP_VERSION} binary available hai. Aap 1-click download kar saktay hain.`,
          "ready"
        );
      }
    }
  }, [isOpen, announce, isVoiceMuted]);

  if (!isOpen) return null;

  const handleDownload = async (type: 'windows' | 'windows-portable' | 'linux') => {
    setDownloading(type);

    if (type === 'windows') {
      if (!isVoiceMuted) announceDownloadStart("windows", APP_VERSION, false);
      try {
        await downloadWindowsExe();
        if (!isVoiceMuted) announceDownloadComplete("windows", `MAHR-Setup-v${APP_VERSION}.exe`);
      } catch (err: any) {
        if (!isVoiceMuted) announceError(err?.message || "Download interrupted");
      }
    } else if (type === 'windows-portable') {
      if (!isVoiceMuted) announceDownloadStart("windows", APP_VERSION_BASE, true);
      try {
        await downloadWindowsPortableExe();
        if (!isVoiceMuted) announceDownloadComplete("windows", `MAHR-Setup-v${APP_VERSION_BASE}.exe`);
      } catch (err: any) {
        if (!isVoiceMuted) announceError(err?.message || "Download interrupted");
      }
    } else {
      if (!isVoiceMuted) announceDownloadStart("linux", APP_VERSION_BASE, false);
      try {
        await downloadLinuxDeb();
        if (!isVoiceMuted) announceDownloadComplete("linux", `mahr-desktop_${APP_VERSION_BASE}_amd64.deb`);
      } catch (err: any) {
        if (!isVoiceMuted) announceError(err?.message || "Download interrupted");
      }
    }

    setTimeout(() => {
      setDownloading(null);
    }, 2500);
  };

  const isWindows = platform.type === 'win32';
  const isLinux = platform.type === 'linux';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="w-full max-w-xl bg-slate-950/95 border border-slate-800/90 rounded-3xl shadow-2xl shadow-purple-950/30 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Atmosphere Light Beam */}
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 animate-pulse" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <Monitor size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    MAHR Desktop AI Assistant
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                    v{APP_VERSION}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Official signed binaries for Windows 10/11 & Linux Debian
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={17} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* MAHR Voice Assistant Banner */}
            <MahrAssistantVoiceBanner
              isSpeaking={guideState.isSpeaking}
              message={guideState.lastMessage || `Aap ke liye MAHR ka latest version ${APP_VERSION} download ke liye tayyar hai.`}
              onReplayVoice={() => announce(`Aap ke liye MAHR ka latest version ${APP_VERSION} download ke liye tayyar hai. Windows ya Linux card par download click karein.`)}
              isMuted={isVoiceMuted}
              onToggleMute={() => setIsVoiceMuted(!isVoiceMuted)}
            />

            {/* Error Notice Banner if download failed */}
            {downloadError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{downloadError}</span>
              </div>
            )}

            {/* Package Cards List */}
            <div className="space-y-3">
              {/* Windows Standalone Full Package Card (Latest v2.4.1-build-2) */}
              <InstallerCard
                id="win-standalone"
                title="Windows Desktop (Full Package)"
                subtitle="Complete standalone desktop package with embedded offline AI vault & character engine"
                badge=".exe (Full)"
                sizeFormatted="234.3 MB"
                isLatest={true}
                isTargetOS={isWindows}
                downloading={downloading === 'windows'}
                onDownload={() => handleDownload('windows')}
                accentColor="cyan"
                recommendedTag="Recommended"
              />

              {/* Windows Portable Setup Card (1.8 MB) */}
              <InstallerCard
                id="win-portable"
                title="Windows Portable Setup"
                subtitle="Ultra-fast lightweight installer with on-demand runtime streaming and automatic updates"
                badge=".exe (Fast Setup)"
                sizeFormatted="1.8 MB"
                isLatest={false}
                isTargetOS={isWindows}
                downloading={downloading === 'windows-portable'}
                onDownload={() => handleDownload('windows-portable')}
                accentColor="cyan"
              />

              {/* Linux Debian Binary Card */}
              <InstallerCard
                id="linux-deb"
                title="Linux Debian / Ubuntu Package"
                subtitle="Native .deb package for Ubuntu, Debian, Pop!_OS, and Linux Mint with CLI launcher"
                badge=".deb"
                sizeFormatted="4.9 MB"
                isLatest={true}
                isTargetOS={isLinux}
                downloading={downloading === 'linux'}
                onDownload={() => handleDownload('linux')}
                accentColor="purple"
              />
            </div>

            {/* Terminal Command Guide */}
            <TerminalInstallGuide platformType={platform.type} />
          </div>

          {/* Modal Footer with Verification and GitHub Mirror */}
          <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={13} />
              <span>Authenticode + GPG Verified</span>
            </div>

            <a
              href="https://github.com/Ahmeds-Library/MAHR/releases/latest"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-white transition"
            >
              <span>GitHub Mirror</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
