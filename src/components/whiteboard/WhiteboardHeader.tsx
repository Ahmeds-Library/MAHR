import React, { useState, useRef, useEffect } from "react";
import {
  Palette,
  Undo,
  Redo,
  Layers,
  Settings2,
  Trash2,
  Download,
  Maximize2,
  HelpCircle,
  Presentation,
  Brain,
  GitCommit,
  Cpu,
  Sparkles,
  ChevronDown,
  Check,
  X,
  FileText,
  Mic
} from "lucide-react";
import { WhiteboardHeaderProps } from "./types";
import { MahrEmblemLogo } from "../brand/MahrEmblemLogo";

export interface StudioModeItem {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  badge: string;
}

export const STUDIO_MODES: StudioModeItem[] = [
  { id: "chalkboard", label: "2D Slate", category: "Canvas", icon: Palette, color: "from-purple-500 to-indigo-500", badge: "Chalkboard" },
  { id: "slides", label: "Slides Studio", category: "Presentations", icon: Presentation, color: "from-amber-500 to-orange-500", badge: "Google Slides" },
  { id: "mindmap", label: "Mind Map", category: "Knowledge", icon: Brain, color: "from-emerald-500 to-teal-500", badge: "Interactive Tree" },
  { id: "flowchart", label: "Flowchart", category: "Architecture", icon: GitCommit, color: "from-purple-500 to-pink-500", badge: "State Diagram" },
  { id: "3d-simulation", label: "AI Simulation", category: "Science & WebGL", icon: Sparkles, color: "from-cyan-500 to-blue-500", badge: "3D Physics" },
  { id: "dld", label: "DLD Lab", category: "Electronics", icon: Cpu, color: "from-rose-500 to-purple-500", badge: "Logic Simulator" },
];

