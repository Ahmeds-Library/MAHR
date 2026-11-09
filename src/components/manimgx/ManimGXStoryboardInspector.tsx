/**
 * ManimGX Storyboard Inspector ("manimgx inspect")
 * Presentation Layer: Displays discrete keyframe storyboards, layout scores, and agent feedback notes.
 */

import React from "react";
import { StoryboardFrame } from "../../services/manimgx/manimgxTypes";
import { 
  Scan, 
  Layers, 
  Sliders, 
  Bot, 
  Clock, 
  CheckCircle 
} from "lucide-react";

interface ManimGXStoryboardInspectorProps {
  frames: StoryboardFrame[];
  currentTime: number;
  onScrubTo: (timeSec: number) => void;
}

export const ManimGXStoryboardInspector: React.FC<ManimGXStoryboardInspectorProps> = ({
  frames,
  currentTime,
  onScrubTo
}) => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
      {/* Title & Inspector Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scan className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-semibold text-slate-200">
            Storyboard Frame Inspector (<code className="text-cyan-300 font-mono text-[10px]">manimgx inspect</code>)
          </h4>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>AI Agent Layout Check</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 font-medium">Bounds Validated</span>
        </div>
      </div>

      {/* Frame Grid / Filmstrip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {frames.map((frame) => {
          const isSelected = Math.abs(currentTime - frame.timeSeconds) < 1.0;

          return (
            <div
              key={frame.frameIndex}
              onClick={() => onScrubTo(frame.timeSeconds)}
              className={`group cursor-pointer rounded-lg p-2.5 transition-all text-xs border ${
                isSelected
                  ? "bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950"
              }`}
            >
              {/* Header: Timestamp and Layout Score */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 font-mono text-[11px] text-cyan-300 font-medium">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>t = {frame.timeSeconds}s</span>
                </div>
                <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                  Score: {frame.layoutScore}%
                </div>
              </div>

              {/* Stage Description */}
              <div className="text-slate-300 font-medium mb-1 line-clamp-1 group-hover:text-cyan-200">
                {frame.label.split(": ")[1] || frame.label}
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                {frame.description}
              </p>

              {/* Active Animations Tag */}
              <div className="flex flex-wrap gap-1 mb-2">
                {frame.activeAnimations.map((anim, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60"
                  >
                    {anim}
                  </span>
                ))}
              </div>

              {/* Agent Feedback Note */}
              <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                <Bot className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2 italic">{frame.agentFeedbackNote}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
