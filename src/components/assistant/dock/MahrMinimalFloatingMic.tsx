import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Volume2,
  Power,
  Layers,
  PenTool,
  BookOpen,
  CheckSquare,
  X,
  Pin,
  PinOff,
  Cpu,
} from "lucide-react";
import gsap from "gsap";
import { getThemeConfig } from "@/services/themeService";
import { MicSubtleEdgeWaveRing } from "@/voiceSync/layer3_ui/MicSubtleEdgeWaveRing";
import { ToolSafetyApprovalBanner } from "@/voiceSync/layer3_ui/ToolSafetyApprovalBanner";
import {
  AssistantStage,
  ToolApprovalRequest,
} from "@/voiceSync/layer1_data/assistantSessionTypes";

export interface MahrMinimalFloatingMicProps {
  session: any | null;
  state: "disconnected" | "connecting" | "listening" | "speaking";
  assistantStage?: AssistantStage;
  followUpRemainingMs?: number | null;
  activeToolName?: string | null;
  isSessionPinned?: boolean;
  onTogglePinSession?: () => void;
  pendingApprovalRequest?: ToolApprovalRequest | null;
  onResolveToolApproval?: (approved: boolean) => void;
  lastErrorDiagnostic?: string | null;
  themeColor: string;
  voiceConfidence: number;
  isMuted: boolean;
  isFocusMode: boolean;
  activeSubAgentName?: string;
  isWakeWordEnabled?: boolean;
  onToggleConnect: () => void;
  onPowerDisconnect?: () => void;
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
 * Single Minimal Floating Microphone Button (MAHR Continuous Voice Companion).
 */
export const MahrMinimalFloatingMic: React.FC<MahrMinimalFloatingMicProps> = ({
  session,
  state,
  assistantStage,
  followUpRemainingMs,
  activeToolName,
  isSessionPinned = false,
  onTogglePinSession,
  pendingApprovalRequest = null,
  onResolveToolApproval,
  lastErrorDiagnostic,
  themeColor,
  isMuted,
  isFocusMode,
  onToggleConnect,
  onPowerDisconnect,
  onToggleMute,
  onOpenWhiteboard,
  onOpenStudyPad,
  onOpenTasks,
}) => {
  const [showWorkspaceDrawer, setShowWorkspaceDrawer] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const micButtonRef = useRef<HTMLButtonElement>(null);

  const themeConfig = getThemeConfig(themeColor);
  const effectiveStage: AssistantStage =
    assistantStage ||
    (state === "disconnected"
      ? "standby"
      : state === "connecting"
      ? "wake"
      : state === "speaking"
      ? "speak"
      : "listen");

  const isConnected = effectiveStage !== "standby";
  const isListening =
    effectiveStage === "listen" || effectiveStage === "follow_up";
  const isThinkingOrTool = effectiveStage === "think_or_tool";
  const isSpeaking = effectiveStage === "speak";
  const isFollowUp = effectiveStage === "follow_up";

  // GSAP Smooth Reactive Breathing on Non-Listening State Changes
  // (When actively listening or in follow-up & unmuted, the 60fps coupled vocal spring engine drives button scale & glow)
  useEffect(() => {
    if (!micButtonRef.current) return;

    const ctx = gsap.context(() => {
      if (isListening && !isMuted) {
        gsap.killTweensOf(micButtonRef.current);
      } else if (isListening && isMuted) {
        gsap.to(micButtonRef.current, {
          scale: 1,
          boxShadow: "0 0 22px rgba(244, 63, 94, 0.38)",
          duration: 0.4,
          ease: "sine.out",
        });
      } else if (isThinkingOrTool) {
        gsap.to(micButtonRef.current, {
          scale: 1.045,
          boxShadow: "0 0 32px rgba(99, 102, 241, 0.65)",
          duration: 0.55,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      } else if (isSpeaking) {
        gsap.to(micButtonRef.current, {
          scale: 1.06,
          boxShadow: `0 0 35px ${themeConfig.hex}aa`,
          duration: 0.45,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        });
      } else if (effectiveStage === "wake") {
        gsap.to(micButtonRef.current, {
          scale: 1.02,
          boxShadow: "0 0 25px #f59e0b88",
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      } else {
        gsap.to(micButtonRef.current, {
          scale: 1,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
          duration: 0.5,
          ease: "sine.out",
        });
      }
    });

    return () => ctx.revert();
  }, [
    effectiveStage,
    isListening,
    isThinkingOrTool,
    isMuted,
    isSpeaking,
    themeConfig.hex,
  ]);

  if (isFocusMode) {
    return null;
  }

  const handlePrimaryClick = () => {
    if (!isConnected) {
      onToggleConnect();
    } else {
      onToggleMute();
    }
  };

  const handleHardDisconnect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPowerDisconnect) {
      onPowerDisconnect();
    } else {
      onToggleConnect();
    }
  };

  const followUpSeconds =
    followUpRemainingMs !== null && followUpRemainingMs !== undefined
      ? Math.max(1, Math.ceil(followUpRemainingMs / 1000))
      : 8;

  const statusText = lastErrorDiagnostic
    ? lastErrorDiagnostic
    : isSpeaking
    ? "MAHR IS SPEAKING"
    : isThinkingOrTool
    ? `THINKING • ${(activeToolName || "PROCESSING").toUpperCase()}`
    : isFollowUp
    ? isMuted
      ? `FOLLOW-UP (${followUpSeconds}s) • MUTED`
      : `FOLLOW-UP • ${followUpSeconds}s${isSessionPinned ? " • PINNED" : ""}`
    : isListening
    ? isMuted
      ? "MIC MUTED • CLICK TO UNMUTE"
      : isSessionPinned
      ? "LISTENING (PINNED) • SPEAK NOW"
      : "LISTENING • SPEAK NOW"
    : effectiveStage === "wake"
    ? "WAKING UP MAHR..."
    : "TAP TO ACTIVATE MAHR";

  return (
    <>
      {/* SINGLE MINIMAL FLOATING MICROPHONE TRIGGER */}
      <div
        id="mahr-minimal-mic-dock"
        className="fixed bottom-16 sm:bottom-20 md:bottom-24 lg:bottom-26 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none pointer-events-auto transition-[bottom] duration-300"
      >
        {/* Tier-2 Interactive Tool Safety Approval Gate */}
        {pendingApprovalRequest && onResolveToolApproval && (
          <ToolSafetyApprovalBanner
            request={pendingApprovalRequest}
            onResolve={onResolveToolApproval}
          />
        )}

        {/* Unified 6-Stage Assistant Status Capsule */}
        <AnimatePresence>
          {(showTooltip || isConnected || Boolean(lastErrorDiagnostic)) && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="mb-3 px-3.5 py-1.5 rounded-full bg-black/90 border border-white/15 text-[11px] font-mono tabular-nums tracking-wider text-slate-200 backdrop-blur-xl shadow-2xl flex items-center gap-2 pointer-events-none"
            >
              <span className="font-semibold whitespace-nowrap">{statusText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Tactical Mic Capsule with Zero-Lag Aurora Silk 360° Spring Wave */}
        <div className="relative flex items-center justify-center">
          <MicSubtleEdgeWaveRing
            session={session}
            state={state}
            assistantStage={effectiveStage}
            isMuted={isMuted}
            micButtonRef={micButtonRef}
          />

          {/* THE SINGLE PRIMARY FLOATING MICROPHONE BUTTON */}
          <button
            ref={micButtonRef}
            type="button"
            onClick={handlePrimaryClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={
              isConnected
                ? "Toggle Mahr Microphone Mute"
                : "Connect with Mahr Voice AI"
            }
            className={`relative z-20 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border ${
              isSpeaking
                ? "bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white border-purple-400/80 shadow-[0_0_40px_rgba(168,85,247,0.7)]"
                : isThinkingOrTool
                ? "bg-gradient-to-tr from-indigo-600 via-sky-600 to-cyan-500 text-white border-indigo-400/80 shadow-[0_0_36px_rgba(99,102,241,0.7)]"
                : isListening && !isMuted
                ? "bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.7)]"
                : isListening && isMuted
                ? "bg-gradient-to-tr from-rose-900 via-rose-950 to-black text-rose-300 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.4)]"
                : effectiveStage === "wake"
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
            ) : isThinkingOrTool ? (
              <Cpu className="w-7 h-7 animate-spin text-sky-200" />
            ) : (
              <Mic className="w-7 h-7 text-emerald-300" />
            )}
          </button>

          {/* Session Pin Toggle (Keeps session open after 8s follow-up window when pinned) */}
          {isConnected && onTogglePinSession && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePinSession();
              }}
              title={
                isSessionPinned
                  ? "Session Pinned (stays open after 8s follow-up) — Click to unpin"
                  : "Wake Session (returns to standby after 8s silence) — Click to pin open"
              }
              aria-label="Toggle session pin"
              className={`absolute -top-1 -left-1 z-30 w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110 ${
                isSessionPinned
                  ? "bg-teal-950 border-teal-400/70 text-teal-300"
                  : "bg-zinc-900 border-white/20 text-slate-400 hover:text-teal-300"
              }`}
            >
              {isSessionPinned ? (
                <Pin className="w-3 h-3" />
              ) : (
                <PinOff className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Quick Hard Disconnect / Power Dot (Always overrides pin & disconnects immediately) */}
          {isConnected && (
            <button
              type="button"
              onClick={handleHardDisconnect}
              title="Disconnect voice session"
              aria-label="Disconnect voice session"
              className="absolute -top-1 -right-1 z-30 w-6 h-6 rounded-full bg-zinc-900 border border-white/20 text-slate-400 hover:text-rose-400 hover:border-rose-500 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110"
            >
              <Power className="w-3 h-3" />
            </button>
          )}

          {/* Discreet Workspace Tools Toggle */}
          {(onOpenWhiteboard || onOpenStudyPad || onOpenTasks) && (
            <button
              type="button"
              onClick={() => setShowWorkspaceDrawer((prev) => !prev)}
              title="Workspace tools (Whiteboard, Study Pad, Tasks)"
              className="absolute -right-11 sm:-right-13 z-20 w-8 h-8 rounded-full bg-zinc-950/80 border border-white/15 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-110"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* DISCREET MINIMAL TOOLS DRAWER */}
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-cyan-300 border border-white/10 transition cursor-pointer whitespace-nowrap shrink-0"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-indigo-300 border border-white/10 transition cursor-pointer whitespace-nowrap shrink-0"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-emerald-300 border border-white/10 transition cursor-pointer whitespace-nowrap shrink-0"
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
