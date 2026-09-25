import React, { useState } from "react";
import { Sparkles, Send, RefreshCw, Plus, BarChart3, Wand2 } from "lucide-react";

interface StudioMahrChatBarProps {
  topic: string;
  isGenerating: boolean;
  onExecutePrompt: (prompt: string) => Promise<void>;
  onEnhanceCurrentSlide?: () => void;
  onConvertSlideToMetrics?: () => void;
  onAddSlide?: () => void;
}

const QUICK_CHIPS = [
  { label: "Add Metric Slide", prompt: "Add a new quantitative statistics slide comparing key milestones" },
  { label: "Sharpen Bullets", prompt: "Enhance current slide bullets with high-impact executive insights" },
  { label: "Action Roadmap", prompt: "Add an action summary roadmap slide with 3 implementation phases" },
  { label: "Executive Summary", prompt: "Create a bold executive summary slide" }
];

export const StudioMahrChatBar: React.FC<StudioMahrChatBarProps> = ({
  topic,
  isGenerating,
  onExecutePrompt,
  onEnhanceCurrentSlide,
  onConvertSlideToMetrics,
  onAddSlide
}) => {
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isGenerating) return;
    const prompt = inputVal.trim();
    setInputVal("");
    await onExecutePrompt(prompt);
  };

  const handleChipClick = async (prompt: string) => {
    if (isGenerating) return;
    await onExecutePrompt(prompt);
  };

  return (
    <div className="w-full bg-[#0a0d18] border-t border-white/10 px-3 sm:px-6 py-2.5 shrink-0 z-20">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400 shrink-0 pr-1">
            <Sparkles size={12} />
            <span>Mahr AI:</span>
          </div>

          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip.prompt)}
              disabled={isGenerating}
              className="px-2.5 py-1 rounded-full bg-zinc-900/90 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-[11px] text-zinc-300 hover:text-amber-200 transition-all shrink-0 cursor-pointer disabled:opacity-40"
            >
              {chip.label}
            </button>
          ))}

          {onEnhanceCurrentSlide && (
            <button
              type="button"
              onClick={onEnhanceCurrentSlide}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] text-amber-300 transition-all shrink-0 cursor-pointer"
              title="Enhance current slide"
            >
              <Wand2 size={11} />
              <span>Auto-Refine</span>
            </button>
          )}
        </div>

        {/* Text Chat & Command Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-zinc-400">
            <Sparkles size={14} className={isGenerating ? "text-amber-400 animate-spin" : "text-amber-400"} />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isGenerating}
            placeholder={
              isGenerating
                ? "Mahr is generating presentation updates..."
                : `Instruct Mahr (e.g., 'Add a slide on market strategy', 'Make tone concise', 'Add 3 stats')...`
            }
            className="w-full pl-9 pr-24 py-2 rounded-xl bg-zinc-900/90 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors shadow-inner"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isGenerating}
            className="absolute right-1.5 flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-semibold text-xs transition-all cursor-pointer shadow-sm"
          >
            {isGenerating ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <>
                <span>Ask Mahr</span>
                <Send size={11} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
