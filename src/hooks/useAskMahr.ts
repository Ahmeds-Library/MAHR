import { useState, useCallback } from "react";
import { recordUserActivity } from "../services/proactiveReminderEngine";
import { SubAgent } from "../lib/subagentTypes";
import { speakUtterance } from "../services/speechSynthesisService";

export interface AskMahrMessage {
  id?: string;
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
  onAppendToChatHistory?: (
    role: "user" | "model",
    text: string,
    meta?: {
      actionExecuted?: string;
      groundingSources?: any[];
      searchQueries?: string[];
      mediaItems?: any[];
      isStreaming?: boolean;
    }
  ) => void;
  onSendToRealtimeSession?: (text: string) => void;
  isRealtimeSessionActive?: boolean;
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
  onSendToRealtimeSession,
  isRealtimeSessionActive = false,
}: UseAskMahrOptions) {
  const [isAskMahrOpen, setIsAskMahrOpen] = useState<boolean>(false);
  const [askMahrInput, setAskMahrInput] = useState<string>("");
  const [askMahrLoading, setAskMahrLoading] = useState<boolean>(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [includeScreenSnapshot, setIncludeScreenSnapshot] = useState<boolean>(true);
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState<boolean>(true);

  // We maintain a local messages list as fallback, but primary transcript is synchronized with chatHistory
  const [askMahrMessages, setAskMahrMessages] = useState<AskMahrMessage[]>([]);

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
      const userMessageObj: AskMahrMessage = {
        sender: "user",
        text: userMsg + (screenFrame ? " 📷 [Live Screen Snapshot Attached]" : ""),
        timestamp: now,
        attachedImages: imagesToSend
      };

      setAskMahrMessages((prev) => [...prev, userMessageObj]);

      // Sync user message to shared chat journal / unified history
      if (onAppendToChatHistory) {
        onAppendToChatHistory("user", userMsg);
      }

      // Check for explicit presentation / PPT / slides generation request to redirect with full understanding to Whiteboard Slides
      const pptPattern = /(?:make|create|generate|prepare|build|banao|bana do|banaye|chahiye)\s+(?:a\s+|an\s+)?(?:presentation|ppt|slides|deck|slide deck|google slides)(?:\s+(?:on|about|pe|par|for)\s+(.*))?/i;
      const reversePptPattern = /(?:presentation|ppt|slides|slide deck|google slides)\s+(?:banao|bana do|banaye|make|create|generate|chahiye)(?:\s+(?:on|about|pe|par|for)\s+(.*))?/i;
      const topicPptPattern = /(?:presentation|ppt|slides|google slides)\s+(?:on|about|pe|par|for)\s+(.*)/i;

      const pptMatch = userMsg.match(pptPattern) || userMsg.match(reversePptPattern) || userMsg.match(topicPptPattern);
      if (pptMatch && onExecuteAction) {
        let extractedTopic = (pptMatch[1] || "").trim().replace(/[?.!]+$/, "");
        if (!extractedTopic || extractedTopic.length < 2) {
          extractedTopic = userMsg
            .replace(/(?:make|create|generate|prepare|build|banao|bana do|banaye|chahiye|presentation|ppt|slides|slide deck|google slides|a|an|on|about|pe|par|for|please|plz|saath|internet|se|images|le|lo|kuch|khud|bana)/gi, "")
            .trim()
            .replace(/[?.!]+$/, "");
        }
        if (!extractedTopic) extractedTopic = "Strategic Presentation";
        console.log("[useAskMahr] Presentation intent detected with deep planning for topic:", extractedTopic);

        // MAHR thoroughly understands the user's request and plans the execution
        const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const understandingReply = `🎯 **Request Understood & Accepted!**

I have carefully analyzed your instruction:
• **Subject:** *${extractedTopic}*
• **Target Platform:** Google Slides & Interactive Classroom Whiteboard
• **Strategy:** 
  1. 🔍 **Deep Domain Research:** Synthesizing core technical concepts, problem statements, and measurable metrics.
  2. 🌐 **Internet Image Sourcing:** Fetching available verified imagery from the web.
  3. 🎨 **Visual Synthesis:** Autonomously generating custom architectural diagrams for missing concepts.
  4. 📊 **Keynote Assembly:** Assembling animated slides with speaker notes.

Launching your presentation in the Classroom Slides Studio now...`;

        setAskMahrMessages((prev) => [
          ...prev,
          {
            id: `msg_mahr_${Date.now()}`,
            sender: "mahr",
            text: understandingReply,
            timestamp: replyTime
          }
        ]);

        if (isAutoSpeakEnabled) {
          speakUtterance({
            text: `Understood! I am researching ${extractedTopic}, collecting internet images, generating custom visuals, and building your presentation in Google Slides studio now.`,
            activeEmotion: "happy"
          });
        }

        onExecuteAction("open_slides_studio", { 
          topic: extractedTopic, 
          userInstruction: userMsg,
          deepResearch: true,
          sourceWebImages: true,
          generateMissingVisuals: true
        });

        setAskMahrLoading(false);
        return;
      }

      setAskMahrLoading(true);

      // Direct query to MAHR subagent brain with complete context & memory
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
            actionExecuted: executedActionName ? `✨ Executed: ${executedActionName}` : undefined,
            groundingSources: data.groundingSources,
            searchQueries: data.searchQueries,
            mediaItems: data.mediaItems
          }
        ]);

        if (onAppendToChatHistory) {
          onAppendToChatHistory("model", replyText, {
            actionExecuted: executedActionName ? `✨ Executed: ${executedActionName}` : undefined,
            groundingSources: data.groundingSources,
            searchQueries: data.searchQueries,
            mediaItems: data.mediaItems
          });
        }

        // Speak Mahr's reply aloud using high-speed voice synthesis if enabled
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
      isAutoSpeakEnabled,
      isRealtimeSessionActive,
      onSendToRealtimeSession
    ]
  );

  const resetAskMahrMessages = useCallback((agent?: SubAgent) => {
    setAskMahrMessages([]);
  }, []);

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
    setAskMahrLoading,
    askMyraaLoading: askMahrLoading,
    setAskMyraaLoading: setAskMahrLoading,
    askMahrMessages,
    setAskMahrMessages,
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
