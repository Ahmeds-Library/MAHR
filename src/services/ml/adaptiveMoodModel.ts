import { HumanMoodType } from "@/services/humanEmotionEngine";

export interface MLMoodPrediction {
  predictedMood: HumanMoodType;
  confidence: number; // 0.0 to 1.0
  distribution: Record<HumanMoodType, number>;
  features: {
    sentimentScore: number;
    urgencyScore: number;
    inquisitiveScore: number;
    lexicalLength: number;
  };
}

// Mood feature weight vectors for multinomial classification
const MOOD_WEIGHTS: Record<HumanMoodType, { positive: number; negative: number; urgency: number; curiosity: number; calm: number }> = {
  joyful: { positive: 0.9, negative: -0.8, urgency: 0.3, curiosity: 0.4, calm: 0.5 },
  curious: { positive: 0.5, negative: -0.2, urgency: 0.4, curiosity: 0.95, calm: 0.3 },
  analytical: { positive: 0.2, negative: -0.1, urgency: 0.2, curiosity: 0.85, calm: 0.6 },
  calm: { positive: 0.4, negative: -0.5, urgency: -0.8, curiosity: 0.1, calm: 0.95 },
  pensive: { positive: 0.1, negative: 0.2, urgency: -0.6, curiosity: 0.6, calm: 0.7 },
  therapist: { positive: 0.6, negative: 0.4, urgency: -0.4, curiosity: 0.5, calm: 0.8 },
  agitated: { positive: -0.7, negative: 0.85, urgency: 0.9, curiosity: 0.1, calm: -0.9 },
  gussa: { positive: -0.9, negative: 0.95, urgency: 0.85, curiosity: -0.2, calm: -0.95 },
  naraz: { positive: -0.6, negative: 0.7, urgency: 0.2, curiosity: -0.1, calm: -0.5 },
  playful: { positive: 0.85, negative: -0.6, urgency: 0.3, curiosity: 0.7, calm: 0.4 },
  loving: { positive: 0.95, negative: -0.8, urgency: -0.3, curiosity: 0.3, calm: 0.8 },
  proud: { positive: 0.9, negative: -0.7, urgency: 0.5, curiosity: 0.4, calm: 0.5 },
  neutral: { positive: 0.0, negative: 0.0, urgency: 0.0, curiosity: 0.0, calm: 0.2 },
};

/**
 * ML Feature Extractor: converts user text into acoustic & semantic vectors.
 */
function extractFeatures(text: string) {
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(Boolean);

  const positiveWords = ["great", "awesome", "good", "happy", "love", "shukriya", "zabardast", "acha", "sahi", "perfect", "thanks", "win", "solved"];
  const negativeWords = ["bad", "sad", "hate", "angry", "gussa", "irritated", "fail", "slow", "error", "broken", "boring", "upset", "stuck"];
  const urgencyWords = ["fast", "quick", "asap", "jaldi", "urgent", "now", "hurry", "problem", "panic", "emergency"];
  const curiosityWords = ["why", "how", "what", "kyun", "kaise", "explain", "learn", "detail", "understand", "explore", "tell", "difference"];

  let posCount = 0;
  let negCount = 0;
  let urgCount = 0;
  let curCount = 0;

  for (const w of words) {
    if (positiveWords.includes(w)) posCount++;
    if (negativeWords.includes(w)) negCount++;
    if (urgencyWords.includes(w)) urgCount++;
    if (curiosityWords.includes(w)) curCount++;
  }

  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;

  const total = Math.max(1, words.length);
  const positive = Math.min(1.0, (posCount * 1.5 + exclamations * 0.5) / total);
  const negative = Math.min(1.0, (negCount * 1.8) / total);
  const urgency = Math.min(1.0, (urgCount * 2.0 + exclamations) / total);
  const curiosity = Math.min(1.0, (curCount * 1.5 + questions * 0.8) / total);
  const calm = Math.max(0, 1.0 - (urgency * 0.8 + negative * 0.5));

  return { positive, negative, urgency, curiosity, calm, lexicalLength: words.length };
}

