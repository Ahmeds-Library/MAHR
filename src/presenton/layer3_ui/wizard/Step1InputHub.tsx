/**
 * Layer 3 UI — Step 1: Presenton Multi-Source Input & Context Hub
 * Supports topic prompt, custom instructions, document upload (.pdf, .txt, .md, .csv, .json),
 * Google Search Grounding toggle, and Mahr voice input.
 */

import React, { useRef, useState } from "react";
import {
  Sparkles,
  Upload,
  Globe,
  FileText,
  X,
  Mic,
  MicOff,
  ArrowRight,
  Layers,
  Users,
  Sliders,
  Languages
} from "lucide-react";
import { PresentonInputConfig } from "../../layer1_data/presentonTypes";
import {
  PRESENTON_LANGUAGE_OPTIONS,
  PRESENTON_STARTER_PROMPTS,
  PRESENTON_TONE_OPTIONS
} from "../../layer1_data/presentonStarters";
import { parseUploadedDocument } from "../../layer2_services/documentParserService";

interface Step1InputHubProps {
  config: PresentonInputConfig;
  onUpdateConfig: (partial: Partial<PresentonInputConfig>) => void;
  onGenerateOutline: () => void;
  isGeneratingOutline: boolean;
}

export const Step1InputHub: React.FC<Step1InputHubProps> = ({
  config,
  onUpdateConfig,
  onGenerateOutline,
  isGeneratingOutline
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingDoc(true);
    setDocError(null);
    try {
      const parsed = await parseUploadedDocument(file);
      onUpdateConfig({
        documentName: parsed.fileName,
        documentContext: parsed.extractedText,
        topic: config.topic.trim() || file.name.replace(/\.[^.]+$/, "")
      });
    } catch (err) {
      setDocError((err as Error)?.message || "Could not parse file");
    } finally {
      setIsParsingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleVoiceDictation = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListeningVoice(true);
    recognition.onend = () => setIsListeningVoice(false);
    recognition.onerror = () => setIsListeningVoice(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        onUpdateConfig({
          topic: config.topic ? `${config.topic} ${transcript}`.trim() : transcript.trim()
        });
      }
    };

    recognition.start();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presenton AI Presentation Architect</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          What would you like to present today?
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2">
          Enter any topic, attach your reference documents, or dictate to Mahr. You will review and customize the slide-by-slide outline before slides are built.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Topic Textarea + Voice Mic */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Presentation Topic or Prompt
            </label>
            <button
              type="button"
              onClick={toggleVoiceDictation}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isListeningVoice
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              {isListeningVoice ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dictate to Mahr</span>
                </>
              )}
            </button>
          </div>
          <textarea
            rows={3}
            value={config.topic}
            onChange={(e) => onUpdateConfig({ topic: e.target.value })}
            placeholder="e.g., Architecture of Autonomous Multi-Agent AI Systems in Enterprise Finance, or paste your presentation brief..."
            className="w-full rounded-xl bg-slate-950/90 border border-slate-800 focus:border-indigo-500 focus:outline-none px-4 py-3 text-sm sm:text-base text-slate-100 placeholder-slate-500 resize-none"
          />
        </div>

        {/* Starter Topic Pills */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Quick Topic Starters
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESENTON_STARTER_PROMPTS.map((starter) => (
              <button
                key={starter.label}
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    topic: starter.topic,
                    tone: starter.tone,
                    audience: starter.audience,
                    slideCount: starter.slideCount
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-indigo-600/20 border border-slate-700/80 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-indigo-200 transition-all"
              >
                {starter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Grid: Slide Count, Tone, Audience, Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
          {/* Number of Slides */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Slide Count: {config.slideCount} Slides</span>
            </label>
            <input
              type="range"
              min={4}
              max={15}
              value={config.slideCount}
              onChange={(e) => onUpdateConfig({ slideCount: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>4 (Brief)</span>
              <span>8 (Standard)</span>
              <span>15 (Deep)</span>
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Presentation Tone</span>
            </label>
            <select
              value={config.tone}
              onChange={(e) => onUpdateConfig({ tone: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              {PRESENTON_TONE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Audience</span>
            </label>
            <input
              type="text"
              value={config.audience}
              onChange={(e) => onUpdateConfig({ audience: e.target.value })}
              placeholder="e.g., Executive Board, Students"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Language */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span>Output Language</span>
            </label>
            <select
              value={config.language}
              onChange={(e) => onUpdateConfig({ language: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              {PRESENTON_LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Document Upload + Live Web Search Grounding Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Document Context Upload */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Reference Document (PDF, MD, TXT, CSV)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Attach a document to ground slides in your own notes, syllabus, or report.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsingDoc}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isParsingDoc ? "Reading..." : "Upload File"}</span>
              </button>
            </div>

            {config.documentName && (
              <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200">
                <span className="truncate">
                  Attached: <strong>{config.documentName}</strong> (
                  {Math.round(config.documentContext.length / 1000)}k chars)
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ documentName: "", documentContext: "" })}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {docError && <p className="text-xs text-rose-400 mt-2">{docError}</p>}
          </div>

          {/* Live Web Search Grounding Toggle */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Google Search Grounding (Real-Time Facts)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enables live web research to pull up-to-date statistics, benchmarks, and verified citations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateConfig({ enableWebSearch: !config.enableWebSearch })}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 shrink-0 ${
                config.enableWebSearch ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.enableWebSearch ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Optional Custom Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Custom Instructions or Specific Subtopics (Optional)
          </label>
          <input
            type="text"
            value={config.customInstructions}
            onChange={(e) => onUpdateConfig({ customInstructions: e.target.value })}
            placeholder="e.g., Include a cost-benefit comparison slide and focus on 2025–2026 industry benchmarks..."
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={!config.topic.trim() || isGeneratingOutline}
            onClick={onGenerateOutline}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
          >
            {isGeneratingOutline ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Researching & Building Slide Outline...</span>
              </>
            ) : (
              <>
                <span>Generate Interactive Slide Outline</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
