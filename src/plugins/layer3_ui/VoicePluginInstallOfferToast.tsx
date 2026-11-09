/**
 * Layer 3 (Presentation Component):
 * Polite 1-Click Voice Plugin Install Offer Toast.
 * Appears when the user asks MAHR (via voice or shortcut) to use a feature
 * whose extension is not yet installed.
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Puzzle, Download, X, Sparkles } from "lucide-react";
import { PendingVoicePluginPrompt } from "../layer1_data/pluginTypes";
import { getPluginDefinitionById } from "../layer1_data/pluginCatalog";

export interface VoicePluginInstallOfferToastProps {
  prompt: PendingVoicePluginPrompt | null;
  onDismiss: () => void;
  onOpenMarketplace: () => void;
}

export const VoicePluginInstallOfferToast: React.FC<VoicePluginInstallOfferToastProps> = ({
  prompt,
  onDismiss,
  onOpenMarketplace,
}) => {
  const pluginDef = prompt ? getPluginDefinitionById(prompt.pluginId) : undefined;

  return (
    <AnimatePresence>
      {prompt && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-36 sm:bottom-40 left-1/2 -translate-x-1/2 z-[115] w-[92vw] max-w-md p-4 rounded-2xl bg-slate-950/95 border border-slate-700/90 backdrop-blur-2xl shadow-2xl text-slate-100 pointer-events-auto"
        >
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                style={{
                  backgroundColor: `${pluginDef?.accentColor || "#06b6d4"}20`,
                  color: pluginDef?.accentColor || "#06b6d4",
                }}
              >
                <Puzzle size={18} />
              </div>
              <div>
                <div className="text-[11px] text-cyan-400 font-mono">
                  Optional Extension Needed
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {prompt.pluginName}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss extension offer"
            >
              <X size={15} />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3.5">
            {pluginDef?.tagline ||
              "This feature is packaged as an optional add-on to keep your voice agent lightweight."}
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                onDismiss();
                onOpenMarketplace();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Browse All Add-ons
            </button>

            <button
              type="button"
              onClick={prompt.onConfirmInstallAndRun}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download size={13} />
              <span>1-Click Install & Open</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
