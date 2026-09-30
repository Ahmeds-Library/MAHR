import React, { useState } from "react";
import { Brain, Code2, Film, BarChart3, Youtube, Layers, Sparkles, CheckCircle2 } from "lucide-react";
import { SlideDeck } from "../../../services/slides/slideTypes";
import { ManimSceneAsset, ChartAsset, YouTubeAsset } from "../../../services/slides/pipeline/pipelineTypes";

interface Step1GeminiPlannerViewProps {
  deck?: SlideDeck;
  manimAssets: ManimSceneAsset[];
  chartAssets: ChartAsset[];
  youtubeAssets: YouTubeAsset[];
}

export const Step1GeminiPlannerView: React.FC<Step1GeminiPlannerViewProps> = ({
  deck,
  manimAssets,
  chartAssets,
  youtubeAssets
}) => {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
        <Brain className="w-10 h-10 text-cyan-400 mb-3 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-300">Gemini AI Engine Standby</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Enter a prompt or speak to Mahr to synthesize an intelligent multi-asset presentation schema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              GEMINI GENERATED SCHEMA
            </span>
            <span className="text-xs text-slate-400">{deck.slides.length} Slides Structured</span>
          </div>
          <h2 className="text-base font-bold text-white mt-1">{deck.title}</h2>
          <p className="text-xs text-slate-400">{deck.subtitle}</p>
        </div>

        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 transition-colors self-start sm:self-auto"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          {showRawJson ? "Hide JSON Schema" : "View JSON Schema"}
        </button>
      </div>

      {showRawJson ? (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-72">
          <pre>{JSON.stringify({ deck, manimAssets, chartAssets, youtubeAssets }, null, 2)}</pre>
        </div>
      ) : (
        /* Slide Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {deck.slides.map((slide, idx) => {
            const hasManim = manimAssets.some((m) => m.slideIndex === idx);
            const hasChart = chartAssets.some((c) => c.slideIndex === idx);
            const hasYoutube = youtubeAssets.some((y) => y.slideIndex === idx);

            return (
              <div
                key={slide.id || idx}
                className="p-3.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Slide #{idx + 1} • {slide.layout.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Animation: {slide.animationStyle || "fade"}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">{slide.title}</h4>
                  {slide.subtitle && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{slide.subtitle}</p>
                  )}

                  {slide.bullets && (
                    <ul className="mt-2 space-y-1">
                      {slide.bullets.slice(0, 2).map((b, bIdx) => (
                        <li key={bIdx} className="text-[10px] text-slate-400 flex items-start gap-1">
                          <span className="text-cyan-500">•</span>
                          <span className="line-clamp-1">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Auto-Assigned Asset Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
                  {hasManim && (
                    <span className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                      <Film className="w-2.5 h-2.5" /> Manim Math Video
                    </span>
                  )}
                  {hasChart && (
                    <span className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      <BarChart3 className="w-2.5 h-2.5" /> Live FMC Chart
                    </span>
                  )}
                  {hasYoutube && (
                    <span className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300">
                      <Youtube className="w-2.5 h-2.5" /> YouTube Embed
                    </span>
                  )}
                  {!hasManim && !hasChart && !hasYoutube && (
                    <span className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      <Layers className="w-2.5 h-2.5" /> Kinetic Typography
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
