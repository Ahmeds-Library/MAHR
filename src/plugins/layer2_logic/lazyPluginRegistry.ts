/**
 * Layer 2 (Business Logic — Dynamic Code-Splitting & Memory Footprint Registry):
 * Ensures uninstalled or disabled plugins remain 100% dormant (0 KB loaded in memory)
 * by wrapping optional plugin UI studios in on-demand `React.lazy()` dynamic imports.
 */

import React from "react";
import { InstalledPluginsMap, MahrPluginId } from "../layer1_data/pluginTypes";
import {
  MAHR_PLUGIN_CATALOG,
  TOTAL_ECOSYSTEM_CHUNK_KB,
  getPluginDefinitionById,
} from "../layer1_data/pluginCatalog";
import { isPluginActiveInMap } from "./pluginStorageService";

export interface PluginMemoryFootprintStats {
  activeMemoryKb: number;
  dormantSavedKb: number;
  totalEcosystemKb: number;
  activeChunksCount: number;
  dormantChunksCount: number;
}

/**
 * Calculates live memory footprint (in KB) of currently active vs. dormant extensions.
 * When in Pure Voice Agent mode (0 plugins active), `activeMemoryKb` is strictly `0`.
 */
export function calculatePluginMemoryStats(
  pluginsMap: InstalledPluginsMap
): PluginMemoryFootprintStats {
  let activeMemoryKb = 0;
  let activeChunksCount = 0;

  for (const plugin of MAHR_PLUGIN_CATALOG) {
    if (isPluginActiveInMap(pluginsMap, plugin.id)) {
      activeMemoryKb += plugin.estimatedChunkKb;
      activeChunksCount += 1;
    }
  }

  const dormantSavedKb = Math.max(0, TOTAL_ECOSYSTEM_CHUNK_KB - activeMemoryKb);
  const dormantChunksCount = Math.max(0, MAHR_PLUGIN_CATALOG.length - activeChunksCount);

  return {
    activeMemoryKb,
    dormantSavedKb,
    totalEcosystemKb: TOTAL_ECOSYSTEM_CHUNK_KB,
    activeChunksCount,
    dormantChunksCount,
  };
}

export function getPluginChunkKb(pluginId: MahrPluginId): number {
  return getPluginDefinitionById(pluginId)?.estimatedChunkKb ?? 48;
}

// ============================================================================
// On-Demand Dynamic Lazy Component Loaders (Zero Initial Bundle Bloat)
// ============================================================================

export const LazyMemoryDashboard = React.lazy(() =>
  import("@components/MemoryDashboard").then((m) => ({
    default: m.MemoryDashboard,
  }))
);

export const LazyKnowledgeGraphDashboard = React.lazy(() =>
  import("@components/KnowledgeGraphDashboard").then((m) => ({
    default: m.KnowledgeGraphDashboard,
  }))
);

export const LazyChatJournal = React.lazy(() =>
  import("@components/ChatJournal").then((m) => ({
    default: m.ChatJournal,
  }))
);

export const LazyChalkboard = React.lazy(() =>
  import("@components/Chalkboard").then((m) => ({
    default: m.Chalkboard,
  }))
);

export const LazyStudyPadPanel = React.lazy(() =>
  import("@components/StudyPadPanel").then((m) => ({
    default: m.StudyPadPanel,
  }))
);

export const LazyUniversalSimulationStudio = React.lazy(() =>
  import("@components/simulation/UniversalSimulationStudio").then((m) => ({
    default: m.UniversalSimulationStudio,
  }))
);

export const LazyHumanMoodStudio = React.lazy(() =>
  import("@components/HumanMoodStudio").then((m) => ({
    default: m.HumanMoodStudio,
  }))
);

export const LazyReinforcementLearningStudio = React.lazy(() =>
  import("@components/ReinforcementLearningStudio").then((m) => ({
    default: m.ReinforcementLearningStudio,
  }))
);

export const LazySubAgentsStudio = React.lazy(() =>
  import("@components/SubAgentsStudio").then((m) => ({
    default: m.SubAgentsStudio,
  }))
);

export const LazyMAHROfficeModal = React.lazy(() =>
  import("@office/MAHROfficeModal").then((m) => ({
    default: m.MAHROfficeModal,
  }))
);

export const LazyDailyTaskManager = React.lazy(() =>
  import("@components/DailyTaskManager").then((m) => ({
    default: m.DailyTaskManager,
  }))
);

export const LazyGoogleClassroomHubModal = React.lazy(() =>
  import("@components/classroom/GoogleClassroomHubModal").then((m) => ({
    default: m.GoogleClassroomHubModal,
  }))
);

export const LazyAskMahrModal = React.lazy(() =>
  import("@components/AskMahrModal").then((m) => ({
    default: m.AskMahrModal,
  }))
);

export const LazyMahrCuteMascotTrigger = React.lazy(() =>
  import("@components/AskMahrModal").then((m) => ({
    default: m.MahrCuteMascotTrigger,
  }))
);

export const LazyQuickRoutinesDrawer = React.lazy(() =>
  import("@components/assistant/QuickRoutinesDrawer").then((m) => ({
    default: m.QuickRoutinesDrawer,
  }))
);

export const LazyFloatingScreenShareHub = React.lazy(() =>
  import("@components/FloatingScreenShareHub").then((m) => ({
    default: m.FloatingScreenShareHub,
  }))
);

export const LazyScreenShareMagnifierModal = React.lazy(() =>
  import("@components/ScreenShareMagnifierModal").then((m) => ({
    default: m.ScreenShareMagnifierModal,
  }))
);
