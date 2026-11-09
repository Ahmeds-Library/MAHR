/**
 * LAYER 3: AssetQuickPromptOverlay ("Re-generate or Arrange" Quick-Prompt Overlay)
 * Allows instant AI prompt regeneration of a specific slide asset (Infographic, 60FPS GIF,
 * 60FPS Video, or Concept Art) and spatial layout arrangement on the slide canvas.
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Wand2,
  LayoutPanelLeft,
  LayoutGrid,
  Maximize2,
  PictureInPicture2,
  BarChart3,
  Sparkles,
  Video,
  Image as ImageIcon,
  Check
} from "lucide-react";
import { Slide } from "../../../services/slides/slideTypes";
import { AutonomousMediaKind } from "../../../slidesStudio/layer1_data/presentonTypes";
import {
  ARRANGEMENT_PRESET_METADATA,
  SlideAssetArrangement
} from "../../../slidesStudio/layer1_data/autonomousAssetTypes";
import { regenerateSlideAssetWithPrompt } from "../../../slidesStudio/layer2_logic/autonomousAssetEngine";

interface AssetQuickPromptOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  slide: Slide;
  themeId: string;
  onUpdateSlide: (patch: Partial<Slide>) => void;
}

const QUICK_PROMPT_SUGGESTIONS: Array<{ label: string; prompt: string; kind: AutonomousMediaKind }> = [
  {
    label: "Quantitative Telemetry Chart",
    prompt: "Multi-dimensional throughput, latency, and accuracy benchmark comparison",
    kind: "svg_infographic"
  },
  {
    label: "60FPS Orbital GIF Loop",
    prompt: "Continuous 60FPS orbital system topology with synchronized node pulses",
    kind: "animated_gif_loop"
  },
  {
    label: "60FPS Architecture Video",
    prompt: "End-to-end system execution pipeline explainer with voice narration",
    kind: "procedural_60fps_video"
  },
  {
    label: "Isometric Concept Blueprint",
    prompt: "High-precision isometric system blueprint with telemetry callouts",
    kind: "ai_concept_image"
  }
];

export const AssetQuickPromptOverlay: React.FC<AssetQuickPromptOverlayProps> = ({
  isOpen,
  onClose,
  slide,
  themeId,
  onUpdateSlide
}) => {
  const [prompt, setPrompt] = useState(slide.title || "");
  const [selectedKind, setSelectedKind] = useState<AutonomousMediaKind>(
    slide.presentonMedia?.activeTab || "ai_concept_image"
  );
  const [arrangement, setArrangement] = useState<SlideAssetArrangement>(
    slide.assetArrangement || "split_right"
  );

  useEffect(() => {
    if (isOpen) {
      setPrompt(
        slide.presentonMedia?.aiImage?.promptUsed ||
          `${slide.title} — ${slide.subtitle || "Architectural Visual"}`
      );
      setSelectedKind(slide.presentonMedia?.activeTab || "ai_concept_image");
      setArrangement(slide.assetArrangement || "split_right");
    }
  }, [isOpen, slide]);

  if (!isOpen) return null;

  const handleApplyArrangementOnly = (nextArrangement: SlideAssetArrangement) => {
    setArrangement(nextArrangement);
    onUpdateSlide({
      assetArrangement: nextArrangement,
      presentonMedia: slide.presentonMedia
        ? { ...slide.presentonMedia, activeTab: selectedKind }
        : undefined
    });
  };

  const handleRegenerateAndArrange = (e: React.FormEvent) => {
    e.preventDefault();
    const patch = regenerateSlideAssetWithPrompt(
      slide,
      prompt,
      selectedKind,
      arrangement,
      themeId
    );
    onUpdateSlide(patch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#090d18] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wand2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Re-generate or Arrange Slide Asset
              </h3>
              <p className="text-[11px] text-zinc-400">
                Slide #{slide.slideNumber} · {slide.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRegenerateAndArrange} className="p-5 space-y-4">
          {/* 1. Spatial Arrangement Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
              1. Spatial Slide Arrangement (Instant Reflow)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                Object.entries(ARRANGEMENT_PRESET_METADATA) as Array<
                  [SlideAssetArrangement, { label: string; shortBadge: string; description: string }]
                >
              ).map(([key, meta]) => {
                const isSelected = arrangement === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplyArrangementOnly(key)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold"
                        : "bg-zinc-900/70 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800/80"
                    }`}
                    title={meta.description}
                  >
                    {key === "split_right" && <LayoutPanelLeft size={15} className="mb-1 rotate-180" />}
                    {key === "split_left" && <LayoutPanelLeft size={15} className="mb-1" />}
                    {key === "hero_top" && <LayoutGrid size={15} className="mb-1" />}
                    {key === "pip_corner" && <PictureInPicture2 size={15} className="mb-1" />}
                    {key === "full_canvas" && <Maximize2 size={15} className="mb-1" />}
                    <span className="text-[10px] font-mono whitespace-nowrap">
                      {meta.shortBadge}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-400">
              {ARRANGEMENT_PRESET_METADATA[arrangement].description}
            </p>
          </div>

          {/* 2. Target Asset Modality */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
              2. Target Asset Modality
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "ai_concept_image", label: "Concept Art", icon: ImageIcon },
                { id: "svg_infographic", label: "Infographic", icon: BarChart3 },
                { id: "animated_gif_loop", label: "60FPS GIF", icon: Sparkles },
                { id: "procedural_60fps_video", label: "60FPS Video", icon: Video }
              ].map((item) => {
                const Icon = item.icon;
                const active = selectedKind === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedKind(item.id as AutonomousMediaKind)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold"
                        : "bg-zinc-900/70 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Quick-Prompt Regeneration Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
              3. Quick-Prompt Asset Synthesis Instruction
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how MAHR should re-generate this infographic, 60FPS GIF, video, or illustration..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
            />

            {/* 1-Click Quick Prompt Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_PROMPT_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPrompt(sug.prompt);
                    setSelectedKind(sug.kind);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  + {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Re-generate & Arrange Asset</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
