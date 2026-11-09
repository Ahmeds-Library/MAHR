/**
 * Layer 3 (Presentation Component):
 * Real-Time GSAP Hot-Swap Status Toast & Live Memory Footprint Indicator.
 * Appears whenever a user hot-swaps a plugin ON/OFF, installs/uninstalls an extension,
 * or resets to Pure Voice Agent mode.
 */

import React, { useEffect, useRef } from "react";
import { Zap, PowerOff, Mic, X, HardDrive } from "lucide-react";
import gsap from "gsap";
import { HotSwapEvent } from "../layer1_data/pluginTypes";

export interface PluginHotSwapToastProps {
  event: HotSwapEvent | null;
  onDismiss: () => void;
}

export const PluginHotSwapToast: React.FC<PluginHotSwapToastProps> = ({
  event,
  onDismiss,
}) => {
  const toastRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!event || !toastRef.current) return;

    const el = toastRef.current;
    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { opacity: 0, y: 18, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.26,
        ease: "power3.out",
      }
    );

    const timer = setTimeout(() => {
      if (!toastRef.current) {
        onDismiss();
        return;
      }
      gsap.to(toastRef.current, {
        opacity: 0,
        y: 10,
        scale: 0.97,
        duration: 0.18,
        ease: "power2.in",
        onComplete: onDismiss,
      });
    }, 3400);

    return () => clearTimeout(timer);
  }, [event, onDismiss]);

  if (!event) return null;

  const isInjected =
    event.action === "installed" ||
    event.action === "enabled" ||
    event.action === "bundle-applied";
  const isPureVoiceReset = event.action === "reset-pure-voice";

  const deltaText =
    event.deltaKb > 0
      ? `+${event.deltaKb} KB Mounted`
      : event.deltaKb < 0
      ? `${event.deltaKb} KB Freed`
      : "0 KB Delta";

  return (
    <div
      ref={toastRef}
      id="plugin-hot-swap-toast"
      data-testid="plugin-hot-swap-toast"
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[135] max-w-md w-[calc(100vw-2.5rem)] sm:w-auto pointer-events-auto"
    >
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-2xl shadow-2xl ${
          isPureVoiceReset
            ? "bg-slate-950/95 border-cyan-500/45 text-slate-100"
            : isInjected
            ? "bg-slate-950/95 border-emerald-500/45 text-slate-100"
            : "bg-slate-950/95 border-amber-500/45 text-slate-100"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
            isPureVoiceReset
              ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-300"
              : isInjected
              ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
              : "bg-amber-500/15 border-amber-500/35 text-amber-300"
          }`}
        >
          {isPureVoiceReset ? (
            <Mic size={15} />
          ) : isInjected ? (
            <Zap size={15} />
          ) : (
            <PowerOff size={15} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono tabular-nums">
            <span
              className={
                isPureVoiceReset
                  ? "text-cyan-300 font-semibold"
                  : isInjected
                  ? "text-emerald-300 font-semibold"
                  : "text-amber-300 font-semibold"
              }
            >
              {isPureVoiceReset
                ? "Pure Voice Mode Restored"
                : isInjected
                ? "Hot-Swapped In"
                : "Hot-Swapped Off"}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-300 font-semibold">{deltaText}</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-400 inline-flex items-center gap-1">
              <HardDrive size={11} className="text-cyan-400" />
              {event.activeMemoryKb === 0
                ? "0 KB Extra Loaded"
                : `${event.activeMemoryKb} KB Active`}
            </span>
          </div>

          <p className="text-xs font-semibold text-white mt-0.5 truncate">
            {isPureVoiceReset
              ? "All optional extensions unmounted from memory."
              : isInjected
              ? `${event.pluginName} injected into Dock & Workspace`
              : `${event.pluginName} unmounted (0 KB dormant footprint)`}
          </p>

          {event.ejectedActiveWorkspace && (
            <p className="text-[11px] text-cyan-300 font-mono mt-0.5">
              Active studio closed · Smoothly transitioned to Voice Orb
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
