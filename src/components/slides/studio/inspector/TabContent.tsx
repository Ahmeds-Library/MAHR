import React from "react";
import { Plus, Trash2, ListChecks, BarChart3, Tag } from "lucide-react";
import { Slide } from "../../../../services/slides/slideTypes";

interface TabContentProps {
  slide: Slide;
  onUpdateSlide: (partial: Partial<Slide>) => void;
}

export const TabContent: React.FC<TabContentProps> = ({ slide, onUpdateSlide }) => {
  const bullets = slide.bullets || [];
  const stats = slide.stats || [];

  const handleBulletChange = (idx: number, val: string) => {
    const next = [...bullets];
    next[idx] = val;
    onUpdateSlide({ bullets: next });
  };

  const handleAddBullet = () => {
    onUpdateSlide({ bullets: [...bullets, "New key strategic point"] });
  };

  const handleRemoveBullet = (idx: number) => {
    onUpdateSlide({ bullets: bullets.filter((_, i) => i !== idx) });
  };

  const handleStatChange = (idx: number, field: "value" | "label", val: string) => {
    const next = [...stats];
    if (!next[idx]) next[idx] = { value: "", label: "" };
    next[idx] = { ...next[idx], [field]: val };
    onUpdateSlide({ stats: next });
  };

  const handleAddStat = () => {
    onUpdateSlide({
      stats: [...stats, { value: "99.9%", label: "Key Objective" }]
    });
  };

  const handleRemoveStat = (idx: number) => {
    onUpdateSlide({ stats: stats.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      {/* Title & Category Tag */}
      <div className="space-y-2">
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Slide Title
          </label>
          <input
            type="text"
            value={slide.title || ""}
            onChange={(e) => onUpdateSlide({ title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            placeholder="Slide Headline..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            Subtitle / Summary
          </label>
          <input
            type="text"
            value={slide.subtitle || ""}
            onChange={(e) => onUpdateSlide({ subtitle: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-200 text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            placeholder="Supporting insight or takeaway..."
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            <Tag size={11} className="text-amber-400" />
            Category Tag
          </label>
          <input
            type="text"
            value={slide.categoryTag || ""}
            onChange={(e) => onUpdateSlide({ categoryTag: e.target.value })}
            className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-amber-300 font-mono text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            placeholder="e.g. ARCHITECTURE, METRICS, STRATEGY"
          />
        </div>
      </div>

      {/* Bullets Section */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
            <ListChecks size={13} className="text-amber-400" />
            Key Bullet Points ({bullets.length})
          </label>
          <button
            type="button"
            onClick={handleAddBullet}
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Point</span>
          </button>
        </div>

        {bullets.length === 0 ? (
          <p className="text-[11px] text-zinc-500 italic py-1">No bullets on this slide yet. Click &apos;Add Point&apos; above.</p>
        ) : (
          <div className="space-y-1.5">
            {bullets.map((b, idx) => (
              <div key={idx} className="flex items-center gap-1.5 group">
                <span className="w-4 text-center text-[10px] font-mono text-zinc-500 shrink-0">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={b}
                  onChange={(e) => handleBulletChange(idx, e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-amber-400/80 transition-colors"
                  placeholder={`Point #${idx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBullet(idx)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Remove point"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats & Quantitative Data Section */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
            <BarChart3 size={13} className="text-amber-400" />
            Metrics & Data Stats ({stats.length})
          </label>
          <button
            type="button"
            onClick={handleAddStat}
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Stat</span>
          </button>
        </div>

        {stats.length > 0 && (
          <div className="space-y-2">
            {stats.map((s, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center gap-2 group"
              >
                <div className="w-24 shrink-0">
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => handleStatChange(idx, "value", e.target.value)}
                    className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
                    placeholder="99%"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => handleStatChange(idx, "label", e.target.value)}
                    className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                    placeholder="Metric Label"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStat(idx)}
                  className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                  title="Remove Stat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
