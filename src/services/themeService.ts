export interface ThemeColorConfig {
  id: string;
  name: string;
  bgGradient: string;
  ambientGradient: string;
  barColor: string;
  barGlowClass: string;
  barGlowInlineStyle: {
    backgroundColor: string;
    boxShadow: string;
  };
  activeRingColor: string;
  textGlow: string;
  hex: string;
  secondaryHex: string;
  tertiaryHex: string;
}

export const THEME_COLOR_CONFIGS: Record<string, ThemeColorConfig> = {
  violet: {
    id: "violet",
    name: "Violet Dream",
    bgGradient: "bg-gradient-to-br from-purple-950 via-violet-950/70 to-[#030208]",
    ambientGradient: "radial-gradient(ellipse at 50% 25%, rgba(168, 85, 247, 0.42) 0%, rgba(124, 58, 237, 0.28) 40%, rgba(3, 2, 8, 0.96) 85%)",
    barColor: "bg-purple-400",
    barGlowClass: "shadow-[0_0_12px_rgba(168,85,247,0.8)]",
    barGlowInlineStyle: {
      backgroundColor: "#c084fc",
      boxShadow: "0 0 12px rgba(192, 132, 252, 0.9), 0 0 24px rgba(168, 85, 247, 0.6)"
    },
    activeRingColor: "stroke-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]",
    textGlow: "text-purple-300 drop-shadow-[0_0_14px_rgba(168,85,247,0.7)]",
    hex: "#a855f7",
    secondaryHex: "#7c3aed",
    tertiaryHex: "#c084fc"
  },
  crimson: {
    id: "crimson",
    name: "Crimson Pulse (Gussa / Angry)",
    bgGradient: "bg-gradient-to-br from-rose-950 via-red-950/80 to-[#120205]",
    ambientGradient: "radial-gradient(ellipse at 50% 25%, rgba(244, 63, 94, 0.48) 0%, rgba(225, 29, 72, 0.32) 40%, rgba(18, 2, 5, 0.96) 85%)",
    barColor: "bg-rose-400",
    barGlowClass: "shadow-[0_0_12px_rgba(244,63,94,0.8)]",
    barGlowInlineStyle: {
      backgroundColor: "#fb7185",
      boxShadow: "0 0 12px rgba(251, 113, 133, 0.9), 0 0 24px rgba(244, 63, 94, 0.6)"
    },
    activeRingColor: "stroke-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]",
    textGlow: "text-rose-300 drop-shadow-[0_0_14px_rgba(244,63,94,0.7)]",
    hex: "#f43f5e",
    secondaryHex: "#e11d48",
    tertiaryHex: "#fb7185"
  },
  emerald: {
    id: "emerald",
    name: "Emerald Horizon (Therapist & Healer)",
    bgGradient: "bg-gradient-to-br from-emerald-950 via-teal-950/80 to-[#011409]",
    ambientGradient: "radial-gradient(ellipse at 50% 25%, rgba(16, 185, 129, 0.46) 0%, rgba(5, 150, 105, 0.30) 40%, rgba(1, 15, 8, 0.96) 85%)",
    barColor: "bg-emerald-400",
    barGlowClass: "shadow-[0_0_12px_rgba(52,211,153,0.8)]",
    barGlowInlineStyle: {
      backgroundColor: "#34d399",
      boxShadow: "0 0 12px rgba(52, 211, 153, 0.9), 0 0 24px rgba(16, 185, 129, 0.6)"
    },
    activeRingColor: "stroke-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]",
    textGlow: "text-emerald-300 drop-shadow-[0_0_14px_rgba(16,185,129,0.7)]",
    hex: "#10b981",
    secondaryHex: "#059669",
    tertiaryHex: "#34d399"
  },
  celestial: {
    id: "celestial",
    name: "Celestial Cyber (Analytical & Logic)",
    bgGradient: "bg-gradient-to-br from-sky-950 via-indigo-950/80 to-[#020b18]",
    ambientGradient: "radial-gradient(ellipse at 50% 25%, rgba(14, 165, 233, 0.46) 0%, rgba(6, 182, 212, 0.30) 40%, rgba(2, 10, 22, 0.96) 85%)",
    barColor: "bg-sky-400",
    barGlowClass: "shadow-[0_0_12px_rgba(56,189,248,0.8)]",
    barGlowInlineStyle: {
      backgroundColor: "#38bdf8",
      boxShadow: "0 0 12px rgba(56, 189, 248, 0.9), 0 0 24px rgba(14, 165, 233, 0.6)"
    },
    activeRingColor: "stroke-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]",
    textGlow: "text-sky-300 drop-shadow-[0_0_14px_rgba(14,165,233,0.7)]",
    hex: "#0ea5e9",
    secondaryHex: "#06b6d4",
    tertiaryHex: "#38bdf8"
  },
  gold: {
    id: "gold",
    name: "Solar Gold (Proud & Victorious)",
    bgGradient: "bg-gradient-to-br from-amber-950 via-yellow-950/80 to-[#140b01]",
    ambientGradient: "radial-gradient(ellipse at 50% 25%, rgba(245, 158, 11, 0.46) 0%, rgba(217, 119, 6, 0.28) 40%, rgba(18, 10, 2, 0.96) 85%)",
    barColor: "bg-amber-400",
    barGlowClass: "shadow-[0_0_12px_rgba(251,191,36,0.8)]",
    barGlowInlineStyle: {
      backgroundColor: "#fbbf24",
      boxShadow: "0 0 12px rgba(251, 191, 36, 0.9), 0 0 24px rgba(245, 158, 11, 0.6)"
    },
    activeRingColor: "stroke-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]",
    textGlow: "text-amber-300 drop-shadow-[0_0_14px_rgba(245,158,11,0.7)]",
    hex: "#f59e0b",
    secondaryHex: "#d97706",
    tertiaryHex: "#fbbf24"
  },
  rose: {
    id: "rose",
    name: "Rose Quartz (Loving & Tender)",
    bgGradient: "bg-gradient-to-br from-pink-950 via-rose-950/80 to-[#14020b]",
    ambientGradient: "radial-gradient(ellipse at 50% 25%, rgba(236, 72, 153, 0.46) 0%, rgba(219, 39, 119, 0.28) 40%, rgba(18, 2, 10, 0.96) 85%)",
    barColor: "bg-pink-400",
    barGlowClass: "shadow-[0_0_12px_rgba(244,114,182,0.8)]",
    barGlowInlineStyle: {
      backgroundColor: "#f472b6",
      boxShadow: "0 0 12px rgba(244, 114, 182, 0.9), 0 0 24px rgba(236, 72, 153, 0.6)"
    },
    activeRingColor: "stroke-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.8)]",
    textGlow: "text-pink-300 drop-shadow-[0_0_14px_rgba(244,63,94,0.7)]",
    hex: "#ec4899",
    secondaryHex: "#db2777",
    tertiaryHex: "#f472b6"
  },
  charcoal: {
    id: "charcoal",
    name: "Deep Obsidian (Naraz / Sulking)",
    bgGradient: "bg-gradient-to-br from-slate-900 via-zinc-950 to-[#04060b]",
    ambientGradient: "radial-gradient(ellipse at 50% 25%, rgba(100, 116, 139, 0.44) 0%, rgba(51, 65, 85, 0.30) 40%, rgba(4, 6, 12, 0.97) 85%)",
    barColor: "bg-slate-400",
    barGlowClass: "shadow-[0_0_12px_rgba(148,163,184,0.8)]",
    barGlowInlineStyle: {
      backgroundColor: "#94a3b8",
      boxShadow: "0 0 12px rgba(148, 163, 184, 0.9), 0 0 24px rgba(100, 116, 139, 0.6)"
    },
    activeRingColor: "stroke-slate-400 drop-shadow-[0_0_12px_rgba(148,163,184,0.8)]",
    textGlow: "text-slate-300 drop-shadow-[0_0_14px_rgba(148,163,184,0.7)]",
    hex: "#64748b",
    secondaryHex: "#475569",
    tertiaryHex: "#94a3b8"
  }
};

