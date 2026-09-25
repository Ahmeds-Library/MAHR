import React, { useState } from "react";
import {
  Sliders,
  LayoutTemplate,
  Image as ImageIcon,
  FileText,
  X,
  Copy,
  Trash2,
  Sparkles
} from "lucide-react";
import { Slide, SlideDeck } from "../../../../services/slides/slideTypes";
import { TabContent } from "./TabContent";
import { TabLayout } from "./TabLayout";
import { TabVisuals } from "./TabVisuals";
import { TabNotes } from "./TabNotes";

export type StudioInspectorTab = "content" | "layout" | "visuals" | "notes";

interface StudioInspectorProps {
  deck: SlideDeck;
  currentSlideIndex: number;
  currentSlide: Slide | undefined;
  isOpen: boolean;
  onClose: () => void;
  activeTab: StudioInspectorTab;
  onSelectTab: (tab: StudioInspectorTab) => void;
  onUpdateSlide: (partial: Partial<Slide>) => void;
  onDuplicateSlide: (index: number) => void;
  onRemoveSlide: (index: number) => void;
}

export const StudioInspector: React.FC<StudioInspectorProps> = ({
  deck,
  currentSlideIndex,
  currentSlide,
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onUpdateSlide,
  onDuplicateSlide,
  onRemoveSlide
}) => {
  if (!isOpen || !currentSlide) return null;

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 z-40 lg:relative lg:inset-auto lg:z-10 flex flex-col h-full w-full sm:w-[400px] lg:w-[410px] shrink-0 bg-[#0b0e17]/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl select-none animate-in slide-in-from-right duration-200"
        aria-label="Slide Studio Inspector"
      >
        {/* Header Toolbar */}
        <div className="p-3 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sliders size={14} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide">
                  Slide Inspector
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  #{currentSlideIndex + 1}/{deck.slides.length}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                {currentSlide.title || "Untitled Slide"}
              </p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDuplicateSlide(currentSlideIndex)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Duplicate Slide"
            >
              <Copy size={13} />
            </button>

            {deck.slides.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveSlide(currentSlideIndex)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete Slide"
              >
                <Trash2 size={13} />
              </button>
            )}

            <div className="w-px h-4 bg-white/10 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Inspector"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* 4 Segmented Tabs */}
        <div className="grid grid-cols-4 p-1.5 gap-1 border-b border-white/10 bg-zinc-900/30 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab("content")}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === "content"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Sliders size={14} className="mb-1" />
            <span className="truncate">Content</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("layout")}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === "layout"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <LayoutTemplate size={14} className="mb-1" />
            <span className="truncate">Layout</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("visuals")}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === "visuals"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <ImageIcon size={14} className="mb-1" />
            <span className="truncate">Visuals</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("notes")}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === "notes"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <FileText size={14} className="mb-1" />
            <span className="truncate">Notes</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-3.5 overflow-y-auto">
          {activeTab === "content" && (
            <div className="animate-in fade-in duration-150">
              <TabContent slide={currentSlide} onUpdateSlide={onUpdateSlide} />
            </div>
          )}

          {activeTab === "layout" && (
            <div className="animate-in fade-in duration-150">
              <TabLayout slide={currentSlide} onUpdateSlide={onUpdateSlide} />
            </div>
          )}

          {activeTab === "visuals" && (
            <div className="animate-in fade-in duration-150">
              <TabVisuals slide={currentSlide} onUpdateSlide={onUpdateSlide} />
            </div>
          )}

          {activeTab === "notes" && (
            <div className="animate-in fade-in duration-150">
              <TabNotes slide={currentSlide} onUpdateSlide={onUpdateSlide} />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-3 py-2 border-t border-white/10 bg-zinc-950/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>Mahr Studio Sync</span>
          </span>
          <span>Auto-saved</span>
        </div>
      </aside>
    </>
  );
};
