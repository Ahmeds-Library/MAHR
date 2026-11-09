import React from "react";
import { Sparkles } from "lucide-react";
import { QuickPromptChipsProps } from "./types";

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  prompts,
  onSelectPrompt,
  disabled = false,
}) => {
  return (
    <div className="px-3 py-2 bg-slate-950/85 border-t border-cyan-500/15 flex flex-wrap items-center gap-1.5 overflow-hidden shrink-0">
      {prompts.map((prompt, idx) => {
        const cleanText = prompt.replace(/^[^\w/]+/, "").trim();
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(cleanText)}
            disabled={disabled}
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-950/60 active:scale-95 border border-white/10 hover:border-cyan-400/45 text-[9.5px] font-mono text-slate-300 hover:text-cyan-100 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Sparkles
              size={9}
              className="text-cyan-400/70 group-hover:text-cyan-300 transition-colors shrink-0"
            />
            <span className="truncate max-w-[185px]">{cleanText}</span>
          </button>
        );
      })}
    </div>
  );
};

