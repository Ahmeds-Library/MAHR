import React, { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  Zap,
  BrainCircuit,
  ShieldCheck,
  Activity,
  RotateCw,
  CheckCircle2,
  Layers,
  Lock,
  Sparkles,
  ArrowRight,
  Radio,
  Gauge,
} from "lucide-react";
import { SUPPORTED_AI_MODELS, AIModelConfig } from "../../lib/subagentTypes";
import {
  ModelRoutingPolicy,
  ModelRouteDecision,
  WORKLOAD_ROUTING_MATRIX,
  WorkloadCategory,
} from "../../modelRouter/layer1_data/modelRouterTypes";
import { formatTokenCount } from "../../lib/tokenUtils";

interface ModelRouterSettingsTabProps {
  activeModelId: string;
  onSelectModel: (modelId: string) => void;
  routingPolicy?: ModelRoutingPolicy;
  currentDecision?: ModelRouteDecision;
  autoShiftCount?: number;
  fallbackTriggerCount?: number;
  onUpdateRoutingPolicy?: (policy: ModelRoutingPolicy, overrideModelId?: string | null) => void;
  onSimulateFallback?: (failedModelId: string, reason?: string) => void;
  onStatusAlert?: (msg: string) => void;
}

const POLICY_OPTIONS: Array<{
  id: ModelRoutingPolicy;
  title: string;
  badge: string;
  description: string;
}> = [
  {
    id: "auto_intelligent",
    title: "Auto-Route by Workload & Priority",
    badge: "Recommended",
    description:
      "Automatically shifts between Flash Lite for instant voice, Flash for multimodal vision, and Pro for coding/math.",
  },
  {
    id: "low_latency_first",
    title: "Ultra-Low Latency Priority",
    badge: "Fastest",
    description:
      "Prioritizes sub-second Flash models across all workspaces with automatic quota fallback.",
  },
  {
    id: "deep_reasoning_first",
    title: "Deep Reasoning & Pro Priority",
    badge: "Max Depth",
    description:
      "Routes analytical, coding, and tutoring queries through Gemini Pro reasoning models first.",
  },
  {
    id: "manual_override",
    title: "Manual Model Lock",
    badge: "Custom Override",
    description:
      "Locks MAHR to a single manually chosen Gemini model until re-enabled to Auto-Route.",
  },
];

