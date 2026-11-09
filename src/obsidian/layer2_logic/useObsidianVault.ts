import { useState, useEffect, useCallback, useMemo } from "react";
import { Memory, ChatMessage } from "../../lib/memoryTypes";
import {
  ObsidianNoteFile,
  ObsidianGraphNode,
  ObsidianGraphEdge,
  ObsidianSystemStatus,
  ObsidianUnlinkedMention,
} from "../layer1_data/obsidianTypes";
import { compileObsidianVaultNotes } from "./obsidianMarkdownCompiler";
import {
  loadCustomVaultNotes,
  saveCustomVaultNotes,
  buildCustomObsidianNote,
  buildTodayDailyNote,
  extractWikiLinksFromMarkdown,
  extractTagsFromMarkdown,
} from "./obsidianBacklinksAndTemplatesService";
import { discoverSemanticAutoLinks } from "./obsidianGraphAnalyticsService";

export interface UseObsidianVaultOptions {
  isOpen: boolean;
  memories?: Memory[];
  chatHistory?: ChatMessage[];
  studyPadText?: string;
  whiteboardText?: string;
}

export function useObsidianVault({
  isOpen,
  memories = [],
  chatHistory = [],
  studyPadText = "",
  whiteboardText = "",
}: UseObsidianVaultOptions) {
  const [customNotesMap, setCustomNotesMap] = useState<
    Record<string, ObsidianNoteFile>
  >(() => loadCustomVaultNotes());

  const localCompiled = useMemo(() => {
    const base = compileObsidianVaultNotes({
      memories,
      chatHistory,
      studyPadText,
      whiteboardText,
    });

    // Merge user-created or edited notes from customNotesMap
    const mergedNotesMap = new Map<string, ObsidianNoteFile>();
    for (const n of base.notes) {
      mergedNotesMap.set(n.id, n);
    }
    for (const [id, customNote] of Object.entries(customNotesMap)) {
      mergedNotesMap.set(id, customNote);
    }

    const allNotes = Array.from(mergedNotesMap.values());

    // Recompute backlinks & explicit WikiLink edges across all notes
    const titleToNote = new Map<string, ObsidianNoteFile>();
    for (const n of allNotes) {
      titleToNote.set(n.title.toLowerCase(), n);
    }

    const extraEdges: ObsidianGraphEdge[] = [...base.graphEdges];
    const edgeSet = new Set(
      extraEdges.map((e) => `${e.sourceId}::${e.targetId}`)
    );

    for (const n of allNotes) {
      for (const linkTitle of n.wikiLinks) {
        const target = titleToNote.get(linkTitle.toLowerCase());
        if (target && target.id !== n.id) {
          if (!target.backlinks.includes(n.title)) {
            target.backlinks.push(n.title);
          }
          const key1 = `${n.id}::${target.id}`;
          const key2 = `${target.id}::${n.id}`;
          if (!edgeSet.has(key1) && !edgeSet.has(key2)) {
            edgeSet.add(key1);
            extraEdges.push({
              id: `edge_${n.id}_${target.id}`,
              sourceId: n.id,
              targetId: target.id,
              label: `[[${target.title.slice(0, 18)}]]`,
              isExplicitWikiLink: true,
              similarity: 0.92,
            });
          }
        }
      }
    }

    const graphNodes: ObsidianGraphNode[] = allNotes.map((n, index) => {
      const existingNode = base.graphNodes.find((gn) => gn.id === n.id);
      if (existingNode) {
        return {
          ...existingNode,
          title: n.title,
          wikiLinksCount: n.wikiLinks.length,
          backlinksCount: n.backlinks.length,
        };
      }
      const angle = (index / Math.max(1, allNotes.length)) * Math.PI * 2;
      const dist = 135 + (index % 3) * 50;
      return {
        id: n.id,
        title: n.title,
        folder: n.folder,
        category: n.category,
        color: n.clusterColor,
        radius: 13 + Math.min(8, n.wikiLinks.length),
        wikiLinksCount: n.wikiLinks.length,
        backlinksCount: n.backlinks.length,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
      };
    });

    const totalWikiLinks = allNotes.reduce(
      (sum, n) => sum + n.wikiLinks.length,
      0
    );

    return {
      notes: allNotes,
      graphNodes,
      graphEdges: extraEdges,
      totalWikiLinks,
    };
  }, [memories, chatHistory, studyPadText, whiteboardText, customNotesMap]);

  const [notes, setNotes] = useState<ObsidianNoteFile[]>(localCompiled.notes);
  const [graphNodes, setGraphNodes] = useState<ObsidianGraphNode[]>(
    localCompiled.graphNodes
  );
  const [graphEdges, setGraphEdges] = useState<ObsidianGraphEdge[]>(
    localCompiled.graphEdges
  );
  const [systemStatus, setSystemStatus] = useState<ObsidianSystemStatus>({
    installed: false,
    binaryPath: null,
    platform: "linux",
    vaultName: "MAHR_Obsidian_Vault",
    vaultPath: "./MAHR_Obsidian_Vault",
    vaultInitialized: true,
    totalNotesSynced: localCompiled.notes.length,
    totalWikiLinks: localCompiled.totalWikiLinks,
    obsidianUri: "obsidian://open?vault=MAHR_Obsidian_Vault",
    officialInstallerUrl:
      "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.7.7/Obsidian-1.7.7.exe",
    installerFilename: "Obsidian-1.7.7.exe",
    autoSetupStatus: "ready",
    statusMessage: "Synchronizing MAHR Second-Brain Vault with Obsidian...",
    lastSyncedAt: new Date().toISOString(),
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    setNotes(localCompiled.notes);
    setGraphNodes(localCompiled.graphNodes);
    setGraphEdges(localCompiled.graphEdges);
  }, [localCompiled]);

  // Save or update a note (live Markdown editor or template creation)
  const saveOrUpdateNote = useCallback((note: ObsidianNoteFile) => {
    const updatedLinks = extractWikiLinksFromMarkdown(note.markdownBody);
    const inlineTags = extractTagsFromMarkdown(note.markdownBody);
    const mergedTags = Array.from(new Set([...note.tags, ...inlineTags]));
    const updatedNote: ObsidianNoteFile = {
      ...note,
      wikiLinks: Array.from(new Set([...note.wikiLinks, ...updatedLinks])),
      tags: mergedTags,
      fullMarkdown: `${note.yamlFrontmatter}\n\n${note.markdownBody}`,
      updatedAt: new Date().toISOString(),
      isCustomOrEdited: true,
    };

    setCustomNotesMap((prev) => {
      const next = { ...prev, [updatedNote.id]: updatedNote };
      saveCustomVaultNotes(next);
      return next;
    });
    return updatedNote;
  }, []);

  // Create or open today's Daily Note
  const openOrCreateDailyNote = useCallback((): ObsidianNoteFile => {
    const daily = buildTodayDailyNote();
    const existing = notes.find((n) => n.id === daily.id);
    if (existing) return existing;
    return saveOrUpdateNote(daily);
  }, [notes, saveOrUpdateNote]);

  // Convert an unlinked mention into a formal [[WikiLink]] + graph edge
  const linkUnlinkedMention = useCallback(
    (mention: ObsidianUnlinkedMention): ObsidianNoteFile | null => {
      const sourceNote = notes.find((n) => n.id === mention.sourceNoteId);
      if (!sourceNote) return null;

      const escaped = mention.matchedPhrase.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      let nextBody = sourceNote.markdownBody;
      if (regex.test(nextBody)) {
        nextBody = nextBody.replace(regex, `[[${mention.targetNoteTitle}]]`);
      } else {
        nextBody += `\n- Connected Concept: [[${mention.targetNoteTitle}]]`;
      }

      const nextLinks = Array.from(
        new Set([...sourceNote.wikiLinks, mention.targetNoteTitle])
      );

      return saveOrUpdateNote({
        ...sourceNote,
        markdownBody: nextBody,
        wikiLinks: nextLinks,
      });
    },
    [notes, saveOrUpdateNote]
  );

  // Batch import notes from .zip or Local Folder
  const importExternalNotes = useCallback(
    (importedList: ObsidianNoteFile[]) => {
      if (importedList.length === 0) return;
      setCustomNotesMap((prev) => {
        const next = { ...prev };
        for (const item of importedList) {
          next[item.id] = item;
        }
        saveCustomVaultNotes(next);
        return next;
      });
    },
    []
  );

  // Run AI Semantic Auto-Linker across all vault notes
  const triggerAiSemanticAutoLink = useCallback((): number => {
    const { newEdges, updatedNotes, addedLinksCount } =
      discoverSemanticAutoLinks(notes, graphEdges, 0.24);
    if (addedLinksCount > 0) {
      setGraphEdges((prev) => [...prev, ...newEdges]);
      setNotes(updatedNotes);
    }
    return addedLinksCount;
  }, [notes, graphEdges]);

  // Synchronize real Markdown files to disk on backend when opened
  const syncVaultToDisk = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/obsidian/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memories,
          chatHistory,
          studyPadText,
          whiteboardText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) setSystemStatus(data.status);
      }
    } catch {
      // Offline fallback uses localCompiled
    } finally {
      setIsSyncing(false);
    }
  }, [memories, chatHistory, studyPadText, whiteboardText]);

  useEffect(() => {
    if (isOpen) {
      syncVaultToDisk();
    }
  }, [isOpen, syncVaultToDisk]);

  useEffect(() => {
    const handleBgSync = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        const delta = custom.detail;
        setSystemStatus((prev) => ({
          ...prev,
          totalNotesSynced: delta.totalNotes || prev.totalNotesSynced,
          totalWikiLinks: delta.totalWikiLinks || prev.totalWikiLinks,
          lastSyncedAt: delta.timestamp || prev.lastSyncedAt,
          lastDeltaEvent: delta,
          statusMessage:
            delta.writtenFiles?.length > 0
              ? `Background Auto-Sync: updated ${delta.writtenFiles.length} .md file(s) & ${delta.totalWikiLinks} [[WikiLinks]]`
              : prev.statusMessage,
        }));
      }
    };
    window.addEventListener("mahr-obsidian-sync-status", handleBgSync);
    return () =>
      window.removeEventListener("mahr-obsidian-sync-status", handleBgSync);
  }, []);

  const triggerAutoSetupAndOpenObsidian = useCallback(
    async (forceDownloadInstaller = false) => {
      setIsSettingUp(true);
      try {
        await syncVaultToDisk();

        const ua =
          typeof navigator !== "undefined"
            ? navigator.userAgent.toLowerCase()
            : "";
        const clientPlatform = ua.includes("win")
          ? "win32"
          : ua.includes("mac")
            ? "darwin"
            : "linux";

        const res = await fetch("/api/obsidian/auto-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientPlatform }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setSystemStatus(data.status);
          }

          if (typeof window !== "undefined") {
            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.src =
              data.status?.obsidianUri ||
              "obsidian://open?vault=MAHR_Obsidian_Vault";
            document.body.appendChild(iframe);
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2500);

            if (!data.alreadyInstalled || forceDownloadInstaller) {
              const dlUrl =
                clientPlatform === "win32"
                  ? "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.7.7/Obsidian-1.7.7.exe"
                  : clientPlatform === "darwin"
                    ? "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.7.7/Obsidian-1.7.7.dmg"
                    : "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.7.7/obsidian_1.7.7_amd64.deb";

              const a = document.createElement("a");
              a.href = dlUrl;
              a.download = "";
              a.rel = "noopener noreferrer";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          }
        }
      } catch {
        // Fallback protocol trigger
      } finally {
        setIsSettingUp(false);
      }
    },
    [syncVaultToDisk]
  );

  return {
    notes,
    graphNodes,
    graphEdges,
    systemStatus,
    isSyncing,
    isSettingUp,
    syncVaultToDisk,
    triggerAutoSetupAndOpenObsidian,
    saveOrUpdateNote,
    openOrCreateDailyNote,
    linkUnlinkedMention,
    importExternalNotes,
    triggerAiSemanticAutoLink,
    buildCustomObsidianNote,
  };
}
