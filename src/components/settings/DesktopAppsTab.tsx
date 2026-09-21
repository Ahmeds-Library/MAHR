// 💻 Layer 3: DesktopAppsTab Component
// Dedicated Settings section for Native Installers (Windows .exe, Linux .deb) and Mobile/Web Sync
// Focuses purely on user consumption without any exposed source code or developer commands

import React, { useState } from "react";
import { 
  Monitor, 
  Terminal, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Laptop, 
  Copy, 
  Check, 
  QrCode, 
  Share2, 
  Sparkles,
  Lock
} from "lucide-react";
import { useDesktopApp } from "../../hooks/useDesktopApp";

interface DesktopAppsTabProps {
  onStatusAlert?: (msg: string) => void;
}

export const DesktopAppsTab: React.FC<DesktopAppsTabProps> = ({ onStatusAlert }) => {
  const {
    isDesktopShell,
    osName,
    downloadWindowsExe,
    downloadLinuxDeb,
    installDesktopApp,
    canInstallDesktop
  } = useDesktopApp();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isInstallingPwa, setIsInstallingPwa] = useState(false);

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://mahr.ai";
  const linuxInstallCmd = `sudo dpkg -i mahr-desktop_2.4.0_amd64.deb`;
  const linuxCurlInstallCmd = `curl -fSL "${originUrl}/api/download/linux-deb" -o mahr-desktop_2.4.0_amd64.deb && sudo dpkg -i mahr-desktop_2.4.0_amd64.deb`;

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onStatusAlert?.("Copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleDownloadWin = async () => {
    await downloadWindowsExe();
    setDownloadSuccess("Windows Setup Installer (MAHR-Setup-v2.4.0.exe) download initiated!");
    onStatusAlert?.("Downloading Windows .exe installer...");
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleDownloadLinux = async () => {
    await downloadLinuxDeb();
    setDownloadSuccess("Linux Debian Package (mahr-desktop_2.4.0_amd64.deb) download initiated!");
    onStatusAlert?.("Downloading Linux .deb package...");
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleInstallPwa = async () => {
    setIsInstallingPwa(true);
    const ok = await installDesktopApp();
    setIsInstallingPwa(false);
    if (ok) {
      onStatusAlert?.("MAHR Desktop App installed successfully!");
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header Banner & Status */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Desktop &amp; Mobile Setup</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono font-bold">
              v2.4.0 Official
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Install MAHR as a native application on Windows or Linux for global hotkeys, background audio, and offline persistence.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-cyan-300 flex items-center gap-1.5">
            <Laptop size={13} />
            <span>Detected: {osName}</span>
          </span>
          {isDesktopShell && (
            <span className="text-[10px] px-2 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold font-mono">
              Running Desktop
            </span>
          )}
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* 2. Platform Installers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Windows Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                  <Monitor size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">MAHR for Windows</h4>
                  <p className="text-[11px] text-slate-400">64-bit Installer (.exe)</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                Windows 10 / 11
              </span>
            </div>

            <ul className="text-xs text-slate-300 space-y-1.5 mb-4 pl-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                <span>Global summon hotkey (<kbd className="font-mono text-cyan-200">Ctrl+Shift+M</kbd>)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                <span>Background tray minimized running</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                <span>Local memory &amp; low-latency voice pipeline</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadWin}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-cyan-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Download size={14} />
            <span>Download Windows Installer (.exe)</span>
          </button>
        </div>

        {/* Linux Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-400">
                  <Terminal size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">MAHR for Linux</h4>
                  <p className="text-[11px] text-slate-400">Debian Package (.deb)</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono font-bold">
                Ubuntu / Debian / Mint
              </span>
            </div>

            <ul className="text-xs text-slate-300 space-y-1.5 mb-3 pl-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-purple-400 shrink-0" />
                <span>Wayland &amp; X11 desktop integration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-purple-400 shrink-0" />
                <span>Global summon (<kbd className="font-mono text-purple-200">Super+Shift+M</kbd>)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-purple-400 shrink-0" />
                <span>Standard binary in <code className="font-mono text-purple-200">/usr/bin/mahr</code></span>
              </li>
            </ul>

            {/* Quick Terminal Install Command */}
            <div className="mb-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] flex items-center justify-between gap-2">
              <span className="text-cyan-300 truncate">{linuxInstallCmd}</span>
              <button
                onClick={() => handleCopy(linuxInstallCmd, "deb-cmd")}
                className="p-1 hover:text-white text-slate-400 shrink-0 cursor-pointer"
                title="Copy install command"
              >
                {copiedKey === "deb-cmd" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleDownloadLinux}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-purple-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Download size={14} />
            <span>Download Debian Package (.deb)</span>
          </button>
        </div>
      </div>

      {/* 3. Direct Linux 1-Liner Helper for Quick CLI Download & Install */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-200 flex items-center gap-2">
            <Terminal size={14} className="text-purple-400" />
            <span>Terminal Direct Download &amp; Install (Ubuntu / Debian):</span>
          </span>
          <button
            onClick={() => handleCopy(linuxCurlInstallCmd, "curl-cmd")}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition"
          >
            {copiedKey === "curl-cmd" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copiedKey === "curl-cmd" ? "Copied" : "Copy 1-Liner"}</span>
          </button>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-nowrap">
          {linuxCurlInstallCmd}
        </div>
      </div>

      {/* 4. Alternative: 1-Click Browser App & Mobile Connect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1-Click PWA */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-indigo-400">
                <Laptop size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">1-Click Browser App</h4>
                <p className="text-[11px] text-slate-400">Instant standalone window (No download needed)</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Runs as an independent desktop application directly through Chrome, Edge, or Brave without browser toolbars.
            </p>
          </div>

          <button
            onClick={handleInstallPwa}
            disabled={isInstallingPwa}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles size={13} className="text-indigo-400" />
            <span>{isInstallingPwa ? "Installing..." : "Install 1-Click Desktop App"}</span>
          </button>
        </div>

        {/* Mobile & Web Link */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                <Share2 size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Anywhere Web &amp; Mobile</h4>
                <p className="text-[11px] text-slate-400">Sync with phone, tablet or another machine</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Access your full MAHR workspace, whiteboard notes, and conversational AI session seamlessly from any mobile or desktop browser.
            </p>
          </div>

          <button
            onClick={() => handleCopy(originUrl, "web-url")}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copiedKey === "web-url" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedKey === "web-url" ? "Link Copied!" : "Copy Sync Link"}</span>
          </button>
        </div>
      </div>

      {/* 5. Security & Intellectual Property Guarantee */}
      <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/25 flex items-start gap-3">
        <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-300">
          <span className="text-white font-semibold block mb-0.5">🔒 Protected Native Distribution</span>
          All installers are compiled with native V8 bytecode packaging and ASAR encryption. Source code is completely encapsulated and protected against unauthorized extraction or reverse engineering.
        </div>
      </div>
    </div>
  );
};
