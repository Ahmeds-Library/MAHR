import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  HelpCircle, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { speakViaWebSocket, stopAllWebSocketSpeech } from "../../lib/audio";

export interface MahrLiveSynthesisExplainerProps {
  title: string;
  explanation: string;
  formulas?: string[];
  suggestedExperiments?: string[];
  category?: string;
  modelUsed?: string;
  onAskMahr?: (question: string) => void;
  onAskMyraa?: (question: string) => void;
  className?: string;
}

export type MyraaLiveSynthesisExplainerProps = MahrLiveSynthesisExplainerProps;

export const MahrLiveSynthesisExplainer: React.FC<MahrLiveSynthesisExplainerProps> = ({
  title,
  explanation,
  formulas = [],
  suggestedExperiments = [],
  category = "Physics & Simulation",
  modelUsed = "gemini-3.8-flash",
  onAskMahr,
  onAskMyraa,
  className = ""
}) => {
  const askHandler = onAskMahr || onAskMyraa;
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopAllWebSocketSpeech();
    };
  }, []);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopAllWebSocketSpeech();
      setIsSpeaking(false);
      return;
    }

    stopAllWebSocketSpeech();
    const cleanText = `${title}. ${explanation}. Key principles: ${formulas.join(", ")}.`;
    setIsSpeaking(true);
    speakViaWebSocket(cleanText, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleCopyNotes = () => {
    const textToCopy = `# ${title}\nCategory: ${category}\nModel: ${modelUsed}\n\n## Overview\n${explanation}\n\n## Governing Principles\n${formulas.join(
      "\n"
    )}\n\n## Interactive Experiments\n${suggestedExperiments.map((e, i) => `${i + 1}. ${e}`).join("\n")}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!explanation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`rounded-2xl border border-cyan-500/30 bg-slate-950/85 backdrop-blur-xl shadow-2xl overflow-hidden font-sans text-slate-100 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-cyan-300 tracking-tight">
                MAHR&apos;s Live Synthesis Breakdown
              </span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-[9px] font-mono text-cyan-400 border border-cyan-800/60">
                {modelUsed}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Audio TTS Button */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
              isSpeaking
                ? "bg-cyan-500/30 border-cyan-400 text-cyan-200 animate-pulse"
                : "bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-400 hover:text-white"
            }`}
            title={isSpeaking ? "Pause MAHR voice narration" : "Listen to MAHR explain aloud"}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="text-[10px] hidden sm:inline">{isSpeaking ? "Speaking" : "Listen"}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyNotes}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Copy lesson notes to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3.5 space-y-3 text-xs leading-relaxed max-h-[300px] overflow-y-auto scrollbar-thin"
          >
            {/* Title & Topic */}
            <div>
              <h4 className="font-bold text-white text-sm tracking-tight">{title}</h4>
              <p className="text-[11px] text-cyan-400/90 font-mono mt-0.5">{category}</p>
            </div>

            {/* Intuitive Explanation */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-300">
              <p className="whitespace-pre-line text-[11.5px] leading-relaxed">{explanation}</p>
            </div>

            {/* Governing Principles & Formulas */}
            {formulas && formulas.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  Governing Principles & Equations
                </span>
                <div className="space-y-1">
                  {formulas.map((formula, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/20 font-mono text-[11px] text-cyan-200"
                    >
                      {formula}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Interactive Experiments */}
            {suggestedExperiments && suggestedExperiments.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Try These Experiments Live
                </span>
                <div className="space-y-1.5">
                  {suggestedExperiments.map((exp, idx) => {
                    const done = !!completedSteps[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleStep(idx)}
                        className={`w-full text-left p-2 rounded-xl border text-[11px] font-mono flex items-start gap-2 transition-all cursor-pointer ${
                          done
                            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300 line-through opacity-70"
                            : "bg-slate-900/60 border-white/5 text-slate-300 hover:border-emerald-500/30"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <span>{exp}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ask MAHR Follow-up Button */}
            {askHandler && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Want to dive deeper into this topic?</span>
                <button
                  type="button"
                  onClick={() =>
                    askHandler(
                      `Can you explain the mathematical derivation and deeper intuition behind ${title}? Specifically: ${explanation.slice(
                        0,
                        120
                      )}...`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-cyan-500/30 text-cyan-200 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Ask MAHR in Voice</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const MyraaLiveSynthesisExplainer = MahrLiveSynthesisExplainer;

