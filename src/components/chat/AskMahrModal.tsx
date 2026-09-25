import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { QuickPromptChips } from "./QuickPromptChips";
import { ChatInputBar } from "./ChatInputBar";
import { ChatMessageItemData } from "./types";
import { speakUtterance } from "../../services/speechSynthesisService";

export interface AskMahrModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageItemData[];
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent, customText?: string) => void;
  isLoading: boolean;
  activeSubAgentName: string;
  activeModelId: string;
  themeColor?: string;
  isScreenSharing?: boolean;
  isRealtimeConnected?: boolean;
  includeScreenSnapshot?: boolean;
  onToggleScreenSnapshot?: (val: boolean) => void;
  isAutoSpeakEnabled?: boolean;
  onToggleAutoSpeak?: (val: boolean) => void;
  pendingImages?: string[];
  onAddPendingImage?: (base64: string) => void;
  onRemovePendingImage?: (index: number) => void;
}

export type AskMyraaModalProps = AskMahrModalProps;

const DEFAULT_QUICK_PROMPTS = [
  "📷 Analyze my active screen & code",
  "🖊️ Write the formula on chalkboard",
  "📋 Add daily task: Review physics",
  "❓ Feynman Active Recall Quiz",
  "💡 Explain key concept simply"
];

export const AskMahrModal: React.FC<AskMahrModalProps> = ({
  isOpen,
  onClose,
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  activeSubAgentName,
  activeModelId,
  themeColor = "#9D7AFF",
  isScreenSharing = false,
  isRealtimeConnected = false,
  includeScreenSnapshot = true,
  onToggleScreenSnapshot,
  isAutoSpeakEnabled = true,
  onToggleAutoSpeak,
  pendingImages = [],
  onAddPendingImage,
  onRemovePendingImage,
}) => {
  const handleReplayAudio = (text: string) => {
    speakUtterance({
      text,
      activeEmotion: "happy",
    });
  };

  const handleSelectQuickPrompt = (promptText: string) => {
    onSubmit(undefined, promptText);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 35, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-14 sm:bottom-16 left-2 right-2 sm:left-auto sm:right-6 md:right-8 z-[300] sm:w-[440px] md:w-[480px] h-[70vh] max-h-[500px] sm:h-[480px] bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans"
          style={{
            boxShadow: `0 25px 70px -15px rgba(0,0,0,0.85), 0 0 35px ${
              isRealtimeConnected ? "rgba(16,185,129,0.18)" : "rgba(157,122,255,0.18)"
            }`,
          }}
        >
          {/* Header */}
          <ChatHeader
            activeSubAgentName={activeSubAgentName}
            activeModelId={activeModelId}
            themeColor={themeColor}
            isScreenSharing={isScreenSharing}
            isRealtimeConnected={isRealtimeConnected}
            isAutoSpeakEnabled={isAutoSpeakEnabled}
            onToggleAutoSpeak={onToggleAutoSpeak}
            onClose={onClose}
          />

          {/* Message List */}
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            activeSubAgentName={activeSubAgentName}
            themeColor={themeColor}
            onReplayAudio={handleReplayAudio}
          />

          {/* Quick Prompt Chips */}
          <QuickPromptChips
            prompts={DEFAULT_QUICK_PROMPTS}
            onSelectPrompt={handleSelectQuickPrompt}
            disabled={isLoading}
          />

          {/* Clean Text Chat Input Bar */}
          <ChatInputBar
            input={input}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const AskMyraaModal = AskMahrModal;
