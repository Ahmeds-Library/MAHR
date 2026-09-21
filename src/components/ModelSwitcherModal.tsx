import React, { useState, useEffect, useMemo } from "react";
import { 
  SUPPORTED_AI_MODELS, 
  AIModelConfig 
} from "../lib/subagentTypes";
import { 
  X, 
  Cpu, 
  CheckCircle2, 
  Sparkles, 
  Database, 
  Zap, 
  BrainCircuit, 
  Clock, 
  Info,
  ShieldCheck,
  Search,
  RotateCw,
  Layers,
  Radio,
  SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../lib/memoryTypes";
import { 
  formatTokenCount, 
  estimateActiveContextTokens,
  LiveTokenStats,
  fetchRealTokenUsage,
  syncRealContextTokens
} from "../lib/tokenUtils";

interface ModelSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelId: string;
  onSelectModel: (modelId: string) => void;
  themeColor?: string;
  chatHistory?: ChatMessage[];
  studyPadText?: string;
  whiteboardText?: string;
}

export function ModelSwitcherModal({
  isOpen,
  onClose,
  activeModelId,
  onSelectModel,
  themeColor = "violet",
  chatHistory = [],
  studyPadText = "",
  whiteboardText = ""
}: ModelSwitcherModalProps) {
  // Live dynamic models state directly from Gemini API
  const [models, setModels] = useState<AIModelConfig[]>(SUPPORTED_AI_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isSyncingTokens, setIsSyncingTokens] = useState<boolean>(false);
  const [modelsSource, setModelsSource] = useState<"api" | "cache" | "default">("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [switchSuccessToast, setSwitchSuccessToast] = useState<string | null>(null);

  const [liveTokenStats, setLiveTokenStats] = useState<LiveTokenStats>({
    sessionTokens: 0,
    promptTokens: 0,
    candidateTokens: 0,
    requestsCount: 0,
    activeContextTokens: 1450,
    modelStats: {}
  });

  // Fetch real models dynamically from the Gemini API
  const fetchLiveModels = async (forceRefresh = false) => {
    setIsLoadingModels(true);
    try {
      const url = forceRefresh ? "/api/models?refresh=true" : "/api/models";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
          setModelsSource(data.source === "gemini-api" ? "api" : "cache");
          try {
            sessionStorage.setItem("myraa_api_models", JSON.stringify(data.models));
          } catch (e) {}
          window.dispatchEvent(new CustomEvent("myraa-models-updated", { detail: { models: data.models } }));
        }
      }
    } catch (err) {
      console.error("Failed to load real models from API:", err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Synchronize real Gemini token telemetry from server
  const handleSyncRealTokens = async () => {
    setIsSyncingTokens(true);
    try {
      const updated = await syncRealContextTokens({
        modelId: activeModelId,
        chatHistory,
        notesText: studyPadText,
        whiteboardText
      });
      if (updated) {
        setLiveTokenStats(updated);
      } else {
        const fallback = await fetchRealTokenUsage();
        if (fallback) setLiveTokenStats(fallback);
      }
    } catch (e) {
      console.warn("Token sync error:", e);
    } finally {
      setIsSyncingTokens(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveModels();
      handleSyncRealTokens();
    }
  }, [isOpen]);

  // Fetch real Gemini token usage stats
  useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/tokens/usage");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setLiveTokenStats(data);
          }
        }
      } catch (e) {}
    };

    fetchUsage();

    const handleUpdate = (e: any) => {
      if (e.detail?.sessionTokens) {
        setLiveTokenStats(e.detail.sessionTokens);
      }
    };
    window.addEventListener("myraa-tokens-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("myraa-tokens-updated", handleUpdate);
    };
  }, []);

  // Calculate real-time context token usage based on genuine text volume
  const algorithmicContextTokens = useMemo(() => {
    return estimateActiveContextTokens(chatHistory, studyPadText, whiteboardText);
  }, [chatHistory, studyPadText, whiteboardText]);

  const activeContextTokens = Math.max(
    algorithmicContextTokens,
    liveTokenStats.activeContextTokens || 1450
  );

  const realUsedTokens = Math.max(liveTokenStats.sessionTokens, activeContextTokens);

  // Find active model from dynamic list
  const currentModel = useMemo(() => {
    return models.find(m => m.id === activeModelId) || 
      SUPPORTED_AI_MODELS.find(m => m.id === activeModelId) || 
      models[0] || 
      SUPPORTED_AI_MODELS[0];
  }, [models, activeModelId]);

  // Available categories based on real models
  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    models.forEach(m => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats);
  }, [models]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        m.name.toLowerCase().includes(q) || 
        m.id.toLowerCase().includes(q) || 
        (m.description && m.description.toLowerCase().includes(q));
      
      const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, searchQuery, selectedCategory]);

  const handleSelect = (model: AIModelConfig) => {
    onSelectModel(model.id);
    const maxTokensFormatted = formatTokenCount(model.inputTokenLimit || model.contextTokens);
    setSwitchSuccessToast(`Active Model Switched: ${model.name} (${maxTokensFormatted} Max Context)`);
    setTimeout(() => {
      setSwitchSuccessToast(null);
    }, 3500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl overflow-hidden bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      AI Model Switcher & Context Manager
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {modelsSource === "api" ? "Live Gemini API" : "Connected"} ({models.length} Models)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time Gemini models fetched live from Google GenAI API with dynamic context limits.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLiveModels(true)}
                  disabled={isLoadingModels}
                  className="p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800/80 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refresh models live from Gemini API"
                >
                  <RotateCw className={`w-4 h-4 ${isLoadingModels ? "animate-spin text-purple-400" : ""}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Model Status Highlight with Real Token Telemetry */}
            <div className="p-4 bg-purple-950/40 border-b border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ring-4 ring-emerald-500/20" />
                <div>
                  <div className="text-xs text-purple-300 font-medium flex items-center gap-2">
                    <span>Currently Active Gemini Engine</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                      Live Telemetry
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap mt-0.5">
                    <span>{currentModel.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                      {formatTokenCount(currentModel.inputTokenLimit || currentModel.contextTokens)} Context Max
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {currentModel.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real Telemetry Numbers Breakdown */}
              <div className="flex items-center gap-3 self-start md:self-auto bg-slate-950/60 px-3 py-2 rounded-xl border border-purple-500/30 font-mono">
                <div className="text-right text-xs">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-cyan-300 font-bold text-sm">
                      {activeContextTokens.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-[11px]">active context</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1.5 mt-0.5 flex-wrap">
                    <span>Total: <strong className="text-purple-300">{realUsedTokens.toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>In: <strong className="text-slate-300">{liveTokenStats.promptTokens.toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>Out: <strong className="text-slate-300">{liveTokenStats.candidateTokens.toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>Calls: <strong className="text-emerald-400">{liveTokenStats.requestsCount}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncRealTokens}
                  disabled={isSyncingTokens}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    isSyncingTokens
                      ? "bg-purple-900/40 border-purple-500/50 text-purple-300"
                      : "bg-purple-900/20 hover:bg-purple-800/40 border-purple-500/30 text-purple-300 hover:text-white"
                  }`}
                  title="Synchronize live context tokens directly with Google Gemini API"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSyncingTokens ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {switchSuccessToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{switchSuccessToast}</span>
              </motion.div>
            )}

            {/* Search and Category Filter Bar */}
            <div className="px-5 pt-3 pb-2 border-b border-slate-800/80 flex flex-col gap-2.5 bg-slate-900/50">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search live models by name, ID (e.g. 3.8, flash, pro, gemma)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-900/40 font-bold"
                        : "bg-slate-800/60 text-slate-300 border-slate-700/40 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Models Grid (Targeted Element div:nth-of-type(3)) */}
            <div 
              id="myraa-models-list-grid"
              className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar"
            >
              {filteredModels.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Cpu className="w-8 h-8 text-slate-600 animate-pulse" />
                  <p className="text-sm">No models matching &quot;{searchQuery}&quot;</p>
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                    className="text-xs text-purple-400 hover:underline"
                  >
                    Clear search filters
                  </button>
                </div>
              ) : (
                filteredModels.map((model) => {
                  const isActive = model.id === activeModelId;
                  const maxTokens = Number(model.inputTokenLimit || model.contextTokens) || 1048576;
                  const cleanId = model.id.replace(/^models\//, "");
                  const modelStat = liveTokenStats.modelStats?.[cleanId];
                  const modelTokensCount = modelStat?.totalTokens || 0;
                  
                  // Effective active context required by this engine
                  const effectiveTokens = activeContextTokens;
                  const remainingTokens = Math.max(0, maxTokens - effectiveTokens);
                  const usedPercent = ((effectiveTokens / maxTokens) * 100).toFixed(2);
                  const remainingPercent = (maxTokens > 0 && Number.isFinite(remainingTokens))
                    ? Math.max(0, Math.min(100, (remainingTokens / maxTokens) * 100)).toFixed(1)
                    : "100.0";

                  return (
                    <div
                      key={model.id}
                      onClick={() => handleSelect(model)}
                      className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-3 ${
                        isActive
                          ? "bg-purple-950/50 border-purple-500/80 ring-1 ring-purple-500/50 shadow-xl shadow-purple-950/60"
                          : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600/80"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`p-2.5 rounded-xl border shrink-0 mt-0.5 transition-colors ${
                              isActive
                                ? "bg-purple-500/25 text-purple-300 border-purple-500/50"
                                : "bg-slate-700/40 text-slate-400 border-slate-600/40 group-hover:text-purple-300 group-hover:border-purple-500/30"
                            }`}
                          >
                            {model.id.includes("pro") ? (
                              <BrainCircuit className="w-5 h-5" />
                            ) : model.id.includes("thinking") || model.id.includes("3.8") ? (
                              <Sparkles className="w-5 h-5" />
                            ) : model.id.includes("gemma") ? (
                              <Layers className="w-5 h-5" />
                            ) : (
                              <Zap className="w-5 h-5" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-base tracking-wide">
                                {model.name}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                                  model.badgeColor || "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                }`}
                              >
                                {model.tag || `${formatTokenCount(maxTokens)} Context`}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {model.id}
                              </span>
                              {model.isRecommendedForLongChats && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" /> Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-normal">
                              {model.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/40">
                          <div className="text-right font-mono">
                            <div className="text-xs font-bold text-purple-300 flex items-center justify-end gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${Number(remainingPercent) > 20 ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
                              <span>{formatTokenCount(remainingTokens)} Rem ({remainingPercent}%)</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 flex-wrap">
                              <span className="text-cyan-300 font-semibold">{effectiveTokens.toLocaleString()} Active</span>
                              <span>/</span>
                              <span>{formatTokenCount(maxTokens)} Max</span>
                            </div>
                            {modelTokensCount > 0 && (
                              <div className="text-[9px] text-emerald-400/90 flex items-center justify-end gap-1 mt-0.5">
                                <span>⚡ {modelTokensCount.toLocaleString()} tokens ({modelStat?.requestsCount || 1} calls)</span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(model);
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-150 shrink-0 cursor-pointer ${
                              isActive
                                ? "bg-purple-500 text-white shadow-md shadow-purple-500/40 ring-1 ring-purple-300"
                                : "bg-slate-700 text-slate-200 hover:bg-purple-600 hover:text-white"
                            }`}
                          >
                            {isActive ? "ACTIVE" : "SELECT"}
                          </button>
                        </div>
                      </div>

                      {/* Real-time Context Capacity Progress Bar */}
                      <div className="w-full bg-slate-900/90 rounded-full h-1.5 overflow-hidden border border-purple-500/20">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            Number(remainingPercent) > 30
                              ? "bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400"
                              : "bg-gradient-to-r from-amber-500 to-rose-500"
                          }`}
                          style={{ width: `${remainingPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Info */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Active Model: <strong className="text-purple-300">{currentModel.name}</strong> • Real Context: <strong className="text-white">{formatTokenCount(currentModel.inputTokenLimit || currentModel.contextTokens)} tokens</strong> with persistent memory.
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors shrink-0 cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
