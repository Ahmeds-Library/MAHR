import React, { Suspense } from "react";
import { Memory, ChatMessage } from "@lib/memoryTypes";
import { ModelSwitcherModal } from "@components/ModelSwitcherModal";
import { ClassroomAutoSyncToast } from "@/components/classroom/ClassroomAutoSyncToast";
import { KeyboardShortcutsModal } from "@components/KeyboardShortcutsModal";
import { ProactiveTaskReminderToast } from "@components/ProactiveTaskReminderToast";
import { DesktopAndRemoteModal } from "@components/desktop/DesktopAndRemoteModal";
import { UpdateNotificationModal } from "@/components/updater/UpdateNotificationModal";
import { SettingsModal, SettingsTabId } from "@components/settings/SettingsModal";
import { SubAgent, DailyTask } from "@lib/subagentTypes";
import { RLPolicyParameters, KnowledgeDeficit } from "@/services/reinforcementLearningEngine";
import { HumanMoodType, HUMAN_MOOD_CONFIGS } from "@/services/humanEmotionEngine";
import { SystemSettingsState } from "@/services/settingsService";
import { MyraaEmotion } from "@components/MahrCoreVisualizer";
import { InstalledPluginsMap, MahrPluginId } from "@/plugins/layer1_data/pluginTypes";
import { ModelRoutingPolicy, ModelRouteDecision } from "@/modelRouter/layer1_data/modelRouterTypes";
import {
  LazyMemoryDashboard,
  LazyKnowledgeGraphDashboard,
  LazyChatJournal,
  LazyChalkboard,
  LazyStudyPadPanel,
  LazyUniversalSimulationStudio,
  LazyHumanMoodStudio,
  LazyReinforcementLearningStudio,
  LazySubAgentsStudio,
  LazyMAHROfficeModal,
  LazyDailyTaskManager,
  LazyGoogleClassroomHubModal,
  LazyAskMahrModal,
  LazyQuickRoutinesDrawer,
  LazyScreenShareMagnifierModal,
} from "@/plugins/layer2_logic/lazyPluginRegistry";
import { PluginChunkSuspenseFallback } from "@/plugins/layer3_ui/PluginChunkSuspenseFallback";

export interface MahrModalsContainerProps {
  // Plugin hot-swap active guard
  isPluginActive?: (id: MahrPluginId) => boolean;

  // Modal visibility states
  showMemoryDashboard: boolean;
  setShowMemoryDashboard: (v: boolean) => void;
  showKnowledgeGraph: boolean;
  setShowKnowledgeGraph: (v: boolean) => void;
  showChatJournal: boolean;
  setShowChatJournal: (v: boolean) => void;
  isStudyPadOpen: boolean;
  setIsStudyPadOpen: (v: boolean) => void;
  isWhiteboardOpen: boolean;
  setIsWhiteboardOpen: (v: boolean) => void;
  isSimulationStudioOpen: boolean;
  setIsSimulationStudioOpen: (v: boolean) => void;
  isHumanMoodStudioOpen: boolean;
  setIsHumanMoodStudioOpen: (v: boolean) => void;
  isRLStudioOpen: boolean;
  setIsRLStudioOpen: (v: boolean) => void;
  isModelSwitcherOpen: boolean;
  setIsModelSwitcherOpen: (v: boolean) => void;
  isSubAgentsStudioOpen: boolean;
  setIsSubAgentsStudioOpen: (v: boolean) => void;
  isMunderDifflinOpen: boolean;
  setIsMunderDifflinOpen: (v: boolean) => void;
  isDailyTaskManagerOpen: boolean;
  setIsDailyTaskManagerOpen: (v: boolean) => void;
  isClassroomOpen: boolean;
  setIsClassroomOpen: (v: boolean) => void;
  isAskMyraaOpen: boolean;
  setIsAskMyraaOpen: (v: boolean) => void;
  isQuickRoutinesOpen: boolean;
  setIsQuickRoutinesOpen: (v: boolean) => void;
  showKeyboardShortcuts: boolean;
  setShowKeyboardShortcuts: (v: boolean) => void;
  isDesktopRemoteModalOpen: boolean;
  setIsDesktopRemoteModalOpen: (v: boolean) => void;
  isMagnifierOpen: boolean;
  setIsMagnifierOpen: (v: boolean) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  closeAllPanels: () => void;

  // Data & handlers
  memories: Memory[];
  deletedMemoryIds: string[];
  handleAddManualMemory: (category: any, text: string) => Promise<any>;
  handleDeleteMemory: (id: string) => Promise<any>;
  themeColor: string;
  setThemeColor: (t: string) => void;
  chatHistory: ChatMessage[];
  handleClearChatHistory: () => Promise<any>;
  handleClearOldest: () => void;
  chatMaxMessages: number;
  chatRetentionTime: number;

