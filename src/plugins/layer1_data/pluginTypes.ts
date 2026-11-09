/**
 * Layer 1 (Data & Schema):
 * Modular Plugin & Extension Types for MAHR AI Personal Assistant.
 */

export type MahrPluginId =
  | "whiteboard-chalkboard"
  | "slides-studio"
  | "simulation-studio"
  | "study-pad"
  | "google-classroom"
  | "daily-tasks"
  | "quick-routines"
  | "memory-vault"
  | "knowledge-graph"
  | "chat-journal"
  | "mahr-office"
  | "subagents-studio"
  | "cognitive-labs"
  | "screen-vision"
  | "cute-mascot-chat";

export type MahrPluginCategory =
  | "productivity"
  | "research"
  | "visuals"
  | "utilities";

export type MarketplaceFilterCategory =
  | "all"
  | MahrPluginCategory
  | "installed";

export type MarketplaceSortOrder =
  | "featured"
  | "installed"
  | "alphabetical";

export interface MahrPluginCategoryMeta {
  id: MarketplaceFilterCategory;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  accentColor: string;
}

export interface MahrPluginDefinition {
  id: MahrPluginId;
  name: string;
  shortTitle: string;
  tagline: string;
  description: string;
  category: MahrPluginCategory;
  categoryLabel: string;
  iconName: string;
  accentColor: string;
  version: string;
  footprintLabel: string;
  estimatedChunkKb: number;
  capabilities: string[];
  voiceTriggers: string[];
  defaultInstalled: boolean;
  featured?: boolean;
  featuredBadge?: string;
}

export type PluginChunkLoadState = "dormant" | "loading" | "mounted";

export type HotSwapActionType =
  | "installed"
  | "uninstalled"
  | "enabled"
  | "disabled"
  | "bundle-applied"
  | "reset-pure-voice";

export interface HotSwapEvent {
  id: string;
  pluginId?: MahrPluginId;
  pluginName: string;
  action: HotSwapActionType;
  deltaKb: number;
  activeMemoryKb: number;
  ejectedActiveWorkspace?: boolean;
  timestamp: number;
}

export interface MahrPluginBundle {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  pluginIds: MahrPluginId[];
  accentHex: string;
}

export interface InstalledPluginEntry {
  installed: boolean;
  enabled: boolean;
  installedAt: string;
}

export type InstalledPluginsMap = Partial<Record<MahrPluginId, InstalledPluginEntry>>;

export interface PendingVoicePluginPrompt {
  pluginId: MahrPluginId;
  pluginName: string;
  spokenMessage: string;
  triggeredAt: number;
  onConfirmInstallAndRun: () => void;
}

