import React from "react";
import {
  Sparkles,
  Plus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  BookOpen,
  Share2,
  Brain,
  Download,
  FolderOpen,
  X,
  Compass,
  GitBranch,
} from "lucide-react";
import { MindMapLayoutMode, MindMapPreset } from "../../types/mindMapTypes";
import { MINDMAP_PRESETS } from "../../services/mindMapVectorService";

interface MindMapToolbarProps {
  layoutMode: MindMapLayoutMode;
  onChangeLayout: (mode: MindMapLayoutMode) => void;
  onAddFloatingNode: () => void;
  onAutoBalance: () => void;
  onZoomToFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchMatchesCount: number;
  nodeCount: number;
  edgeCount: number;
  onSelectPreset: (presetId: string) => void;
  onExportMarkdown: () => void;
  onClose?: () => void;
}

export const MindMapToolbar: React.FC<MindMapToolbarProps> = ({
  layoutMode,
  onChangeLayout,
  onAddFloatingNode,
  onAutoBalance,
  onZoomToFit,
  onZoomIn,
  onZoomOut,
  zoom,
  searchQuery,
  onSearchChange,
  searchMatchesCount,
  nodeCount,
  edgeCount,
  onSelectPreset,
  onExportMarkdown,
  onClose,
}) => {
  return (
    <div className="px-4 py-2.5 bg-slate-950/80 border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-30 shadow-lg">
      {/* Left side: Brand, Title, and Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Brain size={14} className="text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-100">
                Interactive Mind Map
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                Vector Engine
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400">
              <span>{nodeCount} nodes</span>
              <span>•</span>
              <span>{edgeCount} links</span>
              <span>•</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-white/10">
          <FolderOpen size={11} className="text-slate-400" />
          <select
            onChange={(e) => onSelectPreset(e.target.value)}
            defaultValue=""
            className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-300 outline-none hover:border-purple-400/50 cursor-pointer transition-all"
          >
            <option value="" disabled>Load Study Preset...</option>
            {MINDMAP_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Search & Filter */}
      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <div className="relative w-full">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 focus:border-cyan-500 rounded-lg pl-7 pr-7 py-1 text-[10px] font-mono text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={11} />
            </button>
          )}
        </div>
        {searchQuery && (
          <span className="text-[9px] font-mono text-cyan-400 whitespace-nowrap">
            {searchMatchesCount} match{searchMatchesCount !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Right side: Layout, Tools, Zoom, Export, Close */}
      <div className="flex items-center gap-2">
        {/* Layout Mode Switcher */}
        <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 gap-0.5">
          <button
            onClick={() => onChangeLayout("radial")}
            className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
              layoutMode === "radial"
                ? "bg-purple-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Radial Mind Map (Center-outward)"
          >
            <Compass size={11} />
            <span className="hidden sm:inline">Radial</span>
          </button>
          <button
            onClick={() => onChangeLayout("tree-horizontal")}
            className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
              layoutMode === "tree-horizontal"
                ? "bg-purple-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Horizontal Tree (Left-to-Right)"
          >
            <GitBranch size={11} />
            <span className="hidden sm:inline">Tree</span>
          </button>
        </div>

        {/* Add Floating Node */}
        <button
          onClick={onAddFloatingNode}
          className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          title="Create an independent topic node"
        >
          <Plus size={11} />
          <span>New Node</span>
        </button>

        {/* Re-balance Layout */}
        <button
          onClick={onAutoBalance}
          className="p-1.5 bg-slate-900 border border-white/10 hover:border-purple-400/40 text-slate-300 hover:text-purple-300 rounded-lg text-[10px] cursor-pointer transition-all"
          title="Auto-balance all node positions"
        >
          <RotateCcw size={12} />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-white/10 rounded-lg p-0.5">
          <button
            onClick={onZoomOut}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={onZoomToFit}
            className="px-1.5 py-0.5 text-[9px] font-mono text-slate-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
            title="Zoom to Fit All"
          >
            Fit
          </button>
          <button
            onClick={onZoomIn}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
        </div>

        {/* Export Markdown to Whiteboard */}
        <button
          onClick={onExportMarkdown}
          className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          title="Export formatted Markdown outline to Whiteboard text screen"
        >
          <Download size={11} />
          <span className="hidden md:inline">Export</span>
        </button>

        {/* Close Button if rendered inside a modal/sub-canvas */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-900 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer transition-all"
            title="Exit Mind Map Studio"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
