import { dbGet, dbSet } from "../lib/db";

export interface LongTermMemoryItem {
  id: string;
  category: "fact" | "preference" | "goal" | "summary" | "simulation" | "skill";
  text: string;
  createdAt: string;
  confidenceScore?: number;
  simulationMetadata?: {
    name: string;
    modelType: string;
    scripts?: string[];
    customModelData?: any;
  };
}

const MEMORIES_STORAGE_KEY = "myraa_longterm_memories_v2";

export async function loadMemoriesFromStorage(): Promise<LongTermMemoryItem[]> {
  try {
    const raw = await dbGet(MEMORIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[MemoryService] Failed to load long-term memories:", err);
    return [];
  }
}

export async function saveMemoriesToStorage(memories: LongTermMemoryItem[]): Promise<void> {
  try {
    await dbSet(MEMORIES_STORAGE_KEY, JSON.stringify(memories));
  } catch (err) {
    console.error("[MemoryService] Failed to save long-term memories:", err);
  }
}

export function extractFactCandidates(text: string): Array<{ text: string; category: LongTermMemoryItem["category"] }> {
  if (!text || text.length < 10) return [];

  const candidates: Array<{ text: string; category: LongTermMemoryItem["category"] }> = [];
  const lower = text.toLowerCase();

  // Pattern detection for preferences, facts, and goals
  if (lower.includes("my name is") || lower.includes("i am studying") || lower.includes("i live in")) {
    candidates.push({ text: text.trim(), category: "fact" });
  } else if (lower.includes("i prefer") || lower.includes("i like") || lower.includes("i love") || lower.includes("my favorite")) {
    candidates.push({ text: text.trim(), category: "preference" });
  } else if (lower.includes("my goal is") || lower.includes("i want to learn") || lower.includes("i am preparing for")) {
    candidates.push({ text: text.trim(), category: "goal" });
  }

  return candidates;
}
