import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Waves, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Flame, 
  Droplet, 
  Wind, 
  Activity, 
  Sliders,
  Palette,
  Play,
  Pause,
  Maximize2,
  Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FluidSolver2D } from "../../lib/fluid/fluidSolver2D";

export interface FluidLiquidCanvas2DProps {
  className?: string;
  onAskMahr?: (question: string) => void;
  onAskMyraa?: (question: string) => void;
  onToggle3DMode?: () => void;
}

// Preset color palettes for fluid dye injection
const FLUID_COLOR_PALETTES = [
  { id: "cyan_neon", name: "Cyber Neon", primary: [6, 182, 212] as [number, number, number], secondary: [59, 130, 246] as [number, number, number], hex: "#06b6d4" },
  { id: "plasma_purple", name: "Quantum Plasma", primary: [168, 85, 247] as [number, number, number], secondary: [236, 72, 153] as [number, number, number], hex: "#a855f7" },
  { id: "emerald_bio", name: "Bio Emerald", primary: [16, 185, 129] as [number, number, number], secondary: [5, 150, 105] as [number, number, number], hex: "#10b981" },
  { id: "solar_gold", name: "Solar Gold", primary: [245, 158, 11] as [number, number, number], secondary: [239, 68, 68] as [number, number, number], hex: "#f59e0b" },
  { id: "deep_ocean", name: "Deep Ocean", primary: [14, 165, 233] as [number, number, number], secondary: [99, 102, 241] as [number, number, number], hex: "#0ea5e9" }
];

