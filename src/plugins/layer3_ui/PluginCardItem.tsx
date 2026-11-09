/**
 * Layer 3 (Presentation Component):
 * Individual Extension / Add-on Card inside the MAHR Extensions Marketplace.
 * Features real-time Hot-Swap ON/OFF toggle and live memory chunk telemetry.
 */

import React, { useState, useRef } from "react";
import {
  PenTool,
  BookOpen,
  Bot,
  Calendar,
  GraduationCap,
  Presentation,
  Orbit,
  Brain,
  MessageSquare,
  Network,
  Building2,
  Cpu,
  Monitor,
  Sparkles,
  BrainCircuit,
  Puzzle,
  Check,
  Download,
  Trash2,
  ExternalLink,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { MahrPluginDefinition, MahrPluginId } from "../layer1_data/pluginTypes";

export interface PluginCardItemProps {
  plugin: MahrPluginDefinition;
  isInstalled: boolean;
  isEnabled: boolean;
  onInstall: (id: MahrPluginId) => void;
  onUninstall: (id: MahrPluginId) => void;
  onToggleEnabled: (id: MahrPluginId) => void;
  onOpenFeature?: (id: MahrPluginId) => void;
}

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  PenTool,
  BookOpen,
  Bot,
  Calendar,
  GraduationCap,
  Presentation,
  Orbit,
  Brain,
  MessageSquare,
  Network,
  Building2,
  Cpu,
  Monitor,
  Sparkles,
  BrainCircuit,
};

export const PluginCardItem: React.FC<PluginCardItemProps> = ({
  plugin,
  isInstalled,
  isEnabled,
  onInstall,
  onUninstall,
  onToggleEnabled,
  onOpenFeature,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const IconComponent = ICON_MAP[plugin.iconName] || Puzzle;

  const animateCardHotSwap = () => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { scale: 0.985 },
      {
        scale: 1,
        duration: 0.22,
        ease: "power2.out",
        clearProps: "transform",
      }
    );
  };

  const handleInstallClick = () => {
    setIsInstalling(true);
    animateCardHotSwap();
    setTimeout(() => {
      onInstall(plugin.id);
      setIsInstalling(false);
    }, 150);
  };

  const handleHotSwapToggle = () => {
    animateCardHotSwap();
    onToggleEnabled(plugin.id);
  };

  return (
    <div
      ref={cardRef}
      data-plugin-card={plugin.id}
      className={`group relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-200 ${
        isInstalled && isEnabled
          ? "bg-slate-900/90 border-slate-700/90 shadow-sm"
          : isInstalled && !isEnabled
          ? "bg-slate-950/75 border-slate-800/80 opacity-85"
          : "bg-slate-950/60 border-slate-800/70 hover:border-slate-700 hover:bg-slate-900/40"
      }`}
    >
      <div>
        {/* Top Row: Icon, Title, and Unboxed Metadata with Live Memory Footprint */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
              style={{
                backgroundColor: `${plugin.accentColor}18`,
                color: plugin.accentColor,
              }}
            >
              <IconComponent size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums mb-0.5">
                <span style={{ color: plugin.accentColor }} className="font-medium">
                  {plugin.categoryLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>~{plugin.estimatedChunkKb} KB</span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    isInstalled && isEnabled
                      ? "text-emerald-400 font-semibold"
                      : isInstalled
                      ? "text-amber-400 font-medium"
                      : "text-cyan-400/90"
                  }
                >
                  {isInstalled && isEnabled
                    ? `Mounted (${plugin.estimatedChunkKb} KB)`
                    : isInstalled
                    ? "Unmounted (0 KB)"
                    : "0 KB Dormant"}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 leading-snug truncate">
                {plugin.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300/90 leading-relaxed mb-4">
          {plugin.description}
        </p>

        {/* Capabilities List */}
        <div className="pt-3 border-t border-slate-800/80 mb-4 space-y-1.5">
          {plugin.capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <Check
                size={13}
                className="shrink-0"
                style={{ color: plugin.accentColor }}
              />
              <span className="truncate">{cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer with Real-Time Hot-Swap Controls */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400 font-mono truncate">
          Voice: &ldquo;Open {plugin.shortTitle.toLowerCase()}&rdquo;
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isInstalled ? (
            <button
              type="button"
              data-testid={`plugin-install-${plugin.id}`}
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-3.5 py-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download size={13} />
              <span>{isInstalling ? "Mounting..." : "Install Add-on"}</span>
            </button>
          ) : (
            <>
              {isEnabled && onOpenFeature && (
                <button
                  type="button"
                  data-testid={`plugin-open-${plugin.id}`}
                  onClick={() => onOpenFeature(plugin.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600/70 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title={`Open ${plugin.shortTitle}`}
                >
                  <ExternalLink size={12} />
                  <span>Open</span>
                </button>
              )}

              {/* Real-Time Hot-Swap Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                data-testid={`plugin-hotswap-${plugin.id}`}
                onClick={handleHotSwapToggle}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isEnabled
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25"
                    : "bg-slate-900 text-amber-300 border-amber-500/35 hover:bg-amber-500/15"
                }`}
                title={
                  isEnabled
                    ? "Hot-Swap OFF: Immediately eject from UI and free memory without page reload"
                    : "Hot-Swap ON: Immediately inject into UI and mount chunk without page reload"
                }
              >
                <Zap
                  size={12}
                  className={isEnabled ? "text-emerald-400" : "text-amber-400"}
                />
                <span>{isEnabled ? "Hot-Swap ON" : "Hot-Swap OFF"}</span>
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isEnabled ? "bg-emerald-400" : "bg-amber-400/60"
                  }`}
                />
              </button>

              <button
                type="button"
                data-testid={`plugin-uninstall-${plugin.id}`}
                onClick={() => {
                  animateCardHotSwap();
                  onUninstall(plugin.id);
                }}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer shrink-0"
                title="Uninstall extension and free chunk"
                aria-label={`Uninstall ${plugin.name}`}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

