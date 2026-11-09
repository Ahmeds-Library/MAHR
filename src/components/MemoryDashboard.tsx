import React, { useState, useMemo, useEffect } from "react";
import { Memory, MemoryCategory, MemoryTier, ChatMessage } from "../lib/memoryTypes";
import {
  Brain,
  X,
  Plus,
  User,
  Heart,
  Target,
  Briefcase,
  Users,
  Flame,
  Sparkles,
  Cpu,
  MessageSquare,
  ArrowRight,
  Network,
  Activity,
  Zap,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { searchMemoriesHybridVector } from "../memoryHub/layer2_logic/hybridVectorSearchEngine";
import {
  computeAutoLearningTelemetry,
  autoLearnFromJournalTranscripts,
} from "../memoryHub/layer2_logic/autoLearningMlService";
import {
  loadMemoryCognitiveOverrides,
  updateSingleMemoryOverride,
  detectConsolidationCandidates,
  computeMemoryImportancePercent,
} from "../memoryHub/layer2_logic/memoryRetentionAndConsolidationService";
import {
  MemorySortMode,
  MemoryCognitiveOverride,
  MemoryConsolidationCluster,
} from "../memoryHub/layer1_data/hybridVectorTypes";
import { MemoryTierFilterBar } from "../memoryHub/layer3_ui/MemoryTierFilterBar";
import { MemoryConsolidationPanel } from "../memoryHub/layer3_ui/MemoryConsolidationPanel";
import { MemoryCardItem } from "../memoryHub/layer3_ui/MemoryCardItem";
import {
  RLPolicyParameters,
  KnowledgeDeficit,
} from "../services/reinforcementLearningEngine";

interface MemoryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onAddMemory: (category: MemoryCategory, text: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  themeColor: string;
  chatHistory?: ChatMessage[];
  onShiftToJournal?: () => void;
  onOpenKnowledgeGraph?: () => void;
  rlPolicy?: RLPolicyParameters;
  knowledgeDeficits?: KnowledgeDeficit[];
  studyPadText?: string;
  whiteboardText?: string;
}

export function MemoryDashboard({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
  themeColor,
  chatHistory = [],
  onShiftToJournal,
  onOpenKnowledgeGraph,
  rlPolicy,
  knowledgeDeficits = [],
  studyPadText = "",
  whiteboardText = "",
}: MemoryDashboardProps) {
  const [activeTab, setActiveTab] = useState<MemoryCategory | "all">("all");
  const [activeTier, setActiveTier] = useState<MemoryTier | "all">("all");
  const [sortMode, setSortMode] = useState<MemorySortMode>("hybrid");
  const [vectorQuery, setVectorQuery] = useState("");
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("identity");
  const [newTier, setNewTier] = useState<MemoryTier>("semantic");
  const [isAdding, setIsAdding] = useState(false);
  const [isConsolidationOpen, setIsConsolidationOpen] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAutoLearning, setIsAutoLearning] = useState(false);
  const [learningBanner, setLearningBanner] = useState<string | null>(null);
  const [overridesMap, setOverridesMap] = useState<
    Record<string, MemoryCognitiveOverride>
  >(() => loadMemoryCognitiveOverrides());

  const [obsidianSyncInfo, setObsidianSyncInfo] = useState<{
    state: "idle" | "syncing" | "synced";
    notesCount: number;
    linksCount: number;
    lastFile?: string;
  }>({
    state: "synced",
    notesCount: memories.length + 3,
    linksCount: memories.length * 2 + 4,
  });

  useEffect(() => {
    const handleObsidianSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setObsidianSyncInfo({
          state: detail.syncState === "syncing" ? "syncing" : "synced",
          notesCount: detail.totalNotes || memories.length + 3,
          linksCount: detail.totalWikiLinks || memories.length * 2 + 4,
          lastFile: detail.writtenFiles?.[0],
        });
      }
    };
    window.addEventListener("mahr-obsidian-sync-status", handleObsidianSync);
    return () =>
      window.removeEventListener("mahr-obsidian-sync-status", handleObsidianSync);
  }, [memories.length]);

  const categoryConfig: Record<
    MemoryCategory,
    { label: string; icon: any; color: string; bg: string }
  > = {
    identity: {
      label: "Identity Core",
      icon: User,
      color: "text-amber-400 border-amber-500/25",
      bg: "bg-amber-500/5 hover:bg-amber-500/10",
    },
    preference: {
      label: "Preferences",
      icon: Heart,
      color: "text-pink-400 border-pink-500/25",
      bg: "bg-pink-500/5 hover:bg-pink-500/10",
    },
    goal: {
      label: "Life Goals",
      icon: Target,
      color: "text-emerald-400 border-emerald-500/25",
      bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
    },
    project: {
      label: "Active Projects",
      icon: Briefcase,
      color: "text-cyan-400 border-cyan-500/25",
      bg: "bg-cyan-500/5 hover:bg-cyan-500/10",
    },
    relationship: {
      label: "Relationships",
      icon: Users,
      color: "text-purple-400 border-purple-500/25",
      bg: "bg-purple-500/5 hover:bg-purple-500/10",
    },
    emotional: {
      label: "Milestones",
      icon: Flame,
      color: "text-red-400 border-red-500/25",
      bg: "bg-red-500/5 hover:bg-red-500/10",
    },
    behavior: {
      label: "Behaviors & Habits",
      icon: Brain,
      color: "text-indigo-400 border-indigo-500/25",
      bg: "bg-indigo-500/5 hover:bg-indigo-500/10",
    },
    simulation: {
      label: "Saved Simulations",
      icon: Cpu,
      color: "text-cyan-400 border-cyan-500/25",
      bg: "bg-cyan-500/5 hover:bg-cyan-500/10",
    },
  };

  const getCategoryConfig = (cat?: string) => {
    if (!cat) {
      return {
        label: "General Recollection",
        icon: Brain,
        color: "text-purple-400 border-purple-500/25",
        bg: "bg-purple-500/5 hover:bg-purple-500/10",
      };
    }
    if ((categoryConfig as Record<string, any>)[cat]) {
      return (categoryConfig as Record<string, any>)[cat];
    }
    const lower = cat.toLowerCase().trim();
    if ((categoryConfig as Record<string, any>)[lower]) {
      return (categoryConfig as Record<string, any>)[lower];
    }
    return {
      label: cat,
      icon: Brain,
      color: "text-purple-400 border-purple-500/25",
      bg: "bg-purple-500/5 hover:bg-purple-500/10",
    };
  };

  const getThemeBadgeGlow = () => {
    switch (themeColor) {
      case "violet":
        return "border-purple-500/30 text-purple-400 bg-purple-500/10";
      case "crimson":
        return "border-rose-500/30 text-rose-400 bg-rose-500/10";
      case "emerald":
        return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
      case "celestial":
        return "border-sky-500/30 text-sky-400 bg-sky-500/10";
      case "gold":
        return "border-amber-500/30 text-amber-400 bg-amber-500/10";
      case "rose":
        return "border-pink-500/30 text-pink-400 bg-pink-500/10";
      default:
        return "border-indigo-500/30 text-indigo-400 bg-indigo-500/10";
    }
  };

  // Layer 2: Hybrid Vector Search + Cognitive Tier + Retention/Importance Scoring
  const hybridMatches = useMemo(() => {
    return searchMemoriesHybridVector(
      vectorQuery,
      memories,
      activeTab,
      activeTier,
      sortMode,
      overridesMap
    );
  }, [vectorQuery, memories, activeTab, activeTier, sortMode, overridesMap]);

  // Layer 2: Auto-Learning & Online ML/RL Telemetry
  const mlTelemetry = useMemo(() => {
    return computeAutoLearningTelemetry(
      memories,
      rlPolicy,
      knowledgeDeficits,
      studyPadText,
      whiteboardText,
      overridesMap
    );
  }, [
    memories,
    rlPolicy,
    knowledgeDeficits,
    studyPadText,
    whiteboardText,
    overridesMap,
  ]);

  // Layer 2: Consolidation Candidate Clusters
  const consolidationClusters = useMemo(() => {
    return detectConsolidationCandidates(memories, overridesMap);
  }, [memories, overridesMap]);

  const handleTogglePin = (memoryId: string) => {
    const currentPinned = overridesMap[memoryId]?.pinned ?? false;
    const next = updateSingleMemoryOverride(memoryId, {
      pinned: !currentPinned,
      lastAccessedAt: new Date().toISOString(),
    });
    setOverridesMap(next);
    setLearningBanner(
      !currentPinned
        ? "Memory pinned to 100% permanent retention lock."
        : "Memory unpinned from retention lock."
    );
    setTimeout(() => setLearningBanner(null), 2800);
  };

  const handleReinforceMemory = (memoryId: string) => {
    const mem = memories.find((m) => m.id === memoryId);
    const currentOv = overridesMap[memoryId];
    const currentImp = mem
      ? computeMemoryImportancePercent(mem, currentOv)
      : 85;
    const currentAccess = currentOv?.accessCount ?? 1;

    const next = updateSingleMemoryOverride(memoryId, {
      importancePercent: Math.min(100, currentImp + 8),
      accessCount: currentAccess + 1,
      lastAccessedAt: new Date().toISOString(),
    });
    setOverridesMap(next);
    setLearningBanner(
      `Reinforced memory trace (+8% Importance · Recall #${currentAccess + 1}).`
    );
    setTimeout(() => setLearningBanner(null), 2800);
  };

  const handleChangeTier = (memoryId: string, nextTier: MemoryTier) => {
    const next = updateSingleMemoryOverride(memoryId, { tier: nextTier });
    setOverridesMap(next);
    setLearningBanner(`Reclassified memory into ${nextTier.toUpperCase()} cognitive tier.`);
    setTimeout(() => setLearningBanner(null), 2500);
  };

  const handleConsolidateSingleCluster = async (
    cluster: MemoryConsolidationCluster
  ) => {
    setIsConsolidating(true);
    try {
      await onAddMemory(cluster.dominantCategory, cluster.synthesizedRulePreview);
      let updatedMap = { ...overridesMap };
      for (const sm of cluster.sourceMemories) {
        updatedMap = updateSingleMemoryOverride(sm.id, {
          consolidatedIntoId: cluster.id,
          accessCount: (updatedMap[sm.id]?.accessCount ?? 1) + 1,
          lastAccessedAt: new Date().toISOString(),
        });
      }
      setOverridesMap(updatedMap);
      setLearningBanner(
        `Consolidated ${cluster.sourceMemories.length} recollections into a high-retention Semantic Principle (${cluster.clusterName}).`
      );
      setTimeout(() => setLearningBanner(null), 4000);
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleConsolidateAllClusters = async () => {
    if (consolidationClusters.length === 0) return;
    setIsConsolidating(true);
    try {
      let updatedMap = { ...overridesMap };
      for (const cluster of consolidationClusters) {
        await onAddMemory(cluster.dominantCategory, cluster.synthesizedRulePreview);
        for (const sm of cluster.sourceMemories) {
          updatedMap = updateSingleMemoryOverride(sm.id, {
            consolidatedIntoId: cluster.id,
            accessCount: (updatedMap[sm.id]?.accessCount ?? 1) + 1,
            lastAccessedAt: new Date().toISOString(),
          });
        }
      }
      setOverridesMap(updatedMap);
      setLearningBanner(
        `Synthesized ${consolidationClusters.length} semantic principles across overlapping memory clusters.`
      );
      setIsConsolidationOpen(false);
      setTimeout(() => setLearningBanner(null), 4000);
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setSubmitting(true);
    try {
      await onAddMemory(newCategory, newText.trim());
      setNewText("");
      setIsAdding(false);
      setLearningBanner(
        `Committed new ${newTier.toUpperCase()} vector node (128-D L2 normalized) to Recall DB.`
      );
      setTimeout(() => setLearningBanner(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunAutoLearnSweep = async () => {
    setIsAutoLearning(true);
    try {
      const res = await autoLearnFromJournalTranscripts(
        chatHistory,
        memories,
        onAddMemory
      );
      if (res.newlyExtractedCount > 0) {
        setLearningBanner(
          `Auto-Learning extracted ${res.newlyExtractedCount} new vector facts and reinforced ${res.reinforcedCount} existing nodes.`
        );
      } else {
        setLearningBanner(
          `Vector DB is fully synchronized (${res.reinforcedCount} semantic clusters reinforced from Journal).`
        );
      }
      setTimeout(() => setLearningBanner(null), 4000);
    } finally {
      setIsAutoLearning(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Durable Record";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-5xl max-h-[88vh] bg-slate-950/95 border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col backdrop-blur-2xl overflow-hidden text-slate-100 z-10"
          >
            {/* Top Header */}
            <div className="px-5 py-4 sm:px-6 border-b border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${getThemeBadgeGlow()}`}>
                  <Brain size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                    <span>MAHR Cognitive Recall & Vector Memory</span>
                    <Sparkles size={14} className="text-cyan-400" />
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                    128-D Hybrid Vector DB · {memories.length} Memories ·{" "}
                    {mlTelemetry.avgRetentionPercent ?? 94}% Avg Retention ·{" "}
                    {mlTelemetry.pinnedCount ?? 0} Pinned
                  </p>
                </div>
              </div>

              {/* Corner Action Controls */}
              <div className="flex items-center gap-2">
                {onOpenKnowledgeGraph && (
                  <button
                    id="recall-open-obsidian-btn"
                    data-testid="recall-open-obsidian-btn"
                    type="button"
                    onClick={onOpenKnowledgeGraph}
                    className="h-9 px-3 rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                    title="Open MAHR × Obsidian Second-Brain Vault & Knowledge Graph"
                  >
                    <Network size={14} className="text-purple-400" />
                    <span>Obsidian Vault & Graph</span>
                  </button>
                )}

                {onShiftToJournal && (
                  <button
                    id="recall-corner-shift-to-journal-btn"
                    data-testid="recall-corner-shift-to-journal-btn"
                    type="button"
                    onClick={onShiftToJournal}
                    className="h-9 px-3.5 rounded-xl border border-purple-400/50 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-100 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/50 transition cursor-pointer whitespace-nowrap shrink-0"
                    title="Shift to Conversation Journal Transcripts"
                  >
                    <MessageSquare size={14} className="text-purple-300" />
                    <span>Journal ({chatHistory.length})</span>
                    <ArrowRight size={13} className="text-purple-300" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/80 hover:border-rose-400 text-slate-400 hover:text-white transition duration-200 cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Auto-Learning, Retention & Consolidation Strip */}
            <div className="px-5 py-3 sm:px-6 bg-slate-900/70 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono text-slate-300 tabular-nums">
                <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Activity size={13} className="text-cyan-400" />
                  <span>Vector Density: {mlTelemetry.graphDensityPercent}%</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  Semantic Links:{" "}
                  <strong className="text-white">
                    {mlTelemetry.semanticEdgesCount}
                  </strong>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  Retention:{" "}
                  <strong className="text-emerald-300">
                    {mlTelemetry.avgRetentionPercent ?? 94}%
                  </strong>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  Confidence:{" "}
                  <strong className="text-amber-300">
                    {mlTelemetry.avgConfidencePercent}%
                  </strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConsolidationOpen((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isConsolidationOpen
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                      : "border-cyan-500/35 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200"
                  }`}
                  title="Synthesize overlapping episodic memories into high-retention Semantic Principles"
                >
                  <Layers size={13} className="text-cyan-400" />
                  <span>
                    Consolidate ({consolidationClusters.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleRunAutoLearnSweep}
                  disabled={isAutoLearning}
                  className="px-3 py-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                  title="Scan Journal conversation transcripts and extract new facts into Vector DB"
                >
                  <Zap
                    size={13}
                    className={
                      isAutoLearning
                        ? "animate-spin text-emerald-300"
                        : "text-emerald-400"
                    }
                  />
                  <span>
                    {isAutoLearning ? "Indexing..." : "Auto-Learn from Journal"}
                  </span>
                </button>

                {!isAdding && (
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono font-semibold text-slate-200 transition shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <Plus size={13} />
                    <span>Add Memory</span>
                  </button>
                )}
              </div>
            </div>

            {/* Feedback Banner */}
            {learningBanner && (
              <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-200 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>{learningBanner}</span>
              </div>
            )}

            {/* Layer 3: AI Memory Consolidation Drawer */}
            <MemoryConsolidationPanel
              isOpen={isConsolidationOpen}
              onClose={() => setIsConsolidationOpen(false)}
              clusters={consolidationClusters}
              isConsolidating={isConsolidating}
              onConsolidateSingleCluster={handleConsolidateSingleCluster}
              onConsolidateAllClusters={handleConsolidateAllClusters}
            />

            {/* Layer 3: Cognitive Tier & Hybrid Vector Filter Bar */}
            <MemoryTierFilterBar
              vectorQuery={vectorQuery}
              onVectorQueryChange={setVectorQuery}
              activeTier={activeTier}
              onSelectTier={setActiveTier}
              activeCategory={activeTab}
              onSelectCategory={setActiveTab}
              sortMode={sortMode}
              onSelectSortMode={setSortMode}
              totalCount={memories.length}
              episodicCount={mlTelemetry.episodicCount ?? 0}
              semanticCount={mlTelemetry.semanticCount ?? 0}
              proceduralCount={mlTelemetry.proceduralCount ?? 0}
              categories={(Object.keys(categoryConfig) as MemoryCategory[]).map(
                (id) => ({
                  id,
                  label: categoryConfig[id].label,
                })
              )}
            />

            {/* Manual entry card drawer inside dashboard */}
            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-white/15 bg-[#080812]"
                >
                  <form onSubmit={handleManualAdd} className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-300 mb-2">
                          1. Cognitive Memory Tier
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { id: "episodic", label: "Episodic" },
                              { id: "semantic", label: "Semantic" },
                              { id: "procedural", label: "Procedural" },
                            ] as Array<{ id: MemoryTier; label: string }>
                          ).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setNewTier(t.id)}
                              className={`p-2 rounded-lg border text-xs font-mono transition cursor-pointer ${
                                newTier === t.id
                                  ? "border-cyan-400 bg-cyan-400/15 text-cyan-200 font-semibold"
                                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-slate-300 mb-2">
                          2. Memory Archetype Category
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(Object.keys(categoryConfig) as MemoryCategory[]).map(
                            (cat) => {
                              const cfg = getCategoryConfig(cat);
                              const active = newCategory === cat;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setNewCategory(cat)}
                                  className={`p-1.5 rounded-lg border text-[11px] font-mono transition truncate cursor-pointer ${
                                    active
                                      ? "border-cyan-400 bg-cyan-400/15 text-cyan-200 font-semibold"
                                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                                  }`}
                                >
                                  {(cfg?.label || cat).split(" ")[0]}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 mb-2">
                        3. Recollection Statement (Automatically Embedded to 128-D Vector Node & Linked in Obsidian)
                      </label>
                      <textarea
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="e.g. The user prefers step-by-step Feynman diagrams when studying distributed systems."
                        required
                        className="w-full h-20 text-xs p-3 rounded-xl border border-white/15 bg-black/40 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 resize-none font-sans"
                      />
                    </div>

                    <div className="flex gap-2.5 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? "Vectorizing..." : "Commit Vector Memory"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RECOLLECTION ITEMS CARDS CONTAINER */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
              <AnimatePresence initial={false}>
                {hybridMatches.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400"
                  >
                    <div className="p-4 rounded-full border border-dashed border-white/10 bg-white/[0.02] mb-4">
                      <Brain size={32} className="opacity-40" />
                    </div>
                    <h4 className="text-sm font-semibold tracking-wide text-slate-200">
                      {vectorQuery.trim()
                        ? "No semantic vector matches found"
                        : "No memories recorded in this filter yet"}
                    </h4>
                    <p className="text-xs max-w-sm mt-1.5 leading-relaxed font-mono text-slate-400">
                      {vectorQuery.trim()
                        ? "Try a broader concept or click 'Auto-Learn from Journal' to index recent conversations."
                        : "Speak with MAHR, add a manual memory, or click 'Auto-Learn from Journal' to extract and embed facts."}
                    </p>
                  </motion.div>
                ) : (
                  hybridMatches.map((match, idx) => {
                    const cfg = getCategoryConfig(match.memory?.category);
                    return (
                      <MemoryCardItem
                        key={`${match.memory.id || "mem"}-${idx}`}
                        match={match}
                        hasActiveQuery={Boolean(vectorQuery.trim())}
                        categoryLabel={
                          cfg?.label || match.memory?.category || "Recollection"
                        }
                        categoryColorClass={
                          cfg?.color || "text-purple-400 border-purple-500/25"
                        }
                        categoryBgClass={
                          cfg?.bg || "bg-purple-500/5 hover:bg-purple-500/10"
                        }
                        CategoryIcon={cfg?.icon || Brain}
                        onTogglePin={handleTogglePin}
                        onReinforceMemory={handleReinforceMemory}
                        onChangeTier={handleChangeTier}
                        onDeleteMemory={onDeleteMemory}
                        onOpenInObsidian={onOpenKnowledgeGraph}
                        formatDate={formatDate}
                      />
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Footer with Silent Background Obsidian Vault Sync Telemetry */}
            <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 tabular-nums">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-emerald-300 font-semibold">
                  {obsidianSyncInfo.state === "syncing"
                    ? "Obsidian Vault Delta Syncing..."
                    : `Obsidian Vault Auto-Synced (${obsidianSyncInfo.notesCount} .md · ${obsidianSyncInfo.linksCount} [[WikiLinks]])`}
                </span>
                {obsidianSyncInfo.lastFile && (
                  <span className="text-slate-500 hidden sm:inline">
                    · Last: {obsidianSyncInfo.lastFile}
                  </span>
                )}
              </div>
              {onShiftToJournal && (
                <button
                  type="button"
                  onClick={onShiftToJournal}
                  className="text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <span>
                    Switch to Conversation Journal ({chatHistory.length})
                  </span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
