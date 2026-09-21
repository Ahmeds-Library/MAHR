import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ZoomIn, X, Sliders } from "lucide-react";

export interface ScreenShareMagnifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenStream: MediaStream | null;
  zoomScale: number;
  setZoomScale: (val: number) => void;
  isRulerEnabled: boolean;
  setIsRulerEnabled: (val: boolean) => void;
  magnifierRulerY: number;
  setMagnifierRulerY: (val: number) => void;
}

export const ScreenShareMagnifierModal: React.FC<ScreenShareMagnifierModalProps> = ({
  isOpen,
  onClose,
  screenStream,
  zoomScale,
  setZoomScale,
  isRulerEnabled,
  setIsRulerEnabled,
  magnifierRulerY,
  setMagnifierRulerY,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-slate-900/90 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(52,211,153,0.25)] flex flex-col h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                  <ZoomIn size={18} />
                </div>
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-sky-450 font-bold">
                    Holographic Screen Reader
                  </h3>
                  <p className="text-sm font-semibold text-white">Interactive Zoom Lens & Guided Focus Ruler</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500 hover:border-rose-400 text-slate-400 hover:text-white transition duration-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Viewport Frame with interactive pan or cursor tracking */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden p-6">
              <div
                className="relative aspect-video w-full max-w-4xl rounded-2xl overflow-hidden bg-slate-900/40 border border-white/10 shadow-inner group cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  const el = e.currentTarget.querySelector("video");
                  if (el) {
                    el.style.transformOrigin = `${x}% ${y}%`;
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget.querySelector("video");
                  if (el) {
                    el.style.transformOrigin = "center center";
                  }
                }}
              >
                <video
                  ref={(el) => {
                    if (el && screenStream && el.srcObject !== screenStream) {
                      el.srcObject = screenStream;
                      el.muted = true;
                      el.play().catch((err) => console.log("Magnifier stream play error:", err));
                    }
                  }}
                  style={{ transform: `scale(${zoomScale})` }}
                  className="w-full h-full object-contain transition-transform duration-100 ease-out pointer-events-none"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Guided Focusing Line Ruler */}
                {isRulerEnabled && (
                  <div
                    className="absolute left-0 right-0 h-8 bg-amber-400/10 border-y-2 border-amber-400/40 pointer-events-none transition-all flex items-center justify-between px-4"
                    style={{ top: `${magnifierRulerY}%`, transform: "translateY(-50%)" }}
                  >
                    <div className="h-full flex items-center">
                      <span className="text-[9px] font-mono font-black text-amber-200 bg-amber-950/80 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        STUDY FOCUS LINE
                      </span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  </div>
                )}

                {/* Instruction watermark */}
                <div className="absolute bottom-3 left-3 bg-slate-950/65 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-mono text-slate-350 pointer-events-none select-none">
                  ✨ Drag vertical slider to align guided focus rule. Move mouse over screen to aim zoom.
                </div>
              </div>
            </div>

            {/* Controls bar panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-950/50">
              {/* Scale selection */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 uppercase font-semibold">Magnify Level:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 1.5, 2, 3, 4].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setZoomScale(scale)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition cursor-pointer ${
                        zoomScale === scale
                          ? "bg-sky-500/20 border-sky-400/40 text-sky-300 font-bold"
                          : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Ruler Toggle & height slider */}
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setIsRulerEnabled(!isRulerEnabled)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                    isRulerEnabled
                      ? "bg-amber-500/10 border-amber-400/30 text-amber-300"
                      : "bg-white/5 border-white/5 text-slate-400"
                  }`}
                >
                  <Sliders size={12} />
                  <span>Focus Line</span>
                </button>
                {isRulerEnabled && (
                  <div className="flex-1 flex items-center gap-2 max-w-[160px]">
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={magnifierRulerY}
                      onChange={(e) => setMagnifierRulerY(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <span className="text-[10px] font-mono text-amber-300 w-6 text-right">{magnifierRulerY}%</span>
                  </div>
                )}
              </div>

              {/* Info Text */}
              <div className="text-right text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden md:block">
                Academic Focus Assist Module Active
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
