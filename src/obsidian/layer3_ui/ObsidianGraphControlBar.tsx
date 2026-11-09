import React, { useState } from "react";
import {
  Sliders,
  Route,
  Sparkles,
  Pause,
  Play,
  X,
  ArrowRight,
} from "lucide-react";
import {
  ObsidianGraphNode,
  ObsidianGraphPhysicsConfig,
  ObsidianShortestPathResult,
} from "../layer1_data/obsidianTypes";

interface ObsidianGraphControlBarProps {
  nodes: ObsidianGraphNode[];
  physics: ObsidianGraphPhysicsConfig;
  onUpdatePhysics: (patch: Partial<ObsidianGraphPhysicsConfig>) => void;
  pathSourceId: string;
  pathTargetId: string;
  onSelectPathSource: (id: string) => void;
  onSelectPathTarget: (id: string) => void;
  shortestPath: ObsidianShortestPathResult;
  onClearPath: () => void;
  onTriggerAiAutoConnect: () => void;
  onSelectNode: (id: string) => void;
}

export const ObsidianGraphControlBar: React.FC<ObsidianGraphControlBarProps> = ({
  nodes,
  physics,
  onUpdatePhysics,
  pathSourceId,
  pathTargetId,
  onSelectPathSource,
  onSelectPathTarget,
  shortestPath,
  onClearPath,
  onTriggerAiAutoConnect,
  onSelectNode,
}) => {
  const [showPhysicsSliders, setShowPhysicsSliders] = useState(false);
  const [showPathFinder, setShowPathFinder] = useState(false);

  return (
    <div className="px-3.5 py-2 bg-slate-950/95 border-b border-white/10 flex flex-col gap-2 z-20 shrink-0">
      {/* Primary Graph Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Hop Filter Segmented Control */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-white/10">
            {(
              [
                { id: "all", label: "Full Graph" },
                { id: "1hop", label: "1-Hop Ego" },
                { id: "2hop", label: "2-Hop Ego" },
              ] as const
            ).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onUpdatePhysics({ hopFilter: h.id })}
                className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer whitespace-nowrap shrink-0 ${
                  physics.hopFilter === h.id
                    ? "bg-purple-600/35 text-purple-100 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Shortest-Path Connection Finder Toggle */}
          <button
            type="button"
            onClick={() => setShowPathFinder((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              showPathFinder || shortestPath.found
                ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 font-semibold"
                : "border-white/10 bg-white/5 text-slate-300 hover:text-white"
            }`}
          >
            <Route size={12} className="text-cyan-400" />
            <span>Path Finder</span>
          </button>

          {/* Physics Controls Toggle */}
          <button
            type="button"
            onClick={() => setShowPhysicsSliders((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              showPhysicsSliders
                ? "border-purple-400/60 bg-purple-500/20 text-purple-200 font-semibold"
                : "border-white/10 bg-white/5 text-slate-300 hover:text-white"
            }`}
          >
            <Sliders size={12} className="text-purple-400" />
            <span>Physics</span>
          </button>

          {/* Freeze / Resume Layout */}
          <button
            type="button"
            onClick={() => onUpdatePhysics({ frozen: !physics.frozen })}
            className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
              physics.frozen
                ? "border-amber-400/50 bg-amber-500/20 text-amber-200 font-semibold"
                : "border-white/10 bg-white/5 text-slate-300 hover:text-white"
            }`}
          >
            {physics.frozen ? <Play size={11} /> : <Pause size={11} />}
            <span>{physics.frozen ? "Resume" : "Freeze"}</span>
          </button>
        </div>

        {/* AI Semantic Auto-Connect Button */}
        <button
          type="button"
          onClick={onTriggerAiAutoConnect}
          className="px-2.5 py-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
          title="Scan all vault notes and memories to discover latent semantic links"
        >
          <Sparkles size={12} className="text-emerald-400" />
          <span>AI Auto-Connect</span>
        </button>
      </div>

      {/* Expandable Shortest-Path Connection Finder Drawer */}
      {showPathFinder && (
        <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-cyan-300 font-semibold">
              Shortest Connection Path:
            </span>
            <select
              value={pathSourceId}
              onChange={(e) => onSelectPathSource(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-white/15 text-[11px] text-white max-w-[190px]"
            >
              <option value="">Select Start Node (A)...</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
            <ArrowRight size={13} className="text-slate-400 shrink-0" />
            <select
              value={pathTargetId}
              onChange={(e) => onSelectPathTarget(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-white/15 text-[11px] text-white max-w-[190px]"
            >
              <option value="">Select Target Node (B)...</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>

            {(pathSourceId || pathTargetId) && (
              <button
                type="button"
                onClick={onClearPath}
                className="px-2 py-1 rounded-lg border border-white/10 text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {pathSourceId && pathTargetId && (
            <div className="text-[11px] flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
              {shortestPath.found ? (
                <>
                  <span className="text-emerald-300 font-semibold tabular-nums">
                    Path ({shortestPath.nodeIds.length - 1} hops):
                  </span>
                  {shortestPath.nodeIds.map((nid, idx) => {
                    const title = shortestPath.titles[idx] || nid;
                    return (
                      <React.Fragment key={nid}>
                        {idx > 0 && (
                          <span className="text-cyan-400">→</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectNode(nid)}
                          className="text-cyan-200 hover:text-white underline cursor-pointer"
                        >
                          [[{title.slice(0, 26)}]]
                        </button>
                      </React.Fragment>
                    );
                  })}
                </>
              ) : (
                <span className="text-amber-300">
                  No path found between selected nodes. Click "AI Auto-Connect" to bridge semantic clusters.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expandable Force-Directed Physics Sliders */}
      {showPhysicsSliders && (
        <div className="p-2.5 rounded-xl bg-black/60 border border-purple-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono tabular-nums">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300">
              <span>Repulsion Force</span>
              <span className="text-purple-300">{physics.repulsion}</span>
            </div>
            <input
              type="range"
              min={40}
              max={300}
              step={10}
              value={physics.repulsion}
              onChange={(e) =>
                onUpdatePhysics({ repulsion: Number(e.target.value) })
              }
              className="accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300">
              <span>Target Link Distance</span>
              <span className="text-purple-300">{physics.linkDistance}px</span>
            </div>
            <input
              type="range"
              min={50}
              max={220}
              step={10}
              value={physics.linkDistance}
              onChange={(e) =>
                onUpdatePhysics({ linkDistance: Number(e.target.value) })
              }
              className="accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300">
              <span>Center Gravity</span>
              <span className="text-purple-300">
                {(physics.gravity * 1000).toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={25}
              step={1}
              value={Math.round(physics.gravity * 1000)}
              onChange={(e) =>
                onUpdatePhysics({ gravity: Number(e.target.value) / 1000 })
              }
              className="accent-purple-500 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
