import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, Pause, ZoomIn, RefreshCw, Square } from "lucide-react";

export interface FloatingScreenShareHubProps {
  isScreenSharing: boolean;
  isScreenSharingPaused: boolean;
  screenVisionMode: boolean;
  setScreenVisionMode: (val: boolean) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onSwitch?: () => void;
  onOpenMagnifier: () => void;
  screenStream: MediaStream | null;
}

export const FloatingScreenShareHub: React.FC<FloatingScreenShareHubProps> = ({
  isScreenSharing,
  isScreenSharingPaused,
  screenVisionMode,
  setScreenVisionMode,
  onStop,
  onPause,
  onResume,
  onSwitch,
  onOpenMagnifier,
  screenStream,
}) => {
  return (
    <AnimatePresence>
      {isScreenSharing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.85, x: 50 }}
          className={`fixed bottom-6 md:bottom-8 right-6 md:right-8 z-[80] w-72 p-4 rounded-2xl border ${
            isScreenSharingPaused
              ? "border-amber-500/20 bg-slate-950/70"
              : "border-cyan-500/20 bg-slate-950/70"
          } backdrop-blur-2xl shadow-2xl overflow-hidden`}
        >
          {/* Header / Indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isScreenSharingPaused ? "bg-amber-400" : "bg-cyan-400 animate-pulse"
                }`}
              />
              <span className="text-[10px] font-bold font-mono tracking-widest text-slate-200">
                {isScreenSharingPaused ? "SCREEN VISION PAUSED" : "SCREEN VISION ACTIVE"}
              </span>
            </div>
            <button
              onClick={onStop}
              className="text-slate-400 hover:text-white transition-colors duration-150 p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              title="Stop Sharing"
            >
              <X size={14} />
            </button>
          </div>

          {/* Smart Video PIP Preview Holder */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-white/5 mb-3 flex items-center justify-center group select-none">
            <video
              ref={(el) => {
                if (el && screenStream && el.srcObject !== screenStream) {
                  el.srcObject = screenStream;
                  el.muted = true;
                  el.play().catch((err) => console.log("Mini preview stream play issue:", err));
                }
              }}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isScreenSharingPaused ? "opacity-30 blur-sm" : "opacity-90"
              }`}
              autoPlay
              playsInline
              muted
            />

            {isScreenSharingPaused && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-widest font-mono text-amber-400 font-bold px-2 py-1 bg-amber-950/40 border border-amber-500/20 rounded-md">
                  Transmission Paused
                </span>
              </div>
            )}

            {!isScreenSharingPaused && screenVisionMode && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-400/20 text-[9px] font-mono text-cyan-300">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                <span>Streaming FPS: 0.5</span>
              </div>
            )}
          </div>

          {/* Quick Action Control Strip */}
          <div className="flex flex-col gap-2 mb-2.5">
            <div className="flex items-center justify-between gap-1.5">
              {isScreenSharingPaused ? (
                <button
                  onClick={onResume}
                  className="flex-1 py-1.5 px-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-xs font-mono font-medium text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Resume Streaming Feed"
                >
                  <Play size={10} />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-mono font-medium text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Pause Streaming Feed"
                >
                  <Pause size={10} />
                  <span>Pause</span>
                </button>
              )}

              {onSwitch && (
                <button
                  onClick={onSwitch}
                  className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Choose Another Screen or Window"
                >
                  <RefreshCw size={11} />
                  <span>Switch</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-1.5">
              <button
                onClick={onOpenMagnifier}
                className="flex-1 py-1.5 px-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-xs font-mono font-medium text-sky-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Zoom and focus line reader"
              >
                <ZoomIn size={12} className="text-sky-400" />
                <span>Zoom / Read</span>
              </button>

              <button
                onClick={onStop}
                className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-mono text-rose-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Terminate Stream"
              >
                <Square size={9} />
                <span>Stop</span>
              </button>
            </div>
          </div>

          {/* Core Mode Configuration Toggle */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-left">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold font-mono text-slate-200">SCREEN VISION MODE</span>
              <span className="text-[8px] text-slate-400 uppercase font-mono max-w-[150px]">
                Gemini Auto-Analysis
              </span>
            </div>
            <button
              onClick={() => setScreenVisionMode(!screenVisionMode)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                screenVisionMode ? "bg-cyan-500" : "bg-white/10"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                  screenVisionMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
