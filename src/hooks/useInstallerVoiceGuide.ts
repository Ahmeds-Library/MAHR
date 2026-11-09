// 🎙️ Layer 2: useInstallerVoiceGuide Hook
// MAHR voice guidance companion for installer downloads, upgrades, and platform setup.

import { useState, useCallback } from "react";
import { speakUtterance } from "../services/speechSynthesisService";

export interface InstallerVoiceGuideState {
  isSpeaking: boolean;
  lastMessage: string | null;
  companionStatus: "ready" | "preparing" | "downloading" | "completed" | "error";
}

export function useInstallerVoiceGuide() {
  const [guideState, setGuideState] = useState<InstallerVoiceGuideState>({
    isSpeaking: false,
    lastMessage: null,
    companionStatus: "ready"
  });

  const announce = useCallback((text: string, status: InstallerVoiceGuideState["companionStatus"] = "preparing") => {
    setGuideState({
      isSpeaking: true,
      lastMessage: text,
      companionStatus: status
    });

    try {
      speakUtterance({
        text,
        onEnd: () => {
          setGuideState(prev => ({ ...prev, isSpeaking: false }));
        }
      });
    } catch {
      setGuideState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const announceDownloadStart = useCallback((platform: "windows" | "linux", version: string, isPortable: boolean = false) => {
    const platformLabel = platform === "windows" ? "Windows" : "Linux";
    const typeLabel = isPortable ? "Portable Setup" : "Full Standalone Installer";
    const phrase = `Aap ke liye MAHR ka latest version ${version} ${platformLabel} ${typeLabel} download ho raha hai. Please wait karein.`;
    announce(phrase, "downloading");
  }, [announce]);

  const announceDownloadComplete = useCallback((platform: "windows" | "linux", filename: string) => {
    const platformLabel = platform === "windows" ? "Windows" : "Linux";
    const phrase = `Download mukammal ho gaya hai! Setup file ${filename} aap ke Downloads folder mein save ho chuki hai. Isay run kar ke MAHR shuru karein.`;
    announce(phrase, "completed");
  }, [announce]);

  const announceError = useCallback((errText: string) => {
    const phrase = `Download mein masla aya hai: ${errText}. Please check network connection aur direct mirror link use karein.`;
    announce(phrase, "error");
  }, [announce]);

  return {
    guideState,
    announce,
    announceDownloadStart,
    announceDownloadComplete,
    announceError
  };
}
