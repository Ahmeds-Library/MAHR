import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  LayoutTemplate,
  List,
  BarChart3
} from "lucide-react";
import { SlideDeck, SlideLayout } from "../../../services/slides/slideTypes";

interface StudioSlideListProps {
  deck: SlideDeck;
  currentSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: (layout?: SlideLayout) => void;
  onRemoveSlide: (index: number) => void;
  onDuplicateSlide: (index: number) => void;
  onReorderSlides: (startIndex: number, endIndex: number) => void;
}

const QUICK_LAYOUTS: Array<{ layout: SlideLayout; label: string; icon: any }> = [
  { layout: "bullets", label: "Key Takeaways", icon: List },
  { layout: "stats", label: "Metrics & Data", icon: BarChart3 },
  { layout: "title", label: "Section Header", icon: LayoutTemplate }
];

export const StudioSlideList: React.FC<StudioSlideListProps> = ({
  deck,
  currentSlideIndex,
  onSelectSlide,
  onAddSlide,
  onRemoveSlide,
  onDuplicateSlide,
  onReorderSlides
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <aside
      className="hidden md:flex flex-col w-48 lg:w-56 shrink-0 h-full bg-[#080b14]/90 border-r border-white/10 select-none overflow-hidden"
      aria-label="Slide Deck Filmstrip"
    >
      {/* Rail Top Bar */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-zinc-900/40">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Layers size={14} className="text-amber-400" />
          <span>Slide Deck</span>
        </div>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
          {deck.slides.length} slides
        </span>
      </div>

      {/* Slide Thumbnails Scroll Area */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {deck.slides.map((slide, idx) => {
          const isSelected = idx === currentSlideIndex;
          return (
            <div
              key={slide.id || idx}
              onClick={() => onSelectSlide(idx)}
              className={`group relative p-2 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                isSelected
                  ? "bg-amber-500/15 border-amber-400/90 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-zinc-900/70 border-white/10 hover:border-white/20 hover:bg-zinc-800/80 text-zinc-400"
              }`}
            >
              {/* Thumbnail Top Info */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[9px] font-mono font-bold px-1 rounded ${
                    isSelected ? "bg-amber-500/30 text-amber-200" : "bg-white/5 text-zinc-500"
                  }`}
                >
                  #{idx + 1}
                </span>
                <span className="text-[8px] font-mono uppercase text-zinc-500 truncate max-w-[80px]">
                  {slide.layout}
                </span>
              </div>

              {/* Title preview */}
              <div className="text-[11px] font-medium text-zinc-200 truncate leading-tight py-1">
                {slide.title || "Untitled Slide"}
              </div>

              {/* Hover Quick Reorder & Duplicate */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-1 pt-1 border-t border-white/5 transition-opacity">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderSlides(idx, idx - 1);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10"
                    title="Move slide up"
                  >
                    <ChevronUp size={11} />
                  </button>
                )}

                {idx < deck.slides.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderSlides(idx, idx + 1);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10"
                    title="Move slide down"
                  >
                    <ChevronDown size={11} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateSlide(idx);
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10"
                  title="Duplicate slide"
                >
                  <Copy size={11} />
                </button>

                {deck.slides.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSlide(idx);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                    title="Delete slide"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slide Bottom Action */}
      <div className="p-2 border-t border-white/10 bg-zinc-950/70 shrink-0 relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 font-semibold text-xs transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>New Slide</span>
        </button>

        {showAddMenu && (
          <div className="absolute left-2 right-2 bottom-full mb-2 p-1.5 rounded-xl bg-zinc-950 border border-amber-500/30 shadow-2xl space-y-1 z-30">
            <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider px-2 py-0.5">
              Choose Layout
            </div>
            {QUICK_LAYOUTS.map((item) => (
              <button
                key={item.layout}
                type="button"
                onClick={() => {
                  onAddSlide(item.layout);
                  setShowAddMenu(false);
                }}
                className="w-full flex items-center gap-2 p-1.5 rounded-lg text-xs text-left text-zinc-300 hover:text-white hover:bg-amber-500/15 transition-colors cursor-pointer"
              >
                <item.icon size={13} className="text-amber-400" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
