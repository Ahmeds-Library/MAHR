import React, { Suspense } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { GranularMeshGradientBackground } from "@components/GranularMeshGradientBackground";
import { MahrCoreVisualizer, MahrEmotion } from "@components/MahrCoreVisualizer";
import { HeaderNav } from "@components/HeaderNav";
import { FooterVisualizer } from "@components/FooterVisualizer";
import { VoiceDialogueToast } from "@components/VoiceDialogueToast";
import { GlobalAlerts } from "@components/GlobalAlerts";
import { HumanMoodType } from "@/services/humanEmotionEngine";
import { PsychologyProfile } from "@/services/colorPsychologyEngine";
import { RLAtmospherePolicy } from "@/services/ml/rlMoodOptimizer";
import { SubAgent, DailyTask } from "@lib/subagentTypes";
import { Memory, ChatMessage } from "@lib/memoryTypes";
import { LiveState } from "@lib/audio";
import { resolveActiveWorkspacePage } from "@/core/mascot/mascotWorkReactionEngine";
import { MahrPluginId } from "@/plugins/layer1_data/pluginTypes";
import {
  LazyFloatingScreenShareHub,
  LazyMahrCuteMascotTrigger,
} from "@/plugins/layer2_logic/lazyPluginRegistry";

export interface MahrResponsiveShellProps {
  // Appearance & Stage
  currentHumanMood: HumanMoodType;
  psychologyProfile?: PsychologyProfile;
  themeColor: string;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  activeEmotion: MahrEmotion;
  characterState: "idle" | "thinking" | "talking";
  wakeWordRipple: number;
  sleepRipple: number;
  isMicDenied: boolean;
  isWakeWordEnabled: boolean;
  rlAtmospherePolicy?: RLAtmospherePolicy | null;
  onManualSleepRequested: () => void;
  onManualWakeRequested: () => void;

  // Session & Audio
  session: any | null;
  state: LiveState;
  voiceConfidence: number;
  isMuted: boolean;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onToggleWakeWord: () => void;

  // Header Nav & App Updater
  appUpdater: any;
  onOpenUpdateModal: () => void;
  onOpenDesktopRemoteModal: () => void;
  autoShiftBackground: boolean;
  onSelectThemeColor: (color: string) => void;
  onToggleAutoShift: () => void;
  onToggleHumanMoodStudio: () => void;
  activeModelId: string;
  activeSubAgent: SubAgent;
  dailyTasks: DailyTask[];
  offlineDeletedQueueLength: number;
  chatHistory: ChatMessage[];
  studyPadText: string;
  whiteboardText: string;
  isRLStudioOpen: boolean;
  deficitsCount: number;

  // Screen Sharing
  isScreenSharing: boolean;
  isScreenSharingPaused: boolean;
  screenVisionMode: any;
  setScreenVisionMode: (mode: any) => void;
  onStartScreenSharing: () => void;
  onStopScreenSharing: () => void;
  onPauseScreenSharing: () => void;
  onResumeScreenSharing: () => void;
  onSwitchScreenSharing: () => void;
  onOpenMagnifier: () => void;
  screenStream: MediaStream | null;

  // Captions & Alerts
  modelCaption: string;
  userCaption: string;
  activeSkill: any;
  onDismissCaptions: () => void;
  errorText: string | null;
  onDismissError: () => void;

  // Card Deck & Routines
  memories: Memory[];
  onToggleTask: (id: string) => void;
  onRunVoiceRoutine: (routine: string) => void;

  // Modals & Panels Toggles
  showSettings: boolean;
  showMemoryDashboard: boolean;
  showKnowledgeGraph: boolean;
  showChatJournal: boolean;
  isStudyPadOpen: boolean;
  isWhiteboardOpen: boolean;
  isSimulationStudioOpen: boolean;
  showKeyboardShortcuts: boolean;
  isModelSwitcherOpen: boolean;
  isSubAgentsStudioOpen: boolean;
  isMunderDifflinOpen: boolean;
  isSlidesStudioOpen: boolean;
  isDailyTaskManagerOpen: boolean;
  isClassroomOpen: boolean;
  isAskMyraaOpen: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;