  // Chalkboard
  whiteboardText: string;
  setWhiteboardText: (txt: string) => void;
  whiteboardDiagramType: any;
  setWhiteboardDiagramType: (dt: any) => void;
  whiteboardStatusAlert: string | null;
  whiteboardActiveMode: "canvas" | "text" | "split";
  setWhiteboardActiveMode: (mode: "canvas" | "text" | "split") => void;
  whiteboardDrawings: any;
  setWhiteboardDrawings: (dr: any) => void;
  whiteboardClearCounter: number;
  whiteboardCustomModelData: any;
  handleSaveSimulationMetadata: (...args: any[]) => Promise<any> | void;
  voiceSketchTriggerText: string | null;
  setVoiceSketchTriggerText: (txt: string | null) => void;
  handleVoiceToMindMap: (topic: string, opts?: any) => void;
  handleAskMahrSubmit: (e?: any, forcedPrompt?: string) => void;
  slidesStudioTopic: string;
  setIsSlidesStudioOpen: (v: boolean) => void;

  // Screen share & magnifier
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
  zoomScale: number;
  setZoomScale: (s: number) => void;
  isRulerEnabled: boolean;
  setIsRulerEnabled: (r: boolean) => void;
  magnifierRulerY: number;
  setMagnifierRulerY: (y: number) => void;

  // Study Pad
  studyPadText: string;
  setStudyPadText: (txt: string) => void;
  notesMode: any;
  setNotesMode: (m: any) => void;
  notesStatusAlert: string | null;
  setNotesStatusAlert: (alert: string | null) => void;
  isSavingNotes: boolean;
  handleMemorizeStudyNotes: () => void;
  handleGenerateStudyPack: () => void;
  isGeneratingPack: boolean;
  studyPack: any;
  studySuggestions: Array<{
    topic: string;
    title: string;
    url: string;
    snippet: string;
  }>;
  isFetchingSuggestions: boolean;
  handleFetchSuggestions: () => void;
  notesTextareaRef: any;
  handleConvertToMindMap: (text: string) => void;

  // Simulation Studio
  simulationPrompt: string;

  // Human Mood Studio
  currentHumanMood: HumanMoodType;
  setCurrentHumanMood: (m: HumanMoodType) => void;
  moodShiftReason: string | null;
  autoShiftBackground: boolean;
  handleUpdateSystemSetting: (key: string, value: any) => void;
  speakNotification: (msg: string | { ur?: string; en?: string }, overrideEmotion?: MyraaEmotion) => void;

  // RL Studio
  rlPolicy: RLPolicyParameters;
  setRlPolicy: React.Dispatch<React.SetStateAction<RLPolicyParameters>>;
  saveRLPolicy: (p: RLPolicyParameters) => void;
  knowledgeDeficits: KnowledgeDeficit[];
  setKnowledgeDeficits: React.Dispatch<React.SetStateAction<KnowledgeDeficit[]>>;
  saveKnowledgeDeficits: (d: KnowledgeDeficit[]) => void;

  // Model & Subagent Switcher
  activeModelId: string;
  handleSelectModel: (id: string) => void;
  activeSubAgent: SubAgent;
  handleSelectSubAgent: (agent: SubAgent) => void;
  customSubAgents: SubAgent[];
  handleCreateCustomSubAgent: (data: Omit<SubAgent, "id">) => void;
  handleDeleteCustomSubAgent: (id: string) => void;

  // Office
  isBrowser: boolean;
  setWhiteboardStatusAlert: (a: string | null) => void;

  // Daily Tasks (Google & Local)
  googleDailyTasks: DailyTask[];
  handleAddDailyTask: (task: Omit<DailyTask, "id" | "createdAt">) => Promise<any>;
  handleToggleDailyTask: (id: string) => Promise<any>;
  handleDeleteDailyTask: (id: string) => Promise<any>;
  handleUpdateDailyTask: (task: DailyTask) => Promise<any>;
  isGoogleTasksConnected: boolean;
  googleTasksUserEmail: string | null;
  googleTasksUserName: string | null;
  googleTaskLists: any[];
  googleActiveListId?: string;
  activeListId?: string;
  isGoogleTasksSyncing?: boolean;
  isSyncing?: boolean;
  googleTasksLastSyncedAt?: string | null;
  lastSyncedAt?: string | null;
  switchGoogleTaskList?: (id: string) => void;
  onSwitchList?: (id: string) => void;
  createGoogleTaskList?: (title: string) => Promise<any>;
  onCreateTaskList?: (title: string) => Promise<any>;
  refreshGoogleTasks?: () => void;
  onRefresh?: () => void;
  connectGoogleForTasks?: () => void;
  onConnectGoogle?: () => void;
  clearCompletedGoogleTasks?: () => void;
  onClearCompleted?: () => void;

