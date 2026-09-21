// 💻 Layer 2: useDesktopApp Hook
// Detects if MAHR is running inside a Native Desktop Shell (Electron / PWA Standalone)
// vs a standard Web Browser, enabling platform-specific optimizations, local execution,
// and secure binary installer delivery without source code exposure.

import { useState, useEffect, useCallback } from "react";
import { 
  detectPlatform, 
  PlatformInfo, 
  onInstallPromptChange, 
  promptPWAInstall 
} from "../services/platformAdapter";

export interface DesktopOptimizations {
  enableHardwareAcceleration: boolean;
  highRefreshRate: boolean;
  hasNativeFileAccess: boolean;
  supportsLocalTerminalHarness: boolean;
  supportsGitWorktrees: boolean;
  supportsBackgroundSync: boolean;
  lowLatencyAudio: boolean;
}

export interface MahrDesktopAppInfo {
  appName: string;
  version: string;
  author: string;
  windowsExePath: string;
  linuxDebPath: string;
  windowsLauncherPath: string;
  linuxLauncherPath: string;
  windowsCommand: string;
  linuxCommand: string;
  bytecodeProtected: boolean;
}

export interface UseDesktopAppReturn {
  isDesktopShell: boolean;
  isElectron: boolean;
  isPWA: boolean;
  isBrowser: boolean;
  platform: "win32" | "linux" | "darwin" | "android" | "ios" | "web";
  osName: string;
  canInstallDesktop: boolean;
  installDesktopApp: () => Promise<boolean>;
  downloadWindowsExe: () => Promise<void>;
  downloadLinuxDeb: () => Promise<void>;
  downloadWindowsLauncher: () => Promise<void>;
  downloadLinuxLauncher: () => Promise<void>;
  optimizations: DesktopOptimizations;
  mahrDesktopInfo: MahrDesktopAppInfo;
}

export function useDesktopApp(): UseDesktopAppReturn {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => detectPlatform());
  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    setPlatformInfo(detectPlatform());

    const unsub = onInstallPromptChange((available) => {
      setCanInstall(available);
    });

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      setPlatformInfo(detectPlatform());
    };
    mediaQuery.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      unsub();
      mediaQuery.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  const installDesktopApp = useCallback(async (): Promise<boolean> => {
    const success = await promptPWAInstall();
    if (success) {
      setPlatformInfo(detectPlatform());
    }
    return success;
  }, []);

  // Secure Binary Fetch & Download Helper
  // Fetches real binary buffer via JSON payload / Blob to guarantee it is NEVER intercepted by HTML/SPA cookie gate
  const downloadBinary = async (endpoint: string, filename: string) => {
    // 1. Try secure JSON payload endpoint first (immune to browser cookie drops / iframe sandbox download intercepts)
    try {
      const payloadEndpoint = `${endpoint}-payload`;
      const res = await fetch(payloadEndpoint, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.base64 && json.size > 100000) {
          const binaryString = atob(json.base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: json.mimeType || "application/octet-stream" });
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = json.filename || filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
          return;
        }
      }
    } catch (e) {
      console.warn("Payload download fallback to direct stream:", e);
    }

    // 2. Direct binary fetch stream fallback
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { "Accept": "application/octet-stream, application/vnd.debian.binary-package, application/vnd.microsoft.portable-executable" },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of installer binary.");
      }

      const blob = await response.blob();
      if (blob.size < 50000) {
        throw new Error("Downloaded file is smaller than expected installer.");
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    } catch (err: any) {
      console.error("Binary download failed:", err);
      alert(`Download could not complete: ${err?.message || "Please check network connection"}`);
    }
  };

  const downloadWindowsExe = useCallback(async () => {
    await downloadBinary("/api/download/windows-exe", "MAHR-Setup-v2.4.0.exe");
  }, []);

  const downloadLinuxDeb = useCallback(async () => {
    await downloadBinary("/api/download/linux-deb", "mahr-desktop_2.4.0_amd64.deb");
  }, []);

  const downloadWindowsLauncher = useCallback(async () => {
    await downloadWindowsExe();
  }, [downloadWindowsExe]);

  const downloadLinuxLauncher = useCallback(async () => {
    await downloadLinuxDeb();
  }, [downloadLinuxDeb]);

  const mahrDesktopInfo: MahrDesktopAppInfo = {
    appName: "MAHR Desktop AI Assistant",
    version: "2.4.0",
    author: "MAHR Cognitive Systems",
    windowsExePath: "/api/download/windows-exe",
    linuxDebPath: "/api/download/linux-deb",
    windowsLauncherPath: "/api/download/windows-exe",
    linuxLauncherPath: "/api/download/linux-deb",
    windowsCommand: "MAHR-Setup-v2.4.0.exe",
    linuxCommand: "sudo dpkg -i mahr-desktop_2.4.0_amd64.deb",
    bytecodeProtected: true
  };

  const isDesktopShell = platformInfo.isElectron || platformInfo.isPWA;
  const isBrowser = !isDesktopShell;

  const optimizations: DesktopOptimizations = {
    enableHardwareAcceleration: isDesktopShell,
    highRefreshRate: isDesktopShell,
    hasNativeFileAccess: platformInfo.isElectron,
    supportsLocalTerminalHarness: platformInfo.isElectron,
    supportsGitWorktrees: platformInfo.isElectron,
    supportsBackgroundSync: true,
    lowLatencyAudio: isDesktopShell
  };

  return {
    isDesktopShell,
    isElectron: platformInfo.isElectron,
    isPWA: platformInfo.isPWA,
    isBrowser,
    platform: platformInfo.type,
    osName: platformInfo.displayName,
    canInstallDesktop: canInstall && isBrowser,
    installDesktopApp,
    downloadWindowsExe,
    downloadLinuxDeb,
    downloadWindowsLauncher,
    downloadLinuxLauncher,
    optimizations,
    mahrDesktopInfo
  };
}
