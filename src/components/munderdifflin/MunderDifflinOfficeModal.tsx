// 🏢 Layer 3: MunderDifflinOfficeModal Component
// Full-scale Munder-Difflin Multi-Agent Virtual Office Floor & Boss Command Studio

import React, { useState } from "react";
import { 
  Building2, 
  Crown, 
  X, 
  Sparkles, 
  LayoutGrid, 
  Kanban, 
  Mail, 
  Cpu, 
  Share2, 
  Layers, 
  CheckCircle2, 
  FileText,
  Activity,
  Terminal,
  Trophy,
  Users,
  FolderGit2,
  ExternalLink,
  Download,
  Laptop,
  AlertTriangle,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMunderDifflinOffice } from "../../hooks/useMunderDifflinOffice";
import { useDesktopApp } from "../../hooks/useDesktopApp";
import { MunderDifflinDesktopGate } from "./MunderDifflinDesktopGate";
import { OfficeGitWorktrees } from "./OfficeGitWorktrees";
import { OfficeFloorPlan } from "./OfficeFloorPlan";
import { OfficeAgentCard } from "./OfficeAgentCard";
import { BossTaskDelegator } from "./BossTaskDelegator";
import { OfficeMailboxView } from "./OfficeMailboxView";
import { DundieCeremonyModal } from "./DundieCeremonyModal";
import { AgentTerminalModal } from "./AgentTerminalModal";
import { SUPPORTED_AI_MODELS, AIModelConfig } from "../../lib/subagentTypes";

interface MunderDifflinOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelId: string;
  onSelectModel?: (modelId: string) => void;
  onSelectSubAgent?: (agent: any) => void;
  onUpdateWhiteboardText?: (newMarkdown: string) => void;
  onUpdateStudyPadText?: (newNotes: string) => void;
  onNotifyUser?: (msg: string) => void;
  totalTokensUsed?: number;
  remainingTokens?: number;
  totalMaxTokens?: number;
}

