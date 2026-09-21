// 🏢 Layer 3: OfficeGitWorktrees Component
// Git Worktrees & Local Repo Isolation view mirroring chaitanyagiri/munder-difflin
// Manages per-agent git worktrees, branch checkouts, commit diffs, and local CLI sync

import React, { useState } from "react";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  FolderGit2, 
  Terminal, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ShieldCheck, 
  Layers,
  Cpu
} from "lucide-react";
import { OfficeAgent } from "../../types/munderDifflinTypes";
import { useDesktopApp } from "../../hooks/useDesktopApp";

interface GitWorktreeItem {
  id: string;
  agentId: string;
  agentName: string;
  avatarEmoji: string;
  branchName: string;
  directoryPath: string;
  headCommit: string;
  commitMessage: string;
  status: "clean" | "modified" | "syncing" | "diverged";
  filesChanged: number;
  cliTool: string;
}

interface OfficeGitWorktreesProps {
  agents: OfficeAgent[];
  onOpenCliForAgent?: (agentId: string) => void;
}

export function OfficeGitWorktrees({ agents, onOpenCliForAgent }: OfficeGitWorktreesProps) {
  const { isDesktopShell } = useDesktopApp();
  const [selectedWorktreeId, setSelectedWorktreeId] = useState<string>("wt-jim");
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Initial worktrees assigned to core Munder-Difflin agents
  const [worktrees, setWorktrees] = useState<GitWorktreeItem[]>([
    {
      id: "wt-jim",
      agentId: "agent-jim-sales",
      agentName: "Jim Halpert",
      avatarEmoji: "👔",
      branchName: "feature/smart-replies-v2",
      directoryPath: ".munder/worktrees/agent-jim-feature",
      headCommit: "9f4a1c8",
      commitMessage: "feat: autonomous client follow-up email generator",
      status: "modified",
      filesChanged: 3,
      cliTool: "Claude Code"
    },
    {
      id: "wt-dwight",
      agentId: "agent-dwight-security",
      agentName: "Dwight Schrute",
      avatarEmoji: "👓",
      branchName: "audit/rbac-and-security-hardening",
      directoryPath: ".munder/worktrees/agent-dwight-audit",
      headCommit: "3c7b2e1",
      commitMessage: "fix: lock down token quotas and enforce strict schema gates",
      status: "clean",
      filesChanged: 0,
      cliTool: "Gemini CLI"
    },
    {
      id: "wt-pam",
      agentId: "agent-pam-reception",
      agentName: "Pam Beesly",
      avatarEmoji: "🎨",
      branchName: "docs/office-handbook-memo",
      directoryPath: ".munder/worktrees/agent-pam-docs",
      headCommit: "1a8e5f2",
      commitMessage: "docs: update cross-agent communication protocols and memos",
      status: "clean",
      filesChanged: 0,
      cliTool: "Cursor CLI"
    },
    {
      id: "wt-stanley",
      agentId: "agent-stanley-calc",
      agentName: "Stanley Hudson",
      avatarEmoji: "☕",
      branchName: "db/optimize-query-latency",
      directoryPath: ".munder/worktrees/agent-stanley-db",
      headCommit: "7d2b4a9",
      commitMessage: "perf: indexed vector search and memory persistence schema",
      status: "clean",
      filesChanged: 1,
      cliTool: "Codex CLI"
    },
    {
      id: "wt-ryan",
      agentId: "agent-ryan-intern",
      agentName: "Ryan Howard",
      avatarEmoji: "📱",
      branchName: "experimental/next-gen-autonomous-loops",
      directoryPath: ".munder/worktrees/agent-ryan-exp",
      headCommit: "8e3d0c4",
      commitMessage: "wip: test dynamic self-assembling agent subprocesses",
      status: "modified",
      filesChanged: 5,
      cliTool: "OpenCode CLI"
    }
  ]);

  const activeWorktree = worktrees.find((w) => w.id === selectedWorktreeId) || worktrees[0];

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setWorktrees((prev) =>
        prev.map((w) => ({
          ...w,
          status: "clean",
          filesChanged: 0
        }))
      );
      setIsSyncingAll(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. TOP HERO BANNER: Clone status & GitHub reference */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-cyan-950/60 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
            <FolderGit2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Git Worktree Isolation Harness</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono font-bold">
                {worktrees.length} Active Worktrees
              </span>
              {isDesktopShell && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono font-bold">
                  Desktop Shell Native
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              MAHR Worktree Virtualization • Each agent works on an isolated workspace branch in parallel without file collisions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/40 transition cursor-pointer"
          >
            <RefreshCw size={13} className={isSyncingAll ? "animate-spin" : ""} />
            <span>{isSyncingAll ? "Syncing Trees..." : "Sync All Trees"}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKTREE EXPLORER: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Worktree Branch List */}
        <div className="lg:col-span-1 flex flex-col gap-2">
          <div className="text-xs font-mono font-bold text-slate-400 px-1">
            Agent Isolated Branch Worktrees
          </div>

          <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
            {worktrees.map((wt) => {
              const isSelected = wt.id === selectedWorktreeId;
              return (
                <div
                  key={wt.id}
                  onClick={() => setSelectedWorktreeId(wt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected
                      ? "bg-purple-900/40 border-cyan-400 shadow-md ring-1 ring-cyan-400/40"
                      : "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{wt.avatarEmoji}</span>
                      <span className="text-xs font-bold text-white">{wt.agentName}</span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                        wt.status === "clean"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {wt.status === "clean" ? "Clean" : `${wt.filesChanged} Modified`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-purple-200 font-mono">
                    <GitBranch size={12} className="text-cyan-400 shrink-0" />
                    <span className="truncate font-semibold">{wt.branchName}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {wt.directoryPath}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Worktree Detailed Inspection & CLI Terminal Trigger */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeWorktree.avatarEmoji}</span>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{activeWorktree.agentName}</span>
                  <span className="text-xs text-slate-400 font-mono">({activeWorktree.cliTool})</span>
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                  <GitBranch size={12} />
                  <span>{activeWorktree.branchName}</span>
                </div>
              </div>
            </div>

            {onOpenCliForAgent && (
              <button
                onClick={() => onOpenCliForAgent(activeWorktree.agentId)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Terminal size={13} />
                <span>Launch CLI Shell</span>
              </button>
            )}
          </div>

          {/* Directory & Head Commit details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
              <span className="text-slate-500 text-[10px]">Filesystem Worktree Path:</span>
              <span className="text-slate-200 select-all font-semibold truncate">
                {activeWorktree.directoryPath}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
              <span className="text-slate-500 text-[10px]">HEAD Commit Hash:</span>
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <GitCommit size={13} className="text-cyan-400" />
                <span>{activeWorktree.headCommit}</span>
              </div>
            </div>
          </div>

          {/* Latest Commit Message */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/20 flex flex-col gap-1 font-mono text-xs">
            <span className="text-slate-500 text-[10px]">Latest Commit Message:</span>
            <span className="text-emerald-300 font-medium">
              "{activeWorktree.commitMessage}"
            </span>
          </div>

          {/* Simulated Diff Preview */}
          <div className="p-3.5 rounded-xl bg-[#050510] border border-slate-800 font-mono text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-white/5">
              <span>git diff --stat (Isolated Worktree)</span>
              <span className="text-cyan-400">Isolated Branch</span>
            </div>

            <pre className="text-slate-300 text-[11px] leading-relaxed overflow-x-auto">
              <code>
                <span className="text-slate-500">diff --git a/{activeWorktree.directoryPath}/agent.ts b/{activeWorktree.directoryPath}/agent.ts</span>{"\n"}
                <span className="text-cyan-400">@@ -14,6 +14,9 @@ export async function runTask()</span>{"\n"}
                <span className="text-emerald-400">+ const context = await loadMunderMemory();</span>{"\n"}
                <span className="text-emerald-400">+ const execution = await orchestrator.dispatch(context);</span>{"\n"}
                <span className="text-emerald-400">+ emitOfficeFloorEvent("task_completed", execution);</span>{"\n"}
                <span className="text-slate-400">  return execution.summary;</span>
              </code>
            </pre>
          </div>

          {/* Git Command Helper */}
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Worktree add command:</span>
            <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              git worktree add {activeWorktree.directoryPath} {activeWorktree.branchName}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
