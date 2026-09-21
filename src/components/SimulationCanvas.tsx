import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Sparkles,
  Send,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sliders,
  Activity,
  Layers,
  HelpCircle,
  X,
  ChevronRight,
  BookOpen,
  Eye,
  EyeOff,
  Compass,
  Grid,
  Volume2,
  VolumeX,
  Camera,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UniversalSimulationParser } from "../lib/UniversalSimulationParser";
import { useSimulationStream } from "../hooks/useSimulationStream";
import { SimulationData, SimulationNode, SimulationPreset } from "../lib/simulationTypes";
import { SIMULATION_PRESETS } from "../lib/simulationPresets";
import { generateSimulationWithGemini } from "../services/simulationService";
import { SimulationParameterSlider } from "./simulation/SimulationParameterSlider";
import { SimulationLiveGraph } from "./simulation/SimulationLiveGraph";
import { SimulationStudyGuide } from "./simulation/SimulationStudyGuide";
import { SimulationTelemetry } from "./simulation/SimulationTelemetry";
import { SimulationControls } from "./simulation/SimulationControls";
import { SimulationPresetSelector } from "./simulation/SimulationPresetSelector";

export interface SimulationCanvasProps {
  initialPrompt?: string;
  className?: string;
  showOverlayControls?: boolean;
  onAskMahr?: (question: string) => void;
  onAskMyraa?: (question: string) => void;
  onClose?: () => void;
}