export const ModelRouterSettingsTab: React.FC<ModelRouterSettingsTabProps> = ({
  activeModelId,
  onSelectModel,
  routingPolicy = "auto_intelligent",
  currentDecision,
  autoShiftCount = 1,
  fallbackTriggerCount = 0,
  onUpdateRoutingPolicy,
  onSimulateFallback,
  onStatusAlert,
}) => {
  const [models, setModels] = useState<AIModelConfig[]>(SUPPORTED_AI_MODELS);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  const fetchLiveModels = async (force = false) => {
    setIsRefreshingModels(true);
    try {
      const res = await fetch(force ? "/api/models?refresh=true" : "/api/models");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
        }
      }
    } catch {
      // Keep default list
    } finally {
      setIsRefreshingModels(false);
    }
  };

  useEffect(() => {
    fetchLiveModels(false);
  }, []);

  const currentModelObj = useMemo(() => {
    return (
      models.find((m) => m.id === activeModelId) ||
      SUPPORTED_AI_MODELS.find((m) => m.id === activeModelId) ||
      SUPPORTED_AI_MODELS[0]
    );
  }, [models, activeModelId]);

  const handleSelectPolicy = (newPolicy: ModelRoutingPolicy) => {
    if (onUpdateRoutingPolicy) {
      onUpdateRoutingPolicy(
        newPolicy,
        newPolicy === "manual_override" ? activeModelId : null
      );
    }
    onStatusAlert?.(
      newPolicy === "auto_intelligent"
        ? "⚡ Backend Auto-Routing Engine enabled (Work & Priority mode)."
        : `🔧 Routing policy updated to: ${newPolicy.replace(/_/g, " ")}`
    );
  };

  const handleManualLockModel = (model: AIModelConfig) => {
    onSelectModel(model.id);
    if (onUpdateRoutingPolicy) {
      onUpdateRoutingPolicy("manual_override", model.id);
    }
    onStatusAlert?.(`🔒 Locked active engine to ${model.name}`);
  };

  return (
    <div className="space-y-5 text-slate-100">
      {/* Live Backend Auto-Router Telemetry Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 via-slate-900/90 to-indigo-950/50 border border-purple-500/35 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {routingPolicy === "manual_override"
                  ? "Manual Model Lock"
                  : "Backend Auto-Shift Active"}
              </span>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-lg border border-purple-500/30">
                Priority: {currentDecision?.priority?.replace(/_/g, " ").toUpperCase() || "CRITICAL REALTIME"}
              </span>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                Complexity: {currentDecision?.complexityScore ?? 24}/100
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              <Cpu className="w-5 h-5 text-purple-400 shrink-0" />
              <h4 className="text-base font-extrabold text-white tracking-wide">
                {currentModelObj.name}
              </h4>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">
                {formatTokenCount(currentModelObj.inputTokenLimit || currentModelObj.contextTokens)} Max Context
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {currentDecision?.reason ||
                "Backend engine automatically routes requests based on workload complexity, active workspace, and priority."}
            </p>
          </div>

          {/* Telemetry Counters & Fallback Test */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-center font-mono min-w-[90px]">
              <div className="text-sm font-extrabold text-purple-300">{autoShiftCount}</div>
              <div className="text-[9px] text-slate-400 uppercase">Auto-Shifts</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-center font-mono min-w-[90px]">
              <div className="text-sm font-extrabold text-emerald-300">
                ~{currentDecision?.estimatedLatencyMs || 390}ms
              </div>
              <div className="text-[9px] text-slate-400 uppercase">Target Latency</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-center font-mono min-w-[90px]">
              <div className="text-sm font-extrabold text-amber-300">{fallbackTriggerCount}</div>
              <div className="text-[9px] text-slate-400 uppercase">Fallbacks</div>
            </div>
          </div>
        </div>

        {/* Fallback Chain Indicator */}
        {currentDecision?.fallbackChain && currentDecision.fallbackChain.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5 flex-wrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Resilient Fallback Chain:</span>
              <span className="text-white font-bold">{currentDecision.selectedModelId}</span>
              {currentDecision.fallbackChain.map((fbId) => (
                <React.Fragment key={fbId}>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                    {fbId}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {onSimulateFallback && (
              <button
                type="button"
                onClick={() => {
                  onSimulateFallback(
                    activeModelId,
                    "Simulated high-load latency spike"
                  );
                  onStatusAlert?.(
                    "⚡ Triggered resilient auto-fallback to secondary model."
                  );
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono transition cursor-pointer"
              >
                Test Auto-Fallback Shift
              </button>
            )}
          </div>
        )}
      </div>

      {/* Routing Mode & Policy Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-purple-400" />
            <span>1. Backend Auto-Routing Strategy</span>
          </h4>
          {routingPolicy !== "auto_intelligent" && (
            <button
              type="button"
              onClick={() => handleSelectPolicy("auto_intelligent")}
              className="text-[11px] font-mono text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Restore Automatic Workload Routing
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {POLICY_OPTIONS.map((opt) => {
            const isSelected = routingPolicy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectPolicy(opt.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? "bg-purple-600/25 border-purple-400 text-white shadow-lg shadow-purple-950/40"
                    : "bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-900 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-xs font-bold font-mono">{opt.title}</span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? "bg-purple-500 text-white border-purple-300 font-bold"
                        : "bg-white/5 text-slate-400 border-white/10"
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workload & Priority Matrix */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>2. Live Workload & Priority Routing Matrix</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {(Object.keys(WORKLOAD_ROUTING_MATRIX) as WorkloadCategory[]).map((catKey) => {
            const rule = WORKLOAD_ROUTING_MATRIX[catKey];
            const isCurrentWorkload = currentDecision?.workloadCategory === catKey;
            return (
              <div
                key={catKey}
                className={`p-3 rounded-xl border flex flex-col gap-1.5 transition ${
                  isCurrentWorkload
                    ? "bg-cyan-950/40 border-cyan-400/60 ring-1 ring-cyan-400/30"
                    : "bg-slate-900/50 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {isCurrentWorkload && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                    {rule.label}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 uppercase">
                    {rule.defaultPriority.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{rule.description}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-purple-300">
                  <span>Primary: {rule.primaryModelId}</span>
                  <span className="text-slate-500">Fallback: {rule.secondaryFallbackId}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Override Model Selector */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>3. Available Gemini Engines (Click to Manual-Lock Override)</span>
          </h4>
          <button
            type="button"
            onClick={() => fetchLiveModels(true)}
            disabled={isRefreshingModels}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshingModels ? "animate-spin text-purple-400" : ""}`} />
            <span>Refresh API Models</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
          {models.map((model) => {
            const isCurrent = model.id === activeModelId;
            return (
              <div
                key={model.id}
                onClick={() => handleManualLockModel(model)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? "bg-purple-950/50 border-purple-400/70 text-white"
                    : "bg-slate-900/50 border-white/10 hover:bg-slate-900 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      isCurrent
                        ? "bg-purple-500/25 border-purple-400/50 text-purple-300"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    {model.id.includes("pro") ? (
                      <BrainCircuit className="w-4 h-4" />
                    ) : model.id.includes("gemma") ? (
                      <Layers className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">
                        {model.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                        {model.id}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300">
                        {formatTokenCount(model.inputTokenLimit || model.contextTokens)} Context
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {model.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualLockModel(model);
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 cursor-pointer ${
                    isCurrent
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                      : "bg-white/10 hover:bg-purple-600 text-slate-200 hover:text-white"
                  }`}
                >
                  {isCurrent ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : (
                    "OVERRIDE"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
