import React, { useState } from "react";
import { Send, ExternalLink, FileText, Film, Image as ImageIcon, CheckCircle2, Copy } from "lucide-react";
import { SlideDeck } from "../../../services/slides/slideTypes";
import { ManimSceneAsset, ChartAsset, YouTubeAsset } from "../../../services/slides/pipeline/pipelineTypes";

interface Step4SlidesInjectionViewProps {
  deck?: SlideDeck;
  manimAssets: ManimSceneAsset[];
  chartAssets: ChartAsset[];
  youtubeAssets: YouTubeAsset[];
  clonedPresentationUrl?: string;
}

export const Step4SlidesInjectionView: React.FC<Step4SlidesInjectionViewProps> = ({
  deck,
  manimAssets,
  chartAssets,
  youtubeAssets,
  clonedPresentationUrl
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"summary" | "batch_payload">("summary");

  const totalTextReplaces = deck ? deck.slides.length * 3 : 0;
  const totalVideos = manimAssets.length + youtubeAssets.length;
  const totalImages = chartAssets.length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              GOOGLE SLIDES API INJECTOR
            </span>
            <span className="text-xs text-slate-400">batchUpdate Runner</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">Smart Multi-Asset Layer Injection</h3>
          <p className="text-xs text-slate-400">
            Replaces text tokens, embeds Manim mathematical videos & YouTube, and maps vector charts into native slide coordinates.
          </p>
        </div>

        {clonedPresentationUrl && (
          <a
            href={clonedPresentationUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/60 transition-all self-start sm:self-auto"
          >
            <ExternalLink className="w-4 h-4" />
            Open Google Slides
          </a>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">replaceAllText</span>
            <div className="text-base font-bold text-white">{totalTextReplaces} Replacements</div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">createVideo</span>
            <div className="text-base font-bold text-white">{totalVideos} Videos Embedded</div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">createImage</span>
            <div className="text-base font-bold text-white">{totalImages} Charts & Infographics</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab("summary")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            activeSubTab === "summary"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Injection Commands
        </button>
        <button
          onClick={() => setActiveSubTab("batch_payload")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            activeSubTab === "batch_payload"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Raw batchUpdate Payload
        </button>
      </div>

      {activeSubTab === "summary" ? (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {deck?.slides.map((s, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span className="font-medium text-slate-200">{s.title}</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Injected
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-cyan-300 max-h-60 overflow-y-auto">
          <pre>
            {JSON.stringify(
              {
                batchRequestsCount: totalTextReplaces + totalVideos + totalImages,
                commands: [
                  { replaceAllText: { token: "{{SLIDE_TITLE}}", value: deck?.title } },
                  { createVideo: { source: "MANIM_MP4", pageObjectId: "slide_page_2" } },
                  { createVideo: { source: "YOUTUBE", pageObjectId: "slide_page_4" } },
                  { createImage: { source: "VECTOR_INFOGRAPHIC", pageObjectId: "slide_page_3" } }
                ]
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
