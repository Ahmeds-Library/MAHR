import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Power, 
  Layers, 
  PenTool, 
  BookOpen, 
  CheckSquare, 
  X,
  Radio
} from "lucide-react";
import gsap from "gsap";
import { getThemeConfig } from "@/services/themeService";

export interface MahrMinimalFloatingMicProps {
  session: any | null;
  state: "disconnected" | "connecting" | "listening" | "speaking";
  themeColor: string;
  voiceConfidence: number;
  isMuted: boolean;
  isFocusMode: boolean;
  activeSubAgentName?: string;
  isWakeWordEnabled?: boolean;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onToggleFocusMode: () => void;
  onToggleWakeWord?: () => void;
  onOpenWhiteboard?: () => void;
  onOpenStudyPad?: () => void;
  onOpenTasks?: () => void;
  onOpenRecalls?: () => void;
  onOpenOffice?: () => void;
  onOpenSlides?: () => void;
  onOpenRoutines?: () => void;
  onOpenAskMahr?: () => void;
}

/**
 * 3-Layer Presentation Component:
 * Single Minimal Floating Microphone Button (MAHR Voice Companion).
 * 
 * Replaces the multi-button bottom dock with a pure, sleek, floating voice trigger:
 * - Ultra-minimal footprint with zero clutter
 * - Audio-reactive pulse halo during listening/speaking
 * - One-touch connect, listen, and mute management
 * - Discreet optional slide-out mini-dock for learning workspace tools
 */
