import React from "react";
import {
  SlideVectorGraphic,
  ValueChainStage,
  TamSamSomTier,
  CompetitorQuadrantItem,
  MarketShareSlice,
  CostWaterfallBar
} from "./infographicTypes";
import { SlideTheme } from "../slideTypes";
import { Database, ShieldCheck, TrendingUp, Zap } from "lucide-react";

interface RendererProps {
  graphic: SlideVectorGraphic;
  theme: SlideTheme;
  interactive?: boolean;
}

// 1. Value Chain Pipeline SVG Renderer
export const ValueChainPipelineSVG: React.FC<{ stages: ValueChainStage[]; theme: SlideTheme }> = ({
  stages,
  theme
}) => {
  const accent = theme.accentCol || "#f59e0b";
  const stageCount = stages.length;

  return (
    <div className="w-full flex flex-col gap-2 my-1">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 w-full">
        {stages.map((stage, idx) => {
          const isLast = idx === stageCount - 1;
          return (
            <div
              key={stage.id}
              className="relative p-3 rounded-xl border backdrop-blur-md flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-md"
              style={{
                background: theme.cardBg || "rgba(255,255,255,0.04)",
                borderColor: theme.borderCol || "rgba(255,255,255,0.12)",
                boxShadow: `0 6px 18px -4px ${theme.accentGlow || "rgba(0,0,0,0.3)"}`
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                    style={{
                      color: accent,
                      borderColor: `${accent}40`,
                      background: `${accent}15`
                    }}
                  >
                    STEP 0{idx + 1}
                  </span>
                  {!isLast && (
                    <span className="hidden sm:inline text-zinc-500 font-mono text-[10px]">
                      →
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-white mb-1 line-clamp-1">
                  {stage.name}
                </div>

                <div className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                  {stage.subtext}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-baseline justify-between">
                <span className="text-[9px] font-mono uppercase text-zinc-500">
                  {stage.kpiLabel}
                </span>
                <span className="text-xs sm:text-sm font-extrabold font-mono" style={{ color: accent }}>
                  {stage.metric}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SVG Flow Connector Line below cards */}
      <svg className="w-full h-4 hidden sm:block" viewBox="0 0 1000 24" preserveAspectRatio="none">
        <line
          x1="50"
          y1="12"
          x2="950"
          y2="12"
          stroke={accent}
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeOpacity="0.4"
        />
        {[100, 300, 500, 700, 900].map((cx, i) => (
          <circle key={i} cx={cx} cy="12" r="4" fill={accent} />
        ))}
      </svg>
    </div>
  );
};

// 2. TAM / SAM / SOM Market Sizing Pyramid SVG
export const TamSamSomPyramidSVG: React.FC<{ tiers: TamSamSomTier[]; theme: SlideTheme }> = ({
  tiers,
  theme
}) => {
  const accent = theme.accentCol || "#f59e0b";

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center my-1 w-full">
      {/* Visual Pyramid SVG Graphic */}
      <div className="md:col-span-5 flex items-center justify-center p-2">
        <svg viewBox="0 0 320 240" className="w-full max-w-[260px] h-auto drop-shadow-xl">
          <defs>
            <linearGradient id="somGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="samGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="tamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Top SOM Triangle */}
          <polygon points="160,20 120,80 200,80" fill="url(#somGrad)" stroke={accent} strokeWidth="1.5" />
          <text x="160" y="55" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">
            SOM
          </text>

          {/* Middle SAM Trapezoid */}
          <polygon points="118,84 198,84 238,150 78,150" fill="url(#samGrad)" stroke="#6366f1" strokeWidth="1.5" />
          <text x="160" y="122" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="monospace">
            SAM
          </text>

          {/* Bottom TAM Trapezoid */}
          <polygon points="76,154 240,154 286,220 30,220" fill="url(#tamGrad)" stroke="#10b981" strokeWidth="1.5" />
          <text x="160" y="192" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold" fontFamily="monospace">
            TAM
          </text>
        </svg>
      </div>

      {/* Side Breakdown Cards */}
      <div className="md:col-span-7 space-y-2">
        {tiers.map((tier) => {
          const tierCol =
            tier.tier === "SOM" ? accent : tier.tier === "SAM" ? "#818cf8" : "#34d399";
          return (
            <div
              key={tier.id}
              className="p-3 rounded-xl border backdrop-blur-md flex items-center justify-between gap-3 shadow-sm transition-transform hover:translate-x-1"
              style={{
                background: theme.cardBg || "rgba(255,255,255,0.04)",
                borderColor: theme.borderCol || "rgba(255,255,255,0.12)"
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 border"
                  style={{
                    color: tierCol,
                    borderColor: `${tierCol}50`,
                    background: `${tierCol}15`
                  }}
                >
                  {tier.tier}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{tier.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate">{tier.description}</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm font-extrabold font-mono" style={{ color: tierCol }}>
                  {tier.value}
                </div>
                <div className="text-[9px] font-mono text-zinc-400">{tier.growth}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. Competitive Matrix 2x2 SVG
export const CompetitiveMatrix2x2SVG: React.FC<{
  competitors: CompetitorQuadrantItem[];
  theme: SlideTheme;
}> = ({ competitors, theme }) => {
  const accent = theme.accentCol || "#f59e0b";

  return (
    <div className="w-full my-1 flex flex-col items-center">
      <div className="relative w-full max-w-xl aspect-[16/10] rounded-xl border p-4 backdrop-blur-md overflow-hidden"
        style={{
          background: theme.cardBg || "rgba(255,255,255,0.04)",
          borderColor: theme.borderCol || "rgba(255,255,255,0.12)"
        }}
      >
        {/* Axes lines */}
        <div className="absolute inset-x-8 top-1/2 h-[1px] bg-white/20" />
        <div className="absolute inset-y-6 left-1/2 w-[1px] bg-white/20" />

        {/* Quadrant Watermark Labels */}
        <div className="absolute top-2 left-3 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
          High Market Reach / Slow Agility
        </div>
        <div className="absolute top-2 right-3 text-[9px] font-mono text-amber-400/80 font-bold uppercase tracking-widest">
          ★ Market Leaders (High Reach & Agility)
        </div>
        <div className="absolute bottom-2 left-3 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
          Low Differentiation (Commodity)
        </div>
        <div className="absolute bottom-2 right-3 text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest">
          Agile Disrupters (Niche D2C)
        </div>

        {/* Axis Titles */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-400 font-semibold">
          ← Digital & Omnichannel Agility →
        </div>
        <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-mono text-zinc-400 font-semibold">
          Scale & Distribution →
        </div>

        {/* Competitor Nodes */}
        {competitors.map((c) => {
          const isUser = Boolean(c.isUserBrand);
          return (
            <div
              key={c.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 z-10"
              style={{ left: `${c.x}%`, top: `${100 - c.y}%` }}
            >
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg border ${
                  isUser
                    ? "border-amber-400 bg-amber-500 text-black ring-4 ring-amber-500/30 animate-pulse"
                    : "border-indigo-400/60 bg-indigo-950/80 text-white"
                }`}
              >
                {isUser ? <Zap size={11} className="fill-black" /> : <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              <div
                className={`mt-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md truncate max-w-[140px] text-center border ${
                  isUser
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                    : "bg-black/70 text-zinc-300 border-white/10"
                }`}
              >
                {c.name} {c.marketShare && `(${c.marketShare})`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 4. Market Share Ring SVG
export const MarketShareRingSVG: React.FC<{ slices: MarketShareSlice[]; theme: SlideTheme }> = ({
  slices,
  theme
}) => {
  const accent = theme.accentCol || "#f59e0b";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center my-1 w-full">
      {/* SVG Donut */}
      <div className="sm:col-span-5 flex items-center justify-center p-2">
        <svg viewBox="0 0 200 200" className="w-full max-w-[180px] h-auto drop-shadow-xl">
          <circle cx="100" cy="100" r="70" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="24" />
          {/* Main user share ring stroke */}
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="transparent"
            stroke={accent}
            strokeWidth="24"
            strokeDasharray="440"
            strokeDashoffset="280"
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
          <text x="100" y="96" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="bold" fontFamily="monospace">
            {slices[0]?.percentage || 32}%
          </text>
          <text x="100" y="114" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            CATEGORY LEADER
          </text>
        </svg>
      </div>

      {/* Legend & Breakdown */}
      <div className="sm:col-span-7 space-y-1.5">
        {slices.map((slice, i) => (
          <div
            key={slice.id}
            className="p-2 sm:p-2.5 rounded-lg border backdrop-blur-md flex items-center justify-between text-xs"
            style={{
              background: theme.cardBg || "rgba(255,255,255,0.04)",
              borderColor: theme.borderCol || "rgba(255,255,255,0.1)"
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: slice.color || (i === 0 ? accent : "#64748b") }}
              />
              <span className="text-zinc-200 font-medium truncate">{slice.name}</span>
            </div>
            <div className="flex items-center gap-2 font-mono shrink-0">
              <span className="text-zinc-400">{slice.value}</span>
              <span className="font-bold" style={{ color: slice.color || (i === 0 ? accent : "#ffffff") }}>
                {slice.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. Value Chain Margin Waterfall SVG
export const CostWaterfallSVG: React.FC<{ bars: CostWaterfallBar[]; theme: SlideTheme }> = ({
  bars,
  theme
}) => {
  const accent = theme.accentCol || "#f59e0b";

  return (
    <div className="w-full my-1">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {bars.map((bar, idx) => {
          const isNegative = bar.cost < 0;
          const isTotal = Boolean(bar.isTotal);
          const barColor = isTotal ? accent : isNegative ? "#f43f5e" : "#10b981";

          return (
            <div
              key={bar.id}
              className="p-2.5 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-sm"
              style={{
                background: theme.cardBg || "rgba(255,255,255,0.04)",
                borderColor: theme.borderCol || "rgba(255,255,255,0.12)"
              }}
            >
              <div>
                <span
                  className="text-[9px] font-mono px-1 py-0.5 rounded border"
                  style={{
                    color: barColor,
                    borderColor: `${barColor}40`,
                    background: `${barColor}15`
                  }}
                >
                  {isTotal ? "TOTAL" : isNegative ? "COST OUT" : "SURPLUS"}
                </span>
                <div className="text-[11px] font-bold text-white mt-1.5 line-clamp-2">
                  {bar.name}
                </div>
              </div>

              <div className="mt-3 pt-1.5 border-t border-white/5 flex items-baseline justify-between font-mono">
                <span className="text-xs sm:text-sm font-bold" style={{ color: barColor }}>
                  {bar.cost > 0 ? `+${bar.cost}` : bar.cost}%
                </span>
                <span className="text-[9px] text-zinc-400">{bar.percentage}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 6. Commodity Price Trends SVG Renderer
export const CommodityPriceTrendsSVG: React.FC<{
  commodities: any[];
  theme: SlideTheme;
}> = ({ commodities, theme }) => {
  const accent = theme.accentCol || "#f59e0b";

  return (
    <div className="w-full my-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {commodities.map((item) => {
          const isUp = item.changePositive || item.change24h?.startsWith("+");
          const changeCol = isUp ? "#10b981" : "#f43f5e";
          return (
            <div
              key={item.id}
              className="p-2.5 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-0.5"
              style={{
                background: theme.cardBg || "rgba(255,255,255,0.04)",
                borderColor: theme.borderCol || "rgba(255,255,255,0.12)"
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-bold text-zinc-400">
                    {item.exchange}:{item.symbol}
                  </span>
                  <span
                    className="text-[8px] font-mono px-1 py-0.2 rounded"
                    style={{
                      color: item.volatility === "high" ? "#f43f5e" : "#10b981",
                      background: item.volatility === "high" ? "rgba(244,63,94,0.15)" : "rgba(16,185,129,0.15)"
                    }}
                  >
                    {item.volatility?.toUpperCase()}
                  </span>
                </div>

                <div className="text-[11px] font-bold text-white truncate" title={item.name}>
                  {item.name}
                </div>
              </div>

              <div className="my-1.5">
                <div className="text-sm font-extrabold font-mono" style={{ color: accent }}>
                  {item.spotPrice}
                  <span className="text-[9px] text-zinc-400 font-normal ml-0.5">/{item.unit}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold" style={{ color: changeCol }}>
                  <span>{isUp ? "▲" : "▼"}</span>
                  <span>{item.change24h}</span>
                  <span className="text-[8px] text-zinc-500 font-normal">24h</span>
                </div>
              </div>

              {item.impactCategory && (
                <div className="pt-1.5 border-t border-white/5 text-[9px] text-zinc-400 truncate">
                  {item.impactCategory}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 7. Retail Market Statistics SVG Renderer
export const RetailMarketStatsSVG: React.FC<{
  metrics: any[];
  theme: SlideTheme;
}> = ({ metrics, theme }) => {
  const accent = theme.accentCol || "#f59e0b";

  return (
    <div className="w-full my-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {metrics.map((m) => {
          const isUp = m.trend === "up";
          return (
            <div
              key={m.id}
              className="p-3 rounded-xl border backdrop-blur-md flex flex-col justify-between shadow-sm"
              style={{
                background: theme.cardBg || "rgba(255,255,255,0.04)",
                borderColor: theme.borderCol || "rgba(255,255,255,0.12)"
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide truncate">
                  {m.label}
                </span>
                <span className="text-[9px] font-mono text-cyan-400">{m.period}</span>
              </div>

              <div className="my-1 flex items-baseline justify-between">
                <span className="text-xl font-extrabold font-mono" style={{ color: accent }}>
                  {m.value}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{m.benchmark}</span>
              </div>

              <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                <span className="truncate">{m.source}</span>
                <span style={{ color: isUp ? "#10b981" : "#818cf8" }}>{isUp ? "↑ Target" : "↓ Benchmark"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Master Vector Infographic Component
export const VectorInfographicRenderer: React.FC<RendererProps> = ({
  graphic,
  theme,
  interactive = true
}) => {
  return (
    <div className="w-full my-2">
      {/* Infographic Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3
            className="text-sm sm:text-base font-bold tracking-tight"
            style={{ color: theme.textPrimary || "#ffffff" }}
          >
            {graphic.title}
          </h3>
          {graphic.subtitle && (
            <p className="text-[10px] sm:text-xs text-zinc-400">
              {graphic.subtitle}
            </p>
          )}
        </div>

        {graphic.kbSourceReference && (
          <div className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
            <Database size={10} />
            <span className="truncate max-w-[180px]">{graphic.kbSourceReference}</span>
          </div>
        )}
      </div>

      {/* Render Specific SVG Vector Layout */}
      {graphic.type === "value_chain_pipeline" && graphic.stages && (
        <ValueChainPipelineSVG stages={graphic.stages} theme={theme} />
      )}

      {graphic.type === "tam_sam_som_pyramid" && graphic.tiers && (
        <TamSamSomPyramidSVG tiers={graphic.tiers} theme={theme} />
      )}

      {graphic.type === "competitive_matrix_2x2" && graphic.competitors && (
        <CompetitiveMatrix2x2SVG competitors={graphic.competitors} theme={theme} />
      )}

      {graphic.type === "market_share_ring" && graphic.slices && (
        <MarketShareRingSVG slices={graphic.slices} theme={theme} />
      )}

      {graphic.type === "cost_waterfall" && graphic.bars && (
        <CostWaterfallSVG bars={graphic.bars} theme={theme} />
      )}

      {graphic.type === "commodity_price_trends" && graphic.commodities && (
        <CommodityPriceTrendsSVG commodities={graphic.commodities} theme={theme} />
      )}

      {graphic.type === "retail_market_stats" && graphic.retailMetrics && (
        <RetailMarketStatsSVG metrics={graphic.retailMetrics} theme={theme} />
      )}
    </div>
  );
};
