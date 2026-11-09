/**
 * Layer 3 (Presentation Component):
 * Left-hand Sidebar Navigation for the MAHR Extensions & Add-ons Marketplace Modal.
 * Features category filters ('All', 'Productivity', 'Research', 'Visuals', 'Utilities', 'Installed')
 * with live tabular-nums counts, 1-click Starter Bundles, and Assistant Mode status.
 */

import React from "react";
import {
  LayoutGrid,
  Calendar,
  Brain,
  PenTool,
  Monitor,
  CheckCircle2,
  Layers,
  Check,
  Mic,
  Sparkles,
} from "lucide-react";
import {
  InstalledPluginsMap,
  MarketplaceFilterCategory,
} from "../layer1_data/pluginTypes";
import {
  MAHR_PLUGIN_CATEGORIES,
  MAHR_PLUGIN_BUNDLES,
} from "../layer1_data/pluginCatalog";
import { isPluginActiveInMap } from "../layer2_logic/pluginStorageService";

export interface PluginMarketplaceSidebarProps {
  selectedCategory: MarketplaceFilterCategory;
  onSelectCategory: (category: MarketplaceFilterCategory) => void;
  categoryCounts: Record<MarketplaceFilterCategory, number>;
  pluginsMap: InstalledPluginsMap;
  activeCount: number;
  installedCount: number;
  totalAvailableCount: number;
  isPureVoiceMode: boolean;
  activeMemoryKb: number;
  dormantSavedKb: number;
  onApplyBundle: (bundleId: string) => void;
  onResetToPureVoiceAgent: () => void;
}

const CATEGORY_ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  LayoutGrid,
  Calendar,
  Brain,
  PenTool,
  Monitor,
  CheckCircle2,
};

export const PluginMarketplaceSidebar: React.FC<PluginMarketplaceSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  pluginsMap,
  activeCount,
  installedCount,
  totalAvailableCount,
  isPureVoiceMode,
  activeMemoryKb,
  dormantSavedKb,
  onApplyBundle,
  onResetToPureVoiceAgent,
}) => {
  const usagePercent =
    totalAvailableCount > 0
      ? Math.round((activeCount / totalAvailableCount) * 100)
      : 0;

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-slate-800/90 bg-slate-950/90 p-4 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Category Filter Navigation */}
        <div>
          <div className="px-2.5 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Categories
            </span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {totalAvailableCount} Total
            </span>
          </div>

          <nav className="space-y-1" aria-label="Marketplace category navigation">
            {MAHR_PLUGIN_CATEGORIES.map((cat) => {
              const IconComp = CATEGORY_ICON_MAP[cat.iconName] || LayoutGrid;
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`marketplace-category-${cat.id}`}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/15 text-white border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="flex items-center justify-center shrink-0"
                      style={{
                        color: isSelected ? cat.accentColor : undefined,
                      }}
                    >
                      <IconComp size={15} />
                    </span>
                    <span className="truncate">{cat.label}</span>
                  </div>

                  <span
                    className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-200 font-semibold"
                        : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 1-Click Starter Bundles */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="px-2.5 mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              1-Click Bundles
            </span>
            <Sparkles size={12} className="text-amber-400" />
          </div>

          <div className="space-y-2">
            {MAHR_PLUGIN_BUNDLES.map((bundle) => {
              const isBundleActive = bundle.pluginIds.every((pid) =>
                isPluginActiveInMap(pluginsMap, pid)
              );

              return (
                <button
                  key={bundle.id}
                  type="button"
                  onClick={() => onApplyBundle(bundle.id)}
                  disabled={isBundleActive}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 ${
                    isBundleActive
                      ? "bg-slate-900/50 border-emerald-500/30 text-slate-300 cursor-default"
                      : "bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Layers
                        size={13}
                        className="shrink-0"
                        style={{ color: bundle.accentHex }}
                      />
                      <span className="text-xs font-semibold text-white truncate">
                        {bundle.name}
                      </span>
                    </div>
                    {isBundleActive ? (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 shrink-0">
                        <Check size={11} /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-cyan-400 shrink-0 tabular-nums">
                        +{bundle.pluginIds.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {bundle.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Assistant Runtime Memory Footprint Card */}
      <div className="mt-6 pt-4 border-t border-slate-800/80">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Memory Footprint</span>
            <span
              className={`font-mono text-[11px] font-semibold tabular-nums ${
                isPureVoiceMode ? "text-cyan-400" : "text-emerald-400"
              }`}
            >
              {isPureVoiceMode ? "0 KB Extra" : `${activeMemoryKb} KB Live`}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.max(4, usagePercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
            <span>{activeCount}/{totalAvailableCount} Mounted</span>
            <span className="text-cyan-300/90">{dormantSavedKb} KB Saved</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isPureVoiceMode
              ? "Zero plugin chunks loaded. Uninstalled tools consume 0 KB in memory."
              : "Hot-Swap any extension OFF to unmount its chunk immediately."}
          </p>

          <button
            type="button"
            onClick={onResetToPureVoiceAgent}
            disabled={installedCount === 0}
            className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              installedCount === 0
                ? "bg-slate-950 text-slate-600 border-slate-800/70 cursor-not-allowed"
                : "bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700 cursor-pointer"
            }`}
          >
            <Mic size={13} className="text-cyan-400 shrink-0" />
            <span>Reset to Pure Voice (0 KB)</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