  // Google Classroom
  handleStudyClassroomAssignment: (assignment: any, text: string) => void;
  classroomBackgroundSync: any;

  // Ask Mahr
  askMyraaInput: string;
  setAskMyraaInput: (txt: string) => void;
  askMyraaLoading: boolean;
  includeScreenSnapshot: boolean;
  setIncludeScreenSnapshot: (inc: boolean) => void;
  isAutoSpeakEnabled: boolean;
  setIsAutoSpeakEnabled: (enb: boolean) => void;
  pendingImages: string[];
  setPendingImages: React.Dispatch<React.SetStateAction<string[]>>;
  activeActionMode?: "auto" | "whiteboard" | "code" | "slides" | "memory";
  setActiveActionMode?: (mode: "auto" | "whiteboard" | "code" | "slides" | "memory") => void;
  isVectorRecalling?: boolean;
  handleSendCodeToChalkboard?: (code: string, lang?: string) => void;
  liveState: "disconnected" | "connecting" | "listening" | "speaking";

  // Routines & System Settings
  handleRunMahrRoutine?: (routineId: string) => void;
  appUpdater: any;
  currentSystemSettings: SystemSettingsState;
  handleExecuteVoiceShortcut: (cmd: any) => void;
  handleToggleConnection: () => void;
  activeProactiveTask: DailyTask | null;
  setActiveProactiveTask: (task: DailyTask | null) => void;
  resetAllSettingsDefaults: () => void;
  settingsInitialTab?: SettingsTabId;
  pluginsMap?: InstalledPluginsMap;
  activePluginsCount?: number;
  installedPluginsCount?: number;
  totalAvailablePluginsCount?: number;
  isPureVoiceMode?: boolean;
  activeMemoryKb?: number;
  dormantSavedKb?: number;
  onInstallPlugin?: (id: MahrPluginId) => void;
  onUninstallPlugin?: (id: MahrPluginId) => void;
  onTogglePluginEnabled?: (id: MahrPluginId) => void;
  onApplyPluginBundle?: (bundleId: string) => void;
  onInstallAllPlugins?: () => void;
  onResetToPureVoiceAgent?: () => void;
  onOpenPluginFeature?: (id: MahrPluginId) => void;
  routingPolicy?: ModelRoutingPolicy;
  currentModelDecision?: ModelRouteDecision;
  autoShiftCount?: number;
  fallbackTriggerCount?: number;
  onUpdateRoutingPolicy?: (policy: ModelRoutingPolicy, overrideModelId?: string | null) => void;
  onSimulateFallback?: (failedModelId: string, reason?: string) => void;
}

