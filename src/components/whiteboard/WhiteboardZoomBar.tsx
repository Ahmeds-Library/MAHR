import React from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface WhiteboardZoomBarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  className?: string;
}

export const WhiteboardZoomBar: React.FC<WhiteboardZoomBarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  className = ""
}) => {
  return (
    <div
      className={`absolute bottom-4 left-4 z-30 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-xl border border-white/15 text-xs font-mono select-none shadow-2xl ${className}`}
    >
      <span className="text-[11px] text-slate-400 font-semibold tracking-wider">ZOOM</span>
      <span className="font-bold text-cyan-400 min-w-[38px] text-center">
        {Math.round(zoom * 100)}%
      </span>
      <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-white/10">
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.25}
          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut size={12} />
        </button>
        <button
          onClick={onZoomIn}
          disabled={zoom >= 4.0}
          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn size={12} />
        </button>
        <button
          onClick={onResetZoom}
          className="px-2 h-6 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] text-slate-300 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer border border-white/5"
          title="Reset Zoom & Pan (100%)"
        >
          <RotateCcw size={10} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
