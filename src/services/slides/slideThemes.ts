import { SlideTheme } from "./slideTypes";

export const SLIDE_THEMES: Record<string, SlideTheme> = {
  obsidian_neon: {
    id: "obsidian_neon",
    name: "Obsidian Neon",
    description: "Deep obsidian canvas with luminous cyan and purple highlights",
    bgGradient: "radial-gradient(ellipse at top right, rgba(168, 85, 247, 0.15), transparent 60%), radial-gradient(ellipse at bottom left, rgba(56, 189, 248, 0.12), transparent 50%), #0a0d14",
    slideBg: "#0a0d14",
    cardBg: "rgba(22, 27, 46, 0.8)",
    borderCol: "rgba(168, 85, 247, 0.25)",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    accentCol: "#a855f7",
    accentGlow: "0 0 25px rgba(168, 85, 247, 0.4)",
    fontHeading: "font-sans font-bold tracking-tight",
    fontBody: "font-sans",
    googleRgb: {
      background: { red: 0.04, green: 0.05, blue: 0.08 },
      titleText: { red: 0.98, green: 0.98, blue: 1.0 },
      bodyText: { red: 0.70, green: 0.75, blue: 0.82 },
      accent: { red: 0.66, green: 0.33, blue: 0.97 }
    }
  },
  cyber_minimal: {
    id: "cyber_minimal",
    name: "Cyber Minimal",
    description: "Ultra-clean dark tech aesthetic with emerald cyber accents",
    bgGradient: "radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.12), transparent 45%), #09090b",
    slideBg: "#09090b",
    cardBg: "rgba(24, 24, 27, 0.85)",
    borderCol: "rgba(16, 185, 129, 0.3)",
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    accentCol: "#10b981",
    accentGlow: "0 0 25px rgba(16, 185, 129, 0.35)",
    fontHeading: "font-mono font-semibold tracking-wide",
    fontBody: "font-sans",
    googleRgb: {
      background: { red: 0.035, green: 0.035, blue: 0.04 },
      titleText: { red: 0.98, green: 0.98, blue: 0.98 },
      bodyText: { red: 0.75, green: 0.75, blue: 0.78 },
      accent: { red: 0.06, green: 0.72, blue: 0.50 }
    }
  },
  royal_executive: {
    id: "royal_executive",
    name: "Royal Executive",
    description: "Sophisticated midnight navy with luxurious warm gold accents",
    bgGradient: "radial-gradient(circle at 20% 20%, rgba(234, 179, 8, 0.14), transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 58, 138, 0.3), transparent 60%), #070d1e",
    slideBg: "#070d1e",
    cardBg: "rgba(15, 27, 54, 0.8)",
    borderCol: "rgba(234, 179, 8, 0.3)",
    textPrimary: "#ffffff",
    textSecondary: "#cbd5e1",
    accentCol: "#eab308",
    accentGlow: "0 0 25px rgba(234, 179, 8, 0.35)",
    fontHeading: "font-sans font-bold tracking-tight",
    fontBody: "font-sans",
    googleRgb: {
      background: { red: 0.03, green: 0.05, blue: 0.12 },
      titleText: { red: 1.0, green: 1.0, blue: 1.0 },
      bodyText: { red: 0.82, green: 0.86, blue: 0.92 },
      accent: { red: 0.92, green: 0.70, blue: 0.03 }
    }
  },
  crimson_pulse: {
    id: "crimson_pulse",
    name: "Crimson Velvet",
    description: "Bold dramatic velvet backdrop with fiery rose gold accents",
    bgGradient: "radial-gradient(circle at 50% 10%, rgba(244, 63, 94, 0.18), transparent 60%), #0f050b",
    slideBg: "#0f050b",
    cardBg: "rgba(35, 12, 22, 0.8)",
    borderCol: "rgba(244, 63, 94, 0.3)",
    textPrimary: "#fff1f2",
    textSecondary: "#fda4af",
    accentCol: "#f43f5e",
    accentGlow: "0 0 25px rgba(244, 63, 94, 0.35)",
    fontHeading: "font-sans font-extrabold tracking-tight",
    fontBody: "font-sans",
    googleRgb: {
      background: { red: 0.06, green: 0.02, blue: 0.04 },
      titleText: { red: 1.0, green: 0.95, blue: 0.95 },
      bodyText: { red: 0.95, green: 0.75, blue: 0.80 },
      accent: { red: 0.95, green: 0.25, blue: 0.37 }
    }
  },
  frost_celestial: {
    id: "frost_celestial",
    name: "Frost Celestial",
    description: "Crisp arctic slate with high-tech sky blue illumination",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.18), transparent 55%), #09131d",
    slideBg: "#09131d",
    cardBg: "rgba(15, 32, 50, 0.8)",
    borderCol: "rgba(56, 189, 248, 0.3)",
    textPrimary: "#f0f9ff",
    textSecondary: "#bae6fd",
    accentCol: "#38bdf8",
    accentGlow: "0 0 25px rgba(56, 189, 248, 0.35)",
    fontHeading: "font-sans font-bold tracking-tight",
    fontBody: "font-sans",
    googleRgb: {
      background: { red: 0.04, green: 0.07, blue: 0.11 },
      titleText: { red: 0.95, green: 0.98, blue: 1.0 },
      bodyText: { red: 0.75, green: 0.88, blue: 0.98 },
      accent: { red: 0.22, green: 0.74, blue: 0.97 }
    }
  }
};

export const DEFAULT_THEME_ID = "obsidian_neon";
