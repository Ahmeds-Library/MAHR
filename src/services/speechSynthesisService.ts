import { MyraaEmotion } from "../components/MyraaCoreVisualizer";
import { speakViaWebSocket, stopAllWebSocketSpeech } from "../lib/audio";
import { HumanMoodType } from "./humanEmotionEngine";
import type { QueryComplexityAssessment } from "./reinforcementLearningEngine";

// Immediately neutralize and purge native browser speech synthesis to guarantee only WebSocket voice plays
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.cancel();
    // Intercept native speak to prevent any secondary audio overlay
    window.speechSynthesis.speak = () => {
      console.warn("[Myraa Audio Guard] Native browser speech synthesis blocked. All speech is routed exclusively through the real-time WebSocket connection.");
    };
  } catch (e) {}
}

export interface MoodSpeechModulation {
  pitchMultiplier: number;
  rateMultiplier: number;
  description: string;
}

/**
 * Calculates acoustic pitch and tempo modulation dynamically based on the current Human Mood.
 * - 'gussa' (angry): slightly increases pitch and speed to convey fiery strictness.
 * - 'sad' / 'therapist': decreases pitch and speed to convey gentle, soothing empathy.
 * - 'playful': elevates pitch and pace for bubbly humor.
 * - 'loving': softens pitch with slower, melodic warmth.
 */
export function getMoodSpeechModulation(mood?: HumanMoodType | string): MoodSpeechModulation {
  const normMood = (mood || "neutral").toLowerCase().trim();

  switch (normMood) {
    case "gussa":
    case "angry":
    case "strict":
      // Slightly increase pitch and speed for fiery, commanding authority
      return {
        pitchMultiplier: 1.15,
        rateMultiplier: 1.12,
        description: "Elevated pitch (+15%) and accelerated cadence (+12%) for fiery strictness"
      };

    case "sad":
    case "therapist":
    case "ghamgeen":
    case "depressed":
    case "sorrow":
      // Decreased pitch and speed for tender, comforting, unhurried empathy
      return {
        pitchMultiplier: 0.90,
        rateMultiplier: 0.88,
        description: "Gently lowered pitch (-10%) and decelerated cadence (-12%) for soothing comfort"
      };

    case "naraz":
    case "sulking":
    case "khafa":
      // Slightly huffy pitch, slower pouting inflection
      return {
        pitchMultiplier: 1.05,
        rateMultiplier: 0.94,
        description: "Moody, folded-arms pouting inflection with hesitant pauses"
      };

    case "playful":
    case "chulbuli":
    case "witty":
      // Elevated pitch and spirited pace for giggly banter
      return {
        pitchMultiplier: 1.22,
        rateMultiplier: 1.10,
        description: "Bubbly, animated high pitch (+22%) and lively tempo (+10%)"
      };

    case "loving":
    case "pyari":
    case "affectionate":
      // Warm, melodic, gentle cadence
      return {
        pitchMultiplier: 1.08,
        rateMultiplier: 0.94,
        description: "Sweet, melodic warmth with soft, affectionate pauses"
      };

    case "proud":
    case "fakhr":
    case "victorious":
      // Celebratory crescendo with high energy
      return {
        pitchMultiplier: 1.18,
        rateMultiplier: 1.14,
        description: "Radiant, high-energy victorious crescendo"
      };

    case "analytical":
    case "gambhira":
    case "logic":
      // Crisp, measured intellectual precision
      return {
        pitchMultiplier: 0.98,
        rateMultiplier: 0.97,
        description: "Crisp, steady, analytical cadence with thoughtful pauses"
      };

    case "neutral":
    default:
      return {
        pitchMultiplier: 1.0,
        rateMultiplier: 1.0,
        description: "Natural, balanced conversational cadence"
      };
  }
}

// Global active mood tracking within speech service
let currentGlobalSpeechMood: HumanMoodType = "neutral";

export function setGlobalSpeechMood(mood: HumanMoodType): void {
  currentGlobalSpeechMood = mood;
}

export function getGlobalSpeechMood(): HumanMoodType {
  return currentGlobalSpeechMood;
}

export interface ProactivePauseOptions {
  filler?: string;
  pauseDurationMs?: number;
  vocalizeFiller?: boolean;
  queryText?: string;
  complexityAssessment?: QueryComplexityAssessment;
  mood?: HumanMoodType | string;
  onStart?: (filler: string) => void;
  onEnd?: () => void;
}

