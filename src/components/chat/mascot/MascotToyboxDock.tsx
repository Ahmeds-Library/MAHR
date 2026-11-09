import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CircleDot,
  Sparkles,
  Box,
  Orbit,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { MascotActivity } from "./mascotPlayTypes";
import type { TossablePropKind } from "./mascotPhysicsTypes";

interface MascotToyboxDockProps {
  visible: boolean;
  activeActivity: MascotActivity;
  selectedTossProp?: TossablePropKind;
  onSelectTossProp?: (prop: TossablePropKind) => void;
  onTriggerTrick: (trick: MascotActivity) => void;
}

interface ToyboxActionItem {
  trick: MascotActivity;
  tossKind?: TossablePropKind;
  shortTag: string;
  label: string;
  icon: React.ReactNode;
  accentClass: string;
  glowColor: string;
}

const TOYBOX_ACTIONS: ToyboxActionItem[] = [
  {
    trick: "ball_play",
    tossKind: "plasma_ball",
    shortTag: "PLASMA",
    label: "Plasma Ball (Click or Drag Mascot to Flick-Toss)",
    icon: <CircleDot className="h-3.5 w-3.5" />,
    accentClass: "hover:border-cyan-400/80 hover:bg-cyan-500/20 text-cyan-300",
    glowColor: "rgba(34,211,238,0.45)",
  },
  {
    trick: "butterfly_chase",
    tossKind: "butterfly",
    shortTag: "BUTTERFLY",
    label: "Holo Butterfly (Click or Drag Mascot to Flick-Toss)",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    accentClass:
      "hover:border-fuchsia-400/80 hover:bg-fuchsia-500/20 text-fuchsia-300",
    glowColor: "rgba(232,121,249,0.45)",
  },
  {
    trick: "cyber_cube_juggle",
    tossKind: "cyber_cube",
    shortTag: "CUBE",
    label: "Cyber Cube (Click or Drag Mascot to Flick-Toss)",
    icon: <Box className="h-3.5 w-3.5" />,
    accentClass:
      "hover:border-emerald-400/80 hover:bg-emerald-500/20 text-emerald-300",
    glowColor: "rgba(52,211,153,0.45)",
  },
  {
    trick: "star_ring_hop",
    shortTag: "RINGS",
    label: "Sonic Star Rings Dash",
    icon: <Orbit className="h-3.5 w-3.5" />,
    accentClass:
      "hover:border-amber-400/80 hover:bg-amber-500/20 text-amber-300",
    glowColor: "rgba(251,191,36,0.45)",
  },
  {
    trick: "backflip",
    shortTag: "FLIP",
    label: "Afterburner Backflip",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    accentClass:
      "hover:border-violet-400/80 hover:bg-violet-500/20 text-violet-300",
    glowColor: "rgba(167,139,250,0.45)",
  },
  {
    trick: "screen_bonk",
    shortTag: "BONK",
    label: "Glass Screen Bonk",
    icon: <Zap className="h-3.5 w-3.5" />,
    accentClass: "hover:border-rose-400/80 hover:bg-rose-500/20 text-rose-300",
    glowColor: "rgba(251,113,133,0.45)",
  },
];

/**
 * Layer 3 Presentation Control: Upgraded Orbital Hover Command GUI Dock
 * Appears smoothly above the mascot on hover with glassmorphic telemetry framing,
 * active prop indicator, and quick trick/toss launchers.
 */
export const MascotToyboxDock: React.FC<MascotToyboxDockProps> = ({
  visible,
  activeActivity,
  selectedTossProp,
  onSelectTossProp,
  onTriggerTrick,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.92 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute -top-13 right-0 z-40 flex flex-col items-end gap-1"
        >
          {/* Glassmorphic Orbital Command Bar */}
          <div className="flex items-center gap-1 rounded-2xl border border-cyan-500/30 bg-slate-950/92 px-1.5 py-1 shadow-[0_10px_28px_rgba(2,6,23,0.85),0_0_16px_rgba(56,189,248,0.16)] backdrop-blur-xl">
            {TOYBOX_ACTIONS.map((item, idx) => {
              const isRunning = activeActivity === item.trick;
              const isSelectedToss =
                item.tossKind && selectedTossProp === item.tossKind;
              return (
                <React.Fragment key={item.trick}>
                  {idx === 3 && (
                    <div className="mx-0.5 h-4 w-px bg-slate-800/90" />
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    title={item.label}
                    aria-label={item.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.tossKind && onSelectTossProp) {
                        onSelectTossProp(item.tossKind);
                      }
                      onTriggerTrick(item.trick);
                    }}
                    className={`relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-colors duration-150 ${
                      isRunning
                        ? "border-cyan-300 bg-cyan-500/25 text-white shadow-[0_0_12px_rgba(34,211,238,0.55)]"
                        : isSelectedToss
                        ? `border-cyan-400/60 bg-slate-800/95 ${item.accentClass}`
                        : `border-slate-800/80 bg-slate-900/75 ${item.accentClass}`
                    }`}
                  >
                    {item.icon}
                    {isSelectedToss && !isRunning && (
                      <span className="absolute -bottom-0.5 left-1/2 h-1 w-2.5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                    )}
                  </motion.button>
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
