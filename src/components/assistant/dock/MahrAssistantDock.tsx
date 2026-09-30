import React, { useState } from "react";
import { getThemeConfig } from "@/services/themeService";
import { MahrDockWaveform } from "./MahrDockWaveform";
import { MahrDockOrb } from "./MahrDockOrb";
import { MahrDockQuickActions } from "./MahrDockQuickActions";

export interface MahrAssistantDockProps {
  session: any | null;
  state: "disconnected" | "connecting" | "listening" | "speaking";
  themeColor: string;
  voiceConfidence: number;
  isMuted: boolean;
  isFocusMode: boolean;
  activeSubAgentName?: string;
  isWakeWordEnabled?: boolean;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onToggleFocusMode: () => void;
  onToggleWakeWord?: () => void;
  onOpenWhiteboard?: () => void;
  onOpenStudyPad?: () => void;
  onOpenTasks?: () => void;
  onOpenRecalls?: () => void;
  onOpenOffice?: () => void;
  onOpenSlides?: () => void;
  onOpenRoutines?: () => void;
  onOpenAskMahr?: () => void;
}

export const MahrAssistantDock: React.FC<MahrAssistantDockProps> = ({
  session,
  state,
  themeColor,
  voiceConfidence,
  isMuted,
  isFocusMode,
  activeSubAgentName = "MAHR",
  isWakeWordEnabled = true,
  onToggleConnect,
  onToggleMute,
  onToggleWakeWord,
  onOpenWhiteboard,
  onOpenStudyPad,
  onOpenTasks,
  onOpenRecalls,
  onOpenOffice,
  onOpenSlides,
  onOpenRoutines,
  onOpenAskMahr,
}) => {
  const [localConfidence, setLocalConfidence] = useState<number>(voiceConfidence);
  const themeConfig = getThemeConfig(themeColor);

  if (isFocusMode) {
    return null;
  }

  const isConnected = state !== "disconnected";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  return (
    <footer className="relative z-30 w-full max-w-3xl mx-auto flex flex-col items-center gap-3 mt-auto pb-4 select-none px-2 sm:px-4">
      {/* Dynamic Waveform Visualizer */}
      <MahrDockWaveform
        session={session}
        state={state}
        themeColor={themeColor}
        themeConfig={themeConfig}
        onConfidenceChange={(score) => setLocalConfidence(score)}
      />

      {/* Central Interactive Voice Orb with Confidence Tracker */}
      <MahrDockOrb
        state={state}
        isMuted={isMuted}
        voiceConfidence={localConfidence}
        themeHex={themeConfig.hex}
        themeSecondaryHex={themeConfig.secondaryHex}
        onToggleConnect={onToggleConnect}
        onToggleMute={onToggleMute}
      />

      {/* Unified Assistant Status & Wake Word HUD */}
      <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono tracking-wide">
        <span
          className={`w-2 h-2 rounded-full ${
            isSpeaking
              ? "bg-purple-400 animate-ping"
              : isListening
              ? "bg-emerald-400 animate-pulse"
              : state === "connecting"
              ? "bg-amber-400 animate-bounce"
              : isWakeWordEnabled
              ? "bg-cyan-400"
              : "bg-slate-500"
          }`}
        />
        <span className="text-slate-300 font-semibold uppercase tracking-wider">
          {isSpeaking
            ? `${activeSubAgentName} Speaking...`
            : isListening
            ? `${activeSubAgentName} Listening (${localConfidence}%)`
            : state === "connecting"
            ? "Connecting Real-time Link..."
            : isWakeWordEnabled
            ? `Standby (Say "Hey ${activeSubAgentName}")`
            : "Offline (Click orb to connect)"}
        </span>
      </div>

      {/* Quick Action Dock Bar */}
      <MahrDockQuickActions
        isWakeWordEnabled={isWakeWordEnabled}
        onToggleWakeWord={onToggleWakeWord}
        onOpenWhiteboard={onOpenWhiteboard}
        onOpenStudyPad={onOpenStudyPad}
        onOpenTasks={onOpenTasks}
        onOpenRecalls={onOpenRecalls}
        onOpenOffice={onOpenOffice}
        onOpenSlides={onOpenSlides}
        onOpenRoutines={onOpenRoutines}
        onOpenAskMahr={onOpenAskMahr}
      />
    </footer>
  );
};
