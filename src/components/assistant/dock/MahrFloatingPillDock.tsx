import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeColorConfig } from "@/services/themeService";
import { MahrDockWaveform } from "./MahrDockWaveform";
import { MahrDockOrb } from "./MahrDockOrb";
import { MahrDockQuickActions } from "./MahrDockQuickActions";
import { MahrDockStatusPill } from "./MahrDockStatusPill";

export interface MahrFloatingPillDockProps {
  session: any | null;
  state: "disconnected" | "connecting" | "listening" | "speaking";
  themeColor: string;
  themeConfig: ThemeColorConfig;
  voiceConfidence: number;
  isMuted: boolean;
  activeSubAgentName?: string;
  isWakeWordEnabled?: boolean;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onToggleWakeWord?: () => void;
  onOpenWhiteboard?: () => void;
  onOpenStudyPad?: () => void;
  onOpenTasks?: () => void;
  onOpenRecalls?: () => void;
  onOpenOffice?: () => void;
  onOpenSlides?: () => void;
  onOpenRoutines?: () => void;
  onOpenAskMahr?: () => void;
  onConfidenceChange: (score: number) => void;
}

/**
 * Presentation Layer:
 * MAHR AI Assistant Floating Bottom Pill Dock.
 * 
 * Provides an organic, unified floating dock with frosted glass aesthetics,
 * glowing voice interaction orb, audio waveform visualizer, and quick action launcher.
 */
export const MahrFloatingPillDock: React.FC<MahrFloatingPillDockProps> = ({
  session,
  state,
  themeColor,
  themeConfig,
  voiceConfidence,
  isMuted,
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
  onConfidenceChange,
}) => {
  const isAudioActive = state === "listening" || state === "speaking";

  return (
    <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none pointer-events-auto max-w-[96vw]">
      {/* 1. Dynamic Audio Waveform (Rises gracefully above the pill dock when voice is active) */}
      <AnimatePresence>
        {isAudioActive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-2"
          >
            <MahrDockWaveform
              session={session}
              state={state}
              themeColor={themeColor}
              themeConfig={themeConfig}
              onConfidenceChange={onConfidenceChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. The MAHR Floating Glass Pill Dock */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center gap-2 sm:gap-3.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-950/85 backdrop-blur-2xl border border-white/15 shadow-[0_12px_45px_rgba(0,0,0,0.85)] max-w-full"
      >
        {/* Quick Action Navigation Buttons */}
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

        {/* Central MAHR Glowing Voice Orb */}
        <div className="relative flex items-center justify-center px-1">
          <MahrDockOrb
            state={state}
            isMuted={isMuted}
            voiceConfidence={voiceConfidence}
            themeHex={themeConfig.hex}
            themeSecondaryHex={themeConfig.secondaryHex}
            onToggleConnect={onToggleConnect}
            onToggleMute={onToggleMute}
          />
        </div>

        {/* Real-time Telemetry & Status Pill */}
        <MahrDockStatusPill
          state={state}
          voiceConfidence={voiceConfidence}
          activeSubAgentName={activeSubAgentName}
          isWakeWordEnabled={isWakeWordEnabled}
          onToggleWakeWord={onToggleWakeWord}
        />
      </motion.div>
    </div>
  );
};

export default MahrFloatingPillDock;
