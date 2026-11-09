/**
 * Layer 2 (Business Logic — Real-Time Hot-Swap Engine):
 * Observes plugin activation/deactivation in real time without page refresh.
 * - Immediately injects or ejects plugin items in the Top Dock & Sidebar with GSAP transitions.
 * - If a user disables or uninstalls an extension whose workspace/modal is currently open,
 *   automatically unmounts that workspace and smoothly transitions back to the main Voice Orb view.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { InstalledPluginsMap, MahrPluginId } from "../layer1_data/pluginTypes";
import { MAHR_PLUGIN_CATALOG } from "../layer1_data/pluginCatalog";
import { isPluginActiveInMap } from "./pluginStorageService";

export interface PluginWorkspaceStatesAndEjectors {
  pluginsMap: InstalledPluginsMap;
  isWhiteboardOpen: boolean;
  setIsWhiteboardOpen: (v: boolean) => void;
  whiteboardDiagramType: string;
  isSimulationStudioOpen: boolean;
  setIsSimulationStudioOpen: (v: boolean) => void;
  isStudyPadOpen: boolean;
  setIsStudyPadOpen: (v: boolean) => void;
  isClassroomOpen: boolean;
  setIsClassroomOpen: (v: boolean) => void;
  isDailyTaskManagerOpen: boolean;
  setIsDailyTaskManagerOpen: (v: boolean) => void;
  isQuickRoutinesOpen: boolean;
  setIsQuickRoutinesOpen: (v: boolean) => void;
  showMemoryDashboard: boolean;
  setShowMemoryDashboard: (v: boolean) => void;
  showKnowledgeGraph: boolean;
  setShowKnowledgeGraph: (v: boolean) => void;
  showChatJournal: boolean;
  setShowChatJournal: (v: boolean) => void;
  isMunderDifflinOpen: boolean;
  setIsMunderDifflinOpen: (v: boolean) => void;
  isSubAgentsStudioOpen: boolean;
  setIsSubAgentsStudioOpen: (v: boolean) => void;
  isHumanMoodStudioOpen: boolean;
  setIsHumanMoodStudioOpen: (v: boolean) => void;
  isRLStudioOpen: boolean;
  setIsRLStudioOpen: (v: boolean) => void;
  isScreenSharing: boolean;
  stopScreenSharing: () => void;
  isMagnifierOpen: boolean;
  setIsMagnifierOpen: (v: boolean) => void;
  isAskMyraaOpen: boolean;
  setIsAskMyraaOpen: (v: boolean) => void;
  onWorkspaceAutoEjected?: (pluginId: MahrPluginId) => void;
}

export function usePluginHotSwapEngine({
  pluginsMap,
  isWhiteboardOpen,
  setIsWhiteboardOpen,
  whiteboardDiagramType,
  isSimulationStudioOpen,
  setIsSimulationStudioOpen,
  isStudyPadOpen,
  setIsStudyPadOpen,
  isClassroomOpen,
  setIsClassroomOpen,
  isDailyTaskManagerOpen,
  setIsDailyTaskManagerOpen,
  isQuickRoutinesOpen,
  setIsQuickRoutinesOpen,
  showMemoryDashboard,
  setShowMemoryDashboard,
  showKnowledgeGraph,
  setShowKnowledgeGraph,
  showChatJournal,
  setShowChatJournal,
  isMunderDifflinOpen,
  setIsMunderDifflinOpen,
  isSubAgentsStudioOpen,
  setIsSubAgentsStudioOpen,
  isHumanMoodStudioOpen,
  setIsHumanMoodStudioOpen,
  isRLStudioOpen,
  setIsRLStudioOpen,
  isScreenSharing,
  stopScreenSharing,
  isMagnifierOpen,
  setIsMagnifierOpen,
  isAskMyraaOpen,
  setIsAskMyraaOpen,
  onWorkspaceAutoEjected,
}: PluginWorkspaceStatesAndEjectors) {
  const prevMapRef = useRef<InstalledPluginsMap>(pluginsMap);

  useEffect(() => {
    const prevMap = prevMapRef.current;
    const newlyEnabled: MahrPluginId[] = [];
    const newlyDisabled: MahrPluginId[] = [];

    for (const plugin of MAHR_PLUGIN_CATALOG) {
      const wasActive = isPluginActiveInMap(prevMap, plugin.id);
      const isNowActive = isPluginActiveInMap(pluginsMap, plugin.id);
      if (!wasActive && isNowActive) {
        newlyEnabled.push(plugin.id);
      } else if (wasActive && !isNowActive) {
        newlyDisabled.push(plugin.id);
      }
    }

    prevMapRef.current = pluginsMap;

    // 1. Animate newly injected plugins in the Quick-Access Dock
    if (newlyEnabled.length > 0 && typeof document !== "undefined") {
      requestAnimationFrame(() => {
        const dockEl = document.getElementById("header-quick-access-plugin-dock");
        if (dockEl) {
          gsap.fromTo(
            dockEl,
            { scale: 0.985, opacity: 0.88 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.28,
              ease: "power2.out",
              clearProps: "transform,opacity",
            }
          );
        }
      });
    }

    // 2. Eject any currently open workspace/modal belonging to a newly disabled/uninstalled plugin
    if (newlyDisabled.length > 0) {
      let ejectedPluginId: MahrPluginId | null = null;

      for (const pid of newlyDisabled) {
        switch (pid) {
          case "whiteboard-chalkboard":
            if (isWhiteboardOpen && whiteboardDiagramType !== "slides") {
              setIsWhiteboardOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "slides-studio":
            if (isWhiteboardOpen && whiteboardDiagramType === "slides") {
              setIsWhiteboardOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "simulation-studio":
            if (isSimulationStudioOpen) {
              setIsSimulationStudioOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "study-pad":
            if (isStudyPadOpen) {
              setIsStudyPadOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "google-classroom":
            if (isClassroomOpen) {
              setIsClassroomOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "daily-tasks":
            if (isDailyTaskManagerOpen) {
              setIsDailyTaskManagerOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "quick-routines":
            if (isQuickRoutinesOpen) {
              setIsQuickRoutinesOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "memory-vault":
            if (showMemoryDashboard) {
              setShowMemoryDashboard(false);
              ejectedPluginId = pid;
            }
            break;
          case "knowledge-graph":
            if (showKnowledgeGraph) {
              setShowKnowledgeGraph(false);
              ejectedPluginId = pid;
            }
            break;
          case "chat-journal":
            if (showChatJournal) {
              setShowChatJournal(false);
              ejectedPluginId = pid;
            }
            break;
          case "mahr-office":
            if (isMunderDifflinOpen) {
              setIsMunderDifflinOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "subagents-studio":
            if (isSubAgentsStudioOpen) {
              setIsSubAgentsStudioOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "cognitive-labs":
            if (isHumanMoodStudioOpen || isRLStudioOpen) {
              setIsHumanMoodStudioOpen(false);
              setIsRLStudioOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "screen-vision":
            if (isScreenSharing || isMagnifierOpen) {
              if (isScreenSharing) stopScreenSharing();
              if (isMagnifierOpen) setIsMagnifierOpen(false);
              ejectedPluginId = pid;
            }
            break;
          case "cute-mascot-chat":
            if (isAskMyraaOpen) {
              setIsAskMyraaOpen(false);
              ejectedPluginId = pid;
            }
            break;
          default:
            break;
        }
      }

      if (ejectedPluginId) {
        onWorkspaceAutoEjected?.(ejectedPluginId);

        // Smooth GSAP transition focusing the main Voice Orb stage
        if (typeof document !== "undefined") {
          const stageEl = document.getElementById("mahr-holographic-desktop");
          if (stageEl) {
            gsap.fromTo(
              stageEl,
              { opacity: 0.92, scale: 0.992 },
              {
                opacity: 1,
                scale: 1,
                duration: 0.36,
                ease: "power2.out",
                clearProps: "transform,opacity",
              }
            );
          }
        }
      }
    }
  }, [
    pluginsMap,
    isWhiteboardOpen,
    whiteboardDiagramType,
    isSimulationStudioOpen,
    isStudyPadOpen,
    isClassroomOpen,
    isDailyTaskManagerOpen,
    isQuickRoutinesOpen,
    showMemoryDashboard,
    showKnowledgeGraph,
    showChatJournal,
    isMunderDifflinOpen,
    isSubAgentsStudioOpen,
    isHumanMoodStudioOpen,
    isRLStudioOpen,
    isScreenSharing,
    isMagnifierOpen,
    isAskMyraaOpen,
    setIsWhiteboardOpen,
    setIsSimulationStudioOpen,
    setIsStudyPadOpen,
    setIsClassroomOpen,
    setIsDailyTaskManagerOpen,
    setIsQuickRoutinesOpen,
    setShowMemoryDashboard,
    setShowKnowledgeGraph,
    setShowChatJournal,
    setIsMunderDifflinOpen,
    setIsSubAgentsStudioOpen,
    setIsHumanMoodStudioOpen,
    setIsRLStudioOpen,
    stopScreenSharing,
    setIsMagnifierOpen,
    setIsAskMyraaOpen,
    onWorkspaceAutoEjected,
  ]);
}
