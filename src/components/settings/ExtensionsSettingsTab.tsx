/**
 * Layer 3 (Presentation Component):
 * Dedicated Extensions & Add-ons Marketplace Tab embedded directly inside SettingsModal.
 * Provides category filtering ('All', 'Productivity', 'Research', 'Visuals', 'Utilities', 'Installed'),
 * real-time search, starter bundles, live memory footprint telemetry (0 KB when uninstalled/disabled),
 * real-time Hot-Swap ON/OFF toggles, and 1-click workspace launch.
 */

import React, { useEffect, useRef } from "react";
import {
  Search,
  Puzzle,
  Mic,
  RotateCcw,
  Download,
  ArrowUpDown,
  X,
  Layers,
  Check,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import {
  InstalledPluginsMap,
  MahrPluginId,
  MarketplaceSortOrder,
} from "../../plugins/layer1_data/pluginTypes";
import {
  MAHR_PLUGIN_CATEGORIES,
  MAHR_PLUGIN_BUNDLES,
} from "../../plugins/layer1_data/pluginCatalog";
import {
  isPluginActiveInMap,
  isPluginInstalledInMap,
} from "../../plugins/layer2_logic/pluginStorageService";
import { useMarketplaceFilter } from "../../plugins/layer2_logic/useMarketplaceFilter";
import { PluginFeaturedSpotlight } from "../../plugins/layer3_ui/PluginFeaturedSpotlight";
import { PluginCardItem } from "../../plugins/layer3_ui/PluginCardItem";

export interface ExtensionsSettingsTabProps {
  pluginsMap: InstalledPluginsMap;
  activeCount: number;
  installedCount: number;
  totalAvailableCount: number;
  isPureVoiceMode: boolean;
  activeMemoryKb?: number;
  dormantSavedKb?: number;
  onInstallPlugin: (id: MahrPluginId) => void;
  onUninstallPlugin: (id: MahrPluginId) => void;
  onTogglePluginEnabled: (id: MahrPluginId) => void;
  onApplyBundle: (bundleId: string) => void;
  onInstallAll: () => void;
  onResetToPureVoiceAgent: () => void;
  onLaunchPluginFeature?: (id: MahrPluginId) => void;
}

export const ExtensionsSettingsTab: React.FC<ExtensionsSettingsTabProps> = ({
  pluginsMap,
  activeCount,
  installedCount,
  totalAvailableCount,
  isPureVoiceMode,
  activeMemoryKb = 0,
  dormantSavedKb = 1233,
  onInstallPlugin,
  onUninstallPlugin,
  onTogglePluginEnabled,
  onApplyBundle,
  onInstallAll,
  onResetToPureVoiceAgent,
  onLaunchPluginFeature,
}) => {
  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    categoryCounts,
    filteredPlugins,
    featuredPlugins,
    activeCategoryMeta,
    resetFilters,
  } = useMarketplaceFilter(pluginsMap);

  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // GSAP smooth staggered card entrance when category or sort changes
  useEffect(() => {
    if (!gridContainerRef.current) return;
    const cards = gridContainerRef.current.querySelectorAll("[data-plugin-card]");
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: 0.02,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }, gridContainerRef);

    return () => ctx.revert();
  }, [selectedCategory, sortOrder]);

  return (
    <div
      data-testid="settings-extensions-tab-panel"
      className="space-y-5 text-slate-100"
    >
      {/* Top Status & Memory Telemetry Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Puzzle size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
              <span>Hot-Swap Registry</span>
              <span aria-hidden="true">·</span>
              <span>
                {activeCount} of {totalAvailableCount} Active
              </span>
              <span aria-hidden="true">·</span>
              <span
                data-testid="settings-extensions-memory-badge"
                className={
                  isPureVoiceMode
                    ? "text-cyan-400 font-semibold"
                    : "text-emerald-400 font-semibold"
                }
              >
                {isPureVoiceMode
                  ? "0 KB Extra Loaded (Pure Voice Mode)"
                  : `${activeMemoryKb} KB Mounted · ${dormantSavedKb} KB Saved Dormant`}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
              Modular Extensions & Add-ons Store
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Install, hot-swap on/off without page refresh, or launch tools directly from here or by voice command.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetToPureVoiceAgent}
            disabled={installedCount === 0}
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              installedCount === 0
                ? "bg-slate-900/60 text-slate-500 border-slate-800 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 cursor-pointer"
            }`}
            title="Uninstall all extensions and return to Pure Voice Agent mode (0 KB)"
          >
            <Mic size={13} className="text-cyan-400" />
            <span>Pure Voice Mode (0 KB)</span>
          </button>

          <button
            type="button"
            onClick={onInstallAll}
            disabled={activeCount === totalAvailableCount}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeCount === totalAvailableCount
                ? "bg-slate-900/60 text-slate-500 border border-slate-800 cursor-not-allowed"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
            }`}
          >
            <Download size={13} />
            <span>Install All ({totalAvailableCount})</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs + Search & Sort Controls */}
      <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {MAHR_PLUGIN_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                data-testid={`extensions-category-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-semibold shadow-sm"
                    : "bg-slate-950/80 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-cyan-500/25 text-cyan-200"
                      : "bg-slate-900 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input + Sort Selector + Active Category Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-800/60">
          <div className="text-xs text-slate-400 truncate">
            <span className="font-semibold text-slate-200">
              {activeCategoryMeta.label}:
            </span>{" "}
            {activeCategoryMeta.description}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-60">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                id="settings-extensions-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search extensions or voice commands..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/60 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
              <ArrowUpDown
                size={12}
                className="text-slate-400 ml-1.5 mr-0.5 hidden sm:inline"
              />
              {(
                [
                  { id: "featured", label: "Featured" },
                  { id: "installed", label: "Active" },
                  { id: "alphabetical", label: "A–Z" },
                ] as { id: MarketplaceSortOrder; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortOrder(opt.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    sortOrder === opt.id
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Starter Bundles Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/70">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300">
            <Layers size={13} className="text-cyan-400" />
            <span>1-Click Starter Bundles</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Quickly mount curated toolsets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {MAHR_PLUGIN_BUNDLES.map((bundle) => {
            const isBundleFullyActive = bundle.pluginIds.every((pid) =>
              isPluginActiveInMap(pluginsMap, pid)
            );
            return (
              <button
                key={bundle.id}
                type="button"
                onClick={() => onApplyBundle(bundle.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isBundleFullyActive
                    ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-200"
                    : "bg-slate-950/70 hover:bg-slate-900 border-slate-800/90 text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <span className="text-xs font-bold truncate">
                    {bundle.name}
                  </span>
                  {isBundleFullyActive ? (
                    <Check size={12} className="text-emerald-400 shrink-0" />
                  ) : (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: `${bundle.accentHex}20`,
                        color: bundle.accentHex,
                      }}
                    >
                      +{bundle.pluginIds.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {bundle.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Spotlight Banner (on 'All' when not searching) */}
      {selectedCategory === "all" && !searchQuery.trim() && (
        <PluginFeaturedSpotlight
          featuredPlugins={featuredPlugins}
          pluginsMap={pluginsMap}
          onInstallPlugin={onInstallPlugin}
          onOpenPluginFeature={onLaunchPluginFeature}
        />
      )}

      {/* Extensions Grid or Empty State */}
      {filteredPlugins.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border border-slate-800/80 bg-slate-900/30">
          <Sparkles size={22} className="text-cyan-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200 mb-1">
            {selectedCategory === "installed" && installedCount === 0
              ? "No extensions installed yet (Pure Voice Agent Mode)"
              : "No matching extensions found"}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            {selectedCategory === "installed" && installedCount === 0
              ? "MAHR is currently running with 0 KB extra extension overhead. Browse Productivity, Research, Visuals, or Utilities to install tools anytime."
              : "Try clearing your search query or switching to All Extensions."}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw size={13} />
            <span>Browse All Extensions</span>
          </button>
        </div>
      ) : (
        <div
          ref={gridContainerRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {filteredPlugins.map((plugin) => {
            const isInstalled = isPluginInstalledInMap(pluginsMap, plugin.id);
            const isEnabled = isPluginActiveInMap(pluginsMap, plugin.id);
            return (
              <PluginCardItem
                key={plugin.id}
                plugin={plugin}
                isInstalled={isInstalled}
                isEnabled={isEnabled}
                onInstall={onInstallPlugin}
                onUninstall={onUninstallPlugin}
                onToggleEnabled={onTogglePluginEnabled}
                onOpenFeature={onLaunchPluginFeature}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
