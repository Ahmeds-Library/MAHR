import React from "react";
import { Layers, Sparkles, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MemoryConsolidationCluster } from "../layer1_data/hybridVectorTypes";

interface MemoryConsolidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: MemoryConsolidationCluster[];
  isConsolidating: boolean;
  onConsolidateSingleCluster: (cluster: MemoryConsolidationCluster) => Promise<void>;
  onConsolidateAllClusters: () => Promise<void>;
}

export const MemoryConsolidationPanel: React.FC<MemoryConsolidationPanelProps> = ({
  isOpen,
  onClose,
  clusters,
  isConsolidating,
  onConsolidateSingleCluster,
  onConsolidateAllClusters,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b border-white/15 bg-slate-900/95"
        >
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers size={15} className="text-cyan-400" />
                  <span>Cognitive Memory Consolidation Engine</span>
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Synthesizes overlapping Episodic recollections into durable, high-retention Semantic Principles.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {clusters.length > 0 && (
                  <button
                    type="button"
                    disabled={isConsolidating}
                    onClick={onConsolidateAllClusters}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <Sparkles size={13} />
                    <span>
                      {isConsolidating
                        ? "Synthesizing..."
                        : `Consolidate All (${clusters.length})`}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {clusters.length === 0 ? (
              <div className="p-4 rounded-xl border border-white/10 bg-black/30 text-xs font-mono text-slate-300 flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>
                  All semantic clusters are currently consolidated. Add more episodic turns or run Auto-Learn from Journal to discover new clusters.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="p-3.5 rounded-xl border border-white/10 bg-black/40 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
                        <span style={{ color: cluster.clusterColor }} className="font-semibold">
                          {cluster.clusterName}
                        </span>
                        <span>
                          {cluster.sourceMemories.length} Source Nodes ·{" "}
                          {Math.round(cluster.averageSimilarity * 100)}% Cohesion
                        </span>
                      </div>

                      <p className="text-xs text-slate-100 font-sans leading-relaxed">
                        {cluster.synthesizedRulePreview}
                      </p>

                      <div className="text-[11px] font-mono text-slate-400 space-y-1 pt-1 border-t border-white/10">
                        {cluster.sourceMemories.map((sm) => (
                          <div key={sm.id} className="truncate">
                            · {sm.text}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-[11px] font-mono text-emerald-300 tabular-nums">
                        +{cluster.estimatedRetentionGain}% Retention Stability
                      </span>
                      <button
                        type="button"
                        disabled={isConsolidating}
                        onClick={() => onConsolidateSingleCluster(cluster)}
                        className="px-2.5 py-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs font-mono font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Synthesize Principle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
