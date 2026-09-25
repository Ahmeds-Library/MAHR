import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X } from "lucide-react";

interface WhiteboardStylusHUDProps {
  isVisible: boolean;
  livePressureTelemetry: {
    pressure?: number;
    pointerType?: string;
    width?: number;
    opacity?: number;
  } | null;
  isDrawing: boolean;
  activeBrushName: string;
  defaultWidth: number;
  onDismiss?: () => void;
  className?: string;
}

export const WhiteboardStylusHUD: React.FC<WhiteboardStylusHUDProps> = ({
  isVisible,
  livePressureTelemetry,
  isDrawing,
  activeBrushName,
  defaultWidth,
  onDismiss,
  className = ""
}) => {
  if (!isVisible) return null;

  const pressureVal = livePressureTelemetry?.pressure ?? 0.5;
  const pressurePct = Math.round(pressureVal * 100);
  const contextWidth = Number(livePressureTelemetry?.width || defaultWidth || 4).toFixed(1);
  const contextOpacity = Math.round((livePressureTelemetry?.opacity ?? 1.0) * 100);
  const pointerType = livePressureTelemetry?.pointerType || "pen";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className={`absolute bottom-4 right-4 z-30 hidden md:flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/15 shadow-2xl text-xs font-mono select-none w-52 pointer-events-auto ${className}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Activity size={12} className={isDrawing ? "animate-pulse text-emerald-400" : "text-cyan-400"} />
            <span className="text-[11px] tracking-wide">Stylus Dynamics</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 capitalize">
              {pointerType === "pen" ? "🖊️ Pen" : pointerType === "touch" ? "👆 Touch" : "🖱️ Cursor"}
            </span>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-slate-500 hover:text-white transition cursor-pointer p-0.5 rounded"
                title="Hide Dynamics HUD"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Tip Pressure Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-slate-300">
            <span className="text-slate-400">Tip Pressure</span>
            <span className="font-bold text-cyan-300">{pressurePct}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400"
              style={{
                width: `${Math.min(100, Math.max(4, pressurePct))}%`
              }}
              transition={{ ease: "easeOut", duration: 0.08 }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5 border-t border-white/5 text-[10px]">
          <div className="flex flex-col bg-white/5 rounded-lg px-2 py-1">
            <span className="text-[8px] text-slate-400 uppercase tracking-wider">Width</span>
            <span className="font-bold text-emerald-300">{contextWidth} px</span>
          </div>
          <div className="flex flex-col bg-white/5 rounded-lg px-2 py-1">
            <span className="text-[8px] text-slate-400 uppercase tracking-wider">Opacity</span>
            <span className="font-bold text-purple-300">{contextOpacity}%</span>
          </div>
        </div>

        {/* Active Profile Info */}
        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
          <span>Brush:</span>
          <span className="text-slate-200 font-semibold truncate max-w-[110px]">
            {activeBrushName}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
