import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Mic, MicOff, Sparkles, Send, Volume2, Bot, Play, FastForward } from "lucide-react";
import { useMahrVoiceAssistant } from "../../../hooks/slides/useMahrVoiceAssistant";

interface MahrVoicePresentationBarProps {
  onStartPipeline: (promptText: string, slideCount: number) => void;
  isRunning?: boolean;
}

const PRESET_TOPICS = [
  "FMC Commodity Trends & Price Volatility",
  "Deep Neural Networks Gradient Descent",
  "Global Supply Chain Logistics 2026",
  "Quantum Computing Qubit Gates"
];

const SUGGESTED_SLIDE_COUNTS = [
  { count: 6, label: "6 Slides (Suggested Keynote)" },
  { count: 8, label: "8 Slides (Suggested Deck)" },
  { count: 10, label: "10 Slides (Suggested Masterclass)" },
  { count: 5, label: "5 Slides (Quick Pitch)" },
  { count: 12, label: "12 Slides (Deep Dive)" }
];

export const MahrVoicePresentationBar: React.FC<MahrVoicePresentationBarProps> = ({
  onStartPipeline,
  isRunning = false
}) => {
  const [promptText, setPromptText] = useState("");
  const [slideCount, setSlideCount] = useState<number>(8);
  const orbRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  const {
    isListening,
    transcript,
    voiceVolume,
    isMahrSpeaking,
    toggleListening,
    speakAsMahr
  } = useMahrVoiceAssistant({
    onCommandReceived: (cmd) => {
      setPromptText(cmd);
      onStartPipeline(cmd, slideCount);
    },
    onWakeWordTriggered: () => {
      speakAsMahr("I'm listening. Aap ko kitni slides chahiye? Suggested 6 se 10 slides hain.");
    }
  });

  // Keep prompt synced if user talks
  useEffect(() => {
    if (transcript && isListening) {
      setPromptText(transcript);
    }
  }, [transcript, isListening]);

  // GSAP Breathing on Mahr Orb
  useEffect(() => {
    if (!orbRef.current) return;
    const ctx = gsap.context(() => {
      if (isListening || isMahrSpeaking) {
        gsap.to(orbRef.current, {
          scale: 1.15,
          boxShadow: "0 0 35px rgba(6, 182, 212, 0.8), 0 0 65px rgba(168, 85, 247, 0.4)",
          duration: 0.5,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut"
        });
      } else {
        gsap.to(orbRef.current, {
          scale: 1.0,
          boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
          duration: 2.0,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    });
    return () => ctx.revert();
  }, [isListening, isMahrSpeaking]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (promptText.trim()) {
      onStartPipeline(promptText.trim(), slideCount);
    }
  };

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      {/* Top Assistant Status */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Mahr Orb */}
          <div
            ref={orbRef}
            onClick={toggleListening}
            className={`w-9 h-9 rounded-full cursor-pointer flex items-center justify-center transition-all ${
              isListening
                ? "bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950"
                : isMahrSpeaking
                ? "bg-gradient-to-tr from-purple-500 to-cyan-400 text-slate-950"
                : "bg-slate-900 border border-cyan-500/40 text-cyan-400"
            }`}
            title="Click to talk with Mahr"
          >
            {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <Bot className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">MAHR</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                AI Companion
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {isListening
                ? "Listening... Speak your topic"
                : isMahrSpeaking
                ? "Mahr is speaking..."
                : 'Say "Hey Mahr" or click orb'}
            </span>
          </div>
        </div>

        {/* Audio Frequencies */}
        <div className="flex items-center gap-0.5 h-6">
          {voiceVolume.map((vol, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${
                isMahrSpeaking ? "bg-purple-400" : isListening ? "bg-emerald-400" : "bg-cyan-500/40"
              }`}
              style={{ height: `${Math.max(4, (vol / 100) * 24)}px` }}
            />
          ))}
        </div>
      </div>

      {/* Slide Count Selector: Kitni slides chahiye? (Suggested: 6 se 10) */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] pb-2 mb-2 border-b border-slate-900 scrollbar-none">
        <span className="text-slate-400 font-mono flex items-center gap-1 shrink-0">
          📊 Kitni slides chahiye? <span className="text-cyan-400 font-semibold">(Suggested: 6 se 10):</span>
        </span>
        {SUGGESTED_SLIDE_COUNTS.map((item) => {
          const isSelected = slideCount === item.count;
          return (
            <button
              key={item.count}
              type="button"
              onClick={() => setSlideCount(item.count)}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-950/40 font-bold"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Input Field Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="E.g., FMC commodity price trends & volatility analysis..."
            disabled={isRunning}
            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={toggleListening}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {isListening ? <Mic className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isRunning || !promptText.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-cyan-950/50 transition-all shrink-0"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Orchestrating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Pipeline</span>
            </>
          )}
        </button>
      </form>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-900">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Quick Prompts:</span>
        {PRESET_TOPICS.map((topic, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setPromptText(topic);
              onStartPipeline(topic, slideCount);
            }}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800/80 transition-colors"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
};