export const WhiteboardHeader: React.FC<WhiteboardHeaderProps> = ({
  engineMode,
  onSelectEngineMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  layersCount,
  showLayersPanel,
  onToggleLayersPanel,
  onOpenUtilities,
  onClearCanvas,
  onExportCanvas,
  onToggleFullScreen,
  onToggleHelp,
  showHelper,
  onClose,
  activeLayoutMode = "canvas",
  onSelectLayoutMode,
  onToggleMahrVoice,
  isMahrVoiceOpen = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize engineMode for selection
  const activeTabId = engineMode === "2d-fluid" ? "3d-simulation" : engineMode;
  const currentMode = STUDIO_MODES.find((m) => m.id === activeTabId) || STUDIO_MODES[0];
  const CurrentIcon = currentMode?.icon || Palette;
  const isSlateMode = activeTabId === "chalkboard";

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 h-14 min-h-[56px] max-h-14 border-b border-amber-500/25 bg-gradient-to-r from-[#070b19]/98 via-[#0a1024]/98 to-[#060814]/98 backdrop-blur-2xl shadow-2xl select-none shrink-0 w-full overflow-visible">
      {/* Left: MAHR Official Logo & Brand Crest */}
      <div className="flex items-center gap-2.5 shrink-0">
        <MahrEmblemLogo size={32} showText={true} />
        <div className="hidden xl:flex items-center gap-1.5 pl-2.5 border-l border-white/10 text-[10px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Studio</span>
        </div>
      </div>

      {/* Center: Sleek Workspace Mode Dropdown (Zero Scroll, High Polish) */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-lg ${
            isDropdownOpen
              ? "bg-gradient-to-r from-amber-500/20 to-purple-600/20 border-amber-400/60 shadow-amber-500/20"
              : "bg-slate-900/90 hover:bg-slate-800/90 border-white/15 hover:border-amber-400/40 text-slate-200"
          }`}
          title="Switch Workspace Studio Mode"
        >
          <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500/30 to-purple-500/30 border border-amber-400/40 text-amber-300">
            <CurrentIcon size={12} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold tracking-tight text-white font-mono leading-none">
              {currentMode.label}
            </span>
            <span className="text-[9px] text-amber-300/80 font-mono tracking-wider leading-none mt-0.5">
              {currentMode.badge}
            </span>
          </div>
          <ChevronDown
            size={13}
            className={`text-amber-400 transition-transform duration-200 ml-1 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu Modal / Popover */}
        {isDropdownOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 rounded-2xl bg-[#090d1f]/98 border border-amber-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 mb-1 border-b border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                Select Workspace Engine
              </span>
              <span className="text-[9px] font-mono text-slate-400">6 Modes</span>
            </div>
            <div className="space-y-1">
              {STUDIO_MODES.map((mode) => {
                const Icon = mode?.icon || Palette;
                const isSelected = activeTabId === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onSelectEngineMode(mode.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500/25 to-purple-600/25 border border-amber-400/50 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-lg ${
                          isSelected
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                            : "bg-white/5 text-slate-400"
                        }`}
                      >
                        <Icon size={13} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="leading-tight">{mode.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          {mode.category}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: Workspace Utility Actions (Clean, Context-Aware, Zero Overlap) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* MAHR AI Voice & Intent Companion Button */}
        {onToggleMahrVoice && (
          <button
            onClick={onToggleMahrVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-200 cursor-pointer shadow-md ${
              isMahrVoiceOpen
                ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-amber-500/30 scale-105"
                : "bg-slate-900/90 border-amber-500/30 text-amber-300 hover:bg-amber-950/50 hover:border-amber-400"
            }`}
            title="MAHR Voice Companion: Command whiteboard, slides & simulations"
          >
            <Mic size={13} className={isMahrVoiceOpen ? "text-amber-300 animate-pulse" : "text-amber-400"} />
            <span className="hidden md:inline text-[10px] tracking-wider uppercase">MAHR Voice</span>
          </button>
        )}

        {/* 2D Slate-Only Actions: Hidden in Sub-Studios to prevent overlapping & confusion */}
        {isSlateMode && (
          <>
            {/* Undo / Redo */}
            <div className="hidden sm:flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo size={14} />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <Redo size={14} />
              </button>
            </div>

            {/* Layers Stack Button */}
            <button
              onClick={onToggleLayersPanel}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                showLayersPanel
                  ? "bg-purple-600/30 border-purple-500/60 text-purple-200"
                  : "border-white/10 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title="Toggle Layers Stack"
            >
              <Layers size={13} className="text-amber-400" />
              <span className="font-mono text-[10px] hidden md:inline font-bold">
                {layersCount}
              </span>
            </button>

            {/* Settings / Utilities (Grids, Audio, HUD, Replay) */}
            <button
              onClick={onOpenUtilities}
              className="p-1.5 rounded-xl border border-white/10 bg-slate-900/80 text-slate-300 hover:text-white hover:border-amber-400/40 transition-colors cursor-pointer"
              title="Blackboard Settings (Grids, Audio, HUD, Replay)"
            >
              <Settings2 size={14} />
            </button>

            {/* Clear Canvas */}
            <button
              onClick={onClearCanvas}
              className="p-1.5 rounded-xl border border-white/10 bg-slate-900/80 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="Clear Blackboard Canvas"
            >
              <Trash2 size={14} />
            </button>

            {/* Export Drawing */}
            <button
              onClick={onExportCanvas}
              className="p-1.5 rounded-xl border border-white/10 bg-slate-900/80 text-slate-300 hover:text-white hover:border-amber-400/40 transition-colors cursor-pointer"
              title="Export Canvas PNG"
            >
              <Download size={14} />
            </button>

            {/* Hints / Coach */}
            <button
              onClick={onToggleHelp}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                showHelper
                  ? "bg-purple-600/30 border-purple-500/60 text-purple-200"
                  : "border-white/10 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title="Toggle Smart Pen & Gesture Hints"
            >
              <HelpCircle size={14} />
            </button>
          </>
        )}

        {/* Fullscreen */}
        <button
          onClick={onToggleFullScreen}
          className="p-1.5 rounded-xl border border-white/10 bg-slate-900/80 text-slate-300 hover:text-white hover:border-amber-400/40 transition-colors cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize2 size={14} />
        </button>

        {/* Layout Modes Toggle (Split / Canvas / Notes) */}
        {onSelectLayoutMode && (
          <div className="hidden lg:flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
            <button
              onClick={() => onSelectLayoutMode("canvas")}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                activeLayoutMode === "canvas"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Full Studio Canvas"
            >
              Canvas
            </button>
            <button
              onClick={() => onSelectLayoutMode("split")}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                activeLayoutMode === "split"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Split View (Notes + Canvas)"
            >
              Split
            </button>
            <button
              onClick={() => onSelectLayoutMode("text")}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                activeLayoutMode === "text"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Lecture Notes Only"
            >
              Notes
            </button>
          </div>
        )}

        {/* Close Studio Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-white/10 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-rose-500 hover:border-rose-400 transition-all duration-200 cursor-pointer ml-1"
            title="Close Classroom Studio"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
