import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  X, 
  Mic, 
  MicOff, 
  Wand2, 
  RefreshCw, 
  Layers, 
  Flame, 
  ChevronRight,
  Zap,
  Info
} from "lucide-react";
import { SimulationEngine } from "../../lib/simulationEngine";
import { SimulationData, SimulationPreset } from "../../lib/simulationTypes";
import { SIMULATION_PRESETS } from "../../lib/simulationPresets";
import { generateSimulationWithGemini, createSimulationWebSocket } from "../../services/simulationService";
import { SimulationTelemetry } from "./SimulationTelemetry";
import { SimulationControls } from "./SimulationControls";

interface SimulationStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onAskMyraa?: (question: string) => void;
  initialPrompt?: string;
}

export const SimulationStudio: React.FC<SimulationStudioProps> = ({
  isOpen,
  onClose,
  onAskMyraa,
  initialPrompt
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  const wsRef = useRef<{ close: () => void; send: (msg: any) => void } | null>(null);

  // Simulation State
  const [prompt, setPrompt] = useState<string>(initialPrompt || "Human lungs breathing with asthma");
  const [inputVal, setInputVal] = useState<string>("");
  const [activePreset, setActivePreset] = useState<SimulationPreset | null>(SIMULATION_PRESETS[0]);
  const presetStateRef = useRef<any>(SIMULATION_PRESETS[0].init());

  const [currentData, setCurrentData] = useState<SimulationData | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const studioRootRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Three.js Simulation Engine
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const engine = new SimulationEngine({
      container: containerRef.current,
      onFpsUpdate: (newFps) => setFps(newFps)
    });
    engineRef.current = engine;

    // Run initial frame
    if (activePreset) {
      presetStateRef.current = activePreset.init();
      const initialFrame = activePreset.update(presetStateRef.current, 0, 0.016);
      engine.updateData(initialFrame);
      setCurrentData(initialFrame);
    }

    // Connect WebSocket stream if available
    const ws = createSimulationWebSocket(
      (frameData) => {
        if (engineRef.current) {
          engineRef.current.updateData(frameData);
          setCurrentData(frameData);
          setIsStreaming(true);
        }
      },
      (status) => {
        setIsStreaming(status === "connected");
      }
    );
    wsRef.current = ws;

    return () => {
      ws.close();
      engine.dispose();
      engineRef.current = null;
    };
  }, [isOpen]);

  // 2. High-Frequency Simulation Math Clock
  useEffect(() => {
    if (!isOpen || isPaused) return;

    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05) * speed;
      lastTime = now;

      setTimeElapsed((prev) => {
        const nextTime = prev + dt;
        if (activePreset && engineRef.current) {
          if (!presetStateRef.current) {
            presetStateRef.current = activePreset.init();
          }
          const frame = activePreset.update(presetStateRef.current, nextTime, dt);
          engineRef.current.updateData(frame);
          setCurrentData(frame);
        }
        return nextTime;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, isPaused, speed, activePreset]);

  // 3. Handle Prompt Submission to Gemini
  const handleGenerateSimulation = async (textToRun: string) => {
    if (!textToRun.trim() || isLoading) return;

    setIsLoading(true);
    setPrompt(textToRun);

    try {
      // First check local presets for instant transition
      const lower = textToRun.toLowerCase();
      const matched = SIMULATION_PRESETS.find(p => 
        lower.includes(p.name.toLowerCase()) ||
        lower.includes(p.id.replace("_", " ")) ||
        (lower.includes("lung") && p.id === "lungs_asthma") ||
        (lower.includes("pendulum") && p.id === "double_pendulum") ||
        (lower.includes("solar") && p.id === "solar_system") ||
        (lower.includes("wave") && p.id === "quantum_wave") ||
        (lower.includes("magnet") && p.id === "magnetic_dipole")
      );

      if (matched) {
        setActivePreset(matched);
        presetStateRef.current = matched.init();
        setTimeElapsed(0);
        if (engineRef.current) {
          engineRef.current.clearScene();
          const frame = matched.update(presetStateRef.current, 0, 0.016);
          engineRef.current.updateData(frame);
          setCurrentData(frame);
        }
        setIsLoading(false);
        return;
      }

      // Call Gemini Server endpoint
      const result = await generateSimulationWithGemini(textToRun);
      if (result.status === "success" && result.data) {
        setActivePreset(null);
        if (engineRef.current) {
          engineRef.current.clearScene();
          engineRef.current.updateData(result.data);
          setCurrentData(result.data);
        }
      } else {
        // Fallback to default preset with notification
        if (SIMULATION_PRESETS.length > 0) {
          const fallback = SIMULATION_PRESETS[0];
          setActivePreset(fallback);
          presetStateRef.current = fallback.init();
          if (engineRef.current) {
            engineRef.current.clearScene();
            const frame = fallback.update(presetStateRef.current, 0, 0.016);
            engineRef.current.updateData(frame);
            setCurrentData(frame);
          }
        }
      }
    } catch (e: any) {
      console.error("[Simulation Studio] Generation error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPreset = (preset: SimulationPreset) => {
    setActivePreset(preset);
    presetStateRef.current = preset.init();
    setPrompt(preset.prompt);
    setTimeElapsed(0);
    if (engineRef.current) {
      engineRef.current.clearScene();
      const frame = preset.update(presetStateRef.current, 0, 0.016);
      engineRef.current.updateData(frame);
      setCurrentData(frame);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!engineRef.current) return;
    const dataUrl = engineRef.current.captureSnapshot();
    const link = document.createElement("a");
    link.download = `myraa-3d-sim-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    setSnapshotToast("📸 High-Resolution 3D Snapshot Downloaded!");
    setTimeout(() => setSnapshotToast(null), 3000);
  };

  const toggleFullscreen = () => {
    if (!studioRootRef.current) return;
    if (!document.fullscreenElement) {
      studioRootRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={studioRootRef}
      className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* 3D WebGL Canvas Layer */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
      />

      {/* Top Left Telemetry HUD */}
      <SimulationTelemetry
        metrics={currentData?.metrics}
        formulas={currentData?.formulas}
        fps={fps}
      />

      {/* Top Right Controls Toolbar */}
      <SimulationControls
        isPlaying={!isPaused}
        onTogglePlay={() => setIsPaused(!isPaused)}
        playbackSpeed={speed}
        onChangeSpeed={(newSpeed) => {
          setSpeed(newSpeed);
          if (engineRef.current) engineRef.current.playbackSpeed = newSpeed;
        }}
        shadingMode={showWireframe ? "wireframe" : "hologram"}
        onChangeShadingMode={(mode) => {
          const wire = mode === "wireframe";
          setShowWireframe(wire);
          if (engineRef.current) engineRef.current.setWireframe(wire);
        }}
        onChangeCameraPreset={(preset) => {
          if (preset === "perspective") engineRef.current?.setCameraView("reset");
          else if (preset === "front") engineRef.current?.setCameraView("front");
          else if (preset === "top") engineRef.current?.setCameraView("top");
          else if (preset === "side") engineRef.current?.setCameraView("side");
        }}
        onReset={() => {
          setTimeElapsed(0);
          if (activePreset && engineRef.current) {
            presetStateRef.current = activePreset.init();
            const frame = activePreset.update(presetStateRef.current, 0, 0.016);
            engineRef.current.updateData(frame);
            setCurrentData(frame);
          }
        }}
        onStepForward={() => {
          setTimeElapsed((t) => t + 0.05);
          if (activePreset && engineRef.current) {
            const frame = activePreset.update(presetStateRef.current, timeElapsed + 0.05, 0.05);
            engineRef.current.updateData(frame);
            setCurrentData(frame);
          }
        }}
        onCaptureSnapshot={handleCaptureSnapshot}
        showGrid={showGrid}
        onToggleGrid={() => {
          const next = !showGrid;
          setShowGrid(next);
          if (engineRef.current) engineRef.current.setGridVisible(next);
        }}
        onResetCamera={() => engineRef.current?.setCameraView("reset")}
        onSetCameraView={(view) => engineRef.current?.setCameraView(view === "perspective" ? "reset" : view)}
        onAskMyraaAboutSimulation={() => {
          if (onAskMyraa) {
            const summary = currentData 
              ? `Can you explain the mathematical and physical mechanisms behind this 3D simulation: "${currentData.title || prompt}"? Metrics: ${JSON.stringify(currentData.metrics || {})}`
              : `Can you explain the 3D simulation: "${prompt}"?`;
            onAskMyraa(summary);
          }
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Close Studio Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:right-72 z-30 p-2 rounded-2xl bg-slate-900/80 hover:bg-rose-950/80 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition-all cursor-pointer shadow-xl"
        title="Close 3D Simulation Studio"
      >
        <X size={18} />
      </button>

      {/* Toast Notification */}
      {snapshotToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-400/40 text-emerald-200 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{snapshotToast}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-100 font-mono">Synthesizing 3D Simulation Vectors</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">Prompting Gemini for numerical physical formulations & topology...</p>
          </div>
        </div>
      )}

      {/* Bottom Floating Interactive Command Bar & Quick Presets */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-4 flex flex-col gap-2.5">
        {/* Preset Carousel Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 justify-start sm:justify-center">
          {SIMULATION_PRESETS.map((preset) => {
            const isSelected = activePreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50 font-bold scale-105"
                    : "bg-slate-950/70 hover:bg-slate-900 border-white/10 text-slate-300 hover:border-cyan-500/40"
                }`}
              >
                <span>{preset?.icon || "✨"}</span>
                <span>{(preset?.name || "Simulation").split(" ")[0]} {(preset?.name || "").split(" ")[1] || ""}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Prompt Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateSimulation(inputVal);
            setInputVal("");
          }}
          className="bg-slate-950/85 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2 glow-panel transition-all focus-within:border-cyan-400/60"
        >
          <div className="pl-2 text-cyan-400">
            <Sparkles size={18} className="animate-pulse" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type any simulation prompt (e.g., 'Human lungs with asthma', 'Double pendulum chaos', 'Collapsing star solar system')..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none px-2 py-1.5 font-mono"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer active:scale-95 shrink-0"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <span>Simulate</span>
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};
