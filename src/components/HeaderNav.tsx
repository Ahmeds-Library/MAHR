import { useState, useRef, useEffect, useMemo } from "react";
import { Cpu, Bot, Calendar, Brain, MessageSquare, BookOpen, PenTool, Compass, Settings, Monitor, Menu, X, Sparkles, Keyboard, Palette, Network, Orbit, Check, BrainCircuit, Building2, Globe, Download, Presentation, GraduationCap, Puzzle } from "lucide-react";
import { SUPPORTED_AI_MODELS, AIModelConfig, SubAgent, DailyTask } from "../lib/subagentTypes";
import { ChatMessage } from "../lib/memoryTypes";
import { PsychologyProfile } from "../services/colorPsychologyEngine";
import { formatTokenCount, estimateActiveContextTokens } from "../lib/tokenUtils";
import { THEME_COLOR_CONFIGS, getThemeConfig } from "../services/themeService";
import { HumanMoodType, HUMAN_MOOD_CONFIGS } from "../services/humanEmotionEngine";
import { MahrEmblemLogo } from "./brand/MahrEmblemLogo";
import { UpdateStatusBadge } from "./updater/UpdateStatusBadge";
import { DEB_FILENAME, EXE_FILENAME, APP_VERSION } from "../config/appVersion";
import { MahrPluginId } from "../plugins/layer1_data/pluginTypes";

interface HeaderNavProps {
  activeModelId: string;
  activeSubAgent: SubAgent;
  dailyTasks: DailyTask[];
  offlineDeletedQueueLength: number;
  showMemoryDashboard: boolean;
  showKnowledgeGraph?: boolean;
  showChatJournal: boolean;
  isStudyPadOpen: boolean;
  isWhiteboardOpen: boolean;
  isSimulationStudioOpen?: boolean;
  showSettings: boolean;
  showShortcuts?: boolean;
  isScreenSharing: boolean;
  isScreenSharingPaused: boolean;
  isModelSwitcherOpen: boolean;
  isSubAgentsStudioOpen: boolean;
  isDailyTaskManagerOpen: boolean;
  isClassroomOpen?: boolean;
  isMunderDifflinOpen?: boolean;
  isSlidesStudioOpen?: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onToggleModelSwitcher: () => void;
  onToggleSubAgents: () => void;
  onToggleDailyTasks: () => void;
  onToggleClassroom?: () => void;
  onToggleMunderDifflin?: () => void;
  onToggleSlidesStudio?: () => void;
  onToggleMemory: () => void;
  onToggleKnowledgeGraph?: () => void;
  onToggleJournal: () => void;
  onToggleStudyPad: () => void;
  onToggleWhiteboard: () => void;
  onToggleSimulationStudio?: () => void;
  onToggleSettings: () => void;
  onToggleShortcuts?: () => void;
  onToggleScreenSharing: () => void;
  onOpenDesktopRemoteModal?: () => void;
  chatHistory?: ChatMessage[];
  studyPadText?: string;
  whiteboardText?: string;
  psychologyProfile?: PsychologyProfile;
  autoShiftBackground?: boolean;
  themeColor?: string;
  onSelectThemeColor?: (color: string) => void;
  onToggleAutoShift?: () => void;
  currentHumanMood?: HumanMoodType;
  onToggleHumanMoodStudio?: () => void;
  isRLStudioOpen?: boolean;
  onToggleRLStudio?: () => void;
  deficitsCount?: number;
  hasUpdate?: boolean;
  latestVersion?: string;
  updaterStatus?: any;
  lastCheckedAt?: string | null;
  onOpenUpdateModal?: () => void;
  isPluginActive?: (id: MahrPluginId) => boolean;
  activePluginsCount?: number;
  totalPluginsCount?: number;
  isPluginStoreOpen?: boolean;
  onOpenPluginStore?: () => void;
  onOpenRoutines?: () => void;
  onToggleAskMahr?: () => void;
  isAskMyraaOpen?: boolean;
}