  onToggleModelSwitcher: () => void;
  onToggleSubAgents: () => void;
  onToggleMunderDifflin: () => void;
  onToggleSlidesStudio: () => void;
  onToggleDailyTasks: () => void;
  onToggleClassroom: () => void;
  onToggleMemory: () => void;
  onToggleKnowledgeGraph: () => void;
  onToggleJournal: () => void;
  onToggleStudyPad: () => void;
  onToggleWhiteboard: () => void;
  onToggleSimulationStudio: () => void;
  onToggleSettings: () => void;
  onToggleShortcuts: () => void;
  onToggleRLStudio: () => void;
  onOpenRoutines: () => void;
  onToggleAskMahr: () => void;
  askMyraaLoading: boolean;

  // Modular Plugins & Extensions
  isPluginActive?: (id: MahrPluginId) => boolean;
  activePluginsCount?: number;
  totalPluginsCount?: number;
  isPluginStoreOpen?: boolean;
  onOpenPluginStore?: () => void;

  children?: React.ReactNode;
}

export const MahrResponsiveShell: React.FC<MahrResponsiveShellProps> = ({
  currentHumanMood,
  psychologyProfile,
  themeColor,
  isFocusMode,
  setIsFocusMode,
  activeEmotion,
  characterState,
  wakeWordRipple,
  sleepRipple,
  isMicDenied,
  isWakeWordEnabled,
  rlAtmospherePolicy,
  onManualSleepRequested,
  onManualWakeRequested,

  session,
  state,
  voiceConfidence,
  isMuted,
  onToggleConnect,
  onToggleMute,
  onToggleWakeWord,

  appUpdater,
  onOpenUpdateModal,
  onOpenDesktopRemoteModal,
  autoShiftBackground,
  onSelectThemeColor,
  onToggleAutoShift,
  onToggleHumanMoodStudio,
  activeModelId,
  activeSubAgent,
  dailyTasks,
  offlineDeletedQueueLength,
  chatHistory,
  studyPadText,
  whiteboardText,
  isRLStudioOpen,
  deficitsCount,

  isScreenSharing,
  isScreenSharingPaused,
  screenVisionMode,
  setScreenVisionMode,
  onStartScreenSharing,
  onStopScreenSharing,
  onPauseScreenSharing,
  onResumeScreenSharing,
  onSwitchScreenSharing,
  onOpenMagnifier,
  screenStream,

  modelCaption,
  userCaption,
  activeSkill,
  onDismissCaptions,
  errorText,
  onDismissError,

  memories,
  onToggleTask,
  onRunVoiceRoutine,

  showSettings,
  showMemoryDashboard,
  showKnowledgeGraph,
  showChatJournal,
  isStudyPadOpen,
  isWhiteboardOpen,
  isSimulationStudioOpen,
  showKeyboardShortcuts,
  isModelSwitcherOpen,
  isSubAgentsStudioOpen,
  isMunderDifflinOpen,
  isSlidesStudioOpen,
  isDailyTaskManagerOpen,
  isClassroomOpen,
  isAskMyraaOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,

  onToggleModelSwitcher,
  onToggleSubAgents,
  onToggleMunderDifflin,
  onToggleSlidesStudio,
  onToggleDailyTasks,
  onToggleClassroom,
  onToggleMemory,
  onToggleKnowledgeGraph,
  onToggleJournal,
  onToggleStudyPad,
  onToggleWhiteboard,
  onToggleSimulationStudio,
  onToggleSettings,
  onToggleShortcuts,
  onToggleRLStudio,
  onOpenRoutines,
  onToggleAskMahr,
  askMyraaLoading,

  isPluginActive,
  activePluginsCount = 0,
  totalPluginsCount = 15,
  isPluginStoreOpen = false,
  onOpenPluginStore,

  children,
}) => {
  const checkPlugin = (id: MahrPluginId) => (isPluginActive ? isPluginActive(id) : true);
  return (
    <div
      id="mahr-holographic-desktop"
      className="relative w-full h-screen overflow-hidden bg-black text-white theme-transition flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none"
    >
      {/* Dynamic mood-reactive mesh gradient background */}
      <GranularMeshGradientBackground
        currentMood={currentHumanMood}
        intensity={0.88}
        transitionDurationMs={1800}
      />

      {/* FULL VIEWPORT HOLOGRAPHIC STAGE: MAHR core visualizer */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none bg-transparent">
        <MahrCoreVisualizer
          session={session}
          state={state}
          themeColor={themeColor}
          activeEmotion={activeEmotion}
          characterState={characterState}
          wakeWordTriggered={wakeWordRipple}
          sleepTriggered={sleepRipple}
          isMicDenied={isMicDenied}
          isWakeWordEnabled={isWakeWordEnabled}
          projectorIntensity={psychologyProfile?.projectorIntensity || 1.0}
          valenceScore={psychologyProfile?.valenceScore || 0.0}
          beamPulseSpeed={psychologyProfile?.beamPulseSpeed || 1.8}
          laserGridOpacity={psychologyProfile?.laserGridOpacity || 0.25}
          currentHumanMood={currentHumanMood}
          rlPolicy={rlAtmospherePolicy}
          onManualSleepRequested={onManualSleepRequested}
          onManualWakeRequested={onManualWakeRequested}
        />
      </div>

      {/* Sleek Focus Mode Pill Indicator */}
      {isFocusMode && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => setIsFocusMode(false)}
            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/18 border border-purple-500/40 rounded-full text-[10px] font-mono font-bold text-purple-300 flex items-center gap-1.5 transition duration-200 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles size={12} className="text-purple-400 animate-spin" />
            <span>FOCUS MODE ON (CLICK TO EXIT)</span>
          </motion.button>
        </div>
      )}

      {/* HEADER SECTION - Modular Glass Nav */}
      {!isFocusMode && (
        <HeaderNav
          hasUpdate={appUpdater.hasUpdate}
          latestVersion={appUpdater.updateInfo?.latestVersion}
          updaterStatus={appUpdater.status}
          lastCheckedAt={appUpdater.lastCheckedAt}
          onOpenUpdateModal={onOpenUpdateModal}
          onOpenDesktopRemoteModal={onOpenDesktopRemoteModal}
          psychologyProfile={psychologyProfile}
          autoShiftBackground={autoShiftBackground}
          themeColor={themeColor}
          onSelectThemeColor={onSelectThemeColor}
          onToggleAutoShift={onToggleAutoShift}
          currentHumanMood={currentHumanMood}
          onToggleHumanMoodStudio={onToggleHumanMoodStudio}
          activeModelId={activeModelId}
          activeSubAgent={activeSubAgent}
          dailyTasks={dailyTasks}
          offlineDeletedQueueLength={offlineDeletedQueueLength}
          showMemoryDashboard={showMemoryDashboard}
          showKnowledgeGraph={showKnowledgeGraph}
          showChatJournal={showChatJournal}
          isStudyPadOpen={isStudyPadOpen}
          isWhiteboardOpen={isWhiteboardOpen}
          isSimulationStudioOpen={isSimulationStudioOpen}
          showSettings={showSettings}
          showShortcuts={showKeyboardShortcuts}
          isScreenSharing={isScreenSharing}
          isScreenSharingPaused={isScreenSharingPaused}
          isModelSwitcherOpen={isModelSwitcherOpen}
          isSubAgentsStudioOpen={isSubAgentsStudioOpen}
          isMunderDifflinOpen={isMunderDifflinOpen}
          isSlidesStudioOpen={isSlidesStudioOpen}
          isDailyTaskManagerOpen={isDailyTaskManagerOpen}
          isClassroomOpen={isClassroomOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onToggleModelSwitcher={onToggleModelSwitcher}
          onToggleSubAgents={onToggleSubAgents}
          onToggleMunderDifflin={onToggleMunderDifflin}
          onToggleSlidesStudio={onToggleSlidesStudio}
          onToggleDailyTasks={onToggleDailyTasks}
          onToggleClassroom={onToggleClassroom}
          onToggleMemory={onToggleMemory}
          onToggleKnowledgeGraph={onToggleKnowledgeGraph}
          onToggleJournal={onToggleJournal}
          onToggleStudyPad={onToggleStudyPad}
          onToggleWhiteboard={onToggleWhiteboard}
          onToggleSimulationStudio={onToggleSimulationStudio}
          onToggleSettings={onToggleSettings}
          onToggleShortcuts={onToggleShortcuts}
          onToggleScreenSharing={() => {
            if (isScreenSharing) onStopScreenSharing();
            else onStartScreenSharing();
          }}
          chatHistory={chatHistory}
          studyPadText={studyPadText}
          whiteboardText={whiteboardText}
          isRLStudioOpen={isRLStudioOpen}
          onToggleRLStudio={onToggleRLStudio}
          deficitsCount={deficitsCount}
          isPluginActive={isPluginActive}
          activePluginsCount={activePluginsCount}
          totalPluginsCount={totalPluginsCount}
          isPluginStoreOpen={isPluginStoreOpen}
          onOpenPluginStore={onOpenPluginStore}
          onOpenRoutines={onOpenRoutines}
          onToggleAskMahr={onToggleAskMahr}
          isAskMyraaOpen={isAskMyraaOpen}
        />
      )}

      {/* CORE AVATAR AND VISUALS */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-between py-6 pointer-events-none">
        {/* Invisible spatial spacer to maintain layout balance without any obstructing text */}
        <div className="h-10 sm:h-20" />
      </main>

      {/* Voice & Dialogue Floating Toast Notification Popup */}
      <VoiceDialogueToast
        modelCaption={modelCaption}
        userCaption={userCaption}
        activeSkill={activeSkill}
        state={state}
        onDismiss={onDismissCaptions}
      />

      {/* Global Alerts Floating Toasts */}
      <GlobalAlerts
        errorText={errorText}
        isMicDenied={isMicDenied}
        connectionState={state}
        onDismissError={onDismissError}
      />

      {/* FOOTER INTERFACE WITH DYNAMIC THEME VISUALIZER AND CONTROLS */}
      {!isFocusMode && !showSettings && !showMemoryDashboard && (
        <FooterVisualizer
          session={session}
          state={state}
          themeColor={themeColor}
          voiceConfidence={voiceConfidence}
          isMuted={isMuted}
          isFocusMode={isFocusMode}
          activeSubAgentName={activeSubAgent.name}
          onToggleConnect={onToggleConnect}
          onToggleMute={onToggleMute}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          onOpenWhiteboard={checkPlugin("whiteboard-chalkboard") ? onToggleWhiteboard : undefined}
          onOpenStudyPad={checkPlugin("study-pad") ? onToggleStudyPad : undefined}
          onOpenTasks={checkPlugin("daily-tasks") ? onToggleDailyTasks : undefined}
          onOpenRecalls={checkPlugin("knowledge-graph") ? onToggleKnowledgeGraph : undefined}
          isWakeWordEnabled={isWakeWordEnabled}
          onToggleWakeWord={onToggleWakeWord}
          onOpenOffice={checkPlugin("mahr-office") ? onToggleMunderDifflin : undefined}
          onOpenSlides={checkPlugin("slides-studio") ? onToggleSlidesStudio : undefined}
          onOpenRoutines={checkPlugin("quick-routines") ? onOpenRoutines : undefined}
          onOpenAskMahr={checkPlugin("cute-mascot-chat") ? onToggleAskMahr : undefined}
        />
      )}

      {/* Dynamic Floating Glassmorphic Screen Sharing Control Hub — Lazy mounted only when screen-vision is active & sharing */}
      {checkPlugin("screen-vision") && isScreenSharing && (
        <Suspense fallback={null}>
          <LazyFloatingScreenShareHub
            isScreenSharing={isScreenSharing}
            isScreenSharingPaused={isScreenSharingPaused}
            screenVisionMode={screenVisionMode}
            setScreenVisionMode={setScreenVisionMode}
            onStop={onStopScreenSharing}
            onPause={onPauseScreenSharing}
            onResume={onResumeScreenSharing}
            onSwitch={onSwitchScreenSharing}
            onOpenMagnifier={onOpenMagnifier}
            screenStream={screenStream}
          />
        </Suspense>
      )}

      {/* Cute Mascot Bottom Trigger — Lazy mounted only when cute-mascot-chat extension is active */}
      {checkPlugin("cute-mascot-chat") && (
        <Suspense fallback={null}>
          <LazyMahrCuteMascotTrigger
            isOpen={isAskMyraaOpen}
            onToggle={onToggleAskMahr}
            themeColor={themeColor}
            isRealtimeConnected={state !== "disconnected"}
            activeEmotion={activeEmotion}
            characterState={characterState}
            isSpeaking={state === "speaking"}
            isAiThinking={askMyraaLoading || characterState === "thinking"}
            audioSession={session}
            liveState={state}
            activePage={resolveActiveWorkspacePage({
              isWhiteboardOpen,
              isSimulationStudioOpen,
              isStudyPadOpen,
              isDailyTaskManagerOpen,
              isClassroomOpen,
              showMemoryDashboard,
              showKnowledgeGraph,
              showChatJournal,
              isSlidesStudioOpen,
              isMunderDifflinOpen,
              isSubAgentsStudioOpen,
              isRLStudioOpen,
              showSettings,
            })}
          />
        </Suspense>
      )}

      {/* Modals and auxiliary overlays */}
      {children}
    </div>
  );
};

