import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { PenTool, Code2, Presentation, BrainCircuit } from "lucide-react";
import { ChatMessageListProps, ChatActionMode } from "./types";
import { ChatMessageItem } from "./ChatMessageItem";
import {
  MahrSphericalDroneMascot,
  MahrDroneMiniAvatar,
} from "./mascot/vector/MahrSphericalDroneMascot";

const STARTER_INSTRUCTIONS: Array<{
  title: string;
  subtitle: string;
  prompt: string;
  mode: ChatActionMode;
  icon: React.FC<{ size?: number; className?: string }>;
  accent: string;
}> = [
  {
    title: "Write on Chalkboard",
    subtitle: "Derive formulas or diagrams",
    prompt: "Write the quadratic formula and step-by-step derivation on the chalkboard",
    mode: "whiteboard",
    icon: PenTool,
    accent: "border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300",
  },
  {
    title: "Live Code & Debug",
    subtitle: "Sync code to Whiteboard",
    prompt: "Write a clean binary search implementation in TypeScript with complexity analysis",
    mode: "code",
    icon: Code2,
    accent: "border-indigo-500/30 hover:border-indigo-400/60 text-indigo-300",
  },
  {
    title: "Build Slides Deck",
    subtitle: "Launch Classroom Slides",
    prompt: "Create slides on Neural Networks & Deep Learning with diagrams",
    mode: "slides",
    icon: Presentation,
    accent: "border-amber-500/30 hover:border-amber-400/60 text-amber-300",
  },
  {
    title: "Commit to Vector Memory",
    subtitle: "Save exam dates & goals",
    prompt: "/remember My Algorithms & Data Structures exam is next Monday",
    mode: "memory",
    icon: BrainCircuit,
    accent: "border-purple-500/30 hover:border-purple-400/60 text-purple-300",
  },
];

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  activeSubAgentName,
  themeColor,
  onReplayAudio,
  onSendCodeToChalkboard,
  onSelectStarterCommand,
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
      className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar p-3.5 flex flex-col gap-3 bg-slate-950/60 scroll-smooth relative"
    >
      {/* Empty State: Interactive Vector Spherical Hover-Drone & Typed Instruction Starters */}
      {messages.length === 0 && (
        <div className="my-auto flex flex-col items-center justify-center text-center px-3 py-4 text-slate-400">
          <div className="mb-1.5">
            <MahrSphericalDroneMascot
              expression="happy"
              activity="stare_curious"
              size={68}
            />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide mb-1">
            MAHR Personal AI & Command Dock
          </h4>
          <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-3.5">
            Connected to your <span className="text-cyan-300 font-semibold">128-D Vector Memory</span>. Type natural instructions, pick an action mode, or use <code className="text-cyan-300 font-mono">/</code> commands to control the workspace.
          </p>

          {/* 2x2 Starter Command Grid */}
          {onSelectStarterCommand && (
            <div className="grid grid-cols-2 gap-2 w-full">
              {STARTER_INSTRUCTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectStarterCommand(item.prompt, item.mode)}
                    className={`p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border ${item.accent} text-left transition-all duration-150 cursor-pointer group active:scale-[0.98]`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className="shrink-0" />
                      <span className="text-[10.5px] font-semibold text-white truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 group-hover:text-slate-300 truncate">
                      {item.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, idx) => (
        <ChatMessageItem
          key={msg.id || idx}
          message={msg}
          onReplayAudio={onReplayAudio}
          onSendCodeToChalkboard={onSendCodeToChalkboard}
          themeColor={themeColor}
        />
      ))}

      {/* MAHR Thinking / Vector Recall Wave Indicator */}
      {isLoading && (
        <div className="flex gap-2.5 max-w-[85%] mr-auto animate-fade-in">
          <MahrDroneMiniAvatar size={28} isSpeaking={true} />
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-slate-900/95 border border-cyan-500/25 text-xs text-slate-300 flex items-center gap-2.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-1">
              <span
                className="w-1 h-3 rounded-full bg-cyan-400 animate-pulse"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-5 rounded-full bg-indigo-400 animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-4 rounded-full bg-cyan-300 animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
              <span
                className="w-1 h-2 rounded-full bg-purple-400 animate-pulse"
                style={{ animationDelay: "450ms" }}
              />
            </div>
            <span className="font-mono text-[10px] text-cyan-200">
              {activeSubAgentName} is recalling vector memory & reasoning...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
