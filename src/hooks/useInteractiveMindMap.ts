import React, { useState, useRef, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  InteractiveMindMapNode,
  InteractiveMindMapEdge,
  MindMapLayoutMode,
  MindMapColor,
  VectorExpansionResult,
} from "../types/mindMapTypes";
import {
  calculateRadialLayout,
  calculateHorizontalTreeLayout,
} from "../services/mindMapLayoutEngine";
import {
  expandNodeWithVectorMemory,
  MINDMAP_PRESETS,
} from "../services/mindMapVectorService";

export interface UseInteractiveMindMapProps {
  initialPresetId?: string;
  initialTopic?: string;
  activeModelId?: string;
  onToast?: (message: string) => void;
  onSpeak?: (text: string) => void;
  onUpdateWhiteboardText?: (markdown: string) => void;
}

export function useInteractiveMindMap({
  initialPresetId,
  initialTopic,
  activeModelId = "gemini-3.1-flash-lite",
  onToast,
  onSpeak,
  onUpdateWhiteboardText,
}: UseInteractiveMindMapProps = {}) {
  // Preset initialization
  const initialPreset = MINDMAP_PRESETS.find((p) => p.id === initialPresetId) || MINDMAP_PRESETS[0];

  const [nodes, setNodes] = useState<InteractiveMindMapNode[]>(() => {
    if (initialTopic && initialTopic.trim()) {
      return [
        {
          id: "root-node",
          title: initialTopic.trim(),
          description: "Core central concept for exploration & vector memory mapping.",
          x: 700,
          y: 450,
          w: 240,
          h: 110,
          color: "purple",
          depth: 0,
          isRoot: true,
          isExpanded: false,
          clusterName: "Central Concept",
          details: ["Click 'Expand with Memory' to dynamically branch this concept"],
        },
      ];
    }
    return initialPreset.nodes;
  });

  const [edges, setEdges] = useState<InteractiveMindMapEdge[]>(() => {
    if (initialTopic && initialTopic.trim()) {
      return [];
    }
    return initialPreset.edges;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<MindMapLayoutMode>("radial");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExpandingNodeId, setIsExpandingNodeId] = useState<string | null>(null);
  const [lastExpansionResult, setLastExpansionResult] = useState<VectorExpansionResult | null>(null);

  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connect Dragging State (dragging a connection line between nodes)
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [connectingPointerPos, setConnectingPointerPos] = useState<{ x: number; y: number } | null>(null);

  // Container measurement
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width || 1200,
          height: entry.contentRect.height || 800,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update a single node
  const handleUpdateNode = useCallback((nodeId: string, patch: Partial<InteractiveMindMapNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)));
  }, []);

  // Delete a node and its cascading edges
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.from !== nodeId && e.to !== nodeId));
    setSelectedNodeId((current) => (current === nodeId ? null : current));
    onToast?.("🗑️ Node and associated connections removed.");
  }, [onToast]);

  // Smooth Node Dragging
  const handleStartNodeDrag = useCallback(
    (nodeId: string, startEvent: React.PointerEvent) => {
      startEvent.stopPropagation();
      startEvent.preventDefault();

      const targetNode = nodes.find((n) => n.id === nodeId);
      if (!targetNode) return;

      const initialPointerX = startEvent.clientX;
      const initialPointerY = startEvent.clientY;
      const initialNodeX = targetNode.x;
      const initialNodeY = targetNode.y;

      const onPointerMove = (moveEvt: PointerEvent) => {
        const deltaX = (moveEvt.clientX - initialPointerX) / zoom;
        const deltaY = (moveEvt.clientY - initialPointerY) / zoom;

        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  x: Math.round(initialNodeX + deltaX),
                  y: Math.round(initialNodeY + deltaY),
                }
              : n
          )
        );
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [nodes, zoom]
  );

  // Dynamic Expansion via Vector Memory Engine
  const handleExpandNode = useCallback(
    async (nodeId: string) => {
      const parent = nodes.find((n) => n.id === nodeId);
      if (!parent || isExpandingNodeId) return;

      setIsExpandingNodeId(nodeId);
      handleUpdateNode(nodeId, { isExpanding: true, status: "expanding" });

      onToast?.(`⚡ Querying Vector Memory Engine for "${parent.title}"...`);

      try {
        const center = {
          x: containerSize.width ? containerSize.width / 2 : 700,
          y: containerSize.height ? containerSize.height / 2 : 500,
        };

        const result = await expandNodeWithVectorMemory(parent, nodes, activeModelId, center);

        setNodes((prev) => {
          const updatedParent = prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  isExpanded: true,
                  isExpanding: false,
                  status: "expanded" as const,
                  expansionCount: (n.expansionCount || 0) + 1,
                }
              : n
          );
          return [...updatedParent, ...result.newNodes];
        });

        setEdges((prev) => [...prev, ...result.newEdges]);
        setLastExpansionResult(result);

        const toastMsg = result.recalledCount > 0
          ? `✨ Recalled ${result.recalledCount} vector memories! Spawned ${result.newNodes.length} dynamic sub-concepts (${Math.round(result.avgSimilarity * 100)}% match).`
          : `✨ Expanded "${parent.title}" with ${result.newNodes.length} granular sub-concepts.`;

        onToast?.(toastMsg);

        // Celebration micro-burst
        confetti({
          particleCount: 28,
          spread: 55,
          origin: { y: 0.6 },
          colors: ["#a855f7", "#06b6d4", "#10b981", "#fbbf24"],
        });

        if (onSpeak) {
          onSpeak(`Expanded ${parent.title} with ${result.newNodes.length} interconnected concepts from your knowledge base.`);
        }
      } catch (err) {
        console.error("[useInteractiveMindMap] Error expanding node:", err);
        onToast?.("⚠️ Expansion failed. Please check connection and try again.");
      } finally {
        setIsExpandingNodeId(null);
        handleUpdateNode(nodeId, { isExpanding: false });
      }
    },
    [nodes, isExpandingNodeId, containerSize, activeModelId, handleUpdateNode, onToast, onSpeak]
  );

  // Add Manual Child Node
  const handleAddChildNode = useCallback(
    (parentId: string) => {
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent) return;

      const newId = `node-manual-${Date.now()}`;
      const newNode: InteractiveMindMapNode = {
        id: newId,
        title: "New Concept Branch",
        description: "Click to edit concept details or expand with vector memory.",
        x: parent.x + 190,
        y: parent.y + 40,
        w: 200,
        h: 90,
        color: parent.color,
        parentId: parent.id,
        depth: parent.depth + 1,
        details: ["Add custom notes or equations here"],
        status: "idle",
      };

      setNodes((prev) => [...prev, newNode]);
      setEdges((prev) => [
        ...prev,
        {
          id: `edge-${parent.id}-${newId}`,
          from: parent.id,
          to: newId,
          color: parent.color,
          animated: true,
        },
      ]);
      setSelectedNodeId(newId);
      onToast?.("➕ Added new branch node. Double-click to customize.");
    },
    [nodes, onToast]
  );

  // Add Independent Root/Floating Node
  const handleAddFloatingNode = useCallback(() => {
    const centerCanvasX = Math.round((-pan.x + containerSize.width / 2) / zoom);
    const centerCanvasY = Math.round((-pan.y + containerSize.height / 2) / zoom);

    const newId = `node-floating-${Date.now()}`;
    const newNode: InteractiveMindMapNode = {
      id: newId,
      title: "New Central Topic",
      description: "Independent topic. Drag or connect to other nodes.",
      x: centerCanvasX,
      y: centerCanvasY,
      w: 220,
      h: 96,
      color: "cyan",
      depth: 0,
      isRoot: nodes.length === 0,
      status: "idle",
      details: ["Standalone conceptual anchor"],
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    onToast?.("💡 Created new topic node.");
  }, [pan, zoom, containerSize, nodes.length, onToast]);

  // Connect Nodes
  const handleConnectNodes = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      const exists = edges.some((e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId));
      if (exists) {
        onToast?.("Notice: Connection already exists.");
        return;
      }

      const fromNode = nodes.find((n) => n.id === fromId);
      setEdges((prev) => [
        ...prev,
        {
          id: `edge-${fromId}-${toId}-${Date.now()}`,
          from: fromId,
          to: toId,
          color: fromNode?.color || "purple",
          animated: true,
        },
      ]);
      onToast?.("🔗 Connected nodes successfully.");
    },
    [edges, nodes, onToast]
  );

  // Auto-Layout rebalance
  const handleApplyLayout = useCallback(
    (mode: MindMapLayoutMode) => {
      setLayoutMode(mode);
      const center = {
        x: containerSize.width ? containerSize.width / 2 : 700,
        y: containerSize.height ? containerSize.height / 2 : 500,
      };

      if (mode === "radial" || mode === "organic") {
        const rebalanced = calculateRadialLayout(nodes, edges, center);
        setNodes(rebalanced);
        onToast?.("🌀 Applied Radial Mind Map Layout.");
      } else if (mode === "tree-horizontal") {
        const rebalanced = calculateHorizontalTreeLayout(nodes, edges, 200, center.y);
        setNodes(rebalanced);
        onToast?.("🌿 Applied Horizontal Tree Layout.");
      }
    },
    [nodes, edges, containerSize, onToast]
  );

  // Load Preset
  const handleSelectPreset = useCallback(
    (presetId: string) => {
      const p = MINDMAP_PRESETS.find((item) => item.id === presetId);
      if (!p) return;
      setNodes(p.nodes);
      setEdges(p.edges);
      setSelectedNodeId(null);
      setPan({ x: 50, y: 30 });
      setZoom(0.95);
      onToast?.(`📚 Loaded preset: ${p.name}`);
    },
    [onToast]
  );

  // Export to Markdown Summary
  const handleExportMarkdown = useCallback(() => {
    const root = nodes.find((n) => n.isRoot) || nodes[0];
    let md = `# 🧠 Mind Map: ${root?.title || "Knowledge Graph"}\n\n`;
    md += `*Nodes: ${nodes.length} | Connections: ${edges.length} | Layout: ${layoutMode}*\n\n`;

    nodes.forEach((n) => {
      const indent = "  ".repeat(n.depth || 0);
      md += `${indent}- **${n.title}**${n.vectorSimilarity ? ` *(Match: ${Math.round(n.vectorSimilarity * 100)}%)*` : ""}\n`;
      if (n.description) {
        md += `${indent}  ${n.description}\n`;
      }
      if (n.details && n.details.length > 0) {
        n.details.forEach((d) => {
          md += `${indent}    • ${d}\n`;
        });
      }
    });

    if (onUpdateWhiteboardText) {
      onUpdateWhiteboardText(md);
      onToast?.("📝 Exported Mind Map outline directly to Whiteboard!");
    }

    navigator.clipboard?.writeText(md);
    return md;
  }, [nodes, edges, layoutMode, onUpdateWhiteboardText, onToast]);

  // Center / Zoom to Fit
  const handleZoomToFit = useCallback(() => {
    if (nodes.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x - n.w / 2);
      maxX = Math.max(maxX, n.x + n.w / 2);
      minY = Math.min(minY, n.y - n.h / 2);
      maxY = Math.max(maxY, n.y + n.h / 2);
    });

    const contentW = maxX - minX + 200;
    const contentH = maxY - minY + 200;
    const scaleX = containerSize.width / contentW;
    const scaleY = containerSize.height / contentH;
    const newZoom = Math.min(1.4, Math.max(0.45, Math.min(scaleX, scaleY)));

    const newPanX = containerSize.width / 2 - ((minX + maxX) / 2) * newZoom;
    const newPanY = containerSize.height / 2 - ((minY + maxY) / 2) * newZoom;

    setZoom(newZoom);
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    onToast?.("🎯 Centered Mind Map in viewport.");
  }, [nodes, containerSize, onToast]);

  // Filtered nodes based on search query
  const filteredNodeIds = new Set<string>();
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    nodes.forEach((n) => {
      if (
        n.title.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        (n.details || []).some((d) => d.toLowerCase().includes(q))
      ) {
        filteredNodeIds.add(n.id);
      }
    });
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    setSelectedNodeId,
    layoutMode,
    setLayoutMode,
    searchQuery,
    setSearchQuery,
    filteredNodeIds,
    isExpandingNodeId,
    lastExpansionResult,
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    setIsPanning,
    panStartRef,
    containerRef,
    containerSize,
    connectingSourceId,
    setConnectingSourceId,
    connectingPointerPos,
    setConnectingPointerPos,
    handleStartNodeDrag,
    handleExpandNode,
    handleAddChildNode,
    handleAddFloatingNode,
    handleConnectNodes,
    handleUpdateNode,
    handleDeleteNode,
    handleApplyLayout,
    handleSelectPreset,
    handleExportMarkdown,
    handleZoomToFit,
  };
}
