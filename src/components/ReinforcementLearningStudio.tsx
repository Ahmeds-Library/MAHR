import React, { useState } from "react";
import { 
  RLPolicyParameters, 
  KnowledgeDeficit, 
  updateRLPolicy, 
  saveKnowledgeDeficits 
} from "../services/reinforcementLearningEngine";
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  Plus, 
  Trash2, 
  Clock, 
  Sliders, 
  Tag, 
  ArrowRight,
  ShieldAlert,
  Flame,
  Heart,
  Activity,
  Smile,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReinforcementLearningStudioProps {
  isOpen: boolean;
  onClose: () => void;
  policy: RLPolicyParameters;
  onUpdatePolicy: (newPolicy: RLPolicyParameters) => void;
  deficits: KnowledgeDeficit[];
  onUpdateDeficits: (deficits: KnowledgeDeficit[]) => void;
  themeColor: string;
  onTeachMahrPhrase?: (topic: string, advice: string) => void;
  onResolveDeficit?: (id: string, notes: string) => void;
  onDeleteDeficit?: (id: string) => void;
}

export const ReinforcementLearningStudio: React.FC<ReinforcementLearningStudioProps> = ({
  isOpen,
  onClose,
  policy,
  onUpdatePolicy,
  deficits,
  onUpdateDeficits,
  themeColor,
  onTeachMahrPhrase,
  onResolveDeficit,
  onDeleteDeficit
}) => {
  const [activeTab, setActiveTab] = useState<"policy" | "deficits" | "empathy">("empathy");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "resolved">("all");
  const [isAddingDeficit, setIsAddingDeficit] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newSuggestedAction, setNewSuggestedAction] = useState("");
  const [newSeverity, setNewSeverity] = useState<"low" | "medium" | "high">("medium");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  if (!isOpen) return null;

  const handleManualReward = (amount: number, reason: string) => {
    const next = updateRLPolicy(policy, amount, "general");
    onUpdatePolicy(next);
  };

  const handleCreateDeficit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    const newDef: KnowledgeDeficit = {
      id: "def_" + Math.random().toString(36).substring(2, 10),
      topic: newTopic.trim(),
      userPrompt: "Manually registered by TECH during review",
      reason: newReason.trim() || "Identified during session as an area needing explicit external teaching.",
      suggestedAction: newSuggestedAction.trim() || "Provide reference code, documentation, or verbal guidance.",
      status: "open",
      severity: newSeverity,
      createdAt: new Date().toISOString(),
      tags: ["user-flagged", "growth-need"]
    };

    const updated = [newDef, ...deficits];
    onUpdateDeficits(updated);
    saveKnowledgeDeficits(updated);
    setNewTopic("");
    setNewReason("");
    setNewSuggestedAction("");
    setIsAddingDeficit(false);
  };

  const handleMarkResolved = (id: string) => {
    const updated = deficits.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          status: "resolved" as const,
          resolvedAt: new Date().toISOString(),
          resolutionNotes: resolutionText.trim() || "Resolved and assimilated with user guidance."
        };
      }
      return d;
    });

    onUpdateDeficits(updated);
    saveKnowledgeDeficits(updated);
    setResolvingId(null);
    setResolutionText("");
  };

  const handleDeleteDeficit = (id: string) => {
    const updated = deficits.filter((d) => d.id !== id);
    onUpdateDeficits(updated);
    saveKnowledgeDeficits(updated);
  };

  const filteredDeficits = deficits.filter((d) => {
    if (filterStatus === "open") return d.status === "open" || d.status === "in_progress";
    if (filterStatus === "resolved") return d.status === "resolved";
    return true;
  });

  const openCount = deficits.filter((d) => d.status === "open" || d.status === "in_progress").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/15 bg-[#090b14] text-slate-100 shadow-2xl overflow-hidden font-sans"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Mahr Self-Improvement & RL Lab
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Online Learning Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Adaptive Reinforcement Learning policy weights and Unresolved Knowledge Deficits journal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/10 bg-black/40">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("deficits")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === "deficits"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Unresolved Deficits & Growth</span>
              {openCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {openCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("policy")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === "policy"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>RL Policy Weights</span>
            </button>

            <button
              onClick={() => setActiveTab("empathy")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                activeTab === "empathy"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Empathy Score & Resonance</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {policy.empathyScore || 88}%
              </span>
            </button>
          </div>

          {activeTab === "deficits" && (
            <button
              onClick={() => setIsAddingDeficit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>LOG DEFICIT / WEAKNESS</span>
            </button>
          )}
        </div>

        {/* Tab contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "deficits" ? (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">STATUS FILTER:</span>
                  {(["all", "open", "resolved"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2.5 py-1 rounded text-xs font-mono uppercase transition cursor-pointer ${
                        filterStatus === st
                          ? "bg-white text-slate-950 font-bold"
                          : "bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Total Recorded: {deficits.length}
                </span>
              </div>

              {/* Add form modal / drawer */}
              <AnimatePresence>
                {isAddingDeficit && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateDeficit}
                    className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Log Point MAHR Could Not Self-Improve
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingDeficit(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-slate-300 block mb-1">
                          TOPIC / UNRESOLVED CONCEPT *
                        </label>
                        <input
                          type="text"
                          required
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          placeholder="e.g. Next.js App Router Server Actions"
                          className="w-full text-xs p-2 rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-300 block mb-1">
                          SEVERITY / BOTTLENECK LEVEL
                        </label>
                        <select
                          value={newSeverity}
                          onChange={(e: any) => setNewSeverity(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="low">Low (Minor nuance or stylistic)</option>
                          <option value="medium">Medium (Missing factual depth / logic)</option>
                          <option value="high">High (Severe error or lack of access)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        WHY COULDN'T MAHR SOLVE OR KNOW THIS?
                      </label>
                      <input
                        type="text"
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        placeholder="e.g. Lacks private repo access or gave incorrect syntax"
                        className="w-full text-xs p-2 rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">
                        SUGGESTED ACTION / GUIDANCE FOR TECH
                      </label>
                      <input
                        type="text"
                        value={newSuggestedAction}
                        onChange={(e) => setNewSuggestedAction(e.target.value)}
                        placeholder="e.g. Teach MAHR the correct API schema or upload documentation file"
                        className="w-full text-xs p-2 rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingDeficit(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition"
                      >
                        Save Growth Deficit
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* List of deficits */}
              {filteredDeficits.length === 0 ? (
                <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-300">
                    No unresolved deficits in this view
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-mono">
                    Whenever MAHR recognizes that she lacks capability or makes a mistake during your dialogue, she will autonomously log it here for recall and mutual study!
                  </p>
                </div>
              ) : (
                filteredDeficits.map((def) => {
                  const isResolved = def.status === "resolved";
                  const isResolving = resolvingId === def.id;

                  return (
                    <div
                      key={def.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isResolved
                          ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                          : def.severity === "high"
                          ? "border-rose-500/30 bg-rose-500/[0.04]"
                          : "border-amber-500/25 bg-amber-500/[0.03]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {isResolved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${def.severity === "high" ? "text-rose-400" : "text-amber-400"}`} />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-white tracking-wide">
                                {def.topic}
                              </h4>
                              <span
                                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                  isResolved
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : def.severity === "high"
                                    ? "bg-rose-500/20 text-rose-300"
                                    : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {isResolved ? "RESOLVED" : `${def.severity} priority`}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                              <span className="text-slate-400 font-mono text-[10px] uppercase">Why MAHR couldn't solve: </span>
                              {def.reason}
                            </p>

                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                              <span className="text-emerald-400/80 font-mono text-[10px] uppercase">Suggested Action: </span>
                              {def.suggestedAction}
                            </p>

                            {isResolved && def.resolutionNotes && (
                              <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                                <span className="font-mono text-[10px] uppercase block text-emerald-400 font-bold">Assimilated Resolution:</span>
                                {def.resolutionNotes}
                              </div>
                            )}

                            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                              <span>Logged: {new Date(def.createdAt).toLocaleDateString()}</span>
                              {def.resolvedAt && (
                                <span>Resolved: {new Date(def.resolvedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isResolved && (
                            <button
                              onClick={() => setResolvingId(isResolving ? null : def.id)}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono hover:bg-emerald-500/30 transition cursor-pointer"
                            >
                              {isResolving ? "Cancel" : "Teach / Resolve"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDeficit(def.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Teach / Resolve drawer */}
                      {isResolving && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                          <label className="text-[10px] font-mono text-slate-300 block">
                            EXPLAIN THE SOLUTION / TEACH MAHR:
                          </label>
                          <textarea
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            placeholder="Write what MAHR should remember or how this is solved..."
                            className="w-full text-xs p-2.5 rounded-lg bg-black/60 border border-white/15 text-white focus:outline-none focus:border-emerald-400 resize-none h-16 font-sans"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleMarkResolved(def.id)}
                              className="px-3 py-1 rounded bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition cursor-pointer"
                            >
                              Confirm & Assimilate into Memory
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === "policy" ? (
            /* RL POLICY TAB */
            <div className="space-y-6">
              {/* Training Overview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Turns Trained</span>
                  <span className="text-xl font-bold text-white mt-1 block">
                    {policy.totalInteractionsTrained}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Online Policy Continuous</span>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Cumulative Reward Q</span>
                  <span className="text-xl font-bold text-cyan-300 mt-1 block">
                    {policy.totalRewardAccumulated > 0 ? `+${policy.totalRewardAccumulated}` : policy.totalRewardAccumulated}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Reinforcement Sum</span>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Quick Human Feedback</span>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleManualReward(2.0, "TECH gave explicit thumbs up")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>+2 (Good)</span>
                    </button>
                    <button
                      onClick={() => handleManualReward(-2.0, "TECH gave explicit correction")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 cursor-pointer"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>-2 (Fix)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Parameter Sliders */}
              <div className="space-y-4 p-5 rounded-2xl border border-white/10 bg-black/40">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  Live Policy Parameter Matrix
                </h4>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-300">Empathy & Emotional Healing (Therapist Weight)</span>
                      <span className="font-mono text-emerald-400 font-bold">{Math.round(policy.empathyWeight * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-400 transition-all" style={{ width: `${policy.empathyWeight * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-300">Explanation Depth (Socratic vs Concise)</span>
                      <span className="font-mono text-cyan-400 font-bold">{Math.round(policy.explanationDepth * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all" style={{ width: `${policy.explanationDepth * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-300">Humor & Playful Banter Factor</span>
                      <span className="font-mono text-purple-400 font-bold">{Math.round(policy.humorPlayfulness * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-purple-400 transition-all" style={{ width: `${policy.humorPlayfulness * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-300">Strictness & Tough Love (Gussa / Jalali potential)</span>
                      <span className="font-mono text-rose-400 font-bold">{Math.round(policy.strictnessWeight * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-rose-400 transition-all" style={{ width: `${policy.strictnessWeight * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-slate-300">Bilingual Roman Urdu / English Blend</span>
                      <span className="font-mono text-amber-400 font-bold">{Math.round(policy.bilingualUrduWeight * 100)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-amber-400 transition-all" style={{ width: `${policy.bilingualUrduWeight * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EMPATHY SCORE & EMOTIONAL RESONANCE TAB */
            <div className="space-y-6">
              {/* Empathy Score Gauge & Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Radial Empathy Score Visualizer */}
                <div className="p-5 rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-500/10 via-white/[0.02] to-transparent flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE ATUNEMENT
                    </span>
                  </div>

                  <div className="relative w-32 h-32 flex items-center justify-center my-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-white/10"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-emerald-400 transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * (policy.empathyScore || 88)) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white tracking-tight">
                        {policy.empathyScore || 88}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                        / 100
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1">EMPATHY SCORE</h4>
                  <p className="text-[11px] text-slate-300 mt-1 max-w-[200px]">
                    {(policy.empathyScore || 88) >= 85 
                      ? "Optimal emotional attunement & calming presence."
                      : (policy.empathyScore || 88) >= 70
                      ? "Active resonance with student sentiments."
                      : "Calibrating emotional sensitivity models."}
                  </p>
                </div>

                {/* Companion Alignment Metrics */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Mood Alignment Rate
                        </span>
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="text-2xl font-bold text-cyan-300 mt-1 block">
                        {policy.emotionalAlignmentRate || 86}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Percentage of conversational turns where Mahr matched or complemented student affective state.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Comfort Efficacy
                        </span>
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <span className="text-2xl font-bold text-rose-300 mt-1 block">
                        {policy.comfortEfficacyScore || 84}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Success in de-escalating student exam anxiety, fatigue, or irritation with soothing delivery.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Therapeutic Weight
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-2xl font-bold text-emerald-300 mt-1 block">
                        {Math.round(policy.empathyWeight * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Dynamic reinforcement policy weighting for gentle, healing presence during learning.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Vocal Modulation
                        </span>
                        <Smile className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-sm font-bold text-amber-300 mt-1 block">
                        Acoustic Attunement
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Dynamic pitch and speed modulation tuned per mood (e.g. gussa +pitch/+speed, sad -pitch/-speed).
                    </p>
                  </div>
                </div>
              </div>

              {/* Emotional State Learning Stream */}
              <div className="space-y-3 p-5 rounded-2xl border border-white/10 bg-black/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    Emotional State Learning Episodes & Empathy Stream
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {(policy.empathyHistory || []).length} Recorded Episodes
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {(!policy.empathyHistory || policy.empathyHistory.length === 0) ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-white/10 rounded-xl">
                      No empathy learning episodes recorded yet. Converse with Mahr to observe live affective adaptation!
                    </div>
                  ) : (
                    policy.empathyHistory.map((ep) => (
                      <div
                        key={ep.id}
                        className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                              User: {ep.userMood}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                              Mahr: {ep.myraaMood}
                            </span>
                            {ep.matched ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Matched Attunement
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Tone Calibrated
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[10px]">
                            <span className={ep.comfortDelta >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              Comfort {ep.comfortDelta >= 0 ? `+${ep.comfortDelta}` : ep.comfortDelta}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">
                              {new Date(ep.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 italic">
                          "{ep.notes}"
                        </p>

                        {(ep.userUtterance || ep.modelUtterance) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px] font-sans">
                            {ep.userUtterance && (
                              <div className="text-slate-400 truncate">
                                <span className="text-slate-500 font-mono">User: </span>
                                {ep.userUtterance}
                              </div>
                            )}
                            {ep.modelUtterance && (
                              <div className="text-emerald-300/80 truncate">
                                <span className="text-slate-500 font-mono">Mahr: </span>
                                {ep.modelUtterance}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
