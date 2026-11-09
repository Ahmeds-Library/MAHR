import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleDot, Sparkles, Box } from "lucide-react";
import type { FlickDragState, TossablePropKind } from "./mascotPhysicsTypes";

interface MascotFlickAimOverlayProps {
  flickState: FlickDragState;
}

const PROP_META: Record<
  TossablePropKind,
  {
    label: string;
    strokeHex: string;
    glowHex: string;
    badgeClass: string;
    icon: React.ReactNode;
  }
> = {
  plasma_ball: {
    label: "TOSS PLASMA BALL",
    strokeHex: "#38BDF8",
    glowHex: "rgba(56,189,248,0.85)",
    badgeClass: "border-cyan-400/80 bg-slate-950/90 text-cyan-200",
    icon: <CircleDot className="h-3.5 w-3.5 text-cyan-300" />,
  },
  butterfly: {
    label: "RELEASE BUTTERFLY",
    strokeHex: "#E879F9",
    glowHex: "rgba(232,121,249,0.85)",
    badgeClass: "border-fuchsia-400/80 bg-slate-950/90 text-fuchsia-200",
    icon: <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />,
  },
  cyber_cube: {
    label: "TOSS CYBER CUBE",
    strokeHex: "#34D399",
    glowHex: "rgba(52,211,153,0.85)",
    badgeClass: "border-emerald-400/80 bg-slate-950/90 text-emerald-200",
    icon: <Box className="h-3.5 w-3.5 text-emerald-300" />,
  },
};

/**
 * Layer 3 Presentation Overlay: Direct Flick-Throw Aim Vector HUD
 * Appears while clicking and dragging from the mascot to visualize launch direction,
 * velocity arc, and the active toybox prop being thrown.
 */
export const MascotFlickAimOverlay: React.FC<MascotFlickAimOverlayProps> = ({
  flickState,
}) => {
  const { isDragging, deltaX, deltaY, powerRatio, propKind } = flickState;
  const meta = PROP_META[propKind];

  // Clamp visual vector length to 145px for clean HUD rendering
  const dist = Math.hypot(deltaX, deltaY);
  const maxVisualLen = 145;
  const scale = dist > 0 ? Math.min(maxVisualLen, dist) / dist : 0;
  const endX = deltaX * scale;
  const endY = deltaY * scale;

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          key="flick-aim-hud"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.12 }}
          className="pointer-events-none absolute inset-0 z-50 overflow-visible"
        >
          {/* SVG Trajectory Vector Line & Target Reticle from Mascot Center */}
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 overflow-visible"
            width="1"
            height="1"
          >
            {/* Glowing launch vector line */}
            <line
              x1={0}
              y1={0}
              x2={endX}
              y2={endY}
              stroke={meta.strokeHex}
              strokeWidth={2.5}
              strokeDasharray="6 5"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 8px ${meta.glowHex})`,
              }}
            />

            {/* Intermediate trajectory arc preview dots */}
            {[0.28, 0.56, 0.84].map((t) => (
              <circle
                key={t}
                cx={endX * t}
                cy={endY * t - Math.sin(t * Math.PI) * 14}
                r={2.6}
                fill="#FFFFFF"
                stroke={meta.strokeHex}
                strokeWidth={1.5}
              />
            ))}

            {/* Launch tip reticle */}
            <g transform={`translate(${endX}, ${endY})`}>
              <circle
                cx={0}
                cy={0}
                r={9}
                fill="rgba(15,23,42,0.85)"
                stroke={meta.strokeHex}
                strokeWidth={2}
                style={{
                  filter: `drop-shadow(0 0 10px ${meta.glowHex})`,
                }}
              />
              <circle cx={0} cy={0} r={3.2} fill="#FFFFFF" />
            </g>
          </svg>

          {/* Floating Prop & Power Callout Pill near the drag tip */}
          <div
            style={{
              transform: `translate3d(${Math.round(endX)}px, ${Math.round(
                endY - 28
              )}px, 0)`,
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
          >
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider shadow-lg backdrop-blur-md ${meta.badgeClass}`}
            >
              {meta.icon}
              <span>{meta.label}</span>
              <span className="opacity-80">
                {Math.max(15, Math.round(powerRatio * 100))}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
