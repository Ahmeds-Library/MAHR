import { BrushProfile } from "../../lib/brushProfiles";

export type WhiteboardEngineMode = 
  | "chalkboard"
  | "slides"
  | "mindmap"
  | "flowchart"
  | "2d-fluid"
  | "3d-simulation"
  | "dld";

export type WhiteboardTool =
  | "pen"
  | "smartpen"
  | "highlighter"
  | "eraser"
  | "line"
  | "arrow"
  | "pan";

export type GridType = "none" | "dot-grid" | "graph-paper" | "isometric" | "blueprint";

export interface WhiteboardHeaderProps {
  engineMode: string;
  onSelectEngineMode: (mode: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  layersCount: number;
  showLayersPanel: boolean;
  onToggleLayersPanel: () => void;
  onOpenUtilities: () => void;
  onOpenAIImageModal?: () => void;
  onClearCanvas: () => void;
  onExportCanvas: () => void;
  onToggleFullScreen: () => void;
  onToggleHelp: () => void;
  showHelper: boolean;
  onClose?: () => void;
  activeLayoutMode?: "canvas" | "split" | "text";
  onSelectLayoutMode?: (mode: "canvas" | "split" | "text") => void;
  onToggleMahrVoice?: () => void;
  isMahrVoiceOpen?: boolean;
}

export interface WhiteboardFloatingDockProps {
  tool: WhiteboardTool;
  onSelectTool: (tool: WhiteboardTool) => void;
  color: string;
  onSelectColor: (color: string) => void;
  brushSize: number;
  onSelectBrushSize: (size: number) => void;
  activeBrushProfile: BrushProfile;
  onSelectBrushProfile: (profile: BrushProfile) => void;
  onOpenBrushTuner: () => void;
  // Interactive Overlays
  showVoiceSketch: boolean;
  onToggleVoiceSketch: () => void;
  showMiniDld: boolean;
  onToggleMiniDld: () => void;
  isPlaybackMode: boolean;
  onTogglePlayback: () => void;
}

export interface WhiteboardUtilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gridType: GridType;
  onSelectGridType: (type: GridType) => void;
  isAudioFeedbackEnabled: boolean;
  onToggleAudioFeedback: () => void;
  showPressureHUD: boolean;
  onTogglePressureHUD: () => void;
  onOpenDeduplicator: () => void;
  onResetStrokeCounter: () => void;
  onToggleVoiceSketch: () => void;
  onToggleMiniDld: () => void;
}
