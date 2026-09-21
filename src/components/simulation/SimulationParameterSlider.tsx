import React from "react";
import { SimulationParameter } from "../../lib/simulationTypes";
import { Sliders, RotateCcw, Info } from "lucide-react";

interface SimulationParameterSliderProps {
  parameters: SimulationParameter[];
  values: Record<string, number>;
  onChange: (paramId: string, value: number) => void;
  onReset: () => void;
}

export const SimulationParameterSlider: React.FC<SimulationParameterSliderProps> = ({
  parameters,
  values,
  onChange,
  onReset
}) => {
  if (!parameters || parameters.length === 0) {
    return (
      <div id="no-params-notice" className="text-xs text-slate-400 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
        No adjustable parameters for this active model.
      </div>
    );
  }

  return (
    <div id="simulation-parameters-panel" className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Physical Parameters</span>
        </div>
        <button
          id="btn-reset-params"
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-cyan-300 transition-colors px-2 py-0.5 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50"
          title="Reset to default values"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Defaults</span>
        </button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {parameters.map((param) => {
          const rawVal = values?.[param.id] ?? param.defaultValue ?? param.min ?? 0;
          const val = typeof rawVal === "number" && !isNaN(rawVal) ? rawVal : (param.defaultValue ?? param.min ?? 0);
          const min = param.min ?? 0;
          const max = param.max ?? 100;
          const step = param.step ?? 1;
          const digits = step < 0.01 ? 3 : (step < 0.1 ? 2 : (step < 1 ? 1 : 0));
          const formattedVal = Number.isFinite(val) ? val.toFixed(digits) : "0";

          return (
            <div
              key={param.id}
              id={`param-group-${param.id}`}
              className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-200 font-medium">
                  <span>{param.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 text-[11px]">
                    {formattedVal} {param.unit || ""}
                  </span>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  id={`slider-${param.id}`}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>{min} {param.unit || ""}</span>
                <span className="truncate max-w-[170px] text-slate-400 text-right" title={param.description}>
                  {param.description}
                </span>
                <span>{max} {param.unit || ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
