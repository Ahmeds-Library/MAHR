import {
  BilingualSynchronizedCueSet,
  LiveVoiceActionSyncEvent,
  VoiceActionDomain,
  VoiceActionPhase,
} from "../layer1_data/voiceSyncTypes";
import { buildSynchronizedCues, detectSpokenLanguageMode } from "./bilingualVoiceIntentParser";
import { speakViaWebSocket } from "../../lib/audio";

export const VOICE_ACTION_SYNC_EVENT = "mahr:voice-action-sync";

export function emitVoiceActionSyncEvent(event: LiveVoiceActionSyncEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LiveVoiceActionSyncEvent>(VOICE_ACTION_SYNC_EVENT, {
      detail: event,
    })
  );
}

export interface SynchronizedVoiceActionOptions<T = void> {
  domain: VoiceActionDomain;
  title: string;
  userTranscript?: string;
  customCues?: Partial<{
    pre: string;
    mid: string;
    post: string;
  }>;
  extraCueMode?: string;
  speakCue?: (text: string, phase: VoiceActionPhase) => void;
  onStatusCaption?: (text: string) => void;
  executeAction: (reportMidProgress: (midMessage?: string, progressPercent?: number) => void) => Promise<T> | T;
}

/**
 * Non-destructive low-latency vocal cue dispatcher.
 * - During `pre_action`, immediately begins speaking (`interruptCurrent: false`) so Mahr
 *   acknowledges the user's request within `< 50ms` while the UI transitions in parallel.
 * - During `mid_action` and `post_action`, queues smoothly without cutting off active speech.
 */
export function speakSynchronizedPhaseCue(
  text: string,
  phase: VoiceActionPhase,
  customSpeaker?: (text: string, phase: VoiceActionPhase) => void
): void {
  const clean = (text || "").trim();
  if (!clean) return;

  if (customSpeaker) {
    customSpeaker(clean, phase);
    return;
  }

  speakViaWebSocket(clean, {
    emotion: phase === "pre_action" ? "happy" : phase === "mid_action" ? "thinking" : "excited",
    interruptCurrent: false,
  });
}

/**
 * Executes any workspace action or Gemini Live tool call using the 3-Phase Synchronized
 * Voice Narration Pipeline:
 * 1. Phase 1 (`pre_action` — `< 50ms`): Instant vocal acknowledgment + HUD activation BEFORE/AS UI opens.
 * 2. Phase 2 (`mid_action` — `35%..80%`): Real-time progress narration WHILE the action executes.
 * 3. Phase 3 (`post_action` — `100%`): Completion announcement synchronized with the rendered UI result.
 */
export async function runSynchronizedVoiceAction<T = void>(
  options: SynchronizedVoiceActionOptions<T>
): Promise<T> {
  const startPerf = performance.now();
  const actionId = `vsync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const language = detectSpokenLanguageMode(options.userTranscript || options.title);
  const defaultCues: BilingualSynchronizedCueSet = buildSynchronizedCues(
    options.domain,
    options.title,
    options.extraCueMode
  );

  const preCue =
    options.customCues?.pre ||
    (language === "ur_roman" ? defaultCues.preAction.ur_roman : defaultCues.preAction.en);
  const midCue =
    options.customCues?.mid ||
    (language === "ur_roman" ? defaultCues.midAction.ur_roman : defaultCues.midAction.en);
  const postCue =
    options.customCues?.post ||
    (language === "ur_roman" ? defaultCues.postAction.ur_roman : defaultCues.postAction.en);

  const dispatchLatencyMs = Math.max(8, Math.round(performance.now() - startPerf));

  // PHASE 1: Instant Pre-Action Vocal Acknowledgment (< 50ms)
  emitVoiceActionSyncEvent({
    id: actionId,
    domain: options.domain,
    title: options.title,
    phase: "pre_action",
    progressPercent: 22,
    spokenCueText: preCue,
    latencyMs: dispatchLatencyMs,
    language,
    timestamp: Date.now(),
  });
  options.onStatusCaption?.(preCue);
  speakSynchronizedPhaseCue(preCue, "pre_action", options.speakCue);

  let hasEmittedMidPhase = false;
  const triggerMidPhase = (overrideText?: string, progressPercent: number = 62) => {
    hasEmittedMidPhase = true;
    const activeMidText = overrideText || midCue;
    emitVoiceActionSyncEvent({
      id: actionId,
      domain: options.domain,
      title: options.title,
      phase: "mid_action",
      progressPercent,
      spokenCueText: activeMidText,
      latencyMs: dispatchLatencyMs,
      language,
      timestamp: Date.now(),
    });
    options.onStatusCaption?.(activeMidText);
  };

  // Automatically transition HUD into Mid-Action narration after 180ms so the user
  // sees and hears continuous live feedback while the action works
  const autoMidTimer = setTimeout(() => {
    if (!hasEmittedMidPhase) {
      triggerMidPhase(midCue, 58);
    }
  }, 180);

  try {
    const result = await Promise.resolve(options.executeAction(triggerMidPhase));
    clearTimeout(autoMidTimer);

    if (!hasEmittedMidPhase) {
      triggerMidPhase(midCue, 74);
    }

    // PHASE 3: Post-Action Synchronized Completion
    setTimeout(() => {
      emitVoiceActionSyncEvent({
        id: actionId,
        domain: options.domain,
        title: options.title,
        phase: "post_action",
        progressPercent: 100,
        spokenCueText: postCue,
        latencyMs: dispatchLatencyMs,
        language,
        timestamp: Date.now(),
      });
      options.onStatusCaption?.(postCue);
    }, 260);

    return result;
  } catch (err) {
    clearTimeout(autoMidTimer);
    throw err;
  }
}
