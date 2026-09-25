import React from "react";
import { QuickPromptChipsProps } from "./types";

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  prompts,
  onSelectPrompt,
  disabled = false,
}) => {
  return (
    <div className="px-3 py-1.5 bg-slate-900/60 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => onSelectPrompt(prompt.slice(2).trim())}
          disabled={disabled}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-[10px] font-mono text-slate-300 whitespace-nowrap transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:border-purple-500/40"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};
