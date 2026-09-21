// 🖥️ Layer 3: DesktopAndRemoteModal Component
// Minimalist, user-focused modal exclusively for platform-native binary downloads (exe/deb)
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Monitor, 
  Download, 
  Check, 
  CheckCircle2,
  Copy,
  Terminal,
  AlertCircle
} from 'lucide-react';
import { detectPlatform, PlatformInfo } from '../../services/platformAdapter';
import { useDesktopApp } from '../../hooks/useDesktopApp';

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
  const { downloadWindowsExe, downloadLinuxDeb } = useDesktopApp();
  const [platform, setPlatform] = useState<PlatformInfo>(() => detectPlatform());
  const [downloading, setDownloading] = useState<'windows' | 'linux' | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlatform(detectPlatform());
      setDownloading(null);
      setCopiedCommand(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async (type: 'windows' | 'linux') => {
    setDownloading(type);
    try {
      if (type === 'windows') {
        await downloadWindowsExe();
      } else {
        await downloadLinuxDeb();
      }
    } finally {
      setTimeout(() => {
        setDownloading(null);
      }, 2500);
    }
  };

  const copyInstallCommand = () => {
    const cmd = "cd ~/Downloads && sudo apt install -y ./mahr-desktop_2.4.0_amd64.deb && mahr";
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  const isWindows = platform.type === 'win32';
  const isLinux = platform.type === 'linux';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-inner">
              <Monitor size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Download MAHR Desktop Assistant
              </h2>
              <p className="text-[11px] text-slate-400">
                Official verified v2.4.0 desktop standalone release
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Binary Downloads */}
        <div className="p-5 space-y-3.5">
          {/* Linux Binary Card */}
          <div 
            className={`p-4 rounded-xl border transition-all ${
              isLinux 
                ? 'bg-slate-900/80 border-purple-500/40 ring-1 ring-purple-500/20 shadow-lg shadow-purple-950/20' 
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Linux Debian</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10.5px] border border-purple-500/30">
                    .deb (Full Package with Character Cores)
                  </span>
                  {isLinux && (
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Your OS
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Ubuntu, Debian, Linux Mint, Pop!_OS — Complete offline engine & character models
                </p>
              </div>

              <button
                id="download-linux-binary-btn"
                onClick={() => handleDownload('linux')}
                disabled={downloading === 'linux'}
                className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-75 ${
                  isLinux
                    ? 'bg-purple-600 hover:bg-purple-500 active:scale-95 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {downloading === 'linux' ? (
                  <>
                    <Check size={14} className="text-emerald-400 animate-pulse" />
                    <span>Saving .deb...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download .deb</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Windows Binary Card */}
          <div 
            className={`p-4 rounded-xl border transition-all ${
              isWindows 
                ? 'bg-slate-900/80 border-cyan-500/40 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-950/20' 
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Windows Installer</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10.5px] border border-cyan-500/30">
                    .exe (1.8 MB)
                  </span>
                  {isWindows && (
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Your OS
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Windows 10 / 11 (Authenticode Signed Setup)
                </p>
              </div>

              <button
                id="download-windows-binary-btn"
                onClick={() => handleDownload('windows')}
                disabled={downloading === 'windows'}
                className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-75 ${
                  isWindows
                    ? 'bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {downloading === 'windows' ? (
                  <>
                    <Check size={14} className="text-white animate-pulse" />
                    <span>Saving 1.8 MB...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download .exe</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Install Instructions & Warning regarding wget */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 text-xs space-y-2.5">
            <div className="flex items-start gap-2 text-amber-300/90">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold text-amber-300">Important: </span>
                Click the <strong>&quot;Download .deb&quot;</strong> button above in your browser. Do not run <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-200 font-mono">wget</code> in terminal without cookies because Google AI Studio redirects CLI tools to an 11 KB cookie authentication page.
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11.5px] text-slate-300 font-medium mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Terminal size={13} className="text-purple-400" />
                  <span>Terminal Install (After clicking Download):</span>
                </span>
                <button
                  onClick={copyInstallCommand}
                  className="flex items-center gap-1 text-[10.5px] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20"
                >
                  {copiedCommand ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy command</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 select-all overflow-x-auto">
                sudo dpkg -i ~/Downloads/mahr-desktop_2.4.0_amd64.deb
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">
                Then open <strong>MAHR</strong> from your Ubuntu Applications menu or type <code className="text-purple-300 font-mono">mahr</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="px-5 py-3 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>MAHR Autonomous Engine v2.4.0 (Authentic ASAR + V8 Encrypted)</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
