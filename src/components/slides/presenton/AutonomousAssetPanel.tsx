/**
 * LAYER 3: AutonomousAssetPanel
 * Dedicated drag-and-drop library inside the Presentation Studio Inspector.
 * Auto-populates AI Infographics, 60FPS GIFs, 60FPS Videos, and Concept Art,
 * plus a full Custom Asset Upload studio (Local File Drag-and-Drop, Clipboard Paste, URL Import).
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  GripVertical,
  Wand2,
  Plus,
  Search,
  ArrowUpRight,
  Upload,
  Link2,
  Trash2
} from "lucide-react";
import { Slide, SlideDeck } from "../../../services/slides/slideTypes";
import { AutonomousMediaKind } from "../../../slidesStudio/layer1_data/presentonTypes";
import {
  AutonomousAssetItem,
  PRESENTON_ASSET_DRAG_MIME,
  SlideAssetArrangement
} from "../../../slidesStudio/layer1_data/autonomousAssetTypes";
import {
  applyDroppedAssetToSlide,
  generateDeckAssetLibrary,
  synthesizeCustomAssetItem
} from "../../../slidesStudio/layer2_logic/autonomousAssetEngine";
import {
  ingestCustomMediaUrl,
  ingestUploadedFileList,
  loadCustomUploadedAssetsFromStorage,
  removeCustomUploadedAssetFromStorage
} from "../../../slidesStudio/layer2_logic/customAssetUploadService";

interface AutonomousAssetPanelProps {
  deck: SlideDeck;
  currentSlide: Slide;
  onUpdateSlide: (patch: Partial<Slide>) => void;
  onOpenQuickPromptOverlay: () => void;
}

export const AutonomousAssetPanel: React.FC<AutonomousAssetPanelProps> = ({
  deck,
  currentSlide,
  onUpdateSlide,
  onOpenQuickPromptOverlay
}) => {
  const [filterKind, setFilterKind] = useState<"all" | "uploads" | AutonomousMediaKind>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customKind, setCustomKind] = useState<AutonomousMediaKind>("svg_infographic");
  const [customAssets, setCustomAssets] = useState<AutonomousAssetItem[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<AutonomousAssetItem[]>(() =>
    loadCustomUploadedAssetsFromStorage()
  );
  const [urlImportInput, setUrlImportInput] = useState("");
  const [isDraggingFilesOver, setIsDraggingFilesOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const syncCustomUploads = () => {
      setUploadedAssets(loadCustomUploadedAssetsFromStorage());
    };
    window.addEventListener("mahr:custom-asset-uploaded", syncCustomUploads);
    return () => window.removeEventListener("mahr:custom-asset-uploaded", syncCustomUploads);
  }, []);

  const deckAssets = useMemo(() => generateDeckAssetLibrary(deck), [deck]);

  const allAssets = useMemo(() => {
    const combined = [...uploadedAssets, ...customAssets, ...deckAssets];
    return combined.filter((item) => {
      if (filterKind === "uploads" && !item.isCustomUpload) return false;
      if (filterKind !== "all" && filterKind !== "uploads" && item.kind !== filterKind) {
        return false;
      }
      if (
        searchQuery.trim() &&
        !`${item.title} ${item.subtitle}`.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [uploadedAssets, customAssets, deckAssets, filterKind, searchQuery]);

  const handleSynthesizeCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    const created = synthesizeCustomAssetItem(customPrompt, customKind, deck.themeId);
    setCustomAssets((prev) => [created, ...prev]);
    const patch = applyDroppedAssetToSlide(currentSlide, created, undefined, deck.themeId);
    onUpdateSlide(patch);
    setCustomPrompt("");
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const ingested = await ingestUploadedFileList(files);
    if (ingested.length === 0) return;
    setUploadedAssets((prev) => [...ingested, ...prev]);
    window.dispatchEvent(new CustomEvent("mahr:custom-asset-uploaded"));

    // Apply all newly uploaded assets to the active slide and trigger Smart Bento Auto-Layout
    let workingSlide: Slide = { ...currentSlide };
    let cumulativePatch: Partial<Slide> = {};
    for (const item of ingested) {
      const patch = applyDroppedAssetToSlide(workingSlide, item, undefined, deck.themeId);
      cumulativePatch = { ...cumulativePatch, ...patch };
      workingSlide = { ...workingSlide, ...patch };
    }
    onUpdateSlide(cumulativePatch);
  };

  const handleUrlImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlImportInput.trim()) return;
    const created = ingestCustomMediaUrl(urlImportInput.trim());
    if (!created) return;
    setUploadedAssets((prev) => [created, ...prev]);
    window.dispatchEvent(new CustomEvent("mahr:custom-asset-uploaded"));
    const patch = applyDroppedAssetToSlide(currentSlide, created, undefined, deck.themeId);
    onUpdateSlide(patch);
    setUrlImportInput("");
  };

  const handleDeleteUploadedAsset = (assetId: string) => {
    const remaining = removeCustomUploadedAssetFromStorage(assetId);
    setUploadedAssets(remaining);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, asset: AutonomousAssetItem) => {
    e.dataTransfer.setData(PRESENTON_ASSET_DRAG_MIME, JSON.stringify(asset));
    e.dataTransfer.effectAllowed = "copyMove";
  };

  const handleApplyAsset = (asset: AutonomousAssetItem, arrangement?: SlideAssetArrangement) => {
    const patch = applyDroppedAssetToSlide(currentSlide, asset, arrangement, deck.themeId);
    onUpdateSlide(patch);
  };

  const getBadgeLabel = (asset: AutonomousAssetItem) => {
    if (asset.isCustomUpload) {
      return `My ${asset.uploadedMediaType?.toUpperCase() || "Upload"}`;
    }
    switch (asset.kind) {
      case "svg_infographic":
        return "Infographic";
      case "animated_gif_loop":
        return "60FPS GIF";
      case "procedural_60fps_video":
        return "60FPS Video";
      default:
        return "Concept Art";
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 text-zinc-200">
      {/* 1. Custom User Media Upload Card (Drag-and-Drop, File Picker, URL Import) */}
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setIsDraggingFilesOver(true);
          }
        }}
        onDragLeave={() => setIsDraggingFilesOver(false)}
        onDrop={(e) => {
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            setIsDraggingFilesOver(false);
            handleFileUpload(e.dataTransfer.files);
          }
        }}
        className={`p-3 rounded-xl border transition-colors space-y-2.5 ${
          isDraggingFilesOver
            ? "bg-amber-500/15 border-amber-400"
            : "bg-zinc-900/90 border-white/10"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-white">Custom Asset Upload</div>
            <div className="text-[11px] text-zinc-400">
              Drop images, GIFs, SVGs, or videos — or paste (Ctrl+V)
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files);
                e.target.value = "";
              }
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Upload size={12} />
            <span>Upload Files</span>
          </button>
        </div>

        {/* Direct URL Media Import */}
        <form onSubmit={handleUrlImportSubmit} className="flex gap-1.5">
          <div className="relative flex-1 min-w-0">
            <Link2
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="url"
              value={urlImportInput}
              onChange={(e) => setUrlImportInput(e.target.value)}
              placeholder="Paste external image, GIF, or MP4 URL..."
              className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/15 text-xs font-semibold text-white cursor-pointer shrink-0 whitespace-nowrap"
          >
            Import URL
          </button>
        </form>
      </div>

      {/* 2. Quick AI Synthesize + Re-generate / Arrange Trigger */}
      <form
        onSubmit={handleSynthesizeCustom}
        className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2"
      >
        <div className="flex items-center justify-between text-[11px] text-zinc-400 gap-2">
          <span>AI Asset Generator</span>
          <div className="flex items-center gap-1.5">
            <select
              value={customKind}
              onChange={(e) => setCustomKind(e.target.value as AutonomousMediaKind)}
              className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-mono text-amber-300"
            >
              <option value="svg_infographic">Infographic</option>
              <option value="animated_gif_loop">60FPS GIF</option>
              <option value="procedural_60fps_video">60FPS Video</option>
              <option value="ai_concept_image">Concept Art</option>
            </select>
            <button
              type="button"
              onClick={onOpenQuickPromptOverlay}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-[10px] font-medium text-amber-300 cursor-pointer whitespace-nowrap"
            >
              <Wand2 size={10} />
              <span>Arrange</span>
            </button>
          </div>
        </div>

        <div className="flex gap-1.5">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Generate new chart, GIF, or 3D visual..."
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/15 text-xs font-semibold text-white cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus size={13} className="text-amber-400" />
            <span>Create</span>
          </button>
        </div>
      </form>

      {/* 3. Filter Tabs & Search */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 p-1 bg-zinc-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All" },
            { id: "uploads", label: `My Uploads (${uploadedAssets.length})` },
            { id: "svg_infographic", label: "Infographics" },
            { id: "animated_gif_loop", label: "60FPS GIFs" },
            { id: "procedural_60fps_video", label: "Videos" },
            { id: "ai_concept_image", label: "Art" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterKind(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterKind === tab.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter uploaded or AI assets..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900/70 border border-white/10 text-xs text-white focus:outline-none focus:border-white/25"
          />
        </div>
      </div>

      {/* 4. Draggable Asset Cards Grid */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {allAssets.length === 0 && (
          <div className="p-6 rounded-xl border border-dashed border-white/10 text-center space-y-2">
            <div className="text-xs font-medium text-zinc-300">No assets match this filter</div>
            <div className="text-[11px] text-zinc-500">
              Upload an image, GIF, SVG, or MP4 above to add your own media to the Bento grid.
            </div>
          </div>
        )}

        {allAssets.map((asset) => (
          <div
            key={asset.id}
            draggable
            onDragStart={(e) => handleDragStart(e, asset)}
            className="group relative p-2.5 rounded-xl bg-zinc-900/75 hover:bg-zinc-900 border border-white/10 hover:border-amber-500/40 transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-1 text-zinc-500 group-hover:text-amber-400 shrink-0">
                <GripVertical size={14} />
              </div>

              {/* Thumbnail Preview */}
              <div className="w-20 aspect-video rounded-lg overflow-hidden border border-white/10 bg-black shrink-0 relative">
                {asset.uploadedMediaType === "video" ? (
                  <video
                    src={asset.customMediaUrl || asset.previewDataUrl}
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={asset.customMediaUrl || asset.previewDataUrl}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{getBadgeLabel(asset)}</span>
                    {asset.sourceSlideNumber && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Slide #{asset.sourceSlideNumber}</span>
                      </>
                    )}
                  </div>
                  {asset.isCustomUpload && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUploadedAsset(asset.id);
                      }}
                      className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete uploaded asset"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <div className="text-xs font-semibold text-white truncate mt-0.5">
                  {asset.title}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {asset.subtitle}
                </div>
              </div>
            </div>

            {/* Quick Placement Bar */}
            <div className="flex items-center justify-between pt-1.5 border-t border-white/5 gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyAsset(asset, "split_left")}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white cursor-pointer whitespace-nowrap"
                  title="Place on Left Split"
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAsset(asset, "split_right")}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white cursor-pointer whitespace-nowrap"
                  title="Place on Right Split"
                >
                  Right
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAsset(asset, "hero_top")}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white cursor-pointer whitespace-nowrap"
                  title="Place as Top Hero Banner"
                >
                  Top Hero
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleApplyAsset(asset)}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-mono font-semibold text-amber-300 cursor-pointer whitespace-nowrap"
              >
                <span>Add to Bento</span>
                <ArrowUpRight size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
