import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { Bot, Sparkles, MessageSquare } from "lucide-react";
import { ChatMessageListProps } from "./types";
import { ChatMessageItem } from "./ChatMessageItem";

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  activeSubAgentName,
  themeColor,
  onReplayAudio,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Smooth scroll using GSAP
  useEffect(() => {
    if (bottomRef.current && containerRef.current) {
      gsap.to(containerRef.current, {
        scrollTop: containerRef.current.scrollHeight,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 bg-slate-950/50 scroll-smooth relative"
    >
      {/* Empty State: Clean, professional, MAHR prompt */}
      {messages.length === 0 && (
        <div className="my-auto flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-purple-300 mb-3 shadow-lg border border-white/10"
            style={{
              background: `linear-gradient(135deg, rgba(157,122,255,0.15), rgba(79,70,229,0.15))`
            }}
          >
            <Sparkles size={22} className="animate-pulse text-purple-400" />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">
            MAHR Live Voice & Transcript
          </h4>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Speak into your microphone or type a command below. Every response from MAHR will be transcribed here in real-time.
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, idx) => (
        <ChatMessageItem
          key={msg.id || idx}
          message={msg}
          onReplayAudio={onReplayAudio}
          themeColor={themeColor}
        />
      ))}

      {/* MAHR Thinking / Transcribing Wave Indicator */}
      {isLoading && (
        <div className="flex gap-2.5 max-w-[85%] mr-auto animate-fade-in">
          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] bg-slate-900 text-purple-300 border border-purple-500/30 shadow-sm">
            <Bot size={13} className="animate-spin text-purple-400" />
          </div>
          <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-slate-900/90 border border-purple-500/20 text-xs text-slate-300 flex items-center gap-2.5 shadow-lg backdrop-blur-md">
            {/* Pulsing Neural Waveform Bars */}
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-4 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "300ms" }} />
              <span className="w-1 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: "450ms" }} />
            </div>
            <span className="font-mono text-[10px] text-purple-200">
              {activeSubAgentName} is processing response...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
