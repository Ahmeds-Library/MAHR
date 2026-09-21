import React, { useEffect, useRef } from "react";
import { getVisualizerBarStyle } from "../services/themeService";

interface UseMahrAudioVisualizerParams {
  session: any | null;
  state: "disconnected" | "connecting" | "listening" | "speaking";
  themeColor: string;
  visualizerRef: React.RefObject<HTMLDivElement | null>;
  setVoiceConfidence: (confidence: number) => void;
}

export type UseMyraaAudioVisualizerParams = UseMahrAudioVisualizerParams;

export function useMahrAudioVisualizer({
  session,
  state,
  themeColor,
  visualizerRef,
  setVoiceConfidence
}: UseMahrAudioVisualizerParams) {
  const lastConfidenceUpdateRef = useRef<number>(0);

  useEffect(() => {
    let animationId: number;

    const updateVisualizer = () => {
      if (!visualizerRef.current) return;
      const bars = visualizerRef.current.children;
      if (!bars || bars.length === 0) return;

      const barStyleConfig = getVisualizerBarStyle(themeColor, state);

      const currentAnalyser = state === "speaking" 
        ? (session?.outputAnalyser || (typeof session?.getByteFrequencyData === "function" ? session : null))
        : (state === "listening" ? (session?.inputAnalyser || (typeof session?.getByteFrequencyData === "function" ? session : null)) : null);

      if (currentAnalyser && typeof currentAnalyser.getByteFrequencyData === "function" && (state === "listening" || state === "speaking")) {
        const bufferLength = currentAnalyser.frequencyBinCount || 64;
        const dataArray = new Uint8Array(bufferLength);
        currentAnalyser.getByteFrequencyData(dataArray);

        // Calculate real-time confidence score if dataArray is present
        if (bufferLength > 0) {
          let sum = 0;
          let voiceBinsCount = 0;
          const voiceBinLimit = Math.floor(bufferLength * 0.4);

          for (let i = 0; i < voiceBinLimit; i++) {
            sum += dataArray[i];
            if (dataArray[i] > 15) voiceBinsCount++;
          }

          const voiceAverage = voiceBinLimit > 0 ? sum / voiceBinLimit : 0;
          let score = 0;

          if (state === "speaking") {
            score = 80 + Math.floor((voiceAverage / 255) * 20);
          } else {
            if (voiceAverage < 8) {
              score = 15;
            } else if (voiceAverage > 35) {
              score = Math.min(100, Math.floor(60 + (voiceAverage / 200) * 40));
            } else {
              score = 30 + Math.floor((voiceAverage / 40) * 25);
            }
          }

          score = Math.max(15, Math.min(100, score));

          const now = Date.now();
          if (now - lastConfidenceUpdateRef.current > 120) {
            setVoiceConfidence(score);
            lastConfidenceUpdateRef.current = now;
          }
        }

        // Map frequency bins to the rendered visualizer bars
        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i] as HTMLDivElement;
          const index = Math.floor((i / bars.length) * (bufferLength * 0.4));
          const val = dataArray[index] || 0;

          const factor = val / 255;
          const calculatedHeight = Math.max(3, factor * 28 + Math.sin(Date.now() * 0.015 + i) * 1.5);

          bar.style.height = `${calculatedHeight}px`;
          bar.className = barStyleConfig.className;
          bar.style.backgroundColor = barStyleConfig.style.backgroundColor;
          bar.style.boxShadow = barStyleConfig.style.boxShadow;
        }
      } else {
        // Ambient / Fallback visualizer animation
        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i] as HTMLDivElement;
          let heightFactor = 0.15;

          if (state === "connecting") {
            heightFactor = 0.2 + Math.sin(Date.now() * 0.025 + i * 0.5) * 0.2;
          } else {
            heightFactor = 0.1 + Math.sin(Date.now() * 0.005 + i * 0.3) * 0.03;
          }

          const calculatedHeight = Math.max(3, 28 * heightFactor);
          bar.style.height = `${calculatedHeight}px`;
          bar.className = barStyleConfig.className;
          bar.style.backgroundColor = barStyleConfig.style.backgroundColor;
          bar.style.boxShadow = barStyleConfig.style.boxShadow;
        }
      }

      animationId = requestAnimationFrame(updateVisualizer);
    };

    animationId = requestAnimationFrame(updateVisualizer);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [session, state, themeColor, visualizerRef, setVoiceConfidence]);
}

export const useMyraaAudioVisualizer = useMahrAudioVisualizer;

