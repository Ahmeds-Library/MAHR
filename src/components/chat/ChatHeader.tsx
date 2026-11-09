import React from "react";
import { Monitor, Volume2, X, Radio, BrainCircuit, Trash2 } from "lucide-react";
import { ChatHeaderProps } from "./types";
import { MahrDroneMiniAvatar } from "./mascot/vector/MahrSphericalDroneMascot";

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeSubAgentName,
  activeModelId,
  isScreenSharing,
  isRealtimeConnected,
  isAutoSpeakEnabled,
  onToggleAutoSpeak,
  onClearChat,
  vectorMemoryCount = 0,
  isVectorRecalling = false,
  onClose,
}) => {
  return (
    <div className="px-3.5 py-2.5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl shrink-0 relative overflow-hidden">
      {/* Subtle top holographic scanline glow */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

      <div className="flex items-center gap-2.5 min-w-0">
        {/* Spherical Hover-Drone Vector Mini Avatar */}
        <div className="relative shrink-0">
          <MahrDroneMiniAvatar
            size={34}
            isRealtimeConnected={isRealtimeConnected}
            isSpeaking={isAutoSpeakEnabled}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase flex items-center gap-1">
              <span>MAHR Command Dock</span>
            </h3>
            {isRealtimeConnected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[8px] font-mono font-semibold">
                <Radio size={8} className="animate-pulse" />
                <span>Live Link</span>
              </span>
            )}
          </div>

          <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="truncate max-w-[130px] text-slate-300">
              {activeSubAgentName}
            </span>
            <span className="text-slate-600">•</span>
            {/* 128-D Vector Memory Sync Indicator */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-semibold border transition-colors ${
                isVectorRecalling
                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50 animate-pulse"
                  : "bg-purple-950/60 text-purple-200 border-purple-500/30"
              }`}
              title="128-D Vector Knowledge Graph & Long-Term Memory Active"
            >
              <BrainCircuit size={9} className={isVectorRecalling ? "text-cyan-300" : "text-purple-300"} />
              <span>
                {isVectorRecalling
                  ? "Recalling Vectors..."
                  : `${vectorMemoryCount} Vector Nodes`}
              </span>
            </span>

            {isScreenSharing && (
              <span className="inline-flex items-center gap-1 text-cyan-300 font-bold bg-cyan-950/80 px-1.5 py-0.2 rounded text-[8px] border border-cyan-500/30">
                <Monitor size={8} className="animate-pulse" />
                <span>Vision</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onToggleAutoSpeak && (
          <button
            type="button"
            onClick={() => onToggleAutoSpeak(!isAutoSpeakEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono font-semibold transition-all cursor-pointer border ${
              isAutoSpeakEnabled
                ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/40 shadow-sm shadow-cyan-500/10"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200"
            }`}
            title={
              isAutoSpeakEnabled
                ? "Voice Audio ON: Speaks MAHR's responses aloud"
                : "Voice Audio OFF: Silent transcript only"
            }
          >
            <Volume2
              size={11}
              className={isAutoSpeakEnabled ? "text-cyan-300 animate-pulse" : "text-slate-500"}
            />
            <span className="hidden sm:inline">{isAutoSpeakEnabled ? "Voice" : "Muted"}</span>
          </button>
        )}

        {onClearChat && (
          <button
            type="button"
            onClick={onClearChat}
            title="Clear current chat transcript"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer border border-white/10 hover:border-rose-500/30 flex items-center justify-center"
          >
            <Trash2 size={13} />
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat window"
          title="Close chat window"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10 flex items-center justify-center"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