// Web Audio sound feedback synthesizer
function playSoundFeedback(freq = 520, duration = 0.08) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  initialPrompt = "3D Projectile Motion Laboratory & Vector Field",
  className = "",
  showOverlayControls = true,
  onAskMahr,
  onAskMyraa,
  onClose
}) => {
  const tutorHandler = onAskMahr || onAskMyraa;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const parserRef = useRef<UniversalSimulationParser | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Raycaster & Interaction
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseVecRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Active Simulation Model State
  const [activePreset, setActivePreset] = useState<SimulationPreset>(
    SIMULATION_PRESETS.find(p => p.id === "projectile_motion") || SIMULATION_PRESETS[0]
  );
  const [paramValues, setParamValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const defaultP = SIMULATION_PRESETS.find(p => p.id === "projectile_motion") || SIMULATION_PRESETS[0];
    defaultP.parameters.forEach(p => {
      initial[p.id] = p.defaultValue;
    });
    return initial;
  });

  // Local preset runner & simulation time
  const localPresetStateRef = useRef<any>(null);
  const simTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Playback & View Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [renderMode, setRenderMode] = useState<"hologram" | "solid" | "wireframe">("hologram");
  const [cameraPreset, setCameraPreset] = useState<"perspective" | "top" | "front" | "side">("perspective");
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Active UI Drawer / View Tab
  const [activeDrawerTab, setActiveDrawerTab] = useState<"parameters" | "study" | "explorer" | "telemetry" | null>("parameters");
  const [hoveredNode, setHoveredNode] = useState<{ name: string; x: number; y: number; z: number } | null>(null);
  const [fps, setFps] = useState<number>(60);

  // Telemetry Frame State
  const [currentFrameData, setCurrentFrameData] = useState<SimulationData | null>(null);

  // AI Generation input state
  const [aiPromptInput, setAiPromptInput] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Initialize local preset state
  useEffect(() => {
    localPresetStateRef.current = activePreset.init(paramValues);
    simTimeRef.current = 0;
  }, [activePreset]);

  // Handle parameter changes
  const handleParamChange = useCallback((paramId: string, value: number) => {
    setParamValues(prev => ({
      ...prev,
      [paramId]: value
    }));
    if (soundEnabled) playSoundFeedback(600, 0.04);
  }, [soundEnabled]);

  const handleResetParams = useCallback(() => {
    const reset: Record<string, number> = {};
    activePreset.parameters.forEach(p => {
      reset[p.id] = p.defaultValue;
    });
    setParamValues(reset);
    localPresetStateRef.current = activePreset.init(reset);
    simTimeRef.current = 0;
    if (soundEnabled) playSoundFeedback(440, 0.06);
  }, [activePreset, soundEnabled]);

  const handleSelectPreset = useCallback((preset: SimulationPreset) => {
    setActivePreset(preset);
    const initialParams: Record<string, number> = {};
    preset.parameters.forEach(p => {
      initialParams[p.id] = p.defaultValue;
    });
    setParamValues(initialParams);
    localPresetStateRef.current = preset.init(initialParams);
    simTimeRef.current = 0;
    setActiveDrawerTab("parameters");
    if (soundEnabled) playSoundFeedback(700, 0.08);
  }, [soundEnabled]);

  // WebSocket Live Stream Connection (fallback / AI agent)
  const { isConnected, sendPrompt } = useSimulationStream({
    endpoint: "/simulation-stream",
    onFrame: (frameData: SimulationData) => {
      if (parserRef.current) {
        parserRef.current.parseAndApplyFrame(frameData, performance.now() * 0.001);
        setCurrentFrameData(frameData);
      }
    }
  });

  // 1. Setup Three.js Scene, Camera, Lights, Grid & Stars
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03030c, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.2, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 50;
    controls.minDistance = 0.5;
    controlsRef.current = controls;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const cyanDir = new THREE.DirectionalLight(0x06b6d4, 2.2);
    cyanDir.position.set(6, 12, 8);
    scene.add(cyanDir);

    const magentaDir = new THREE.DirectionalLight(0xec4899, 1.6);
    magentaDir.position.set(-6, -4, -6);
    scene.add(magentaDir);

    // Floor Grid
    const grid = new THREE.GridHelper(30, 30, 0x06b6d4, 0x1e1b4b);
    grid.position.y = -2.5;
    grid.name = "CyberGrid";
    scene.add(grid);

    // Starfield
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 50;
      starPos[i + 1] = (Math.random() - 0.5) * 50;
      starPos[i + 2] = (Math.random() - 0.5) * 50;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Universal Three.js Parser
    const parser = new UniversalSimulationParser();
    parserRef.current = parser;
    scene.add(parser.rootGroup);

    // Raycast Interaction
    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseVecRef.current, camera);
      const intersects = raycasterRef.current.intersectObject(parser.dynamicPointCloud, false);

      if (intersects.length > 0 && intersects[0].index !== undefined) {
        const idx = intersects[0].index;
        const currentData = (window as any).__lastSimulationData;
        if (currentData && currentData.nodes && currentData.nodes[idx]) {
          const n = currentData.nodes[idx];
          setHoveredNode({
            name: n.name || `Node #${idx}`,
            x: n.x ?? n.position?.[0] ?? 0,
            y: n.y ?? n.position?.[1] ?? 0,
            z: n.z ?? n.position?.[2] ?? 0
          });
        }
      } else {
        setHoveredNode(null);
      }
    };

    renderer.domElement.addEventListener("mousemove", handlePointerMove);

    // Window Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / (h || 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("mousemove", handlePointerMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      parser.dispose();
      renderer.dispose();
    };
  }, []);

  // 2. High-Precision Local Animation & Physics Loop
  useEffect(() => {
    let frameCount = 0;
    let lastFpsCheck = performance.now();

    const loop = () => {
      const now = performance.now();
      const rawDt = Math.min((now - lastTimeRef.current) * 0.001, 0.1);
      lastTimeRef.current = now;

      // FPS tracking
      frameCount++;
      if (now - lastFpsCheck >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsCheck = now;
      }

      if (isPlaying && activePreset) {
        if (!localPresetStateRef.current) {
          localPresetStateRef.current = activePreset.init(paramValues);
        }
        const dt = rawDt * playbackSpeed;
        simTimeRef.current += dt;

        const frameData = activePreset.update(
          localPresetStateRef.current,
          simTimeRef.current,
          dt,
          paramValues
        );

        if (parserRef.current) {
          parserRef.current.parseAndApplyFrame(frameData, simTimeRef.current);
        }

        setCurrentFrameData(frameData);
        (window as any).__lastSimulationData = frameData;
      }

      // Auto Camera Orbiting
      if (isOrbiting && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.2;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, activePreset, paramValues, isOrbiting]);

  // Shading mode sync
  useEffect(() => {
    if (parserRef.current) {
      parserRef.current.setRenderMode(renderMode);
    }
  }, [renderMode]);

  // Camera presets
  const handleCameraPresetChange = (preset: "perspective" | "top" | "front" | "side") => {
    setCameraPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    controls.target.set(0, 0, 0);

    if (preset === "top") {
      camera.position.set(0, 10, 0.001);
    } else if (preset === "front") {
      camera.position.set(0, 0, 9);
    } else if (preset === "side") {
      camera.position.set(9, 0, 0);
    } else {
      camera.position.set(0, 3.2, 7.5);
    }
    controls.update();
    if (soundEnabled) playSoundFeedback(500, 0.05);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleResetParams();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleResetParams]);

  // Snapshot PNG export
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${activePreset.id}_simulation_snapshot.png`;
    link.href = dataUrl;
    link.click();
    if (soundEnabled) playSoundFeedback(880, 0.1);
  };

  // AI Prompt Simulation Generator Handler
  const handleGenerateAISimulation = async () => {
    if (!aiPromptInput.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    if (soundEnabled) playSoundFeedback(600, 0.08);

    try {
      sendPrompt(aiPromptInput);
      const generated = await generateSimulationWithGemini(aiPromptInput);
      if (generated && parserRef.current) {
        parserRef.current.parseAndApplyFrame(generated, 0);
        setCurrentFrameData(generated);
      }
    } catch (e) {
      console.error("AI simulation generation failed", e);
    } finally {
      setIsAiGenerating(false);
      setAiPromptInput("");
    }
  };

  return (
    <div
      ref={containerRef}
      id="simulation-studio-root"
      className={`relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none font-sans ${
        isFullscreen ? "fixed inset-0 z-50" : "rounded-3xl border border-slate-800/80 shadow-2xl"
      } ${className}`}
    >
      {/* Top Header Navigation Bar */}
      <div id="simulation-header-bar" className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-inner">
            {activePreset.icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 tracking-tight">
                {currentFrameData?.title || activePreset.name}
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                {activePreset.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xl">
              {currentFrameData?.description || activePreset.description}
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-tab-explorer"
            onClick={() => setActiveDrawerTab(activeDrawerTab === "explorer" ? null : "explorer")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeDrawerTab === "explorer"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulations Library</span>
          </button>

          <button
            id="btn-tab-params"
            onClick={() => setActiveDrawerTab(activeDrawerTab === "parameters" ? null : "parameters")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeDrawerTab === "parameters"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parameters</span>
          </button>

          <button
            id="btn-tab-study"
            onClick={() => setActiveDrawerTab(activeDrawerTab === "study" ? null : "study")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeDrawerTab === "study"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Learning Lab</span>
          </button>

          <button
            id="btn-tab-telemetry"
            onClick={() => setActiveDrawerTab(activeDrawerTab === "telemetry" ? null : "telemetry")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeDrawerTab === "telemetry"
                ? "bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20"
                : "bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telemetry</span>
          </button>

          {/* Fullscreen and Close */}
          <button
            id="btn-toggle-fullscreen"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              id="btn-close-sim"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-rose-400 border border-slate-700/60 transition-colors ml-1"
              title="Close Simulation"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Canvas Stage Container */}
      <div className="relative flex-1 w-full h-full min-h-[360px] overflow-hidden bg-slate-950">
        <div ref={mountRef} id="threejs-simulation-viewport" className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating Top Left Model Watermark & Quick Status */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-200">
              {activePreset.name}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
              {fps} FPS
            </span>
          </div>

          {/* Quick HUD Coordinate Inspection Tooltip */}
          {hoveredNode && (
            <div className="bg-cyan-950/80 border border-cyan-500/60 backdrop-blur-md p-2 rounded-xl shadow-xl text-xs text-cyan-200 animate-fadeIn">
              <div className="font-bold">{hoveredNode.name}</div>
              <div className="font-mono text-[10px] text-cyan-400">
                ({Number.isFinite(hoveredNode.x) ? hoveredNode.x.toFixed(2) : "0.00"}, {Number.isFinite(hoveredNode.y) ? hoveredNode.y.toFixed(2) : "0.00"}, {Number.isFinite(hoveredNode.z) ? hoveredNode.z.toFixed(2) : "0.00"})
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom Left Live Graph */}
        <div className="absolute bottom-20 left-4 z-10 w-72 sm:w-80 pointer-events-auto hidden md:block">
          <SimulationLiveGraph
            currentSample={currentFrameData?.currentGraphSample}
            category={activePreset.category}
            title={activePreset.name}
          />
        </div>

        {/* Sliding Interactive Drawer Panels (Parameters, Study Guide, Library Explorer, Telemetry) */}
        <AnimatePresence>
          {activeDrawerTab && (
            <motion.div
              id={`drawer-panel-${activeDrawerTab}`}
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute top-4 right-4 bottom-20 z-20 w-80 sm:w-96 bg-slate-900/95 border border-slate-800/90 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  {activeDrawerTab === "parameters" && <Sliders className="w-4 h-4 text-cyan-400" />}
                  {activeDrawerTab === "study" && <Sparkles className="w-4 h-4 text-amber-400" />}
                  {activeDrawerTab === "explorer" && <BookOpen className="w-4 h-4 text-cyan-400" />}
                  {activeDrawerTab === "telemetry" && <Activity className="w-4 h-4 text-purple-400" />}
                  <span>
                    {activeDrawerTab === "parameters" && "Interactive Parameters"}
                    {activeDrawerTab === "study" && "Guided Learning Lab"}
                    {activeDrawerTab === "explorer" && "Simulation Modules"}
                    {activeDrawerTab === "telemetry" && "Physics Telemetry & Formulas"}
                  </span>
                </h3>
                <button
                  id="btn-close-drawer"
                  onClick={() => setActiveDrawerTab(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Dynamic Content */}
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
                {activeDrawerTab === "parameters" && (
                  <SimulationParameterSlider
                    parameters={activePreset.parameters}
                    values={paramValues}
                    onChange={handleParamChange}
                    onReset={handleResetParams}
                  />
                )}

                {activeDrawerTab === "study" && (
                  <SimulationStudyGuide
                    challenges={activePreset.challenges}
                    activeModelName={activePreset.name}
                    onAskTutor={tutorHandler}
                  />
                )}

                {activeDrawerTab === "explorer" && (
                  <SimulationPresetSelector
                    activePresetId={activePreset.id}
                    onSelectPreset={handleSelectPreset}
                  />
                )}

                {activeDrawerTab === "telemetry" && (
                  <SimulationTelemetry
                    metrics={currentFrameData?.metrics}
                    formulas={currentFrameData?.formulas}
                    fps={fps}
                    hoveredNode={hoveredNode}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Main Controls Bar */}
      <div id="simulation-bottom-bar" className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/90 backdrop-blur-md z-20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <SimulationControls
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onStepForward={() => {
            setIsPlaying(false);
            simTimeRef.current += 0.05;
            if (activePreset && localPresetStateRef.current) {
              const frame = activePreset.update(localPresetStateRef.current, simTimeRef.current, 0.05, paramValues);
              parserRef.current?.parseAndApplyFrame(frame, simTimeRef.current);
              setCurrentFrameData(frame);
            }
            if (soundEnabled) playSoundFeedback(500, 0.04);
          }}
          onReset={handleResetParams}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
          shadingMode={renderMode}
          onChangeShadingMode={setRenderMode}
          cameraPreset={cameraPreset}
          onChangeCameraPreset={handleCameraPresetChange}
          isOrbiting={isOrbiting}
          onToggleOrbit={() => setIsOrbiting(!isOrbiting)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onCaptureSnapshot={handleCaptureSnapshot}
        />
      </div>
    </div>
  );
};
