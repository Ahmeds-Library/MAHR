/**
 * LAYER 3: StudioCanvas (Spacious 16:9 Slide Canvas with Smart Bento Auto-Layout,
 * Custom File Drop & Paste, Live 12-Col Grid Snap Guides, and Direct Click-to-Edit)
 */

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Plus,
  LayoutTemplate,
  Quote,
  Upload
} from "lucide-react";
import { Slide, SlideDeck, SlideLayout, SlideTheme } from "../../../services/slides/slideTypes";
import { StudioInspectorTab } from "./inspector/StudioInspector";
import { StatsInfographic } from "./infographics/StatsInfographic";
import { ColumnsInfographic } from "./infographics/ColumnsInfographic";
import { TimelineInfographic } from "./infographics/TimelineInfographic";
import { SummaryInfographic } from "./infographics/SummaryInfographic";
import { CitationsBar } from "./infographics/CitationsBar";
import { VectorInfographicRenderer } from "../../../services/slides/infographics/svgRenderers";
import {
  AutonomousAssetItem,
  BentoCompositionPreset,
  PRESENTON_ASSET_DRAG_MIME,
  SlideAssetArrangement,
  TextMediaBalancePreset
} from "../../../slidesStudio/layer1_data/autonomousAssetTypes";
import { applyDroppedAssetToSlide } from "../../../slidesStudio/layer2_logic/autonomousAssetEngine";
import {
  computeOptimalSlideLayout,
  cycleBentoComposition,
  getAdaptiveTextScale,
  getAutoLayoutColumnSpans,
  promoteAssetInSlide,
  removeAssetFromSlide
} from "../../../slidesStudio/layer2_logic/autoLayoutEngine";
import {
  ingestCustomMediaUrl,
  ingestUploadedFileList
} from "../../../slidesStudio/layer2_logic/customAssetUploadService";
import { FloatingCanvasHUD } from "./FloatingCanvasHUD";
import { BentoMediaStage } from "../presenton/BentoMediaStage";

