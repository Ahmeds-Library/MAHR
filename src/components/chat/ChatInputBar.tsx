import React from "react";
import { Send, Sparkles } from "lucide-react";
import { ChatInputBarProps } from "./types";

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col bg-slate-900/95 border-t border-white/10 backdrop-blur-xl">
      {/* Pure Text Chat Input Form with MAHR */}
      <form onSubmit={onSubmit} className="p-2.5 sm:p-3 flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or instruction for MAHR..."
            disabled={isLoading}
            className="w-full bg-slate-950/80 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-sans shadow-inner pr-8"
          />
          {input.trim() && (
            <div className="absolute right-2.5 pointer-events-none text-purple-400/60">
              <Sparkles size={13} />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-lg shadow-purple-900/30 flex items-center gap-1.5 justify-center border border-purple-400/20 font-mono text-[11px] font-semibold shrink-0"
          title="Send message to MAHR"
        >
          <span className="hidden sm:inline">Send</span>
          <Send size={13} className={input.trim() ? "translate-x-0.5 transition-transform" : ""} />
        </button>
      </form>
    </div>
  );
};
