/**
 * Layer 3 UI — Step 3: Presenton Template & Theme Picker
 * Displays live visual mini-previews of all 6 curated Presenton themes and launches full deck synthesis.
 */

import React from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { PRESENTON_THEME_LIST } from "../../layer1_data/presentonThemes";

interface Step3ThemeSelectorProps {
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onBackToOutline: () => void;
  onBuildPresentation: () => void;
  isBuildingDeck: boolean;
  slideCount: number;
  deckTitle: string;
}

export const Step3ThemeSelector: React.FC<Step3ThemeSelectorProps> = ({
  selectedThemeId,
  onSelectTheme,
  onBackToOutline,
  onBuildPresentation,
  isBuildingDeck,
  slideCount,
  deckTitle
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Step 3 of 4 • Visual Design System
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
            Choose Your Presenton Template & Theme
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            You can switch themes at any time inside the studio without losing any content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToOutline}
            disabled={isBuildingDeck}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Outline</span>
          </button>

          <button
            type="button"
            onClick={onBuildPresentation}
            disabled={isBuildingDeck}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25"
          >
            {isBuildingDeck ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Building {slideCount} Slides...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Complete Presentation ({slideCount} Slides)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Theme Preview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRESENTON_THEME_LIST.map((theme) => {
          const isSelected = theme.id === selectedThemeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme.id)}
              className={`group text-left rounded-2xl p-3 border transition-all ${
                isSelected
                  ? "bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/30"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* 16:9 Mini Slide Preview */}
              <div
                className="w-full aspect-video rounded-xl p-4 flex flex-col justify-between overflow-hidden relative border"
                style={{
                  background: theme.slideSurface,
                  borderColor: theme.cardBorder
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ background: theme.badgeBg, color: theme.badgeText }}
                  >
                    SLIDE 01 • PREVIEW
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="my-auto">
                  <div
                    className="text-sm font-extrabold line-clamp-1"
                    style={{ color: theme.textPrimary, fontFamily: theme.fontHeading }}
                  >
                    {deckTitle || theme.name}
                  </div>
                  <div
                    className="text-[11px] line-clamp-1 mt-0.5"
                    style={{ color: theme.textSecondary }}
                  >
                    {theme.tagline}
                  </div>
                </div>

                {/* Mini KPI Cards Row */}
                <div className="grid grid-cols-3 gap-2">
                  {["94.2%", "3.4x", "+28%"].map((val, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg p-1.5 border"
                      style={{
                        background: theme.cardSurface,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <div
                        className="text-[10px] font-bold"
                        style={{ color: idx === 0 ? theme.accentHex : theme.textPrimary }}
                      >
                        {val}
                      </div>
                      <div className="h-1 w-full rounded bg-current opacity-20 mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Meta Footer */}
              <div className="mt-3 px-1 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{theme.name}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{theme.tagline}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ background: theme.accentHex }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ background: theme.accentSecondaryHex }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
