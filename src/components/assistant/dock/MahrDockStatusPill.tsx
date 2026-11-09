import React from "react";
import { Mic, MicOff, Radio } from "lucide-react";

interface MahrDockStatusPillProps {
  state: "disconnected" | "connecting" | "listening" | "speaking";
  voiceConfidence: number;
  activeSubAgentName?: string;
  isWakeWordEnabled?: boolean;
  onToggleWakeWord?: () => void;
}

/**
 * Assistant Telemetry & Wake Word Status Pill:
 * Shows live connection state, active sub-agent name, and microphone wake-word switch.
 */
export const MahrDockStatusPill: React.FC<MahrDockStatusPillProps> = ({
  state,
  voiceConfidence,
  activeSubAgentName = "MAHR",
  isWakeWordEnabled = true,
  onToggleWakeWord,
}) => {
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  return (
    <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-white/10 select-none">
      {/* Dynamic Status Indicator */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isSpeaking
              ? "bg-purple-400 animate-ping"
              : isListening
              ? "bg-emerald-400 animate-pulse"
              : state === "connecting"
              ? "bg-amber-400 animate-bounce"
              : isWakeWordEnabled
              ? "bg-cyan-400"
              : "bg-slate-500"
          }`}
        />
        <div className="hidden md:flex flex-col">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-200">
            {isSpeaking
              ? `${activeSubAgentName} Speaking`
              : isListening
              ? `${activeSubAgentName} Listening`
              : state === "connecting"
              ? "Connecting..."
              : isWakeWordEnabled
              ? `Hey ${activeSubAgentName}`
              : "Standby"}
          </span>
          <span className="text-[9px] font-mono text-slate-400">
            {isListening
              ? `${voiceConfidence}% clarity`
              : isWakeWordEnabled
              ? "Wake-word active"
              : "Click orb"}
          </span>
        </div>
      </div>

      {/* Wake Word Microphone Toggle Button */}
      {onToggleWakeWord && (
        <button
          onClick={onToggleWakeWord}
          className={`p-1.5 sm:p-2 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isWakeWordEnabled
              ? "text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          }`}
          title={isWakeWordEnabled ? "Wake word active ('Hey Mahr')" : "Wake word listener paused"}
        >
          {isWakeWordEnabled ? (
            <Mic className="w-3.5 h-3.5" />
          ) : (
            <MicOff className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
};

export default MahrDockStatusPill;
