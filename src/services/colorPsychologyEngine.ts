export interface PsychologyProfile {
  id: string;
  themeId: string; // matches THEME_COLOR_CONFIGS key
  title: string;
  moodTag: string;
  description: string;
  primaryHex: string;
  secondaryHex: string;
  tertiaryHex: string;
  bgGradientCss: string;
  ambientBlobs: Array<{
    color: string;
    opacity: number;
    size: string;
    position: string;
    blur: string;
  }>;
  projectorIntensity?: number;
  valenceScore?: number;
  beamPulseSpeed?: number;
  laserGridOpacity?: number;
}

export const PSYCHOLOGY_PROFILES: Record<string, PsychologyProfile> = {
  serene_growth: {
    id: "serene_growth",
    themeId: "emerald",
    title: "Serene Growth & Empathy",
    moodTag: "Calm & Supportive",
    description: "Soothing emerald-teal gradients promoting mental clarity, high retention, and emotional balance.",
    primaryHex: "#10b981",
    secondaryHex: "#06b6d4",
    tertiaryHex: "#34d399",
    bgGradientCss: "radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.18), transparent 70%), radial-gradient(ellipse at bottom right, rgba(6, 182, 212, 0.15), transparent 70%)",
    ambientBlobs: [
      { color: "#10b981", opacity: 0.2, size: "600px", position: "top-[-10%] left-[-10%]", blur: "blur-[140px]" },
      { color: "#06b6d4", opacity: 0.18, size: "650px", position: "bottom-[-10%] right-[-10%]", blur: "blur-[160px]" },
      { color: "#34d399", opacity: 0.14, size: "400px", position: "top-[25%] right-[12%]", blur: "blur-[120px]" },
    ],
  },
  analytical_logic: {
    id: "analytical_logic",
    themeId: "celestial",
    title: "Analytical Clarity & Wisdom",
    moodTag: "Focused & Deep Logic",
    description: "Electric sky-indigo spectrums stimulating high cognitive focus, problem solving, and architectural reasoning.",
    primaryHex: "#38bdf8",
    secondaryHex: "#6366f1",
    tertiaryHex: "#818cf8",
    bgGradientCss: "radial-gradient(ellipse at top left, rgba(56, 189, 248, 0.18), transparent 70%), radial-gradient(ellipse at bottom right, rgba(99, 102, 241, 0.16), transparent 70%)",
    ambientBlobs: [
      { color: "#38bdf8", opacity: 0.22, size: "580px", position: "top-[-10%] left-[-10%]", blur: "blur-[130px]" },
      { color: "#6366f1", opacity: 0.18, size: "650px", position: "bottom-[-10%] right-[-10%]", blur: "blur-[160px]" },
      { color: "#818cf8", opacity: 0.15, size: "380px", position: "top-[20%] right-[10%]", blur: "blur-[110px]" },
    ],
  },
  creative_spark: {
    id: "creative_spark",
    themeId: "violet",
    title: "Creative Spark & Vision",
    moodTag: "Imaginative & Playful",
    description: "Deep violet-magenta halos enhancing creative lateral thinking, artistic expression, and storytelling.",
    primaryHex: "#8b5cf6",
    secondaryHex: "#ec4899",
    tertiaryHex: "#c084fc",
    bgGradientCss: "radial-gradient(ellipse at top left, rgba(139, 92, 246, 0.18), transparent 70%), radial-gradient(ellipse at bottom right, rgba(236, 72, 153, 0.15), transparent 70%)",
    ambientBlobs: [
      { color: "#8b5cf6", opacity: 0.22, size: "600px", position: "top-[-10%] left-[-10%]", blur: "blur-[130px]" },
      { color: "#ec4899", opacity: 0.18, size: "620px", position: "bottom-[-10%] right-[-10%]", blur: "blur-[150px]" },
      { color: "#c084fc", opacity: 0.14, size: "350px", position: "top-[22%] right-[10%]", blur: "blur-[110px]" },
    ],
  },
  warm_encouragement: {
    id: "warm_encouragement",
    themeId: "gold",
    title: "Solar Energy & Joy",
    moodTag: "Uplifting & Confident",
    description: "Golden solar tones engineered to boost dopamine, celebrate breakthroughs, and inspire confidence.",
    primaryHex: "#fbbf24",
    secondaryHex: "#f59e0b",
    tertiaryHex: "#fb7185",
    bgGradientCss: "radial-gradient(ellipse at top left, rgba(251, 191, 36, 0.18), transparent 70%), radial-gradient(ellipse at bottom right, rgba(245, 158, 11, 0.15), transparent 70%)",
    ambientBlobs: [
      { color: "#fbbf24", opacity: 0.22, size: "550px", position: "top-[-10%] left-[-10%]", blur: "blur-[130px]" },
      { color: "#f59e0b", opacity: 0.18, size: "650px", position: "bottom-[-10%] right-[-10%]", blur: "blur-[160px]" },
      { color: "#fb7185", opacity: 0.14, size: "350px", position: "top-[20%] right-[10%]", blur: "blur-[110px]" },
    ],
  },
  affectionate_harmony: {
    id: "affectionate_harmony",
    themeId: "rose",
    title: "Affectionate Harmony & Warmth",
    moodTag: "Friendly & Cozy",
    description: "Rose quartz soft hues building strong emotional rapport, friendly trust, and cozy learning atmospheres.",
    primaryHex: "#f472b6",
    secondaryHex: "#fb7185",
    tertiaryHex: "#e879f9",
    bgGradientCss: "radial-gradient(ellipse at top left, rgba(244, 114, 182, 0.18), transparent 70%), radial-gradient(ellipse at bottom right, rgba(251, 113, 133, 0.15), transparent 70%)",
    ambientBlobs: [
      { color: "#f472b6", opacity: 0.22, size: "580px", position: "top-[-10%] left-[-10%]", blur: "blur-[130px]" },
      { color: "#fb7185", opacity: 0.18, size: "620px", position: "bottom-[-10%] right-[-10%]", blur: "blur-[150px]" },
      { color: "#e879f9", opacity: 0.14, size: "360px", position: "top-[20%] right-[10%]", blur: "blur-[110px]" },
    ],
  },
  vibrant_urgency: {
    id: "vibrant_urgency",
    themeId: "crimson",
    title: "Vibrant Energy & High Alert",
    moodTag: "Urgent & High Intensity",
    description: "Crimson-coral heat gradients designed for critical debugging, rapid time-sensitive tasks, and high focus.",
    primaryHex: "#f43f5e",
    secondaryHex: "#ef4444",
    tertiaryHex: "#f97316",
    bgGradientCss: "radial-gradient(ellipse at top left, rgba(244, 63, 94, 0.2), transparent 70%), radial-gradient(ellipse at bottom right, rgba(239, 68, 68, 0.16), transparent 70%)",
    ambientBlobs: [
      { color: "#f43f5e", opacity: 0.24, size: "600px", position: "top-[-10%] left-[-10%]", blur: "blur-[130px]" },
      { color: "#ef4444", opacity: 0.2, size: "650px", position: "bottom-[-10%] right-[-10%]", blur: "blur-[160px]" },
      { color: "#f97316", opacity: 0.15, size: "380px", position: "top-[20%] right-[10%]", blur: "blur-[110px]" },
    ],
  },
  tranquil_obsidian: {
    id: "tranquil_obsidian",
    themeId: "charcoal",
    title: "Deep Obsidian Focus",
    moodTag: "Tranquil & Balanced",
    description: "Minimalist slate-indigo ambiance providing a calm, non-distracting canvas for long study sessions.",
    primaryHex: "#818cf8",
    secondaryHex: "#475569",
    tertiaryHex: "#a855f7",
    bgGradientCss: "radial-gradient(ellipse at top left, rgba(129, 140, 248, 0.14), transparent 70%), radial-gradient(ellipse at bottom right, rgba(71, 85, 105, 0.12), transparent 70%)",
    ambientBlobs: [
      { color: "#818cf8", opacity: 0.18, size: "550px", position: "top-[-10%] left-[-10%]", blur: "blur-[130px]" },
      { color: "#475569", opacity: 0.15, size: "600px", position: "bottom-[-10%] right-[-10%]", blur: "blur-[160px]" },
      { color: "#a855f7", opacity: 0.12, size: "350px", position: "top-[20%] right-[10%]", blur: "blur-[110px]" },
    ],
  },
};

