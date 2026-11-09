import { useState, useEffect, useRef } from "react";
import { MyraaAudioSession, LiveState } from "@/lib/audio";
import { MahrEmotion } from "@/components/MahrCoreVisualizer";
import { EyeExpression } from "./useMascotPlayEngine";

export interface MahrThemePalette {
  primary: string;
  secondary: string;
  glow: string;
  glowRgba: string;
  ringRgba: string;
}

export function getMahrThemePalette(themeColor: string = "celestial"): MahrThemePalette {
  switch (themeColor) {
    case "violet":
      return {
        primary: "#9333ea",
        secondary: "#c026d3",
        glow: "#a855f7",
        glowRgba: "rgba(168, 85, 247, 0.4)",
        ringRgba: "rgba(168, 85, 247, 0.7)",
      };
    case "crimson":
      return {
        primary: "#e11d48",
        secondary: "#ea580c",
        glow: "#f43f5e",
        glowRgba: "rgba(244, 63, 94, 0.4)",
        ringRgba: "rgba(244, 63, 94, 0.7)",
      };
    case "emerald":
      return {
        primary: "#059669",
        secondary: "#0d9488",
        glow: "#10b981",
        glowRgba: "rgba(16, 185, 129, 0.4)",
        ringRgba: "rgba(16, 185, 129, 0.7)",
      };
    case "celestial":
      return {
        primary: "#0284c7",
        secondary: "#0891b2",
        glow: "#0ea5e9",
        glowRgba: "rgba(14, 165, 233, 0.4)",
        ringRgba: "rgba(14, 165, 233, 0.7)",
      };
    case "gold":
      return {
        primary: "#ca8a04",
        secondary: "#d97706",
        glow: "#eab308",
        glowRgba: "rgba(234, 179, 8, 0.4)",
        ringRgba: "rgba(234, 179, 8, 0.7)",
      };
    case "rose":
      return {
        primary: "#db2777",
        secondary: "#dc2626",
        glow: "#ec4899",
        glowRgba: "rgba(236, 72, 153, 0.4)",
        ringRgba: "rgba(236, 72, 153, 0.7)",
      };
    case "charcoal":
      return {
        primary: "#475569",
        secondary: "#334155",
        glow: "#64748b",
        glowRgba: "rgba(100, 116, 139, 0.4)",
        ringRgba: "rgba(100, 116, 139, 0.7)",
      };
    default:
      return {
        primary: "#06b6d4",
        secondary: "#4f46e5",
        glow: "#22d3ee",
        glowRgba: "rgba(34, 211, 238, 0.4)",
        ringRgba: "rgba(34, 211, 238, 0.7)",
      };
  }
}

export interface UseMascotMahrSyncProps {
  activeEmotion?: MahrEmotion;
  characterState?: "idle" | "thinking" | "talking";
  isSpeaking?: boolean;
  isAiThinking?: boolean;
  audioSession?: MyraaAudioSession | null;
  liveState?: LiveState;
  themeColor?: string;
}

export function useMascotMahrSync({
  activeEmotion = "idle",
  characterState = "idle",
  isSpeaking = false,
  isAiThinking = false,
  audioSession = null,
  liveState = "disconnected",
  themeColor = "celestial",
}: UseMascotMahrSyncProps) {
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>([0.2, 0.3, 0.4, 0.3, 0.2]);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const isMahrSpeaking = isSpeaking || characterState === "talking" || liveState === "speaking";
  const isMahrThinking = isAiThinking || characterState === "thinking";

  // Map Mahr's active emotion and behavior states directly to mascot expression
  let syncedExpression: EyeExpression = "normal";

  if (isMahrSpeaking) {
    syncedExpression = "talking";
  } else if (isMahrThinking) {
    syncedExpression = "thinking";
  } else {
    switch (activeEmotion) {
      case "happy":
        syncedExpression = "happy";
        break;
      case "excited":
        syncedExpression = "excited";
        break;
      case "loving":
        syncedExpression = "loving";
        break;
      case "curious":
        syncedExpression = "curious";
        break;
      case "analytical":
        syncedExpression = "analytical";
        break;
      case "proud":
      case "playful":
        syncedExpression = "wink";
        break;
      case "gussa":
      case "naraz":
        syncedExpression = "angry";
        break;
      case "sad":
      case "confused":
        syncedExpression = "curious";
        break;
      case "surprised":
        syncedExpression = "excited";
        break;
      case "embarrassed":
        syncedExpression = "happy";
        break;
      case "therapist":
        syncedExpression = "loving";
        break;
      case "thinking":
        syncedExpression = "thinking";
        break;
      default:
        syncedExpression = "normal";
        break;
    }
  }

  // Active sync flag: true when Mahr is expressing something specific, speaking, or thinking
  const isMahrActive =
    isMahrSpeaking ||
    isMahrThinking ||
    (activeEmotion !== "idle" && activeEmotion !== undefined);

  // Real-time audio waveform sampling from session outputAnalyser
  useEffect(() => {
    let phase = 0;

    const sampleAudio = () => {
      if (isMahrSpeaking) {
        let realAnalyser: AnalyserNode | null = null;
        if (audioSession && typeof audioSession.getOutputAnalyser === "function") {
          realAnalyser = audioSession.getOutputAnalyser();
        }

        if (realAnalyser) {
          try {
            const buffer = new Uint8Array(realAnalyser.frequencyBinCount);
            realAnalyser.getByteFrequencyData(buffer);
            
            // Sample 5 distinct frequency bands
            const bandIndices = [4, 12, 24, 40, 60];
            const freqs = bandIndices.map((idx) => {
              const val = buffer[idx] || 0;
              return Math.min(1, Math.max(0.1, val / 255));
            });

            const sum = freqs.reduce((a, b) => a + b, 0);
            const avgVol = sum / freqs.length;

            setAudioFrequencies(freqs);
            setAudioVolume(avgVol);
          } catch {
            simulateWave();
          }
        } else {
          simulateWave();
        }
      } else {
        // Idle audio levels
        setAudioVolume(0);
        setAudioFrequencies([0.15, 0.2, 0.25, 0.2, 0.15]);
      }

      animFrameRef.current = requestAnimationFrame(sampleAudio);
    };

    const simulateWave = () => {
      phase += 0.22;
      const b0 = 0.3 + 0.5 * Math.abs(Math.sin(phase));
      const b1 = 0.4 + 0.6 * Math.abs(Math.sin(phase + 0.8));
      const b2 = 0.5 + 0.5 * Math.abs(Math.sin(phase + 1.6));
      const b3 = 0.4 + 0.6 * Math.abs(Math.sin(phase + 2.4));
      const b4 = 0.3 + 0.5 * Math.abs(Math.sin(phase + 3.2));
      setAudioFrequencies([b0, b1, b2, b3, b4]);
      setAudioVolume((b0 + b1 + b2 + b3 + b4) / 5);
    };

    animFrameRef.current = requestAnimationFrame(sampleAudio);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isMahrSpeaking, audioSession]);

  const palette = getMahrThemePalette(themeColor);

  return {
    syncedExpression,
    isMahrActive,
    isMahrSpeaking,
    isMahrThinking,
    activeEmotion,
    audioFrequencies,
    audioVolume,
    palette,
  };
}
