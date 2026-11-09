/**
 * Layer 3 (Presentation Component):
 * Sleek Glassmorphic Quick-Access Plugin Dock for the Main Assistant Top Bar.
 * Displays the Extensions Marketplace trigger with tabular-nums counter and
 * 1-click launch buttons for all active/installed extensions across Productivity,
 * Research, Visuals, and Utilities.
 */

import React from "react";
import {
  Puzzle,
  Building2,
  Presentation,
  Calendar,
  GraduationCap,
  Brain,
  Network,
  MessageSquare,
  BookOpen,
  PenTool,
  Orbit,
  Monitor,
  Bot,
  Cpu,
  Sparkles,
  BrainCircuit,
  Plus,
} from "lucide-react";
import { MahrPluginId } from "../plugins/layer1_data/pluginTypes";

export interface QuickAccessPluginDockProps {
  isPluginActive: (id: MahrPluginId) => boolean;
  activePluginsCount: number;
  totalPluginsCount: number;
  isPluginStoreOpen: boolean;
  onOpenPluginStore?: () => void;

  // Active workspace open states
  isMunderDifflinOpen?: boolean;
  isSlidesStudioOpen?: boolean;
  isDailyTaskManagerOpen?: boolean;
  isClassroomOpen?: boolean;
  showMemoryDashboard?: boolean;
  showKnowledgeGraph?: boolean;
  showChatJournal?: boolean;
  isStudyPadOpen?: boolean;
  isWhiteboardOpen?: boolean;
  isSimulationStudioOpen?: boolean;
  isScreenSharing?: boolean;
  isScreenSharingPaused?: boolean;
  isSubAgentsStudioOpen?: boolean;
  isRLStudioOpen?: boolean;
  isAskMyraaOpen?: boolean;

  // Badge counters
  todayTasksBadge?: string;
  offlineDeletedQueueLength?: number;

  // Launch/Toggle handlers
  onToggleMunderDifflin?: () => void;
  onToggleSlidesStudio?: () => void;
  onToggleDailyTasks: () => void;
  onToggleClassroom?: () => void;
  onToggleMemory: () => void;
  onToggleKnowledgeGraph?: () => void;
  onToggleJournal: () => void;
  onToggleStudyPad: () => void;
  onToggleWhiteboard: () => void;
  onToggleSimulationStudio?: () => void;
  onToggleScreenSharing: () => void;
  onToggleSubAgents: () => void;
  onToggleHumanMoodStudio?: () => void;
  onOpenRoutines?: () => void;
  onToggleAskMahr?: () => void;
}

