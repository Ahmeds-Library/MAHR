import { useState, useEffect, useRef, useCallback } from "react";
import { speakUtterance, stopAllSpeech } from "../../services/speechSynthesisService";

interface UseMahrVoiceAssistantProps {
  onCommandReceived?: (commandText: string) => void;
  onWakeWordTriggered?: () => void;
}

export function useMahrVoiceAssistant({
  onCommandReceived,
  onWakeWordTriggered
}: UseMahrVoiceAssistantProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [voiceVolume, setVoiceVolume] = useState<number[]>(new Array(12).fill(10));
  const [isMahrSpeaking, setIsMahrSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        const clean = currentTranscript.trim();
        setTranscript(clean);

        // Check for Mahr wake-word
        if (clean.toLowerCase().includes("mahr") || clean.toLowerCase().includes("hey mahr")) {
          onWakeWordTriggered?.();
          // Extract command after wake word if present
          const command = clean.replace(/^(hey\s+)?mahr\s*(create|make|generate|build)?/i, "").trim();
          if (command.length > 5) {
            onCommandReceived?.(command);
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isWakeWordActive) {
          try {
            recognition.start();
          } catch {
            // Ignore already started errors
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Speech recognition initialization failed:", e);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isWakeWordActive, onWakeWordTriggered, onCommandReceived]);

  // Audio frequency simulation while listening or speaking
  useEffect(() => {
    let animId: number;
    const updateWave = () => {
      if (isListening || isMahrSpeaking) {
        setVoiceVolume((prev) =>
          prev.map(() => Math.floor(10 + Math.random() * (isMahrSpeaking ? 80 : 40)))
        );
      } else {
        setVoiceVolume(new Array(12).fill(8));
      }
      animId = requestAnimationFrame(updateWave);
    };

    animId = requestAnimationFrame(updateWave);
    return () => cancelAnimationFrame(animId);
  }, [isListening, isMahrSpeaking]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening]);

  const speakAsMahr = useCallback((text: string) => {
    setIsMahrSpeaking(true);
    speakUtterance({ text });
    // Rough estimate duration
    const words = text.split(" ").length;
    const estTime = Math.max(1500, (words / 3) * 1000);
    setTimeout(() => {
      setIsMahrSpeaking(false);
    }, estTime);
  }, []);

  const stopMahrVoice = useCallback(() => {
    stopAllSpeech();
    setIsMahrSpeaking(false);
  }, []);

  return {
    isListening,
    isWakeWordActive,
    transcript,
    voiceVolume,
    isMahrSpeaking,
    setIsWakeWordActive,
    toggleListening,
    speakAsMahr,
    stopMahrVoice
  };
}
