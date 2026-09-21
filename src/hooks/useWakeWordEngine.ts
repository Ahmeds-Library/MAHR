import { useState, useRef, useEffect, useCallback } from "react";

export function useWakeWordEngine(
  isWakeWordEnabled: boolean,
  onWakeWordTriggered: (phrase: string) => void
) {
  const [wakeWordRipple, setWakeWordRipple] = useState<number>(0);
  const [sleepRipple, setSleepRipple] = useState<number>(0);
  const [voiceConfidence, setVoiceConfidence] = useState<number>(75);

  const wakeWordRecognitionRef = useRef<any>(null);
  const wakeWordRestartTimeoutRef = useRef<any>(null);
  const lastConfidenceUpdateRef = useRef<number>(0);
  const lastTriggerTimeRef = useRef<number>(0);
  const isComponentMountedRef = useRef<boolean>(true);

  const startEngine = useCallback(() => {
    if (!isWakeWordEnabled) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not available in this browser environment.");
      return;
    }

    if (wakeWordRecognitionRef.current) {
      try { wakeWordRecognitionRef.current.abort(); } catch (e) {}
      wakeWordRecognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      recognition.onresult = (event: any) => {
        // Cooldown guard to avoid rapid duplicate triggers
        if (Date.now() - lastTriggerTimeRef.current < 2500) {
          return;
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.toLowerCase().trim();
          const confidencePct = Math.round((result[0].confidence || 0.85) * 100);

          if (Date.now() - lastConfidenceUpdateRef.current > 1000) {
            setVoiceConfidence(confidencePct);
            lastConfidenceUpdateRef.current = Date.now();
          }

          if (
            transcript.includes("hey mahr") ||
            transcript.includes("wake up mahr") ||
            transcript.includes("mahr wake up") ||
            transcript.includes("hello mahr") ||
            transcript.includes("listen mahr") ||
            transcript.includes("hey myraa") ||
            transcript.includes("wake up myraa") ||
            transcript.includes("myraa wake up") ||
            transcript.includes("hello myraa") ||
            transcript.includes("listen myraa") ||
            transcript.includes("wake up") ||
            transcript.includes("uth jao") ||
            transcript.includes("awaken")
          ) {
            console.log("[WakeWordEngine] Recognized wake word:", transcript);
            lastTriggerTimeRef.current = Date.now();
            setWakeWordRipple(Date.now());
            onWakeWordTriggered("wake");
            break;
          } else if (
            transcript.includes("go to sleep mahr") ||
            transcript.includes("mahr sleep") ||
            transcript.includes("stop listening mahr") ||
            transcript.includes("goodnight mahr") ||
            transcript.includes("go to sleep myraa") ||
            transcript.includes("myraa sleep") ||
            transcript.includes("stop listening myraa") ||
            transcript.includes("goodnight myraa") ||
            transcript.includes("so jao") ||
            transcript.includes("sleep now")
          ) {
            console.log("[WakeWordEngine] Recognized sleep word:", transcript);
            lastTriggerTimeRef.current = Date.now();
            setSleepRipple(Date.now());
            onWakeWordTriggered("sleep");
            break;
          }
        }
      };

      recognition.onerror = (err: any) => {
        if (err.error !== "no-speech" && err.error !== "aborted") {
          console.warn("[WakeWordEngine] Speech recognition error:", err.error);
        }
      };

      recognition.onend = () => {
        wakeWordRecognitionRef.current = null;
        if (isWakeWordEnabled && isComponentMountedRef.current) {
          if (wakeWordRestartTimeoutRef.current) clearTimeout(wakeWordRestartTimeoutRef.current);
          // Always create a fresh instance after 400ms delay
          wakeWordRestartTimeoutRef.current = setTimeout(() => {
            if (isComponentMountedRef.current) {
              startEngine();
            }
          }, 400);
        }
      };

      recognition.start();
      wakeWordRecognitionRef.current = recognition;
    } catch (e) {
      console.warn("Failed to initialize wake word recognition engine:", e);
    }
  }, [isWakeWordEnabled, onWakeWordTriggered]);

  useEffect(() => {
    isComponentMountedRef.current = true;
    if (isWakeWordEnabled) {
      startEngine();
    } else {
      if (wakeWordRecognitionRef.current) {
        try { wakeWordRecognitionRef.current.abort(); } catch (e) {}
        wakeWordRecognitionRef.current = null;
      }
    }

    return () => {
      isComponentMountedRef.current = false;
      if (wakeWordRestartTimeoutRef.current) {
        clearTimeout(wakeWordRestartTimeoutRef.current);
      }
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.abort();
        } catch (e) {}
        wakeWordRecognitionRef.current = null;
      }
    };
  }, [isWakeWordEnabled, startEngine]);

  return {
    wakeWordRipple,
    sleepRipple,
    voiceConfidence,
    setVoiceConfidence
  };
}

