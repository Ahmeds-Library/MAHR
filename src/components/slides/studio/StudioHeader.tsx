/**
 * LAYER 3: StudioHeader (Clean, Minimalist 3-Zone Presentation Studio Navbar)
 * Zone 1: Back & Deck Title
 * Zone 2: AI Slide Generator · Theme & Motion · Assets Drawer
 * Zone 3: Present & Export (.PPTX / PDF / Google Slides)
 */

import React, { useState } from "react";
import {
  ChevronLeft,
  Play,
  Share2,
  Palette,
  Layers,
  Wand2,
  Check,
  Sparkles
} from "lucide-react";
import { SlideDeck } from "../../../services/slides/slideTypes";
import { SLIDE_THEMES } from "../../../services/slides/slideThemes";
import {
  SLIDE_TRANSITION_METADATA,
  SlideTransitionPreset
} from "../../../slidesStudio/layer1_data/presentonTypes";

interface StudioHeaderProps {
  deck: SlideDeck;
  onBackToSlate?: () => void;
  onPresent: () => void;
  onExport: () => void;
  onSelectTheme: (themeId: string) => void;
  onOpenInfographics?: () => void;
  onOpenPipeline?: () => void;
  onOpenManimGX?: () => void;
  onOpenPresentonArchitect?: () => void;
  onAutoEnrichMultimedia?: () => void;
  onSelectTransition?: (transition: SlideTransitionPreset) => void;
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
  isAuthenticated: boolean;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  deck,
  onBackToSlate,
  onPresent,
  onExport,
  onSelectTheme,
  onOpenManimGX,
  onOpenPresentonArchitect,
  onSelectTransition,
  isInspectorOpen,
  onToggleInspector
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const activeTransition: SlideTransitionPreset = deck.defaultTransition || "morph_smooth";

  return (
    <header className="h-14 border-b border-white/10 bg-[#090c15] px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0 select-none">
      {/* Zone 1: Back & Clean Deck Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onBackToSlate && (
          <button
            type="button"
            onClick={onBackToSlate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-xs">
            {deck.title || "Untitled Presentation"}
          </span>
          <span className="hidden md:inline text-xs text-zinc-500 tabular-nums whitespace-nowrap">
            · {deck.slides.length} slides
          </span>
        </div>
      </div>

      {/* Zone 2: Clean Center Studio Controls */}
      <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-white/10">
        {onOpenPresentonArchitect && (
          <button
            type="button"
            onClick={onOpenPresentonArchitect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Wand2 size={13} />
            <span>AI Slide Builder</span>
          </button>
        )}

        {/* Unified Theme & Animation Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Palette size={13} className="text-zinc-400" />
            <span className="hidden sm:inline">Style & Motion</span>
          </button>

          {showStyleMenu && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl p-3 z-50 space-y-3">
              <div>
                <div className="text-[11px] font-medium text-zinc-400 px-1 mb-1.5">
                  Color Theme
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {Object.values(SLIDE_THEMES).map((thm) => {
                    const isSelected = deck.themeId === thm.id;
                    return (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => {
                          onSelectTheme(thm.id);
                          setShowStyleMenu(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 font-semibold"
                            : "text-zinc-300 hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: thm.accentCol || "#f59e0b" }}
                          />
                          <span className="truncate">{thm.name}</span>
                        </span>
                        {isSelected && <Check size={11} className="text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {onSelectTransition && (
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[11px] font-medium text-zinc-400 px-1 mb-1.5">
                    Slide Transition
                  </div>
                  <div className="space-y-1">
                    {Object.entries(SLIDE_TRANSITION_METADATA).map(([key, meta]) => {
                      const isSel = activeTransition === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onSelectTransition(key as SlideTransitionPreset);
                            setShowStyleMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                            isSel
                              ? "bg-white/10 text-white font-semibold"
                              : "text-zinc-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span>{meta.name}</span>
                          {isSel && <Check size={12} className="text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {onOpenManimGX && (
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStyleMenu(false);
                      onOpenManimGX();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                  >
                    <span>Open 3D Math Studio (ManimGX)</span>
                    <Sparkles size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {onToggleInspector && (
          <button
            type="button"
            onClick={onToggleInspector}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isInspectorOpen
                ? "bg-white/10 text-white"
                : "text-zinc-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Assets & Edit</span>
          </button>
        )}
      </div>

      {/* Zone 3: Present & Export */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPresent}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <Play size={13} className="text-amber-400 fill-amber-400" />
          <span>Present</span>
        </button>

        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Share2 size={13} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
