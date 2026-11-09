import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Plus, BarChart3, Wand2, Layers } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatActionModeBar } from "./ChatActionModeBar";
import { ChatInputBar } from "./ChatInputBar";
import { ChatMessageItemData, ChatActionMode } from "./types";
import { useChatCommandStudio } from "./hooks/useChatCommandStudio";
import { speakUtterance } from "../../services/speechSynthesisService";

export interface AskMahrModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageItemData[];
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (
    e?: React.FormEvent,
    customText?: string,
    overrideImages?: string[],
    overrideMode?: ChatActionMode
  ) => void;
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
  activeActionMode?: ChatActionMode;
  onActionModeChange?: (mode: ChatActionMode) => void;
  vectorMemoryCount?: number;
  isVectorRecalling?: boolean;
  onSendCodeToChalkboard?: (code: string, language?: string) => void;
  onClearChat?: () => void;
}

export type AskMyraaModalProps = AskMahrModalProps;

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
  activeActionMode: externalMode,
  onActionModeChange: onExternalModeChange,
  vectorMemoryCount = 0,
  isVectorRecalling = false,
  onSendCodeToChalkboard,
  onClearChat,
}) => {
  const [localMode, setLocalMode] = useState<ChatActionMode>("auto");
  const activeMode = externalMode !== undefined ? externalMode : localMode;
  const setActiveMode = onExternalModeChange || setLocalMode;

  const [isSlideStudioActive, setIsSlideStudioActive] = useState<boolean>(
    () => Boolean((window as any).__MAHR_SLIDES_STUDIO_ACTIVE__)
  );
  const [slideTopic, setSlideTopic] = useState<string>(
    () => (window as any).__MAHR_SLIDES_STUDIO_TOPIC__ || "Presentation Deck"
  );

  useEffect(() => {
    setIsSlideStudioActive(Boolean((window as any).__MAHR_SLIDES_STUDIO_ACTIVE__));
    if ((window as any).__MAHR_SLIDES_STUDIO_TOPIC__) {
      setSlideTopic((window as any).__MAHR_SLIDES_STUDIO_TOPIC__);
    }
    const handleSlideState = (e: Event) => {
      const custom = e as CustomEvent<{ active: boolean; topic?: string }>;
      if (custom.detail) {
        setIsSlideStudioActive(Boolean(custom.detail.active));
        if (custom.detail.topic) setSlideTopic(custom.detail.topic);
      }
    };
    window.addEventListener("mahr:slides-studio-state", handleSlideState);
    return () => window.removeEventListener("mahr:slides-studio-state", handleSlideState);
  }, [isOpen]);

  const dispatchSlideCommand = (
    type: "prompt" | "enhance" | "metrics" | "add_slide" | "open_builder",
    prompt?: string
  ) => {
    window.dispatchEvent(
      new CustomEvent("mahr:slides-mascot-command", {
        detail: { type, prompt }
      })
    );
  };

  const {
    isSlashMenuOpen,
    filteredSlashCommands,
    selectedSlashIndex,
    setSelectedSlashIndex,
    handleSelectSlashCommand,
    handleInputKeyDown,
  } = useChatCommandStudio({
    input,
    onInputChange,
    activeMode,
    onModeChange: setActiveMode,
  });

  const handleReplayAudio = (text: string) => {
    speakUtterance({
      text,
      activeEmotion: "happy",
    });
  };

  const handleSelectStarterCommand = (promptText: string, mode?: ChatActionMode) => {
    if (mode) setActiveMode(mode);
    if (isSlideStudioActive) {
      dispatchSlideCommand("prompt", promptText);
    }
    onSubmit(undefined, promptText, undefined, mode || activeMode);
  };

  const handleTriggerSlashMenu = () => {
    if (input.trim().startsWith("/")) {
      onInputChange("");
    } else {
      onInputChange("/");
    }
  };

  const handleMergedSubmit = (e?: React.FormEvent, customText?: string) => {
    const textToRun = (customText !== undefined ? customText : input).trim();
    if (isSlideStudioActive && textToRun) {
      dispatchSlideCommand("prompt", textToRun);
    }
    onSubmit(e, customText, undefined, activeMode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Dim Backdrop with Click-to-Dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-[2px] cursor-pointer"
            aria-hidden="true"
          />

          {/* Compact Side-Docked Holographic Command Dock Anchored Directly Above the Mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{
              type: "spring",
              damping: 26,
              stiffness: 340,
              mass: 0.7,
            }}
            className="fixed bottom-20 sm:bottom-22 md:bottom-24 right-3 sm:right-6 md:right-8 z-[210] origin-bottom-right w-[calc(100vw-1.5rem)] sm:w-[420px] md:w-[450px] h-[610px] max-h-[calc(100vh-7rem)] bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/35 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden font-sans select-none"
            style={{
              boxShadow: `0 20px 60px -10px rgba(0,0,0,0.95), 0 0 32px ${
                isRealtimeConnected
                  ? "rgba(16,185,129,0.22)"
                  : "rgba(34,211,238,0.22)"
              }`,
            }}
          >
            {/* Header with 128-D Vector Memory Telemetry */}
            <ChatHeader
              activeSubAgentName={activeSubAgentName}
              activeModelId={activeModelId}
              themeColor={themeColor}
              isScreenSharing={isScreenSharing}
              isRealtimeConnected={isRealtimeConnected}
              isAutoSpeakEnabled={isAutoSpeakEnabled}
              onToggleAutoSpeak={onToggleAutoSpeak}
              onClearChat={onClearChat}
              vectorMemoryCount={vectorMemoryCount}
              isVectorRecalling={isVectorRecalling}
              onClose={onClose}
            />

            {/* Merged Slide Studio Quick Controls inside Mascot when Slide Studio is active */}
            {isSlideStudioActive && (
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-cyan-950/80 border-b border-cyan-500/25 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      Slide Studio Mascot Assistant
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                    {slideTopic}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => dispatchSlideCommand("enhance")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/30 text-indigo-200 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-300" />
                    <span>Improve Slide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchSlideCommand("add_slide")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700/90 border border-white/10 text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-cyan-400" />
                    <span>Add Slide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchSlideCommand("metrics")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700/90 border border-white/10 text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <BarChart3 className="w-3 h-3 text-emerald-400" />
                    <span>Metrics</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dispatchSlideCommand("open_builder");
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/30 text-cyan-200 text-[11px] font-medium transition-colors cursor-pointer ml-auto"
                  >
                    <Layers className="w-3 h-3 text-cyan-300" />
                    <span>AI Builder</span>
                  </button>
                </div>
              </div>
            )}

            {/* Message List with Code-to-Chalkboard & Vector Badges */}
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              activeSubAgentName={activeSubAgentName}
              themeColor={themeColor}
              onReplayAudio={handleReplayAudio}
              onSendCodeToChalkboard={onSendCodeToChalkboard}
              onSelectStarterCommand={handleSelectStarterCommand}
            />

            {/* Action Mode Pills + Slash Command Palette */}
            <ChatActionModeBar
              activeMode={activeMode}
              onSelectMode={setActiveMode}
              isSlashMenuOpen={isSlashMenuOpen}
              filteredSlashCommands={filteredSlashCommands}
              selectedSlashIndex={selectedSlashIndex}
              onHoverSlashIndex={setSelectedSlashIndex}
              onSelectSlashCommand={handleSelectSlashCommand}
              onTriggerSlashMenu={handleTriggerSlashMenu}
              disabled={isLoading}
            />

            {/* Multi-Modal Typed Instruction Input Bar */}
            <ChatInputBar
              input={input}
              onInputChange={onInputChange}
              onSubmit={handleMergedSubmit}
              isLoading={isLoading}
              activeMode={activeMode}
              onKeyDownOverride={handleInputKeyDown}
              isScreenSharing={isScreenSharing}
              includeScreenSnapshot={includeScreenSnapshot}
              onToggleScreenSnapshot={onToggleScreenSnapshot}
              pendingImages={pendingImages}
              onAddPendingImage={onAddPendingImage}
              onRemovePendingImage={onRemovePendingImage}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const AskMyraaModal = AskMahrModal;
