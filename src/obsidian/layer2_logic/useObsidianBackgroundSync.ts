import { useState, useEffect, useRef } from "react";
import { Memory, ChatMessage } from "../../lib/memoryTypes";
import { ObsidianDeltaSyncEvent } from "../layer1_data/obsidianTypes";
import {
  compileObsidianVaultNotes,
  computeObsidianVaultDelta,
} from "./obsidianMarkdownCompiler";

export interface UseObsidianBackgroundSyncOptions {
  memories: Memory[];
  chatHistory: ChatMessage[];
  studyPadText: string;
  whiteboardText: string;
  debounceMs?: number;
}

/**
 * Always-on real-time background service that detects newly created or reinforced
 * memory nodes and conversation journal entries, immediately compiling them into
 * structured Markdown files with bidirectional [[WikiLinks]] and syncing only the
 * changed delta to the local Obsidian Vault on disk.
 */
export function useObsidianBackgroundSync({
  memories,
  chatHistory,
  studyPadText,
  whiteboardText,
  debounceMs = 900,
}: UseObsidianBackgroundSyncOptions) {
  const [syncEvent, setSyncEvent] = useState<ObsidianDeltaSyncEvent>({
    syncState: "idle",
    writtenFiles: [],
    deletedFiles: [],
    newMemoriesSynced: 0,
    newJournalTurnsSynced: 0,
    totalNotes: 0,
    totalWikiLinks: 0,
    timestamp: new Date().toISOString(),
  });

  const fingerprintsRef = useRef<Map<string, string>>(new Map());
  const prevMemoryCountRef = useRef<number>(0);
  const prevJournalCountRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const compiled = compileObsidianVaultNotes({
        memories,
        chatHistory,
        studyPadText,
        whiteboardText,
      });

      const delta = computeObsidianVaultDelta(
        fingerprintsRef.current,
        compiled.notes
      );

      // Nothing changed since last background delta sync
      if (
        delta.changedOrAddedNotes.length === 0 &&
        delta.deletedRelativePaths.length === 0
      ) {
        return;
      }

      const newMemDelta = Math.max(0, memories.length - prevMemoryCountRef.current);
      const newJournalDelta = Math.max(
        0,
        chatHistory.length - prevJournalCountRef.current
      );

      prevMemoryCountRef.current = memories.length;
      prevJournalCountRef.current = chatHistory.length;
      fingerprintsRef.current = delta.nextFingerprints;

      setSyncEvent((prev) => ({
        ...prev,
        syncState: "syncing",
      }));

      try {
        const res = await fetch("/api/obsidian/delta-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            changedNotes: delta.changedOrAddedNotes,
            deletedRelativePaths: delta.deletedRelativePaths,
            totalNotes: compiled.notes.length,
            totalWikiLinks: compiled.totalWikiLinks,
            newMemoriesCount: newMemDelta,
            newJournalTurnsCount: newJournalDelta,
          }),
        });

        const nowIso = new Date().toISOString();
        let nextEvent: ObsidianDeltaSyncEvent = {
          syncState: "synced",
          writtenFiles: delta.changedOrAddedNotes.map((n) => n.relativePath),
          deletedFiles: delta.deletedRelativePaths,
          newMemoriesSynced: newMemDelta,
          newJournalTurnsSynced: newJournalDelta,
          totalNotes: compiled.notes.length,
          totalWikiLinks: compiled.totalWikiLinks,
          timestamp: nowIso,
        };

        if (res.ok) {
          const data = await res.json();
          if (data.deltaEvent) {
            nextEvent = data.deltaEvent;
          }
        }

        setSyncEvent(nextEvent);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("mahr-obsidian-sync-status", {
              detail: nextEvent,
            })
          );
        }
      } catch {
        setSyncEvent((prev) => ({
          ...prev,
          syncState: "synced",
          totalNotes: compiled.notes.length,
          totalWikiLinks: compiled.totalWikiLinks,
          timestamp: new Date().toISOString(),
        }));
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [memories, chatHistory, studyPadText, whiteboardText, debounceMs]);

  return {
    obsidianSyncEvent: syncEvent,
  };
}