export const QuickAccessPluginDock: React.FC<QuickAccessPluginDockProps> = ({
  isPluginActive,
  activePluginsCount,
  totalPluginsCount,
  isPluginStoreOpen,
  onOpenPluginStore,
  isMunderDifflinOpen = false,
  isSlidesStudioOpen = false,
  isDailyTaskManagerOpen = false,
  isClassroomOpen = false,
  showMemoryDashboard = false,
  showKnowledgeGraph = false,
  showChatJournal = false,
  isStudyPadOpen = false,
  isWhiteboardOpen = false,
  isSimulationStudioOpen = false,
  isScreenSharing = false,
  isScreenSharingPaused = false,
  isSubAgentsStudioOpen = false,
  isAskMyraaOpen = false,
  todayTasksBadge,
  offlineDeletedQueueLength = 0,
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
  onToggleScreenSharing,
  onToggleSubAgents,
  onToggleHumanMoodStudio,
  onOpenRoutines,
  onToggleAskMahr,
}) => {
  return (
    <div
      id="header-quick-access-plugin-dock"
      className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto scrollbar-none py-0.5"
    >
      {/* Primary Extensions Marketplace Button */}
      {onOpenPluginStore && (
        <button
          id="header-plugins-store-btn"
          data-testid="header-plugins-store-btn"
          type="button"
          onClick={onOpenPluginStore}
          className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
            isPluginStoreOpen
              ? "bg-cyan-500/25 text-cyan-200 border-cyan-400 font-semibold shadow-sm"
              : "bg-slate-900/85 hover:bg-slate-800 text-slate-100 border-cyan-500/35 hover:border-cyan-400"
          }`}
          title="Open Extensions & Add-ons Marketplace"
        >
          <Puzzle size={14} className="text-cyan-400 shrink-0" />
          <span>Extensions</span>
          <span className="text-[11px] text-cyan-300 font-mono tabular-nums">
            {activePluginsCount}/{totalPluginsCount}
          </span>
        </button>
      )}

      {/* Pure Voice Agent Mode Indicator when 0 plugins are active */}
      {activePluginsCount === 0 && (
        <button
          type="button"
          onClick={onOpenPluginStore}
          className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Click to browse and install optional extensions"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Pure Voice Agent</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-cyan-300 font-medium inline-flex items-center gap-0.5">
            <Plus size={12} /> Add Tools
          </span>
        </button>
      )}

      {/* Active Extensions Quick-Access Dock */}
      {activePluginsCount > 0 && (
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800/90">
          {/* Whiteboard & Code Lab */}
          {isPluginActive("whiteboard-chalkboard") && (
            <button
              id="header-whiteboard-btn"
              data-testid="header-whiteboard-btn"
              type="button"
              onClick={onToggleWhiteboard}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                isWhiteboardOpen && !isSlidesStudioOpen
                  ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-cyan-400/40"
              }`}
              title="Classroom Interactive Chalkboard & Code Lab"
            >
              <PenTool size={14} className="text-cyan-400 shrink-0" />
              <span className="hidden lg:inline">Whiteboard</span>
            </button>
          )}

          {/* Study Pad & AI Flashcards */}
          {isPluginActive("study-pad") && (
            <button
              id="header-studypad-btn"
              data-testid="header-studypad-btn"
              type="button"
              onClick={onToggleStudyPad}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                isStudyPadOpen
                  ? "bg-emerald-500/30 text-emerald-200 border-emerald-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-emerald-400/40"
              }`}
              title="Interactive Exam Study Pad & Flashcards"
            >
              <BookOpen size={14} className="text-emerald-400 shrink-0" />
              <span className="hidden lg:inline">Study Pad</span>
            </button>
          )}

          {/* Daily Tasks & Google Tasks Sync */}
          {isPluginActive("daily-tasks") && (
            <button
              id="header-today-tasks-btn"
              data-testid="header-today-tasks-btn"
              type="button"
              onClick={onToggleDailyTasks}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                isDailyTaskManagerOpen
                  ? "bg-amber-500/30 text-amber-200 border-amber-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-amber-400/40"
              }`}
              title="Daily Schedule & Google Tasks Sync"
            >
              <Calendar size={14} className="text-amber-400 shrink-0" />
              <span className="hidden lg:inline">Today</span>
              {todayTasksBadge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-200 font-mono font-bold tabular-nums">
                  {todayTasksBadge}
                </span>
              )}
            </button>
          )}

          {/* Google Classroom Hub */}
          {onToggleClassroom && isPluginActive("google-classroom") && (
            <button
              id="header-classroom-btn"
              data-testid="header-classroom-btn"
              type="button"
              onClick={onToggleClassroom}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                isClassroomOpen
                  ? "bg-emerald-500/30 text-emerald-200 border-emerald-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-emerald-400/40"
              }`}
              title="Google Classroom Hub & Homework Tutor"
            >
              <GraduationCap size={14} className="text-emerald-400 shrink-0" />
              <span className="hidden lg:inline">Classroom</span>
            </button>
          )}

          {/* MAHR Virtual Office */}
          {isPluginActive("mahr-office") && (
            <button
              id="header-mahr-office-btn"
              data-testid="header-mahr-office-btn"
              type="button"
              onClick={onToggleMunderDifflin || onToggleSubAgents}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                isMunderDifflinOpen
                  ? "bg-purple-600/30 text-purple-200 border-purple-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-purple-500/40"
              }`}
              title="MAHR Virtual Office (6-Agent Floor)"
            >
              <Building2 size={14} className="text-purple-400 shrink-0" />
              <span className="hidden sm:inline">Office</span>
            </button>
          )}

          {/* AI Slides Studio */}
          {onToggleSlidesStudio && isPluginActive("slides-studio") && (
            <button
              id="header-slides-studio-btn"
              data-testid="header-slides-studio-btn"
              type="button"
              onClick={onToggleSlidesStudio}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                isSlidesStudioOpen
                  ? "bg-amber-500/30 text-amber-200 border-amber-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-amber-400/40"
              }`}
              title="Google Slides & AI Presentation Studio"
            >
              <Presentation size={14} className="text-amber-400 shrink-0" />
              <span className="hidden lg:inline">Slides</span>
            </button>
          )}

          {/* 2D/3D Simulation Studio */}
          {onToggleSimulationStudio && isPluginActive("simulation-studio") && (
            <button
              id="header-sim-engine-btn"
              data-testid="header-sim-engine-btn"
              type="button"
              onClick={onToggleSimulationStudio}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                isSimulationStudioOpen
                  ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-cyan-500/50"
              }`}
              title="2D/3D Universal Simulation Engine"
            >
              <Orbit size={14} className="text-cyan-400 shrink-0" />
              <span className="hidden lg:inline">Sim Engine</span>
            </button>
          )}

          {/* Long-Term Memory Vault */}
          {isPluginActive("memory-vault") && (
            <button
              id="header-memory-btn"
              data-testid="header-memory-btn"
              type="button"
              onClick={onToggleMemory}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                showMemoryDashboard
                  ? "bg-purple-500/30 text-purple-200 border-purple-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-purple-400/40"
              }`}
              title="Long-Term Vector Memory Vault"
            >
              <Brain size={14} className="text-purple-400 shrink-0" />
              <span className="hidden xl:inline">Recalls</span>
              {offlineDeletedQueueLength > 0 && (
                <span className="text-[9px] px-1 bg-amber-500/30 text-amber-300 rounded font-mono font-bold tabular-nums">
                  {offlineDeletedQueueLength}
                </span>
              )}
            </button>
          )}

          {/* Knowledge Graph */}
          {onToggleKnowledgeGraph && isPluginActive("knowledge-graph") && (
            <button
              id="header-knowledge-graph-btn"
              type="button"
              onClick={onToggleKnowledgeGraph}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                showKnowledgeGraph
                  ? "bg-purple-500/30 text-purple-200 border-purple-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-purple-400/40"
              }`}
              title="Proactive Entity Knowledge Graph"
            >
              <Network size={14} className="text-purple-400 shrink-0" />
              <span className="hidden xl:inline">Graph</span>
            </button>
          )}

          {/* Conversation Journal */}
          {isPluginActive("chat-journal") && (
            <button
              id="header-journal-btn"
              data-testid="header-journal-btn"
              type="button"
              onClick={onToggleJournal}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                showChatJournal
                  ? "bg-indigo-500/30 text-indigo-200 border-indigo-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-indigo-400/40"
              }`}
              title="Conversation Journal & Transcripts"
            >
              <MessageSquare size={14} className="text-indigo-400 shrink-0" />
              <span className="hidden xl:inline">Journal</span>
            </button>
          )}

          {/* Sub-Agents & Persona Studio */}
          {isPluginActive("subagents-studio") && (
            <button
              id="header-subagents-btn"
              type="button"
              onClick={onToggleSubAgents}
              className={`h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                isSubAgentsStudioOpen
                  ? "bg-indigo-500/30 text-indigo-200 border-indigo-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-indigo-400/40"
              }`}
              title="Custom Sub-Agents & Persona Studio"
            >
              <Cpu size={14} className="text-indigo-400 shrink-0" />
              <span className="hidden xl:inline">Personas</span>
            </button>
          )}

          {/* Quick Routines */}
          {onOpenRoutines && isPluginActive("quick-routines") && (
            <button
              id="header-routines-btn"
              type="button"
              onClick={onOpenRoutines}
              className="h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-amber-400/40"
              title="Smart Voice Routines & Workflows"
            >
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span className="hidden xl:inline">Routines</span>
            </button>
          )}

          {/* Cognitive Labs */}
          {onToggleHumanMoodStudio && isPluginActive("cognitive-labs") && (
            <button
              id="header-cognitive-labs-btn"
              type="button"
              onClick={onToggleHumanMoodStudio}
              className="h-9 px-2.5 lg:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-pink-400/40"
              title="Mood Psychology & RL Growth Lab"
            >
              <BrainCircuit size={14} className="text-pink-400 shrink-0" />
              <span className="hidden xl:inline">Labs</span>
            </button>
          )}

          {/* Live Screen Vision */}
          {isPluginActive("screen-vision") && (
            <button
              id="header-screen-share-btn"
              type="button"
              onClick={onToggleScreenSharing}
              className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 whitespace-nowrap ${
                isScreenSharing
                  ? "bg-cyan-500/25 text-cyan-200 border-cyan-500/60 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-cyan-400/40"
              }`}
              title="Live Screen Vision & Focus Magnifier"
            >
              <Monitor
                size={14}
                className={
                  isScreenSharing && !isScreenSharingPaused
                    ? "animate-pulse text-cyan-400 shrink-0"
                    : "text-cyan-400 shrink-0"
                }
              />
              <span className="hidden lg:inline">
                {isScreenSharing ? "Sharing" : "Screen"}
              </span>
            </button>
          )}

          {/* Mascot & Text Chat Console */}
          {onToggleAskMahr && isPluginActive("cute-mascot-chat") && (
            <button
              id="header-mascot-chat-btn"
              type="button"
              onClick={onToggleAskMahr}
              className={`h-9 px-2.5 lg:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border shrink-0 whitespace-nowrap ${
                isAskMyraaOpen
                  ? "bg-purple-500/25 text-purple-200 border-purple-400 font-semibold"
                  : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-purple-400/40"
              }`}
              title="Open Ask MAHR Text & Image Chat Console"
            >
              <Bot size={14} className="text-purple-400 shrink-0" />
              <span className="hidden xl:inline">Chat</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
