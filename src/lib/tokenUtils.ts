/**
 * Unified Token Telemetry Utilities
 * Merges token formatting and active context calculation into a shared module.
 */

export interface ModelTokenStat {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  requestsCount: number;
  lastUsed?: string;
}

export interface LiveTokenStats {
  sessionTokens: number;
  promptTokens: number;
  candidateTokens: number;
  requestsCount: number;
  activeContextTokens: number;
  lastUpdated?: string;
  modelStats?: Record<string, ModelTokenStat>;
}

export function formatTokenCount(tokens: number): string {
  const num = Number(tokens) || 0;
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return val >= 10 ? val.toFixed(1) + "M" : val.toFixed(2) + "M";
  }
  if (num >= 1000) {
    const val = num / 1000;
    return val >= 100 ? val.toFixed(0) + "K" : val.toFixed(1) + "K";
  }
  return num.toLocaleString();
}

/**
 * Calculates genuine active context tokens including Myraa's system prompt persona,
 * memories, chalkboard drawings, and conversation history.
 */
export function estimateActiveContextTokens(
  chatHistory?: Array<{ text?: string }> | null,
  studyPadText?: string | null,
  whiteboardText?: string | null
): number {
  let combinedText = (studyPadText || "") + " " + (whiteboardText || "");
  let messageCount = 0;
  if (chatHistory && Array.isArray(chatHistory)) {
    for (const msg of chatHistory) {
      if (msg.text) {
        combinedText += " " + msg.text;
        messageCount++;
      }
    }
  }

  // Base overhead for Myraa persona, teaching instructions, and active tools ~ 1,450 tokens
  const systemPromptTokens = 1450;
  const trimmed = combinedText.trim();
  if (!trimmed) {
    return systemPromptTokens;
  }

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const chars = trimmed.length;
  // Precise token approximation for Google Gemini tokenizer:
  // ~1.33 tokens per word + punctuation & code brackets
  const dynamicTokens = Math.max(1, Math.round(words * 1.33 + Math.max(0, chars - words * 5) * 0.25));

  return systemPromptTokens + dynamicTokens;
}

/**
 * Fetches the persistent real token telemetry from the server
 */
export async function fetchRealTokenUsage(): Promise<LiveTokenStats | null> {
  try {
    const res = await fetch("/api/tokens/usage");
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[TokenTelemetry] fetch failed:", err);
  }
  return null;
}

/**
 * Requests the server to compute exact Gemini token counts on active context
 */
export async function syncRealContextTokens(payload: {
  modelId?: string;
  chatHistory?: any[];
  notesText?: string;
  whiteboardText?: string;
}): Promise<LiveTokenStats | null> {
  try {
    const res = await fetch("/api/tokens/refresh-active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("myraa-tokens-updated", { detail: { sessionTokens: data } })
        );
      }
      return data;
    }
  } catch (err) {
    console.warn("[TokenTelemetry] sync failed:", err);
  }
  return null;
}
