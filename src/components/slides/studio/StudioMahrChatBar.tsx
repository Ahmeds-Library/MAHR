/**
 * LAYER 3: StudioMahrChatBar (Clean Single-Line AI Prompt Bar)
 * Eliminates multi-row chip clutter for a focused, effortless slide creation experience.
 */

import React, { useState } from "react";
import { Sparkles, Send, RefreshCw, Wand2, Plus } from "lucide-react";

interface StudioMahrChatBarProps {
  topic: string;
  isGenerating: boolean;
  onExecutePrompt: (prompt: string) => Promise<void>;
  onEnhanceCurrentSlide?: () => void;
  onConvertSlideToMetrics?: () => void;
  onAddSlide?: () => void;
}

export const StudioMahrChatBar: React.FC<StudioMahrChatBarProps> = ({
  isGenerating,
  onExecutePrompt,
  onEnhanceCurrentSlide,
  onAddSlide
}) => {
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inputVal.trim() || isGenerating) return;
    const prompt = inputVal.trim();
    setInputVal("");
    await onExecutePrompt(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.stopPropagation();
    }
  };

  return (
    <div className="w-full bg-[#090c15] border-t border-white/10 px-4 sm:px-6 py-2.5 shrink-0 z-20">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        {/* Clean Single-Line AI Command Input */}
        <form onSubmit={handleSubmit} className="relative flex-1 flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-amber-400">
            <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder={
              isGenerating
                ? "Updating your presentation..."
                : "Ask AI to create or edit slides (e.g., 'Create 7 slides on AI Agents', 'Add key metrics')..."
            }
            className="w-full pl-9 pr-24 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400/70 transition-colors"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isGenerating}
            className="absolute right-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            {isGenerating ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <>
                <span>Generate</span>
                <Send size={11} />
              </>
            )}
          </button>
        </form>

        {/* Simple 1-Click Improve & Add Slide Buttons */}
        {onEnhanceCurrentSlide && (
          <button
            type="button"
            onClick={onEnhanceCurrentSlide}
            disabled={isGenerating}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title="Auto-polish active slide"
          >
            <Wand2 size={13} className="text-amber-400" />
            <span>Improve Slide</span>
          </button>
        )}

        {onAddSlide && (
          <button
            type="button"
            onClick={onAddSlide}
            disabled={isGenerating}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title="Add new slide"
          >
            <Plus size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Add Slide</span>
          </button>
        )}
      </div>
    </div>
  );
};
