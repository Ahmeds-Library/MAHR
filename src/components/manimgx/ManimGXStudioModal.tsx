/**
 * ManimGX 3D Mathematical Studio Modal
 * Presentation Layer: Responsive 2-zone sandbox uniting 3D WebGPU canvas, code editor, storyboards, and slides export.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Bot, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle,
  Film
} from "lucide-react";
import { useManimGXStudio } from "../../hooks/manimgx/useManimGXStudio";
import { useManimGXSlideSync } from "../../hooks/manimgx/useManimGXSlideSync";
import { ManimGXCanvas3D } from "./ManimGXCanvas3D";
import { ManimGXCodeEditor } from "./ManimGXCodeEditor";
import { ManimGXStoryboardInspector } from "./ManimGXStoryboardInspector";
import { ManimGXControlsBar } from "./ManimGXControlsBar";

interface ManimGXStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPresetId?: string;
  onInjectIntoSlides?: (videoUrl: string, title: string) => void;
}

export const ManimGXStudioModal: React.FC<ManimGXStudioModalProps> = ({
  isOpen,
  onClose,
  initialPresetId = "riemann",
  onInjectIntoSlides
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"stage" | "storyboard">("stage");

  const studio = useManimGXStudio(initialPresetId);
  const slideSync = useManimGXSlideSync();

  const handleExportSlides = async () => {
    const res = await slideSync.exportSceneToMp4(
      studio.validation.sceneName || "ManimGXScene",
      studio.code,
      studio.duration
    );
    if (res && onInjectIntoSlides) {
      onInjectIntoSlides(res.videoUrl, studio.validation.sceneName);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
            isFullScreen ? "h-full max-w-none" : "h-[92vh] max-w-7xl"
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow">
                <Film className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    ManimGX 3D Mathematical Engine
                  </h3>
                  <span className="text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded">
                    academa-labs/manimgx
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>GPU-Accelerated (Rust / wgpu)</span>
                  <span aria-hidden="true">·</span>
                  <span>WebGPU In-Browser Simulation</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-medium">90.6x Speedup</span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main 2-Zone Responsive Workstation */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            {/* Zone A (Left / Top): 3D Viewport & Storyboards */}
            <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
              {/* Navigation Tabs (3D Stage vs Storyboards) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveTab("stage")}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      activeTab === "stage"
                        ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    3D Mathematical Viewport
                  </button>
                  <button
                    onClick={() => setActiveTab("storyboard")}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      activeTab === "storyboard"
                        ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Storyboard Inspector (manimgx inspect)
                  </button>
                </div>

                {slideSync.lastExport && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rendered to 1080p60 MP4</span>
                  </div>
                )}
              </div>

              {/* Viewport or Inspector Body */}
              {activeTab === "stage" ? (
                <div className="flex-1 flex flex-col gap-3 min-h-[350px]">
                  <ManimGXCanvas3D
                    bindCanvas={studio.bindCanvas}
                    activeView={studio.activeView}
                    setView={studio.setView}
                    showAxes={studio.showAxes}
                    toggleAxesMode={studio.toggleAxesMode}
                    showWireframe={studio.showWireframe}
                    toggleWireframeMode={studio.toggleWireframeMode}
                    autoRotate={studio.autoRotate}
                    toggleAutoRotateMode={studio.toggleAutoRotateMode}
                  />

                  {/* Playback & Telemetry Controls */}
                  <ManimGXControlsBar
                    isPlaying={studio.isPlaying}
                    togglePlay={studio.togglePlay}
                    currentTime={studio.currentTime}
                    duration={studio.duration}
                    scrub={studio.scrub}
                    playbackSpeed={studio.playbackSpeed}
                    changeSpeed={studio.changeSpeed}
                    telemetry={studio.telemetry}
                    onExportToSlides={handleExportSlides}
                    isExporting={slideSync.isExporting}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                  <ManimGXStoryboardInspector
                    frames={studio.storyboardFrames}
                    currentTime={studio.currentTime}
                    onScrubTo={(t) => {
                      studio.scrub(t);
                      setActiveTab("stage");
                    }}
                  />

                  {/* Secondary 3D preview thumbnail */}
                  <div className="h-64 rounded-xl overflow-hidden border border-slate-800">
                    <ManimGXCanvas3D
                      bindCanvas={studio.bindCanvas}
                      activeView={studio.activeView}
                      setView={studio.setView}
                      showAxes={studio.showAxes}
                      toggleAxesMode={studio.toggleAxesMode}
                      showWireframe={studio.showWireframe}
                      toggleWireframeMode={studio.toggleWireframeMode}
                      autoRotate={studio.autoRotate}
                      toggleAutoRotateMode={studio.toggleAutoRotateMode}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Zone B (Right / Bottom): Code Editor & Presets */}
            <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col p-3 bg-slate-950/50 shrink-0">
              <ManimGXCodeEditor
                code={studio.code}
                updateCode={studio.updateCode}
                compileCode={studio.compileCode}
                validation={studio.validation}
                activePresetId={studio.activePresetId}
                selectPreset={studio.selectPreset}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
