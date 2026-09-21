import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Wand2, CheckCircle2, ShieldCheck, RefreshCw, Trash2, Layers } from "lucide-react";
import { DeduplicationReport } from "../services/slateDeduplicationService";

export interface SlateDeduplicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoDeduplicateActive: boolean;
  onToggleAutoDeduplicate: (active: boolean) => void;
  onRunManualPass: () => void;
  report: DeduplicationReport | null;
  currentSlateCount: number;
}

export const SlateDeduplicatorModal: React.FC<SlateDeduplicatorModalProps> = ({
  isOpen,
  onClose,
  isAutoDeduplicateActive,
  onToggleAutoDeduplicate,
  onRunManualPass,
  report,
  currentSlateCount,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.94, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 16 }}
          className="relative w-full max-w-lg bg-[#060610]/95 border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.2)] flex flex-col gap-5 text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                <Sparkles size={20} className="animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  Visual Slate Deduplicator
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 font-sans font-normal">
                    Background Tool
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated background pruning for concise, uncluttered chalkboard mind maps
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Real-time Status & Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-white/10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={isAutoDeduplicateActive ? "text-emerald-400" : "text-slate-500"} />
                <span className="text-xs font-semibold font-mono text-slate-200">
                  Mind Map Auto-Deduplication
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatically scans and prunes duplicate nodes and redundant connector arcs when a new mind map is generated.
              </p>
            </div>

            <button
              onClick={() => onToggleAutoDeduplicate(!isAutoDeduplicateActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAutoDeduplicateActive ? "bg-purple-600" : "bg-slate-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAutoDeduplicateActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Telemetry & Metrics Card */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} /> Slate Telemetry
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-cyan-300 border border-cyan-500/30">
                {currentSlateCount} Active Canvas Shapes
              </span>
            </div>

            {report ? (
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">Pruned Duplicates</span>
                  <span className="text-lg font-bold font-mono text-purple-300">
                    {report.removedCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">Connectors Pruned</span>
                  <span className="text-lg font-bold font-mono text-cyan-300">
                    {report.edgeDuplicatesRemoved}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">Text Nodes Cleaned</span>
                  <span className="text-lg font-bold font-mono text-emerald-300">
                    {report.textDuplicatesRemoved}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No deduplication pass executed yet for this session. Generating or loading a mind map will activate the automated background pass.
              </p>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[11px] text-slate-400">
              Keeps visual chalkboard concise and high-clarity.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRunManualPass();
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold flex items-center gap-2 transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                <Wand2 size={14} />
                <span>Run Deduplication Now</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
