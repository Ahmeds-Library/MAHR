import React, { useState } from "react";
import { Mic, Sparkles, Send, X, Volume2, Presentation, Brain, GitCommit, Cpu, Trash2 } from "lucide-react";
import { useMahrVoiceIntent } from "../../hooks/whiteboard/useMahrVoiceIntent";
import { WhiteboardVoiceAction } from "../../services/whiteboard/whiteboardVoiceIntentEngine";

interface MahrVoiceCompanionProps {
  onExecuteAction: (action: WhiteboardVoiceAction) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_COMMANDS = [
  { label: "Slides on AI", icon: Presentation, prompt: "Create presentation on Autonomous AI Agents" },
  { label: "Mind Map", icon: Brain, prompt: "Open interactive mind map" },
  { label: "Logic Lab", icon: Cpu, prompt: "Open DLD logic circuit simulator" },
  { label: "Architecture", icon: GitCommit, prompt: "Show system architecture flowchart" },
  { label: "Draw Neural Net", icon: Sparkles, prompt: "Draw neural network schematic" },
  { label: "Clean Board", icon: Trash2, prompt: "Clear canvas" },
];

export const MahrVoiceCompanion: React.FC<MahrVoiceCompanionProps> = ({
  onExecuteAction,
  isOpen,
  onClose
}) => {
  const [inputText, setInputText] = useState("");

  const {
    isListening,
    transcript,
    setTranscript,
    statusMessage,
    isSpeaking,
    audioLevel,
    toggleListening,
    executeCommand
  } = useMahrVoiceIntent({
    onExecuteAction,
    isAutoSpeakEnabled: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim() || transcript.trim();
    if (query) {
      executeCommand(query);
      setInputText("");
      setTranscript("");
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    executeCommand(prompt);
  };

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto">
      <div className="relative rounded-2xl bg-zinc-950/95 border border-amber-500/40 shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-3.5 sm:p-4 text-white select-none">
        {/* Ambient Top Light Glow */}
        <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b]" />

        {/* Header & Status Indicator */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {/* MAHR Glowing Orb */}
            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-amber-950/80 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              {isListening ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              ) : isSpeaking ? (
                <Volume2 size={13} className="text-amber-400 animate-pulse" />
              ) : (
                <Sparkles size={13} className="text-amber-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-white">
                  MAHR VOICE COMPANION
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Voice & Intent
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono line-clamp-1">
                {transcript ? `"${transcript}"` : statusMessage}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss Companion"
          >
            <X size={15} />
          </button>
        </div>

        {/* Speech Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={inputText || transcript}
              onChange={(e) => {
                setInputText(e.target.value);
                if (transcript) setTranscript("");
              }}
              placeholder='Try "Open slides on AI", "Draw logic circuit", or "Switch to Mind Map"...'
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400/60 transition-colors font-sans"
            />
          </div>

          {/* Voice Microphone Toggle */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isListening
                ? "bg-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105"
                : "bg-zinc-900 border-white/15 text-zinc-300 hover:text-white hover:border-amber-400/50"
            }`}
            title={isListening ? "Listening... (Click to stop)" : "Speak to MAHR"}
          >
            {isListening ? <Mic size={15} className="animate-pulse" /> : <Mic size={15} />}
          </button>

          {/* Send Command */}
          <button
            type="submit"
            disabled={!inputText.trim() && !transcript.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
          >
            <span>Ask Mahr</span>
            <Send size={12} />
          </button>
        </form>

        {/* Soundwave Visualizer when listening */}
        {isListening && (
          <div className="flex items-center justify-center gap-1 py-1 mb-2.5">
            {[4, 10, 16, 22, 14, 8, 18, 12, 6].map((height, i) => (
              <span
                key={i}
                className="w-1 bg-amber-400 rounded-full transition-all duration-75"
                style={{
                  height: Math.max(3, height * audioLevel) + "px",
                  opacity: 0.6 + audioLevel * 0.4
                }}
              />
            ))}
          </div>
        )}

        {/* Fast Suggestion Command Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 font-mono shrink-0 mr-1">Quick:</span>
          {QUICK_COMMANDS.map((item, idx) => {
            const Icon = item?.icon || Sparkles;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(item.prompt)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-amber-400/40 text-[10px] font-mono text-zinc-300 hover:text-amber-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                <Icon size={11} className="text-amber-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
