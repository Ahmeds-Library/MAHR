import React, { useState } from "react";
import { X, Rotate3D, Eye, Sparkles } from "lucide-react";
import { MahrSphericalDroneMascot } from "./MahrSphericalDroneMascot";
import { DronePoseAngle } from "./droneVectorTypes";
import { EyeExpression } from "../useMascotPlayEngine";

interface DroneTurnaroundSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePoseMode: DronePoseAngle | "auto";
  onSelectPoseMode: (pose: DronePoseAngle | "auto") => void;
}

const TURNAROUND_VIEWS: Array<{
  id: DronePoseAngle;
  label: string;
  gaze: { x: number; y: number };
}> = [
  { id: "front", label: "Front View", gaze: { x: 0, y: 0 } },
  { id: "three_quarter_left", label: "3/4 Front View", gaze: { x: -0.65, y: 0 } },
  { id: "side_left", label: "Side View", gaze: { x: -1, y: 0 } },
  { id: "three_quarter_back_left", label: "3/4 Back View", gaze: { x: -1, y: 0 } },
  { id: "top_down", label: "Top-Down View", gaze: { x: 0, y: 0.85 } },
  { id: "back", label: "Back View", gaze: { x: 0, y: 0 } },
  { id: "bottom_up", label: "Bottom-Up View", gaze: { x: 0, y: -0.85 } },
  { id: "dynamic_tilt", label: "Dynamic Tilt View", gaze: { x: -0.25, y: -0.15 } },
  { id: "three_quarter_right", label: "Isometric View", gaze: { x: 0.65, y: 0.15 } },
];

const EXPRESSIONS: Array<{ id: EyeExpression; label: string }> = [
  { id: "normal", label: "Cyan Ring" },
  { id: "happy", label: "Happy" },
  { id: "wink", label: "Wink" },
  { id: "curious", label: "Curious" },
  { id: "thinking", label: "Thinking" },
  { id: "sleepy", label: "Sleepy" },
  { id: "angry", label: "Alert" },
];

export const DroneTurnaroundSheetModal: React.FC<DroneTurnaroundSheetModalProps> = ({
  isOpen,
  onClose,
  activePoseMode,
  onSelectPoseMode,
}) => {
  const [previewExpression, setPreviewExpression] = useState<EyeExpression>("normal");
  const [showReferenceSheet, setShowReferenceSheet] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Rotate3D className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                MAHR Spherical Hover-Drone Vector Turnaround Rig
              </h3>
              <p className="text-xs text-slate-400">
                Multi-angle 3D-projected vector companion converted from character sheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReferenceSheet(!showReferenceSheet)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                showReferenceSheet
                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showReferenceSheet ? "Show Live Vector Rig" : "Compare Original Sheet"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close turnaround modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Eye Expression:</span>
            {EXPRESSIONS.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => setPreviewExpression(exp.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  previewExpression === exp.id
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {exp.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onSelectPoseMode("auto")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activePoseMode === "auto"
                ? "bg-purple-500/25 text-purple-200 border border-purple-400/40"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dynamic 3D Cursor Tracking (Active Default)</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {showReferenceSheet ? (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                <img
                  src="/assets/aistudio/Mascot_character_sheet_turnaround_2K_20261022143452_80e535f4.jpg"
                  alt="Uploaded Spherical Drone Character Turnaround Sheet"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto rounded-lg object-contain"
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                Reference 2K Character Turnaround Sheet · Converted into parametric multi-angle SVG vector layers
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {TURNAROUND_VIEWS.map((view) => {
                const isSelected = activePoseMode === view.id;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => onSelectPoseMode(view.id)}
                    className={`group flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-950/30 border-cyan-400/50 shadow-lg shadow-cyan-950/40"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <MahrSphericalDroneMascot
                      expression={previewExpression}
                      forcePose={view.id}
                      gaze={view.gaze}
                      size={92}
                      showGroundShadow={true}
                    />
                    <span className="mt-2 text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {view.label}
                    </span>
                  </button>
                );
              })}

              {/* 10th Card: Close-Up Expression View */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800/80 bg-slate-950/60">
                <div className="w-[92px] h-[92px] rounded-xl overflow-hidden flex items-center justify-center bg-slate-900 border border-slate-800">
                  <div className="scale-[1.75] translate-y-1">
                    <MahrSphericalDroneMascot
                      expression={previewExpression}
                      forcePose="front"
                      size={82}
                    />
                  </div>
                </div>
                <span className="mt-2 text-xs font-medium text-slate-200">
                  Close-Up Expression
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
