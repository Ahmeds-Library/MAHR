/**
 * LAYER 3: BentoMediaStage
 * Renders 1, 2, 3, or 4+ media items inside the Slide Canvas using Smart Bento &
 * Asymmetric Grid compositions with smooth spring-physics layout transitions,
 * custom uploaded image/video/GIF playback, and per-cell Promote / Remove controls.
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  Trash2,
  Wand2,
  Plus,
  Film,
  Image as ImageIcon,
  BarChart3,
  Sparkles
} from "lucide-react";
import { Slide, SlideTheme } from "../../../services/slides/slideTypes";
import {
  AutonomousAssetItem,
  BentoCompositionPreset
} from "../../../slidesStudio/layer1_data/autonomousAssetTypes";
import { SlideMultimediaPlayer } from "./SlideMultimediaPlayer";

interface BentoMediaStageProps {
  slide: Slide;
  theme: SlideTheme;
  onUpdateSlide?: (patch: Partial<Slide>) => void;
  onPromoteAsset: (assetId: string) => void;
  onRemoveAsset: (assetId: string) => void;
  onOpenQuickPromptOverlay?: () => void;
  onTriggerUploadFilePicker?: () => void;
}

export const BentoMediaStage: React.FC<BentoMediaStageProps> = ({
  slide,
  theme,
  onUpdateSlide,
  onPromoteAsset,
  onRemoveAsset,
  onOpenQuickPromptOverlay,
  onTriggerUploadFilePicker
}) => {
  const droppedAssets = slide.droppedAssets || [];
  const activeComposition: BentoCompositionPreset =
    slide.autoLayout?.bentoComposition ||
    (droppedAssets.length <= 1
      ? "single_spotlight"
      : droppedAssets.length === 2
      ? "dual_vertical"
      : droppedAssets.length === 3
      ? "triple_hero_left"
      : "quad_bento_matrix");

  const getModalityIcon = (asset: AutonomousAssetItem) => {
    if (asset.uploadedMediaType === "video" || asset.kind === "procedural_60fps_video") {
      return <Film size={11} className="text-emerald-400 shrink-0" />;
    }
    if (asset.kind === "svg_infographic") {
      return <BarChart3 size={11} className="text-sky-400 shrink-0" />;
    }
    if (asset.uploadedMediaType === "gif" || asset.kind === "animated_gif_loop") {
      return <Sparkles size={11} className="text-purple-400 shrink-0" />;
    }
    return <ImageIcon size={11} className="text-amber-400 shrink-0" />;
  };

  /**
   * Renders an individual Bento Grid Cell for either a custom uploaded media item
   * or an AI-generated asset item.
   */
  const renderBentoCell = (
    asset: AutonomousAssetItem,
    index: number,
    isHeroCell: boolean,
    extraClass: string = ""
  ) => {
    const mediaSrc = asset.customMediaUrl || asset.previewDataUrl;
    const isVideoFile =
      asset.uploadedMediaType === "video" ||
      (asset.isCustomUpload && /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaSrc));

    // If this is the single spotlight cell and it's not a custom raw file upload,
    // render the full interactive 4-in-1 SlideMultimediaPlayer
    if (droppedAssets.length <= 1 && !asset.isCustomUpload && activeComposition === "single_spotlight") {
      return (
        <motion.div
          key={asset.id}
          layout
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className={`relative group/cell w-full ${extraClass}`}
        >
          <SlideMultimediaPlayer
            slide={slide}
            theme={theme}
            onChangeMediaTab={(nextTab) => {
              if (onUpdateSlide && slide.presentonMedia) {
                onUpdateSlide({
                  presentonMedia: {
                    ...slide.presentonMedia,
                    activeTab: nextTab
                  }
                });
              }
            }}
          />
        </motion.div>
      );
    }

    return (
      <motion.div
        key={asset.id}
        layout
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={`group/cell relative rounded-xl overflow-hidden border bg-zinc-950/90 flex flex-col justify-between transition-colors ${extraClass}`}
        style={{
          borderColor: index === 0 ? theme.accentCol || "#f59e0b" : "rgba(255,255,255,0.12)"
        }}
      >
        {/* Media Visual Surface */}
        <div className="relative w-full h-full min-h-[110px] flex-1 bg-black/70 overflow-hidden flex items-center justify-center">
          {isVideoFile ? (
            <video
              src={mediaSrc}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={mediaSrc}
              alt={asset.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover/cell:scale-[1.03]"
            />
          )}

          {/* Measured Gradient Scrim for Legible Caption */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

          {/* Hover Action Bar (Make Primary Hero / Remove from Bento Grid) */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-150">
            {index > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPromoteAsset(asset.id);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/80 hover:bg-amber-500 text-zinc-200 hover:text-black text-[10px] font-semibold border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
                title="Promote to Primary Hero Cell"
              >
                <Star size={10} />
                <span>Primary</span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveAsset(asset.id);
              }}
              className="p-1 rounded-md bg-black/80 hover:bg-rose-500/90 text-zinc-300 hover:text-white border border-white/15 transition-colors cursor-pointer"
              title="Remove asset and auto-reflow slide"
            >
              <Trash2 size={11} />
            </button>
          </div>

          {/* Bottom Caption Overlay */}
          <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-mono">
                {getModalityIcon(asset)}
                <span className="truncate">{asset.isCustomUpload ? "Custom Upload" : asset.subtitle}</span>
              </div>
              <div
                className={`font-semibold text-white truncate ${
                  isHeroCell ? "text-xs sm:text-sm" : "text-[11px]"
                }`}
              >
                {asset.title}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Fallback when no droppedAssets have been explicitly added yet: show the interactive SlideMultimediaPlayer
  if (droppedAssets.length === 0) {
    return (
      <div className="relative group/media flex flex-col gap-1.5 min-w-0">
        <SlideMultimediaPlayer
          slide={slide}
          theme={theme}
          onChangeMediaTab={(nextTab) => {
            if (onUpdateSlide && slide.presentonMedia) {
              onUpdateSlide({
                presentonMedia: {
                  ...slide.presentonMedia,
                  activeTab: nextTab
                }
              });
            }
          }}
        />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {onTriggerUploadFilePicker && (
            <button
              type="button"
              onClick={onTriggerUploadFilePicker}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus size={11} className="text-cyan-400" />
              <span>Add Custom Media to Grid</span>
            </button>
          )}
          {onOpenQuickPromptOverlay && (
            <button
              type="button"
              onClick={onOpenQuickPromptOverlay}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-amber-300 text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap ml-auto"
            >
              <Wand2 size={11} className="text-amber-400" />
              <span>Customize or Arrange Media</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const visibleAssets = droppedAssets.slice(0, 4);

  return (
    <div className="relative flex flex-col gap-2 min-w-0">
      <AnimatePresence mode="popLayout">
        {/* 1. Single Spotlight Composition */}
        {(activeComposition === "single_spotlight" || visibleAssets.length === 1) &&
          visibleAssets.length === 1 && (
            <div className="w-full">
              {renderBentoCell(visibleAssets[0], 0, true, "aspect-video")}
            </div>
          )}

        {/* 2. Dual Vertical Stacked Bento */}
        {visibleAssets.length === 2 && activeComposition !== "dual_side_by_side" && (
          <div className="grid grid-cols-1 gap-2.5">
            {renderBentoCell(visibleAssets[0], 0, true, "aspect-[16/8]")}
            {renderBentoCell(visibleAssets[1], 1, false, "aspect-[16/7]")}
          </div>
        )}

        {/* 3. Dual Side-by-Side Bento */}
        {visibleAssets.length === 2 && activeComposition === "dual_side_by_side" && (
          <div className="grid grid-cols-2 gap-2.5">
            {renderBentoCell(visibleAssets[0], 0, true, "aspect-[4/3]")}
            {renderBentoCell(visibleAssets[1], 1, false, "aspect-[4/3]")}
          </div>
        )}

        {/* 4. Asymmetric Triple Bento (Hero Left + 2 Stacked Right) */}
        {visibleAssets.length === 3 && activeComposition !== "triple_hero_top" && (
          <div className="grid grid-cols-12 gap-2.5 items-stretch">
            <div className="col-span-7 flex">
              {renderBentoCell(visibleAssets[0], 0, true, "w-full h-full min-h-[210px]")}
            </div>
            <div className="col-span-5 flex flex-col gap-2.5">
              {renderBentoCell(visibleAssets[1], 1, false, "flex-1 min-h-[100px]")}
              {renderBentoCell(visibleAssets[2], 2, false, "flex-1 min-h-[100px]")}
            </div>
          </div>
        )}

        {/* 5. Asymmetric Triple Bento (Hero Top + 2 Split Bottom) */}
        {visibleAssets.length === 3 && activeComposition === "triple_hero_top" && (
          <div className="flex flex-col gap-2.5">
            {renderBentoCell(visibleAssets[0], 0, true, "aspect-[21/9]")}
            <div className="grid grid-cols-2 gap-2.5">
              {renderBentoCell(visibleAssets[1], 1, false, "aspect-video")}
              {renderBentoCell(visibleAssets[2], 2, false, "aspect-video")}
            </div>
          </div>
        )}

        {/* 6. Quad 2x2 Bento Matrix (4+ Assets) */}
        {visibleAssets.length >= 4 && (
          <div className="grid grid-cols-2 gap-2.5">
            {visibleAssets.map((item, idx) =>
              renderBentoCell(item, idx, idx === 0, "aspect-video")
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Bento Action Strip */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {onTriggerUploadFilePicker && (
          <button
            type="button"
            onClick={onTriggerUploadFilePicker}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={11} className="text-cyan-400" />
            <span>Add Asset to Bento ({droppedAssets.length}/4)</span>
          </button>
        )}

        {onOpenQuickPromptOverlay && (
          <button
            type="button"
            onClick={onOpenQuickPromptOverlay}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-amber-300 text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap ml-auto"
          >
            <Wand2 size={11} className="text-amber-400" />
            <span>Customize or Arrange</span>
          </button>
        )}
      </div>
    </div>
  );
};
