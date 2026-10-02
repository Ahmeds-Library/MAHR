/**
 * Layer 2: useAppUpdater Hook (State & Orchestration)
 * Polls for updates, compares semantic versions, triggers Alexa-like voice announcements,
 * and coordinates background download & installation states.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  UpdateCheckResult, 
  UpdateStatus, 
  DownloadProgress 
} from "../../services/updater/versionTypes";
import { 
  checkForAppUpdates, 
  CURRENT_APP_VERSION 
} from "../../services/updater/githubReleaseService";
import { 
  downloadAppUpdate, 
  applyAndRestartApp 
} from "../../services/updater/autoUpdateManager";
import { speakUtterance } from "../../services/speechSynthesisService";

export interface UseAppUpdaterReturn {
  status: UpdateStatus;
  updateInfo: UpdateCheckResult | null;
  isModalOpen: boolean;
  downloadProgress: DownloadProgress | null;
  errorMessage: string | null;
  currentVersion: string;
  hasUpdate: boolean;
  checkNow: (isManual?: boolean) => Promise<void>;
  startDownload: () => Promise<void>;
  installAndRestart: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export function useAppUpdater(options?: {
  autoCheckIntervalMs?: number;
  enableVoiceNotification?: boolean;
}): UseAppUpdaterReturn {
  const {
    autoCheckIntervalMs = 20 * 60 * 1000, // 20 minutes default
    enableVoiceNotification = true
  } = options || {};

  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasAnnouncedRef = useRef<boolean>(false);

  const performCheck = useCallback(async (isManual: boolean = false) => {
    setStatus("checking");
    setErrorMessage(null);

    try {
      const result = await checkForAppUpdates(CURRENT_APP_VERSION);
      setUpdateInfo(result);

      if (result.hasUpdate) {
        setStatus("available");
        setIsModalOpen(true);

        // Alexa-style friendly voice announcement
        if (enableVoiceNotification && !hasAnnouncedRef.current) {
          hasAnnouncedRef.current = true;
          const phrase = `Aap ke liye MAHR ka naya version ${result.latestVersion} release ho chuka hai! Kiya main update download kar loon?`;
          speakUtterance({ text: phrase });
        }
      } else {
        setStatus("up-to-date");
        if (isManual) {
          speakUtterance({ text: `Aap ka MAHR system pehle se hi latest version ${CURRENT_APP_VERSION} par update hai.` });
        }
      }
    } catch (err: any) {
      console.warn("[useAppUpdater] Update check failed:", err);
      setStatus("error");
      setErrorMessage(err?.message || "Failed to check for updates");
    }
  }, [enableVoiceNotification]);

  // Initial check on mount after short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      performCheck(false);
    }, 2500);

    const interval = setInterval(() => {
      performCheck(false);
    }, autoCheckIntervalMs);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [performCheck, autoCheckIntervalMs]);

  // Start in-app download
  const startDownload = useCallback(async () => {
    if (!updateInfo || !updateInfo.downloadUrl) return;

    setStatus("downloading");
    setErrorMessage(null);

    const isWin = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("win");
    const filename = isWin 
      ? `MAHR-Setup-v${updateInfo.latestVersion}.exe` 
      : `mahr-desktop_${updateInfo.latestVersion}_amd64.deb`;

    speakUtterance({ text: `Naya update download ho raha hai. Please wait karein.` });

    await downloadAppUpdate({
      downloadUrl: updateInfo.downloadUrl,
      filename,
      onProgress: (p) => {
        setDownloadProgress(p);
      },
      onComplete: () => {
        setStatus("ready-to-install");
        speakUtterance({ text: `Update download mukammal ho gaya hai! Setup install karne ke liye ready hai.` });
      },
      onError: (err) => {
        setStatus("error");
        setErrorMessage(err.message);
        speakUtterance({ text: `Update download mein masla aya hai, please dubara try karein.` });
      }
    });
  }, [updateInfo]);

  const installAndRestart = useCallback(() => {
    applyAndRestartApp();
  }, []);

  return {
    status,
    updateInfo,
    isModalOpen,
    downloadProgress,
    errorMessage,
    currentVersion: CURRENT_APP_VERSION,
    hasUpdate: status === "available" || status === "downloading" || status === "ready-to-install",
    checkNow: () => performCheck(true),
    startDownload,
    installAndRestart,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false)
  };
}
