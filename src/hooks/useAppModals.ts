import { useState, useCallback } from "react";

export interface ModalStates {
  showSettings: boolean;
  showChatJournal: boolean;
  showKnowledgeGraph: boolean;
  showMemoryDashboard: boolean;
  isDesktopRemoteModalOpen: boolean;
  isRLStudioOpen: boolean;
  showSkillsModal: boolean;
  showModelSwitcher: boolean;
  showSubAgentsStudio: boolean;
  showDailyTaskManager: boolean;
  showOfficeModal: boolean;
  showAskMahrModal: boolean;
  showKeyboardShortcuts: boolean;
  showScreenShareMagnifier: boolean;
  showHumanMoodStudio: boolean;
  showQuickRoutines: boolean;
  showMobileMenu: boolean;
}

export function useAppModals() {
  const [modals, setModals] = useState<ModalStates>({
    showSettings: false,
    showChatJournal: false,
    showKnowledgeGraph: false,
    showMemoryDashboard: false,
    isDesktopRemoteModalOpen: false,
    isRLStudioOpen: false,
    showSkillsModal: false,
    showModelSwitcher: false,
    showSubAgentsStudio: false,
    showDailyTaskManager: false,
    showOfficeModal: false,
    showAskMahrModal: false,
    showKeyboardShortcuts: false,
    showScreenShareMagnifier: false,
    showHumanMoodStudio: false,
    showQuickRoutines: false,
    showMobileMenu: false,
  });

  const openModal = useCallback((key: keyof ModalStates) => {
    setModals((prev) => ({ ...prev, [key]: true }));
  }, []);

  const closeModal = useCallback((key: keyof ModalStates) => {
    setModals((prev) => ({ ...prev, [key]: false }));
  }, []);

  const toggleModal = useCallback((key: keyof ModalStates) => {
    setModals((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      showSettings: false,
      showChatJournal: false,
      showKnowledgeGraph: false,
      showMemoryDashboard: false,
      isDesktopRemoteModalOpen: false,
      isRLStudioOpen: false,
      showSkillsModal: false,
      showModelSwitcher: false,
      showSubAgentsStudio: false,
      showDailyTaskManager: false,
      showOfficeModal: false,
      showAskMahrModal: false,
      showKeyboardShortcuts: false,
      showScreenShareMagnifier: false,
      showHumanMoodStudio: false,
      showQuickRoutines: false,
      showMobileMenu: false,
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
  };
}
