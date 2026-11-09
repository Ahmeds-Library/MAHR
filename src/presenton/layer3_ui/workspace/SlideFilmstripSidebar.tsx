/**
 * Layer 3 UI — Responsive Slide Filmstrip Sidebar
 */

import React from "react";
import { Plus, Copy, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { PresentonSlide, PresentonTheme } from "../../layer1_data/presentonTypes";

interface SlideFilmstripSidebarProps {
  slides: PresentonSlide[];
  activeSlideIndex: number;
  theme: PresentonTheme;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (index: number, direction: "up" | "down") => void;
}

export const SlideFilmstripSidebar: React.FC<SlideFilmstripSidebarProps> = ({
  slides,
  activeSlideIndex,
  theme,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide
}) => {
  return (
    <aside className="w-full lg:w-64 bg-slate-950/90 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col shrink-0">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Slides ({slides.length})
        </span>
        <button
          type="button"
          onClick={onAddSlide}
          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Slide</span>
        </button>
      </div>

      {/* Scrollable Thumbnails List (Horizontal on mobile, Vertical on desktop) */}
      <div className="flex lg:flex-col gap-2.5 p-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-140px)]">
        {slides.map((s, idx) => {
          const isActive = idx === activeSlideIndex;
          return (
            <div
              key={s.id}
              onClick={() => onSelectSlide(idx)}
              className={`group relative rounded-xl p-2.5 border cursor-pointer transition-all shrink-0 w-48 lg:w-full ${
                isActive
                  ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40"
                  : "bg-slate-900/70 border-slate-800/90 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold truncate max-w-[95px]">
                  {s.layout.replace("-", " ")}
                </span>
              </div>

              {/* Mini Card Preview */}
              <div
                className="rounded-lg p-2.5 border h-16 flex flex-col justify-between overflow-hidden"
                style={{
                  background: theme.slideSurface,
                  borderColor: theme.cardBorder
                }}
              >
                <div
                  className="text-[11px] font-bold line-clamp-2 leading-snug"
                  style={{ color: theme.textPrimary }}
                >
                  {s.title}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-1 w-6 rounded-full"
                    style={{ background: theme.accentHex }}
                  />
                  <span
                    className="h-1 w-10 rounded-full opacity-40"
                    style={{ background: theme.textSecondary }}
                  />
                </div>
              </div>

              {/* Hover Action Icons */}
              <div
                className="mt-2 flex items-center justify-end gap-1 opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMoveSlide(idx, "up")}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === slides.length - 1}
                  onClick={() => onMoveSlide(idx, "down")}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateSlide(idx)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Duplicate Slide"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {slides.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteSlide(idx)}
                    className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
