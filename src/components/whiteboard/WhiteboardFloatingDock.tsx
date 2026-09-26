import React, { useState } from "react";
import {
  Hand,
  PenTool,
  Wand2,
  Highlighter as HighlighterIcon,
  GitCommit,
  ArrowUpRight,
  Eraser,
  SlidersHorizontal,
  ChevronUp,
  Mic,
  Sliders,
  Film,
  Sparkles,
  Feather,
  Droplets,
  Edit3,
  Pencil,
  Zap
} from "lucide-react";
import { BRUSH_PROFILES, BrushProfile } from "../../lib/brushProfiles";
import { WhiteboardFloatingDockProps, WhiteboardTool } from "./types";

const CHALK_COLORS = [
  { name: "Chalk White", hex: "#ffffff" },
  { name: "Amber Gold", hex: "#fcd34d" },
  { name: "Mint Emerald", hex: "#6ee7b7" },
  { name: "Cyan Sky", hex: "#38bdf8" },
  { name: "Electric Violet", hex: "#c084fc" },
  { name: "Rose Coral", hex: "#fb7185" },
  { name: "Slate Grey", hex: "#94a3b8" }
];

const BRUSH_SIZES = [
  { label: "Thin", px: 2 },
  { label: "Mid", px: 4 },
  { label: "Thick", px: 8 },
  { label: "Chalk", px: 14 }
];

export const WhiteboardFloatingDock: React.FC<WhiteboardFloatingDockProps> = ({
  tool,
  onSelectTool,
  color,
  onSelectColor,
  brushSize,
  onSelectBrushSize,
  activeBrushProfile,
  onSelectBrushProfile,
  onOpenBrushTuner,
  showVoiceSketch,
  onToggleVoiceSketch,
  showMiniDld,
  onToggleMiniDld,
  isPlaybackMode,
  onTogglePlayback
}) => {
  const [showBrushMenu, setShowBrushMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  const currentProfile = activeBrushProfile || BRUSH_PROFILES[0];

  const getProfileIcon = (iconName?: string, size = 13) => {
    switch (iconName) {
      case "Feather": return <Feather size={size} className="text-cyan-400" />;
      case "Droplets": return <Droplets size={size} className="text-cyan-400" />;
      case "Highlighter": return <HighlighterIcon size={size} className="text-cyan-400" />;
      case "Edit3": return <Edit3 size={size} className="text-cyan-400" />;
      case "Pencil": return <Pencil size={size} className="text-cyan-400" />;
      case "Zap": return <Zap size={size} className="text-cyan-400" />;
      default: return <PenTool size={size} className="text-cyan-400" />;
    }
  };

  return (
    <aside aria-label="Whiteboard drawing tools" className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[96vw]">
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/85 backdrop-blur-2xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.8)] select-none">
        {/* Core Tool Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectTool("pan")}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              tool === "pan"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
            title="Pan Canvas (Click & Drag or Middle Mouse)"
          >
            <Hand size={15} />
          </button>

          <button
            onClick={() => onSelectTool("pen")}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              tool === "pen"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
            title="Freehand Chalk Pen"
          >
            <PenTool size={15} />
          </button>

          <button
            onClick={() => onSelectTool("smartpen")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              tool === "smartpen"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-bold shadow-md shadow-amber-500/30 scale-105"
                : "text-amber-400 hover:text-amber-300 hover:bg-white/5"
            }`}
            title="Smart Pen: Auto-detects and snaps circles, rectangles, triangles, lines, & arrows"
          >
            <Wand2 size={14} />
            <span className="text-[10px] font-mono hidden md:inline">Smart</span>
          </button>

          <button
            onClick={() => onSelectTool("line")}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              tool === "line"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
            title="Snappable Vector Line"
          >
            <GitCommit size={15} />
          </button>

          <button
            onClick={() => onSelectTool("arrow")}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              tool === "arrow"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
            title="Vector Relationship Arrow"
          >
            <ArrowUpRight size={15} />
          </button>

          <button
            onClick={() => onSelectTool("eraser")}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              tool === "eraser"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
            title="Felt Chalkboard Eraser"
          >
            <Eraser size={15} />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-0.5" />

        {/* Brush Profile Quick Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBrushMenu(!showBrushMenu);
              setShowColorMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-cyan-500/40 text-cyan-300 transition-all text-xs font-mono cursor-pointer"
            title="Select Natural Brush Texture & Profile"
          >
            {getProfileIcon(currentProfile.iconName)}
            <span className="hidden sm:inline font-semibold">{currentProfile.name}</span>
            <ChevronUp size={12} className={`text-zinc-400 transition-transform ${showBrushMenu ? "rotate-180" : ""}`} />
          </button>

          {showBrushMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-60 p-2 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl z-50 flex flex-col gap-1">
              <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                <span>Brush Profiles</span>
                <button
                  onClick={() => {
                    setShowBrushMenu(false);
                    onOpenBrushTuner();
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal size={10} />
                  <span>Tuner</span>
                </button>
              </div>

              {BRUSH_PROFILES.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => {
                    onSelectBrushProfile(prof);
                    setShowBrushMenu(false);
                    onSelectTool("pen");
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                    activeBrushProfile.id === prof.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getProfileIcon(prof.iconName, 12)}
                    <span>{prof.name}</span>
                  </div>
                  <span className="text-[9px] text-zinc-500">{prof.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Palette Swatch */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorMenu(!showColorMenu);
              setShowBrushMenu(false);
            }}
            className="flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            title="Select Chalk Pigment"
          >
            <span
              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: color }}
            />
            <ChevronUp size={11} className={`text-zinc-400 transition-transform ${showColorMenu ? "rotate-180" : ""}`} />
          </button>

          {showColorMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl z-50 flex items-center gap-1.5">
              {CHALK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    onSelectColor(c.hex);
                    setShowColorMenu(false);
                  }}
                  className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                    color.toLowerCase() === c.hex.toLowerCase()
                      ? "scale-125 border-white shadow-md ring-2 ring-purple-500/50"
                      : "border-white/20 hover:scale-110"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stroke Sizes */}
        <div className="hidden sm:flex items-center gap-0.5 bg-zinc-900/80 p-0.5 rounded-xl border border-white/10">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s.px}
              onClick={() => onSelectBrushSize(s.px)}
              className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer ${
                brushSize === s.px
                  ? "bg-purple-600 text-white font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-white/10 mx-0.5 hidden md:block" />

        {/* Quick Studio Features */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={onToggleVoiceSketch}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              showVoiceSketch
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
            title="Voice-To-Sketch Speech Recognition"
          >
            <Mic size={14} />
          </button>

          <button
            onClick={onToggleMiniDld}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              showMiniDld
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
            title="Mini DLD Logic Gates Simulator"
          >
            <Sliders size={14} />
          </button>

          <button
            onClick={onTogglePlayback}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isPlaybackMode
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
            title="Replay Scribbles & Drawing History"
          >
            <Film size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