export interface SpeakOptions {
  text: string;
  overrideEmotion?: MyraaEmotion;
  activeEmotion?: MyraaEmotion;
  mood?: HumanMoodType | string;
  speechRate?: number;
  speechPitch?: number;
  preferUrduOrHindi?: boolean;
  enableProactivePause?: boolean;
  queryComplexity?: QueryComplexityAssessment;
  proactivePauseOptions?: ProactivePauseOptions;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

/**
 * Natural filler phrases for Myraa's thoughtful 'proactive pause'
 * when encountering complex queries requiring deep thinking or memory retrieval.
 */
const DEFAULT_PROACTIVE_FILLERS = [
  "Hmm, let me see...",
  "Hmm, let me think through that...",
  "Let me check your notes and past interactions on this...",
  "Acha, let me look into this carefully...",
  "Hmm, interesting, let me analyze that..."
];

let isProactivePauseActive = false;

/**
 * Executes a 'proactive pause' before replying to complex queries.
 * Myraa provides conversational cognitive feedback (like 'hmm', 'let me see')
 * while memory retrieval and reinforcement reasoning take place.
 */
export async function triggerProactivePause(options: ProactivePauseOptions = {}): Promise<void> {
  const {
    filler,
    pauseDurationMs,
    vocalizeFiller = true,
    queryText,
    complexityAssessment,
    mood,
    onStart,
    onEnd
  } = options;

  // Determine filler text
  const selectedFiller = filler || complexityAssessment?.suggestedFiller || 
    DEFAULT_PROACTIVE_FILLERS[Math.floor(Math.random() * DEFAULT_PROACTIVE_FILLERS.length)];

  // Determine duration (defaults to assessment recommendation or 700ms)
  const durationMs = pauseDurationMs ?? complexityAssessment?.recommendedPauseMs ?? 750;

  isProactivePauseActive = true;
  onStart?.(selectedFiller);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("myraa-proactive-pause", {
        detail: {
          filler: selectedFiller,
          durationMs,
          queryText: queryText || "",
          complexityScore: complexityAssessment?.score || 60,
          isThinking: true
        }
      })
    );
  }

  // Optionally utter the brief filler sound through real-time audio channel
  if (vocalizeFiller && selectedFiller) {
    try {
      const targetMood = mood || currentGlobalSpeechMood;
      speakViaWebSocket(selectedFiller, {
        emotion: "thinking",
        mood: targetMood as string,
        speechPitch: 1.0,
        speechRate: 0.95
      });
    } catch (e) {
      console.warn("[Speech Service] Non-fatal vocal filler attempt:", e);
    }
  }

  // Pause briefly for realistic cognitive pacing
  await new Promise((resolve) => setTimeout(resolve, durationMs));

  isProactivePauseActive = false;
  onEnd?.();

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("myraa-proactive-pause-end", {
        detail: { filler: selectedFiller }
      })
    );
  }
}

export function isCurrentlyInProactivePause(): boolean {
  return isProactivePauseActive;
}

/**
 * Clean text for pristine, natural human speech readout:
 * Removes markdown symbols, code blocks, LaTeX symbols, URL junk, and emojis.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, "Code block omitted.") // Remove full code blocks
    .replace(/`([^`]+)`/g, "$1") // Inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Bold
    .replace(/\*([^*]+)\*/g, "$1") // Italics
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/#+\s+/g, "") // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Markdown links
    .replace(/https?:\/\/\S+/g, "") // URLs
    .replace(/[✨⚡⭐🌟🚀💡🔥🎉🎊]/g, "") // Common decorative emojis
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1") // LaTeX blocks
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1") // LaTeX inline
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * High-Speed Instant Voice Synthesis Engine for Myraa.
 * Exclusively routes all speech through the real-time WebSocket connection
 * to Gemini Live. Halts any existing speech to guarantee zero overlapping voices.
 * Dynamically modulates speech pitch and rate based on HumanMoodType.
 */
export function speakUtterance(options: SpeakOptions): boolean {
  const {
    text,
    overrideEmotion,
    activeEmotion,
    mood,
    speechPitch = 1.0,
    speechRate = 1.0,
    onStart,
    onEnd,
    onError,
  } = options;

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return false;

  // Immediately cancel any previous speech to guarantee only ONE single voice plays
  stopAllSpeech();

  // Dynamically modulate pitch and rate according to the active Human Mood
  const targetMood = mood || currentGlobalSpeechMood;
  const modulation = getMoodSpeechModulation(targetMood);
  const finalPitch = Number((speechPitch * modulation.pitchMultiplier).toFixed(2));
  const finalRate = Number((speechRate * modulation.rateMultiplier).toFixed(2));

  try {
    const success = speakViaWebSocket(cleanText, {
      emotion: (overrideEmotion || activeEmotion || "happy") as string,
      mood: targetMood as string,
      speechPitch: finalPitch,
      speechRate: finalRate,
      onStart: () => {
        onStart?.();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("myraa-speech-start", {
              detail: { 
                text: cleanText, 
                emotion: overrideEmotion || activeEmotion || "speaking",
                mood: targetMood,
                speechPitch: finalPitch,
                speechRate: finalRate
              },
            })
          );
        }
      },
      onEnd: () => {
        onEnd?.();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("myraa-speech-end"));
        }
      },
    });

    return success;
  } catch (err) {
    console.error("[Speech Service] WebSocket speak failed:", err);
    onError?.(err);
    return false;
  }
}

/**
 * Speaks an utterance with an optional proactive pause when complex reasoning is required.
 */
export async function speakWithProactivePause(
  options: SpeakOptions & {
    queryText?: string;
    proactivePauseOptions?: ProactivePauseOptions;
  }
): Promise<boolean> {
  const { proactivePauseOptions, queryComplexity, queryText, ...speakOpts } = options;

  if (proactivePauseOptions || queryComplexity?.isComplex) {
    await triggerProactivePause({
      ...proactivePauseOptions,
      queryText: queryText || proactivePauseOptions?.queryText,
      complexityAssessment: queryComplexity || proactivePauseOptions?.complexityAssessment,
      mood: speakOpts.mood
    });
  }

  return speakUtterance(speakOpts);
}

/**
 * Stop any ongoing speech across WebSocket and completely cancel any browser audio queues.
 */
export function stopAllSpeech(): void {
  // Cancel any lingering browser speech synthesis just in case anything was ever queued
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }

  // Stop all active WebSocket speech and PCM playback
  stopAllWebSocketSpeech();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("myraa-speech-end"));
  }
}
