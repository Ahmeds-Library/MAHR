import React, { useRef } from "react";
import { useMahrAudioVisualizer } from "@/hooks/useMahrAudioVisualizer";
import { ThemeColorConfig } from "@/services/themeService";

interface MahrDockWaveformProps {
  session: any | null;
  state: "disconnected" | "connecting" | "listening" | "speaking";
  themeColor: string;
  themeConfig: ThemeColorConfig;
  onConfidenceChange?: (score: number) => void;
}

export const MahrDockWaveform: React.FC<MahrDockWaveformProps> = ({
  session,
  state,
  themeColor,
  themeConfig,
  onConfidenceChange,
}) => {
  const visualizerRef = useRef<HTMLDivElement | null>(null);

  useMahrAudioVisualizer({
    session,
    state,
    themeColor,
    visualizerRef,
    setVoiceConfidence: (score) => {
      onConfidenceChange?.(score);
    },
  });

  const isAudioActive = state === "listening" || state === "speaking";

  return (
    <div
      ref={visualizerRef}
      className="flex items-center justify-center gap-1 sm:gap-1.5 h-8 w-48 sm:w-64 px-3 sm:px-4 py-1 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-inner"
      title={`Live Mahr Audio Waveform [${themeConfig.name}]`}
    >
      {Array.from({ length: 22 }).map((_, idx) => (
        <div
          key={idx}
          className={`w-1 rounded-full transition-all duration-75 ${themeConfig.barColor}`}
          style={{
            height: "4px",
            backgroundColor: themeConfig.barGlowInlineStyle.backgroundColor,
            boxShadow: isAudioActive ? themeConfig.barGlowInlineStyle.boxShadow : "none",
          }}
        />
      ))}
    </div>
  );
};
