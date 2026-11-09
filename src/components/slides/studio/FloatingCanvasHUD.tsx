/**
 * LAYER 3: FloatingCanvasHUD
 * Precision floating HUD bar above the 16:9 Slide Canvas for controlling the
 * Smart Bento Auto-Layout Engine, cycling Bento compositions, tuning Text/Media balance,
 * toggling 12-column live grid snap guides, and uploading custom user media.
 */

import React, { useRef, useState } from "react";
import {
  LayoutGrid,
  Sparkles,
  Upload,
  Grid,
  Link2,
  SlidersHorizontal,
  RefreshCw,
  Check
} from "lucide-react";
import { Slide } from "../../../services/slides/slideTypes";
import {
  BENTO_COMPOSITION_METADATA,
  BentoCompositionPreset,
  TextMediaBalancePreset
} from "../../../slidesStudio/layer1_data/autonomousAssetTypes";

interface FloatingCanvasHUDProps {
  slide: Slide;
  accentHex: string;
  showGridGuides: boolean;
  onToggleGridGuides: () => void;
  onToggleAutoLayout: () => void;
  onCycleBentoComposition: () => void;
  onSelectBentoComposition: (preset: BentoCompositionPreset) => void;
  onSelectTextMediaBalance: (balance: TextMediaBalancePreset) => void;
  onUploadFiles: (files: FileList) => void;
  onImportUrl: (url: string) => void;
}

export const FloatingCanvasHUD: React.FC<FloatingCanvasHUDProps> = ({
  slide,
  showGridGuides,
  onToggleGridGuides,
  onToggleAutoLayout,
  onCycleBentoComposition,
  onSelectBentoComposition,
  onSelectTextMediaBalance,
  onUploadFiles,
  onImportUrl
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showUrlPopover, setShowUrlPopover] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [pasteNotice, setPasteNotice] = useState(false);

  const isAutoEnabled = slide.autoLayout?.enabled !== false;
  const activeComposition: BentoCompositionPreset =
    slide.autoLayout?.bentoComposition || "single_spotlight";
  const activeBalance: TextMediaBalancePreset =
    slide.autoLayout?.textMediaBalance || "text_lead";
  const assetCount = Math.max(1, (slide.droppedAssets || []).length);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlValue.trim()) return;
    onImportUrl(urlValue.trim());
    setUrlValue("");
    setShowUrlPopover(false);
    setPasteNotice(true);
    setTimeout(() => setPasteNotice(false), 1800);
  };

  return (
    <div className="relative z-30 flex items-center justify-between w-full max-w-5xl mx-auto mb-2.5 px-3 py-1.5 rounded-xl bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-lg gap-2 flex-wrap">
      {/* Left Group: Smart Auto-Layout Engine Controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={onToggleAutoLayout}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
            isAutoEnabled
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
              : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200"
          }`}
          title="Automatically organize text and media into balanced Bento grid compositions when assets are added"
        >
          <Sparkles size={12} className={isAutoEnabled ? "text-amber-400" : "text-zinc-500"} />
          <span>Auto-Layout {isAutoEnabled ? "On" : "Off"}</span>
        </button>

        {/* Bento Composition Selector + 1-Click Re-balance */}
        <div className="flex items-center bg-zinc-900/90 rounded-lg border border-white/10 p-0.5">
          <button
            type="button"
            onClick={onCycleBentoComposition}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-800 text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Re-balance and cycle Bento grid arrangement"
          >
            <RefreshCw size={11} className="text-cyan-400" />
            <span>Re-balance</span>
          </button>

          <span className="h-3.5 w-[1px] bg-white/10 mx-0.5" />

          <div className="flex items-center gap-1 px-2 py-0.5">
            <LayoutGrid size={11} className="text-zinc-400 shrink-0" />
            <select
              value={activeComposition}
              onChange={(e) => onSelectBentoComposition(e.target.value as BentoCompositionPreset)}
              className="bg-transparent text-[11px] font-medium text-zinc-200 focus:outline-none cursor-pointer"
              aria-label="Select Bento Grid Composition"
            >
              {(Object.keys(BENTO_COMPOSITION_METADATA) as BentoCompositionPreset[]).map((key) => (
                <option key={key} value={key} className="bg-zinc-950 text-zinc-200">
                  {BENTO_COMPOSITION_METADATA[key].shortLabel} — {BENTO_COMPOSITION_METADATA[key].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text vs Media Split Ratio Control */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-900/90 rounded-lg border border-white/10 p-0.5">
          <SlidersHorizontal size={11} className="text-zinc-400 ml-2 mr-1 shrink-0" />
          {(
            [
              { id: "text_lead", label: "Text 60%" },
              { id: "balanced", label: "50 / 50" },
              { id: "media_dominant", label: "Media 60%" }
            ] as Array<{ id: TextMediaBalancePreset; label: string }>
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectTextMediaBalance(opt.id)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeBalance === opt.id
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Group: Grid Snap Guides + Custom Asset Uploader (File / Paste / URL) */}
      <div className="flex items-center gap-1.5">
        <span className="hidden lg:inline-block text-[11px] font-mono tabular-nums text-zinc-400 mr-1">
          {assetCount} {assetCount === 1 ? "Asset" : "Assets"} on Slide
        </span>

        <button
          type="button"
          onClick={onToggleGridGuides}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            showGridGuides
              ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
              : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200"
          }`}
          title="Toggle 12-Column Architectural Grid Snap Guides"
        >
          <Grid size={12} />
          <span className="hidden sm:inline">Grid Guides</span>
        </button>

        {/* Hidden Multi-File Input for Custom User Assets */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUploadFiles(e.target.files);
              e.target.value = "";
            }
          }}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Upload your own images, GIFs, SVGs, or videos directly onto the slide (or press Ctrl+V to paste)"
        >
          <Upload size={12} />
          <span>Upload Asset</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlPopover((prev) => !prev)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            showUrlPopover
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
              : "bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300"
          }`}
          title="Import custom image, GIF, or video from URL"
        >
          {pasteNotice ? <Check size={12} className="text-emerald-400" /> : <Link2 size={12} />}
          <span className="hidden sm:inline">URL</span>
        </button>
      </div>

      {/* Popover for Direct Media URL Import */}
      {showUrlPopover && (
        <form
          onSubmit={handleUrlSubmit}
          className="absolute right-2 top-full mt-1.5 z-50 w-80 p-2.5 rounded-xl bg-zinc-950 border border-white/15 shadow-2xl flex items-center gap-1.5"
        >
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="Paste image, GIF, or MP4 URL..."
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
};
