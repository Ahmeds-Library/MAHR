import { EyeExpression } from "@/components/chat/mascot/mascotPlayTypes";

export type ActiveWorkspacePage =
  | "home"
  | "whiteboard"
  | "simulation_studio"
  | "study_pad"
  | "daily_tasks"
  | "classroom"
  | "memory_dashboard"
  | "knowledge_graph"
  | "chat_journal"
  | "slides_studio"
  | "office"
  | "subagents_studio"
  | "rl_studio"
  | "settings";

export type UserWorkActionType =
  | "idle"
  | "typing"
  | "drawing"
  | "clicking"
  | "scrolling"
  | "page_switch";

export interface UserInteractionContext {
  targetLabel?: string;
  targetTag?: string;
  isInteractiveControl?: boolean;
  clientX?: number;
  clientY?: number;
}

export interface MascotAttentionReaction {
  id: string;
  page: ActiveWorkspacePage;
  actionType: UserWorkActionType;
  expression: EyeExpression;
  badgeIcon:
    | "sparkles"
    | "pen"
    | "code"
    | "check"
    | "book"
    | "brain"
    | "compass"
    | "heart";
  statusText: string;
  shouldShowBubble: boolean;
  accentColor: string;
  headMotion:
    | "attentive_nod"
    | "curious_tilt"
    | "analytical_scan"
    | "cheer_bounce";
}

export interface WorkspacePageFlags {
  isWhiteboardOpen?: boolean;
  isSimulationStudioOpen?: boolean;
  isStudyPadOpen?: boolean;
  isDailyTaskManagerOpen?: boolean;
  isClassroomOpen?: boolean;
  showMemoryDashboard?: boolean;
  showKnowledgeGraph?: boolean;
  showChatJournal?: boolean;
  isSlidesStudioOpen?: boolean;
  isMunderDifflinOpen?: boolean;
  isSubAgentsStudioOpen?: boolean;
  isRLStudioOpen?: boolean;
  showSettings?: boolean;
}
