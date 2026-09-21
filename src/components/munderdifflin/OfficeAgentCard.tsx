// 🏢 Layer 3: OfficeAgentCard Component
// Agent workstation inspector showing their desk details, assigned tickets & mail

import React from "react";
import { OfficeAgent, OfficeTaskTicket, OfficeMemo } from "../../types/munderDifflinTypes";
import { 
  Crown, 
  Cpu, 
  Mail, 
  CheckCircle2, 
  Play, 
  Clock, 
  Tag, 
  MessageSquare, 
  Award,
  Sparkles,
  Zap
} from "lucide-react";

interface OfficeAgentCardProps {
  agent: OfficeAgent;
  agentTickets: OfficeTaskTicket[];
  agentMemos: OfficeMemo[];
  onExecuteTicket: (ticketId: string) => void;
  onBossSignOff: (ticketId: string) => void;
}

export function OfficeAgentCard({
  agent,
  agentTickets,
  agentMemos,
  onExecuteTicket,
  onBossSignOff
}: OfficeAgentCardProps) {
  const activeTicket = agentTickets.find((t) => t.status !== "approved");
  const completedTickets = agentTickets.filter((t) => t.status === "approved");

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#0e0e24] to-[#080816] border border-purple-500/30 p-5 flex flex-col gap-4 shadow-xl">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 flex items-center justify-center text-3xl shadow-inner">
            {agent.avatarEmoji}
            {agent.isBoss && (
              <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                <Crown size={12} />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">{agent.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono font-bold">
                {agent.nickname}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              {agent.characterRole}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
              <span>Desk #{agent.deskNumber}</span>
              <span>•</span>
              <span className="text-cyan-300 font-semibold">{agent.department}</span>
            </div>
          </div>
        </div>

        {/* Model & Quota Badge */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-mono">
            <Cpu size={12} className="text-purple-400" />
            <span className="truncate max-w-[120px]">{agent.assignedModelId}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Award size={10} className="text-amber-400" />
            {agent.tasksCompleted} Tasks Completed
          </span>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/5 text-xs italic text-slate-300 font-mono">
        "{agent.quote}"
      </div>

      {/* Desk Prop, CLI Tool & Dundie Badge */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-purple-500/20 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-sm">📌</span>
          <span className="font-semibold text-slate-200">Desk Prop:</span>
          <span className="text-cyan-300">{agent.deskProp}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold text-[10px]">
            CLI: {agent.cliTool}
          </span>
          {agent.dundieAward && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[10px] flex items-center gap-1">
              <Award size={10} />
              {agent.dundieAward}
            </span>
          )}
        </div>
      </div>

      {/* Specialties Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-slate-400 font-mono font-semibold flex items-center gap-1">
          <Tag size={10} /> Specialties:
        </span>
        {agent.specialties.map((spec, i) => (
          <span
            key={i}
            className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800/80 text-cyan-200 border border-cyan-500/20"
          >
            {spec}
          </span>
        ))}
      </div>

      {/* Active Workstation Ticket */}
      <div className="rounded-xl bg-[#060612] border border-white/10 p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles size={12} className="text-purple-400" />
            Current Desk Assignment
          </span>
          {activeTicket ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase font-bold">
              {activeTicket.status.replace("_", " ")}
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
              Desk Idle (Ready)
            </span>
          )}
        </div>

        {activeTicket ? (
          <div className="flex flex-col gap-2 pt-1">
            <div className="text-xs font-bold text-white">{activeTicket.title}</div>
            <p className="text-xs text-slate-400">{activeTicket.goal}</p>

            {/* Deliverable preview if ready */}
            {activeTicket.outputDeliverable && (
              <div className="mt-1 p-2.5 rounded-lg bg-slate-900/90 border border-purple-500/20 text-xs font-mono text-slate-200 max-h-36 overflow-y-auto whitespace-pre-wrap">
                {activeTicket.outputDeliverable}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 mt-2">
              {activeTicket.status === "assigned" && (
                <button
                  onClick={() => onExecuteTicket(activeTicket.id)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/40 cursor-pointer transition-all"
                >
                  <Play size={12} />
                  Execute Agent Work
                </button>
              )}

              {activeTicket.status === "boss_review" && (
                <button
                  onClick={() => onBossSignOff(activeTicket.id)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/40 cursor-pointer transition-all"
                >
                  <Crown size={12} className="text-amber-300" />
                  Grant Boss Sign-Off
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-500 font-mono">
            No active assignment right now. Use the **Boss Mission Console** to delegate a task!
          </div>
        )}
      </div>

      {/* Agent's Recent Mailbox */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <Mail size={12} className="text-cyan-400" />
            Desk Mailbox ({agentMemos.length})
          </span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
          {agentMemos.length > 0 ? (
            agentMemos.map((memo) => (
              <div
                key={memo.id}
                className="p-2 rounded-lg bg-slate-900/70 border border-white/5 flex flex-col gap-1 text-[11px]"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-200 truncate max-w-[200px]">{memo.subject}</span>
                  <span className="text-[9px] text-slate-500">{memo.timestamp}</span>
                </div>
                <p className="text-slate-400 text-[10px] line-clamp-2">{memo.content}</p>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-slate-500 font-mono py-2 text-center">
              Mailbox inbox is clear.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
