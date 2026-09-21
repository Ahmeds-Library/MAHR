"use client";

import React, { useState } from "react";
import {
  Play,
  RotateCcw,
  Plus,
  Zap,
  GitBranch,
  ArrowRight,
  Download,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { FLOWCHART_PRESETS, PURPLE, AMBER, EMERALD } from "../../lib/flowchartPresets";
import { FlowchartPreset } from "../../types/flowchartTypes";

interface FlowchartToolbarProps {
  currentPresetId: string;
  onSelectPreset: (preset: FlowchartPreset) => void;
  onGenerateFromPrompt: (prompt: string) => void;
  onAddNode: (type: "trigger" | "condition" | "action") => void;
  onRunSimulation: () => void;
  onResetWorkflow: () => void;
  isSimulating: boolean;
  onExport: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetView: () => void;
}

export function FlowchartToolbar({
  currentPresetId,
  onSelectPreset,
  onGenerateFromPrompt,
  onAddNode,
  onRunSimulation,
  onResetWorkflow,
  isSimulating,
  onExport,
  zoom,
  onZoomChange,
  onResetView,
}: FlowchartToolbarProps) {
  const [promptText, setPromptText] = useState("");
  const [showPromptInput, setShowPromptInput] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    onGenerateFromPrompt(promptText.trim());
    setPromptText("");
    setShowPromptInput(false);
  };

  return (
    <div className="px-4 py-2.5 border-b border-white/10 bg-[#090914]/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-30 select-none text-xs font-mono">
      {/* Left: Preset Selector & Prompt Generator */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-purple-300 mr-1">
          <GitBranch size={14} className="text-purple-400" />
          <span className="text-[11px] uppercase tracking-wider hidden sm:inline">Flowchart Engine</span>
        </div>

        {/* Preset Selector */}
        <select
          value={currentPresetId}
          onChange={(e) => {
            const found = FLOWCHART_PRESETS.find((p) => p.id === e.target.value);
            if (found) onSelectPreset(found);
          }}
          className="bg-slate-900 border border-white/15 text-slate-200 rounded-lg px-2.5 py-1 text-[11px] outline-none hover:border-purple-400 focus:border-purple-400 cursor-pointer transition max-w-[210px] truncate"
        >
          {FLOWCHART_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Generate from prompt button */}
        <button
          type="button"
          onClick={() => setShowPromptInput(!showPromptInput)}
          className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer text-[11px] ${
            showPromptInput
              ? "bg-purple-500/20 border-purple-400 text-purple-200"
              : "bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:border-white/20"
          }`}
          title="Synthesize flowchart from custom topic"
        >
          <Sparkles size={11} className="text-purple-400" />
          <span>✨ Custom Prompt</span>
        </button>

        {/* Node Add Buttons */}
        <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 gap-0.5 ml-1">
          <button
            type="button"
            onClick={() => onAddNode("trigger")}
            className="px-2 py-1 rounded-md text-[10px] hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
            title="Add Trigger Step Node"
          >
            <Zap size={11} className="text-purple-400" />
            <span className="hidden md:inline">+ Trigger</span>
          </button>
          <button
            type="button"
            onClick={() => onAddNode("condition")}
            className="px-2 py-1 rounded-md text-[10px] hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
            title="Add If/Else Condition Card"
          >
            <GitBranch size={11} className="text-amber-400" />
            <span className="hidden md:inline">+ Condition</span>
          </button>
          <button
            type="button"
            onClick={() => onAddNode("action")}
            className="px-2 py-1 rounded-md text-[10px] hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
            title="Add Action Node"
          >
            <ArrowRight size={11} className="text-emerald-400" />
            <span className="hidden md:inline">+ Action</span>
          </button>
        </div>
      </div>

      {/* Right: Simulation runner & Zoom Controls */}
      <div className="flex items-center gap-2">
        {/* Run Step-by-Step Simulation */}
        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isSimulating}
          className={`px-3 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
            isSimulating
              ? "bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse cursor-not-allowed"
              : "bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
          }`}
          title="Simulate step-by-step token and condition evaluation"
        >
          <Play size={11} className={isSimulating ? "text-amber-400" : "text-purple-400"} />
          <span>{isSimulating ? "Evaluating..." : "Run Flow"}</span>
        </button>

        <button
          type="button"
          onClick={onResetWorkflow}
          className="p-1.5 rounded-lg border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:border-white/20 transition cursor-pointer"
          title="Reset Flowchart Status"
        >
          <RotateCcw size={12} />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-l border-white/10 pl-2">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.4, zoom - 0.1))}
            className="p-1 rounded bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={11} />
          </button>
          <span
            onClick={onResetView}
            className="text-[10px] text-slate-400 font-mono w-10 text-center cursor-pointer hover:text-white"
            title="Click to reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(1.8, zoom + 0.1))}
            className="p-1 rounded bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={11} />
          </button>
        </div>

        {/* Export JSON / PNG */}
        <button
          type="button"
          onClick={onExport}
          className="p-1.5 rounded-lg border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:border-white/20 transition cursor-pointer ml-1"
          title="Export Flowchart Snapshot"
        >
          <Download size={12} />
        </button>
      </div>

      {/* Floating Prompt Input Form */}
      {showPromptInput && (
        <form
          onSubmit={handleGenerate}
          className="w-full flex items-center gap-2 pt-2 border-t border-white/10 animate-pop-in"
        >
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="E.g., 'Bubble sort step decision', 'User 2FA login verification', 'Cellular respiration cascade'..."
            className="flex-1 bg-slate-900 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.4)]"
          >
            Generate Flowchart
          </button>
        </form>
      )}
    </div>
  );
}
