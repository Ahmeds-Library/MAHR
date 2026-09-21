import React from "react";
import { ZoomIn, ZoomOut, X } from "lucide-react";

interface MagnifierOverlayProps {
  isOpen: boolean;
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  onClose: () => void;
  isRulerEnabled: boolean;
  rulerY: number;
  onRulerYChange: (y: number) => void;
}

export const MagnifierOverlay: React.FC<MagnifierOverlayProps> = ({
  isOpen,
  zoomScale,
  onZoomChange,
  onClose,
  isRulerEnabled,
  rulerY,
  onRulerYChange
}) => {
  if (!isOpen && !isRulerEnabled) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/90 border border-white/20 p-2 rounded-xl backdrop-blur-md shadow-2xl">
          <span className="text-xs font-mono font-bold text-slate-300">ZOOM: {(Number(zoomScale) || 1.0).toFixed(1)}x</span>
          <button
            onClick={() => onZoomChange(Math.min((Number(zoomScale) || 1.0) + 0.2, 3.0))}
            className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-400 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => onZoomChange(Math.max((Number(zoomScale) || 1.0) - 0.2, 1.0))}
            className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-400 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer"
            title="Close Magnifier"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isRulerEnabled && (
        <div
          className="fixed left-0 w-full h-12 bg-cyan-500/10 border-y border-cyan-400/40 pointer-events-auto cursor-ns-resize z-40 transition-all flex items-center justify-between px-6"
          style={{ top: `${Number(rulerY) || 50}%` }}
          onMouseDown={(e) => {
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const pct = (moveEvent.clientY / window.innerHeight) * 100;
              onRulerYChange(Math.max(5, Math.min(90, pct)));
            };
            const handleMouseUp = () => {
              window.removeEventListener("mousemove", handleMouseMove);
              window.removeEventListener("mouseup", handleMouseUp);
            };
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
          }}
        >
          <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider uppercase select-none">
            📏 GUIDED FOCUS READING RULER (Drag vertically)
          </span>
          <span className="text-[10px] font-mono text-cyan-400 select-none">Position: {(Number(rulerY) || 50).toFixed(0)}%</span>
        </div>
      )}
    </>
  );
};
