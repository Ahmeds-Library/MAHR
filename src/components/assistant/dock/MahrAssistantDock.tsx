import React, { useState } from "react";
import { getThemeConfig } from "@/services/themeService";
import { MahrFloatingPillDock } from "./MahrFloatingPillDock";

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

/**
 * MahrAssistantDock:
 * Orchestrates the MAHR AI companion floating bottom dock.
 * Disappears seamlessly in focus mode and maintains complete feature continuity.
 */
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

  return (
    <MahrFloatingPillDock
      session={session}
      state={state}
      themeColor={themeColor}
      themeConfig={themeConfig}
      voiceConfidence={localConfidence}
      isMuted={isMuted}
      activeSubAgentName={activeSubAgentName}
      isWakeWordEnabled={isWakeWordEnabled}
      onToggleConnect={onToggleConnect}
      onToggleMute={onToggleMute}
      onToggleWakeWord={onToggleWakeWord}
      onOpenWhiteboard={onOpenWhiteboard}
      onOpenStudyPad={onOpenStudyPad}
      onOpenTasks={onOpenTasks}
      onOpenRecalls={onOpenRecalls}
      onOpenOffice={onOpenOffice}
      onOpenSlides={onOpenSlides}
      onOpenRoutines={onOpenRoutines}
      onOpenAskMahr={onOpenAskMahr}
      onConfidenceChange={(score) => setLocalConfidence(score)}
    />
  );
};

export default MahrAssistantDock;
