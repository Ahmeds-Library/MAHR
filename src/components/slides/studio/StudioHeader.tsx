import React, { useState } from "react";
import {
  ChevronLeft,
  Play,
  Share2,
  Palette,
  ExternalLink,
  Layers,
  Sparkles,
  LogIn,
  LogOut,
  Check
} from "lucide-react";
import { SlideDeck } from "../../../services/slides/slideTypes";
import { SLIDE_THEMES } from "../../../services/slides/slideThemes";

interface StudioHeaderProps {
  deck: SlideDeck;
  onBackToSlate?: () => void;
  onPresent: () => void;
  onExport: () => void;
  onSelectTheme: (themeId: string) => void;
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
  isAuthenticated,
  user,
  onSignIn,
  onSignOut
}) => {
  const [showThemePicker, setShowThemePicker] = useState(false);

  return (
    <header className="h-14 border-b border-white/10 bg-[#070913]/95 backdrop-blur-xl px-3 sm:px-5 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onBackToSlate && (
          <button
            type="button"
            onClick={onBackToSlate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0"
            title="Return to Slate Chalkboard"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Chalkboard</span>
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Layers size={14} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                {deck.title || "Presentation Studio"}
              </span>
              <span className="hidden md:inline-flex text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Google Slides Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Toolbar Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Change Presentation Visual Theme"
          >
            <Palette size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Theme</span>
          </button>

          {showThemePicker && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl p-2 z-50 space-y-1 backdrop-blur-2xl animate-in fade-in duration-150">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2 py-1">
                Visual Themes
              </div>
              {Object.values(SLIDE_THEMES).map((thm) => {
                const isSelected = deck.themeId === thm.id;
                return (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => {
                      onSelectTheme(thm.id);
                      setShowThemePicker(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                        : "text-zinc-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ background: thm.accentCol || "#f59e0b" }}
                      />
                      <span className="truncate">{thm.name}</span>
                    </div>
                    {isSelected && <Check size={12} className="text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Present Mode Button */}
        <button
          type="button"
          onClick={onPresent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-200 hover:text-white transition-all cursor-pointer"
          title="Fullscreen Presentation Mode"
        >
          <Play size={13} className="text-amber-400 fill-amber-400" />
          <span className="hidden sm:inline">Present</span>
        </button>

        {/* Google Slides Export & Sync */}
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-md cursor-pointer"
          title="Export Deck directly to Google Slides"
        >
          <Share2 size={13} />
          <span>Export to Slides</span>
        </button>

        {/* User Auth Info (Google Slides API) */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-1.5 pl-1">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || "User"}
                className="w-7 h-7 rounded-full border border-amber-400/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xs font-bold text-amber-300">
                {user.name ? user.name.charAt(0) : "G"}
              </div>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Sign out of Google Slides session"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Sign in with Google"
          >
            <LogIn size={13} className="text-amber-400" />
            <span>Connect Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
