/**
 * Layer 3 (Presentation Component):
 * MAHR Extensions & Add-ons Marketplace Modal.
 * Features a Sidebar Category Navigation ('All', 'Productivity', 'Research',
 * 'Visuals', 'Utilities', 'Installed'), Featured Spotlight banner, live search,
 * sort controls, 1-click starter bundles, and GSAP staggered card animations.
 */

import React, { useEffect, useRef } from "react";
import {
  X,
  Search,
  Puzzle,
  Mic,
  RotateCcw,
  Download,
  ArrowUpDown,
} from "lucide-react";
import gsap from "gsap";
import {
  InstalledPluginsMap,
  MahrPluginId,
  MarketplaceSortOrder,
} from "../layer1_data/pluginTypes";
import { MAHR_PLUGIN_CATEGORIES } from "../layer1_data/pluginCatalog";
import {
  isPluginActiveInMap,
  isPluginInstalledInMap,
} from "../layer2_logic/pluginStorageService";
import { useMarketplaceFilter } from "../layer2_logic/useMarketplaceFilter";
import { PluginMarketplaceSidebar } from "./PluginMarketplaceSidebar";
import { PluginFeaturedSpotlight } from "./PluginFeaturedSpotlight";
import { PluginCardItem } from "./PluginCardItem";

export interface PluginMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onOpenPluginFeature?: (id: MahrPluginId) => void;
}

export const PluginMarketplaceModal: React.FC<PluginMarketplaceModalProps> = ({
  isOpen,
  onClose,
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
  onOpenPluginFeature,
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

  // GSAP smooth staggered entrance when modal opens or category/sort changes
  useEffect(() => {
    if (!isOpen || !gridContainerRef.current) return;
    const cards = gridContainerRef.current.querySelectorAll("[data-plugin-card]");
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.22,
          stagger: 0.025,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }, gridContainerRef);

    return () => ctx.revert();
  }, [isOpen, selectedCategory, sortOrder]);

  if (!isOpen) return null;

  const handleLaunchFeature = onOpenPluginFeature
    ? (id: MahrPluginId) => {
        onClose();
        onOpenPluginFeature(id);
      }
    : undefined;

  return (
    <div
      id="mahr-plugin-marketplace-modal"
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-7xl h-[90vh] max-h-[880px] flex flex-col rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Top Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-800/90 bg-slate-900/60 shrink-0">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Puzzle size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                <span>MAHR Hot-Swap Registry</span>
                <span aria-hidden="true">·</span>
                <span>
                  {activeCount} of {totalAvailableCount} Mounted
                </span>
                <span aria-hidden="true">·</span>
                <span
                  data-testid="marketplace-memory-telemetry"
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
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Extensions & Add-ons Marketplace
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onResetToPureVoiceAgent}
              disabled={installedCount === 0}
              className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                installedCount === 0
                  ? "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 cursor-pointer"
              }`}
              title="Uninstall all extensions and return to Pure Voice Agent mode (0 KB)"
            >
              <Mic size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">Pure Voice Mode</span>
            </button>

            <button
              type="button"
              onClick={onInstallAll}
              disabled={activeCount === totalAvailableCount}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeCount === totalAvailableCount
                  ? "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
              }`}
            >
              <Download size={14} />
              <span>Install All ({totalAvailableCount})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              aria-label="Close Extensions Marketplace"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Split-Pane Body: Sidebar Navigation + Main Marketplace Viewport */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Category & Bundles Sidebar (Desktop) */}
          <PluginMarketplaceSidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            pluginsMap={pluginsMap}
            activeCount={activeCount}
            installedCount={installedCount}
            totalAvailableCount={totalAvailableCount}
            isPureVoiceMode={isPureVoiceMode}
            activeMemoryKb={activeMemoryKb}
            dormantSavedKb={dormantSavedKb}
            onApplyBundle={onApplyBundle}
            onResetToPureVoiceAgent={onResetToPureVoiceAgent}
          />


          {/* Right Main Content Column */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Sticky Top Filter & Search Bar */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/90 flex flex-col gap-3 shrink-0">
              {/* Top Row: Category Header + Search & Sort Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">
                      {activeCategoryMeta.label}
                    </h3>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      ({filteredPlugins.length})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {activeCategoryMeta.description}
                  </p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative flex-1 sm:w-64">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      id="marketplace-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search extensions or voice commands..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500/60 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
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

                  {/* Sort Order Selector */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
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

              {/* Horizontal Category Filter Pills (Always accessible on Mobile/Tablet & Quick Bar) */}
              <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
                {MAHR_PLUGIN_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = categoryCounts[cat.id] ?? 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-semibold"
                          : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <span>{cat.shortLabel}</span>
                      <span className="text-[10px] font-mono tabular-nums opacity-80">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Marketplace Content Area */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
              {/* Featured Spotlight Banner (shown on 'All' when not searching) */}
              {selectedCategory === "all" && !searchQuery.trim() && (
                <PluginFeaturedSpotlight
                  featuredPlugins={featuredPlugins}
                  pluginsMap={pluginsMap}
                  onInstallPlugin={onInstallPlugin}
                  onOpenPluginFeature={handleLaunchFeature}
                />
              )}

              {/* Filtered Plugin Grid or Empty State */}
              {filteredPlugins.length === 0 ? (
                <div className="py-14 px-4 text-center rounded-2xl border border-slate-800/80 bg-slate-900/30">
                  <p className="text-sm font-semibold text-slate-200 mb-1">
                    {selectedCategory === "installed" && installedCount === 0
                      ? "No extensions installed yet (Pure Voice Agent Mode)"
                      : "No matching extensions found"}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                    {selectedCategory === "installed" && installedCount === 0
                      ? "Your assistant is running in lightweight Pure Voice Mode. Browse Productivity, Research, Visuals, or Utilities to install extensions anytime."
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
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                  {filteredPlugins.map((plugin) => {
                    const isInstalled = isPluginInstalledInMap(
                      pluginsMap,
                      plugin.id
                    );
                    const isEnabled = isPluginActiveInMap(
                      pluginsMap,
                      plugin.id
                    );
                    return (
                      <PluginCardItem
                        key={plugin.id}
                        plugin={plugin}
                        isInstalled={isInstalled}
                        isEnabled={isEnabled}
                        onInstall={onInstallPlugin}
                        onUninstall={onUninstallPlugin}
                        onToggleEnabled={onTogglePluginEnabled}
                        onOpenFeature={handleLaunchFeature}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-800/90 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <div>
            Uninstalled extensions consume zero background sync or UI space, keeping MAHR fast and distraction-free.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-200 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
