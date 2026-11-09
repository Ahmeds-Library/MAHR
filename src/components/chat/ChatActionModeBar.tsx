import React from "react";
import {
  Sparkles,
  PenTool,
  Code2,
  Presentation,
  BrainCircuit,
  Terminal,
  CornerDownLeft,
} from "lucide-react";
import { ChatActionMode, SlashCommandItem } from "./types";

interface ChatActionModeBarProps {
  activeMode: ChatActionMode;
  onSelectMode: (mode: ChatActionMode) => void;
  isSlashMenuOpen: boolean;
  filteredSlashCommands: SlashCommandItem[];
  selectedSlashIndex: number;
  onHoverSlashIndex: (idx: number) => void;
  onSelectSlashCommand: (cmd: SlashCommandItem) => void;
  onTriggerSlashMenu: () => void;
  disabled?: boolean;
}

const MODE_DEFINITIONS: Array<{
  id: ChatActionMode;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  activeClass: string;
  dotColor: string;
  tooltip: string;
}> = [
  {
    id: "auto",
    label: "Auto",
    icon: Sparkles,
    activeClass:
      "bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]",
    dotColor: "bg-cyan-400",
    tooltip: "Smart Auto Mode: Natural conversation + automatic tool & vector memory routing",
  },
  {
    id: "whiteboard",
    label: "Whiteboard",
    icon: PenTool,
    activeClass:
      "bg-emerald-500/20 text-emerald-200 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
    dotColor: "bg-emerald-400",
    tooltip: "Whiteboard Mode: Writes formulas, derivations & notes directly onto the Chalkboard",
  },
  {
    id: "code",
    label: "Code",
    icon: Code2,
    activeClass:
      "bg-indigo-500/25 text-indigo-200 border-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.25)]",
    dotColor: "bg-indigo-400",
    tooltip: "Code Mode: Generates clean code blocks & syncs to the Classroom Chalkboard",
  },
  {
    id: "slides",
    label: "Slides",
    icon: Presentation,
    activeClass:
      "bg-amber-500/20 text-amber-200 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    dotColor: "bg-amber-400",
    tooltip: "Slides Mode: Researches & launches an animated presentation in Slides Studio",
  },
  {
    id: "memory",
    label: "Memory",
    icon: BrainCircuit,
    activeClass:
      "bg-purple-500/25 text-purple-200 border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
    dotColor: "bg-purple-400",
    tooltip: "Memory Mode: Commits personal facts, deadlines & preferences to 128-D Vector Memory",
  },
];

export const ChatActionModeBar: React.FC<ChatActionModeBarProps> = ({
  activeMode,
  onSelectMode,
  isSlashMenuOpen,
  filteredSlashCommands,
  selectedSlashIndex,
  onHoverSlashIndex,
  onSelectSlashCommand,
  onTriggerSlashMenu,
  disabled = false,
}) => {
  return (
    <div className="relative px-3 py-1.5 bg-slate-900/90 border-t border-white/10 flex items-center justify-between gap-1.5 shrink-0">
      {/* Floating Slash Command Palette Popover */}
      {isSlashMenuOpen && (
        <div className="absolute bottom-full left-2.5 right-2.5 mb-1.5 z-40 bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/35 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(34,211,238,0.18)] overflow-hidden">
          <div className="px-3 py-1.5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
              <Terminal size={10} className="text-cyan-400" />
              <span>MAHR Slash Command Palette</span>
            </span>
            <span className="text-[8.5px] font-mono text-slate-400">
              ↑↓ Navigate • Enter Select
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-white/5 p-1">
            {filteredSlashCommands.map((item, idx) => {
              const isSelected = idx === selectedSlashIndex;
              return (
                <button
                  key={item.command}
                  type="button"
                  onMouseEnter={() => onHoverSlashIndex(idx)}
                  onClick={() => onSelectSlashCommand(item)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/20 border border-cyan-400/40 text-white"
                      : "hover:bg-white/5 text-slate-300 border border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10.5px] font-bold text-cyan-300">
                        {item.command}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-200 truncate">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <CornerDownLeft
                    size={11}
                    className={`shrink-0 ${
                      isSelected ? "text-cyan-300" : "text-slate-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Mode Pills */}
      <div className="flex flex-wrap items-center gap-1 overflow-hidden py-0.5">
        {MODE_DEFINITIONS.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMode(mode.id)}
              title={mode.tooltip}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9.5px] font-mono font-semibold border transition-all duration-150 cursor-pointer shrink-0 ${
                isActive
                  ? mode.activeClass
                  : "bg-slate-950/70 text-slate-400 border-white/10 hover:text-slate-200 hover:border-white/20"
              }`}
            >
              <Icon size={10} />
              <span>{mode.label}</span>
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full ${mode.dotColor} animate-pulse`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Slash Command Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onTriggerSlashMenu}
        title="Open / Slash Command Palette"
        className="px-2 py-1 rounded-lg bg-slate-950/80 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-400/40 text-[9.5px] font-mono font-bold text-cyan-300 flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <span>/cmd</span>
      </button>
    </div>
  );
};
