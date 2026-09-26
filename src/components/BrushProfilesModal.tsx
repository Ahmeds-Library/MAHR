import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Feather,
  Droplets,
  Highlighter,
  PenTool,
  Edit3,
  Pencil,
  Zap,
  Sliders,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Layers,
  Activity
} from "lucide-react";
import {
  BrushProfile,
  BRUSH_PROFILES,
  evaluatePressureCurve,
  calculateProfileOpacity,
  renderProfileStrokeOnCtx
} from "../lib/brushProfiles";

interface BrushProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: BrushProfile;
  onSelectProfile: (profile: BrushProfile) => void;
  currentColor: string;
}

export const BrushProfilesModal: React.FC<BrushProfilesModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onSelectProfile,
  currentColor
}) => {
  const [selectedProfile, setSelectedProfile] = useState<BrushProfile>(activeProfile);
  const [customProfiles, setCustomProfiles] = useState<BrushProfile[]>(BRUSH_PROFILES);
  const [activeTab, setActiveTab] = useState<"catalog" | "tuner">("catalog");

  // Scratchpad Canvas Refs
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScratchDrawing, setIsScratchDrawing] = useState(false);
  const scratchPointsRef = useRef<{ x: number; y: number; pressure?: number }[]>([]);
  const [testPressure, setTestPressure] = useState<number>(0.65);

  // Sync with prop
  useEffect(() => {
    setSelectedProfile(activeProfile);
  }, [activeProfile]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Feather":
        return <Feather size={16} />;
      case "Droplets":
        return <Droplets size={16} />;
      case "Highlighter":
        return <Highlighter size={16} />;
      case "Edit3":
        return <Edit3 size={16} />;
      case "Pencil":
        return <Pencil size={16} />;
      case "Zap":
        return <Zap size={16} />;
      case "PenTool":
      default:
        return <PenTool size={16} />;
    }
  };

  const clearScratchpad = useCallback(() => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background texture grid
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Guide text
    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("🎨 Test Stroke Scratchpad (Touch / Drag here)", 16, 24);
    ctx.restore();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(clearScratchpad, 50);
    }
  }, [isOpen, clearScratchpad]);

  // Scratchpad drawing handlers
  const handleScratchStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rawPressure = "touches" in e && (e.touches[0] as any).force ? (e.touches[0] as any).force : 0.5;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsScratchDrawing(true);
    scratchPointsRef.current = [{ x, y, pressure: rawPressure }];
  };

  const handleScratchMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratchDrawing) return;
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rawPressure = "touches" in e && (e.touches[0] as any).force ? (e.touches[0] as any).force : 0.6;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    scratchPointsRef.current.push({ x, y, pressure: rawPressure });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      renderProfileStrokeOnCtx(ctx, scratchPointsRef.current, selectedProfile, currentColor || "#06b6d4", 8);
    }
  };

  const handleScratchEnd = () => {
    setIsScratchDrawing(false);
    scratchPointsRef.current = [];
  };

  const handleApply = () => {
    onSelectProfile(selectedProfile);
    onClose();
  };

  const updateSelectedProfile = (updater: (prev: BrushProfile) => BrushProfile) => {
    const next = updater(selectedProfile);
    setSelectedProfile(next);
    setCustomProfiles((prev) => prev.map((p) => (p.id === next.id ? next : p)));
  };

  // Generate SVG curve visualization data
  const renderCurveSvg = () => {
    const { curve, minOpacity, maxOpacity, gamma } = selectedProfile.pressureMapping;
    const points: string[] = [];
    const width = 240;
    const height = 90;
    const padding = 12;

    for (let i = 0; i <= 20; i++) {
      const p = i / 20;
      const curved = evaluatePressureCurve(p, curve, gamma);
      const opacity = minOpacity + curved * (maxOpacity - minOpacity);
      const x = padding + p * (width - 2 * padding);
      const y = height - padding - opacity * (height - 2 * padding);
      points.push(`${x},${y}`);
    }

    const currentX = padding + testPressure * (width - 2 * padding);
    const currCurved = evaluatePressureCurve(testPressure, curve, gamma);
    const currOpacity = minOpacity + currCurved * (maxOpacity - minOpacity);
    const currentY = height - padding - currOpacity * (height - 2 * padding);

    return (
      <div className="relative bg-slate-950/80 p-3 rounded-2xl border border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Activity size={13} />
            <span>Pressure-to-Opacity Transfer Function</span>
          </div>
          <span className="bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded text-[10px]">
            Curve: {curve}
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
          {/* Axis grids */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

          {/* Transfer curve line */}
          <polyline
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.join(" ")}
          />

          {/* Current Pressure Marker */}
          <circle cx={currentX} cy={currentY} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
          <line x1={currentX} y1={height - padding} x2={currentX} y2={currentY} stroke="#06b6d4" strokeDasharray="2 2" opacity="0.6" />

          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>0% Pressure (Feather)</span>
          <span className="text-cyan-300 font-bold">
            Output Opacity: {Math.round(currOpacity * 100)}%
          </span>
          <span>100% Pressure (Full Press)</span>
        </div>

        {/* Live Pressure Slider */}
        <div className="flex items-center gap-3 mt-1 pt-2 border-t border-white/5">
          <span className="text-[10px] font-mono text-slate-400 shrink-0">Simulate Force:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={testPressure}
            onChange={(e) => setTestPressure(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-mono text-cyan-400 w-10 text-right">
            {Math.round(testPressure * 100)}%
          </span>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#070712] border border-white/15 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.2)] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-slate-950/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Sliders size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <h3 className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">
                    Professional Brush Profiles Library
                  </h3>
                </div>
                <p className="text-sm font-semibold text-white/90">
                  Select & Tune Physical Stylus Emulation Engine
                </p>
              </div>
            </div>

            {/* Tab Switches */}
            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTab("catalog")}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "catalog"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers size={13} />
                  <span>Preset Catalog</span>
                </button>
                <button
                  onClick={() => setActiveTab("tuner")}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "tuner"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sliders size={13} />
                  <span>Dynamics Tuner</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Preset Cards or Tuner */}
            <div className="md:col-span-7 space-y-4">
              {activeTab === "catalog" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Pre-defined Natural Tool Profiles
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                      7 Studio Presets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {customProfiles.map((prof) => {
                      const isSelected = selectedProfile.id === prof.id;
                      return (
                        <div
                          key={prof.id}
                          onClick={() => setSelectedProfile(prof)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                            isSelected
                              ? "bg-cyan-950/35 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400"
                              : "bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-2 rounded-xl ${
                                  isSelected
                                    ? "bg-cyan-500 text-slate-950"
                                    : "bg-white/5 text-slate-300"
                                }`}
                              >
                                {getIcon(prof?.iconName || "Feather")}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white leading-tight">
                                  {prof?.name || "Brush"}
                                </h4>
                                <span className="text-[9px] font-mono uppercase text-slate-400">
                                  {prof?.category || "Profile"} • {prof?.nibShape || "Round"}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {prof.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                            <span>
                              Opacity: {Math.round(prof.pressureMapping.minOpacity * 100)}% -{" "}
                              {Math.round(prof.pressureMapping.maxOpacity * 100)}%
                            </span>
                            <span className="text-cyan-400">
                              {prof.pressureMapping.curve}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Dynamics Tuner */
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      Fine-Tune Dynamics: {selectedProfile.name}
                    </span>
                    <button
                      onClick={() => {
                        const original = BRUSH_PROFILES.find((p) => p.id === selectedProfile.id);
                        if (original) setSelectedProfile(original);
                      }}
                      className="text-[10px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={10} />
                      <span>Reset Defaults</span>
                    </button>
                  </div>

                  {/* Transfer Curve Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-300">
                      Pressure Curve Transfer Model
                    </label>
                    <select
                      value={selectedProfile.pressureMapping.curve}
                      onChange={(e) =>
                        updateSelectedProfile((p) => ({
                          ...p,
                          pressureMapping: {
                            ...p.pressureMapping,
                            curve: e.target.value as any
                          }
                        }))
                      }
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-400"
                    >
                      <option value="linear">Linear (Direct Proportional)</option>
                      <option value="power">Power / Dynamic Contrast</option>
                      <option value="sigmoid">Sigmoid S-Curve (Natural Pen Touch)</option>
                      <option value="logarithmic">Logarithmic (High Sensitivity Feather)</option>
                      <option value="exponential">Exponential (Heavy Flex Nib)</option>
                      <option value="watercolor-wash">Watercolor Wash Accumulator</option>
                      <option value="highlighter-flat">Highlighter Flat Ribbon</option>
                    </select>
                  </div>

                  {/* Opacity Range Sliders */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Min Opacity (Light)</span>
                        <span className="text-cyan-400 font-bold">
                          {Math.round(selectedProfile.pressureMapping.minOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={selectedProfile.pressureMapping.minOpacity}
                        onChange={(e) =>
                          updateSelectedProfile((p) => ({
                            ...p,
                            pressureMapping: {
                              ...p.pressureMapping,
                              minOpacity: parseFloat(e.target.value)
                            }
                          }))
                        }
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Max Opacity (Heavy)</span>
                        <span className="text-cyan-400 font-bold">
                          {Math.round(selectedProfile.pressureMapping.maxOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={selectedProfile.pressureMapping.maxOpacity}
                        onChange={(e) =>
                          updateSelectedProfile((p) => ({
                            ...p,
                            pressureMapping: {
                              ...p.pressureMapping,
                              maxOpacity: parseFloat(e.target.value)
                            }
                          }))
                        }
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Nib Angle for Chisel / Calligraphy */}
                  {(selectedProfile.nibShape === "chisel" ||
                    selectedProfile.nibShape === "chisel-calligraphy") && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Chisel Nib Angle</span>
                        <span className="text-amber-400 font-bold">
                          {selectedProfile.nibAngleDeg}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={selectedProfile.nibAngleDeg}
                        onChange={(e) =>
                          updateSelectedProfile((p) => ({
                            ...p,
                            nibAngleDeg: parseInt(e.target.value, 10)
                          }))
                        }
                        className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Thinning & Streamline */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Thinning Dynamics</span>
                        <span className="text-purple-400 font-bold">
                          {selectedProfile.strokeOptions.thinning}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-0.5"
                        max="1"
                        step="0.05"
                        value={selectedProfile.strokeOptions.thinning ?? 0.5}
                        onChange={(e) =>
                          updateSelectedProfile((p) => ({
                            ...p,
                            strokeOptions: {
                              ...p.strokeOptions,
                              thinning: parseFloat(e.target.value)
                            }
                          }))
                        }
                        className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Streamline Smoothing</span>
                        <span className="text-purple-400 font-bold">
                          {selectedProfile.strokeOptions.streamline}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.95"
                        step="0.05"
                        value={selectedProfile.strokeOptions.streamline ?? 0.5}
                        onChange={(e) =>
                          updateSelectedProfile((p) => ({
                            ...p,
                            strokeOptions: {
                              ...p.strokeOptions,
                              streamline: parseFloat(e.target.value)
                            }
                          }))
                        }
                        className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Curve Graph Visualization */}
              {renderCurveSvg()}
            </div>

            {/* Right Column: Interactive Scratchpad & Active Summary */}
            <div className="md:col-span-5 flex flex-col justify-between gap-4">
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>Live Interactive Scratchpad</span>
                  </div>
                  <button
                    onClick={clearScratchpad}
                    className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={10} />
                    <span>Clear Pad</span>
                  </button>
                </div>

                {/* Canvas Box */}
                <div className="flex-1 min-h-[220px] rounded-2xl border border-white/10 bg-[#020206] overflow-hidden relative shadow-inner">
                  <canvas
                    ref={scratchCanvasRef}
                    width={360}
                    height={240}
                    onMouseDown={handleScratchStart}
                    onMouseMove={handleScratchMove}
                    onMouseUp={handleScratchEnd}
                    onMouseLeave={handleScratchEnd}
                    onTouchStart={handleScratchStart}
                    onTouchMove={handleScratchMove}
                    onTouchEnd={handleScratchEnd}
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                  <div className="absolute bottom-2 right-2.5 pointer-events-none text-[9px] font-mono text-slate-500 bg-slate-950/70 px-2 py-0.5 rounded border border-white/5">
                    {selectedProfile.name} • {selectedProfile.nibShape}
                  </div>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/10 shrink-0">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold font-mono text-xs transition shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={14} strokeWidth={3} />
                  <span>Activate Profile</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
