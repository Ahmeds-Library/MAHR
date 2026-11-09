/**
 * Layer 3 (Presentation Component):
 * Featured Extension Spotlight Banner inside the MAHR Plugin Marketplace Modal.
 * Highlights flagship extensions across Productivity, Research, Visuals, and Utilities
 * with 1-click install, direct launch, and interactive spotlight switching.
 */

import React, { useState } from "react";
import {
  Sparkles,
  Download,
  ExternalLink,
  Check,
  PenTool,
  BookOpen,
  Bot,
  Calendar,
  Orbit,
  Building2,
  Puzzle,
  Mic,
} from "lucide-react";
import {
  InstalledPluginsMap,
  MahrPluginDefinition,
  MahrPluginId,
} from "../layer1_data/pluginTypes";
import {
  isPluginActiveInMap,
  isPluginInstalledInMap,
} from "../layer2_logic/pluginStorageService";

export interface PluginFeaturedSpotlightProps {
  featuredPlugins: MahrPluginDefinition[];
  pluginsMap: InstalledPluginsMap;
  onInstallPlugin: (id: MahrPluginId) => void;
  onOpenPluginFeature?: (id: MahrPluginId) => void;
}

const SPOTLIGHT_ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  PenTool,
  BookOpen,
  Bot,
  Calendar,
  Orbit,
  Building2,
};

export const PluginFeaturedSpotlight: React.FC<PluginFeaturedSpotlightProps> = ({
  featuredPlugins,
  pluginsMap,
  onInstallPlugin,
  onOpenPluginFeature,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!featuredPlugins.length) return null;

  const safeIndex = activeIndex % featuredPlugins.length;
  const activePlugin = featuredPlugins[safeIndex];
  const isInstalled = isPluginInstalledInMap(pluginsMap, activePlugin.id);
  const isEnabled = isPluginActiveInMap(pluginsMap, activePlugin.id);
  const IconComp = SPOTLIGHT_ICON_MAP[activePlugin.iconName] || Puzzle;

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/95 via-slate-900/75 to-slate-950 p-5 overflow-hidden">
      {/* Subtle Ambient Accent Glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-500"
        style={{ backgroundColor: activePlugin.accentColor }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Spotlight Content */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
              <Sparkles size={13} className="text-amber-400" />
              <span>Featured Spotlight</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span
              className="font-semibold"
              style={{ color: activePlugin.accentColor }}
            >
              {activePlugin.featuredBadge || activePlugin.categoryLabel}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-400 tabular-nums">
              v{activePlugin.version}
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/15 shadow-inner"
              style={{
                backgroundColor: `${activePlugin.accentColor}20`,
                color: activePlugin.accentColor,
              }}
            >
              <IconComp size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {activePlugin.name}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                {activePlugin.description}
              </p>
            </div>
          </div>

          {/* Highlighted Capabilities Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
            {activePlugin.capabilities.map((cap, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs text-slate-300"
              >
                <Check
                  size={13}
                  className="shrink-0"
                  style={{ color: activePlugin.accentColor }}
                />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Spotlight Actions & Selector */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Mic size={12} className="text-cyan-400 shrink-0" />
            <span>
              Say: &ldquo;Open {activePlugin.shortTitle.toLowerCase()}&rdquo;
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isInstalled ? (
              <button
                type="button"
                onClick={() => onInstallPlugin(activePlugin.id)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
              >
                <Download size={14} />
                <span>Install Featured Add-on</span>
              </button>
            ) : (
              <>
                <span className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <Check size={13} />
                  <span>{isEnabled ? "Installed & Active" : "Installed"}</span>
                </span>
                {isEnabled && onOpenPluginFeature && (
                  <button
                    type="button"
                    onClick={() => onOpenPluginFeature(activePlugin.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ExternalLink size={13} />
                    <span>Launch</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Quick Switcher Tabs for Featured Extensions */}
      <div className="relative z-10 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-mono text-slate-400 shrink-0">
          Spotlight Picks:
        </span>
        <div className="flex items-center gap-1.5">
          {featuredPlugins.map((fp, idx) => {
            const isSelected = idx === safeIndex;
            const installed = isPluginInstalledInMap(pluginsMap, fp.id);
            return (
              <button
                key={fp.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-white/15 text-white border border-white/25"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: fp.accentColor }}
                />
                <span>{fp.shortTitle}</span>
                {installed && (
                  <Check size={11} className="text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
