import React, { useState } from "react";
import { Gauge, Sigma, Crosshair, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface SimulationTelemetryProps {
  metrics?: Record<string, string | number>;
  formulas?: string[];
  fps: number;
  hoveredNode?: { name?: string; x: number; y: number; z: number } | null;
}

export const SimulationTelemetry: React.FC<SimulationTelemetryProps> = ({
  metrics,
  formulas,
  fps,
  hoveredNode
}) => {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const handleCopyFormula = (f: string) => {
    navigator.clipboard?.writeText(f);
    setCopiedFormula(f);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const metricEntries = metrics ? Object.entries(metrics) : [];
  const displayMetrics = showAllMetrics ? metricEntries : metricEntries.slice(0, 4);

  return (
    <div id="simulation-telemetry-hud" className="flex flex-col gap-2.5">
      {/* Live Physical Metrics Grid */}
      {metricEntries.length > 0 && (
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time State Telemetry</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              {fps} FPS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {displayMetrics.map(([key, value]) => (
              <div
                key={key}
                className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/70 flex flex-col justify-between"
              >
                <span className="text-[10px] text-slate-400 truncate" title={key}>{key}</span>
                <span className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5" title={String(value)}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {metricEntries.length > 4 && (
            <button
              id="btn-toggle-more-metrics"
              onClick={() => setShowAllMetrics(!showAllMetrics)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-center gap-1 pt-1"
            >
              <span>{showAllMetrics ? "Show Less" : `View All ${metricEntries.length} Metrics`}</span>
              {showAllMetrics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {/* Hovered Node Coordinate Inspection Probe */}
      {hoveredNode && (
        <div id="hovered-node-probe" className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-700/50 backdrop-blur-md flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" />
            <div>
              <div className="font-semibold text-cyan-200">{hoveredNode.name || "Inspected Node"}</div>
              <div className="font-mono text-[11px] text-cyan-400/90">
                X: {Number.isFinite(hoveredNode.x) ? hoveredNode.x.toFixed(2) : "0.00"} | Y: {Number.isFinite(hoveredNode.y) ? hoveredNode.y.toFixed(2) : "0.00"} | Z: {Number.isFinite(hoveredNode.z) ? hoveredNode.z.toFixed(2) : "0.00"}
              </div>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono text-cyan-300 bg-cyan-900/60 px-1.5 py-0.5 rounded">
            Target Locked
          </span>
        </div>
      )}

      {/* Governing Mathematical Laws */}
      {formulas && formulas.length > 0 && (
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Sigma className="w-3.5 h-3.5 text-purple-400" />
            <span>Governing Physical Formulas</span>
          </div>

          <div className="space-y-1.5">
            {formulas.map((formula, idx) => (
              <div
                key={idx}
                className="group flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-800/60 transition-colors"
              >
                <span className="font-mono text-xs text-purple-200/90 select-all overflow-x-auto custom-scrollbar">
                  {formula}
                </span>
                <button
                  onClick={() => handleCopyFormula(formula)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-purple-300 shrink-0 ml-2"
                  title="Copy formula"
                >
                  {copiedFormula === formula ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