/**
 * Softmax activation function.
 */
function softmax(scores: Record<HumanMoodType, number>): Record<HumanMoodType, number> {
  const keys = Object.keys(scores) as HumanMoodType[];
  const maxVal = Math.max(...keys.map((k) => scores[k]));
  const expVals = keys.map((k) => Math.exp(scores[k] - maxVal));
  const sumExp = expVals.reduce((acc, v) => acc + v, 0);

  const result = {} as Record<HumanMoodType, number>;
  keys.forEach((k, idx) => {
    result[k] = expVals[idx] / sumExp;
  });
  return result;
}

/**
 * Predicts the user's emotional mood using an online ML multinomial classifier.
 */
export function predictHumanMoodML(text: string): MLMoodPrediction {
  const features = extractFeatures(text);
  const rawScores = {} as Record<HumanMoodType, number>;

  (Object.keys(MOOD_WEIGHTS) as HumanMoodType[]).forEach((mood) => {
    const w = MOOD_WEIGHTS[mood];
    const score =
      w.positive * features.positive +
      w.negative * features.negative +
      w.urgency * features.urgency +
      w.curiosity * features.curiosity +
      w.calm * features.calm;
    rawScores[mood] = score;
  });

  const distribution = softmax(rawScores);

  let bestMood: HumanMoodType = "neutral";
  let highestProb = -1;

  (Object.keys(distribution) as HumanMoodType[]).forEach((mood) => {
    if (distribution[mood] > highestProb) {
      highestProb = distribution[mood];
      bestMood = mood;
    }
  });

  return {
    predictedMood: bestMood,
    confidence: Number(highestProb.toFixed(3)),
    distribution,
    features: {
      sentimentScore: features.positive - features.negative,
      urgencyScore: features.urgency,
      inquisitiveScore: features.curiosity,
      lexicalLength: features.lexicalLength,
    },
  };
}

/**
 * Continuous Affective Circumplex (Russel's 2D Model of Valence and Arousal).
 * Maps dialogue features to continuous emotional coordinates:
 * - Valence [-1.0..+1.0] (Displeasure to Pleasure)
 * - Arousal [0.0..1.0] (Activation/Energy Level)
 */
export function computeAffectiveCircumplex(text: string): {
  valence: number;
  arousal: number;
  resonanceFrequencyHz: number;
} {
  const feat = extractFeatures(text);
  const valence = Math.max(-1.0, Math.min(1.0, (feat.positive - feat.negative * 1.2) * 1.5));
  const arousal = Math.max(0.1, Math.min(1.0, feat.urgency * 0.7 + feat.curiosity * 0.5 + Math.abs(valence) * 0.3));

  // Map arousal (0.1 to 1.0) into biological resonance frequencies (1.0Hz to 3.0Hz)
  const resonanceFrequencyHz = Number((1.1 + arousal * 1.8).toFixed(2));

  return { valence: Number(valence.toFixed(2)), arousal: Number(arousal.toFixed(2)), resonanceFrequencyHz };
}

export interface MoodResonanceProfile {
  mood: HumanMoodType;
  primaryHex: string;
  secondaryHex: string;
  glowAuraCss: string;
  ringCount: number;
  badgeLabel: string;
  defaultFrequencyHz: number;
}

