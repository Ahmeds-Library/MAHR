import { useState, useCallback } from "react";
import { recordUserActivity } from "../services/proactiveReminderEngine";
import { SubAgent } from "../lib/subagentTypes";
import { speakUtterance } from "../services/speechSynthesisService";

export interface AskMahrMessage {
  sender: "user" | "mahr" | "myraa";
  text: string;
  timestamp: string;
  attachedImages?: string[];
  actionExecuted?: string;
}

export type AskMyraaMessage = AskMahrMessage;

interface UseAskMahrOptions {
  activeModelId: string;
  activeSubAgent: SubAgent;
  studyPadText: string;
  whiteboardText?: string;
  setActiveModelId: (modelId: string) => void;
  setNotesStatusAlert: (alert: string | null) => void;
  getScreenSnapshot?: () => string | null;
  onExecuteAction?: (actionType: string, args?: any) => void;
  isScreenSharing?: boolean;
  onAppendToChatHistory?: (role: "user" | "model", text: string) => void;
  onSendToRealtimeSession?: (text: string) => void;
}

export type UseAskMyraaOptions = UseAskMahrOptions;

export function useAskMahr({
  activeModelId,
  activeSubAgent,
  studyPadText,
  whiteboardText = "",
  setActiveModelId,
  setNotesStatusAlert,
  getScreenSnapshot,
  onExecuteAction,
  isScreenSharing = false,
  onAppendToChatHistory,
}: UseAskMahrOptions) {
  const [isAskMahrOpen, setIsAskMahrOpen] = useState<boolean>(false);
  const [askMahrInput, setAskMahrInput] = useState<string>("");
  const [askMahrLoading, setAskMahrLoading] = useState<boolean>(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [includeScreenSnapshot, setIncludeScreenSnapshot] = useState<boolean>(true);
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState<boolean>(true);

  const [askMahrMessages, setAskMahrMessages] = useState<AskMahrMessage[]>([
    {
      sender: "mahr",
      text: "Hello! I am Mahr. Type any command, ask a question, or analyze your live screen here. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleAskMahrSubmit = useCallback(
    async (e?: any, customText?: string, overrideImages?: string[]) => {
      if (e) e.preventDefault();
      recordUserActivity();
      const query = customText || askMahrInput;
      const imagesToSend = overrideImages || [...pendingImages];

      if ((!query || !query.trim()) && imagesToSend.length === 0 && !isScreenSharing) return;

      const userMsg = query ? query.trim() : (imagesToSend.length > 0 ? "Please analyze this image." : "Please analyze my active screen.");
      if (!customText) setAskMahrInput("");
      setPendingImages([]);

      // Capture screen snapshot if screen sharing is active and snapshot enabled
      let screenFrame: string | null = null;
      if (isScreenSharing && includeScreenSnapshot && getScreenSnapshot) {
        screenFrame = getScreenSnapshot();
      }

      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setAskMahrMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: userMsg + (screenFrame ? " 📷 [Live Screen Snapshot Attached]" : ""),
          timestamp: now,
          attachedImages: imagesToSend
        }
      ]);
      
      // Sync user message to shared chat journal history
      if (onAppendToChatHistory) {
        onAppendToChatHistory("user", userMsg);
      }

      setAskMahrLoading(true);

      try {
        const fullContext = [
          studyPadText ? `[Study Pad Notes]\n${studyPadText}` : "",
          whiteboardText ? `[Classroom Chalkboard]\n${whiteboardText}` : ""
        ].filter(Boolean).join("\n\n");

        const res = await fetch("/api/chat/subagent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMsg,
            modelId: activeModelId,
            subAgentName: activeSubAgent.name,
            subAgentRole: activeSubAgent.role,
            subAgentSystemPrompt: activeSubAgent.systemPrompt,
            userContext: fullContext || "No active study notes or chalkboard.",
            screenImage: screenFrame,
            attachedImages: imagesToSend
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const data = await res.json();
        const replyText = data.text || "I have processed your request.";
        const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Handle model shift notification
        if (data.modelUsed && data.modelUsed !== "offline-assistant" && data.modelUsed !== activeModelId) {
          setActiveModelId(data.modelUsed);
          setNotesStatusAlert(`⚡ Shifted model to ${data.modelUsed} seamlessly without memory loss.`);
          setTimeout(() => setNotesStatusAlert(null), 4000);
        }

        // Live Real Token Usage Event Dispatch
        if (typeof window !== "undefined" && (data.usage || data.sessionTokens)) {
          window.dispatchEvent(
            new CustomEvent("mahr-tokens-updated", {
              detail: {
                usage: data.usage,
                sessionTokens: data.sessionTokens
              }
            })
          );
        }

        // Execute returned tool actions
        let executedActionName = "";
        if (Array.isArray(data.actions) && data.actions.length > 0) {
          for (const act of data.actions) {
            if (act && act.type && onExecuteAction) {
              onExecuteAction(act.type, act.args);
              executedActionName = act.type;
            }
          }
        }

        setAskMahrMessages((prev) => [
          ...prev,
          {
            sender: "mahr",
            text: replyText,
            timestamp: replyTime,
            actionExecuted: executedActionName ? `✨ Executed: ${executedActionName}` : undefined
          }
        ]);

        if (onAppendToChatHistory) {
          onAppendToChatHistory("model", replyText);
        }

        // Instantly speak Mahr's reply aloud using high-speed voice synthesis
        if (isAutoSpeakEnabled) {
          speakUtterance({
            text: replyText,
            activeEmotion: "happy",
          });
        }
      } catch (err: any) {
        console.error("Ask Mahr error:", err);
        const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setAskMahrMessages((prev) => [
          ...prev,
          { sender: "mahr", text: `⚠️ Error communicating with Mahr core: ${err.message || err}`, timestamp: replyTime },
        ]);
      } finally {
        setAskMahrLoading(false);
      }
    },
    [
      askMahrInput,
      askMahrLoading,
      pendingImages,
      includeScreenSnapshot,
      isScreenSharing,
      getScreenSnapshot,
      activeModelId,
      activeSubAgent,
      studyPadText,
      whiteboardText,
      setActiveModelId,
      setNotesStatusAlert,
      onExecuteAction,
      onAppendToChatHistory,
      isAutoSpeakEnabled
    ]
  );

  const resetAskMahrMessages = useCallback((agent?: SubAgent) => {
    const targetAgent = agent || activeSubAgent;
    setAskMahrMessages([
      {
        sender: "mahr",
        text: `Hello! I am ${targetAgent.name} (${targetAgent.role}). ${targetAgent.systemPrompt ? "System prompt and domain knowledge loaded." : ""} How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [activeSubAgent]);

  return {
    isAskMahrOpen,
    setIsAskMahrOpen,
    isAskMyraaOpen: isAskMahrOpen,
    setIsAskMyraaOpen: setIsAskMahrOpen,
    askMahrInput,
    setAskMahrInput,
    askMyraaInput: askMahrInput,
    setAskMyraaInput: setAskMahrInput,
    askMahrLoading,
    askMyraaLoading: askMahrLoading,
    askMahrMessages,
    askMyraaMessages: askMahrMessages,
    pendingImages,
    setPendingImages,
    includeScreenSnapshot,
    setIncludeScreenSnapshot,
    isAutoSpeakEnabled,
    setIsAutoSpeakEnabled,
    handleAskMahrSubmit,
    handleAskMyraaSubmit: handleAskMahrSubmit,
    resetAskMahrMessages,
    resetAskMyraaMessages: resetAskMahrMessages,
  };
}

export const useAskMyraa = useAskMahr;