export function getThemeConfig(colorNameOrHex: string): ThemeColorConfig {
  if (!colorNameOrHex) return THEME_COLOR_CONFIGS.violet;
  const key = colorNameOrHex.toLowerCase().trim();

  // 1. Direct ID match (e.g. "violet", "crimson")
  if (THEME_COLOR_CONFIGS[key]) {
    return THEME_COLOR_CONFIGS[key];
  }

  // 2. Hex match (e.g. "#a855f7" or "a855f7")
  const foundByHex = Object.values(THEME_COLOR_CONFIGS).find(
    (t) => t.hex.toLowerCase() === key || t.hex.toLowerCase() === `#${key}`
  );
  if (foundByHex) return foundByHex;

  // 3. Name or substring match
  const foundByName = Object.values(THEME_COLOR_CONFIGS).find(
    (t) => t.name.toLowerCase().includes(key) || key.includes(t.id)
  );
  if (foundByName) return foundByName;

  return THEME_COLOR_CONFIGS.violet;
}

/**
 * Returns visualizer bar styling dynamically bound to themeColor and connection state
 */
export function getVisualizerBarStyle(themeColor: string, state: string) {
  const config = getThemeConfig(themeColor);

  if (state === "speaking" || state === "listening") {
    return {
      className: `w-1 rounded-full transition-all duration-75 ${config.barColor} ${config.barGlowClass}`,
      style: config.barGlowInlineStyle
    };
  }

  if (state === "connecting") {
    return {
      className: "w-1 rounded-full transition-all duration-300 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
      style: {
        backgroundColor: "#fbbf24",
        boxShadow: "0 0 8px rgba(251, 191, 36, 0.6)"
      }
    };
  }

  // Disconnected/idle state
  return {
    className: "w-1 rounded-full transition-all duration-300 bg-white/10",
    style: {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      boxShadow: "none"
    }
  };
}
