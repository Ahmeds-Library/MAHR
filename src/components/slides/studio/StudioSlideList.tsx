/**
 * LAYER 3: StudioSlideList (Clean Left Slide Filmstrip)
 */

import React from "react";
import { Plus, Trash2, Copy, ChevronUp, ChevronDown } from "lucide-react";
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

export const StudioSlideList: React.FC<StudioSlideListProps> = ({
  deck,
  currentSlideIndex,
  onSelectSlide,
  onAddSlide,
  onRemoveSlide,
  onDuplicateSlide,
  onReorderSlides
}) => {
  return (
    <aside
      className="hidden md:flex flex-col w-48 lg:w-52 shrink-0 h-full bg-[#090c15] border-r border-white/10 select-none overflow-hidden"
      aria-label="Slide Deck Filmstrip"
    >
      {/* Slide Thumbnails Scroll Area */}
      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto">
        {deck.slides.map((slide, idx) => {
          const isSelected = idx === currentSlideIndex;
          return (
            <div
              key={slide.id || idx}
              onClick={() => onSelectSlide(idx)}
              className={`group relative p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                isSelected
                  ? "bg-amber-500/10 border-amber-400/80 text-white"
                  : "bg-zinc-900/50 border-white/10 hover:border-white/20 hover:bg-zinc-900 text-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                <span className={isSelected ? "text-amber-400 font-bold tabular-nums" : "tabular-nums"}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="uppercase">{slide.layout}</span>
              </div>

              <div className="text-xs font-medium text-zinc-200 truncate leading-snug">
                {slide.title || "Untitled Slide"}
              </div>

              {/* Subtle Hover Actions */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-0.5 pt-1.5 mt-1 border-t border-white/5 transition-opacity">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderSlides(idx, idx - 1);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
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
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
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
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
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
                    className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
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

      {/* Simple Add Slide Button */}
      <div className="p-2.5 border-t border-white/10 bg-[#090c15] shrink-0">
        <button
          type="button"
          onClick={() => onAddSlide("bullets")}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white font-medium text-xs transition-colors cursor-pointer"
        >
          <Plus size={14} className="text-amber-400" />
          <span>New Slide</span>
        </button>
      </div>
    </aside>
  );
};
