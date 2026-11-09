import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  FileText,
  RefreshCw,
  Download,
  Upload,
  FolderSync,
  ExternalLink,
  CheckCircle2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Memory, ChatMessage } from "../lib/memoryTypes";
import {
  ObsidianFolderId,
  ObsidianNoteFile,
  ObsidianGraphNode,
  ObsidianGraphPhysicsConfig,
  ObsidianUnlinkedMention,
} from "../obsidian/layer1_data/obsidianTypes";
import { useObsidianVault } from "../obsidian/layer2_logic/useObsidianVault";
import {
  findShortestGraphPath,
  filterGraphByHopDistance,
} from "../obsidian/layer2_logic/obsidianGraphAnalyticsService";
import {
  computeBacklinksAndUnlinkedMentions,
  OBSIDIAN_NOTE_TEMPLATES,
} from "../obsidian/layer2_logic/obsidianBacklinksAndTemplatesService";
import {
  exportObsidianVaultAsZip,
  importObsidianVaultFromZip,
  syncObsidianVaultWithLocalDirectory,
} from "../obsidian/layer2_logic/obsidianZipAndFolderSyncService";
import { ObsidianGraphControlBar } from "../obsidian/layer3_ui/ObsidianGraphControlBar";
import { ObsidianNoteEditorPane } from "../obsidian/layer3_ui/ObsidianNoteEditorPane";

// Preserved exports for backward compatibility across the codebase
export interface EntityNode {
  id: string;
  name: string;
  type:
    | "person"
    | "project"
    | "concept"
    | "goal"
    | "technology"
    | "location"
    | "event";
  description: string;
  sentiment?: "positive" | "neutral" | "concerned" | "excited";
  importance?: number;
  mentionCount?: number;
  lastMentioned?: string;
}

export interface EntityRelation {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  description: string;
}

export interface KnowledgeGraphData {
  nodes: EntityNode[];
  edges: EntityRelation[];
  lastUpdated: string;
}

interface KnowledgeGraphDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: string;
  memories?: Memory[];
  chatHistory?: ChatMessage[];
  studyPadText?: string;
  whiteboardText?: string;
}

const OBSIDIAN_FOLDERS: Array<{ id: ObsidianFolderId | "ALL"; label: string }> = [
  { id: "ALL", label: "All Vault Files" },
  { id: "00_MOC_Index", label: "00_MOC_Index" },
  { id: "01_Memories", label: "01_Memories" },
  { id: "02_Journal", label: "02_Journal" },
  { id: "03_StudyPad", label: "03_StudyPad" },
  { id: "04_Whiteboard", label: "04_Whiteboard" },
  { id: "05_Custom_Notes", label: "05_Custom_Notes" },
];