/**
  * Analyzes real-time transcript text & active emotion to select the optimal PsychologyProfile.
  */
export function analyzeSpeechColorPsychology(
  userText: string = "",
  modelText: string = "",
  activeEmotion: string = "neutral"
): PsychologyProfile {
  const combined = (userText + " " + modelText).toLowerCase().trim();

  // 1. Topic Sentiment Keyword Analysis
  if (
    combined.includes("logic") ||
    combined.includes("code") ||
    combined.includes("circuit") ||
    combined.includes("math") ||
    combined.includes("science") ||
    combined.includes("algorithm") ||
    combined.includes("system") ||
    combined.includes("debug") ||
    combined.includes("compile") ||
    combined.includes("function")
  ) {
    return PSYCHOLOGY_PROFILES.analytical_logic;
  }

  if (
    combined.includes("nature") ||
    combined.includes("health") ||
    combined.includes("calm") ||
    combined.includes("growth") ||
    combined.includes("peace") ||
    combined.includes("relax") ||
    combined.includes("money") ||
    combined.includes("finance") ||
    combined.includes("biology")
  ) {
    return PSYCHOLOGY_PROFILES.serene_growth;
  }

  if (
    combined.includes("art") ||
    combined.includes("design") ||
    combined.includes("creative") ||
    combined.includes("story") ||
    combined.includes("music") ||
    combined.includes("idea") ||
    combined.includes("dream") ||
    combined.includes("joke")
  ) {
    return PSYCHOLOGY_PROFILES.creative_spark;
  }

  if (
    combined.includes("error") ||
    combined.includes("warning") ||
    combined.includes("bug") ||
    combined.includes("danger") ||
    combined.includes("fire") ||
    combined.includes("urgent") ||
    combined.includes("stop") ||
    combined.includes("crisis")
  ) {
    return PSYCHOLOGY_PROFILES.vibrant_urgency;
  }

  if (
    combined.includes("great job") ||
    combined.includes("awesome") ||
    combined.includes("win") ||
    combined.includes("success") ||
    combined.includes("celebrate") ||
    combined.includes("proud") ||
    combined.includes("congrats") ||
    combined.includes("yay")
  ) {
    return PSYCHOLOGY_PROFILES.warm_encouragement;
  }

  if (
    combined.includes("love") ||
    combined.includes("friend") ||
    combined.includes("sweet") ||
    combined.includes("cozy") ||
    combined.includes("caring") ||
    combined.includes("cute") ||
    combined.includes("companion")
  ) {
    return PSYCHOLOGY_PROFILES.affectionate_harmony;
  }

  // 2. Emotion State Fallback Mapping
  switch (activeEmotion) {
    case "happy":
    case "excited":
    case "proud":
      return PSYCHOLOGY_PROFILES.warm_encouragement;

    case "playful":
    case "embarrassed":
      return PSYCHOLOGY_PROFILES.affectionate_harmony;

    case "curious":
    case "thinking":
      return PSYCHOLOGY_PROFILES.analytical_logic;

    case "surprised":
      return PSYCHOLOGY_PROFILES.creative_spark;

    case "sad":
    case "confused":
      return PSYCHOLOGY_PROFILES.serene_growth;

    default:
      return PSYCHOLOGY_PROFILES.tranquil_obsidian;
  }
}
