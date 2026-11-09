import React, { useState } from "react";

export interface MahrEmblemLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  showStatusIndicator?: boolean;
  shape?: "circle" | "rounded";
  variant?: "light" | "default";
}

/**
 * Official MAHR Brand Emblem Logo Component
 * Restored to authentic high-resolution PNG brand vector emblem
 */
export const MahrEmblemLogo: React.FC<MahrEmblemLogoProps> = ({
  className = "",
  size = 38,
  showText = false,
  showStatusIndicator = false,
  shape = "circle",
  variant = "default",
}) => {
  const [imgError, setImgError] = useState(false);
  const numericSize = typeof size === "number" ? size : parseInt(size as string, 10) || 38;
  const logoSrc = variant === "light" ? "/brand/logo-light.png" : "/brand/logo.png";

  return (
    <div className={`relative inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Outer Brand Frame with Luxury Gold & Violet Cyber Accents */}
      <div
        className={`relative shrink-0 overflow-hidden flex items-center justify-center ${
          shape === "circle" ? "rounded-full" : "rounded-xl"
        } border-2 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-300/30 transition-transform duration-300 hover:scale-105 bg-[#070b1a]`}
        style={{ width: numericSize, height: numericSize }}
      >
        {!imgError ? (
          <img
            src={logoSrc}
            alt="MAHR Official"
            className="w-full h-full object-cover object-center select-none pointer-events-none p-0.5"
            loading="eager"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-purple-600/30 text-amber-300 font-mono font-bold text-xs">
            M
          </div>
        )}

        {/* Ambient Ring Highlight */}
        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
      </div>

      {/* Online Status Beacon */}
      {showStatusIndicator && (
        <span className="absolute -bottom-0.5 -left-0.5 flex h-2.5 w-2.5 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900" />
        </span>
      )}

      {/* Typography Brand Label */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold font-mono text-sm tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
              MAHR
            </span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold tracking-widest border border-amber-400/40">
              AI
            </span>
          </div>
          <span className="text-[8px] font-mono text-amber-300/60 tracking-widest uppercase mt-0.5">
            Cognitive OS
          </span>
        </div>
      )}
    </div>
  );
};

export default MahrEmblemLogo;