export function MunderDifflinOfficeModal({
  isOpen,
  onClose,
  activeModelId,
  onSelectModel,
  onUpdateWhiteboardText,
  onUpdateStudyPadText,
  onNotifyUser,
  totalTokensUsed = 12500,
  remainingTokens = 1036076,
  totalMaxTokens = 1048576
}: MunderDifflinOfficeModalProps) {
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);

  const { 
    isDesktopShell, 
    isBrowser, 
    osName, 
    installDesktopApp, 
    optimizations 
  } = useDesktopApp();

  const {
    agents,
    tickets,
    memos,
    activeTab,
    setActiveTab,
    selectedAgentId,
    setSelectedAgentId,
    selectedAgent,
    bossAgent,
    isDelegating,
    isConferenceActive,
    standupTranscript,
    dundieModalOpen,
    setDundieModalOpen,
    latestDundie,
    lastBossSpeech,
    stats,
    totalUnreadMemos,
    handleBossDelegateMission,
    handleExecuteTicket,
    handleBossSignOff,
    handleExportOfficeReport,
    handleMarkAllMemosRead,
    handleCallStandup,
    handleSendToCoffeeBreak,
    handleAwardDundie,
    handleRunAgentCli
  } = useMunderDifflinOffice({
    onUpdateWhiteboardText,
    onUpdateStudyPadText,
    onNotifyUser
  });

  if (!isOpen) return null;

  // Simple clean install prompt box for web visitors - office requires MAHR Desktop App
  if (isBrowser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <MunderDifflinDesktopGate
          onClose={onClose}
        />
      </div>
    );
  }

  const activeModel = SUPPORTED_AI_MODELS.find((m) => m.id === activeModelId) || SUPPORTED_AI_MODELS[0];
  const percentUsed = Math.min(100, Math.round((totalTokensUsed / totalMaxTokens) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-7xl h-[94vh] rounded-3xl bg-gradient-to-b from-[#0a0a1c] via-[#080816] to-[#04040e] border border-purple-500/40 shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* 1. TOP HEADER */}
        <div className="relative z-10 px-5 py-3.5 border-b border-purple-500/25 bg-[#070716]/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-lg border border-purple-300/40 flex items-center justify-center">
              <Building2 size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-indigo-100 to-cyan-200">
                  OFFICE
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono font-bold">
                  Multi-Agent Workspace
                </span>
                {isDesktopShell ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono font-bold flex items-center gap-1">
                    <Laptop size={11} /> {osName} Desktop Native
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono font-bold">
                    Web Preview Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:flex items-center gap-1.5">
                <span>Autonomous multi-agent floor plan with isolated worktrees and real-time task sync</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Close Button */}
          <div className="flex items-center gap-3">
            {/* Export Briefing Button */}
            <button
              onClick={handleExportOfficeReport}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Export completed deliverables to Whiteboard & Study Pad"
            >
              <FileText size={13} className="text-cyan-400" />
              <span className="hidden sm:inline">Export Brief</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. SUB-NAV TABS */}
        <div className="px-5 py-2.5 border-b border-white/5 bg-[#060612]/70 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("floor")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "floor"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                  : "bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Office Floor Plan</span>
            </button>

            <button
              onClick={() => setActiveTab("worktrees")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "worktrees"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                      : "bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Isolated per-agent git worktrees (Chaitanya Giri Munder-Difflin architecture)"
                >
                  <FolderGit2 size={14} className="text-cyan-400" />
                  <span>Git Worktrees</span>
                </button>

                <button
                  onClick={() => setActiveTab("kanban")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "kanban"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                      : "bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Kanban size={14} />
                  <span>Task Tickets ({tickets.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("mailbox")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "mailbox"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                      : "bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Mail size={14} />
                  <span>Inter-Agent Mailbox</span>
                  {totalUnreadMemos > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                      {totalUnreadMemos}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("boss_suite")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "boss_suite"
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-900/50"
                      : "bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Crown size={14} className="text-amber-300" />
                  <span>Boss Suite &amp; Models</span>
                </button>

                <button
                  onClick={() => setIsTerminalModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 hover:text-white"
                  title="Open multi-agent CLI terminals (Claude Code, Gemini CLI, Cursor, etc.)"
                >
                  <Terminal size={14} className="text-cyan-400" />
                  <span>Agent CLI Terminal</span>
                </button>
              </div>

              {/* Right Status Badge */}
              <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                <span className="text-slate-400 hidden lg:inline">
                  Deliverables: <strong className="text-emerald-400">{stats.completed} Approved</strong> / {stats.total} Total
                </span>
              </div>
            </div>

            {/* 3. MAIN WORKSPACE CONTENT */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4">
              {/* If in browser preview, show notification to install desktop */}
              {isBrowser && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs text-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    <span>
                      <strong>Browser Simulation Mode:</strong> Real CLI terminal PTY processes and git worktree isolation require the Desktop Shell.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => installDesktopApp()}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                    >
                      <Download size={12} />
                      <span>Install Desktop App</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Always display Boss Delegation Console at top */}
              <BossTaskDelegator
                onDelegateMission={handleBossDelegateMission}
                isDelegating={isDelegating}
                bossSpeech={lastBossSpeech}
              />

              {/* TAB 1: 2D Office Floor Plan */}
              {activeTab === "floor" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <OfficeFloorPlan
                      agents={agents}
                      selectedAgentId={selectedAgentId}
                      onSelectAgent={(id) => setSelectedAgentId(id)}
                      onOpenBossSuite={() => setActiveTab("boss_suite")}
                      onCallStandup={handleCallStandup}
                      isConferenceActive={isConferenceActive}
                      standupTranscript={standupTranscript}
                      onAwardDundie={(id) => handleAwardDundie(id)}
                      onCoffeeBreak={(id) => handleSendToCoffeeBreak(id)}
                      onOpenCli={(id) => {
                        setSelectedAgentId(id);
                        setIsTerminalModalOpen(true);
                      }}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <OfficeAgentCard
                      agent={selectedAgent}
                      agentTickets={tickets.filter((t) => t.assignedToAgentId === selectedAgent.id)}
                      agentMemos={memos.filter(
                        (m) => m.toAgentId === selectedAgent.id || m.fromAgentId === selectedAgent.id
                      )}
                      onExecuteTicket={handleExecuteTicket}
                      onBossSignOff={handleBossSignOff}
                    />
                  </div>
                </div>
              )}

              {/* TAB: Git Worktrees (Chaitanya Giri's Munder-Difflin Architecture) */}
              {activeTab === "worktrees" && (
                <OfficeGitWorktrees
                  agents={agents}
                  onOpenCliForAgent={(agentId) => {
                    setSelectedAgentId(agentId);
                    setIsTerminalModalOpen(true);
                  }}
                />
              )}

              {/* TAB 2: Kanban Task Board */}
          {activeTab === "kanban" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(["assigned", "working", "boss_review", "approved"] as const).map((status) => {
                const columnTickets = tickets.filter((t) => t.status === status);
                const columnTitles = {
                  assigned: "📥 Delegated Tickets",
                  working: "⚡ In Progress (Working)",
                  boss_review: "👑 Boss Executive Review",
                  approved: "✨ Completed & Approved"
                };

                return (
                  <div
                    key={status}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-purple-500/20 flex flex-col gap-3 min-h-[350px]"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs font-bold text-slate-300">
                      <span>{columnTitles[status]}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                        {columnTickets.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 overflow-y-auto">
                      {columnTickets.map((ticket) => {
                        const agent = agents.find((a) => a.id === ticket.assignedToAgentId);
                        return (
                          <div
                            key={ticket.id}
                            className="p-3 rounded-xl bg-[#080818] border border-white/10 flex flex-col gap-2 hover:border-purple-500/40 transition-all shadow-sm"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="font-bold text-cyan-300">{agent?.nickname || "Agent"}</span>
                              <span className="text-slate-500">{ticket.createdAt}</span>
                            </div>

                            <div className="text-xs font-bold text-white">{ticket.title}</div>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{ticket.goal}</p>

                            {/* Action buttons */}
                            {status === "assigned" && (
                              <button
                                onClick={() => handleExecuteTicket(ticket.id)}
                                className="mt-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
                              >
                                Execute Ticket
                              </button>
                            )}

                            {status === "boss_review" && (
                              <button
                                onClick={() => handleBossSignOff(ticket.id)}
                                className="mt-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Crown size={10} className="text-amber-300" />
                                Grant Boss Approval
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {columnTickets.length === 0 && (
                        <div className="text-center py-10 text-xs text-slate-600 font-mono">
                          No tickets in this column
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Inter-Agent Mailbox */}
          {activeTab === "mailbox" && (
            <OfficeMailboxView
              memos={memos}
              agents={agents}
              onMarkAllRead={handleMarkAllMemosRead}
            />
          )}

          {/* TAB 4: Boss Executive Suite & Model Engine */}
          {activeTab === "boss_suite" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Executive Suite Info */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900/90 border border-purple-500/40 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 flex items-center justify-center text-3xl shadow-lg border border-purple-300/40">
                    👑
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">MAHR Executive Corner Suite</h3>
                    <p className="text-xs text-purple-200 font-mono">
                      "World's Best Boss" • Regional Manager Office Desk
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/20 text-xs font-mono text-purple-100 italic">
                  "{bossAgent.quote}"
                </div>

                <div className="text-xs text-slate-300 leading-relaxed font-sans">
                  {bossAgent.bio}
                </div>

                {/* Live Real-time Token Gauge */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Activity size={13} className="text-cyan-400" />
                      Live Session Token Telemetry
                    </span>
                    <span className="text-emerald-400 font-bold">{100 - percentUsed}% Quota Remaining</span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Used: {totalTokensUsed.toLocaleString()} tokens</span>
                    <span>Max: {totalMaxTokens.toLocaleString()} tokens</span>
                  </div>
                </div>
              </div>

              {/* Model Switcher Engine for the Boss */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex flex-col gap-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-cyan-400" />
                    <h3 className="text-sm font-extrabold text-white">Active Model Orchestration</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold">
                    MAHR Defaults to Latest
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono">
                  Select the underlying Gemini model used by MAHR to coordinate and delegate tasks:
                </p>

                <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {SUPPORTED_AI_MODELS.map((model) => {
                    const isCurrent = model.id === activeModelId;
                    return (
                      <div
                        key={model.id}
                        onClick={() => onSelectModel?.(model.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? "bg-purple-900/50 border-cyan-400 shadow-md ring-1 ring-cyan-400/50"
                            : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{model.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-mono">
                              {model.contextWindow}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {model.description}
                          </p>
                        </div>

                        {isCurrent && (
                          <span className="p-1 rounded-full bg-cyan-500 text-slate-950 shrink-0">
                            <CheckCircle2 size={12} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. DUNDIE CEREMONY MODAL */}
        {latestDundie && (
          <DundieCeremonyModal
            isOpen={dundieModalOpen}
            onClose={() => setDundieModalOpen(false)}
            winnerName={latestDundie.winnerName}
            awardTitle={latestDundie.awardTitle}
            speech={latestDundie.speech}
          />
        )}

        {/* 5. INTERACTIVE MULTI-AGENT TERMINAL / CLI MODAL */}
        <AgentTerminalModal
          isOpen={isTerminalModalOpen}
          onClose={() => setIsTerminalModalOpen(false)}
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={(id) => setSelectedAgentId(id)}
          onRunCommand={handleRunAgentCli}
        />
      </motion.div>
    </div>
  );
}
