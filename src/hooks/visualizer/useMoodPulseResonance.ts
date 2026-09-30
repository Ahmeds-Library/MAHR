import { useEffect, useRef, useState } from "react";
import { HumanMoodType } from "@/services/humanEmotionEngine";
import { getMoodResonanceProfile, MoodResonanceProfile } from "@/services/ml/adaptiveMoodModel";
import { RLAtmospherePolicy } from "@/services/ml/rlMoodOptimizer";

interface UseMoodPulseResonanceProps {
  currentMood: HumanMoodType;
  characterState: "idle" | "thinking" | "talking";
  session?: any | null;
  rlPolicy?: RLAtmospherePolicy | null;
}

export function useMoodPulseResonance({
  currentMood,
  characterState,
  session,
  rlPolicy,
}: UseMoodPulseResonanceProps) {
  const [pulseScale, setPulseScale] = useState<number>(1.0);
  const [auraOpacity, setAuraOpacity] = useState<number>(0.2);
  const animFrameRef = useRef<number | null>(null);

  const profile: MoodResonanceProfile = getMoodResonanceProfile(currentMood);
  const isResponding = characterState === "talking" || characterState === "thinking";

  useEffect(() => {
    let startTime = performance.now();

    const freqHz = rlPolicy?.pulseFrequencyHz || profile.defaultFrequencyHz || 1.8;
    const maxAmplitude = (rlPolicy?.pulseScale ? rlPolicy.pulseScale - 1.0 : 0.05) || 0.05;
    const baseAura = rlPolicy?.hologramAuraIntensity || 0.65;

    const loop = (currentTime: number) => {
      const elapsedSeconds = (currentTime - startTime) / 1000;

      // Extract real-time audio energy if available
      let audioBoost = 0;
      if (session) {
        try {
          const analyser = session.outputAnalyser || (typeof session.getByteFrequencyData === "function" ? session : null);
          if (analyser && typeof analyser.getByteFrequencyData === "function") {
            const buffer = new Uint8Array(32);
            analyser.getByteFrequencyData(buffer);
            const sum = buffer.slice(0, 16).reduce((a, b) => a + b, 0);
            audioBoost = sum / (16 * 255);
          }
        } catch (e) {}
      }

      if (isResponding) {
        // Resonant sinusoidal pulse frequency mapped to mood & RL policy + audio modulation
        const wave = Math.sin(elapsedSeconds * Math.PI * 2 * freqHz);
        const dynamicAmp = maxAmplitude + audioBoost * 0.035;
        const currentScale = 1.0 + wave * dynamicAmp;
        const currentAura = Math.max(0.15, Math.min(0.95, baseAura * (0.6 + 0.4 * wave + audioBoost * 0.4)));

        setPulseScale(Number(currentScale.toFixed(4)));
        setAuraOpacity(Number(currentAura.toFixed(3)));
      } else {
        // Gentle resting breathing rhythm
        const breath = Math.sin(elapsedSeconds * Math.PI * 0.8);
        setPulseScale(Number((1.0 + breath * 0.008).toFixed(4)));
        setAuraOpacity(0.15);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentMood, characterState, session, rlPolicy, isResponding, profile.defaultFrequencyHz]);

  return {
    pulseScale,
    auraOpacity,
    isResponding,
    resonanceProfile: profile,
  };
}
