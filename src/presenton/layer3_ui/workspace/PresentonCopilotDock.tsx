/**
 * Layer 3 UI — Presenton AI Copilot & Mahr Alexa-Style Voice Command Dock
 * Lets users switch slide layouts in 1 click, view/edit speaker notes, or speak/type AI commands to Mahr.
 */

import React, { useState } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Layout,
  MessageSquareText
} from "lucide-react";
import {
  PresentonLayoutType,
  PresentonSlide
} from "../../layer1_data/presentonTypes";
import { PRESENTON_LAYOUT_CATALOG } from "../../layer1_data/presentonStarters";
import { parsePresentonVoiceCommand } from "../../layer2_services/presentonVoiceService";

interface PresentonCopilotDockProps {
  currentSlide: PresentonSlide;
  onChangeLayout: (layout: PresentonLayoutType) => void;
  onUpdateSpeakerNotes: (notes: string) => void;
  onRunCopilotEdit: (instruction: string) => void;
  onVoiceCommand: (transcript: string) => void;
  isEditingWithAI: boolean;
}

export const PresentonCopilotDock: React.FC<PresentonCopilotDockProps> = ({
  currentSlide,
  onChangeLayout,
  onUpdateSpeakerNotes,
  onRunCopilotEdit,
  onVoiceCommand,
  isEditingWithAI
}) => {
  const [prompt, setPrompt] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isEditingWithAI) return;
    onRunCopilotEdit(prompt.trim());
    setPrompt("");
  };

  const toggleVoiceAssistant = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        const intent = parsePresentonVoiceCommand(transcript);
        if (intent?.type === "edit_slide") {
          onRunCopilotEdit(intent.instruction);
        } else {
          onVoiceCommand(transcript);
        }
      }
    };

    recognition.start();
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-4 space-y-2">
      {/* Collapsible Speaker Notes Drawer */}
      {showNotes && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
            Mahr Voice Presenter Script & Speaker Notes
          </div>
          <textarea
            rows={2}
            value={currentSlide.speakerNotes}
            onChange={(e) => onUpdateSpeakerNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>
      )}

      {/* Main Dock Bar */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Left: Instant Layout Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Layout className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
              Layout:
            </span>
            <select
              value={currentSlide.layout}
              onChange={(e) => onChangeLayout(e.target.value as PresentonLayoutType)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {PRESENTON_LAYOUT_CATALOG.map((l) => (
                <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowNotes((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showNotes
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Speaker Notes</span>
          </button>
        </div>

        {/* Center/Right: AI Slide Copilot & Mahr Voice Command Input */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-[240px] flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isEditingWithAI}
              placeholder='Ask Mahr Copilot: "Make this more executive", "Add 2026 stats", "Translate to Urdu"...'
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Alexa / Mahr Voice Trigger */}
          <button
            type="button"
            onClick={toggleVoiceAssistant}
            className={`p-2 rounded-xl border transition-all ${
              isListening
                ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse"
                : "bg-slate-950 hover:bg-slate-800 border-slate-800 text-indigo-400"
            }`}
            title='Speak a voice command (e.g., "Next slide", "Read slide", "Make it a chart")'
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={!prompt.trim() || isEditingWithAI}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {isEditingWithAI ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isEditingWithAI ? "Updating..." : "Apply"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
