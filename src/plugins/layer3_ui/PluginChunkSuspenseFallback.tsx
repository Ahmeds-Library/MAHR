/**
 * Layer 3 (Presentation Component):
 * Lightweight Suspense Fallback shown briefly when an on-demand plugin chunk
 * is dynamically loaded into memory for the first time.
 */

import React from "react";
import { Cpu } from "lucide-react";

export interface PluginChunkSuspenseFallbackProps {
  label?: string;
}

export const PluginChunkSuspenseFallback: React.FC<
  PluginChunkSuspenseFallbackProps
> = ({ label = "Mounting extension chunk..." }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[115] pointer-events-none flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/35 text-xs font-mono text-cyan-200 shadow-xl backdrop-blur-xl"
    >
      <Cpu size={14} className="text-cyan-400 animate-spin shrink-0" />
      <span>{label}</span>
    </div>
  );
};