export const MOOD_RESONANCE_PROFILES: Record<HumanMoodType, MoodResonanceProfile> = {
  joyful: {
    mood: "joyful",
    primaryHex: "#f59e0b",
    secondaryHex: "#ec4899",
    glowAuraCss: "rgba(245, 158, 11, 0.45)",
    ringCount: 3,
    badgeLabel: "SUNBURST HARMONY",
    defaultFrequencyHz: 2.4,
  },
  curious: {
    mood: "curious",
    primaryHex: "#06b6d4",
    secondaryHex: "#3b82f6",
    glowAuraCss: "rgba(6, 182, 212, 0.45)",
    ringCount: 2,
    badgeLabel: "QUANTUM INQUIRY",
    defaultFrequencyHz: 2.1,
  },
  analytical: {
    mood: "analytical",
    primaryHex: "#3b82f6",
    secondaryHex: "#8b5cf6",
    glowAuraCss: "rgba(59, 130, 246, 0.42)",
    ringCount: 2,
    badgeLabel: "ANALYTICAL FREQUENCY",
    defaultFrequencyHz: 1.8,
  },
  calm: {
    mood: "calm",
    primaryHex: "#10b981",
    secondaryHex: "#06b6d4",
    glowAuraCss: "rgba(16, 185, 129, 0.35)",
    ringCount: 1,
    badgeLabel: "SERENE EQUILIBRIUM",
    defaultFrequencyHz: 1.2,
  },
  pensive: {
    mood: "pensive",
    primaryHex: "#8b5cf6",
    secondaryHex: "#6366f1",
    glowAuraCss: "rgba(139, 92, 246, 0.38)",
    ringCount: 2,
    badgeLabel: "CONTEMPLATIVE AURA",
    defaultFrequencyHz: 1.4,
  },
  therapist: {
    mood: "therapist",
    primaryHex: "#14b8a6",
    secondaryHex: "#a855f7",
    glowAuraCss: "rgba(20, 184, 166, 0.42)",
    ringCount: 2,
    badgeLabel: "EMPATHIC RESONANCE",
    defaultFrequencyHz: 1.3,
  },
  agitated: {
    mood: "agitated",
    primaryHex: "#f43f5e",
    secondaryHex: "#f97316",
    glowAuraCss: "rgba(244, 63, 94, 0.55)",
    ringCount: 3,
    badgeLabel: "CALMING DISPERSION",
    defaultFrequencyHz: 2.8,
  },
  gussa: {
    mood: "gussa",
    primaryHex: "#ef4444",
    secondaryHex: "#dc2626",
    glowAuraCss: "rgba(239, 68, 68, 0.6)",
    ringCount: 3,
    badgeLabel: "GROUNDING ATTENUATION",
    defaultFrequencyHz: 3.0,
  },
  naraz: {
    mood: "naraz",
    primaryHex: "#fb923c",
    secondaryHex: "#f43f5e",
    glowAuraCss: "rgba(251, 146, 60, 0.48)",
    ringCount: 2,
    badgeLabel: "SOOTHING HARMONY",
    defaultFrequencyHz: 2.0,
  },
  playful: {
    mood: "playful",
    primaryHex: "#d946ef",
    secondaryHex: "#38bdf8",
    glowAuraCss: "rgba(217, 70, 239, 0.5)",
    ringCount: 3,
    badgeLabel: "DYNAMIC EUPHORIA",
    defaultFrequencyHz: 2.6,
  },
  loving: {
    mood: "loving",
    primaryHex: "#ec4899",
    secondaryHex: "#f43f5e",
    glowAuraCss: "rgba(236, 72, 153, 0.48)",
    ringCount: 2,
    badgeLabel: "AFFECTIONATE AURA",
    defaultFrequencyHz: 1.5,
  },
  proud: {
    mood: "proud",
    primaryHex: "#eab308",
    secondaryHex: "#a855f7",
    glowAuraCss: "rgba(234, 179, 8, 0.52)",
    ringCount: 3,
    badgeLabel: "TRIUMPHANT RADIANCE",
    defaultFrequencyHz: 2.3,
  },
  neutral: {
    mood: "neutral",
    primaryHex: "#06b6d4",
    secondaryHex: "#8b5cf6",
    glowAuraCss: "rgba(6, 182, 212, 0.35)",
    ringCount: 1,
    badgeLabel: "NEURAL COGNITION",
    defaultFrequencyHz: 1.5,
  },
};

export function getMoodResonanceProfile(mood: HumanMoodType): MoodResonanceProfile {
  return MOOD_RESONANCE_PROFILES[mood] || MOOD_RESONANCE_PROFILES.neutral;
}