export const KnowledgeGraphDashboard: React.FC<KnowledgeGraphDashboardProps> = ({
  isOpen,
  onClose,
  memories = [],
  chatHistory = [],
  studyPadText = "",
  whiteboardText = "",
}) => {
  const {
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
  } = useObsidianVault({
    isOpen,
    memories,
    chatHistory,
    studyPadText,
    whiteboardText,
  });

  const [activeFolder, setActiveFolder] = useState<ObsidianFolderId | "ALL">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoteId, setSelectedNoteId] =
    useState<string>("obs_master_moc");
  const [workspaceTab, setWorkspaceTab] = useState<
    "split" | "graph" | "markdown"
  >("split");
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Interactive Force-Directed Physics & Pathfinding State
  const [physics, setPhysics] = useState<ObsidianGraphPhysicsConfig>({
    repulsion: 140,
    linkDistance: 110,
    gravity: 0.008,
    frozen: false,
    hopFilter: "all",
  });
  const [pathSourceId, setPathSourceId] = useState<string>("");
  const [pathTargetId, setPathTargetId] = useState<string>("");

  // Hidden file input for .zip Vault Import
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  // Obsidian Interactive Graph Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingCanvasRef = useRef(false);
  const draggedNodeIdRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const simNodesRef = useRef<ObsidianGraphNode[]>([]);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  useEffect(() => {
    // Preserve current coordinates for existing nodes when graphNodes updates
    const prevCoords = new Map<
      string,
      { x?: number; y?: number; vx?: number; vy?: number }
    >();
    for (const old of simNodesRef.current) {
      prevCoords.set(old.id, {
        x: old.x,
        y: old.y,
        vx: old.vx,
        vy: old.vy,
      });
    }
    simNodesRef.current = graphNodes.map((n) => {
      const prev = prevCoords.get(n.id);
      return prev ? { ...n, ...prev } : { ...n };
    });
  }, [graphNodes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const folderMatch =
        activeFolder === "ALL" || n.folder === activeFolder;
      const q = searchQuery.toLowerCase().trim();
      const queryMatch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.markdownBody.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q));
      return folderMatch && queryMatch;
    });
  }, [notes, activeFolder, searchQuery]);

  const selectedNote: ObsidianNoteFile = useMemo(() => {
    return (
      notes.find((n) => n.id === selectedNoteId) ||
      filteredNotes[0] ||
      notes[0]
    );
  }, [notes, filteredNotes, selectedNoteId]);

  // Layer 2: Compute Linked Backlinks & Unlinked Mentions for selectedNote
  const { linkedBacklinks, unlinkedMentions } = useMemo(() => {
    return computeBacklinksAndUnlinkedMentions(selectedNote, notes);
  }, [selectedNote, notes]);

  // Layer 2: Compute Shortest Path between pathSourceId and pathTargetId
  const shortestPath = useMemo(() => {
    return findShortestGraphPath(
      pathSourceId,
      pathTargetId,
      graphNodes,
      graphEdges
    );
  }, [pathSourceId, pathTargetId, graphNodes, graphEdges]);

  // Layer 2: Compute Ego-Network Hop Filter around selectedNote
  const { visibleNodeIds, visibleEdgeIds } = useMemo(() => {
    return filterGraphByHopDistance(
      selectedNote?.id,
      physics.hopFilter,
      graphNodes,
      graphEdges
    );
  }, [selectedNote?.id, physics.hopFilter, graphNodes, graphEdges]);

  const handleWikiLinkClick = (wikiTitle: string) => {
    const clean = wikiTitle.replace(/^\[\[|\]\]$/g, "").trim().toLowerCase();
    const target = notes.find(
      (n) =>
        n.title.toLowerCase() === clean ||
        n.title.toLowerCase().includes(clean)
    );
    if (target) {
      setSelectedNoteId(target.id);
      showToast(`Opened linked Obsidian note: [[${target.title}]]`);
    }
  };

  const handleConvertUnlinkedMention = (mention: ObsidianUnlinkedMention) => {
    const updated = linkUnlinkedMention(mention);
    if (updated) {
      showToast(
        `Linked "${mention.matchedPhrase}" in [[${mention.sourceNoteTitle}]] → [[${mention.targetNoteTitle}]]`
      );
    }
  };

  const handleOpenDailyNote = () => {
    const daily = openOrCreateDailyNote();
    setSelectedNoteId(daily.id);
    showToast(`Opened Daily Note: ${daily.title}.md`);
  };

  const handleCreateFromTemplate = (
    templateId: string,
    customTitle?: string
  ) => {
    const tpl = OBSIDIAN_NOTE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const title =
      customTitle || `${tpl.name.replace(/\s+/g, "_")}_${dateStr}`;
    const newNote = buildCustomObsidianNote({
      title,
      folder: tpl.folder,
      category: tpl.category,
      markdownBody: tpl.buildMarkdown(title, dateStr),
      tags: tpl.tags,
    });
    const saved = saveOrUpdateNote(newNote);
    setSelectedNoteId(saved.id);
    showToast(`Created new vault note from template: ${saved.title}.md`);
  };

  const handleTriggerAiAutoConnect = () => {
    const count = triggerAiSemanticAutoLink();
    if (count > 0) {
      showToast(
        `AI Semantic Linker forged ${count} new [[WikiLink]] connections across the Knowledge Graph.`
      );
    } else {
      showToast(
        "All high-confidence semantic connections are already linked in the graph."
      );
    }
  };

  const handleExportZip = async () => {
    const res = await exportObsidianVaultAsZip(notes);
    showToast(
      `Exported ${res.fileCount} .md files & .obsidian config to ${res.fileName}`
    );
  };

  const handleImportZipFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importObsidianVaultFromZip(file);
      importExternalNotes(imported);
      if (imported[0]) setSelectedNoteId(imported[0].id);
      showToast(
        `Imported ${imported.length} Markdown notes from ${file.name} into Vault.`
      );
    } catch {
      showToast("Could not parse .zip archive. Ensure it contains .md files.");
    } finally {
      e.target.value = "";
    }
  };

  const handleTwoWayLocalFolderSync = async () => {
    try {
      const res = await syncObsidianVaultWithLocalDirectory(notes);
      if (!res.supported) {
        await handleExportZip();
        return;
      }
      if (res.importedNotes.length > 0) {
        importExternalNotes(res.importedNotes);
      }
      showToast(
        `Synced ${res.writtenCount} .md notes to "${res.folderName}" (${res.importedNotes.length} new local notes imported).`
      );
    } catch {
      // User cancelled directory picker or iframe security fallback
      await handleExportZip();
    }
  };

  // Interactive Force-Directed Obsidian Graph Canvas Renderer
  useEffect(() => {
    if (!isOpen || workspaceTab === "markdown") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const pathNodeSet = new Set(shortestPath.nodeIds);
    const pathEdgeSet = new Set(shortestPath.edgeIds);

    const renderTick = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      const w = canvas.width;
      const h = canvas.height;
      const nodesList = simNodesRef.current.filter((n) =>
        visibleNodeIds.has(n.id)
      );

      // Force-directed physics step (when not frozen)
      if (!physics.frozen) {
        for (let i = 0; i < nodesList.length; i++) {
          const a = nodesList[i];
          if (draggedNodeIdRef.current === a.id) continue;
          if (a.id === "obs_master_moc") {
            a.x = 0;
            a.y = 0;
            continue;
          }

          // Center gravity
          a.vx = (a.vx || 0) * 0.84 - (a.x || 0) * physics.gravity;
          a.vy = (a.vy || 0) * 0.84 - (a.y || 0) * physics.gravity;

          // Node repulsion
          for (let j = 0; j < nodesList.length; j++) {
            if (i === j) continue;
            const b = nodesList[j];
            const dx = (a.x || 0) - (b.x || 0);
            const dy = (a.y || 0) - (b.y || 0);
            const distSq = Math.max(100, dx * dx + dy * dy);
            if (distSq < 34000) {
              const force = physics.repulsion / distSq;
              a.vx += dx * force;
              a.vy += dy * force;
            }
          }

          // Spring link distance attraction along edges
          for (const edge of graphEdges) {
            if (!visibleEdgeIds.has(edge.id)) continue;
            let otherId: string | null = null;
            if (edge.sourceId === a.id) otherId = edge.targetId;
            else if (edge.targetId === a.id) otherId = edge.sourceId;
            if (!otherId) continue;

            const b = nodesList.find((n) => n.id === otherId);
            if (!b) continue;
            const dx = (b.x || 0) - (a.x || 0);
            const dy = (b.y || 0) - (a.y || 0);
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            const delta = dist - physics.linkDistance;
            const spring = 0.004 * delta;
            a.vx += (dx / dist) * spring;
            a.vy += (dy / dist) * spring;
          }

          a.x = (a.x || 0) + (a.vx || 0);
          a.y = (a.y || 0) + (a.vy || 0);
        }
      }

      // Clear Obsidian dark slate canvas
      ctx.fillStyle = "#0b0c14";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2 + pan.x, h / 2 + pan.y);
      ctx.scale(zoom, zoom);

      // Draw [[WikiLink]] & Semantic Edges
      for (const edge of graphEdges) {
        if (!visibleEdgeIds.has(edge.id)) continue;
        const s = nodesList.find((n) => n.id === edge.sourceId);
        const t = nodesList.find((n) => n.id === edge.targetId);
        if (!s || !t) continue;

        const isPathEdge = pathEdgeSet.has(edge.id);
        const isSelectedEdge =
          s.id === selectedNote?.id || t.id === selectedNote?.id;

        ctx.beginPath();
        ctx.moveTo(s.x || 0, s.y || 0);
        ctx.lineTo(t.x || 0, t.y || 0);

        if (isPathEdge) {
          ctx.strokeStyle = "#22d3ee"; // Bright cyan shortest path
          ctx.lineWidth = 2.8;
        } else if (isSelectedEdge) {
          ctx.strokeStyle = "rgba(168, 85, 247, 0.82)";
          ctx.lineWidth = 1.8;
        } else {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
          ctx.lineWidth = 1.0;
        }
        ctx.stroke();
      }

      // Draw Obsidian Graph Nodes
      for (const node of nodesList) {
        const x = node.x || 0;
        const y = node.y || 0;
        const isSel = node.id === selectedNote?.id;
        const isInPath = pathNodeSet.has(node.id);

        if (isSel || isInPath) {
          ctx.beginPath();
          ctx.arc(x, y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isInPath
            ? "rgba(34, 211, 238, 0.32)"
            : "rgba(168, 85, 247, 0.28)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = isInPath
          ? "#22d3ee"
          : isSel
            ? "#ffffff"
            : "rgba(255,255,255,0.25)";
        ctx.lineWidth = isSel || isInPath ? 2.4 : 1;
        ctx.stroke();

        // Node label
        ctx.font =
          isSel || isInPath
            ? "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace"
            : "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = isInPath
          ? "#67e8f9"
          : isSel
            ? "#ffffff"
            : "#cbd5e1";
        ctx.textAlign = "center";
        const shortLabel =
          node.title.length > 26
            ? node.title.slice(0, 24) + "…"
            : node.title;
        ctx.fillText(shortLabel, x, y + node.radius + 14);
      }

      ctx.restore();
      animId = requestAnimationFrame(renderTick);
    };

    animId = requestAnimationFrame(renderTick);
    return () => cancelAnimationFrame(animId);
  }, [
    isOpen,
    workspaceTab,
    graphEdges,
    selectedNote,
    zoom,
    pan,
    physics,
    shortestPath,
    visibleNodeIds,
    visibleEdgeIds,
  ]);

  const getCanvasGraphCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - canvas.width / 2 - pan.x) / zoom,
      y: (e.clientY - rect.top - canvas.height / 2 - pan.y) / zoom,
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Hidden File Input for .zip Vault Import */}
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            onChange={handleImportZipFile}
            className="hidden"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-6xl h-[90vh] bg-[#090a12]/95 border border-purple-500/30 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-slate-100 z-10"
          >
            {/* Top Obsidian Header & Two-Way Sync Controls */}
            <div className="px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-purple-950/50 via-slate-950 to-indigo-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
                  <Sparkles size={20} className="text-purple-300" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                    MAHR × Obsidian Second-Brain Vault & Graph Studio
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-0.5 tabular-nums">
                    Vault: {systemStatus.vaultName} · {notes.length} Markdown Notes ·{" "}
                    {graphEdges.length} Connections ·{" "}
                    {systemStatus.installed
                      ? "Local Obsidian Connected"
                      : "Two-Way Sync Ready"}
                  </p>
                </div>
              </div>

              {/* Right View Mode & Two-Way Folder / ZIP Sync Controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab("split")}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      workspaceTab === "split"
                        ? "bg-purple-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Split View
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab("graph")}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      workspaceTab === "graph"
                        ? "bg-purple-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Knowledge Graph
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab("markdown")}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      workspaceTab === "markdown"
                        ? "bg-purple-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Vault Studio
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTwoWayLocalFolderSync}
                  className="h-9 px-2.5 rounded-xl border border-cyan-500/35 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono text-cyan-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Two-way sync with a local folder on your machine (or export .zip)"
                >
                  <FolderSync size={13} />
                  <span className="hidden sm:inline">Local Folder</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportZip}
                  className="h-9 px-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Download complete Obsidian Vault (.md files + .obsidian config) as .zip"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Export .zip</span>
                </button>

                <button
                  type="button"
                  onClick={() => zipInputRef.current?.click()}
                  className="h-9 px-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Import an existing Obsidian Vault .zip archive"
                >
                  <Upload size={13} />
                  <span className="hidden sm:inline">Import .zip</span>
                </button>

                <button
                  type="button"
                  onClick={syncVaultToDisk}
                  disabled={isSyncing}
                  className="h-9 px-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Synchronize all Memories, Journal, Study Pad & Whiteboard to server disk"
                >
                  <RefreshCw
                    size={13}
                    className={
                      isSyncing ? "animate-spin text-purple-400" : ""
                    }
                  />
                  <span className="hidden lg:inline">
                    {isSyncing ? "Syncing..." : "Sync Disk"}
                  </span>
                </button>

                <button
                  id="obsidian-auto-setup-launch-btn"
                  data-testid="obsidian-auto-setup-launch-btn"
                  type="button"
                  onClick={() => triggerAutoSetupAndOpenObsidian(false)}
                  disabled={isSettingUp}
                  className="h-9 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950/60 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ExternalLink size={13} />
                  <span>
                    {systemStatus.installed
                      ? "Open Obsidian"
                      : isSettingUp
                        ? "Launching..."
                        : "Open in Obsidian"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/80 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Status Strip */}
            <div className="px-5 py-2 bg-slate-950/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  className="text-emerald-400 shrink-0"
                />
                <span>{actionToast || systemStatus.statusMessage}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 tabular-nums">
                <span>Path: {systemStatus.vaultPath}</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => triggerAutoSetupAndOpenObsidian(true)}
                  className="text-purple-300 hover:text-white underline cursor-pointer"
                >
                  Download Official Obsidian Installer
                </button>
              </div>
            </div>

            {/* Main 3-Pane Obsidian Second-Brain Body */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* LEFT SIDEBAR: Obsidian Vault Folder Tree & Note Explorer */}
              <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/10 bg-[#0d0e18] flex flex-col shrink-0">
                <div className="p-3 border-b border-white/10 space-y-2">
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search vault notes & #tags..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Folder Filter Tabs */}
                  <div className="flex flex-wrap gap-1">
                    {OBSIDIAN_FOLDERS.map((f) => {
                      const active = activeFolder === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setActiveFolder(f.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                            active
                              ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 font-bold"
                              : "bg-white/5 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
                  {filteredNotes.map((note) => {
                    const isSelected = selectedNote?.id === note.id;
                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => setSelectedNoteId(note.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-400/60 text-white"
                            : "bg-transparent border-transparent hover:bg-white/5 text-slate-300"
                        }`}
                      >
                        <FileText
                          size={14}
                          className="shrink-0 mt-0.5"
                          style={{ color: note.clusterColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-mono font-semibold truncate">
                            {note.title}.md
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 tabular-nums flex items-center gap-1.5 mt-0.5">
                            <span>{note.folder}</span>
                            <span>·</span>
                            <span>{note.wikiLinks.length} links</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CENTER / RIGHT: Obsidian Graph View & Markdown Note Studio */}
              <div className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0 overflow-hidden">
                {/* Interactive Obsidian Graph View */}
                {(workspaceTab === "split" || workspaceTab === "graph") && (
                  <div
                    className={`relative flex-1 bg-[#0b0c14] flex flex-col min-h-[280px] ${
                      workspaceTab === "split"
                        ? "lg:border-r border-white/10"
                        : ""
                    }`}
                  >
                    {/* Layer 3: Physics Controls, Hop Filter & Shortest-Path Finder */}
                    <ObsidianGraphControlBar
                      nodes={graphNodes}
                      physics={physics}
                      onUpdatePhysics={(patch) =>
                        setPhysics((prev) => ({ ...prev, ...patch }))
                      }
                      pathSourceId={pathSourceId}
                      pathTargetId={pathTargetId}
                      onSelectPathSource={setPathSourceId}
                      onSelectPathTarget={setPathTargetId}
                      shortestPath={shortestPath}
                      onClearPath={() => {
                        setPathSourceId("");
                        setPathTargetId("");
                      }}
                      onTriggerAiAutoConnect={handleTriggerAiAutoConnect}
                      onSelectNode={(id) => setSelectedNoteId(id)}
                    />

                    <div className="relative flex-1 flex flex-col min-h-0">
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-white/10 pointer-events-none tabular-nums">
                        <Share2 size={12} className="text-purple-400" />
                        <span>
                          {visibleNodeIds.size} Nodes · {visibleEdgeIds.size} Edges
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) => Math.min(2.4, z + 0.2))
                          }
                          className="p-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) => Math.max(0.4, z - 0.2))
                          }
                          className="p-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                          title="Zoom Out"
                        >
                          <ZoomOut size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setZoom(1.0);
                            setPan({ x: 0, y: 0 });
                          }}
                          className="p-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                          title="Reset Camera"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </div>

                      <canvas
                        ref={canvasRef}
                        onMouseDown={(e) => {
                          const pt = getCanvasGraphCoords(e);
                          // Check if user clicked on a node to drag/select it
                          for (const node of simNodesRef.current) {
                            if (!visibleNodeIds.has(node.id)) continue;
                            const dx = pt.x - (node.x || 0);
                            const dy = pt.y - (node.y || 0);
                            if (
                              Math.sqrt(dx * dx + dy * dy) <=
                              node.radius + 8
                            ) {
                              draggedNodeIdRef.current = node.id;
                              setSelectedNoteId(node.id);
                              return;
                            }
                          }
                          isDraggingCanvasRef.current = true;
                          dragStartRef.current = {
                            x: e.clientX - pan.x,
                            y: e.clientY - pan.y,
                          };
                        }}
                        onMouseMove={(e) => {
                          if (draggedNodeIdRef.current) {
                            const pt = getCanvasGraphCoords(e);
                            const node = simNodesRef.current.find(
                              (n) => n.id === draggedNodeIdRef.current
                            );
                            if (node) {
                              node.x = pt.x;
                              node.y = pt.y;
                              node.vx = 0;
                              node.vy = 0;
                            }
                            return;
                          }
                          if (!isDraggingCanvasRef.current) return;
                          setPan({
                            x: e.clientX - dragStartRef.current.x,
                            y: e.clientY - dragStartRef.current.y,
                          });
                        }}
                        onMouseUp={() => {
                          draggedNodeIdRef.current = null;
                          isDraggingCanvasRef.current = false;
                        }}
                        onMouseLeave={() => {
                          draggedNodeIdRef.current = null;
                          isDraggingCanvasRef.current = false;
                        }}
                        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
                      />
                    </div>

                    {/* Graph Color Legend */}
                    <div className="px-4 py-2 bg-slate-950/90 border-t border-white/10 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400">
                      <span>#a855f7 · 00_MOC</span>
                      <span>·</span>
                      <span>#38bdf8 · 01_Memories</span>
                      <span>·</span>
                      <span>#818cf8 · 02_Journal</span>
                      <span>·</span>
                      <span>#34d399 · 03_StudyPad</span>
                      <span>·</span>
                      <span>#fbbf24 · 04_Whiteboard</span>
                      <span>·</span>
                      <span>#f472b6 · 05_Custom</span>
                    </div>
                  </div>
                )}

                {/* Layer 3: Obsidian Markdown Note Editor, Templates, Backlinks & Unlinked Mentions */}
                {(workspaceTab === "split" || workspaceTab === "markdown") &&
                  selectedNote && (
                    <ObsidianNoteEditorPane
                      note={selectedNote}
                      linkedBacklinks={linkedBacklinks}
                      unlinkedMentions={unlinkedMentions}
                      onSaveEditedNote={(updated) => {
                        const saved = saveOrUpdateNote(updated);
                        showToast(
                          `Saved ${saved.title}.md and updated [[WikiLinks]] in Knowledge Graph.`
                        );
                      }}
                      onClickWikiLink={handleWikiLinkClick}
                      onSelectNoteById={(id) => setSelectedNoteId(id)}
                      onConvertUnlinkedMention={handleConvertUnlinkedMention}
                      onOpenDailyNote={handleOpenDailyNote}
                      onCreateFromTemplate={handleCreateFromTemplate}
                    />
                  )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
