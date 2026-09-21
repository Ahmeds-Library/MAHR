import React from "react";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import { PsychologyProfile } from "../services/colorPsychologyEngine";
import { getThemeConfig } from "../services/themeService";

interface HolographicCanvasProps {
  themeColor: string;
  autoShiftBackground: boolean;
  psychologyProfile: PsychologyProfile;
  isMagnifierOpen: boolean;
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  onCloseMagnifier: () => void;
  isRulerEnabled: boolean;
  magnifierRulerY: number;
  onRulerYChange: (y: number) => void;
  children: React.ReactNode;
}

export const HolographicCanvas: React.FC<HolographicCanvasProps> = ({
  themeColor,
  autoShiftBackground,
  psychologyProfile,
  isMagnifierOpen,
  zoomScale,
  onZoomChange,
  onCloseMagnifier,
  isRulerEnabled,
  magnifierRulerY,
  onRulerYChange,
  children
}) => {
  const activeThemeConfig = getThemeConfig(themeColor);

  return (
    <div
      id="myraa-holographic-desktop"
      className="relative w-full h-screen overflow-hidden bg-[#020205] text-white flex flex-col justify-between p-6 sm:p-10 select-none theme-transition"
    >
      {/* Immersive Dynamic Atmosphere Background Gradient Layer */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out z-0"
        style={{
          background: autoShiftBackground && psychologyProfile
            ? psychologyProfile.bgGradientCss
            : activeThemeConfig.ambientGradient
        }}
      />

      {/* Dynamic Multi-Color Holographic Ambient Glow Blobs */}
      <div
        className={`absolute ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[0].position
            : "top-[-10%] left-[-5%]"
        } ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[0].size
            : "w-[600px] h-[600px]"
        } rounded-full ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[0].blur
            : "blur-[130px]"
        } pointer-events-none transition-all duration-700 ease-in-out z-0`}
        style={{
          backgroundColor:
            autoShiftBackground && psychologyProfile
              ? psychologyProfile.primaryHex
              : activeThemeConfig.hex,
          opacity: autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[0].opacity : 0.35
        }}
      />
      <div
        className={`absolute ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[1].position
            : "bottom-[-10%] right-[-5%]"
        } ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[1].size
            : "w-[680px] h-[680px]"
        } rounded-full ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[1].blur
            : "blur-[160px]"
        } pointer-events-none transition-all duration-700 ease-in-out z-0`}
        style={{
          backgroundColor:
            autoShiftBackground && psychologyProfile
              ? psychologyProfile.secondaryHex
              : activeThemeConfig.secondaryHex,
          opacity: autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[1].opacity : 0.30
        }}
      />
      <div
        className={`absolute ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[2].position
            : "top-[25%] right-[10%]"
        } ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[2].size
            : "w-[400px] h-[400px]"
        } rounded-full ${
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.ambientBlobs[2].blur
            : "blur-[110px]"
        } pointer-events-none transition-all duration-700 ease-in-out z-0`}
        style={{
          backgroundColor:
            autoShiftBackground && psychologyProfile
              ? psychologyProfile.tertiaryHex
              : activeThemeConfig.tertiaryHex,
          opacity: autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[2].opacity : 0.22
        }}
      />

      {/* Guided Focus Ruler & Magnifier Overlays */}
      {isMagnifierOpen && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/90 border border-white/20 p-2 rounded-xl backdrop-blur-md shadow-2xl">
          <span className="text-xs font-mono font-bold text-slate-300">ZOOM: {(Number(zoomScale) || 1.0).toFixed(1)}x</span>
          <button
            onClick={() => onZoomChange(Math.min((Number(zoomScale) || 1.0) + 0.2, 3.0))}
            className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-400 transition"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => onZoomChange(Math.max((Number(zoomScale) || 1.0) - 0.2, 1.0))}
            className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-400 transition"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={onCloseMagnifier}
            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
            title="Close Magnifier"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isRulerEnabled && (
        <div
          className="absolute left-0 w-full h-12 bg-cyan-500/10 border-y border-cyan-400/40 pointer-events-auto cursor-ns-resize z-40 transition-all flex items-center justify-between px-6"
          style={{ top: `${Number(magnifierRulerY) || 50}%` }}
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
          <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
            📏 GUIDED FOCUS READING RULER (Drag vertically)
          </span>
          <span className="text-[10px] font-mono text-cyan-400">Position: {(Number(magnifierRulerY) || 50).toFixed(0)}%</span>
        </div>
      )}

      {/* Main Content Wrap */}
      <div
        className="relative z-10 w-full h-full flex flex-col justify-between transition-transform duration-300 origin-center"
        style={{ transform: isMagnifierOpen ? `scale(${zoomScale})` : "scale(1)" }}
      >
        {children}
      </div>
    </div>
  );
};
