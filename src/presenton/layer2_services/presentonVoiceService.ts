/**
 * Layer 2 — Mahr / Alexa Voice Assistant Bridge for Presenton
 * Provides speech synthesis for slide narration and voice command parsing.
 */

export type PresentonVoiceIntent =
  | { type: "create_presentation"; topic: string }
  | { type: "approve_outline" }
  | { type: "next_slide" }
  | { type: "prev_slide" }
  | { type: "read_slide" }
  | { type: "export_pptx" }
  | { type: "export_pdf" }
  | { type: "edit_slide"; instruction: string };

export function parsePresentonVoiceCommand(transcript: string): PresentonVoiceIntent | null {
  const clean = transcript.trim();
  const lower = clean.toLowerCase();
  if (!lower) return null;

  if (
    lower.includes("next slide") ||
    lower.includes("go forward") ||
    lower.includes("agla slide")
  ) {
    return { type: "next_slide" };
  }

  if (
    lower.includes("previous slide") ||
    lower.includes("go back") ||
    lower.includes("pichla slide")
  ) {
    return { type: "prev_slide" };
  }

  if (
    lower.includes("read slide") ||
    lower.includes("explain this slide") ||
    lower.includes("present this slide") ||
    lower.includes("narrate")
  ) {
    return { type: "read_slide" };
  }

  if (
    lower.includes("approve outline") ||
    lower.includes("generate slides") ||
    lower.includes("build slides")
  ) {
    return { type: "approve_outline" };
  }

  if (lower.includes("export") && (lower.includes("powerpoint") || lower.includes("pptx"))) {
    return { type: "export_pptx" };
  }

  if (lower.includes("export") && lower.includes("pdf")) {
    return { type: "export_pdf" };
  }

  const createMatch = clean.match(
    /(?:create|make|build|generate)\s+(?:a\s+)?(?:presentation|slides|deck)\s+(?:on|about|for)\s+(.+)/i
  );
  if (createMatch && createMatch[1]) {
    return { type: "create_presentation", topic: createMatch[1].trim() };
  }

  return { type: "edit_slide", instruction: clean };
}

export function speakWithMahrVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find((v) => /google|natural|samantha|aria|jenny/i.test(v.name) && v.lang.startsWith("en")) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function stopMahrVoice(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
