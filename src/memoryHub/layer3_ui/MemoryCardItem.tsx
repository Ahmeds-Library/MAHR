import React from "react";
import {
  Brain,
  Trash2,
  Pin,
  ArrowUpRight,
  Zap,
  Calendar,
  Hash,
  Tag,
} from "lucide-react";
import { motion } from "motion/react";
import { HybridVectorMatch } from "../layer1_data/hybridVectorTypes";
import { MemoryTier } from "../../lib/memoryTypes";

interface MemoryCardItemProps {
  match: HybridVectorMatch;
  hasActiveQuery: boolean;
  categoryLabel: string;
  categoryColorClass: string;
  categoryBgClass: string;
  CategoryIcon: any;
  onTogglePin: (memoryId: string) => void;
  onReinforceMemory: (memoryId: string) => void;
  onChangeTier: (memoryId: string, nextTier: MemoryTier) => void;
  onDeleteMemory: (memoryId: string) => void;
  onOpenInObsidian?: () => void;
  formatDate: (iso: string) => string;
}

const TIER_LABELS: Record<MemoryTier, string> = {
  episodic: "Episodic",
  semantic: "Semantic",
  procedural: "Procedural",
};

export const MemoryCardItem: React.FC<MemoryCardItemProps> = ({
  match,
  hasActiveQuery,
  categoryLabel,
  categoryColorClass,
  categoryBgClass,
  CategoryIcon,
  onTogglePin,
  onReinforceMemory,
  onChangeTier,
  onDeleteMemory,
  onOpenInObsidian,
  formatDate,
}) => {
  const m = match.memory;
  const similarityPct = Math.round(match.hybridScore * 100);
  const Icon = CategoryIcon || Brain;

  const nextTierCycle = (current: MemoryTier): MemoryTier => {
    if (current === "episodic") return "semantic";
    if (current === "semantic") return "procedural";
    return "episodic";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-2xl border ${
        match.pinned ? "border-cyan-400/40" : "border-white/10"
      } backdrop-blur-md bg-white/[0.02] ${categoryBgClass} transition-colors group relative`}
    >
      <div className="flex gap-3.5 overflow-hidden flex-1 w-full">
        <div
          className={`p-2 rounded-xl border mt-0.5 shrink-0 bg-black/40 ${categoryColorClass}`}
        >
          <Icon size={15} />
        </div>
        <div className="overflow-hidden flex-1">
          {/* Clean unboxed metadata header line with typographic separators */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
            <span
              className={`font-bold ${
                categoryColorClass.split(" ")[0] || "text-purple-400"
              }`}
            >
              {categoryLabel}
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onChangeTier(m.id, nextTierCycle(match.tier))}
              title="Click to cycle cognitive memory tier (Episodic / Semantic / Procedural)"
              className="text-slate-200 hover:text-cyan-300 underline decoration-dotted underline-offset-2 cursor-pointer"
            >
              {TIER_LABELS[match.tier]} Tier
            </button>
            <span aria-hidden="true">·</span>
            <span style={{ color: match.clusterColor }}>
              {match.clusterName}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-300 font-semibold">
              {hasActiveQuery
                ? `${similarityPct}% Hybrid Match`
                : `${match.importancePercent}% Importance`}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                match.retentionPercent >= 80
                  ? "text-emerald-300"
                  : match.retentionPercent >= 60
                    ? "text-amber-300"
                    : "text-rose-300"
              }
            >
              {match.pinned
                ? "Pinned (100% Retention)"
                : `${match.retentionPercent}% Retention`}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(m.createdAt)}</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-100 mt-1.5 font-sans leading-relaxed break-words font-medium">
            {m.text}
          </p>

          {/* Retention Bar + Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2.5 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-400 tabular-nums">
              <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    match.pinned || match.retentionPercent >= 80
                      ? "bg-emerald-400"
                      : match.retentionPercent >= 60
                        ? "bg-amber-400"
                        : "bg-rose-400"
                  }`}
                  style={{ width: `${match.retentionPercent}%` }}
                />
              </div>
              <span>Recalled {match.accessCount}×</span>

              {m.projectId && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-cyan-300">
                    <Hash size={11} />
                    <span>{m.projectId}</span>
                  </span>
                </>
              )}
              {m.dueDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Calendar size={11} />
                    <span>Due {m.dueDate}</span>
                  </span>
                </>
              )}
              {m.tags &&
                m.tags
                  .filter(
                    (t) =>
                      !t.startsWith("category:") &&
                      !t.startsWith("project:") &&
                      !t.startsWith("due:")
                  )
                  .slice(0, 3)
                  .map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-slate-400"
                    >
                      <Tag size={10} />
                      <span>{tag}</span>
                    </span>
                  ))}
            </div>

            {/* Action Controls: Pin, Reinforce, Open in Obsidian, Delete */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onTogglePin(m.id)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  match.pinned
                    ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200 font-semibold"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
                title={
                  match.pinned
                    ? "Unpin memory from 100% retention lock"
                    : "Pin memory to lock at 100% permanent retention"
                }
              >
                <Pin size={11} />
                <span>{match.pinned ? "Pinned" : "Pin"}</span>
              </button>

              <button
                type="button"
                onClick={() => onReinforceMemory(m.id)}
                className="px-2 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                title="Reinforce memory trace (+Importance & Spaced-Repetition Recall)"
              >
                <Zap size={11} />
                <span>Reinforce</span>
              </button>

              {onOpenInObsidian && (
                <button
                  type="button"
                  onClick={onOpenInObsidian}
                  className="px-2 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/25 text-purple-200 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Inspect note & connections in Obsidian Vault"
                >
                  <span>Vault</span>
                  <ArrowUpRight size={11} />
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeleteMemory(m.id)}
                className="p-1.5 rounded-lg border border-red-500/25 bg-red-950/20 text-red-400 hover:bg-red-500 hover:text-white transition duration-150 shrink-0 cursor-pointer"
                title="Forget this memory"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
