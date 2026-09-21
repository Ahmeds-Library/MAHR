import React, { useState, useRef } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Brain,
  Link,
  HelpCircle,
  GripHorizontal,
  ChevronDown,
  Check,
  Edit2,
  Layers,
} from "lucide-react";
import {
  InteractiveMindMapNode,
  MINDMAP_COLOR_PALETTES,
  MindMapColor,
} from "../../types/mindMapTypes";

interface MindMapNodeCardProps {
  node: InteractiveMindMapNode;
  isSelected: boolean;
  isConnectingSource: boolean;
  isHighlightedBySearch: boolean;
  hasSearchQuery: boolean;
  onSelect: () => void;
  onStartDrag: (e: React.PointerEvent) => void;
  onExpand: () => void;
  onAddChild: () => void;
  onStartConnect: (e: React.PointerEvent) => void;
  onUpdate: (patch: Partial<InteractiveMindMapNode>) => void;
  onDelete: () => void;
  onOpenDetails: () => void;
  onAskMahr?: (question: string) => void;
}

export const MindMapNodeCard: React.FC<MindMapNodeCardProps> = ({
  node,
  isSelected,
  isConnectingSource,
  isHighlightedBySearch,
  hasSearchQuery,
  onSelect,
  onStartDrag,
  onExpand,
  onAddChild,
  onStartConnect,
  onUpdate,
  onDelete,
  onOpenDetails,
  onAskMahr,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(node.title);
  const palette = MINDMAP_COLOR_PALETTES[node.color] || MINDMAP_COLOR_PALETTES.purple;

  const handleFinishTitleEdit = () => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== node.title) {
      onUpdate({ title: editedTitle.trim() });
    }
  };

  const isDimmed = hasSearchQuery && !isHighlightedBySearch;

  return (
    <div
      style={{
        transform: `translate3d(${node.x - node.w / 2}px, ${node.y - node.h / 2}px, 0)`,
        width: `${node.w}px`,
        boxShadow: isSelected
          ? `0 0 25px ${palette.glow}, 0 10px 30px rgba(0,0,0,0.8)`
          : `0 8px 24px rgba(0,0,0,0.6)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute top-0 left-0 rounded-2xl border backdrop-blur-xl transition-shadow select-none group cursor-default z-10 ${
        palette.bg
      } ${
        isSelected
          ? `${palette.border} ring-2 ring-purple-400/50 shadow-2xl`
          : "border-white/10 hover:border-white/30"
      } ${isConnectingSource ? "ring-2 ring-cyan-400 animate-pulse" : ""} ${
        isDimmed ? "opacity-25 grayscale" : "opacity-100"
      }`}
    >
      {/* Drag Grip Handle */}
      <div
        onPointerDown={onStartDrag}
        className="px-3 py-1.5 border-b border-white/5 bg-white/[0.03] flex items-center justify-between cursor-grab active:cursor-grabbing rounded-t-2xl"
        title="Click and drag to freely position this node anywhere"
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal size={12} className="text-slate-400 group-hover:text-white transition-colors" />
          {node.isRoot && (
            <span className="text-[9px] font-mono font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              👑 Root Topic
            </span>
          )}
          {!node.isRoot && node.clusterName && (
            <span className="text-[8.5px] font-mono text-slate-400 truncate max-w-[110px]">
              {node.clusterName}
            </span>
          )}
        </div>

        {/* Vector Memory Relevance Pill */}
        {node.vectorSimilarity !== undefined && (
          <span
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border flex items-center gap-0.5 ${palette.badge}`}
            title={`Vector Memory Cosine Match: ${Math.round(node.vectorSimilarity * 100)}%`}
          >
            <Brain size={9} className="animate-pulse" />
            <span>{Math.round(node.vectorSimilarity * 100)}%</span>
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-3">
        {isEditingTitle ? (
          <div className="flex items-center gap-1 mb-1">
            <input
              type="text"
              autoFocus
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFinishTitleEdit();
                if (e.key === "Escape") setIsEditingTitle(false);
              }}
              onBlur={handleFinishTitleEdit}
              className="w-full bg-slate-900 border border-purple-500 rounded px-1.5 py-0.5 text-xs text-white outline-none font-bold"
            />
            <button
              onClick={handleFinishTitleEdit}
              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded cursor-pointer"
            >
              <Check size={12} />
            </button>
          </div>
        ) : (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="flex items-start justify-between gap-1 group/title cursor-text mb-1"
            title="Double-click to edit title"
          >
            <h4 className={`text-xs font-bold leading-tight tracking-wide ${palette.text}`}>
              {node.title}
            </h4>
            <Edit2
              size={10}
              className="opacity-0 group-hover/title:opacity-100 text-slate-400 shrink-0 mt-0.5 transition-opacity"
            />
          </div>
        )}

        {/* Description Preview */}
        {node.description && (
          <p className="text-[10px] text-slate-300 leading-normal line-clamp-2 mb-2 font-sans font-normal">
            {node.description}
          </p>
        )}

        {/* Dynamic Vector Memory Expand Button */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            disabled={node.isExpanding}
            className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              node.isExpanding
                ? "bg-purple-900/60 text-purple-200 border border-purple-500/50 animate-pulse"
                : "bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 border border-purple-500/30 hover:border-purple-400 active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
            }`}
            title="Query vector memory to dynamically spawn deep sub-concepts"
          >
            <Sparkles size={10} className={node.isExpanding ? "animate-spin text-amber-300" : "text-amber-400"} />
            <span>{node.isExpanding ? "Expanding..." : "Expand (Memory)"}</span>
          </button>

          {/* Quick Actions (Add Child, Connect, Inspect) */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              title="Add child branch node"
            >
              <Plus size={11} />
            </button>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                onStartConnect(e);
              }}
              className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded transition cursor-crosshair"
              title="Drag arrow to connect to another node"
            >
              <Link size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails();
              }}
              className="p-1 text-slate-400 hover:text-amber-300 hover:bg-amber-500/20 rounded transition cursor-pointer"
              title="View deep details & vector memories"
            >
              <Layers size={11} />
            </button>
            {onAskMahr && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAskMahr(`Explain the concept of ${node.title} and its fundamental principles.`);
                }}
                className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-500/20 rounded transition cursor-pointer"
                title="Ask MAHR to explain this node"
              >
                <HelpCircle size={11} />
              </button>
            )}
            {!node.isRoot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 rounded transition cursor-pointer"
                title="Delete node"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Anchor Points (Visual indication for manual linking) */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartConnect(e);
        }}
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 border border-slate-900 cursor-crosshair opacity-0 group-hover:opacity-100 hover:scale-125 transition-all shadow-[0_0_8px_rgba(6,182,212,0.8)]"
        title="Drag link from this anchor"
      />
    </div>
  );
};
