import React, { useState } from "react";
import { 
  SubAgent, 
  PRESET_SUBAGENTS, 
  SUPPORTED_AI_MODELS 
} from "../lib/subagentTypes";
import { 
  Bot, 
  Plus, 
  X, 
  Sparkles, 
  Brain, 
  Cpu, 
  Calendar, 
  BookOpen, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  Users, 
  ArrowRight,
  ShieldAlert,
  Zap,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SubAgentsStudioProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubAgentId: string;
  onSelectSubAgent: (agent: SubAgent) => void;
  customSubAgents: SubAgent[];
  onCreateSubAgent: (agent: Omit<SubAgent, "id">) => void;
  onDeleteCustomSubAgent: (id: string) => void;
  themeColor?: string;
}

export function SubAgentsStudio({
  isOpen,
  onClose,
  activeSubAgentId,
  onSelectSubAgent,
  customSubAgents,
  onCreateSubAgent,
  onDeleteCustomSubAgent,
  themeColor = "violet"
}: SubAgentsStudioProps) {
  const [isCreating, setIsCreating] = useState(false);

  // New agent form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [modelId, setModelId] = useState("gemini-3.1-flash-lite");
  const [category, setCategory] = useState<SubAgent["category"]>("custom");
  const [iconName, setIconName] = useState("Bot");

  const allAgents = [...PRESET_SUBAGENTS, ...customSubAgents];
  const activeAgent = allAgents.find(a => a.id === activeSubAgentId) || PRESET_SUBAGENTS[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    onCreateSubAgent({
      name: name.trim(),
      role: role.trim() || "Specialized Sub-Agent",
      description: description.trim() || "Custom AI sub-agent created by user.",
      systemPrompt: systemPrompt.trim(),
      modelId,
      iconName,
      color: "from-indigo-500 to-purple-600",
      category,
      isCustom: true,
      contextLimit: SUPPORTED_AI_MODELS.find(m => m.id === modelId)?.contextWindow || "2,000,000 Tokens"
    });

    // Reset form
    setName("");
    setRole("");
    setDescription("");
    setSystemPrompt("");
    setIsCreating(false);
  };

  const getAgentIcon = (nameStr: string) => {
    switch (nameStr) {
      case "Brain": return <Brain className="w-5 h-5" />;
      case "Cpu": return <Cpu className="w-5 h-5" />;
      case "Calendar": return <Calendar className="w-5 h-5" />;
      case "BookOpen": return <BookOpen className="w-5 h-5" />;
      default: return <Bot className="w-5 h-5" />;
    }
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
            className="relative w-full max-w-4xl overflow-hidden bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
          >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  MAHR Sub-Agents Studio & Orchestrator
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Multi-Agent AI
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Delegate specialized tasks to expert sub-agents powered by high-context Gemini models.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" /> Create Custom Sub-Agent
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Sub-Agent Banner */}
          <div className="p-4 bg-indigo-950/30 border-b border-indigo-900/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                {getAgentIcon(activeAgent?.iconName || "Sparkles")}
              </div>
              <div>
                <div className="text-[11px] text-indigo-300 font-medium">Currently Active Sub-Agent</div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {activeAgent?.name || "MAHR Core"}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                    Model: {activeAgent?.modelId || "gemini"} ({activeAgent?.contextLimit || "1M"})
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 hidden sm:block">
              Role: <span className="text-white font-medium">{activeAgent?.role || "Companion"}</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1">
            {isCreating ? (
              /* Create Custom Subagent Form */
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateSubmit}
                className="p-5 bg-slate-800/60 border border-indigo-500/30 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Create Custom AI Sub-Agent
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sub-Agent Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Urdu Tutor & Poetry Critic"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Specialized Role
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Literature & Grammatical Coach"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assigned AI Model (Context Limit)
                    </label>
                    <select
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {SUPPORTED_AI_MODELS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.contextWindow})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="tutor">Academic Tutor</option>
                      <option value="coder">Software Developer</option>
                      <option value="planner">Daily Planner</option>
                      <option value="memory">Memory & Knowledge</option>
                      <option value="custom">Custom Agent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Helps analyze poetry structure, vocabulary, and literary techniques."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom System Prompt & Persona Instructions *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Specify the exact instructions, tone, domain knowledge, and response rules for this sub-agent..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Plus className="w-4 h-4" /> Save & Activate Sub-Agent
                  </button>
                </div>
              </motion.form>
            ) : null}

            {/* Sub-Agents List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allAgents.map((agent) => {
                const isActive = agent.id === activeSubAgentId;
                return (
                  <div
                    key={agent.id}
                    onClick={() => onSelectSubAgent(agent)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? "bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-950/50"
                        : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2.5 rounded-xl border ${
                              isActive
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                                : "bg-slate-700/40 text-slate-300 border-slate-600/40"
                            }`}
                          >
                            {getAgentIcon(agent?.iconName || "Bot")}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm flex items-center gap-2">
                              {agent.name}
                              {agent.isCustom && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                  Custom
                                </span>
                              )}
                            </h4>
                            <div className="text-xs text-indigo-400 font-medium">{agent.role}</div>
                          </div>
                        </div>

                        {agent.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomSubAgent(agent.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete Sub-Agent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {agent.description}
                      </p>

                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-purple-300">
                          {agent.modelId}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>{agent.contextLimit} Context</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-700/40 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {isActive ? "Active in current workspace" : "Ready for delegation"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSubAgent(agent);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Active Sub-Agent
                          </>
                        ) : (
                          <>
                            Switch Sub-Agent <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              All sub-agents retain shared memory from MAHR's memory bank while utilizing specialized prompts.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
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
