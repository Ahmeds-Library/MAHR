/**
 * LAYER 3: PresentonArchitectModal
 * Implements Presenton's 2-Stage Interactive Outline & Template/Animation Architect
 * plus 1-Click Autonomous Masterpiece Deck Generation (with AI Images, Infographics, GIFs & Videos).
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Layers,
  BookOpen,
  Network,
  Globe,
  Wand2,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Film
} from "lucide-react";
import { SlideDeck, SlideLayout } from "../../../services/slides/slideTypes";
import { SLIDE_THEMES, DEFAULT_THEME_ID } from "../../../services/slides/slideThemes";
import {
  AutonomousMediaKind,
  ELEMENT_ENTRANCE_METADATA,
  ElementEntrancePreset,
  PresentonIngestionConfig,
  PresentonSlideOutline,
  SLIDE_TRANSITION_METADATA,
  SlideTransitionPreset
} from "../../../slidesStudio/layer1_data/presentonTypes";
import {
  buildPresentonOutline,
  compilePresentonOutlineToDeck,
  gatherMultiSourceContext
} from "../../../slidesStudio/layer2_logic/presentonOutlineEngine";

interface PresentonArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeck: SlideDeck;
  onApplyDeck: (newDeck: SlideDeck) => void;
}

export const PresentonArchitectModal: React.FC<PresentonArchitectModalProps> = ({
  isOpen,
  onClose,
  currentDeck,
  onApplyDeck
}) => {
  const [step, setStep] = useState<"configure" | "outline">("configure");
  const [config, setConfig] = useState<PresentonIngestionConfig>({
    topicPrompt: currentDeck.topic || currentDeck.title || "Autonomous AI Systems & Architecture",
    audience: currentDeck.audience || "Executive & Engineering Leaders",
    slideCount: Math.max(6, currentDeck.slides.length || 7),
    themeId: currentDeck.themeId || DEFAULT_THEME_ID,
    defaultTransition: currentDeck.defaultTransition || "morph_smooth",
    defaultEntrance: currentDeck.defaultEntrance || "stagger_cascade",
    includeStudyPad: true,
    includeObsidianVault: true,
    includeWebGrounding: true,
    autoGenerateAllMedia: true
  });

  const [outlines, setOutlines] = useState<PresentonSlideOutline[]>([]);

  useEffect(() => {
    if (isOpen) {
      setConfig((prev) => ({
        ...prev,
        topicPrompt: currentDeck.topic || currentDeck.title || prev.topicPrompt,
        themeId: currentDeck.themeId || prev.themeId
      }));
    }
  }, [isOpen, currentDeck.topic, currentDeck.title, currentDeck.themeId]);

  if (!isOpen) return null;

  const extractedContext = gatherMultiSourceContext(config);

  const handleGenerateOutlineStep = () => {
    const generated = buildPresentonOutline(config);
    setOutlines(generated);
    setStep("outline");
  };

  const handleOneClickMasterpiece = () => {
    const generatedOutlines = buildPresentonOutline(config);
    const fullDeck = compilePresentonOutlineToDeck(generatedOutlines, config);
    onApplyDeck(fullDeck);
    onClose();
  };

  const handleCompileApprovedOutline = () => {
    const fullDeck = compilePresentonOutlineToDeck(outlines, config);
    onApplyDeck(fullDeck);
    onClose();
  };

  const updateOutlineItem = (idx: number, patch: Partial<PresentonSlideOutline>) => {
    setOutlines((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const addOutlineSlide = () => {
    const nextNum = outlines.length + 1;
    setOutlines((prev) => [
      ...prev,
      {
        id: `presenton-slide-${Date.now()}`,
        slideNumber: nextNum,
        layout: "bullets",
        title: `${config.topicPrompt} — Extended Analysis ${nextNum}`,
        subtitle: "Autonomous Multi-Modal Breakdown",
        categoryTag: "DEEP DIVE",
        bullets: [
          "Architectural integration and performance validation",
          "Cross-referenced with Obsidian Second-Brain [[WikiLinks]]",
          "Includes autonomous AI Concept Art, Infographic, GIF & Video"
        ],
        speakerNotes: `Extended analysis for slide ${nextNum}.`,
        transitionPreset: config.defaultTransition,
        entrancePreset: config.defaultEntrance,
        preferredMediaKind: "ai_concept_image",
        citations: []
      }
    ]);
  };

  const removeOutlineSlide = (idx: number) => {
    if (outlines.length <= 2) return;
    setOutlines((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((item, i) => ({ ...item, slideNumber: i + 1 }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#070a14] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/25 to-purple-500/25 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Wand2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  MAHR × Presenton Autonomous Slide Architect
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  AI Images • Infographics • GIFs • 60FPS Video
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                2-Stage Interactive Outline Planner + 1-Click Autonomous Masterpiece Presentation Engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-zinc-950/90 border-b border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("configure")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                step === "configure"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              1. Multi-Source & Motion Setup
            </button>
            <ArrowRight size={13} className="text-zinc-600" />
            <button
              type="button"
              onClick={() => {
                if (outlines.length === 0) handleGenerateOutlineStep();
                else setStep("outline");
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                step === "outline"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              2. Interactive Outline & Media Blueprint ({outlines.length || config.slideCount} Slides)
            </button>
          </div>

          <span className="hidden sm:inline text-[11px] text-cyan-400">
            Obsidian Links Ready: {extractedContext.obsidianVaultLinks.length} Nodes
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {step === "configure" ? (
            <>
              {/* Topic & Audience Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">
                    Presentation Topic / Prompt
                  </label>
                  <input
                    type="text"
                    value={config.topicPrompt}
                    onChange={(e) => setConfig({ ...config, topicPrompt: e.target.value })}
                    placeholder="e.g., Quantum Neural Architectures & Real-Time Distributed AI..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">
                    Target Audience & Slide Count
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.audience}
                      onChange={(e) => setConfig({ ...config, audience: e.target.value })}
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-zinc-900/90 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <select
                      value={config.slideCount}
                      onChange={(e) =>
                        setConfig({ ...config, slideCount: Number(e.target.value) })
                      }
                      className="px-2.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/15 text-xs font-mono text-amber-300"
                    >
                      {[5, 6, 7, 8, 10, 12].map((n) => (
                        <option key={n} value={n}>
                          {n} Slides
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Multi-Source Context Grounding Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-zinc-400">
                  Presenton Multi-Source Knowledge Ingestion
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({ ...config, includeStudyPad: !config.includeStudyPad })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.includeStudyPad
                        ? "bg-amber-500/10 border-amber-500/40 text-white"
                        : "bg-zinc-900/50 border-white/10 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <BookOpen size={14} className="text-amber-400" />
                        Study Pad Notes
                      </span>
                      <CheckCircle2
                        size={14}
                        className={config.includeStudyPad ? "text-amber-400" : "text-zinc-600"}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Ingests active Study Pad notes & structured takeaways
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        includeObsidianVault: !config.includeObsidianVault
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.includeObsidianVault
                        ? "bg-purple-500/10 border-purple-500/40 text-white"
                        : "bg-zinc-900/50 border-white/10 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <Network size={14} className="text-purple-400" />
                        Obsidian Vault [[WikiLinks]]
                      </span>
                      <CheckCircle2
                        size={14}
                        className={
                          config.includeObsidianVault ? "text-purple-400" : "text-zinc-600"
                        }
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Cross-references Recall memories & Obsidian Markdown nodes
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        includeWebGrounding: !config.includeWebGrounding
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.includeWebGrounding
                        ? "bg-cyan-500/10 border-cyan-500/40 text-white"
                        : "bg-zinc-900/50 border-white/10 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <Globe size={14} className="text-cyan-400" />
                        Web Search Grounding
                      </span>
                      <CheckCircle2
                        size={14}
                        className={config.includeWebGrounding ? "text-cyan-400" : "text-zinc-600"}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Attaches verified citations & 99.4% fact-check telemetry
                    </p>
                  </button>
                </div>
              </div>

              {/* PowerPoint / Keynote Animation Choreography & Visual Theme */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                    <Film size={12} className="text-amber-400" />
                    Slide Transition Preset
                  </label>
                  <select
                    value={config.defaultTransition}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultTransition: e.target.value as SlideTransitionPreset
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white"
                  >
                    {Object.entries(SLIDE_TRANSITION_METADATA).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.name} ({meta.badge})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-500">
                    {SLIDE_TRANSITION_METADATA[config.defaultTransition].description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-cyan-400" />
                    Element Entrance Physics
                  </label>
                  <select
                    value={config.defaultEntrance}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultEntrance: e.target.value as ElementEntrancePreset
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white"
                  >
                    {Object.entries(ELEMENT_ENTRANCE_METADATA).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-500">
                    {ELEMENT_ENTRANCE_METADATA[config.defaultEntrance].description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                    <Layers size={12} className="text-purple-400" />
                    Presenton Design Theme
                  </label>
                  <select
                    value={config.themeId}
                    onChange={(e) => setConfig({ ...config, themeId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white"
                  >
                    {Object.values(SLIDE_THEMES).map((thm) => (
                      <option key={thm.id} value={thm.id}>
                        {thm.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-500">
                    Auto-calibrates SVG charts, GIF loops, and video palettes
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: Interactive Slide-by-Slide Outline Editor */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-300">
                  Customize slide titles, layouts, transitions, or primary media before compiling:
                </p>
                <button
                  type="button"
                  onClick={addOutlineSlide}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-xs font-mono text-amber-300 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Slide</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {outlines.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {item.slideNumber}
                      </span>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateOutlineItem(idx, { title: e.target.value })}
                          className="w-full bg-zinc-950/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                        />
                        <div className="text-[11px] text-zinc-400 truncate">
                          {item.bullets[0]}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        value={item.layout}
                        onChange={(e) =>
                          updateOutlineItem(idx, { layout: e.target.value as SlideLayout })
                        }
                        className="px-2 py-1 rounded-lg bg-zinc-950 border border-white/10 text-[11px] font-mono text-zinc-200"
                        title="Slide Layout"
                      >
                        {["title", "bullets", "stats", "columns", "timeline", "media", "summary", "quote"].map(
                          (ly) => (
                            <option key={ly} value={ly}>
                              Layout: {ly.toUpperCase()}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={item.preferredMediaKind}
                        onChange={(e) =>
                          updateOutlineItem(idx, {
                            preferredMediaKind: e.target.value as AutonomousMediaKind
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-zinc-950 border border-amber-500/30 text-[11px] font-mono text-amber-300"
                        title="Primary Autonomous Media"
                      >
                        <option value="ai_concept_image">Media: AI Image</option>
                        <option value="svg_infographic">Media: Infographic</option>
                        <option value="animated_gif_loop">Media: 60FPS GIF</option>
                        <option value="procedural_60fps_video">Media: 60FPS Video</option>
                      </select>

                      <select
                        value={item.transitionPreset}
                        onChange={(e) =>
                          updateOutlineItem(idx, {
                            transitionPreset: e.target.value as SlideTransitionPreset
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-zinc-950 border border-cyan-500/30 text-[11px] font-mono text-cyan-300"
                        title="Slide Transition"
                      >
                        {Object.entries(SLIDE_TRANSITION_METADATA).map(([k, m]) => (
                          <option key={k} value={k}>
                            {m.badge}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => removeOutlineSlide(idx)}
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 cursor-pointer"
                        title="Remove Slide"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-white/10 bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-zinc-400">
            MAHR autonomously generates Images, Infographics, GIF Loops & 60FPS Videos for every slide
          </div>

          <div className="flex items-center gap-2.5">
            {step === "configure" ? (
              <>
                <button
                  type="button"
                  onClick={handleGenerateOutlineStep}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <Layers size={14} className="text-cyan-400" />
                  <span>Review Interactive Outline</span>
                </button>

                <button
                  type="button"
                  onClick={handleOneClickMasterpiece}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>1-Click Autonomous Masterpiece</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep("configure")}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
                >
                  Back to Setup
                </button>

                <button
                  type="button"
                  onClick={handleCompileApprovedOutline}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Compile Full Multimedia Deck ({outlines.length} Slides)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