export const FluidLiquidCanvas2D: React.FC<FluidLiquidCanvas2DProps> = ({
  className = "",
  onAskMahr,
  onAskMyraa,
  onToggle3DMode
}) => {
  const askHandler = onAskMahr || onAskMyraa;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const solverRef = useRef<FluidSolver2D | null>(null);
  const animIdRef = useRef<number | null>(null);

  // Interaction tracking
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Fluid State & Parameters
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activePalette, setActivePalette] = useState(FLUID_COLOR_PALETTES[0]);
  const [showVectors, setShowVectors] = useState<boolean>(false);
  const [viscosity, setViscosity] = useState<number>(0.00008);
  const [vorticity, setVorticity] = useState<number>(0.55);
  const [dissipation, setDissipation] = useState<number>(0.992);
  const [activeDrawer, setActiveDrawer] = useState<"params" | "telemetry" | null>(null);

  // Live Telemetry
  const [fps, setFps] = useState<number>(60);
  const [telemetry, setTelemetry] = useState({
    maxVelocity: 0,
    kineticEnergy: 0,
    maxVorticity: 0,
    reynoldsNumber: 0
  });

  // Initialize Fluid Solver
  useEffect(() => {
    const solver = new FluidSolver2D({
      gridSize: 96,
      viscosity,
      vorticity,
      dissipation,
      pressureIterations: 14
    });
    solverRef.current = solver;

    // Initial ambient fluid stir
    solver.injectForce(0.5, 0.5, 1.5, -0.8, activePalette.primary, 4);
    solver.injectForce(0.48, 0.52, -1.2, 1.0, activePalette.secondary, 4);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, []);

  // Update solver parameters dynamically
  useEffect(() => {
    if (solverRef.current) {
      solverRef.current.viscosity = viscosity;
      solverRef.current.vorticity = vorticity;
      solverRef.current.dissipation = dissipation;
    }
  }, [viscosity, vorticity, dissipation]);

  // Main 60Hz Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let lastFpsCheck = lastTime;

    const renderLoop = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastFpsCheck >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsCheck = now;
      }

      const solver = solverRef.current;
      if (solver && isPlaying) {
        solver.step();
        solver.renderToCanvas(ctx, canvas.width, canvas.height, {
          renderVectors: showVectors
        });

        // Update telemetry data state every 4 frames
        if (frameCount % 4 === 0) {
          setTelemetry({
            maxVelocity: solver.maxVelocity,
            kineticEnergy: solver.totalKineticEnergy,
            maxVorticity: solver.maxVorticity,
            reynoldsNumber: solver.reynoldsNumber
          });
        }
      }

      animIdRef.current = requestAnimationFrame(renderLoop);
    };

    animIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [isPlaying, showVectors]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    lastPointerRef.current = { x, y };

    // Initial injection burst
    if (solverRef.current) {
      solverRef.current.injectForce(x, y, 0.4, -0.4, activePalette.primary, 4);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || !lastPointerRef.current || !solverRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const dx = (x - lastPointerRef.current.x) * 40;
    const dy = (y - lastPointerRef.current.y) * 40;

    const usePrimary = Math.random() > 0.4;
    const color = usePrimary ? activePalette.primary : activePalette.secondary;

    solverRef.current.injectForce(x, y, dx, dy, color, 3.5);
    lastPointerRef.current = { x, y };
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    lastPointerRef.current = null;
  };

  // Quick Action: Inject Burst Vortex
  const handleInjectVortexBurst = useCallback(() => {
    if (!solverRef.current) return;
    const solver = solverRef.current;
    solver.injectForce(0.35, 0.4, 3.0, 2.0, activePalette.primary, 6);
    solver.injectForce(0.65, 0.6, -3.0, -2.0, activePalette.secondary, 6);
  }, [activePalette]);

  // Quick Action: Thermal Updraft
  const handleThermalUpdraft = useCallback(() => {
    if (!solverRef.current) return;
    const solver = solverRef.current;
    for (let i = 0.2; i <= 0.8; i += 0.15) {
      solver.injectForce(i, 0.85, (Math.random() - 0.5) * 0.5, -4.0, activePalette.primary, 4);
    }
  }, [activePalette]);

  // Clear Fluid
  const handleClearFluid = useCallback(() => {
    if (solverRef.current) {
      solverRef.current.clear();
      setTelemetry({
        maxVelocity: 0,
        kineticEnergy: 0,
        maxVorticity: 0,
        reynoldsNumber: 0
      });
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex flex-col overflow-hidden select-none bg-[#030712] ${className}`}
    >
      {/* 2D Liquid Fluid Simulation Stage */}
      <canvas
        ref={canvasRef}
        width={384}
        height={384}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full object-cover cursor-crosshair touch-none"
        title="Click and drag to stir and inject liquid fluid dyes and turbulent eddies"
      />

      {/* Floating Top Left Telemetry Watermark */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <div>
            <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
              <span>2D Navier-Stokes Fluid Engine</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                Eulerian Grid
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span>FPS: <strong className="text-cyan-300">{fps}</strong></span>
              <span>•</span>
              <span>Re: <strong className="text-emerald-400">{Math.round(telemetry.reynoldsNumber)}</strong></span>
              <span>•</span>
              <span>Energy: <strong className="text-purple-300">{telemetry.kineticEnergy.toFixed(1)}</strong></span>
            </div>
          </div>
        </div>

        <div className="text-[11px] font-mono text-cyan-300/80 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-white/5 backdrop-blur-sm">
          💡 Drag or touch canvas to stir glowing liquid dye and trigger vortices
        </div>
      </div>

      {/* Floating Top Right Controls Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 pointer-events-auto bg-slate-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl">
        {onToggle3DMode && (
          <button
            type="button"
            onClick={onToggle3DMode}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-200 transition-all cursor-pointer flex items-center gap-1.5"
            title="Switch to 3D WebGL Space Simulation Mode"
          >
            <Sparkles size={13} className="text-cyan-400 animate-spin" />
            <span>Switch to 3D</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isPlaying 
              ? "bg-slate-900 border-white/10 text-slate-300 hover:text-white" 
              : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
          }`}
          title={isPlaying ? "Pause Simulation" : "Resume Simulation"}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          type="button"
          onClick={() => setShowVectors(!showVectors)}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            showVectors 
              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" 
              : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
          }`}
          title="Toggle Velocity Vector Field Lines"
        >
          {showVectors ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        <button
          type="button"
          onClick={() => setActiveDrawer(activeDrawer === "params" ? null : "params")}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            activeDrawer === "params" 
              ? "bg-purple-500/20 border-purple-500/50 text-purple-300" 
              : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
          }`}
          title="Fluid Physical Parameters"
        >
          <Sliders size={14} />
        </button>

        <button
          type="button"
          onClick={handleClearFluid}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Clear Fluid Field"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Floating Bottom Quick Triggers & Palette Selector */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl overflow-x-auto max-w-full">
          {/* Quick Triggers */}
          <button
            type="button"
            onClick={handleInjectVortexBurst}
            className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Inject dual counter-rotating vortex street"
          >
            <Waves size={12} className="text-cyan-400" />
            <span>Vortex Burst</span>
          </button>

          <button
            type="button"
            onClick={handleThermalUpdraft}
            className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Inject thermal rising plume convection"
          >
            <Flame size={12} className="text-amber-400" />
            <span>Thermal Plume</span>
          </button>

          {/* Color Palettes */}
          <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />
          <div className="flex items-center gap-1 shrink-0">
            {FLUID_COLOR_PALETTES.map((pal) => (
              <button
                key={pal.id}
                type="button"
                onClick={() => setActivePalette(pal)}
                className={`w-5 h-5 rounded-full transition-all cursor-pointer border ${
                  activePalette.id === pal.id 
                    ? "scale-125 border-white shadow-md shadow-cyan-500/50" 
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: pal.hex }}
                title={`Dye: ${pal.name}`}
              />
            ))}
          </div>

          {askHandler && (
            <>
              <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />
              <button
                type="button"
                onClick={() => {
                  askHandler(
                    `Can you explain the Navier-Stokes fluid equations and how viscosity (${viscosity}), vorticity confinement (${vorticity}), and Reynolds number (Re=${Math.round(telemetry.reynoldsNumber)}) shape this 2D liquid simulation?`
                  );
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="Ask MAHR voice companion to explain fluid dynamics"
              >
                <Sparkles size={12} className="text-purple-400" />
                <span>Ask MAHR</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sliding Parameter Drawer */}
      <AnimatePresence>
        {activeDrawer === "params" && (
          <motion.div
            initial={{ opacity: 0, x: 260 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 260 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-4 z-30 w-72 bg-slate-950/95 border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl pointer-events-auto flex flex-col gap-3 font-mono"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Sliders size={13} />
                <span>Fluid Parameters</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Viscosity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Kinematic Viscosity (ν)</span>
                <span className="text-cyan-300 font-bold">{(viscosity * 1e5).toFixed(1)} × 10⁻⁵</span>
              </div>
              <input
                type="range"
                min="0.00001"
                max="0.0004"
                step="0.00001"
                value={viscosity}
                onChange={(e) => setViscosity(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[9px] text-slate-500">Low = turbulent water, High = thick honey</span>
            </div>

            {/* Vorticity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Vorticity Confinement</span>
                <span className="text-purple-300 font-bold">{vorticity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.2"
                step="0.05"
                value={vorticity}
                onChange={(e) => setVorticity(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <span className="text-[9px] text-slate-500">Amplifies small turbulent fluid swirls and eddies</span>
            </div>

            {/* Dissipation */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Dye Retention Rate</span>
                <span className="text-emerald-300 font-bold">{(dissipation * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.95"
                max="0.999"
                step="0.001"
                value={dissipation}
                onChange={(e) => setDissipation(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <span className="text-[9px] text-slate-500">Controls how long liquid dye remains suspended</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
