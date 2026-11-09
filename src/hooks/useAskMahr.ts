import { useState, useCallback } from "react";
import { recordUserActivity } from "../services/proactiveReminderEngine";
import { SubAgent, DailyTask } from "../lib/subagentTypes";
import { Memory, ChatMessage } from "../lib/memoryTypes";
import { KnowledgeDeficit } from "../services/reinforcementLearningEngine";
import { speakUtterance } from "../services/speechSynthesisService";
import { ChatActionMode } from "../components/chat/types";
import {
  recallChatVectorContext,
  autoIndexChatTurnToVectorMemory,
} from "../components/chat/services/chatVectorMemoryBridge";
import {
  parseTypedInstruction,
  formatReplyForChalkboard,
} from "../components/chat/services/chatInstructionDispatcher";

export interface AskMahrMessage {
  id?: string;
  sender: "user" | "mahr" | "myraa";
  text: string;
  timestamp: string;
  attachedImages?: string[];
  actionExecuted?: string;
  groundingSources?: any[];
  searchQueries?: string[];
  mediaItems?: any[];
  memoryRecalledCount?: number;
  memoryRecalledLabels?: string[];
  memorySavedTitle?: string;
  codeSentToChalkboard?: boolean;
  modeUsed?: string;
}

export type AskMyraaMessage = AskMahrMessage;