export const HeaderNav = ({
  activeModelId,
  activeSubAgent,
  dailyTasks,
  offlineDeletedQueueLength,
  showMemoryDashboard,
  showKnowledgeGraph = false,
  showChatJournal,
  isStudyPadOpen,
  isWhiteboardOpen,
  isSimulationStudioOpen = false,
  showSettings,
  showShortcuts = false,
  isScreenSharing,
  isScreenSharingPaused,
  isModelSwitcherOpen,
  isSubAgentsStudioOpen,
  isDailyTaskManagerOpen,
  isClassroomOpen = false,
  isMunderDifflinOpen = false,
  isSlidesStudioOpen = false,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  hasUpdate = false,
  latestVersion,
  updaterStatus,
  lastCheckedAt,
  onOpenUpdateModal,
  onToggleModelSwitcher,
  onToggleSubAgents,
  onToggleDailyTasks,
  onToggleClassroom,
  onToggleMunderDifflin,
  onToggleSlidesStudio,
  onToggleMemory,
  onToggleKnowledgeGraph,
  onToggleJournal,
  onToggleStudyPad,
  onToggleWhiteboard,
  onToggleSimulationStudio,
  onToggleSettings,
  onToggleShortcuts,
  onToggleScreenSharing,
  onOpenDesktopRemoteModal,
  chatHistory = [],
  studyPadText = "",
  whiteboardText = "",
  psychologyProfile,
  autoShiftBackground = true,
  themeColor = "violet",
  onSelectThemeColor,
  onToggleAutoShift,
  currentHumanMood = "neutral",
  onToggleHumanMoodStudio,
  isRLStudioOpen = false,
  onToggleRLStudio,
  deficitsCount = 0,
  isPluginActive,
  activePluginsCount = 0,
  totalPluginsCount = 15,
  isPluginStoreOpen = false,
  onOpenPluginStore,
  onOpenRoutines,
  onToggleAskMahr,
  isAskMyraaOpen = false,
}) => {
  const checkPlugin = (id: MahrPluginId) => (isPluginActive ? isPluginActive(id) : true);
  const [isAtmosphereMenuOpen, setIsAtmosphereMenuOpen] = useState(false);
  const atmosphereMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (atmosphereMenuRef.current && !atmosphereMenuRef.current.contains(e.target as Node)) {
        setIsAtmosphereMenuOpen(false);
      }
    };
    if (isAtmosphereMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isAtmosphereMenuOpen]);

  const activeTheme = getThemeConfig(themeColor);
  const moodConfig = HUMAN_MOOD_CONFIGS[currentHumanMood] || HUMAN_MOOD_CONFIGS.neutral;

  // Real-time Available Models Tracking
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>(() => {
    try {
      const cached = sessionStorage.getItem("myraa_api_models");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return SUPPORTED_AI_MODELS;
  });

  useEffect(() => {
    const handleModelsUpdate = (e: any) => {
      if (e.detail?.models && Array.isArray(e.detail.models)) {
        setAvailableModels(e.detail.models);
      }
    };
    window.addEventListener("myraa-models-updated", handleModelsUpdate);
    return () => window.removeEventListener("myraa-models-updated", handleModelsUpdate);
  }, []);

  const activeModel = useMemo(() => {
    return availableModels.find(m => m.id === activeModelId) || 
      SUPPORTED_AI_MODELS.find(m => m.id === activeModelId) || 
      {
        id: activeModelId,
        name: activeModelId,
        contextTokens: 1048576,
        inputTokenLimit: 1048576,
        contextWindow: "1,048,576 Tokens",
        description: "",
        isRecommendedForLongChats: true,
        tag: "Active",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40"
      };
  }, [availableModels, activeModelId]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const todayTasks = useMemo(() => {
    return dailyTasks.filter(
      (t) => t.date === todayStr || (!t.completed && (!t.date || t.date <= todayStr))
    );
  }, [dailyTasks, todayStr]);

  const completedTodayTasksCount = useMemo(() => {
    return todayTasks.filter((t) => t.completed).length;
  }, [todayTasks]);

  const completedTasksCount = dailyTasks.filter(t => t.completed).length;

  // Detect user platform based on navigator.userAgent for platform-specific installer
  const isLocalDesktopApp = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost" ||
      Boolean((window as any).electronAPI?.isElectron) ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  }, []);

  const platformDownloadInfo = useMemo(() => {
    if (typeof navigator === "undefined") {
      return {
        isLinux: false,
        isWindows: true,
        label: "Windows (.exe)",
        downloadUrl: "/api/download/windows-exe",
        filename: EXE_FILENAME,
      };
    }
    const ua = (navigator.userAgent || "").toLowerCase();
    const isLinux = (ua.includes("linux") || ua.includes("x11")) && !ua.includes("android");
    const isWindows = ua.includes("win") || ua.includes("windows");

    if (isLinux) {
      return {
        isLinux: true,
        isWindows: false,
        label: "Linux (.deb)",
        downloadUrl: "/api/download/linux-deb",
        filename: DEB_FILENAME,
      };
    }

    return {
      isLinux: false,
      isWindows: isWindows,
      label: isWindows ? "Windows (.exe)" : "Desktop App",
      downloadUrl: "/api/download/windows-exe",
      filename: EXE_FILENAME,
    };
  }, []);

  const handleDownloadApp = () => {
    // Open the Desktop & Remote Modal where users can download the verified 1.6 MB installer
    if (onOpenDesktopRemoteModal) {
      onOpenDesktopRemoteModal();
    }
  };

  // Real-time Token Telemetry & Context Tracking
  const [liveTokenStats, setLiveTokenStats] = useState<{
    sessionTokens: number;
    promptTokens: number;
    candidateTokens: number;
    requestsCount: number;
    activeContextTokens?: number;
  }>({
    sessionTokens: 0,
    promptTokens: 0,
    candidateTokens: 0,
    requestsCount: 0,
    activeContextTokens: 1450
  });

  // Fetch real Gemini token telemetry from server and listen for live updates
  useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/tokens/usage");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setLiveTokenStats({
              sessionTokens: Number(data.sessionTokens) || 0,
              promptTokens: Number(data.promptTokens) || 0,
              candidateTokens: Number(data.candidateTokens) || 0,
              requestsCount: Number(data.requestsCount) || 0,
              activeContextTokens: Number(data.activeContextTokens) || 1450
            });
          }
        }
      } catch (e) {}
    };

    fetchUsage();

    const handleUpdate = (e: any) => {
      if (e.detail?.sessionTokens) {
        if (typeof e.detail.sessionTokens === "object") {
          setLiveTokenStats(e.detail.sessionTokens);
        } else {
          setLiveTokenStats(prev => ({
            ...prev,
            sessionTokens: Number(e.detail.sessionTokens) || prev.sessionTokens
          }));
        }
      } else if (e.detail?.usage) {
        setLiveTokenStats(prev => ({
          ...prev,
          sessionTokens: prev.sessionTokens + (Number(e.detail.usage.totalTokenCount) || 0),
          promptTokens: prev.promptTokens + (Number(e.detail.usage.promptTokenCount) || 0),
          candidateTokens: prev.candidateTokens + (Number(e.detail.usage.candidatesTokenCount) || 0),
          requestsCount: prev.requestsCount + 1
        }));
      }
    };

    window.addEventListener("myraa-tokens-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("myraa-tokens-updated", handleUpdate);
    };
  }, []);

  // Real context tokens calculated from actual text (words and character density)
  const algorithmicContextTokens = useMemo(() => {
    return estimateActiveContextTokens(chatHistory, studyPadText, whiteboardText);
  }, [chatHistory, studyPadText, whiteboardText]);

  const totalRealUsedTokens = Math.max(
    liveTokenStats.sessionTokens,
    liveTokenStats.activeContextTokens || 0,
    algorithmicContextTokens
  );
  const totalMaxTokens = activeModel.inputTokenLimit || activeModel.contextTokens || 1048576;
  const remainingTokens = Math.max(0, totalMaxTokens - totalRealUsedTokens);

  const remainingStr = formatTokenCount(remainingTokens);
  const maxStr = formatTokenCount(totalMaxTokens);
  const usedStr = formatTokenCount(totalRealUsedTokens);
  const remainingPercent = (totalMaxTokens > 0 && Number.isFinite(remainingTokens))
    ? Math.max(0, Math.min(100, (remainingTokens / totalMaxTokens) * 100)).toFixed(1)
    : "100.0";

  return (
    <header className="relative z-30 w-full px-2 sm:px-4 pt-2 flex justify-center">
      <div className="relative w-full md:w-fit max-w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl md:rounded-full bg-slate-950/80 border border-white/12 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] transition-all duration-200">
        
        {/* Mobile Navbar Header */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <MahrEmblemLogo size={32} showText={false} showStatusIndicator={true} />
            <div>
              <h1 className="text-sm font-bold tracking-wider font-mono bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
                MAHR AI
              </h1>
              <p className="text-[9px] text-amber-300/70 font-mono tracking-widest uppercase">
                {activeSubAgent.name.split(" ")[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {onOpenDesktopRemoteModal && (
              <button
                id="mobile-header-get-app-btn"
                data-testid="mobile-header-get-app-btn"
                onClick={onOpenDesktopRemoteModal}
                className="h-8 px-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-400/40 text-blue-200 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                title="MAHR Desktop App & Updates"
              >
                <Download size={13} className="text-blue-400" />
                <span>App</span>
                <span className="text-[9px] px-1 bg-blue-500/30 rounded text-blue-300 font-bold">v2.4.1</span>
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="flex md:hidden flex-col gap-2 mt-3 pt-3 border-t border-white/10 animate-fade-in">
            {/* Mobile MAHR Desktop App & Continuous Auto-Updater Hub */}
            {onOpenDesktopRemoteModal && (
              <button
                id="mobile-drawer-get-app-btn"
                onClick={() => {
                  onOpenDesktopRemoteModal();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-400/40 text-blue-200 text-xs font-mono flex items-center justify-between shadow-lg shadow-blue-950/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                    <Download size={16} className="text-blue-300 animate-pulse" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-white text-xs">MAHR Desktop App & Auto-Updater</span>
                    <span className="text-[10px] text-blue-300/80">Windows (.exe) • Linux (.deb) • Continuous Sync</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-bold border border-blue-400/30">
                    v2.4.1
                  </span>
                  <span className="text-[9px] text-emerald-400 font-sans flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Auto-Sync
                  </span>
                </div>
              </button>
            )}
            {/* Mobile Model Switcher (Moved to Backend Auto-Router & Settings Tab; hidden from header UI) */}
            <button
              id="mobile-model-token-meter-btn"
              onClick={() => { onToggleModelSwitcher(); setIsMobileMenuOpen(false); }}
              className="hidden"
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
            >
              <span>{activeModel.name}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => { onToggleWhiteboard(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${isWhiteboardOpen ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <PenTool size={14} /> Whiteboard
              </button>
              <button
                onClick={() => { onToggleStudyPad(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${isStudyPadOpen ? "bg-emerald-500/20 border-emerald-400 text-emerald-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <BookOpen size={14} /> Study Pad
              </button>
              <button
                id="mobile-header-recall-btn"
                onClick={() => { onToggleMemory(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                  showMemoryDashboard || showChatJournal
                    ? "bg-purple-500/25 border-purple-400 text-purple-100 font-semibold"
                    : "bg-slate-900/60 border-slate-700/60 text-slate-300"
                }`}
              >
                <Brain size={14} className="text-purple-400" /> Recall
              </button>
              <button
                onClick={() => { onToggleScreenSharing(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${isScreenSharing ? "bg-emerald-500/20 border-emerald-400 text-emerald-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <Monitor size={14} /> Screen Vision
              </button>
              <button
                onClick={() => { onToggleSettings(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${showSettings ? "bg-purple-600/30 border-purple-400 text-purple-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <Settings size={14} /> Settings
              </button>
              {onToggleShortcuts && (
                <button
                  onClick={() => { onToggleShortcuts(); setIsMobileMenuOpen(false); }}
                  className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${showShortcuts ? "bg-purple-600/30 border-purple-400 text-purple-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
                >
                  <Keyboard size={14} /> Hotkeys
                </button>
              )}
            </div>

            {/* Mobile Atmosphere Quick Switcher */}
            <div className="pt-2 mt-1 border-t border-white/10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span className="flex items-center gap-1.5"><Palette size={13} className="text-purple-400" /> Atmosphere</span>
                <span className="text-slate-300 font-semibold">{activeTheme.name}</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Object.values(THEME_COLOR_CONFIGS).map((t) => {
                  const isSel = themeColor?.toLowerCase() === t.id.toLowerCase();
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectThemeColor?.(t.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`p-1 rounded-lg border flex flex-col items-center justify-center transition ${
                        isSel ? "bg-white/20 border-white ring-1 ring-white/40 scale-105" : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                      title={t.name}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: t.hex }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Compact Centered Horizontal Navbar (Zero Extra Gap) */}
        <div className="hidden md:flex items-center justify-center gap-2 lg:gap-2.5 w-fit max-w-full overflow-x-auto scrollbar-none py-0.5">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-slate-800/90">
            <MahrEmblemLogo size={32} showText={true} showStatusIndicator={true} />
          </div>

          {/* Core Workspace Buttons */}
          <div className="flex items-center gap-1.5 lg:gap-2 overflow-x-auto scrollbar-none">
            {/* Model Switcher (Moved to Backend Auto-Router & Settings Tab; hidden from header UI) */}
            <button
              id="header-model-switcher-btn"
              onClick={onToggleModelSwitcher}
              className="hidden"
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
              title={`Active Model: ${activeModel.name} (${usedStr} used / ${maxStr} max)`}
            >
              <Cpu size={14} className="text-purple-400 shrink-0" />
              <span className="font-semibold truncate max-w-[115px] lg:max-w-[140px]">
                {activeModel.name}
              </span>
            </button>

            <button
              id="header-screen-share-btn"
              onClick={onToggleScreenSharing}
              className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${
                isScreenSharing
                  ? isScreenSharingPaused
                    ? "bg-amber-500/20 text-amber-200 border-amber-400/60"
                    : "bg-emerald-500/20 text-emerald-200 border-emerald-400/60 shadow-sm"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-emerald-400/40"
              }`}
              title="Live Multimodal Screen Vision"
            >
              <Monitor size={14} className={isScreenSharing ? "text-emerald-400 animate-pulse" : "text-slate-400"} />
              <span>{isScreenSharing ? (isScreenSharingPaused ? "Paused" : "Sharing") : "Screen"}</span>
            </button>

            <button
              id="header-whiteboard-btn"
              onClick={onToggleWhiteboard}
              className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${
                isWhiteboardOpen
                  ? "bg-cyan-500/25 text-cyan-100 border-cyan-400/60 shadow-sm"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-cyan-400/40"
              }`}
              title="Interactive Digital Chalkboard & Code Lab"
            >
              <PenTool size={14} className="text-cyan-400 shrink-0" />
              <span>Whiteboard</span>
            </button>

            <button
              id="header-study-pad-btn"
              onClick={onToggleStudyPad}
              className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${
                isStudyPadOpen
                  ? "bg-emerald-500/25 text-emerald-100 border-emerald-400/60 shadow-sm"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-emerald-400/40"
              }`}
              title="Interactive Exam Study Pad & Flashcards"
            >
              <BookOpen size={14} className="text-emerald-400 shrink-0" />
              <span>Study Pad</span>
            </button>

            <button
              id="header-recall-btn"
              data-testid="header-recall-btn"
              onClick={onToggleMemory}
              className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${
                showMemoryDashboard || showChatJournal
                  ? "bg-purple-500/25 text-purple-100 border-purple-400/60 shadow-sm"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-purple-400/40"
              }`}
              title="Recall Vector Memory & Conversation Journal Hub"
            >
              <Brain size={14} className="text-purple-400 shrink-0" />
              <span>Recall</span>
            </button>
          </div>

          {/* System & Desktop Controls Group */}
          <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-800/90 pl-2">
            <button
              id="header-settings-btn"
              data-testid="header-settings-btn"
              onClick={onToggleSettings}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                showSettings
                  ? "bg-purple-600/30 text-purple-200 border-purple-400 shadow-lg shadow-purple-950/40 font-bold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-purple-400/40"
              }`}
              title="Settings & System Configuration"
            >
              <Settings size={15} className={showSettings ? "text-purple-300 animate-spin" : "text-slate-400 shrink-0"} style={{ animationDuration: '6s' }} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Human Mood & Emotion Persona Trigger (Internal to MAHR; hidden from main user UI) */}
            {onToggleHumanMoodStudio && (
              <button
                id="header-human-mood-btn"
                onClick={onToggleHumanMoodStudio}
                className="hidden"
                style={{ display: "none" }}
                aria-hidden="true"
                tabIndex={-1}
                title={`MAHR's Real Human Mood: ${moodConfig.label} (${moodConfig.emoji})`}
              >
                <span className="text-sm shrink-0">{moodConfig.emoji}</span>
              </button>
            )}

            {/* Reinforcement Learning & Self-Improvement Lab Trigger (Internal to MAHR; hidden from main user UI) */}
            {onToggleRLStudio && (
              <button
                id="header-rl-lab-btn"
                onClick={onToggleRLStudio}
                className="hidden"
                style={{ display: "none" }}
                aria-hidden="true"
                tabIndex={-1}
                title="MAHR Reinforcement Learning & Self-Improvement Growth Lab"
              >
                <BrainCircuit size={14} />
              </button>
            )}

            {/* Atmosphere Quick Palette Selector (Internal to MAHR; hidden from main user UI) */}
            <div className="hidden" style={{ display: "none" }} ref={atmosphereMenuRef}>
              <button
                id="header-atmosphere-btn"
                onClick={() => setIsAtmosphereMenuOpen(!isAtmosphereMenuOpen)}
                className="hidden"
                style={{ display: "none" }}
                aria-hidden="true"
                tabIndex={-1}
                title={`Atmosphere: ${activeTheme.name}`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: activeTheme.hex }}
                />
              </button>

              {/* Atmosphere Floating Dropdown Menu */}
              {isAtmosphereMenuOpen && (
                <div
                  id="header-atmosphere-dropdown"
                  className="absolute right-0 top-11 z-50 w-64 p-3 rounded-2xl bg-[#090a12]/95 border border-white/20 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                      <Palette size={14} className="text-purple-400" />
                      <span>Atmosphere Palette</span>
                    </div>
                    <span className="text-[10px] text-purple-300 font-mono font-semibold">{activeTheme.name}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    {Object.values(THEME_COLOR_CONFIGS).map((t) => {
                      const isSelected = themeColor?.toLowerCase() === t.id.toLowerCase();
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            onSelectThemeColor?.(t.id);
                            setIsAtmosphereMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                            isSelected
                              ? "bg-white/15 text-white border border-white/30 shadow-md ring-1 ring-white/20"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md"
                              style={{ backgroundColor: t.hex, boxShadow: `0 0 8px ${t.hex}` }}
                            />
                            <span>{t.name}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-purple-300 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {onToggleAutoShift && (
                    <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">Speech Mood Shift</span>
                      <button
                        onClick={onToggleAutoShift}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono transition cursor-pointer ${
                          autoShiftBackground
                            ? "bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:bg-purple-500/40"
                            : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {autoShiftBackground ? "Active" : "Locked"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {onToggleShortcuts && (
              <button
                onClick={onToggleShortcuts}
                className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                  showShortcuts
                    ? "bg-purple-500/25 text-purple-200 border-purple-500/60 shadow-md font-bold"
                    : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-500"
                }`}
                title="Keyboard Shortcuts Cheat Sheet (Ctrl+/ or ?)"
              >
                <Keyboard size={14} className="text-purple-400 shrink-0" />
                <span className="hidden lg:inline">Hotkeys</span>
              </button>
            )}

            {onOpenDesktopRemoteModal && (
              <button
                id="header-get-app-btn"
                data-testid="header-get-app-btn"
                onClick={onOpenDesktopRemoteModal}
                className="h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-sm bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 hover:from-blue-600/50 hover:to-purple-600/50 text-blue-200 hover:text-white border-blue-400/40 hover:border-blue-400 shadow-blue-950/40 hover:scale-[1.02] active:scale-[0.98]"
                title="Download MAHR Desktop App (Windows .exe / Linux .deb) & View Continuous Auto-Updater"
              >
                <Download size={14} className="text-blue-400 shrink-0" />
                <span className="hidden sm:inline">Get App</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/25 text-blue-300 font-mono font-bold border border-blue-400/30">
                  v{APP_VERSION}
                </span>
              </button>
            )}

            {onOpenUpdateModal && (
              <UpdateStatusBadge
                status={updaterStatus || (hasUpdate ? "available" : "up-to-date")}
                latestVersion={latestVersion}
                hasUpdate={hasUpdate}
                lastCheckedAt={lastCheckedAt}
                alwaysVisible={true}
                onClick={onOpenUpdateModal}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
