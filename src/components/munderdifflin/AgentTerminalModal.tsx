// 🏢 Layer 3: AgentTerminalModal Component
// Interactive Multi-Agent CLI Terminal for Munder-Difflin (Claude Code, Gemini CLI, Cursor, etc.)

import React, { useState, useRef, useEffect } from "react";
import { OfficeAgent } from "../../types/munderDifflinTypes";
import { Terminal, Send, X, Sparkles, Play, ShieldAlert, CheckCircle2, CornerDownLeft } from "lucide-react";
import { motion } from "motion/react";

interface AgentTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: OfficeAgent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onRunCommand: (agentId: string, command: string) => void;
}

export function AgentTerminalModal({
  isOpen,
  onClose,
  agents,
  selectedAgentId,
  onSelectAgent,
  onRunCommand
}: AgentTerminalModalProps) {
  const [commandInput, setCommandInput] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeAgent?.terminalLogs]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandInput.trim() || !activeAgent) return;
    onRunCommand(activeAgent.id, commandInput);
    setCommandInput("");
  };

  const handlePreset = (cmd: string) => {
    if (!activeAgent) return;
    onRunCommand(activeAgent.id, cmd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-4xl h-[85vh] rounded-3xl bg-[#070714] border border-cyan-500/40 shadow-2xl flex flex-col overflow-hidden text-slate-100 font-mono"
      >
        {/* Terminal Window Header Bar */}
        <div className="px-5 py-3 border-b border-cyan-500/25 bg-[#050510] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {/* Terminal Window Dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Terminal size={14} className="text-cyan-400" />
              <span>munder-difflin-cli // {activeAgent.cliTool}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-200">
              Host: munder-difflin.local
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Agent Switcher Tabs */}
        <div className="px-4 py-2 border-b border-white/5 bg-[#090918] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs">
          {agents.map((agent) => {
            const isActive = agent.id === activeAgent.id;
            return (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-sm"
                    : "bg-black/30 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <span>{agent.avatarEmoji}</span>
                <span>{agent.nickname}</span>
                <span className="text-[9px] px-1 rounded bg-black/40 text-slate-400">
                  {agent.cliTool}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Terminal Output View */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#04040c] text-xs flex flex-col gap-2 font-mono select-text">
          <div className="text-slate-500 pb-2 border-b border-white/5">
            Munder-Difflin Multi-Agent Autonomous Harness v2.4.0 (x86_64-linux)
            <br />
            Process PID: #{activeAgent.deskNumber * 1024 + 42} • CLI: {activeAgent.cliTool} • Model: {activeAgent.assignedModelId}
            <br />
            Type commands below or click preset action triggers.
          </div>

          {activeAgent.terminalLogs.map((log, index) => {
            const isCommand = log.startsWith("[");
            const isError = log.includes("ERROR") || log.includes("FAIL");
            const isWarning = log.includes("WARN") || log.includes("SECURITY");
            const isSuccess = log.includes("PASSED") || log.includes("GREEN") || log.includes("Approved");

            return (
              <div
                key={index}
                className={`leading-relaxed whitespace-pre-wrap ${
                  isError
                    ? "text-rose-400 font-bold"
                    : isWarning
                    ? "text-amber-300"
                    : isSuccess
                    ? "text-emerald-300"
                    : log.includes("@munder-difflin")
                    ? "text-cyan-300 font-bold"
                    : "text-slate-300"
                }`}
              >
                {log}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>

        {/* Preset Command Shortcuts */}
        <div className="px-4 py-2 border-t border-white/5 bg-[#080816] flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
          <span className="text-slate-500 text-[10px]">Presets:</span>
          {[
            { label: "status", cmd: "status --verbose" },
            { label: "audit", cmd: "audit --strict" },
            { label: "test", cmd: "run-tests --all" },
            { label: "recall-memory", cmd: "memory --recall-all" },
            { label: "prank", cmd: "jello-prank --target dwight" }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.cmd)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-white/10 transition-colors cursor-pointer whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Terminal Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-cyan-500/20 bg-[#050512] flex items-center gap-2 shrink-0"
        >
          <span className="text-cyan-400 font-bold text-sm">$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder={`Enter command for ${activeAgent.name} (${activeAgent.cliTool})...`}
            className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <span>Execute</span>
            <CornerDownLeft size={12} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
