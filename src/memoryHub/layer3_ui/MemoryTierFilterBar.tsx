import React from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { MemoryCategory, MemoryTier } from "../../lib/memoryTypes";
import { MemorySortMode } from "../layer1_data/hybridVectorTypes";

interface MemoryTierFilterBarProps {
  vectorQuery: string;
  onVectorQueryChange: (q: string) => void;
  activeTier: MemoryTier | "all";
  onSelectTier: (t: MemoryTier | "all") => void;
  activeCategory: MemoryCategory | "all";
  onSelectCategory: (c: MemoryCategory | "all") => void;
  sortMode: MemorySortMode;
  onSelectSortMode: (s: MemorySortMode) => void;
  totalCount: number;
  episodicCount: number;
  semanticCount: number;
  proceduralCount: number;
  categories: Array<{ id: MemoryCategory; label: string }>;
}

export const MemoryTierFilterBar: React.FC<MemoryTierFilterBarProps> = ({
  vectorQuery,
  onVectorQueryChange,
  activeTier,
  onSelectTier,
  activeCategory,
  onSelectCategory,
  sortMode,
  onSelectSortMode,
  totalCount,
  episodicCount,
  semanticCount,
  proceduralCount,
  categories,
}) => {
  const tiers: Array<{
    id: MemoryTier | "all";
    label: string;
    count: number;
  }> = [
    { id: "all", label: "All Cognitive Tiers", count: totalCount },
    { id: "episodic", label: "Episodic · Events", count: episodicCount },
    { id: "semantic", label: "Semantic · Core Facts", count: semanticCount },
    { id: "procedural", label: "Procedural · Workflows", count: proceduralCount },
  ];

  return (
    <div className="px-5 py-3 sm:px-6 bg-white/[0.02] border-b border-white/10 flex flex-col gap-2.5 shrink-0">
      {/* Row 1: Hybrid Vector Search + Sort Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={vectorQuery}
            onChange={(e) => onVectorQueryChange(e.target.value)}
            placeholder="Hybrid Vector Search (128-D semantic cosine + BM25 lexical across cognitive tiers)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/15 bg-black/40 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 rounded-xl px-2.5 py-1.5 shrink-0">
          <ArrowUpDown size={13} className="text-cyan-400 shrink-0" />
          <span className="text-[11px] font-mono text-slate-400">Sort:</span>
          {(
            [
              { id: "hybrid", label: "Relevance" },
              { id: "retention", label: "Retention" },
              { id: "importance", label: "Importance" },
              { id: "newest", label: "Newest" },
            ] as Array<{ id: MemorySortMode; label: string }>
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectSortMode(mode.id)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition whitespace-nowrap shrink-0 cursor-pointer ${
                sortMode === mode.id
                  ? "bg-cyan-500/20 text-cyan-200 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Cognitive Memory Tiers Segmented Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/10 overflow-x-auto no-scrollbar">
          {tiers.map((t) => {
            const active = activeTier === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTier(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono tabular-nums transition whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "bg-cyan-500/20 text-cyan-100 border border-cyan-400/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label} ({t.count})
              </button>
            );
          })}
        </div>

        {/* Archetype Category Filter Buttons */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono tabular-nums transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === "all"
                ? "border-cyan-400 bg-cyan-500/20 text-white font-semibold"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "border-cyan-400 bg-cyan-500/20 text-white font-semibold"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
