/**
 * ManimGX Timeline & Controls Bar
 * Presentation Layer: Playback control, scrubbing, speed regulation, and slide export.
 */

import React from "react";
import { 
  Play, 
  Pause, 
  FastForward, 
  Download, 
  Presentation, 
  Film, 
  Cpu,
  Layers
} from "lucide-react";
import { ManimGXCompileTelemetry } from "../../services/manimgx/manimgxTypes";

interface ManimGXControlsBarProps {
  isPlaying: boolean;
  togglePlay: () => void;
  currentTime: number;
  duration: number;
  scrub: (timeSec: number) => void;
  playbackSpeed: number;
  changeSpeed: (speed: number) => void;
  telemetry: ManimGXCompileTelemetry;
  onExportToSlides?: () => void;
  isExporting?: boolean;
}

export const ManimGXControlsBar: React.FC<ManimGXControlsBarProps> = ({
  isPlaying,
  togglePlay,
  currentTime,
  duration,
  scrub,
  playbackSpeed,
  changeSpeed,
  telemetry,
  onExportToSlides,
  isExporting
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${ms}`;
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-950/90 rounded-xl border border-slate-800 shadow-md">
      {/* Top: Progress Scrubber */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Scrubber Range */}
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 6}
            step={0.05}
            value={currentTime}
            onChange={(e) => scrub(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>

        {/* Timecode */}
        <div className="font-mono text-xs text-slate-300 min-w-[7.5rem] text-right font-medium">
          <span className="text-cyan-400">{formatTime(currentTime)}</span>
          <span className="text-slate-600"> / </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Bottom: Speed, Telemetry, and Export Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
        {/* Playback Speeds */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 mr-1">Speed:</span>
          {[0.5, 1.0, 1.5, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                playbackSpeed === s
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Real-time Hardware Telemetry */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{telemetry.renderBackend}</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>{telemetry.fps} FPS</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>{telemetry.polyCount} polys</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="text-emerald-400">{telemetry.compileTimeMs}ms compile</span>
        </div>

        {/* Slide Pipeline Export CTA */}
        {onExportToSlides && (
          <button
            onClick={onExportToSlides}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all ${
              isExporting
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-95"
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>{isExporting ? "Rendering MP4..." : "Export to Google Slides"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
