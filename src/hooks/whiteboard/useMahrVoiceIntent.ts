import { useState, useRef, useEffect, useCallback } from "react";
import { speakUtterance } from "../../services/speechSynthesisService";
import {
  parseWhiteboardVoiceCommand,
  WhiteboardVoiceAction
} from "../../services/whiteboard/whiteboardVoiceIntentEngine";

export interface UseMahrVoiceIntentProps {
  onExecuteAction: (action: WhiteboardVoiceAction) => void;
  isAutoSpeakEnabled?: boolean;
}

export function useMahrVoiceIntent({
  onExecuteAction,
  isAutoSpeakEnabled = true
}: UseMahrVoiceIntentProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("Tap mic or ask Mahr anything...");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const audioAnimationRef = useRef<number | null>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage("Listening... Speak to Mahr");
        startAudioWaveSimulation();
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn("[MahrVoiceIntent] Error:", event.error);
        setIsListening(false);
        stopAudioWaveSimulation();
        setStatusMessage("Could not hear clearly. Try again or type below.");
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioWaveSimulation();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopAudioWaveSimulation();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const startAudioWaveSimulation = () => {
    const updateLevel = () => {
      setAudioLevel(0.2 + Math.random() * 0.8);
      audioAnimationRef.current = requestAnimationFrame(updateLevel);
    };
    audioAnimationRef.current = requestAnimationFrame(updateLevel);
  };

  const stopAudioWaveSimulation = () => {
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
      audioAnimationRef.current = null;
    }
    setAudioLevel(0);
  };

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      setStatusMessage("Speech recognition not supported in this browser. Please type your command.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      stopAudioWaveSimulation();
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.abort();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 100);
      }
    }
  }, [isListening]);

  const executeCommand = useCallback(
    async (rawText: string) => {
      if (!rawText.trim()) return;

      setStatusMessage("Mahr is processing...");
      const action = parseWhiteboardVoiceCommand(rawText);

      onExecuteAction(action);
      setStatusMessage(action.spokenFeedback);

      if (isAutoSpeakEnabled && action.spokenFeedback) {
        setIsSpeaking(true);
        speakUtterance({
          text: action.spokenFeedback,
          onEnd: () => {
            setIsSpeaking(false);
            setStatusMessage("Tap mic or ask Mahr anything...");
          }
        });
      } else {
        setTimeout(() => {
          setStatusMessage("Tap mic or ask Mahr anything...");
        }, 3000);
      }
    },
    [onExecuteAction, isAutoSpeakEnabled]
  );

  return {
    isListening,
    transcript,
    setTranscript,
    statusMessage,
    isSpeaking,
    audioLevel,
    toggleListening,
    executeCommand
  };
}
