import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sliders,
  LayoutTemplate,
  Image as ImageIcon,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Quote,
  Sparkles
} from "lucide-react";
import { Slide, SlideDeck, SlideTheme } from "../../../services/slides/slideTypes";
import { StudioInspectorTab } from "./inspector/StudioInspector";

interface StudioCanvasProps {
  deck: SlideDeck;
  currentSlideIndex: number;
  currentSlide: Slide | undefined;
  theme: SlideTheme;
  totalSlides: number;
  onSelectSlide: (index: number) => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  activeInspectorTab: StudioInspectorTab;
  onOpenInspectorTab: (tab: StudioInspectorTab) => void;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  deck,
  currentSlideIndex,
  currentSlide,
  theme,
  totalSlides,
  onSelectSlide,
  isInspectorOpen,
  onToggleInspector,
  activeInspectorTab,
  onOpenInspectorTab
}) => {
  if (!currentSlide) return null;

  return (
    <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto min-h-0 select-none">
      {/* 1. Cinematic 16:9 Slide Canvas */}
      <div className="flex-1 flex items-center justify-center min-h-0 py-2">
        <div
          className="relative w-full max-w-4xl aspect-video rounded-2xl shadow-2xl border overflow-hidden flex flex-col justify-between p-6 sm:p-10 transition-all duration-300"
          style={{
            background: theme.slideBg || "#0d111c",
            borderColor: theme.borderCol || "rgba(255,255,255,0.12)",
            boxShadow: `0 20px 50px -10px ${theme.accentGlow || "rgba(245,158,11,0.15)"}`
          }}
        >
          {/* Subtle Accent Glow Circle in Canvas */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ background: theme.accentCol || "#f59e0b" }}
          />

          {/* Canvas Top Bar: Tag & Slide Counter */}
          <div className="flex items-center justify-between z-10 shrink-0">
            <span
              className="text-[10px] sm:text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{
                color: theme.accentCol || "#f59e0b",
                borderColor: `${theme.accentCol || "#f59e0b"}40`,
                background: `${theme.accentCol || "#f59e0b"}15`
              }}
            >
              {currentSlide.categoryTag || "OVERVIEW"}
            </span>

            <span className="text-[10px] sm:text-xs font-mono text-zinc-500">
              {currentSlideIndex + 1} / {totalSlides}
            </span>
          </div>

          {/* Canvas Main Body based on layout */}
          <div className="my-auto z-10 py-3 sm:py-4">
            {/* Title & Subtitle */}
            <h1
              className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2"
              style={{
                fontFamily: theme.fontHeading,
                color: theme.textPrimary || "#ffffff"
              }}
            >
              {currentSlide.title || "Untitled Slide"}
            </h1>

            {currentSlide.subtitle && (
              <p
                className="text-xs sm:text-base leading-relaxed opacity-85 mb-4 max-w-2xl"
                style={{
                  fontFamily: theme.fontBody,
                  color: theme.textSecondary || "#94a3b8"
                }}
              >
                {currentSlide.subtitle}
              </p>
            )}

            {/* Layout Variant: Bullets */}
            {currentSlide.layout === "bullets" && currentSlide.bullets && (
              <div className="space-y-2 mt-4">
                {currentSlide.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: theme.accentCol || "#f59e0b" }}
                    />
                    <span
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: theme.textPrimary || "#f1f5f9" }}
                    >
                      {b}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Layout Variant: Stats */}
            {currentSlide.layout === "stats" && currentSlide.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {currentSlide.stats.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border backdrop-blur-md"
                    style={{
                      background: theme.cardBg || "rgba(255,255,255,0.04)",
                      borderColor: theme.borderCol || "rgba(255,255,255,0.1)"
                    }}
                  >
                    <div
                      className="text-xl sm:text-3xl font-extrabold font-mono mb-1"
                      style={{ color: theme.accentCol || "#f59e0b" }}
                    >
                      {s.value}
                    </div>
                    <div className="text-[11px] sm:text-xs text-zinc-300 font-medium">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Layout Variant: Quote */}
            {currentSlide.layout === "quote" && (
              <div className="relative pl-6 py-2 my-2 border-l-2 border-amber-400">
                <Quote size={20} className="text-amber-400 mb-2 opacity-60" />
                <p className="text-base sm:text-xl font-medium italic text-zinc-200">
                  {currentSlide.quote || currentSlide.title}
                </p>
                {currentSlide.quoteAuthor && (
                  <div className="text-xs font-mono text-amber-300 mt-2">
                    — {currentSlide.quoteAuthor}
                  </div>
                )}
              </div>
            )}

            {/* Layout Variant: Media / Image */}
            {currentSlide.imageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden max-h-36 sm:max-h-48 border border-white/10">
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.imageCaption || "Slide visual"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Canvas Bottom Footer */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono z-10 shrink-0 pt-2 border-t border-white/5">
            <span>{deck.title}</span>
            <span>Google Slides Sync</span>
          </div>
        </div>
      </div>

      {/* 2. Slide Navigation & Quick Inspector Toolbar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto pt-3 px-1 flex-wrap gap-2">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onSelectSlide(currentSlideIndex - 1)}
          disabled={currentSlideIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 disabled:opacity-25 border border-white/10 text-xs font-mono font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Center Quick Tab Selector Buttons */}
        <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => onOpenInspectorTab("content")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isInspectorOpen && activeInspectorTab === "content"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sliders size={12} />
            <span className="hidden sm:inline">Content</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInspectorTab("layout")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isInspectorOpen && activeInspectorTab === "layout"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LayoutTemplate size={12} />
            <span className="hidden sm:inline">Layout</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInspectorTab("visuals")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isInspectorOpen && activeInspectorTab === "visuals"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ImageIcon size={12} />
            <span className="hidden sm:inline">Visuals</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInspectorTab("notes")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isInspectorOpen && activeInspectorTab === "notes"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText size={12} />
            <span className="hidden sm:inline">Notes</span>
          </button>
        </div>

        {/* Right side: Inspector Drawer Toggle & Next */}
        <div className="flex items-center gap-2">
          {deck.googlePresentationUrl && (
            <a
              href={deck.googlePresentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-mono mr-1"
            >
              <span>Slides</span>
              <ExternalLink size={11} />
            </a>
          )}

          <button
            type="button"
            onClick={onToggleInspector}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              isInspectorOpen
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm"
                : "bg-zinc-900/90 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {isInspectorOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
            <span className="hidden sm:inline">
              {isInspectorOpen ? "Hide Inspector" : "Inspector"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSlide(currentSlideIndex + 1)}
            disabled={currentSlideIndex === totalSlides - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 disabled:opacity-25 border border-white/10 text-xs font-mono font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
