import { useState, useCallback } from "react";

export type PanelId =
  | "settings"
  | "memoryDashboard"
  | "knowledgeGraph"
  | "chatJournal"
  | "studyPad"
  | "whiteboard"
  | "simulationStudio"
  | "humanMoodStudio"
  | "rlStudio"
  | "modelSwitcher"
  | "subAgentsStudio"
  | "office"
  | "dailyTaskManager"
  | "classroom"
  | "askMahr"
  | "quickRoutines"
  | "keyboardShortcuts"
  | "desktopRemote"
  | "magnifier";

export function useMahrAppState() {
  const [showSettings, setShowSettings] = useState(false);
  const [showMemoryDashboard, setShowMemoryDashboard] = useState(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [showChatJournal, setShowChatJournal] = useState(false);
  const [isStudyPadOpen, setIsStudyPadOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isSimulationStudioOpen, setIsSimulationStudioOpen] = useState(false);
  const [isHumanMoodStudioOpen, setIsHumanMoodStudioOpen] = useState(false);
  const [isRLStudioOpen, setIsRLStudioOpen] = useState(false);
  const [isModelSwitcherOpen, setIsModelSwitcherOpen] = useState(false);
  const [isSubAgentsStudioOpen, setIsSubAgentsStudioOpen] = useState(false);
  const [isMunderDifflinOpen, setIsMunderDifflinOpen] = useState(false);
  const [isDailyTaskManagerOpen, setIsDailyTaskManagerOpen] = useState(false);
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [isAskMyraaOpen, setIsAskMyraaOpen] = useState(false);
  const [isQuickRoutinesOpen, setIsQuickRoutinesOpen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isDesktopRemoteModalOpen, setIsDesktopRemoteModalOpen] = useState(false);
  const [isMagnifierOpen, setIsMagnifierOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeAllPanels = useCallback(() => {
    setShowSettings(false);
    setShowMemoryDashboard(false);
    setShowKnowledgeGraph(false);
    setShowChatJournal(false);
    setIsStudyPadOpen(false);
    setIsWhiteboardOpen(false);
    setIsSimulationStudioOpen(false);
    setIsHumanMoodStudioOpen(false);
    setIsRLStudioOpen(false);
    setIsModelSwitcherOpen(false);
    setIsSubAgentsStudioOpen(false);
    setIsMunderDifflinOpen(false);
    setIsDailyTaskManagerOpen(false);
    setIsClassroomOpen(false);
    setIsAskMyraaOpen(false);
    setIsQuickRoutinesOpen(false);
    setShowKeyboardShortcuts(false);
    setIsDesktopRemoteModalOpen(false);
    setIsMagnifierOpen(false);
    setIsMobileMenuOpen(false);
  }, []);

  const openPanel = useCallback(
    (panel: PanelId) => {
      closeAllPanels();
      switch (panel) {
        case "settings": setShowSettings(true); break;
        case "memoryDashboard": setShowMemoryDashboard(true); break;
        case "knowledgeGraph": setShowKnowledgeGraph(true); break;
        case "chatJournal": setShowChatJournal(true); break;
        case "studyPad": setIsStudyPadOpen(true); break;
        case "whiteboard": setIsWhiteboardOpen(true); break;
        case "simulationStudio": setIsSimulationStudioOpen(true); break;
        case "humanMoodStudio": setIsHumanMoodStudioOpen(true); break;
        case "rlStudio": setIsRLStudioOpen(true); break;
        case "modelSwitcher": setIsModelSwitcherOpen(true); break;
        case "subAgentsStudio": setIsSubAgentsStudioOpen(true); break;
        case "office": setIsMunderDifflinOpen(true); break;
        case "dailyTaskManager": setIsDailyTaskManagerOpen(true); break;
        case "classroom": setIsClassroomOpen(true); break;
        case "askMahr": setIsAskMyraaOpen(true); break;
        case "quickRoutines": setIsQuickRoutinesOpen(true); break;
        case "keyboardShortcuts": setShowKeyboardShortcuts(true); break;
        case "desktopRemote": setIsDesktopRemoteModalOpen(true); break;
        case "magnifier": setIsMagnifierOpen(true); break;
      }
    },
    [closeAllPanels]
  );

  const togglePanel = useCallback(
    (panel: PanelId) => {
      let isCurrentlyOpen = false;
      switch (panel) {
        case "settings": isCurrentlyOpen = showSettings; break;
        case "memoryDashboard": isCurrentlyOpen = showMemoryDashboard; break;
        case "knowledgeGraph": isCurrentlyOpen = showKnowledgeGraph; break;
        case "chatJournal": isCurrentlyOpen = showChatJournal; break;
        case "studyPad": isCurrentlyOpen = isStudyPadOpen; break;
        case "whiteboard": isCurrentlyOpen = isWhiteboardOpen; break;
        case "simulationStudio": isCurrentlyOpen = isSimulationStudioOpen; break;
        case "humanMoodStudio": isCurrentlyOpen = isHumanMoodStudioOpen; break;
        case "rlStudio": isCurrentlyOpen = isRLStudioOpen; break;
        case "modelSwitcher": isCurrentlyOpen = isModelSwitcherOpen; break;
        case "subAgentsStudio": isCurrentlyOpen = isSubAgentsStudioOpen; break;
        case "office": isCurrentlyOpen = isMunderDifflinOpen; break;
        case "dailyTaskManager": isCurrentlyOpen = isDailyTaskManagerOpen; break;
        case "classroom": isCurrentlyOpen = isClassroomOpen; break;
        case "askMahr": isCurrentlyOpen = isAskMyraaOpen; break;
        case "quickRoutines": isCurrentlyOpen = isQuickRoutinesOpen; break;
        case "keyboardShortcuts": isCurrentlyOpen = showKeyboardShortcuts; break;
        case "desktopRemote": isCurrentlyOpen = isDesktopRemoteModalOpen; break;
        case "magnifier": isCurrentlyOpen = isMagnifierOpen; break;
      }

      if (isCurrentlyOpen) {
        closeAllPanels();
      } else {
        openPanel(panel);
      }
    },
    [
      closeAllPanels,
      openPanel,
      showSettings,
      showMemoryDashboard,
      showKnowledgeGraph,
      showChatJournal,
      isStudyPadOpen,
      isWhiteboardOpen,
      isSimulationStudioOpen,
      isHumanMoodStudioOpen,
      isRLStudioOpen,
      isModelSwitcherOpen,
      isSubAgentsStudioOpen,
      isMunderDifflinOpen,
      isDailyTaskManagerOpen,
      isClassroomOpen,
      isAskMyraaOpen,
      isQuickRoutinesOpen,
      showKeyboardShortcuts,
      isDesktopRemoteModalOpen,
      isMagnifierOpen,
    ]
  );

  return {
    showSettings,
    setShowSettings,
    showMemoryDashboard,
    setShowMemoryDashboard,
    showKnowledgeGraph,
    setShowKnowledgeGraph,
    showChatJournal,
    setShowChatJournal,
    isStudyPadOpen,
    setIsStudyPadOpen,
    isWhiteboardOpen,
    setIsWhiteboardOpen,
    isSimulationStudioOpen,
    setIsSimulationStudioOpen,
    isHumanMoodStudioOpen,
    setIsHumanMoodStudioOpen,
    isRLStudioOpen,
    setIsRLStudioOpen,
    isModelSwitcherOpen,
    setIsModelSwitcherOpen,
    isSubAgentsStudioOpen,
    setIsSubAgentsStudioOpen,
    isMunderDifflinOpen,
    setIsMunderDifflinOpen,
    isDailyTaskManagerOpen,
    setIsDailyTaskManagerOpen,
    isClassroomOpen,
    setIsClassroomOpen,
    isAskMyraaOpen,
    setIsAskMyraaOpen,
    isQuickRoutinesOpen,
    setIsQuickRoutinesOpen,
    showKeyboardShortcuts,
    setShowKeyboardShortcuts,
    isDesktopRemoteModalOpen,
    setIsDesktopRemoteModalOpen,
    isMagnifierOpen,
    setIsMagnifierOpen,
    isFocusMode,
    setIsFocusMode,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    closeAllPanels,
    openPanel,
    togglePanel,
  };
}
