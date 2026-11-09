/**
 * Layer 1 — Curated Presenton Themes & Color Palettes
 */

import { PresentonTheme } from "./presentonTypes";

export const DEFAULT_PRESENTON_THEME_ID = "midnight-executive";

export const PRESENTON_THEMES: Record<string, PresentonTheme> = {
  "midnight-executive": {
    id: "midnight-executive",
    name: "Midnight Executive",
    tagline: "Obsidian slate with electric indigo & crisp glass hierarchy",
    isDark: true,
    canvasBg: "#070913",
    slideSurface: "linear-gradient(135deg, #0B0F1F 0%, #111832 55%, #0D1326 100%)",
    cardSurface: "rgba(30, 41, 75, 0.52)",
    cardBorder: "rgba(99, 102, 241, 0.28)",
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    accentHex: "#6366F1",
    accentSecondaryHex: "#38BDF8",
    badgeBg: "rgba(99, 102, 241, 0.18)",
    badgeText: "#A5B4FC",
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    pptxColors: {
      background: "0B0F1F",
      cardBg: "16203D",
      title: "F8FAFC",
      body: "CBD5E1",
      accent: "6366F1",
      border: "2E3C66"
    },
    googleRgb: {
      background: { red: 0.043, green: 0.059, blue: 0.122 },
      titleText: { red: 0.973, green: 0.98, blue: 0.988 },
      bodyText: { red: 0.796, green: 0.835, blue: 0.882 },
      accent: { red: 0.388, green: 0.4, blue: 0.945 }
    }
  },
  "editorial-light": {
    id: "editorial-light",
    name: "Editorial Ivory",
    tagline: "Warm paper canvas with deep espresso typography & terracotta accents",
    isDark: false,
    canvasBg: "#EAE6DF",
    slideSurface: "linear-gradient(135deg, #FAF8F5 0%, #F3EFE6 100%)",
    cardSurface: "rgba(255, 255, 255, 0.86)",
    cardBorder: "rgba(28, 25, 23, 0.12)",
    textPrimary: "#1C1917",
    textSecondary: "#44403C",
    textMuted: "#78716C",
    accentHex: "#C2410C",
    accentSecondaryHex: "#0F766E",
    badgeBg: "rgba(194, 65, 12, 0.12)",
    badgeText: "#9A3412",
    fontHeading: "'Playfair Display', 'Georgia', serif",
    fontBody: "'Inter', system-ui, sans-serif",
    pptxColors: {
      background: "FAF8F5",
      cardBg: "FFFFFF",
      title: "1C1917",
      body: "44403C",
      accent: "C2410C",
      border: "D6D3CD"
    },
    googleRgb: {
      background: { red: 0.98, green: 0.973, blue: 0.961 },
      titleText: { red: 0.11, green: 0.098, blue: 0.09 },
      bodyText: { red: 0.267, green: 0.251, blue: 0.235 },
      accent: { red: 0.761, green: 0.255, blue: 0.047 }
    }
  },
  "cyber-emerald": {
    id: "cyber-emerald",
    name: "Emerald Matrix",
    tagline: "Deep carbon forest with high-contrast mint telemetry",
    isDark: true,
    canvasBg: "#040D0A",
    slideSurface: "linear-gradient(135deg, #061410 0%, #0B241C 60%, #071914 100%)",
    cardSurface: "rgba(16, 48, 38, 0.55)",
    cardBorder: "rgba(16, 185, 129, 0.3)",
    textPrimary: "#ECFDF5",
    textSecondary: "#A7F3D0",
    textMuted: "#6EE7B7",
    accentHex: "#10B981",
    accentSecondaryHex: "#14B8A6",
    badgeBg: "rgba(16, 185, 129, 0.18)",
    badgeText: "#6EE7B7",
    fontHeading: "'Space Grotesk', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    pptxColors: {
      background: "061410",
      cardBg: "0E2B22",
      title: "ECFDF5",
      body: "A7F3D0",
      accent: "10B981",
      border: "1B4D3E"
    },
    googleRgb: {
      background: { red: 0.024, green: 0.078, blue: 0.063 },
      titleText: { red: 0.925, green: 0.992, blue: 0.961 },
      bodyText: { red: 0.655, green: 0.953, blue: 0.816 },
      accent: { red: 0.063, green: 0.725, blue: 0.506 }
    }
  },
  "nordic-minimal": {
    id: "nordic-minimal",
    name: "Nordic Alabaster",
    tagline: "Crisp architectural white with Swiss cobalt precision",
    isDark: false,
    canvasBg: "#E2E8F0",
    slideSurface: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)",
    cardSurface: "rgba(255, 255, 255, 0.92)",
    cardBorder: "rgba(15, 23, 42, 0.1)",
    textPrimary: "#0F172A",
    textSecondary: "#334155",
    textMuted: "#64748B",
    accentHex: "#2563EB",
    accentSecondaryHex: "#0284C7",
    badgeBg: "rgba(37, 99, 235, 0.1)",
    badgeText: "#1D4ED8",
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    pptxColors: {
      background: "F8FAFC",
      cardBg: "FFFFFF",
      title: "0F172A",
      body: "334155",
      accent: "2563EB",
      border: "CBD5E1"
    },
    googleRgb: {
      background: { red: 0.973, green: 0.98, blue: 0.988 },
      titleText: { red: 0.059, green: 0.09, blue: 0.165 },
      bodyText: { red: 0.2, green: 0.255, blue: 0.333 },
      accent: { red: 0.145, green: 0.388, blue: 0.922 }
    }
  },
  "royal-academic": {
    id: "royal-academic",
    name: "Royal Academic",
    tagline: "Oxford navy blueprint with warm amber-gold highlights",
    isDark: true,
    canvasBg: "#070B14",
    slideSurface: "linear-gradient(135deg, #0A1124 0%, #132042 65%, #0D1730 100%)",
    cardSurface: "rgba(24, 38, 74, 0.58)",
    cardBorder: "rgba(245, 158, 11, 0.3)",
    textPrimary: "#F8FAFC",
    textSecondary: "#E2E8F0",
    textMuted: "#94A3B8",
    accentHex: "#F59E0B",
    accentSecondaryHex: "#60A5FA",
    badgeBg: "rgba(245, 158, 11, 0.18)",
    badgeText: "#FCD34D",
    fontHeading: "'Playfair Display', 'Inter', serif",
    fontBody: "'Inter', system-ui, sans-serif",
    pptxColors: {
      background: "0A1124",
      cardBg: "162447",
      title: "F8FAFC",
      body: "E2E8F0",
      accent: "F59E0B",
      border: "334155"
    },
    googleRgb: {
      background: { red: 0.039, green: 0.067, blue: 0.141 },
      titleText: { red: 0.973, green: 0.98, blue: 0.988 },
      bodyText: { red: 0.886, green: 0.91, blue: 0.941 },
      accent: { red: 0.961, green: 0.62, blue: 0.043 }
    }
  },
  "sunset-pitch": {
    id: "sunset-pitch",
    name: "Sunset Venture",
    tagline: "Warm plum charcoal with coral-rose startup energy",
    isDark: true,
    canvasBg: "#110812",
    slideSurface: "linear-gradient(135deg, #180B1A 0%, #2A122D 55%, #1D0D22 100%)",
    cardSurface: "rgba(56, 23, 62, 0.52)",
    cardBorder: "rgba(244, 63, 94, 0.32)",
    textPrimary: "#FFF1F2",
    textSecondary: "#FECDD3",
    textMuted: "#FDA4AF",
    accentHex: "#F43F5E",
    accentSecondaryHex: "#FB923C",
    badgeBg: "rgba(244, 63, 94, 0.2)",
    badgeText: "#FDA4AF",
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    pptxColors: {
      background: "180B1A",
      cardBg: "2D1433",
      title: "FFF1F2",
      body: "FECDD3",
      accent: "F43F5E",
      border: "581C4F"
    },
    googleRgb: {
      background: { red: 0.094, green: 0.043, blue: 0.102 },
      titleText: { red: 1, green: 0.945, blue: 0.949 },
      bodyText: { red: 0.996, green: 0.804, blue: 0.827 },
      accent: { red: 0.957, green: 0.247, blue: 0.369 }
    }
  }
};

export const PRESENTON_THEME_LIST: PresentonTheme[] = Object.values(PRESENTON_THEMES);
