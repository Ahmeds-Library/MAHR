import React from "react";
import {
  TrendingUp,
  RefreshCw,
  Zap,
  Globe,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useFmcMarketData } from "../../../../hooks/slides/useFmcMarketData";
import {
  createCommodityVectorGraphic,
  createRetailMetricsVectorGraphic
} from "../../../../services/slides/fmcMarketIntelligenceService";
import { SlideVectorGraphic } from "../../../../services/slides/infographics/infographicTypes";

interface FmcLiveMarketIntelWidgetProps {
  onInsertGraphic?: (graphic: SlideVectorGraphic) => void;
  compact?: boolean;
}

export const FmcLiveMarketIntelWidget: React.FC<FmcLiveMarketIntelWidgetProps> = ({
  onInsertGraphic,
  compact = false
}) => {
  const { data, isLoading, refreshData, lastRefreshed } = useFmcMarketData();

  if (!data) return null;

  return (
    <div className="w-full rounded-2xl bg-zinc-950/80 border border-white/10 p-3.5 sm:p-4 backdrop-blur-xl shadow-2xl space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-white tracking-wide">
            REAL-TIME FMC MARKET INTELLIGENCE FEED
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
            {data.status === "live_connected" ? "LIVE STREAM" : "VERIFIED BENCHMARK"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}

          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Live Market Data"
          >
            <RefreshCw size={11} className={isLoading ? "animate-spin text-amber-400" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Headline Market Summary */}
      {data.headlineSummary && (
        <p className="text-[11px] text-zinc-300 leading-relaxed font-light bg-black/40 p-2 rounded-xl border border-white/5">
          <span className="text-amber-400 font-mono font-semibold mr-1">Market Snapshot:</span>
          {data.headlineSummary}
        </p>
      )}

      {/* Commodity Ticker Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {data.commodities.map((item) => {
          const isUp = item.changePositive;
          return (
            <div
              key={item.id}
              className="p-2.5 rounded-xl border bg-zinc-900/60 border-white/5 hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                  <span>{item.symbol}</span>
                  <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
                    {item.change24h}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate" title={item.name}>
                  {item.name}
                </div>
              </div>

              <div className="mt-2 flex items-baseline justify-between font-mono">
                <span className="text-xs font-extrabold text-amber-400">
                  {item.spotPrice}
                </span>
                <span className="text-[9px] text-zinc-500">/{item.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Insert Actions */}
      {onInsertGraphic && (
        <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
            <Globe size={11} className="text-cyan-400" />
            <span className="truncate max-w-[280px]">Sourced: {data.sourceProvider}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onInsertGraphic(createCommodityVectorGraphic(data.commodities))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-mono font-semibold text-amber-300 hover:text-amber-200 transition-all cursor-pointer"
            >
              <Zap size={12} className="fill-amber-400 text-amber-400" />
              <span>Insert Commodity Ticker Vector</span>
            </button>

            <button
              type="button"
              onClick={() => onInsertGraphic(createRetailMetricsVectorGraphic(data.retailMetrics))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs font-mono font-semibold text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer"
            >
              <TrendingUp size={12} className="text-cyan-400" />
              <span>Insert Retail Stats Vector</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