export const MahrModalsContainer: React.FC<MahrModalsContainerProps> = ({
  isPluginActive,
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
  showSettings,
  setShowSettings,
  closeAllPanels,

  memories,
  deletedMemoryIds,
  handleAddManualMemory,
  handleDeleteMemory,
  themeColor,
  setThemeColor,
  chatHistory,
  handleClearChatHistory,
  handleClearOldest,
  chatMaxMessages,
  chatRetentionTime,

  whiteboardText,
  setWhiteboardText,
  whiteboardDiagramType,
  valueWhiteboardDiagramType: _unused,
  whiteboardStatusAlert,
  whiteboardActiveMode,
  setWhiteboardActiveMode,
  whiteboardDrawings,
  setWhiteboardDrawings,
  whiteboardClearCounter,
  whiteboardCustomModelData,
  handleSaveSimulationMetadata,
  voiceSketchTriggerText,
  setVoiceSketchTriggerText,
  handleVoiceToMindMap,
  handleAskMahrSubmit,
  slidesStudioTopic,
  setIsSlidesStudioOpen,

  isScreenSharing,
  screenStream,
  zoomScale,
  setZoomScale,
  isRulerEnabled,
  setIsRulerEnabled,
  magnifierRulerY,
  setMagnifierRulerY,

  studyPadText,
  setStudyPadText,
  notesMode,
  setNotesMode,
  notesStatusAlert,
  setNotesStatusAlert,
  isSavingNotes,
  handleMemorizeStudyNotes,
  handleGenerateStudyPack,
  isGeneratingPack,
  studyPack,
  studySuggestions,
  isFetchingSuggestions,
  handleFetchSuggestions,
  notesTextareaRef,
  handleConvertToMindMap,

  simulationPrompt,

  currentHumanMood,
  setCurrentHumanMood,
  moodShiftReason,
  autoShiftBackground,
  handleUpdateSystemSetting,
  speakNotification,

  rlPolicy,
  setRlPolicy,
  saveRLPolicy,
  knowledgeDeficits,
  setKnowledgeDeficits,
  saveKnowledgeDeficits,

  activeModelId,
  handleSelectModel,
  activeSubAgent,
  handleSelectSubAgent,
  customSubAgents,
  handleCreateCustomSubAgent,
  handleDeleteCustomSubAgent,

  isBrowser,
  setWhiteboardStatusAlert,

  googleDailyTasks,
  handleAddDailyTask,
  handleToggleDailyTask,
  handleDeleteDailyTask,
  handleUpdateDailyTask,
  isGoogleTasksConnected,
  googleTasksUserEmail,
  googleTasksUserName,
  googleTaskLists,
  googleActiveListId,
  activeListId,
  isGoogleTasksSyncing,
  isSyncing,
  googleTasksLastSyncedAt,
  lastSyncedAt,
  switchGoogleTaskList,
  onSwitchList,
  createGoogleTaskList,
  onCreateTaskList,
  refreshGoogleTasks,
  onRefresh,
  connectGoogleForTasks,
  onConnectGoogle,
  clearCompletedGoogleTasks,
  onClearCompleted,

  handleStudyClassroomAssignment,
  classroomBackgroundSync,

  askMyraaInput,
  setAskMyraaInput,
  askMyraaLoading,
  includeScreenSnapshot,
  setIncludeScreenSnapshot,
  isAutoSpeakEnabled,
  setIsAutoSpeakEnabled,
  pendingImages,
  setPendingImages,
  activeActionMode,
  setActiveActionMode,
  isVectorRecalling,
  handleSendCodeToChalkboard,
  liveState,

  handleRunMahrRoutine,
  appUpdater,
  currentSystemSettings,
  handleExecuteVoiceShortcut,
  handleToggleConnection,
  activeProactiveTask,
  setActiveProactiveTask,
  resetAllSettingsDefaults,
  settingsInitialTab,
  pluginsMap,
  activePluginsCount,
  installedPluginsCount,
  totalAvailablePluginsCount,
  isPureVoiceMode,
  activeMemoryKb,
  dormantSavedKb,
  onInstallPlugin,
  onUninstallPlugin,
  onTogglePluginEnabled,
  onApplyPluginBundle,
  onInstallAllPlugins,
  onResetToPureVoiceAgent,
  onOpenPluginFeature,
  routingPolicy,
  currentModelDecision,
  autoShiftCount,
  fallbackTriggerCount,
  onUpdateRoutingPolicy,
  onSimulateFallback,
}: MahrModalsContainerProps & { valueWhiteboardDiagramType?: any }) => {
  const checkPlugin = (id: MahrPluginId) => (isPluginActive ? isPluginActive(id) : true);
  const activeMemories = memories.filter((m) => m && m.id && !deletedMemoryIds.includes(m.id));

  const syncedAskMyraaMessages =
    chatHistory && chatHistory.length > 0
      ? chatHistory.map((item) => {
          let formattedTime = "";
          if (item.timestamp) {
            if (item.timestamp.includes("T")) {
              formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            } else {
              formattedTime = item.timestamp;
            }
          } else {
            formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }
          return {
            id: item.id,
            sender: (item.role === "user" ? "user" : "mahr") as "user" | "mahr",
            text: item.text,
            timestamp: formattedTime,
            actionExecuted: item.actionExecuted,
            groundingSources: item.groundingSources,
            searchQueries: item.searchQueries,
            mediaItems: item.mediaItems,
            attachedImages: item.attachedImages,
            memoryRecalledCount: item.memoryRecalledCount,
            memoryRecalledLabels: item.memoryRecalledLabels,
            memorySavedTitle: item.memorySavedTitle,
            codeSentToChalkboard: item.codeSentToChalkboard,
            modeUsed: item.modeUsed,
          };
        })
      : [];

  return (
    <>
      {/* Unified Recall & Vector Memory Hub — Opens by default when clicking 'Recall' in header */}
      {showMemoryDashboard && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Recall & Vector Memory..." />}>
          <LazyMemoryDashboard
            isOpen={showMemoryDashboard}
            onClose={() => setShowMemoryDashboard(false)}
            memories={activeMemories}
            onAddMemory={handleAddManualMemory}
            onDeleteMemory={handleDeleteMemory}
            themeColor={themeColor}
            chatHistory={chatHistory}
            onShiftToJournal={() => {
              setShowMemoryDashboard(false);
              setShowChatJournal(true);
            }}
            onOpenKnowledgeGraph={() => {
              setShowMemoryDashboard(false);
              setShowKnowledgeGraph(true);
            }}
            rlPolicy={rlPolicy}
            knowledgeDeficits={knowledgeDeficits}
            studyPadText={studyPadText}
            whiteboardText={whiteboardText}
          />
        </Suspense>
      )}

      {/* MAHR × Obsidian Second-Brain Vault & Graph Studio — Mounted on-demand when opened from Recall or voice */}
      {showKnowledgeGraph && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Obsidian Second-Brain Vault..." />}>
          <LazyKnowledgeGraphDashboard
            isOpen={showKnowledgeGraph}
            onClose={() => setShowKnowledgeGraph(false)}
            themeColor={themeColor}
            memories={activeMemories}
            chatHistory={chatHistory}
            studyPadText={studyPadText}
            whiteboardText={whiteboardText}
          />
        </Suspense>
      )}

      {/* Conversation Journal — Shifted to via the top-right corner button inside Recall */}
      {showChatJournal && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Conversation Journal..." />}>
          <LazyChatJournal
            isOpen={showChatJournal}
            onClose={() => setShowChatJournal(false)}
            chatHistory={chatHistory}
            onClearHistory={handleClearChatHistory}
            themeColor={themeColor}
            chatMaxMessages={chatMaxMessages}
            chatRetentionTime={chatRetentionTime}
            onClearOldest={handleClearOldest}
            memories={activeMemories}
            onAddMemory={handleAddManualMemory}
            onShiftToRecall={() => {
              setShowChatJournal(false);
              setShowMemoryDashboard(true);
            }}
          />
        </Suspense>
      )}

      {/* Classroom Whiteboard & Slides Suite — Mounted on-demand only when whiteboard or slides-studio is active & open */}
      {(whiteboardDiagramType === "slides" || checkPlugin("whiteboard-chalkboard") || checkPlugin("slides-studio")) && isWhiteboardOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Chalkboard & Code Lab..." />}>
          <LazyChalkboard
            isOpen={isWhiteboardOpen}
            onClose={() => setIsWhiteboardOpen(false)}
            text={whiteboardText}
            onTextChange={setWhiteboardText}
            diagramType={whiteboardDiagramType}
            statusAlert={whiteboardStatusAlert}
            activeMode={whiteboardActiveMode}
            setActiveMode={setWhiteboardActiveMode}
            themeColor={themeColor}
            drawings={whiteboardDrawings}
            onUpdateDrawings={setWhiteboardDrawings}
            clearCounter={whiteboardClearCounter}
            customModelData={whiteboardCustomModelData}
            memories={activeMemories}
            onTriggerSaveSimulation={handleSaveSimulationMetadata}
            voiceSketchTriggerText={voiceSketchTriggerText}
            onClearVoiceSketchTrigger={() => setVoiceSketchTriggerText(null)}
            onVoiceToMindMap={(topic) => handleVoiceToMindMap(topic, { autoSpeakFeedback: true })}
            onAskMahr={(question) => {
              setIsAskMyraaOpen(true);
              if (question) handleAskMahrSubmit(undefined, question);
            }}
            onAskMyraa={(question) => {
              setIsAskMyraaOpen(true);
              if (question) handleAskMahrSubmit(undefined, question);
            }}
            initialSlidesTopic={slidesStudioTopic}
          />
        </Suspense>
      )}

      {/* Interactive Screen Share Magnifier & Reading Focus Ruler */}
      {checkPlugin("screen-vision") && isMagnifierOpen && isScreenSharing && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Focus Magnifier..." />}>
          <LazyScreenShareMagnifierModal
            isOpen={isMagnifierOpen && isScreenSharing}
            onClose={() => setIsMagnifierOpen(false)}
            screenStream={screenStream}
            zoomScale={zoomScale}
            setZoomScale={setZoomScale}
            isRulerEnabled={isRulerEnabled}
            setIsRulerEnabled={setIsRulerEnabled}
            magnifierRulerY={magnifierRulerY}
            setMagnifierRulerY={setMagnifierRulerY}
          />
        </Suspense>
      )}

      {/* Interactive Exam Pad / Study Notes Drawer */}
      {checkPlugin("study-pad") && isStudyPadOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Study Pad..." />}>
          <LazyStudyPadPanel
            isOpen={isStudyPadOpen}
            onClose={() => setIsStudyPadOpen(false)}
            studyPadText={studyPadText}
            setStudyPadText={setStudyPadText}
            notesMode={notesMode}
            setNotesMode={setNotesMode}
            notesStatusAlert={notesStatusAlert}
            isSavingNotes={isSavingNotes}
            onSaveNotesToMemory={handleMemorizeStudyNotes}
            onGenerateStudyPack={handleGenerateStudyPack}
            isGeneratingPack={isGeneratingPack}
            studyPack={studyPack || { flashcards: [], mcqs: [] }}
            studySuggestions={studySuggestions}
            isFetchingSuggestions={isFetchingSuggestions}
            onFetchSuggestions={handleFetchSuggestions}
            notesTextareaRef={notesTextareaRef}
            chatHistory={chatHistory}
            whiteboardText={whiteboardText}
            onConvertToMindMap={handleConvertToMindMap}
          />
        </Suspense>
      )}

      {/* Universal AI Simulation Engine Studio */}
      {checkPlugin("simulation-studio") && isSimulationStudioOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting 3D Simulation Engine..." />}>
          <LazyUniversalSimulationStudio
            isOpen={isSimulationStudioOpen}
            onClose={() => setIsSimulationStudioOpen(false)}
            initialPrompt={simulationPrompt}
            onAskMyraa={() => {
              setIsSimulationStudioOpen(false);
              setIsAskMyraaOpen(true);
            }}
          />
        </Suspense>
      )}

      {/* Human Mood & Emotion Psychology Studio Modal */}
      {checkPlugin("cognitive-labs") && isHumanMoodStudioOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Cognitive Labs..." />}>
          <LazyHumanMoodStudio
            isOpen={isHumanMoodStudioOpen}
            onClose={() => setIsHumanMoodStudioOpen(false)}
            currentMood={currentHumanMood}
            onSelectMood={(mood, triggerVoiceSample) => {
              setCurrentHumanMood(mood);
              const moodCfg = HUMAN_MOOD_CONFIGS[mood];
              if (moodCfg?.themeId) {
                setThemeColor(moodCfg.themeId);
              }
              if (triggerVoiceSample && moodCfg) {
                const phrase =
                  moodCfg.samplePhrases[0]?.english ||
                  moodCfg.samplePhrases[0]?.romanUrdu ||
                  moodCfg.description;
                speakNotification(phrase, moodCfg.emotionEquivalent);
              }
            }}
            onSpeakSamplePhrase={(text, mood) => {
              const moodCfg = HUMAN_MOOD_CONFIGS[mood];
              speakNotification(text, moodCfg?.emotionEquivalent || "idle");
            }}
            moodShiftReason={moodShiftReason}
            autoShiftBackground={autoShiftBackground}
            onToggleAutoShift={() =>
              handleUpdateSystemSetting("autoShiftBackground", !autoShiftBackground)
            }
          />
        </Suspense>
      )}

      {/* Reinforcement Learning & Self-Improvement Growth Lab Modal */}
      {checkPlugin("cognitive-labs") && isRLStudioOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting RL Growth Lab..." />}>
          <LazyReinforcementLearningStudio
            isOpen={isRLStudioOpen}
            onClose={() => setIsRLStudioOpen(false)}
            policy={rlPolicy}
            onUpdatePolicy={(newPolicy) => {
              setRlPolicy(newPolicy);
              saveRLPolicy(newPolicy);
            }}
            deficits={knowledgeDeficits}
            onUpdateDeficits={(updated) => {
              setKnowledgeDeficits(updated);
              saveKnowledgeDeficits(updated);
            }}
            onResolveDeficit={(id, notes) => {
              setKnowledgeDeficits((prev) => {
                const updated = prev.map((d) =>
                  d.id === id
                    ? {
                        ...d,
                        status: "resolved" as const,
                        resolvedAt: new Date().toISOString(),
                        resolutionNotes: notes,
                      }
                    : d
                );
                saveKnowledgeDeficits(updated);
                return updated;
              });
            }}
            onDeleteDeficit={(id) => {
              setKnowledgeDeficits((prev) => {
                const updated = prev.filter((d) => d.id !== id);
                saveKnowledgeDeficits(updated);
                return updated;
              });
            }}
            themeColor={themeColor}
          />
        </Suspense>
      )}

      {/* Model Switcher Modal (Core Assistant Control) */}
      <ModelSwitcherModal
        isOpen={isModelSwitcherOpen}
        onClose={() => setIsModelSwitcherOpen(false)}
        activeModelId={activeModelId}
        onSelectModel={handleSelectModel}
        themeColor={themeColor}
        chatHistory={chatHistory}
        studyPadText={studyPadText}
        whiteboardText={whiteboardText}
      />

      {/* Sub-Agents Studio & Orchestrator Modal */}
      {checkPlugin("subagents-studio") && isSubAgentsStudioOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Persona Studio..." />}>
          <LazySubAgentsStudio
            isOpen={isSubAgentsStudioOpen}
            onClose={() => setIsSubAgentsStudioOpen(false)}
            activeSubAgentId={activeSubAgent.id}
            onSelectSubAgent={handleSelectSubAgent}
            customSubAgents={customSubAgents}
            onCreateSubAgent={handleCreateCustomSubAgent}
            onDeleteCustomSubAgent={handleDeleteCustomSubAgent}
            themeColor={themeColor}
          />
        </Suspense>
      )}

      {/* MAHR Office — Multi-Agent Virtual Office Floor Modal */}
      {checkPlugin("mahr-office") && isMunderDifflinOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Virtual Office Floor..." />}>
          <LazyMAHROfficeModal
            isOpen={isMunderDifflinOpen}
            onClose={() => setIsMunderDifflinOpen(false)}
            isBrowser={isBrowser}
            activeModelId={activeModelId}
            onSelectModel={handleSelectModel}
            onUpdateWhiteboardText={setWhiteboardText}
            onUpdateStudyPadText={setStudyPadText}
            onNotifyUser={(msg) => setWhiteboardStatusAlert(`🏢 ${msg}`)}
          />
        </Suspense>
      )}

      {/* Daily Task & Memory Tracker Modal (Google Tasks API & Local) */}
      {checkPlugin("daily-tasks") && isDailyTaskManagerOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Daily Tasks..." />}>
          <LazyDailyTaskManager
            isOpen={isDailyTaskManagerOpen}
            onClose={() => setIsDailyTaskManagerOpen(false)}
            tasks={googleDailyTasks}
            onAddTask={handleAddDailyTask}
            onToggleTask={handleToggleDailyTask}
            onDeleteTask={handleDeleteDailyTask}
            onUpdateTask={handleUpdateDailyTask}
            isGoogleConnected={isGoogleTasksConnected}
            userEmail={googleTasksUserEmail}
            userName={googleTasksUserName}
            taskLists={googleTaskLists}
            activeListId={googleActiveListId || activeListId || ""}
            isSyncing={isGoogleTasksSyncing ?? isSyncing ?? false}
            lastSyncedAt={googleTasksLastSyncedAt ?? lastSyncedAt ?? null}
            onSwitchList={switchGoogleTaskList || onSwitchList || (() => {})}
            onCreateTaskList={createGoogleTaskList || onCreateTaskList || (async () => {})}
            onRefresh={refreshGoogleTasks || onRefresh || (() => {})}
            onConnectGoogle={connectGoogleForTasks || onConnectGoogle || (() => {})}
            onClearCompleted={clearCompletedGoogleTasks || onClearCompleted || (() => {})}
          />
        </Suspense>
      )}

      {/* Google Classroom Hub & Interactive Homework Tutor Modal */}
      {checkPlugin("google-classroom") && isClassroomOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Google Classroom Hub..." />}>
          <LazyGoogleClassroomHubModal
            isOpen={isClassroomOpen}
            onClose={() => setIsClassroomOpen(false)}
            onStudyAssignment={handleStudyClassroomAssignment}
          />
        </Suspense>
      )}

      {/* Classroom Autonomous Auto-Sync Alert Toast */}
      {checkPlugin("google-classroom") && (
        <ClassroomAutoSyncToast
          notice={classroomBackgroundSync.lastSyncNotice}
          onDismiss={classroomBackgroundSync.dismissNotice}
          onOpenClassroom={() => setIsClassroomOpen(true)}
          onOpenTasks={() => setIsDailyTaskManagerOpen(true)}
        />
      )}

      {/* Ask MAHR Interactive Text Console Modal */}
      {checkPlugin("cute-mascot-chat") && isAskMyraaOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Ask MAHR Chat Console..." />}>
          <LazyAskMahrModal
            isOpen={isAskMyraaOpen}
            onClose={() => setIsAskMyraaOpen(false)}
            messages={syncedAskMyraaMessages}
            input={askMyraaInput}
            onInputChange={setAskMyraaInput}
            onSubmit={handleAskMahrSubmit}
            isLoading={askMyraaLoading}
            activeSubAgentName={activeSubAgent.name}
            activeModelId={activeModelId}
            themeColor={themeColor}
            isScreenSharing={isScreenSharing}
            isRealtimeConnected={liveState !== "disconnected"}
            includeScreenSnapshot={includeScreenSnapshot}
            onToggleScreenSnapshot={setIncludeScreenSnapshot}
            isAutoSpeakEnabled={isAutoSpeakEnabled}
            onToggleAutoSpeak={setIsAutoSpeakEnabled}
            pendingImages={pendingImages}
            onAddPendingImage={(base64) => setPendingImages((prev) => [...prev, base64])}
            onRemovePendingImage={(idx) => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
            vectorMemoryCount={activeMemories.length}
            isVectorRecalling={isVectorRecalling}
            activeActionMode={activeActionMode}
            onActionModeChange={setActiveActionMode}
            onSendCodeToChalkboard={handleSendCodeToChalkboard}
            onClearChat={handleClearChatHistory}
          />
        </Suspense>
      )}

      {/* Keyboard Shortcuts Hotkeys Modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        onToggleSession={handleToggleConnection}
        isSessionActive={liveState !== "disconnected"}
        onToggleAskMyraa={() => setIsAskMyraaOpen(!isAskMyraaOpen)}
        onToggleWhiteboard={() => {
          closeAllPanels();
          setIsWhiteboardOpen(!isWhiteboardOpen);
        }}
        onToggleStudyPad={() => {
          closeAllPanels();
          setIsStudyPadOpen(!isStudyPadOpen);
        }}
        onToggleJournal={() => {
          closeAllPanels();
          setShowChatJournal(!showChatJournal);
        }}
        onToggleMemory={() => {
          closeAllPanels();
          setShowMemoryDashboard(!showMemoryDashboard);
        }}
        onToggleDailyTasks={() => {
          closeAllPanels();
          setIsDailyTaskManagerOpen(!isDailyTaskManagerOpen);
        }}
        onToggleSubAgents={() => {
          closeAllPanels();
          setIsSubAgentsStudioOpen(!isSubAgentsStudioOpen);
        }}
        onToggleSettings={() => {
          closeAllPanels();
          setShowSettings(!showSettings);
        }}
        onToggleModelSwitcher={() => {
          closeAllPanels();
          setIsModelSwitcherOpen(!isModelSwitcherOpen);
        }}
        themeColor={themeColor}
      />

      {/* Proactive Task Reminder Floating Toast */}
      <ProactiveTaskReminderToast
        task={activeProactiveTask}
        onDismiss={() => setActiveProactiveTask(null)}
        onCompleteTask={handleToggleDailyTask}
        themeColor={themeColor}
      />

      {/* Cross-Platform Native Desktop & Remote Web Connect Modal */}
      <DesktopAndRemoteModal
        isOpen={isDesktopRemoteModalOpen}
        onClose={() => setIsDesktopRemoteModalOpen(false)}
        activeModelName={activeModelId}
        isLiveActive={liveState !== "disconnected"}
      />

      {/* Mahr Smart Routines Drawer */}
      {checkPlugin("quick-routines") && isQuickRoutinesOpen && (
        <Suspense fallback={<PluginChunkSuspenseFallback label="Mounting Smart Routines..." />}>
          <LazyQuickRoutinesDrawer
            isOpen={isQuickRoutinesOpen}
            onClose={() => setIsQuickRoutinesOpen(false)}
            onRunRoutine={handleRunMahrRoutine || (() => {})}
            onOpenOffice={() => {
              closeAllPanels();
              setIsMunderDifflinOpen(true);
            }}
            onOpenChalkboard={() => {
              closeAllPanels();
              setIsWhiteboardOpen(true);
            }}
            onOpenTasks={() => {
              closeAllPanels();
              setIsDailyTaskManagerOpen(true);
            }}
            onOpenMemories={() => {
              closeAllPanels();
              setShowMemoryDashboard(true);
            }}
            onOpenSlides={() => {
              closeAllPanels();
              setIsSlidesStudioOpen(true);
            }}
          />
        </Suspense>
      )}

      {/* Autonomous GitHub Actions Auto-Updater Dialog */}
      <UpdateNotificationModal
        isOpen={appUpdater.isModalOpen}
        onClose={appUpdater.closeModal}
        status={appUpdater.status}
        updateInfo={appUpdater.updateInfo}
        downloadProgress={appUpdater.downloadProgress}
        errorMessage={appUpdater.errorMessage}
        onStartDownload={appUpdater.startDownload}
        onInstallAndRestart={appUpdater.installAndRestart}
      />

      {/* Central System Settings & Workspace Hub Modal Dialogue */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={currentSystemSettings}
        onUpdateSetting={handleUpdateSystemSetting}
        onExecuteCommand={handleExecuteVoiceShortcut}
        onResetAllSettings={resetAllSettingsDefaults}
        speakNotification={speakNotification}
        onStatusAlert={(msg) => {
          setNotesStatusAlert(msg);
          setTimeout(() => setNotesStatusAlert(null), 3500);
        }}
        initialTab={settingsInitialTab}
        pluginsMap={pluginsMap}
        activePluginsCount={activePluginsCount}
        installedPluginsCount={installedPluginsCount}
        totalAvailablePluginsCount={totalAvailablePluginsCount}
        isPureVoiceMode={isPureVoiceMode}
        activeMemoryKb={activeMemoryKb}
        dormantSavedKb={dormantSavedKb}
        onInstallPlugin={onInstallPlugin}
        onUninstallPlugin={onUninstallPlugin}
        onTogglePluginEnabled={onTogglePluginEnabled}
        onApplyPluginBundle={onApplyPluginBundle}
        onInstallAllPlugins={onInstallAllPlugins}
        onResetToPureVoiceAgent={onResetToPureVoiceAgent}
        onOpenPluginFeature={onOpenPluginFeature}
        activeModelId={activeModelId}
        onSelectModel={handleSelectModel}
        routingPolicy={routingPolicy}
        currentModelDecision={currentModelDecision}
        autoShiftCount={autoShiftCount}
        fallbackTriggerCount={fallbackTriggerCount}
        onUpdateRoutingPolicy={onUpdateRoutingPolicy}
        onSimulateFallback={onSimulateFallback}
      />
    </>
  );
};

