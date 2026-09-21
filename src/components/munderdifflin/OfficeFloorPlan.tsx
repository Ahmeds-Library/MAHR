// 🏢 Layer 3: OfficeFloorPlan Component
// Authentic Munder-Difflin 2D spatial floor plan with zones, desk props, CLI badges, and Standups

import React, { useState } from "react";
import { OfficeAgent, OfficeDeskZone } from "../../types/munderDifflinTypes";
import { 
  Crown, 
  Coffee, 
  Users, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Terminal, 
  Trophy, 
  Sparkles,
  Building,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OfficeFloorPlanProps {
  agents: OfficeAgent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onOpenBossSuite: () => void;
  onCallStandup?: () => void;
  isConferenceActive?: boolean;
  standupTranscript?: string[];
  onAwardDundie?: (agentId: string) => void;
  onCoffeeBreak?: (agentId: string) => void;
  onOpenCli?: (agentId: string) => void;
}

export function OfficeFloorPlan({
  agents,
  selectedAgentId,
  onSelectAgent,
  onOpenBossSuite,
  onCallStandup,
  isConferenceActive = false,
  standupTranscript = [],
  onAwardDundie,
  onCoffeeBreak,
  onOpenCli
}: OfficeFloorPlanProps) {
  const [activeZoneFilter, setActiveZoneFilter] = useState<"all" | OfficeDeskZone>("all");

  const boss = agents.find((a) => a.isBoss);

  // Filter agents by zone if filter is active
  const filteredAgents = activeZoneFilter === "all"
    ? agents
    : agents.filter((a) => a.deskZone === activeZoneFilter);

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#0a0a1c] via-[#0c0c24] to-[#070716] border border-purple-500/25 p-4 md:p-5 overflow-hidden shadow-2xl flex flex-col gap-3 min-h-[560px]">
      {/* Blueprint Grid Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168, 85, 247, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px"
        }}
      />

      {/* Ambient Floor Glows */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-96 h-36 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-6 left-16 w-80 h-36 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP HEADER & QUICK INTERACTIVE CONTROLS */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-400/40 text-[10px] font-mono text-purple-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Building size={12} className="text-purple-400" />
            <span>Munder-Difflin Floor Plan</span>
          </div>
          <span className="text-xs text-slate-400 hidden md:inline font-mono">
            13 Desks • Real-time Multi-Agent Floor
          </span>
        </div>

        {/* Office Interactive Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Emergency Standup in Conference Room */}
          {onCallStandup && (
            <button
              onClick={onCallStandup}
              disabled={isConferenceActive}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isConferenceActive
                  ? "bg-amber-600 text-white animate-pulse"
                  : "bg-slate-900/90 hover:bg-purple-900/40 border border-purple-500/40 text-purple-200 hover:text-white"
              }`}
              title="Call an emergency standup meeting in the Conference Room!"
            >
              <Users size={13} className="text-cyan-400" />
              <span>{isConferenceActive ? "Meeting in Progress..." : "Emergency Standup"}</span>
            </button>
          )}

          {/* Dundie Award Button */}
          {onAwardDundie && selectedAgentId && (
            <button
              onClick={() => onAwardDundie(selectedAgentId)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Award a Dundie to the selected agent!"
            >
              <Trophy size={13} className="text-amber-300" />
              <span className="hidden sm:inline">Award Dundie</span>
            </button>
          )}

          {/* Coffee Break Button */}
          {onCoffeeBreak && selectedAgentId && (
            <button
              onClick={() => onCoffeeBreak(selectedAgentId)}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Send selected agent to the breakroom for fresh coffee"
            >
              <Coffee size={13} className="text-cyan-300" />
              <span className="hidden sm:inline">Breakroom</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ZONE FILTER TABS */}
      <div className="relative z-10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
        <span className="text-slate-500 text-[10px] mr-1 hidden sm:inline">Floor Zones:</span>
        {[
          { key: "all", label: "All Desks (13)" },
          { key: "boss_office", label: "👑 Executive Suite" },
          { key: "reception", label: "🎨 Reception" },
          { key: "sales_bullpen", label: "💼 Sales Bullpen" },
          { key: "accounting", label: "🧮 Accounting & QA" },
          { key: "annex", label: "📦 The Annex" }
        ].map((zone) => (
          <button
            key={zone.key}
            onClick={() => setActiveZoneFilter(zone.key as any)}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
              activeZoneFilter === zone.key
                ? "bg-purple-600 border-purple-400 text-white font-bold shadow-md shadow-purple-900/40"
                : "bg-slate-900/70 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {zone.label}
          </button>
        ))}
      </div>

      {/* 3. CONFERENCE ROOM STANDUP ACTIVE OVERLAY BANNER */}
      <AnimatePresence>
        {isConferenceActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-20 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-cyan-950/90 border border-amber-400/50 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-400/30 text-amber-200 font-mono text-xs font-bold">
              <div className="flex items-center gap-2">
                <Volume2 size={14} className="text-amber-400 animate-bounce" />
                <span>CONFERENCE ROOM STANDUP • LIVE BROADCAST</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px]">
                MICHAEL SCOTT HOSTING
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-1.5 max-h-32 overflow-y-auto text-[11px] font-mono text-slate-200">
              {standupTranscript.map((line, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className="p-1 rounded bg-black/40 border border-white/5"
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. EXECUTIVE SUITE (MAHR / Michael Scott) FEATURED CARD */}
      {boss && (activeZoneFilter === "all" || activeZoneFilter === "boss_office") && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => {
            onSelectAgent(boss.id);
            onOpenBossSuite();
          }}
          className={`relative z-10 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 shadow-lg ${
            selectedAgentId === boss.id
              ? "bg-purple-950/60 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/60"
              : "bg-slate-900/80 hover:bg-purple-950/40 border-purple-500/40 hover:border-purple-300"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 flex items-center justify-center text-2xl shadow-lg border border-purple-300/40">
                {boss.avatarEmoji}
                <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-purple-400">
                  <Crown size={12} className="text-amber-300" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white tracking-wide">{boss.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 font-mono font-bold">
                    {boss.nickname}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono font-bold flex items-center gap-1">
                    <Trophy size={10} className="text-amber-300" />
                    <span>World's Best Boss</span>
                  </span>
                </div>
                <div className="text-xs text-purple-300/90 font-mono">
                  {boss.characterRole}
                </div>
              </div>
            </div>

            {/* Boss Desk Prop & CLI Tool */}
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <div className="px-2 py-1 rounded-lg bg-slate-800/90 border border-purple-400/30 text-purple-200 flex items-center gap-1">
                <span>☕</span>
                <span>{boss.deskProp}</span>
              </div>
              <div className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center gap-1 font-bold">
                <Terminal size={11} />
                <span>{boss.cliTool}</span>
              </div>
            </div>
          </div>

          {/* Boss Quote */}
          <div className="mt-2.5 pt-2 border-t border-purple-500/20 text-[11px] font-mono italic text-purple-200/90 truncate">
            "{boss.quote}"
          </div>
        </motion.div>
      )}

      {/* 5. INTERACTIVE AGENTS DESKS GRID */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-1 overflow-y-auto pr-1">
        {filteredAgents
          .filter((a) => !a.isBoss || activeZoneFilter === "boss_office")
          .map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            const isWorking = agent.status === "working";
            const isReviewing = agent.status === "reviewing";
            const isCoffee = agent.status === "coffee_break";

            return (
              <motion.div
                key={agent.id}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => onSelectAgent(agent.id)}
                className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between gap-2.5 select-none shadow-md ${
                  isSelected
                    ? "bg-purple-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/60"
                    : "bg-slate-900/80 hover:bg-slate-800/90 border-slate-700/60 hover:border-slate-500"
                }`}
              >
                {/* Working Glow Animation Ring */}
                {isWorking && (
                  <span className="absolute -inset-0.5 rounded-xl border border-cyan-400 animate-pulse pointer-events-none opacity-60" />
                )}

                {/* Desk Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl shrink-0 p-1.5 rounded-xl bg-slate-800/90 border border-white/10 shadow-sm">
                      {agent.avatarEmoji}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate" title={agent.name}>
                        {agent.name}
                      </div>
                      <div className="text-[10px] text-purple-300 font-mono truncate font-semibold" title={agent.nickname}>
                        {agent.nickname}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono truncate">
                        Desk #{agent.deskNumber} • {agent.department.split(" ")[0]}
                      </div>
                    </div>
                  </div>

                  {/* Mailbox / Status badge */}
                  <div className="flex flex-col items-end gap-1">
                    {agent.unreadMailCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[9px] font-mono font-bold shrink-0 flex items-center gap-0.5">
                        <Mail size={8} />
                        {agent.unreadMailCount}
                      </span>
                    )}
                    {agent.dundieAward && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[8px] font-mono font-bold flex items-center gap-0.5" title={agent.dundieAward}>
                        <Trophy size={8} />
                        Dundie
                      </span>
                    )}
                  </div>
                </div>

                {/* Desk Prop & CLI Tool Badge */}
                <div className="flex items-center justify-between gap-1 text-[9px] font-mono bg-black/30 p-1.5 rounded-lg border border-white/5">
                  <span className="text-slate-300 truncate max-w-[130px]" title={agent.deskProp}>
                    {agent.deskProp}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold shrink-0">
                    {agent.cliTool}
                  </span>
                </div>

                {/* Work Status Footer & Quick CLI Trigger */}
                <div className="flex items-center justify-between text-[9px] font-mono pt-1.5 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    {isWorking ? (
                      <span className="text-cyan-300 flex items-center gap-1 font-bold">
                        <Clock size={9} className="animate-spin" />
                        Working
                      </span>
                    ) : isReviewing ? (
                      <span className="text-amber-300 flex items-center gap-1 font-bold">
                        <AlertCircle size={9} />
                        In Review
                      </span>
                    ) : isCoffee ? (
                      <span className="text-cyan-300 flex items-center gap-1 font-bold">
                        <Coffee size={9} />
                        Breakroom
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <CheckCircle2 size={9} className="text-emerald-400" />
                        Idle ({agent.tasksCompleted} done)
                      </span>
                    )}
                  </div>

                  {onOpenCli && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAgent(agent.id);
                        onOpenCli(agent.id);
                      }}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Open interactive CLI terminal for this agent"
                    >
                      <Terminal size={9} className="text-cyan-400" />
                      <span>CLI</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
