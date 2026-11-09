import React from "react";

export type ChatActionMode = "auto" | "whiteboard" | "code" | "slides" | "memory";

export interface SlashCommandItem {
  command: string;
  label: string;
  description: string;
  category: "workspace" | "memory" | "diagram" | "system";
  mode?: ChatActionMode;
  placeholder?: string;
}

export interface ChatWebCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface ChatMediaItem {
  type: "image" | "video";
  url: string;
  title?: string;
  thumbnailUrl?: string;
  videoId?: string;
}

export interface ChatMessageItemData {
  id?: string;
  sender: "user" | "mahr" | "myraa";
  text: string;
  timestamp: string;
  attachedImages?: string[];
  actionExecuted?: string;
  isStreaming?: boolean;
  groundingSources?: ChatWebCitation[];
  searchQueries?: string[];
  mediaItems?: ChatMediaItem[];
  memoryRecalledCount?: number;
  memoryRecalledLabels?: string[];
  memorySavedTitle?: string;
  codeSentToChalkboard?: boolean;
  modeUsed?: string;
}

export interface ChatHeaderProps {
  activeSubAgentName: string;
  activeModelId: string;
  themeColor: string;
  isScreenSharing: boolean;
  isRealtimeConnected: boolean;
  isAutoSpeakEnabled: boolean;
  onToggleAutoSpeak?: (val: boolean) => void;
  onClearChat?: () => void;
  vectorMemoryCount?: number;
  isVectorRecalling?: boolean;
  onClose: () => void;
}

export interface ChatMessageListProps {
  messages: ChatMessageItemData[];
  isLoading: boolean;
  activeSubAgentName: string;
  themeColor: string;
  onReplayAudio: (text: string) => void;
  onSendCodeToChalkboard?: (code: string, language?: string) => void;
  onSelectStarterCommand?: (promptText: string, mode?: ChatActionMode) => void;
}

export interface ChatInputBarProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent, customText?: string) => void;
  isLoading: boolean;
  activeMode?: ChatActionMode;
  onKeyDownOverride?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  isScreenSharing?: boolean;
  includeScreenSnapshot?: boolean;
  onToggleScreenSnapshot?: (val: boolean) => void;
  pendingImages?: string[];
  onAddPendingImage?: (base64: string) => void;
  onRemovePendingImage?: (index: number) => void;
}

export interface QuickPromptChipsProps {
  prompts: string[];
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}
