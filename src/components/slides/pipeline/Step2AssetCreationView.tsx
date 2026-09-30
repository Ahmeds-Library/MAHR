import React, { useState } from "react";
import { Film, Play, Code2, RefreshCw, BarChart3, Youtube, CheckCircle2, AlertCircle } from "lucide-react";
import { ManimSceneAsset, ChartAsset, YouTubeAsset } from "../../../services/slides/pipeline/pipelineTypes";
import { PRESET_MANIM_SNIPPETS } from "../../../services/slides/pipeline/manimRenderEngine";

interface Step2AssetCreationViewProps {
  manimAssets: ManimSceneAsset[];
  chartAssets: ChartAsset[];
  youtubeAssets: YouTubeAsset[];
  onReRenderManim?: (asset: ManimSceneAsset) => void;
}

export const Step2AssetCreationView: React.FC<Step2AssetCreationViewProps> = ({
  manimAssets,
  chartAssets,
  youtubeAssets
}) => {
  const [activeTab, setActiveTab] = useState<"manim" | "chart" | "youtube">("manim");
  const [editableCode, setEditableCode] = useState(
    manimAssets[0]?.pythonCode || PRESET_MANIM_SNIPPETS.calculus_limit.code
  );

  const activeManim = manimAssets[0];
  const activeChart = chartAssets[0];
  const activeYoutube = youtubeAssets[0];

  return (
    <div className="space-y-4">
      {/* Sub-tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("manim")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "manim"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          Manim Python Video Engine
        </button>

        <button
          onClick={() => setActiveTab("chart")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "chart"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          FMC Chart & Infographics
        </button>

        <button
          onClick={() => setActiveTab("youtube")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "youtube"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Youtube className="w-3.5 h-3.5" />
          YouTube Media Finder
        </button>
      </div>

      {/* Tab 1: Manim Engine */}
      {activeTab === "manim" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Python Code Panel */}
          <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-mono text-slate-300">
                  {activeManim?.conceptName || "Scene"}.py
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Python 3.11 AST Ready
              </span>
            </div>

            <textarea
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              className="w-full h-64 p-3 bg-slate-950/70 text-cyan-300 font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              spellCheck={false}
            />

            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Target Resolution: 1080p60 Cairo/OpenGL</span>
              <button
                onClick={() => setEditableCode(PRESET_MANIM_SNIPPETS.neural_network.code)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[10px]"
              >
                Load Neural Net Preset
              </button>
            </div>
          </div>

          {/* Rendered MP4 Preview Panel */}
          <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Rendered Video (.mp4)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                1920x1080 @ 60 FPS
              </span>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {activeManim?.videoUrl ? (
                <video
                  src={activeManim.videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <Film className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
                  <p className="text-xs">Video ready to render into .mp4</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950/60 text-xs text-slate-400 border-t border-slate-800">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span>Format: H.264 / AAC High-Profile</span>
                <span className="text-emerald-400">Ready for Drive / Slides</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Chart & Infographics */}
      {activeTab === "chart" && (
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200">
              {activeChart?.title || "Real-Time FMC Commodity Telemetry"}
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              CME / ICE Spot Feed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {activeChart?.dataPoints.map((dp, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400">{dp.label}</span>
                <div className="text-sm font-bold text-white mt-1">
                  {dp.value} <span className="text-[10px] text-slate-400 font-normal">{dp.unit}</span>
                </div>
                {dp.change !== undefined && (
                  <span className={`text-[10px] font-mono ${dp.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {dp.change >= 0 ? `+${dp.change}%` : `${dp.change}%`}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Converted dynamically into high-resolution vector infographic image for Google Slides `createImage` injection.
          </p>
        </div>
      )}

      {/* Tab 3: YouTube Search */}
      {activeTab === "youtube" && (
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-200">{activeYoutube?.videoTitle || "Contextual Video"}</h4>
              <p className="text-[11px] text-slate-400">Search Query: "{activeYoutube?.searchKeyword}"</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
              YouTube Data API v3
            </span>
          </div>

          <div className="relative aspect-video max-w-lg mx-auto rounded-lg overflow-hidden border border-slate-800">
            {activeYoutube?.embedUrl && (
              <iframe
                src={activeYoutube.embedUrl}
                title="YouTube Preview"
                className="w-full h-full"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