export const MahrMinimalFloatingMic: React.FC<MahrMinimalFloatingMicProps> = ({
  session,
  state,
  themeColor,
  voiceConfidence,
  isMuted,
  isFocusMode,
  activeSubAgentName = "MAHR",
  isWakeWordEnabled = true,
  onToggleConnect,
  onToggleMute,
  onOpenWhiteboard,
  onOpenStudyPad,
  onOpenTasks,
  onOpenRecalls,
  onOpenOffice,
  onOpenSlides,
  onOpenRoutines,
}) => {
  const [showWorkspaceDrawer, setShowWorkspaceDrawer] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const pulseRingRef = useRef<HTMLDivElement>(null);

  const themeConfig = getThemeConfig(themeColor);
  const isConnected = state !== "disconnected";
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";

  // GSAP Smooth Reactive Breathing on State Changes
  useEffect(() => {
    if (!micButtonRef.current) return;

    const ctx = gsap.context(() => {
      if (isListening) {
        gsap.to(micButtonRef.current, {
          scale: 1.06,
          boxShadow: `0 0 35px #10b981aa, 0 0 65px #06b6d466`,
          duration: 0.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      } else if (isSpeaking) {
        gsap.to(micButtonRef.current, {
          scale: 1.08,
          boxShadow: `0 0 40px ${themeConfig.hex}cc, 0 0 70px ${themeConfig.secondaryHex}88`,
          duration: 0.35,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        });
      } else if (state === "connecting") {
        gsap.to(micButtonRef.current, {
          scale: 1.03,
          boxShadow: "0 0 30px #f59e0b88",
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      } else {
        gsap.to(micButtonRef.current, {
          scale: 1,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
          duration: 1.5,
          ease: "sine.out",
        });
      }
    });

    return () => ctx.revert();
  }, [state, isListening, isSpeaking, themeConfig.hex, themeConfig.secondaryHex]);

  if (isFocusMode) {
    return null;
  }

  const handlePrimaryClick = () => {
    if (!isConnected) {
      onToggleConnect();
    } else {
      // If already connected and speaking/listening, toggle mute or sleep
      onToggleMute();
    }
  };

  return (
    <>
      {/* SINGLE MINIMAL FLOATING MICROPHONE TRIGGER */}
      <div 
        id="mahr-minimal-mic-dock"
        className="fixed bottom-16 sm:bottom-20 md:bottom-24 lg:bottom-26 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none pointer-events-auto transition-[bottom] duration-300"
      >
        {/* Subtle Tooltip Label on Hover / Active State */}
        <AnimatePresence>
          {(showTooltip || isSpeaking || isListening) && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="mb-3 px-3.5 py-1.5 rounded-full bg-black/90 border border-white/15 text-[11px] font-mono tracking-wider text-slate-200 backdrop-blur-xl shadow-2xl flex items-center gap-2 pointer-events-none"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSpeaking
                    ? "bg-purple-400 animate-pulse"
                    : isListening
                    ? "bg-emerald-400 animate-ping"
                    : isConnected
                    ? "bg-cyan-400"
                    : "bg-slate-500"
                }`}
              />
              <span className="font-semibold">
                {isSpeaking
                  ? "MAHR IS SPEAKING"
                  : isListening
                  ? isMuted
                    ? "MIC MUTED • CLICK TO UNMUTE"
                    : "LISTENING • SPEAK NOW"
                  : state === "connecting"
                  ? "CONNECTING..."
                  : "TAP TO ACTIVATE MAHR"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Tactical Mic Capsule */}
        <div className="relative flex items-center justify-center">
          {/* Audio Wave Ring for Active Listening */}
          {isListening && !isMuted && (
            <div
              ref={pulseRingRef}
              className="absolute -inset-2.5 rounded-full border-2 border-emerald-400/50 animate-ping pointer-events-none"
              style={{ animationDuration: "2s" }}
            />
          )}

          {/* Voice Confidence Ring */}
          {isListening && !isMuted && voiceConfidence > 0 && (
            <svg className="absolute w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] -rotate-90 pointer-events-none z-10">
              <circle
                cx="50%"
                cy="50%"
                r="40"
                className="stroke-emerald-500/20 fill-none"
                strokeWidth="2.5"
              />
              <circle
                cx="50%"
                cy="50%"
                r="40"
                className="stroke-emerald-400 fill-none transition-all duration-200"
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - Math.min(100, Math.max(10, voiceConfidence)) / 100)}
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* THE SINGLE PRIMARY FLOATING MICROPHONE BUTTON */}
          <button
            ref={micButtonRef}
            onClick={handlePrimaryClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={isConnected ? "Toggle Mahr Microphone" : "Connect with Mahr Voice AI"}
            className={`relative z-20 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border ${
              isSpeaking
                ? "bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white border-purple-400/80 shadow-[0_0_40px_rgba(168,85,247,0.7)]"
                : isListening && !isMuted
                ? "bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.7)]"
                : isListening && isMuted
                ? "bg-gradient-to-tr from-rose-900 via-rose-950 to-black text-rose-300 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.4)]"
                : state === "connecting"
                ? "bg-gradient-to-tr from-amber-600 via-yellow-600 to-amber-700 text-white border-amber-400/80 animate-pulse"
                : "bg-zinc-950/90 text-white hover:text-cyan-300 border-white/20 hover:border-cyan-400/60 shadow-[0_10px_35px_rgba(0,0,0,0.95)] hover:scale-105"
            }`}
          >
            {!isConnected ? (
              <Mic className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-110 text-cyan-400" />
            ) : isMuted ? (
              <MicOff className="w-7 h-7 text-rose-400 animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-7 h-7 animate-pulse text-white" />
            ) : (
              <Mic className="w-7 h-7 text-emerald-300" />
            )}
          </button>

          {/* Quick Disconnect / Power Dot (Only when connected) */}
          {isConnected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleConnect();
              }}
              title="Disconnect voice session"
              className="absolute -top-1 -right-1 z-30 w-6 h-6 rounded-full bg-zinc-900 border border-white/20 text-slate-400 hover:text-rose-400 hover:border-rose-500 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110"
            >
              <Power className="w-3 h-3" />
            </button>
          )}

          {/* Discreet Workspace Tools Toggle (Only visible when at least one workspace extension is active) */}
          {(onOpenWhiteboard || onOpenStudyPad || onOpenTasks) && (
            <button
              onClick={() => setShowWorkspaceDrawer((prev) => !prev)}
              title="Workspace tools (Whiteboard, Study Pad, Tasks)"
              className="absolute -right-11 sm:-right-13 z-20 w-8 h-8 rounded-full bg-zinc-950/80 border border-white/15 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* DISCREET MINIMAL TOOLS DRAWER (Slides up only when clicking tools toggle) */}
      <AnimatePresence>
        {showWorkspaceDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-32 sm:bottom-36 md:bottom-40 lg:bottom-44 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-950/95 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl flex items-center gap-2 max-w-[95vw] transition-[bottom] duration-300"
          >
            {onOpenWhiteboard && (
              <button
                onClick={() => {
                  setShowWorkspaceDrawer(false);
                  onOpenWhiteboard();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-cyan-300 border border-white/10 transition cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                <span>Whiteboard</span>
              </button>
            )}

            {onOpenStudyPad && (
              <button
                onClick={() => {
                  setShowWorkspaceDrawer(false);
                  onOpenStudyPad();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-indigo-300 border border-white/10 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Study Pad</span>
              </button>
            )}

            {onOpenTasks && (
              <button
                onClick={() => {
                  setShowWorkspaceDrawer(false);
                  onOpenTasks();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-emerald-300 border border-white/10 transition cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tasks</span>
              </button>
            )}

            <button
              onClick={() => setShowWorkspaceDrawer(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 transition cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MahrMinimalFloatingMic;
