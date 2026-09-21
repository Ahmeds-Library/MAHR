import { dbGet, dbSet } from "../lib/db";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  category?: string;
  isAction?: boolean;
}

const CHAT_HISTORY_KEY = "myraa_chat_history_v2";

export async function loadChatHistoryFromStorage(): Promise<ChatMessage[]> {
  try {
    const raw = await dbGet(CHAT_HISTORY_KEY);
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  } catch (err) {
    console.warn("[ChatService] Failed to load chat history:", err);
    return [];
  }
}

export async function saveChatHistoryToStorage(history: ChatMessage[]): Promise<void> {
  try {
    const recentMessages = history.slice(-50); // Keep last 50 for storage size safety
    await dbSet(CHAT_HISTORY_KEY, JSON.stringify(recentMessages));
  } catch (err) {
    console.error("[ChatService] Failed to save chat history:", err);
  }
}

export function pruneChatHistory(history: ChatMessage[], maxCount: number = 30): ChatMessage[] {
  if (history.length <= maxCount) return history;
  return history.slice(-maxCount);
}
