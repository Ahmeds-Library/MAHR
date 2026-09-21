import React, { useState } from "react";
import {
  X,
  Brain,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Palette,
  Layers,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import {
  InteractiveMindMapNode,
  MINDMAP_COLOR_PALETTES,
  MindMapColor,
} from "../../types/mindMapTypes";

interface MindMapDetailModalProps {
  node: InteractiveMindMapNode | null;
  onClose: () => void;
  onUpdate: (nodeId: string, patch: Partial<InteractiveMindMapNode>) => void;
  onAskMahr?: (question: string) => void;
  onExpandNode?: (nodeId: string) => void;
}

const COLOR_OPTIONS: MindMapColor[] = [
  "purple",
  "cyan",
  "emerald",
  "amber",
  "rose",
  "indigo",
  "blue",
  "teal",
];

export const MindMapDetailModal: React.FC<MindMapDetailModalProps> = ({
  node,
  onClose,
  onUpdate,
  onAskMahr,
  onExpandNode,
}) => {
  if (!node) return null;

  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description || "");
  const [notes, setNotes] = useState(node.notes || "");
  const [details, setDetails] = useState<string[]>(node.details || []);
  const [newDetailText, setNewDetailText] = useState("");

  const palette = MINDMAP_COLOR_PALETTES[node.color] || MINDMAP_COLOR_PALETTES.purple;

  const handleSave = () => {
    onUpdate(node.id, {
      title,
      description,
      notes,
      details,
    });
    onClose();
  };

  const handleAddDetail = () => {
    if (newDetailText.trim()) {
      const updated = [...details, newDetailText.trim()];
      setDetails(updated);
      setNewDetailText("");
      onUpdate(node.id, { details: updated });
    }
  };

  const handleRemoveDetail = (index: number) => {
    const updated = details.filter((_, idx) => idx !== index);
    setDetails(updated);
    onUpdate(node.id, { details: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#070714] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className={`p-4 border-b border-white/10 ${palette.bg} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${palette.border} bg-white/5`}>
              <Brain size={18} className={palette.text} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Node Inspector • {node.clusterName || "Vector Knowledge Base"}
              </span>
              <h3 className="text-sm font-bold text-white leading-tight">{node.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Vector Memory Relevance Badge */}
          {node.vectorSimilarity !== undefined && (
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400 animate-spin" />
                <span className="font-mono text-slate-300 text-[11px]">
                  Vector Semantic Relevance:
                </span>
              </div>
              <span className="font-mono font-bold text-purple-300 text-xs px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                {Math.round(node.vectorSimilarity * 100)}% Match
              </span>
            </div>
          )}

          {/* Title Editor */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Concept Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-slate-200 outline-none font-bold"
            />
          </div>

          {/* Description Editor */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Analytical Definition & Core Mechanism
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 focus:border-cyan-400 rounded-lg p-2.5 text-slate-300 outline-none leading-relaxed resize-none text-[11px]"
              placeholder="Crisp explanation of this concept..."
            />
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Palette size={11} />
              <span>Color Theme</span>
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => {
                const cPal = MINDMAP_COLOR_PALETTES[c];
                const isSelected = node.color === c;
                return (
                  <button
                    key={c}
                    onClick={() => onUpdate(node.id, { color: c })}
                    style={{ backgroundColor: cPal.hex }}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer relative ${
                      isSelected ? "scale-125 ring-2 ring-white shadow-lg" : "hover:scale-110 opacity-70"
                    }`}
                    title={c}
                  >
                    {isSelected && <Check size={12} className="text-white mx-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Details / Formulas */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Key Details & Sub-mechanisms ({details.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/60 border border-white/5 text-[11px] text-slate-300"
                >
                  <span className="leading-snug">• {detail}</span>
                  <button
                    onClick={() => handleRemoveDetail(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add sub-detail or equation..."
                value={newDetailText}
                onChange={(e) => setNewDetailText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDetail()}
                className="flex-1 bg-slate-900 border border-white/10 focus:border-purple-400 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 outline-none"
              />
              <button
                onClick={handleAddDetail}
                className="px-2.5 py-1 bg-purple-950/80 border border-purple-500/40 text-purple-200 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-purple-900 transition"
              >
                <Plus size={11} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onAskMahr && (
              <button
                onClick={() => {
                  onAskMahr(`Explain the node "${node.title}" and connect it with the user's past knowledge base.`);
                  onClose();
                }}
                className="px-3 py-1.5 bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer hover:bg-cyan-900/70 transition shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              >
                <HelpCircle size={12} />
                <span>Ask MAHR to Explain</span>
              </button>
            )}
            {onExpandNode && (
              <button
                onClick={() => {
                  onExpandNode(node.id);
                  onClose();
                }}
                className="px-3 py-1.5 bg-purple-950/70 border border-purple-500/40 text-purple-300 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer hover:bg-purple-900/70 transition shadow-[0_0_10px_rgba(168,85,247,0.2)]"
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>Expand with Memory</span>
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold shadow-md cursor-pointer transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
