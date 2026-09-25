import React from "react";
import {
  X,
  Grid,
  Volume2,
  VolumeX,
  Activity,
  Layers,
  RotateCcw,
  Sparkles,
  Sliders,
  Mic,
  Check
} from "lucide-react";
import { GridType, WhiteboardUtilityDrawerProps } from "./types";

const GRID_OPTIONS: { id: GridType; label: string; desc: string }[] = [
  { id: "none", label: "Plain Slate", desc: "Classic dark blackboard without background guide lines" },
  { id: "dot-grid", label: "Dot Grid", desc: "Evenly spaced subtle dots for wireframing and layouts" },
  { id: "graph-paper", label: "Graph Paper", desc: "Cartesian grid lines for math, physics, and calculus" },
  { id: "isometric", label: "Isometric 3D", desc: "60-degree angled grid for spatial and 3D diagrams" },
  { id: "blueprint", label: "Blueprint", desc: "Technical engineering grid with architectural aesthetic" }
];

export const WhiteboardUtilityDrawer: React.FC<WhiteboardUtilityDrawerProps> = ({
  isOpen,
  onClose,
  gridType,
  onSelectGridType,
  isAudioFeedbackEnabled,
  onToggleAudioFeedback,
  showPressureHUD,
  onTogglePressureHUD,
  onOpenDeduplicator,
  onResetStrokeCounter,
  onToggleVoiceSketch,
  onToggleMiniDld
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 select-none">
      <div
        className="w-full max-w-sm rounded-3xl bg-zinc-950/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-5 flex flex-col gap-4 text-white overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Grid size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Slate Workspace Settings</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Grids, acoustics & stylus dynamics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Section 1: Blackboard Grid Overlays */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
            Grid Background Texture
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {GRID_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectGridType(opt.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  gridType === opt.id
                    ? "bg-purple-600/20 border-purple-500/60 text-purple-200"
                    : "bg-zinc-900/60 border-white/5 text-zinc-300 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-zinc-400">{opt.desc}</div>
                </div>
                {gridType === opt.id && <Check size={14} className="text-purple-400 shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Audio & Stylus Dynamics */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
            Acoustic & Hardware Dynamics
          </label>

          {/* Tactile Audio Feedback */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {isAudioFeedbackEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Tactile Chalk Audio</div>
                <div className="text-[10px] text-zinc-400">Realistic friction, taps & eraser audio</div>
              </div>
            </div>
            <button
              onClick={onToggleAudioFeedback}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                isAudioFeedbackEnabled
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {isAudioFeedbackEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* Stylus Pressure Dynamics HUD */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Activity size={14} />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Stylus Pressure HUD</div>
                <div className="text-[10px] text-zinc-400">Real-time pressure gauge & stroke telemetry</div>
              </div>
            </div>
            <button
              onClick={onTogglePressureHUD}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                showPressureHUD
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {showPressureHUD ? "VISIBLE" : "HIDDEN"}
            </button>
          </div>
        </div>

        {/* Section 3: Smart Cleaners & Maintenance */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
            Slate Optimization
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenDeduplicator();
              }}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles size={12} />
              <span>Deduplicate</span>
            </button>
            <button
              onClick={onResetStrokeCounter}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-rose-400 hover:border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset Count</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