interface UseAskMahrOptions {
  activeModelId: string;
  activeSubAgent: SubAgent;
  studyPadText: string;
  whiteboardText?: string;
  setWhiteboardText?: (txt: string) => void;
  memories?: Memory[];
  dailyTasks?: DailyTask[];
  knowledgeDeficits?: KnowledgeDeficit[];
  chatHistory?: ChatMessage[];
  onAddManualMemory?: (category: Memory["category"], text: string) => Promise<any>;
  setActiveModelId: (modelId: string) => void;
  setNotesStatusAlert: (alert: string | null) => void;
  getScreenSnapshot?: () => string | null;
  onExecuteAction?: (actionType: string, args?: any) => void;
  isScreenSharing?: boolean;
  onAppendToChatHistory?: (
    role: "user" | "model",
    text: string,
    meta?: {
      attachedImages?: string[];
      actionExecuted?: string;
      groundingSources?: any[];
      searchQueries?: string[];
      mediaItems?: any[];
      isStreaming?: boolean;
      memoryRecalledCount?: number;
      memoryRecalledLabels?: string[];
      memorySavedTitle?: string;
      codeSentToChalkboard?: boolean;
      modeUsed?: string;
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
  setWhiteboardText,
  memories = [],
  dailyTasks = [],
  knowledgeDeficits = [],
  chatHistory = [],
  onAddManualMemory,
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
  const [activeActionMode, setActiveActionMode] = useState<ChatActionMode>("auto");
  const [isVectorRecalling, setIsVectorRecalling] = useState<boolean>(false);

  // Local messages list as fallback; primary transcript is synchronized with chatHistory
  const [askMahrMessages, setAskMahrMessages] = useState<AskMahrMessage[]>([]);

  const handleSendCodeToChalkboard = useCallback(
    (codeContent: string, language?: string) => {
      if (!codeContent || !codeContent.trim()) return;
      const formatted = `# 💻 MAHR Live Code Slate (${language || "Code"})\n\n\`\`\`${
        language || ""
      }\n${codeContent.trim()}\n\`\`\`\n`;
      if (setWhiteboardText) {
        setWhiteboardText(formatted);
      }
      if (onExecuteAction) {
        onExecuteAction("open_chalkboard", { mode: "split" });
      }
      setNotesStatusAlert("✨ Sent code block to Classroom Chalkboard!");
      setTimeout(() => setNotesStatusAlert(null), 3000);
    },
    [setWhiteboardText, onExecuteAction, setNotesStatusAlert]
  );

  const handleAskMahrSubmit = useCallback(
    async (e?: any, customText?: string, overrideImages?: string[], overrideMode?: ChatActionMode) => {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      recordUserActivity();
      const query = customText !== undefined ? customText : askMahrInput;
      const imagesToSend = overrideImages || [...pendingImages];
      const modeToUse = overrideMode || activeActionMode;

      if ((!query || !query.trim()) && imagesToSend.length === 0 && !isScreenSharing) return;

      const rawUserMsg = query
        ? query.trim()
        : imagesToSend.length > 0
        ? "Please analyze this image."
        : "Please analyze my active screen.";

      if (customText === undefined) setAskMahrInput("");
      setPendingImages([]);

      // Capture screen snapshot if screen sharing is active and snapshot enabled
      let screenFrame: string | null = null;
      if (isScreenSharing && includeScreenSnapshot && getScreenSnapshot) {
        screenFrame = getScreenSnapshot();
      }

      // 1. Parse typed instructions, /slash commands, and Action Mode pills
      const parsedInstruction = parseTypedInstruction(rawUserMsg, modeToUse);

      // Reset non-auto mode back to auto after submitting a command if it came from a slash command
      if (rawUserMsg.startsWith("/") && activeActionMode !== "auto") {
        setActiveActionMode("auto");
      }

      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const displayUserText =
        rawUserMsg + (screenFrame ? " 📷 [Live Screen Snapshot]" : "");

      const userMessageObj: AskMahrMessage = {
        id: `msg_user_${Date.now()}`,
        sender: "user",
        text: displayUserText,
        timestamp: now,
        attachedImages: imagesToSend.length > 0 ? imagesToSend : undefined,
        modeUsed: parsedInstruction.effectiveMode !== "auto" ? parsedInstruction.effectiveMode : undefined,
      };

      setAskMahrMessages((prev) => [...prev, userMessageObj]);

      // Sync user message to shared chat journal / unified history
      if (onAppendToChatHistory) {
        onAppendToChatHistory("user", displayUserText, {
          attachedImages: imagesToSend.length > 0 ? imagesToSend : undefined,
          modeUsed: parsedInstruction.effectiveMode !== "auto" ? parsedInstruction.effectiveMode : undefined,
        });
      }

      // Also notify live realtime voice session if connected
      if (isRealtimeSessionActive && onSendToRealtimeSession) {
        onSendToRealtimeSession(rawUserMsg);
      }

      // 2. Execute any immediate client-side workspace actions parsed from the instruction
      const executedBadges: string[] = [];
      if (parsedInstruction.immediateActions.length > 0 && onExecuteAction) {
        for (const act of parsedInstruction.immediateActions) {
          onExecuteAction(act.type, act.args);
          executedBadges.push(act.badgeLabel);
        }
      }

      // 3. Background Auto-Index to 128-D Vector Memory if personal fact or /remember
      let savedMemoryLabel: string | undefined;
      try {
        const memResult = await autoIndexChatTurnToVectorMemory({
          userText: rawUserMsg,
          forceRemember: parsedInstruction.isExplicitMemorySave,
          existingMemories: memories,
          onAddManualMemory,
        });
        if (memResult.saved && memResult.summaryLabel) {
          savedMemoryLabel = memResult.summaryLabel;
        }
      } catch (memErr) {
        console.warn("[useAskMahr] Auto-index vector memory non-fatal error:", memErr);
      }

      // 4. Presentation / Slides Studio deep redirect
      if (parsedInstruction.isPresentationRequest && onExecuteAction) {
        const extractedTopic = parsedInstruction.presentationTopic || "Strategic Presentation";
        const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const understandingReply = `🎯 **Presentation Studio Triggered!**

I have analyzed your instruction and initialized the **Classroom Slides Studio**:
• **Subject:** *${extractedTopic}*
• **Pipeline:** Deep Domain Research + Verified Web Imagery + AI Diagrams + Keynote Speaker Notes.

Opening your presentation deck on the Classroom Whiteboard now...`;

        const actionLabel = `✨ Launched Slides Studio: ${extractedTopic.slice(0, 28)}`;

        setAskMahrMessages((prev) => [
          ...prev,
          {
            id: `msg_mahr_${Date.now()}`,
            sender: "mahr",
            text: understandingReply,
            timestamp: replyTime,
            actionExecuted: actionLabel,
            memorySavedTitle: savedMemoryLabel,
          },
        ]);

        if (onAppendToChatHistory) {
          onAppendToChatHistory("model", understandingReply, {
            actionExecuted: actionLabel,
            memorySavedTitle: savedMemoryLabel,
          });
        }

        if (isAutoSpeakEnabled) {
          speakUtterance({
            text: `Understood! I am researching ${extractedTopic} and building your presentation in Slides Studio now.`,
            activeEmotion: "happy",
          });
        }

        onExecuteAction("open_slides_studio", {
          topic: extractedTopic,
          userInstruction: rawUserMsg,
          deepResearch: true,
          sourceWebImages: true,
          generateMissingVisuals: true,
        });

        setAskMahrLoading(false);
        return;
      }

      setAskMahrLoading(true);
      setIsVectorRecalling(true);

      // 5. Query 128-D Vector Memory Bridge + Multi-turn Context + Subagent Brain
      try {
        const vectorRecall = await recallChatVectorContext({
          query: rawUserMsg,
          memories,
          studyPadText,
          whiteboardText,
          knowledgeDeficits,
          dailyTasks,
          recentHistory: chatHistory,
        });
        setIsVectorRecalling(false);

        const payloadBody = JSON.stringify({
          message: parsedInstruction.cleanedPrompt,
          modelId: activeModelId,
          subAgentName: activeSubAgent.name,
          subAgentRole: activeSubAgent.role,
          subAgentSystemPrompt: activeSubAgent.systemPrompt,
          userContext:
            vectorRecall.groundingBlock || "No active study notes or chalkboard.",
          screenImage: screenFrame,
          attachedImages: imagesToSend,
        });

        let res = await fetch("/api/chat/subagent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payloadBody,
        });

        if (!res.ok) {
          res = await fetch("/api/subagent/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payloadBody,
          });
        }

        const rawBody = await res.text();
        let data: any = {};
        try {
          data = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          data = { text: "I have processed your request in the workspace." };
        }

        if (!res.ok && !data.text) {
          throw new Error(data.error || `HTTP error ${res.status}`);
        }

        const replyText = data.text || "I have processed your request.";
        const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Handle seamless model fallback notification
        if (
          data.modelUsed &&
          data.modelUsed !== "offline-assistant" &&
          data.modelUsed !== activeModelId
        ) {
          setActiveModelId(data.modelUsed);
          setNotesStatusAlert(
            `⚡ Shifted model to ${data.modelUsed} seamlessly without memory loss.`
          );
          setTimeout(() => setNotesStatusAlert(null), 4000);
        }

        // Dispatch live token telemetry event
        if (typeof window !== "undefined" && (data.usage || data.sessionTokens)) {
          window.dispatchEvent(
            new CustomEvent("mahr-tokens-updated", {
              detail: {
                usage: data.usage,
                sessionTokens: data.sessionTokens,
              },
            })
          );
        }

        // Execute any server-returned tool actions
        if (Array.isArray(data.actions) && data.actions.length > 0) {
          for (const act of data.actions) {
            if (act && act.type && onExecuteAction) {
              onExecuteAction(act.type, act.args);
              executedBadges.push(act.type);
            }
          }
        }

        // Sync reply to Classroom Chalkboard if requested by mode or natural instruction
        let codeSentToChalkboard = false;
        if (parsedInstruction.shouldSyncReplyToChalkboard && setWhiteboardText) {
          const formattedBoard = formatReplyForChalkboard(rawUserMsg, replyText);
          if (formattedBoard) {
            setWhiteboardText(formattedBoard);
            codeSentToChalkboard = true;
            if (onExecuteAction && !executedBadges.some((b) => b.toLowerCase().includes("chalkboard"))) {
              onExecuteAction("open_chalkboard", { mode: "split" });
              executedBadges.push("Synced to Chalkboard");
            }
          }
        }

        const combinedActionBadge =
          executedBadges.length > 0 ? `✨ ${executedBadges.join(" • ")}` : undefined;

        const modelMessageObj: AskMahrMessage = {
          id: `msg_mahr_${Date.now()}`,
          sender: "mahr",
          text: replyText,
          timestamp: replyTime,
          actionExecuted: combinedActionBadge,
          groundingSources: data.groundingSources,
          searchQueries: data.searchQueries,
          mediaItems: data.mediaItems,
          memoryRecalledCount:
            vectorRecall.recalledCount > 0 ? vectorRecall.recalledCount : undefined,
          memoryRecalledLabels:
            vectorRecall.recalledLabels.length > 0
              ? vectorRecall.recalledLabels.slice(0, 4)
              : undefined,
          memorySavedTitle: savedMemoryLabel,
          codeSentToChalkboard,
          modeUsed:
            parsedInstruction.effectiveMode !== "auto"
              ? parsedInstruction.effectiveMode
              : undefined,
        };

        setAskMahrMessages((prev) => [...prev, modelMessageObj]);

        if (onAppendToChatHistory) {
          onAppendToChatHistory("model", replyText, {
            actionExecuted: combinedActionBadge,
            groundingSources: data.groundingSources,
            searchQueries: data.searchQueries,
            mediaItems: data.mediaItems,
            memoryRecalledCount:
              vectorRecall.recalledCount > 0 ? vectorRecall.recalledCount : undefined,
            memoryRecalledLabels:
              vectorRecall.recalledLabels.length > 0
                ? vectorRecall.recalledLabels.slice(0, 4)
                : undefined,
            memorySavedTitle: savedMemoryLabel,
            codeSentToChalkboard,
            modeUsed:
              parsedInstruction.effectiveMode !== "auto"
                ? parsedInstruction.effectiveMode
                : undefined,
          });
        }

        // Speak Mahr's reply aloud using voice synthesis if enabled
        if (isAutoSpeakEnabled) {
          speakUtterance({
            text: replyText,
            activeEmotion: "happy",
          });
        }
      } catch (err: any) {
        console.error("Ask Mahr error:", err);
        setIsVectorRecalling(false);
        const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setAskMahrMessages((prev) => [
          ...prev,
          {
            sender: "mahr",
            text: `⚠️ Error communicating with Mahr core: ${err.message || err}`,
            timestamp: replyTime,
          },
        ]);
      } finally {
        setAskMahrLoading(false);
        setIsVectorRecalling(false);
      }
    },
    [
      askMahrInput,
      pendingImages,
      activeActionMode,
      includeScreenSnapshot,
      isScreenSharing,
      getScreenSnapshot,
      activeModelId,
      activeSubAgent,
      studyPadText,
      whiteboardText,
      setWhiteboardText,
      memories,
      dailyTasks,
      knowledgeDeficits,
      chatHistory,
      onAddManualMemory,
      setActiveModelId,
      setNotesStatusAlert,
      onExecuteAction,
      onAppendToChatHistory,
      isAutoSpeakEnabled,
      isRealtimeSessionActive,
      onSendToRealtimeSession,
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
    activeActionMode,
    setActiveActionMode,
    isVectorRecalling,
    handleSendCodeToChalkboard,
    handleAskMahrSubmit,
    handleAskMyraaSubmit: handleAskMahrSubmit,
    resetAskMahrMessages,
    resetAskMyraaMessages: resetAskMahrMessages,
  };
}

export const useAskMyraa = useAskMahr;
