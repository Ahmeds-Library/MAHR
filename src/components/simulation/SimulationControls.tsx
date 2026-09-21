import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Camera,
  Layers,
  Volume2,
  VolumeX,
  Compass,
  Download,
  Gauge
} from "lucide-react";

interface SimulationControlsProps {
  isPlaying?: boolean;
  isPaused?: boolean;
  onTogglePlay?: () => void;
  onTogglePause?: () => void;
  onStepForward?: () => void;
  onReset?: () => void;
  playbackSpeed?: number;
  speed?: number;
  onChangeSpeed?: (speed: number) => void;
  onSpeedChange?: (speed: number) => void;
  shadingMode?: "hologram" | "solid" | "wireframe";
  showWireframe?: boolean;
  onChangeShadingMode?: (mode: "hologram" | "solid" | "wireframe") => void;
  onToggleWireframe?: () => void;
  cameraPreset?: "perspective" | "top" | "front" | "side";
  onChangeCameraPreset?: (preset: "perspective" | "top" | "front" | "side") => void;
  onSetCameraView?: (preset: "perspective" | "top" | "front" | "side" | "reset") => void;
  onResetCamera?: () => void;
  isOrbiting?: boolean;
  onToggleOrbit?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onCaptureSnapshot?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onAskMyraaAboutSimulation?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPlaying,
  isPaused,
  onTogglePlay,
  onTogglePause,
  onStepForward,
  onReset,
  playbackSpeed,
  speed,
  onChangeSpeed,
  onSpeedChange,
  shadingMode,
  showWireframe,
  onChangeShadingMode,
  onToggleWireframe,
  cameraPreset = "perspective",
  onChangeCameraPreset,
  onSetCameraView,
  onResetCamera,
  isOrbiting = false,
  onToggleOrbit,
  soundEnabled = true,
  onToggleSound,
  onCaptureSnapshot,
}) => {
  // Normalize playback state
  const activePlaying = isPlaying !== undefined ? isPlaying : isPaused !== undefined ? !isPaused : true;
  const activeSpeed = playbackSpeed !== undefined ? playbackSpeed : speed !== undefined ? speed : 1.0;
  const activeShading = shadingMode || (showWireframe ? "wireframe" : "hologram");

  const handlePlayToggle = () => {
    if (onTogglePlay) onTogglePlay();
    else if (onTogglePause) onTogglePause();
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (onChangeSpeed) onChangeSpeed(newSpeed);
    else if (onSpeedChange) onSpeedChange(newSpeed);
  };

  const handleCameraChange = (cam: "perspective" | "top" | "front" | "side") => {
    if (onChangeCameraPreset) {
      onChangeCameraPreset(cam);
    } else if (onSetCameraView) {
      onSetCameraView(cam === "perspective" ? "reset" : cam);
    }
  };

  const handleShadingChange = (mode: "hologram" | "solid" | "wireframe") => {
    if (onChangeShadingMode) {
      onChangeShadingMode(mode);
    } else if (onToggleWireframe) {
      onToggleWireframe();
    }
  };

  return (
    <div id="simulation-main-controls-bar" className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
      {/* Playback Transport Controls */}
      <div className="flex items-center gap-1.5">
        <button
          id="btn-play-pause"
          onClick={handlePlayToggle}
          className={`flex items-center justify-center w-9 h-9 rounded-xl font-bold transition-all shadow-md ${
            activePlaying
              ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
          }`}
          title={activePlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {activePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {onStepForward && (
          <button
            id="btn-step-forward"
            onClick={onStepForward}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Single Step (+dt)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        )}

        {onReset && (
          <button
            id="btn-reset-sim"
            onClick={onReset}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Reset Simulation (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Speed Slider / Presets */}
      <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800/80">
        <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="text-xs font-mono text-slate-300 font-bold min-w-[34px]">
          {Number.isFinite(activeSpeed) ? activeSpeed.toFixed(1) : "1.0"}x
        </span>
        <input
          id="slider-playback-speed"
          type="range"
          min={0.1}
          max={3.0}
          step={0.1}
          value={activeSpeed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          title="Adjust Simulation Time Dilation"
        />
      </div>

      {/* Camera View Angle Presets */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
        {(["perspective", "front", "top", "side"] as const).map((cam) => (
          <button
            key={cam}
            id={`btn-cam-${cam}`}
            onClick={() => handleCameraChange(cam)}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all ${
              cameraPreset === cam
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {cam === "perspective" ? "3D" : cam}
          </button>
        ))}

        {onToggleOrbit && (
          <button
            id="btn-toggle-orbit"
            onClick={onToggleOrbit}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
              isOrbiting
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Auto-Rotate Camera Orbit"
          >
            <Compass className={`w-3 h-3 ${isOrbiting ? "animate-spin" : ""}`} />
            <span>Orbit</span>
          </button>
        )}
      </div>

      {/* Shading Mode Toggles & Snapshots */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          {(["hologram", "solid", "wireframe"] as const).map((mode) => (
            <button
              key={mode}
              id={`btn-shade-${mode}`}
              onClick={() => handleShadingChange(mode)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                activeShading === mode
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {onToggleSound && (
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
              soundEnabled
                ? "bg-cyan-950/60 border-cyan-700/50 text-cyan-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            title={soundEnabled ? "Mute Physical Audio Feedback" : "Enable Physical Audio Feedback"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        )}

        {onCaptureSnapshot && (
          <button
            id="btn-capture-snapshot"
            onClick={onCaptureSnapshot}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors text-xs font-semibold"
            title="Export High-Res Canvas Snapshot"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>
        )}
      </div>
    </div>
  );
};
