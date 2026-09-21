import { useState, useRef, useEffect, useMemo } from "react";
import { Cpu, Bot, Calendar, Brain, MessageSquare, BookOpen, PenTool, Compass, Settings, Monitor, Menu, X, Sparkles, Keyboard, Palette, Network, Orbit, Check, BrainCircuit, Building2, Globe, Download } from "lucide-react";
import { SUPPORTED_AI_MODELS, AIModelConfig, SubAgent, DailyTask } from "../lib/subagentTypes";
import { ChatMessage } from "../lib/memoryTypes";
import { PsychologyProfile } from "../services/colorPsychologyEngine";
import { formatTokenCount, estimateActiveContextTokens } from "../lib/tokenUtils";
import { THEME_COLOR_CONFIGS, getThemeConfig } from "../services/themeService";
import { HumanMoodType, HUMAN_MOOD_CONFIGS } from "../services/humanEmotionEngine";

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
  isMunderDifflinOpen?: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onToggleModelSwitcher: () => void;
  onToggleSubAgents: () => void;
  onToggleDailyTasks: () => void;
  onToggleMunderDifflin?: () => void;
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
  isMunderDifflinOpen = false,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onToggleModelSwitcher,
  onToggleSubAgents,
  onToggleDailyTasks,
  onToggleMunderDifflin,
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
  deficitsCount = 0
}) => {
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
        filename: "MAHR-Setup-v2.4.0.exe",
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
        filename: "mahr-desktop_2.4.0_amd64.deb",
      };
    }

    return {
      isLinux: false,
      isWindows: isWindows,
      label: isWindows ? "Windows (.exe)" : "Desktop App",
      downloadUrl: "/api/download/windows-exe",
      filename: "MAHR-Setup-v2.4.0.exe",
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
    <header className="relative z-30 w-full max-w-7xl mx-auto pt-2">
      <div className="relative p-2.5 sm:p-3.5 rounded-2xl md:rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)]">
        
        {/* Mobile Navbar Header */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
              <Sparkles size={16} className="animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider font-mono bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300">
                MAHR AI
              </h1>
              <p className="text-[9px] text-purple-300/70 font-mono tracking-widest uppercase">
                {activeSubAgent.name.split(" ")[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isLocalDesktopApp ? (
              <div className="h-8 px-2 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-medium flex items-center gap-1 shrink-0 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>v2.4</span>
              </div>
            ) : onOpenDesktopRemoteModal ? (
              <button
                id="mobile-header-download-app-btn"
                onClick={handleDownloadApp}
                className="h-8 px-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 text-slate-200 border border-slate-700/60 hover:border-slate-500 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                title={`Download App (${platformDownloadInfo.label})`}
              >
                <Download size={13} className="text-cyan-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-200">App</span>
              </button>
            ) : null}

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
            {onOpenDesktopRemoteModal && (
              <button
                id="mobile-drawer-download-app-btn"
                onClick={() => { handleDownloadApp(); setIsMobileMenuOpen(false); }}
                className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/60 text-slate-200 text-xs font-medium flex items-center justify-between transition-colors active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download size={15} className="text-cyan-400 shrink-0" />
                  <span>Download App</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {platformDownloadInfo.label}
                </span>
              </button>
            )}
            <button
              id="mobile-model-token-meter-btn"
              onClick={() => { onToggleModelSwitcher(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-mono flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-purple-400" />
                  <span className="font-bold">{activeModel.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/30 font-bold border border-purple-400/30 text-purple-200 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${Number(remainingPercent) > 25 ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  {usedStr} Used • {remainingStr} Rem
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-purple-500/20">
                <div
                  className="bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${remainingPercent}%` }}
                />
              </div>
            </button>

            <button
              onClick={() => { onToggleSubAgents(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs font-mono flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-indigo-400" />
                <span>Sub-Agent: {activeSubAgent.name.split(" ")[0]}</span>
              </div>
            </button>

            <button
              onClick={() => { onToggleDailyTasks(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-amber-400" />
                <span>Daily Schedule</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 font-bold">
                {completedTasksCount}/{dailyTasks.length}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => { onToggleMemory(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${showMemoryDashboard ? "bg-purple-500/20 border-purple-400 text-purple-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <Brain size={14} /> Recalls
              </button>
              <button
                onClick={() => { onToggleJournal(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${showChatJournal ? "bg-purple-500/20 border-purple-400 text-purple-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <MessageSquare size={14} /> Journal
              </button>
              <button
                onClick={() => { onToggleStudyPad(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${isStudyPadOpen ? "bg-emerald-500/20 border-emerald-400 text-emerald-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <BookOpen size={14} /> Study Pad
              </button>
              <button
                onClick={() => { onToggleWhiteboard(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${isWhiteboardOpen ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <PenTool size={14} /> Whiteboard
              </button>
              {onToggleHumanMoodStudio && (
                <button
                  id="mobile-human-mood-btn"
                  onClick={() => { onToggleHumanMoodStudio(); setIsMobileMenuOpen(false); }}
                  className="p-2 rounded-xl text-xs flex items-center gap-2 border bg-white/[0.04] text-white border-white/20"
                  style={{
                    borderColor: `${moodConfig.glowColor}60`,
                    boxShadow: `0 0 10px ${moodConfig.glowColor}25`
                  }}
                >
                  <span className="text-sm">{moodConfig.emoji}</span>
                  <span className="font-semibold">{moodConfig.label}</span>
                  <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: `${moodConfig.glowColor}25`, color: moodConfig.glowColor }}>
                    Mood
                  </span>
                </button>
              )}
              <button
                onClick={() => { onToggleSettings(); setIsMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${showSettings ? "bg-slate-700 text-white" : "bg-slate-900/60 border-slate-700/60 text-slate-300"}`}
              >
                <Settings size={14} /> Setup
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

        {/* Desktop Horizontal Navbar */}
        <div className="hidden md:flex items-center justify-between gap-2 lg:gap-3 w-full overflow-x-auto scrollbar-none py-0.5">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/30 shadow-inner">
              <Sparkles size={16} className="text-purple-400 animate-spin-slow" />
              <span className="text-sm font-extrabold font-mono tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-indigo-100 to-cyan-200">
                MAHR
              </span>
            </div>
          </div>

          {/* Core AI Engines Group */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 🏢 Office Button */}
            <button
              id="header-munder-difflin-office-btn"
              onClick={onToggleMunderDifflin || onToggleSubAgents}
              className="h-9 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400 text-purple-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer shrink-0 shadow-sm hover:scale-[1.02]"
              title="Office"
            >
              <Building2 size={14} className="text-purple-300 shrink-0" />
              <span>Office</span>
            </button>

            <button
              onClick={onToggleDailyTasks}
              className="h-9 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/35 text-amber-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all duration-200 shadow-sm hover:border-amber-400/70 hover:scale-[1.02] cursor-pointer shrink-0"
              title="Daily Task & Schedule Tracker"
            >
              <Calendar size={14} className="text-amber-400 shrink-0" />
              <span className="hidden lg:inline">Tasks</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/25 text-amber-200 font-bold border border-amber-400/30 font-mono">
                {completedTasksCount}/{dailyTasks.length}
              </span>
            </button>
          </div>

          {/* Secondary Workspaces & Utilities Group */}
          <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-800/80 pl-2 lg:pl-3">
            <button
              onClick={onToggleMemory}
              className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                showMemoryDashboard
                  ? "bg-purple-500/25 text-purple-200 border-purple-500/60 shadow-md shadow-purple-950/60 font-bold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-500"
              }`}
              title="Recollections Memory Database"
            >
              <Brain size={14} className={showMemoryDashboard ? "animate-pulse text-purple-300 shrink-0" : "text-slate-400 shrink-0"} />
              <span className="hidden lg:inline">Recalls</span>
              {offlineDeletedQueueLength > 0 && (
                <span className="text-[9px] px-1 bg-amber-500/30 text-amber-300 rounded font-mono font-bold">
                  {offlineDeletedQueueLength}
                </span>
              )}
            </button>

            {/* Knowledge Graph Explorer (Internal to MAHR; hidden from main user UI) */}
            {onToggleKnowledgeGraph && (
              <button
                id="header-knowledge-graph-btn"
                onClick={onToggleKnowledgeGraph}
                className="hidden"
                style={{ display: "none" }}
                aria-hidden="true"
                tabIndex={-1}
                title="Proactive User Entity Knowledge Graph"
              >
                <Network size={14} />
              </button>
            )}

            <button
              onClick={onToggleJournal}
              className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                showChatJournal
                  ? "bg-purple-500/25 text-purple-200 border-purple-500/60 shadow-md shadow-purple-950/60 font-bold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-500"
              }`}
              title="Conversation Journal & Logs"
            >
              <MessageSquare size={14} className={showChatJournal ? "animate-pulse text-purple-300 shrink-0" : "text-slate-400 shrink-0"} />
              <span className="hidden lg:inline">Journal</span>
            </button>

            <button
              onClick={onToggleStudyPad}
              className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                isStudyPadOpen
                  ? "bg-emerald-500/25 text-emerald-200 border-emerald-500/60 shadow-md shadow-emerald-950/60 font-bold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-500"
              }`}
              title="Interactive Exam Study Notepad"
            >
              <BookOpen size={14} className={isStudyPadOpen ? "animate-pulse text-emerald-300 shrink-0" : "text-slate-400 shrink-0"} />
              <span className="hidden lg:inline">Study Pad</span>
            </button>

            <button
              onClick={onToggleWhiteboard}
              className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                isWhiteboardOpen
                  ? "bg-cyan-500/25 text-cyan-200 border-cyan-500/60 shadow-md shadow-cyan-950/60 font-bold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-500"
              }`}
              title="Classroom Interactive Blackboard Whiteboard"
            >
              <PenTool size={14} className={isWhiteboardOpen ? "animate-pulse text-cyan-300 shrink-0" : "text-slate-400 shrink-0"} />
              <span className="hidden lg:inline">Whiteboard</span>
            </button>

            {onToggleSimulationStudio && (
              <button
                onClick={onToggleSimulationStudio}
                className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                  isSimulationStudioOpen
                    ? "bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 border-cyan-400 shadow-lg shadow-cyan-950/60 font-bold"
                    : "bg-slate-900/60 hover:bg-slate-800/80 text-cyan-300 border-slate-700/60 hover:border-cyan-500/60"
                }`}
                title="Universal AI Simulation Engine (2D Liquid State & 3D WebGL Physics)"
              >
                <Orbit size={14} className={isSimulationStudioOpen ? "animate-spin text-cyan-300 shrink-0" : "text-cyan-400 shrink-0"} />
                <span className="hidden lg:inline">Sim Engine</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                  2D/3D
                </span>
              </button>
            )}

            <button
              onClick={onToggleSettings}
              className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                showSettings
                  ? "bg-slate-700 text-white border-slate-500 font-bold shadow-md"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-500"
              }`}
              title="Voice & System Setup"
            >
              <Settings size={14} className="text-slate-400 shrink-0" />
              <span className="hidden lg:inline">Setup</span>
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

            <button
              onClick={onToggleScreenSharing}
              className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                isScreenSharing
                  ? "bg-cyan-500/25 text-cyan-200 border-cyan-500/60 shadow-md font-bold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-slate-500"
              }`}
              title="Share Screen with MAHR"
            >
              <Monitor size={14} className={isScreenSharing && !isScreenSharingPaused ? "animate-pulse text-cyan-400 shrink-0" : "text-slate-400 shrink-0"} />
              <span className="hidden lg:inline">{isScreenSharing ? "Sharing" : "Screen"}</span>
            </button>

            {isLocalDesktopApp ? (
              <button
                id="header-desktop-status-badge"
                onClick={handleDownloadApp}
                className="h-9 px-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-medium flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-sm"
                title="MAHR Autonomous Engine Active (Local Desktop)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="hidden xl:inline">Native</span>
                <span>v2.4</span>
              </button>
            ) : onOpenDesktopRemoteModal ? (
              <button
                id="header-download-app-btn"
                onClick={handleDownloadApp}
                className="h-9 px-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-slate-700/60 hover:border-slate-500 text-xs font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 shrink-0"
                title={`Download App (${platformDownloadInfo.label})`}
              >
                <Download size={14} className="text-cyan-400 shrink-0" />
                <span>Download App</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
