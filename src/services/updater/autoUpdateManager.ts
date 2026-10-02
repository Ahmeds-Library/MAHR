/**
 * Layer 3: Auto-Update Execution Manager
 * Orchestrates downloading of new update packages, streaming progress,
 * and dispatching installation triggers for Electron or Web environments.
 */

import { DownloadProgress } from "./versionTypes";

declare global {
  interface Window {
    electronAPI?: {
      checkForUpdates?: () => void;
      downloadUpdate?: () => void;
      quitAndInstall?: () => void;
      onUpdateProgress?: (cb: (progress: DownloadProgress) => void) => () => void;
      onUpdateDownloaded?: (cb: () => void) => () => void;
    };
  }
}

export interface StartUpdateOptions {
  downloadUrl: string;
  filename: string;
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Executes the download of an updated installer package with real/simulated progress
 */
export async function downloadAppUpdate({
  downloadUrl,
  filename,
  onProgress,
  onComplete,
  onError
}: StartUpdateOptions): Promise<void> {
  // If native Electron auto-updater bridge is active
  if (window.electronAPI && typeof window.electronAPI.downloadUpdate === "function") {
    try {
      window.electronAPI.downloadUpdate();
      return;
    } catch (e) {
      console.warn("[autoUpdateManager] Electron IPC download failed, falling back to HTTP stream:", e);
    }
  }

  // HTTP Stream / Blob Download with live progress
  try {
    const startTime = Date.now();
    let transferred = 0;
    const estimatedTotal = 75 * 1024 * 1024; // 75MB approximate desktop installer size

    // Animate smooth progress in background while fetching
    let progressTimer: NodeJS.Timeout | null = null;
    let simulatedPct = 0;

    progressTimer = setInterval(() => {
      simulatedPct = Math.min(simulatedPct + Math.random() * 8 + 3, 90);
      const elapsedSec = (Date.now() - startTime) / 1000;
      const speed = elapsedSec > 0 ? (transferred || (simulatedPct / 100) * estimatedTotal) / elapsedSec : 1024 * 1024;
      const remainingBytes = Math.max(0, estimatedTotal - (transferred || (simulatedPct / 100) * estimatedTotal));

      onProgress?.({
        percent: Math.round(simulatedPct),
        transferredBytes: Math.round((simulatedPct / 100) * estimatedTotal),
        totalBytes: estimatedTotal,
        speedBytesPerSec: Math.round(speed),
        etaSeconds: Math.max(1, Math.round(remainingBytes / (speed || 1)))
      });
    }, 250);

    const response = await fetch(downloadUrl, {
      method: "GET",
      cache: "no-store"
    });

    if (progressTimer) clearInterval(progressTimer);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const finalSize = blob.size || estimatedTotal;

    onProgress?.({
      percent: 100,
      transferredBytes: finalSize,
      totalBytes: finalSize,
      speedBytesPerSec: 0,
      etaSeconds: 0
    });

    // Create trigger link for user to save / execute
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);

    onComplete?.();
  } catch (err: any) {
    console.error("[autoUpdateManager] Download error:", err);
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Triggers native restart & install in Electron or alerts the user in Web
 */
export function applyAndRestartApp(): void {
  if (window.electronAPI && typeof window.electronAPI.quitAndInstall === "function") {
    window.electronAPI.quitAndInstall();
  } else {
    // Web reload
    window.location.reload();
  }
}
