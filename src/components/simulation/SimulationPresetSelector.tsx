import React, { useState } from "react";
import { SIMULATION_PRESETS, SIMULATION_CATEGORIES } from "../../lib/simulationPresets";
import { SimulationPreset } from "../../lib/simulationTypes";
import { Search, Sparkles, Filter, Check } from "lucide-react";

interface SimulationPresetSelectorProps {
  activePresetId: string;
  onSelectPreset: (preset: SimulationPreset) => void;
}

export const SimulationPresetSelector: React.FC<SimulationPresetSelectorProps> = ({
  activePresetId,
  onSelectPreset
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPresets = SIMULATION_PRESETS.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="simulation-preset-explorer" className="flex flex-col gap-3">
      {/* Search Input and Category Filter Chips */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-simulations"
            type="text"
            placeholder="Search optics, mechanics, quantum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Categories scrollable pill list */}
        <div className="flex gap-1.5 overflow-x-auto w-full pb-1 custom-scrollbar">
          {SIMULATION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80"
              }`}
            >
              <span>{cat?.icon || "⚡"}</span>
              <span>{cat?.label || "Category"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredPresets.map((preset) => {
          const isActive = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              id={`preset-card-${preset.id}`}
              onClick={() => onSelectPreset(preset)}
              className={`flex flex-col text-left p-3 rounded-2xl border transition-all relative group ${
                isActive
                  ? "bg-gradient-to-br from-cyan-950/40 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10"
                  : "bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl p-1.5 rounded-xl bg-slate-800/70 border border-slate-700/50 group-hover:scale-105 transition-transform">
                    {preset?.icon || "⚡"}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-tight">
                      {preset?.name || "Simulation"}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      {preset?.category || "Model"}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">
                {preset.description}
              </p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                <span>{preset.parameters.length} Parameters</span>
                {preset.challenges && <span>{preset.challenges.length} Challenges</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
