import React, { useState, useEffect, useCallback, useRef, MutableRefObject } from "react";
import { ChatMessage, loadChatHistoryFromStorage, saveChatHistoryToStorage, pruneChatHistory } from "../services/chatService";

export function useChatHistory(sessionRef: MutableRefObject<any>) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const isLoadedRef = useRef<boolean>(false);

  // Sync state to Live Gemini Session Context
  const syncStateToSession = useCallback((history: ChatMessage[]) => {
    if (!sessionRef.current || history.length === 0) return;

    try {
      const recentPruned = pruneChatHistory(history, 10);
      const textContext = recentPruned
        .map((msg) => `${msg.role === "user" ? "User" : "MAHR"}: ${msg.text}`)
        .join("\n");

      // Push memory/context update to live session
      if (typeof sessionRef.current.sendCustomTextContext === "function") {
        sessionRef.current.sendCustomTextContext(`[System Memory Update - Recent Chat Context]:\n${textContext}`);
      }
    } catch (err) {
      console.warn("[useChatHistory] Failed to sync chat state to Live Session:", err);
    }
  }, [sessionRef]);

  // Load chat history from storage on mount
  useEffect(() => {
    loadChatHistoryFromStorage().then((history) => {
      setChatHistory(history);
      isLoadedRef.current = true;
    });
  }, []);

  // Save chat history when updated
  useEffect(() => {
    if (isLoadedRef.current && chatHistory.length > 0) {
      saveChatHistoryToStorage(chatHistory);
    }
  }, [chatHistory]);

  const appendToChatHistory = useCallback((role: "user" | "model", text: string, category?: string) => {
    if (!text || text.trim() === "") return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      category
    };

    setChatHistory((prev) => {
      const updated = [...prev, newMessage];
      syncStateToSession(updated);
      return updated;
    });
  }, [syncStateToSession]);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
    saveChatHistoryToStorage([]);
  }, []);

  return {
    chatHistory,
    appendToChatHistory,
    clearHistory,
    syncStateToSession
  };
}
