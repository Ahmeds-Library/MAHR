/**
 * ManimGX 3D WebGPU/WebGL Canvas Viewport
 * Presentation Layer: Renders real-time 3D mathematical surfaces with camera orbit and orientation tools.
 */

import React, { useRef, useEffect } from "react";
import { 
  Camera, 
  RotateCw, 
  Layers, 
  Grid, 
  Eye, 
  Sparkles,
  Maximize2
} from "lucide-react";

interface ManimGXCanvas3DProps {
  bindCanvas: (canvas: HTMLCanvasElement | null) => void;
  activeView: "top" | "front" | "isometric" | "side";
  setView: (view: "top" | "front" | "isometric" | "side") => void;
  showAxes: boolean;
  toggleAxesMode: () => void;
  showWireframe: boolean;
  toggleWireframeMode: () => void;
  autoRotate: boolean;
  toggleAutoRotateMode: () => void;
  onCaptureSnapshot?: () => void;
}

export const ManimGXCanvas3D: React.FC<ManimGXCanvas3DProps> = ({
  bindCanvas,
  activeView,
  setView,
  showAxes,
  toggleAxesMode,
  showWireframe,
  toggleWireframeMode,
  autoRotate,
  toggleAutoRotateMode,
  onCaptureSnapshot
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      bindCanvas(canvasRef.current);
    }
    return () => {
      bindCanvas(null);
    };
  }, [bindCanvas]);

  return (
    <div className="relative w-full h-full min-h-[320px] bg-slate-950 rounded-xl overflow-hidden border border-cyan-900/40 shadow-inner flex flex-col">
      {/* Top Overlay HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Left: View Angle Segmented Control */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 text-xs text-slate-300">
          <button
            onClick={() => setView("isometric")}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeView === "isometric" 
                ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm" 
                : "hover:text-white hover:bg-slate-800"
            }`}
          >
            Isometric
          </button>
          <button
            onClick={() => setView("top")}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeView === "top" 
                ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm" 
                : "hover:text-white hover:bg-slate-800"
            }`}
          >
            Top (XY)
          </button>
          <button
            onClick={() => setView("front")}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeView === "front" 
                ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm" 
                : "hover:text-white hover:bg-slate-800"
            }`}
          >
            Front (XZ)
          </button>
          <button
            onClick={() => setView("side")}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeView === "side" 
                ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm" 
                : "hover:text-white hover:bg-slate-800"
            }`}
          >
            Side (YZ)
          </button>
        </div>

        {/* Right: Stage Visual Toggles */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 text-xs text-slate-300">
          <button
            onClick={toggleAutoRotateMode}
            title={autoRotate ? "Pause orbit rotation" : "Enable orbit rotation"}
            className={`p-1.5 rounded transition-colors ${
              autoRotate ? "text-cyan-400 bg-cyan-950/60" : "text-slate-400 hover:text-white"
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleWireframeMode}
            title={showWireframe ? "Solid mesh" : "Wireframe mesh"}
            className={`p-1.5 rounded transition-colors ${
              showWireframe ? "text-amber-400 bg-amber-950/60" : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={toggleAxesMode}
            title={showAxes ? "Hide coordinate axes" : "Show coordinate axes"}
            className={`p-1.5 rounded transition-colors ${
              showAxes ? "text-emerald-400 bg-emerald-950/60" : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          {onCaptureSnapshot && (
            <button
              onClick={onCaptureSnapshot}
              title="Capture Frame"
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Canvas Element */}
      <canvas
        ref={canvasRef}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing block"
      />

      {/* Subtle Bottom Controls Hint */}
      <div className="absolute bottom-2 left-3 pointer-events-none text-[11px] text-slate-400/80 flex items-center gap-2">
        <span>Click & drag to rotate</span>
        <span aria-hidden="true">·</span>
        <span>Scroll to zoom</span>
        <span aria-hidden="true">·</span>
        <span className="text-cyan-400/90 font-mono">WebGPU / WebGL2 60 FPS</span>
      </div>
    </div>
  );
};
