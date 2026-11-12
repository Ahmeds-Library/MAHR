export type VoiceActionPhase = "idle" | "pre_action" | "mid_action" | "post_action";

export type VoiceActionDomain =
  | "chalkboard"
  | "mindmap"
  | "code"
  | "slides"
  | "slides_nav"
  | "memory"
  | "obsidian"
  | "tasks"
  | "simulation"
  | "studypad"
  | "office"
  | "routines"
  | "system";

export interface LiveVoiceActionSyncEvent {
  id: string;
  domain: VoiceActionDomain;
  title: string;
  phase: VoiceActionPhase;
  progressPercent: number;
  spokenCueText: string;
  latencyMs: number;
  language: "ur_roman" | "en";
  timestamp: number;
}

export interface BilingualSynchronizedCueSet {
  preAction: {
    ur_roman: string;
    en: string;
  };
  midAction: {
    ur_roman: string;
    en: string;
  };
  postAction: {
    ur_roman: string;
    en: string;
  };
}

export type BilingualActionIntentType =
  | "voice_to_mindmap"
  | "sketch"
  | "code_chalkboard"
  | "open_slides"
  | "slides_navigate"
  | "save_memory"
  | "open_memory"
  | "open_obsidian"
  | "vector_search"
  | "add_task"
  | "open_tasks"
  | "open_simulation"
  | "open_studypad"
  | "generate_study_pack"
  | "open_office"
  | "open_routines"
  | "focus_mode"
  | "voice_command"
  | "sleep"
  | "wake"
  | "none";

export interface BilingualVoiceIntentMatch {
  type: BilingualActionIntentType;
  domain: VoiceActionDomain;
  topic?: string;
  slideAction?: "next" | "prev" | "export" | "add_slide";
  isWorkflow?: boolean;
  isFocusDeactivate?: boolean;
  detectedLanguage: "ur_roman" | "en";
  cleanedCommandText: string;
  rawText: string;
  cues: BilingualSynchronizedCueSet;
}
