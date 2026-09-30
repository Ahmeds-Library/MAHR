import React from "react";
import {
  X,
  Sparkles,
  Zap,
  Layers,
  Database,
  Check,
  Command,
  TrendingUp,
  Cpu,
  BarChart3
} from "lucide-react";
import { SlideVectorGraphic } from "../../../../services/slides/infographics/infographicTypes";
import { INFOGRAPHIC_TEMPLATES } from "../../../../services/slides/infographics/infographicTemplates";
import { useInfographicGenerator } from "../../../../hooks/slides/useInfographicGenerator";
import { VectorInfographicRenderer } from "../../../../services/slides/infographics/svgRenderers";
import { SlideTheme } from "../../../../services/slides/slideTypes";
import { FmcLiveMarketIntelWidget } from "./FmcLiveMarketIntelWidget";

interface InfographicGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertGraphic: (graphic: SlideVectorGraphic) => void;
  theme: SlideTheme;
}

export const InfographicGeneratorModal: React.FC<InfographicGeneratorModalProps> = ({
  isOpen,
  onClose,
  onInsertGraphic,
  theme
}) => {
  const {
    selectedCategory,
    setSelectedCategory,
    activeTemplateId,
    selectTemplate,
    filteredTemplates,
    draftGraphic,
    setDraftGraphic,
    kbAutoFilled,
    isFetchingLive,
    autoFillFromKnowledgeBase,
    handleInsert
  } = useInfographicGenerator({ isOpen, onClose, onInsertGraphic });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#090c15] border border-white/15 shadow-2xl overflow-hidden">
        {/* Header with Title & KBS Hotkey Badge */}
        <div className="p-4 sm:px-6 border-b border-white/10 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Zap size={16} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Vector Infographic Generator
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Database size={10} />
                  <span>KBS Grounded</span>
                </span>
                <span className="hidden sm:inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                  Ctrl+I
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Insert pre-styled, data-driven vector graphics for value chain & market intelligence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* KBS Shortcut Guide */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <span className="text-amber-400 font-bold">KBS:</span>
              <span>1-5 Template</span>
              <span>•</span>
              <span>Ctrl+Enter Insert</span>
              <span>•</span>
              <span>Esc Close</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body: Left template selector & Right preview/editor */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {/* Left Column: Category Pills & Template Cards */}
          <div className="lg:col-span-4 p-4 space-y-3 overflow-y-auto bg-zinc-950/40">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("value_chain")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === "value_chain"
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                Value Chain
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("market_intelligence")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === "market_intelligence"
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                Market Intel
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("live_fmc_intelligence")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedCategory === "live_fmc_intelligence"
                    ? "bg-emerald-500 text-black font-semibold"
                    : "bg-white/5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live FMC</span>
              </button>
            </div>

            {/* Template Card List */}
            <div className="space-y-2">
              {filteredTemplates.map((tmpl) => {
                const isSelected = activeTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => selectTemplate(tmpl.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500/50 shadow-md"
                        : "bg-zinc-900/60 border-white/5 hover:border-white/20 hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{tmpl.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-400 border border-amber-500/30">
                        [{tmpl.hotkeyNum}]
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Vector Preview & Data Grounding Customizer */}
          <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col justify-between space-y-4 overflow-y-auto">
            {/* Live Interactive SVG Preview Panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-300">
                  <BarChart3 size={13} className="text-amber-400" />
                  <span>LIVE VECTOR GRAPHIC PREVIEW</span>
                </div>

                {/* KBS Live FMC Grounding Quick Action */}
                <button
                  type="button"
                  onClick={autoFillFromKnowledgeBase}
                  disabled={isFetchingLive}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                    kbAutoFilled
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                      : "bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border-cyan-500/30"
                  }`}
                  title="Pull real-time FMC commodity and retail intelligence API data"
                >
                  <Database size={11} className={isFetchingLive ? "animate-spin text-amber-400" : ""} />
                  <span>
                    {isFetchingLive
                      ? "Fetching Live Telemetry..."
                      : kbAutoFilled
                      ? "✓ Live Market Grounded"
                      : "Fetch Live FMC Market API"}
                  </span>
                </button>
              </div>

              {/* Vector Graphic Render Canvas */}
              <div
                className="w-full p-4 rounded-xl border shadow-inner min-h-[200px] flex items-center justify-center backdrop-blur-md"
                style={{
                  background: theme.slideBg || "#0d111c",
                  borderColor: theme.borderCol || "rgba(255,255,255,0.12)"
                }}
              >
                <VectorInfographicRenderer graphic={draftGraphic} theme={theme} />
              </div>

              {/* Real-Time FMC Market Intelligence Feed Widget */}
              <div className="mt-3">
                <FmcLiveMarketIntelWidget onInsertGraphic={onInsertGraphic} />
              </div>
            </div>

            {/* Quick Data Tuning Controls */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-zinc-950/60 space-y-2">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Infographic Label Customizer
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Headline</label>
                  <input
                    type="text"
                    value={draftGraphic.title}
                    onChange={(e) => setDraftGraphic({ ...draftGraphic, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Subtitle / Metric Scope</label>
                  <input
                    type="text"
                    value={draftGraphic.subtitle || ""}
                    onChange={(e) => setDraftGraphic({ ...draftGraphic, subtitle: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono text-zinc-500">
                <span>Vector Size: </span>
                <span className="text-zinc-300 font-bold">&lt; 8 KBs SVG</span>
                <span> (Resolution-Independent)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleInsert}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  <Zap size={14} className="fill-black" />
                  <span>Insert Vector Graphic</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
