// 🎙️ Layer 1: MahrAssistantVoiceBanner Component
// MAHR holographic voice assistant presence inside the installer modal.
// Features pulsating ambient audio waveforms, live Urdu/English commentary, and interactive voice triggers.

import React from "react";
import { Volume2, VolumeX, Sparkles, Radio } from "lucide-react";
import { motion } from "motion/react";

interface MahrAssistantVoiceBannerProps {
  isSpeaking: boolean;
  message: string;
  onReplayVoice?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const MahrAssistantVoiceBanner: React.FC<MahrAssistantVoiceBannerProps> = ({
  isSpeaking,
  message,
  onReplayVoice,
  isMuted = false,
  onToggleMute
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-cyan-950/40 border border-purple-500/30 p-3.5 shadow-lg shadow-purple-950/30 backdrop-blur-xl">
      {/* Background Ambient Glow */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-3">
        {/* Left: MAHR Orb & Waveform */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            {/* Glowing Ring */}
            <motion.div
              className="absolute w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500/30 to-cyan-400/30 blur-sm"
              animate={isSpeaking ? { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.4 }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            />
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center text-white">
              {isSpeaking ? (
                <Radio size={14} className="animate-spin text-cyan-200" style={{ animationDuration: "3s" }} />
              ) : (
                <Sparkles size={14} className="text-cyan-200" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-300 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? "bg-cyan-400 animate-ping" : "bg-emerald-400"}`} />
                MAHR Assistant Voice
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                Voice Engine
              </span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-snug truncate sm:whitespace-normal mt-0.5">
              &ldquo;{message}&rdquo;
            </p>
          </div>
        </div>

        {/* Right: Audio Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onReplayVoice && (
            <button
              onClick={onReplayVoice}
              disabled={isSpeaking}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
              title="Repeat Assistant Guidance"
            >
              <Volume2 size={13} className={isSpeaking ? "text-cyan-400 animate-pulse" : ""} />
            </button>
          )}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title={isMuted ? "Unmute Assistant Voice" : "Mute Assistant Voice"}
            >
              {isMuted ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
