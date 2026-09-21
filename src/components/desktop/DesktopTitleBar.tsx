import React, { useEffect, useState } from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Globe, 
  Download, 
  Monitor, 
  ShieldCheck, 
  Radio, 
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { 
  detectPlatform, 
  PlatformInfo, 
  minimizeWindow, 
  maximizeOrRestoreWindow, 
  closeWindow,
  onInstallPromptChange,
  promptPWAInstall 
} from '../../services/platformAdapter';

interface DesktopTitleBarProps {
  onOpenRemoteModal: () => void;
  activeModelName?: string;
  isLiveActive?: boolean;
}

export const DesktopTitleBar: React.FC<DesktopTitleBarProps> = ({
  onOpenRemoteModal,
  activeModelName = 'Gemini 2.5 Flash',
  isLiveActive = false,
}) => {
  const [platform, setPlatform] = useState<PlatformInfo>(() => detectPlatform());
  const [canInstall, setCanInstall] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    const unsub = onInstallPromptChange((available) => {
      setCanInstall(available);
    });

    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      unsub();
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const handleInstallClick = async () => {
    const installed = await promptPWAInstall();
    if (!installed) {
      // If native browser prompt didn't trigger, open modal with instructions & packages
      onOpenRemoteModal();
    }
  };

  return (
    <div 
      id="mahr-desktop-titlebar"
      className="w-full h-8 bg-slate-950/90 border-b border-cyan-500/20 px-3 flex items-center justify-between text-xs select-none backdrop-blur-md z-40 transition-colors"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: App Identity & Platform Badge */}
      <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center gap-1.5 font-mono text-cyan-400 font-semibold tracking-wider text-[11px]">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
          <span>MAHR OS</span>
        </div>

        {/* Dynamic Platform Badge */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-[10px] font-mono text-slate-300">
          <Monitor className="w-3 h-3 text-cyan-400" />
          <span>
            {platform.isElectron ? `NATIVE DESKTOP (${platform.type.toUpperCase()})` :
             platform.isPWA ? `DESKTOP APP (${platform.displayName})` :
             `WEB CLOUD GATEWAY`}
          </span>
        </div>

        {/* Live Audio / AI Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/40 border border-slate-800 text-[10px] text-slate-400 font-mono">
          <Radio className={`w-2.5 h-2.5 ${isLiveActive ? 'text-emerald-400 animate-ping' : 'text-slate-500'}`} />
          <span>{isLiveActive ? 'AUDIO STREAMING' : 'READY'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">{activeModelName}</span>
        </div>
      </div>

      {/* Center: Global Hotkey Indicator & Connect Everywhere Badge */}
      <div className="hidden lg:flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={onOpenRemoteModal}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 transition-all text-[11px] hover:border-cyan-400"
          title="Connect to MAHR from anywhere on mobile or another computer"
        >
          <Globe className="w-3 h-3 text-cyan-400 animate-spin-slow" />
          <span>Connect From Anywhere (Web & Mobile)</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </button>

        <span className="text-[10px] font-mono text-slate-500 border border-slate-800/80 px-1.5 py-0.5 rounded">
          Summon: <kbd className="text-slate-300 font-semibold">Ctrl+Shift+M</kbd>
        </span>
      </div>

      {/* Right: Actions & Window Controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Quick Install Button for Web/PWA */}
        {(!platform.isElectron) && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-2 py-0.5 mr-1 rounded bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white text-[10px] font-medium shadow-sm transition-all"
            title="Install MAHR as a Native Desktop App on Windows or Linux"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Install Desktop App</span>
          </button>
        )}

        {/* Mobile / Remote Connect Modal Button */}
        <button
          onClick={onOpenRemoteModal}
          className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
          title="Remote Web Access & Cross-Platform Settings"
        >
          <Smartphone className="w-3.5 h-3.5" />
        </button>

        {/* Window Control Buttons (Minimize, Maximize/Restore, Close) */}
        <div className="flex items-center ml-1 border-l border-slate-800 pl-1">
          <button
            onClick={minimizeWindow}
            className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
            title="Minimize Window"
          >
            <Minus className="w-3 h-3" />
          </button>

          <button
            onClick={maximizeOrRestoreWindow}
            className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Window'}
          >
            <Square className="w-2.5 h-2.5" />
          </button>

          <button
            onClick={closeWindow}
            className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Close / Disconnect Session"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
