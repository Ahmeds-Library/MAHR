/**
 * Layer 3 UI — Presenton Top Navigation & Export Bar
 */

import React, { useState } from "react";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  CloudUpload,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
  Palette,
  PlusCircle,
  Check
} from "lucide-react";
import { PresentonWizardStep } from "../../layer1_data/presentonTypes";
import { PRESENTON_THEME_LIST } from "../../layer1_data/presentonThemes";

interface PresentonTopBarProps {
  activeStep: PresentonWizardStep;
  onSelectStep: (step: PresentonWizardStep) => void;
  hasOutline: boolean;
  hasDeck: boolean;
  deckTitle: string;
  activeThemeId: string;
  onChangeTheme: (themeId: string) => void;
  onBackToSlate?: () => void;
  onNewPresentation: () => void;
  onStartPresentMode: () => void;
  onExportPptx: () => void;
  onExportPdf: () => void;
  onExportGoogleSlides: () => void;
  isExportingPptx: boolean;
  isSpeaking: boolean;
  onToggleSpeakSlide: () => void;
}

const STEP_ITEMS: Array<{ id: PresentonWizardStep; num: string; label: string }> = [
  { id: "step1_input", num: "01", label: "Topic & Sources" },
  { id: "step2_outline", num: "02", label: "Outline Review" },
  { id: "step3_theme", num: "03", label: "Theme & Style" },
  { id: "step4_studio", num: "04", label: "Presenton Studio" }
];

export const PresentonTopBar: React.FC<PresentonTopBarProps> = ({
  activeStep,
  onSelectStep,
  hasOutline,
  hasDeck,
  deckTitle,
  activeThemeId,
  onChangeTheme,
  onBackToSlate,
  onNewPresentation,
  onStartPresentMode,
  onExportPptx,
  onExportPdf,
  onExportGoogleSlides,
  isExportingPptx,
  isSpeaking,
  onToggleSpeakSlide
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const canNavigateTo = (step: PresentonWizardStep) => {
    if (step === "step1_input") return true;
    if (step === "step2_outline" || step === "step3_theme") return hasOutline || hasDeck;
    if (step === "step4_studio") return hasDeck;
    return false;
  };

  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30">
      {/* Left: Brand & Back */}
      <div className="flex items-center gap-3 min-w-0">
        {onBackToSlate && (
          <button
            onClick={onBackToSlate}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Back to Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-indigo-400">
                Presenton AI
              </span>
              <span className="hidden md:inline-block text-[11px] text-slate-500">
                • Mahr Voice Studio
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100 truncate max-w-[180px] sm:max-w-[280px]">
              {deckTitle || "AI Presentation Architect"}
            </p>
          </div>
        </div>
      </div>

      {/* Center: 4-Step Presenton Pipeline Stepper */}
      <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
        {STEP_ITEMS.map((step) => {
          const active = activeStep === step.id;
          const enabled = canNavigateTo(step.id);
          return (
            <button
              key={step.id}
              disabled={!enabled}
              onClick={() => enabled && onSelectStep(step.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : enabled
                  ? "text-slate-300 hover:text-white hover:bg-slate-800/70"
                  : "text-slate-600 cursor-not-allowed"
              }`}
            >
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  active ? "bg-indigo-500/40 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {step.num}
              </span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Studio Controls & Exports */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewPresentation}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Start a New Presentation"
        >
          <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">New Deck</span>
        </button>

        {hasDeck && (
          <>
            {/* Mahr Voice Narrator Toggle */}
            <button
              onClick={onToggleSpeakSlide}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isSpeaking
                  ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
              }`}
              title="Have Mahr narrate this slide aloud"
            >
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="hidden md:inline">{isSpeaking ? "Stop Mahr" : "Narrate"}</span>
            </button>

            {/* Quick Theme Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowThemeMenu((prev) => !prev);
                  setShowExportMenu(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Theme</span>
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Presenton Design Themes
                  </div>
                  {PRESENTON_THEME_LIST.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChangeTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-800 text-left text-xs text-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ background: t.accentHex }}
                        />
                        <span>{t.name}</span>
                      </div>
                      {activeThemeId === t.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Present Button */}
            <button
              onClick={onStartPresentMode}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>Present</span>
            </button>

            {/* Export Dropdown (.pptx, .pdf, Google Slides) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowExportMenu((prev) => !prev);
                  setShowThemeMenu(false);
                }}
                disabled={isExportingPptx}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPptx ? "Exporting..." : "Export"}</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                    Export Presentation
                  </div>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportPptx();
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        PowerPoint (.pptx)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Native editable OpenXML slides
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportPdf();
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
                  >
                    <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        High-Res PDF Deck (.pdf)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Widescreen 16:9 print-ready deck
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportGoogleSlides();
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
                  >
                    <CloudUpload className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        Google Slides Cloud Sync
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Save directly to Google Drive
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