interface StudioCanvasProps {
  deck: SlideDeck;
  currentSlideIndex: number;
  currentSlide: Slide | undefined;
  theme: SlideTheme;
  totalSlides: number;
  onSelectSlide: (index: number) => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  activeInspectorTab: StudioInspectorTab;
  onOpenInspectorTab: (tab: StudioInspectorTab) => void;
  onUpdateSlide?: (patch: Partial<Slide>) => void;
  onOpenQuickPromptOverlay?: () => void;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  deck,
  currentSlideIndex,
  currentSlide,
  theme,
  totalSlides,
  onSelectSlide,
  isInspectorOpen,
  onToggleInspector,
  onOpenInspectorTab,
  onUpdateSlide,
  onOpenQuickPromptOverlay
}) => {
  const [isDraggingAssetOver, setIsDraggingAssetOver] = useState(false);
  const [isDraggingNativeFile, setIsDraggingNativeFile] = useState(false);
  const [hoveredDropZone, setHoveredDropZone] = useState<SlideAssetArrangement | null>(null);
  const [showGridGuides, setShowGridGuides] = useState(false);
  const [reflowToast, setReflowToast] = useState<string | null>(null);

  const canvasUploadRef = useRef<HTMLInputElement | null>(null);

  const triggerReflowNotice = (msg: string) => {
    setReflowToast(msg);
    window.setTimeout(() => {
      setReflowToast((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  // Global Clipboard Paste listener (Ctrl+V / Cmd+V) for pasting images or media URLs onto the slide
  useEffect(() => {
    if (!currentSlide || !onUpdateSlide) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const items = await ingestUploadedFileList(
          e.clipboardData.files,
          theme.accentCol || "#f59e0b"
        );
        if (items.length > 0) {
          window.dispatchEvent(new CustomEvent("mahr:custom-asset-uploaded"));
          let workingSlide: Slide = { ...currentSlide };
          let cumulativePatch: Partial<Slide> = {};
          for (const item of items) {
            const patch = applyDroppedAssetToSlide(workingSlide, item, undefined, deck.themeId);
            cumulativePatch = { ...cumulativePatch, ...patch };
            workingSlide = { ...workingSlide, ...patch };
          }
          onUpdateSlide(cumulativePatch);
          triggerReflowNotice(`Auto-Layout: Reflowed ${ (workingSlide.droppedAssets || []).length } assets into Bento Grid`);
        }
        return;
      }

      const textData = e.clipboardData?.getData("text/plain")?.trim();
      if (
        textData &&
        /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg|mp4|webm)(\?.*)?$/i.test(textData)
      ) {
        e.preventDefault();
        const urlAsset = ingestCustomMediaUrl(textData, undefined, theme.accentCol || "#f59e0b");
        if (urlAsset) {
          window.dispatchEvent(new CustomEvent("mahr:custom-asset-uploaded"));
          const patch = applyDroppedAssetToSlide(currentSlide, urlAsset, undefined, deck.themeId);
          onUpdateSlide(patch);
          triggerReflowNotice("Auto-Layout: Imported pasted media URL into Bento Grid");
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [currentSlide, deck.themeId, onUpdateSlide, theme.accentCol]);

  if (!currentSlide) return null;

  const activeArrangement: SlideAssetArrangement =
    currentSlide.assetArrangement || "split_right";

  const { textColClass, mediaColClass, ratioLabel } = getAutoLayoutColumnSpans(currentSlide);
  const textScale = getAdaptiveTextScale(currentSlide);

  const handleUploadFilesOntoSlide = async (
    files: FileList | File[],
    targetArrangement?: SlideAssetArrangement
  ) => {
    if (!onUpdateSlide) return;
    const ingested = await ingestUploadedFileList(files, theme.accentCol || "#f59e0b");
    if (ingested.length === 0) return;

    window.dispatchEvent(new CustomEvent("mahr:custom-asset-uploaded"));

    let workingSlide: Slide = { ...currentSlide };
    let cumulativePatch: Partial<Slide> = {};
    for (const item of ingested) {
      const patch = applyDroppedAssetToSlide(
        workingSlide,
        item,
        targetArrangement,
        deck.themeId
      );
      cumulativePatch = { ...cumulativePatch, ...patch };
      workingSlide = { ...workingSlide, ...patch };
    }
    onUpdateSlide(cumulativePatch);
    triggerReflowNotice(
      `Auto-Layout: Balanced ${(workingSlide.droppedAssets || []).length} assets in Bento Grid`
    );
  };

  const handleImportMediaUrl = (url: string) => {
    if (!onUpdateSlide) return;
    const created = ingestCustomMediaUrl(url, undefined, theme.accentCol || "#f59e0b");
    if (!created) return;
    window.dispatchEvent(new CustomEvent("mahr:custom-asset-uploaded"));
    const patch = applyDroppedAssetToSlide(currentSlide, created, undefined, deck.themeId);
    onUpdateSlide(patch);
    triggerReflowNotice("Auto-Layout: Added URL media and re-balanced grid");
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const hasInternalAsset = e.dataTransfer.types.includes(PRESENTON_ASSET_DRAG_MIME);
    const hasNativeFiles = e.dataTransfer.types.includes("Files");
    if (hasInternalAsset || hasNativeFiles) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (!isDraggingAssetOver) setIsDraggingAssetOver(true);
      if (hasNativeFiles && !isDraggingNativeFile) setIsDraggingNativeFile(true);
    }
  };

  const handleCanvasDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingAssetOver(false);
      setIsDraggingNativeFile(false);
      setHoveredDropZone(null);
    }
  };

  const handleDropOnZone = async (
    e: React.DragEvent<HTMLDivElement>,
    zoneArrangement: SlideAssetArrangement
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAssetOver(false);
    setIsDraggingNativeFile(false);
    setHoveredDropZone(null);

    if (!onUpdateSlide) return;

    // 1. Check if the user dropped native OS files (images, GIFs, SVGs, videos) directly from their computer
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFilesOntoSlide(e.dataTransfer.files, zoneArrangement);
      return;
    }

    // 2. Otherwise check internal AutonomousAssetPanel drag payload
    const raw = e.dataTransfer.getData(PRESENTON_ASSET_DRAG_MIME);
    if (!raw) return;

    try {
      const parsedAsset = JSON.parse(raw) as AutonomousAssetItem;
      const patch = applyDroppedAssetToSlide(
        currentSlide,
        parsedAsset,
        zoneArrangement,
        deck.themeId
      );
      onUpdateSlide(patch);
      triggerReflowNotice(
        `Auto-Layout: Organized ${(patch.droppedAssets || []).length} item(s) into Bento Grid`
      );
    } catch {
      // Ignore malformed drag payload
    }
  };

  const handleBulletChange = (idx: number, nextValue: string) => {
    if (!onUpdateSlide) return;
    const nextBullets = [...(currentSlide.bullets || [])];
    nextBullets[idx] = nextValue;
    onUpdateSlide({ bullets: nextBullets });
  };

  const handleAddInlineBullet = () => {
    if (!onUpdateSlide) return;
    const nextBullets = [...(currentSlide.bullets || []), "New key insight — click to edit"];
    const nextAutoLayout = computeOptimalSlideLayout(
      { ...currentSlide, bullets: nextBullets },
      currentSlide.droppedAssets || []
    );
    onUpdateSlide({
      bullets: nextBullets,
      autoLayout: nextAutoLayout
    });
  };

  const handleToggleAutoLayout = () => {
    if (!onUpdateSlide) return;
    const nextEnabled = currentSlide.autoLayout?.enabled === false ? true : false;
    if (nextEnabled) {
      const recomputed = computeOptimalSlideLayout(
        {
          ...currentSlide,
          autoLayout: {
            ...(currentSlide.autoLayout || {
              bentoComposition: "single_spotlight",
              textMediaBalance: "text_lead"
            }),
            enabled: true
          }
        },
        currentSlide.droppedAssets || []
      );
      onUpdateSlide({ autoLayout: recomputed });
      triggerReflowNotice("Auto-Layout Engine Enabled · Grid Re-balanced");
    } else {
      onUpdateSlide({
        autoLayout: {
          enabled: false,
          bentoComposition: currentSlide.autoLayout?.bentoComposition || "single_spotlight",
          textMediaBalance: currentSlide.autoLayout?.textMediaBalance || "text_lead"
        }
      });
    }
  };

  const handleCycleBentoComposition = () => {
    if (!onUpdateSlide) return;
    const patch = cycleBentoComposition(currentSlide);
    onUpdateSlide(patch);
    triggerReflowNotice("Bento Grid Composition Re-balanced");
  };

  const handleSelectBentoComposition = (preset: BentoCompositionPreset) => {
    if (!onUpdateSlide) return;
    onUpdateSlide({
      autoLayout: {
        enabled: currentSlide.autoLayout?.enabled ?? true,
        bentoComposition: preset,
        textMediaBalance: currentSlide.autoLayout?.textMediaBalance || "balanced",
        lastReflowTimestamp: Date.now()
      }
    });
  };

  const handleSelectTextMediaBalance = (balance: TextMediaBalancePreset) => {
    if (!onUpdateSlide) return;
    onUpdateSlide({
      autoLayout: {
        enabled: currentSlide.autoLayout?.enabled ?? true,
        bentoComposition: currentSlide.autoLayout?.bentoComposition || "single_spotlight",
        textMediaBalance: balance,
        lastReflowTimestamp: Date.now()
      }
    });
  };

  const handlePromoteAsset = (assetId: string) => {
    if (!onUpdateSlide) return;
    const patch = promoteAssetInSlide(currentSlide, assetId);
    onUpdateSlide(patch);
    triggerReflowNotice("Promoted asset to Primary Bento Hero");
  };

  const handleRemoveAsset = (assetId: string) => {
    if (!onUpdateSlide) return;
    const patch = removeAssetFromSlide(currentSlide, assetId);
    onUpdateSlide(patch);
    triggerReflowNotice("Removed asset · Auto-reflowed remaining items");
  };

  const renderSlideTextContent = () => (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="space-y-3 min-w-0"
    >
      {/* Direct Click-to-Edit Slide Title */}
      <input
        type="text"
        value={currentSlide.title || ""}
        onChange={(e) => onUpdateSlide?.({ title: e.target.value })}
        placeholder="Click to enter slide title..."
        className={`w-full bg-transparent ${textScale.titleClass} font-extrabold tracking-tight leading-tight focus:outline-none focus:ring-1 focus:ring-amber-400/50 rounded-lg px-1 -mx-1 transition-all`}
        style={{
          fontFamily: theme.fontHeading,
          color: theme.textPrimary || "#ffffff"
        }}
      />

      {/* Direct Click-to-Edit Slide Subtitle */}
      <input
        type="text"
        value={currentSlide.subtitle || ""}
        onChange={(e) => onUpdateSlide?.({ subtitle: e.target.value })}
        placeholder="Click to add a subtitle..."
        className={`w-full bg-transparent ${textScale.subtitleClass} leading-relaxed opacity-85 focus:outline-none focus:ring-1 focus:ring-amber-400/40 rounded-lg px-1 -mx-1 transition-all`}
        style={{
          fontFamily: theme.fontBody,
          color: theme.textSecondary || "#94a3b8"
        }}
      />

      {currentSlide.vectorGraphic && (
        <VectorInfographicRenderer graphic={currentSlide.vectorGraphic} theme={theme} />
      )}

      {currentSlide.layout === "stats" && currentSlide.stats && (
        <StatsInfographic stats={currentSlide.stats} theme={theme} />
      )}

      {currentSlide.layout === "columns" && currentSlide.bullets && (
        <ColumnsInfographic bullets={currentSlide.bullets} theme={theme} />
      )}

      {currentSlide.layout === "timeline" && currentSlide.bullets && (
        <TimelineInfographic bullets={currentSlide.bullets} theme={theme} />
      )}

      {currentSlide.layout === "summary" && currentSlide.bullets && (
        <SummaryInfographic
          bullets={currentSlide.bullets}
          callout={currentSlide.callout}
          theme={theme}
        />
      )}

      {/* Direct Click-to-Edit Bullets for standard layouts */}
      {(currentSlide.layout === "bullets" ||
        currentSlide.layout === "title" ||
        currentSlide.layout === "media") && (
        <div
          className={`pt-1 ${
            activeArrangement === "hero_top"
              ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
              : "space-y-2"
          }`}
        >
          {(currentSlide.bullets || []).map((bullet, idx) => {
            const textVal =
              typeof bullet === "string"
                ? bullet
                : (bullet as any)?.text || (bullet as any)?.point || String(bullet || "");
            return (
              <motion.div
                key={idx}
                layout
                className={`flex items-start gap-2.5 ${textScale.bulletPaddingClass} rounded-xl border transition-colors hover:border-white/20`}
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderCol
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: theme.accentCol || "#f59e0b" }}
                />
                <input
                  type="text"
                  value={textVal}
                  onChange={(e) => handleBulletChange(idx, e.target.value)}
                  className={`w-full bg-transparent ${textScale.bulletTextClass} leading-relaxed focus:outline-none`}
                  style={{ color: theme.textPrimary || "#ffffff" }}
                />
              </motion.div>
            );
          })}

          <button
            type="button"
            onClick={handleAddInlineBullet}
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={12} />
            <span>Add point</span>
          </button>
        </div>
      )}

      {currentSlide.layout === "quote" && (
        <div className="relative p-4 my-2 rounded-xl border border-white/10 bg-white/5">
          <Quote size={18} className="text-amber-400 mb-1.5 opacity-60" />
          <input
            type="text"
            value={currentSlide.quote || currentSlide.title}
            onChange={(e) => onUpdateSlide?.({ quote: e.target.value })}
            className="w-full bg-transparent text-sm sm:text-lg font-medium italic text-zinc-200 focus:outline-none"
          />
        </div>
      )}
    </motion.div>
  );

  const renderBentoStage = () => (
    <BentoMediaStage
      slide={currentSlide}
      theme={theme}
      onUpdateSlide={onUpdateSlide}
      onPromoteAsset={handlePromoteAsset}
      onRemoveAsset={handleRemoveAsset}
      onOpenQuickPromptOverlay={onOpenQuickPromptOverlay}
      onTriggerUploadFilePicker={() => canvasUploadRef.current?.click()}
    />
  );

  const showSnapOverlay = showGridGuides || isDraggingAssetOver;

  return (
    <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto min-h-0">
      {/* Hidden File Input for Bento Stage "+ Add Custom Media" button */}
      <input
        ref={canvasUploadRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadFilesOntoSlide(e.target.files);
            e.target.value = "";
          }
        }}
        className="hidden"
      />

      {/* 1. Floating Precision Canvas HUD */}
      <FloatingCanvasHUD
        slide={currentSlide}
        accentHex={theme.accentCol || "#f59e0b"}
        showGridGuides={showGridGuides}
        onToggleGridGuides={() => setShowGridGuides((prev) => !prev)}
        onToggleAutoLayout={handleToggleAutoLayout}
        onCycleBentoComposition={handleCycleBentoComposition}
        onSelectBentoComposition={handleSelectBentoComposition}
        onSelectTextMediaBalance={handleSelectTextMediaBalance}
        onUploadFiles={(files) => handleUploadFilesOntoSlide(files)}
        onImportUrl={handleImportMediaUrl}
      />

      {/* 2. Spacious 16:9 Slide Canvas with Live Grid Snap Guides & Auto-Layout Reflow */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={(e) => handleDropOnZone(e, activeArrangement)}
          className="relative w-full max-w-5xl aspect-video rounded-2xl shadow-2xl border overflow-hidden flex flex-col justify-between p-6 sm:p-10 transition-all duration-200"
          style={{
            background: theme.slideBg || "#0d111c",
            borderColor: isDraggingAssetOver
              ? "#f59e0b"
              : theme.borderCol || "rgba(255,255,255,0.12)",
            boxShadow: `0 20px 50px -10px ${theme.accentGlow || "rgba(245,158,11,0.12)"}`
          }}
        >
          {/* Live 12-Column Architectural Snap Guides Overlay */}
          {showSnapOverlay && (
            <div className="absolute inset-0 z-10 pointer-events-none px-6 sm:px-10 py-6 grid grid-cols-12 gap-4">
              {Array.from({ length: 12 }).map((_, colIdx) => (
                <div
                  key={colIdx}
                  className="h-full border-x border-dashed border-cyan-400/15 bg-cyan-500/[0.02] flex items-start justify-center pt-1"
                >
                  <span className="text-[9px] font-mono tabular-nums text-cyan-300/40">
                    {colIdx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Subtle Auto-Layout Reflow Feedback Pill */}
          {reflowToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-zinc-950/90 border border-amber-500/40 text-amber-300 text-[11px] font-mono shadow-xl pointer-events-none">
              {reflowToast}
            </div>
          )}

          {/* Directional Drag-and-Drop Overlay Zones (supports both Asset Panel items & Native OS Files) */}
          {isDraggingAssetOver && (
            <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm p-4 grid grid-cols-2 grid-rows-2 gap-3 animate-in fade-in duration-150">
              {(
                [
                  {
                    id: "split_left",
                    title: isDraggingNativeFile ? "Upload & Reflow Left" : "Place on Left Bento",
                    sub: "Bento Media Left · Text Right"
                  },
                  {
                    id: "split_right",
                    title: isDraggingNativeFile ? "Upload & Reflow Right" : "Place on Right Bento",
                    sub: "Text Left · Bento Media Right"
                  },
                  {
                    id: "hero_top",
                    title: isDraggingNativeFile ? "Upload to Top Hero" : "Place as Top Hero",
                    sub: "Panoramic Media Top · 2-Col Points Below"
                  },
                  {
                    id: "full_canvas",
                    title: isDraggingNativeFile ? "Upload Full Stage" : "Full Slide Bento Showcase",
                    sub: "Expanded Bento Matrix + Executive Caption"
                  }
                ] as Array<{ id: SlideAssetArrangement; title: string; sub: string }>
              ).map((zone) => {
                const isHovered = hoveredDropZone === zone.id;
                return (
                  <div
                    key={zone.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHoveredDropZone(zone.id);
                    }}
                    onDrop={(e) => handleDropOnZone(e, zone.id)}
                    className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all ${
                      isHovered
                        ? "border-amber-400 bg-amber-500/20 text-white"
                        : "border-white/25 bg-zinc-900/60 text-zinc-300"
                    }`}
                  >
                    {isDraggingNativeFile ? (
                      <Upload size={18} className="text-amber-400 mb-1" />
                    ) : (
                      <Sparkles size={18} className="text-amber-400 mb-1" />
                    )}
                    <div className="text-xs font-bold">{zone.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{zone.sub}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top Slide Metadata Line (Clean unboxed typography) */}
          <div className="flex items-center justify-between z-10 shrink-0 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span
                style={{ color: theme.accentCol || "#f59e0b" }}
                className="font-semibold tracking-wide text-[11px]"
              >
                {currentSlide.categoryTag || "Slide"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                {ratioLabel}
              </span>
            </div>
            <span className="font-mono tabular-nums text-[11px] text-zinc-500">
              {currentSlideIndex + 1} / {totalSlides}
            </span>
          </div>

          {/* Slide Body arranged by Smart Bento Auto-Layout Engine */}
          <div className="my-auto z-10 py-2 overflow-y-auto no-scrollbar">
            {activeArrangement === "split_left" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className={mediaColClass}>{renderBentoStage()}</div>
                <div className={textColClass}>{renderSlideTextContent()}</div>
              </div>
            )}

            {activeArrangement === "split_right" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className={textColClass}>{renderSlideTextContent()}</div>
                <div className={mediaColClass}>{renderBentoStage()}</div>
              </div>
            )}

            {activeArrangement === "hero_top" && (
              <div className="space-y-4">
                <div className="max-w-2xl mx-auto">{renderBentoStage()}</div>
                {renderSlideTextContent()}
              </div>
            )}

            {activeArrangement === "pip_corner" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-8">{renderSlideTextContent()}</div>
                <div className="md:col-span-4">{renderBentoStage()}</div>
              </div>
            )}

            {activeArrangement === "full_canvas" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-8">{renderBentoStage()}</div>
                <div className="md:col-span-4 bg-black/40 p-4 rounded-xl border border-white/10">
                  <h2 className="text-base font-bold text-white mb-1">{currentSlide.title}</h2>
                  <p className="text-xs text-zinc-300">
                    {currentSlide.subtitle || (currentSlide.bullets || [])[0]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Subtle Bottom Citations */}
          <div className="z-10 shrink-0">
            <CitationsBar citations={currentSlide.citations} theme={theme} />
          </div>
        </div>
      </div>

      {/* 3. Clean, Minimal Bottom Slide Bar */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto pt-2.5 px-1 gap-2">
        {/* Slide Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectSlide(currentSlideIndex - 1)}
            disabled={currentSlideIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>

          <span className="px-3 py-1 text-xs font-mono tabular-nums text-zinc-400">
            Slide {currentSlideIndex + 1} of {totalSlides}
          </span>

          <button
            type="button"
            onClick={() => onSelectSlide(currentSlideIndex + 1)}
            disabled={currentSlideIndex === totalSlides - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Simple Quick Layout & Assets Drawer Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-white/10 text-xs text-zinc-300">
            <LayoutTemplate size={13} className="text-zinc-400" />
            <select
              value={currentSlide.layout}
              onChange={(e) => onUpdateSlide?.({ layout: e.target.value as SlideLayout })}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="bullets" className="bg-zinc-900">Layout: Key Points</option>
              <option value="stats" className="bg-zinc-900">Layout: Metrics</option>
              <option value="columns" className="bg-zinc-900">Layout: 3 Columns</option>
              <option value="timeline" className="bg-zinc-900">Layout: Timeline</option>
              <option value="summary" className="bg-zinc-900">Layout: Summary</option>
              <option value="title" className="bg-zinc-900">Layout: Title Cover</option>
              <option value="quote" className="bg-zinc-900">Layout: Quote</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isInspectorOpen) {
                onOpenInspectorTab("assets");
              } else {
                onToggleInspector();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isInspectorOpen
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white"
            }`}
          >
            <Layers size={13} className="text-amber-400" />
            <span>{isInspectorOpen ? "Close Drawer" : "Assets & Uploads"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
