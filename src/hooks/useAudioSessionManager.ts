import { useState, useRef, useCallback } from "react";
import { MyraaAudioSession, LiveState, speakViaWebSocket } from "../lib/audio";
import { MyraaEmotion } from "../components/MyraaCoreVisualizer";

export function useAudioSessionManager(
  autoInterrupt: boolean,
  noiseGate: number,
  speechRate: number,
  speechPitch: number
) {
  const [state, setState] = useState<LiveState>("disconnected");
  const [modelCaption, setModelCaption] = useState<string>("");
  const [userCaption, setUserCaption] = useState<string>("");
  const [activeEmotion, setActiveEmotion] = useState<MyraaEmotion>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isMicDenied, setIsMicDenied] = useState<boolean>(false);

  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isScreenSharingPaused, setIsScreenSharingPaused] = useState<boolean>(false);

  const sessionRef = useRef<MyraaAudioSession | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Spoken audio notification synthesizer helper via WebSocket
  const speakNotification = useCallback(
    (msg: string | { ur: string; en: string }, overrideEmotion?: MyraaEmotion) => {
      const textToSpeak = typeof msg === "string" ? msg : msg.en;
      if (!textToSpeak) return;

      try {
        if (overrideEmotion) setActiveEmotion(overrideEmotion);
        setModelCaption(textToSpeak);

        if (sessionRef.current) {
          sessionRef.current.speakViaWebSocket(textToSpeak, overrideEmotion);
        } else {
          speakViaWebSocket(textToSpeak, {
            emotion: overrideEmotion,
            onStart: () => {
              if (overrideEmotion) setActiveEmotion(overrideEmotion);
              setModelCaption(textToSpeak);
            },
            onEnd: () => {
              setTimeout(() => {
                setModelCaption("");
                setActiveEmotion("idle");
              }, 1500);
            },
          });
        }
      } catch (err) {
        console.error("Failed to speak notification over WebSocket:", err);
      }
    },
    []
  );

  const stopScreenSharing = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    setIsScreenSharingPaused(false);
  }, []);

  const startScreenSharing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      setIsScreenSharingPaused(false);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };
    } catch (err) {
      console.warn("Screen sharing cancelled or unavailable:", err);
      stopScreenSharing();
    }
  }, [stopScreenSharing]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenSharing();
    } else {
      await startScreenSharing();
    }
  }, [isScreenSharing, startScreenSharing, stopScreenSharing]);

  return {
    state,
    setState,
    modelCaption,
    setModelCaption,
    userCaption,
    setUserCaption,
    activeEmotion,
    setActiveEmotion,
    errorText,
    setErrorText,
    isMicDenied,
    setIsMicDenied,
    isScreenSharing,
    isScreenSharingPaused,
    setIsScreenSharingPaused,
    sessionRef,
    speakNotification,
    startScreenSharing,
    stopScreenSharing,
    toggleScreenShare
  };
}
