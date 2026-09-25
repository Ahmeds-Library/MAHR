import React from "react";
import { Bot, Monitor, Volume2, X, Radio } from "lucide-react";
import { ChatHeaderProps } from "./types";

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeSubAgentName,
  activeModelId,
  themeColor,
  isScreenSharing,
  isRealtimeConnected,
  isAutoSpeakEnabled,
  onToggleAutoSpeak,
  onClose,
}) => {
  return (
    <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        {/* MAHR glowing aura avatar */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg relative transition-all duration-300"
          style={{
            background: isRealtimeConnected
              ? `linear-gradient(135deg, #10b981, #06b6d4)`
              : `linear-gradient(135deg, ${themeColor || "#9D7AFF"}, #4f46e5)`,
            boxShadow: isRealtimeConnected
              ? `0 0 15px rgba(16,185,129,0.4)`
              : `0 0 15px rgba(157,122,255,0.3)`
          }}
        >
          <Bot size={17} className={isRealtimeConnected ? "animate-pulse" : ""} />
          {/* Live indicator dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
              isRealtimeConnected ? "bg-emerald-400 animate-ping" : "bg-purple-400"
            }`}
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
              isRealtimeConnected ? "bg-emerald-500" : "bg-purple-500"
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase flex items-center gap-1.5">
              <span>MAHR Transcript Console</span>
            </h3>
            {isRealtimeConnected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[8px] font-mono font-semibold">
                <Radio size={8} className="animate-pulse" />
                <span>Live Audio Linked</span>
              </span>
            )}
          </div>
          <p className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
            <span>{activeSubAgentName} • {activeModelId}</span>
            {isScreenSharing && (
              <span className="inline-flex items-center gap-1 text-cyan-300 font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded text-[8px] border border-cyan-500/30">
                <Monitor size={9} className="animate-pulse" />
                <span>Screen Vision</span>
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {onToggleAutoSpeak && (
          <button
            type="button"
            onClick={() => onToggleAutoSpeak(!isAutoSpeakEnabled)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-mono font-semibold transition-all cursor-pointer border ${
              isAutoSpeakEnabled
                ? "bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-sm shadow-purple-500/20"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200"
            }`}
            title={
              isAutoSpeakEnabled
                ? "Voice Audio ON: Speaks Mahr's responses aloud"
                : "Voice Audio OFF: Silent transcript only"
            }
          >
            <Volume2
              size={11}
              className={isAutoSpeakEnabled ? "text-purple-300 animate-pulse" : "text-slate-500"}
            />
            <span>{isAutoSpeakEnabled ? "Voice ON" : "Voice OFF"}</span>
          </button>
        )}

        <button
          onClick={onClose}
          aria-label="Close transcript console"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
