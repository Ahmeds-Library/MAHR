import React, { useState, useRef, useEffect } from "react";
import { useInteractiveMindMap, UseInteractiveMindMapProps } from "../../hooks/useInteractiveMindMap";
import { MindMapNodeCard } from "./MindMapNodeCard";
import { MindMapToolbar } from "./MindMapToolbar";
import { MindMapDetailModal } from "./MindMapDetailModal";
import { generateOrganicSplinePath } from "../../services/mindMapLayoutEngine";
import { MINDMAP_COLOR_PALETTES, InteractiveMindMapNode } from "../../types/mindMapTypes";
import { Sparkles, Brain, Move, MousePointer, Info, Zap } from "lucide-react";

export interface InteractiveMindMapCanvasProps extends UseInteractiveMindMapProps {
  className?: string;
  onClose?: () => void;
  onAskMahr?: (question: string) => void;
  onAskMyraa?: (question: string) => void;
}

export const InteractiveMindMapCanvas: React.FC<InteractiveMindMapCanvasProps> = ({
  className = "",
  initialPresetId,
  initialTopic,
  activeModelId,
  onClose,
  onAskMahr,
  onAskMyraa,
  onUpdateWhiteboardText,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [inspectingNodeId, setInspectingNodeId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3600);
  };

  const tutorCallback = onAskMahr || onAskMyraa;

  const {
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
  } = useInteractiveMindMap({
    initialPresetId,
    initialTopic,
    activeModelId,
    onToast: showToast,
    onSpeak: (t) => console.log("[MindMap Speech]:", t),
    onUpdateWhiteboardText,
  });

  // Background Pan & Wheel Zoom handling
  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
    setSelectedNodeId(null);
  };

  const handleBackgroundPointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    } else if (connectingSourceId) {
      // Update connecting link pointer position in canvas space
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setConnectingPointerPos({
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom,
        });
      }
    }
  };

  const handleBackgroundPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (connectingSourceId) {
      // Check if dropped onto a target node
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const dropX = (e.clientX - rect.left - pan.x) / zoom;
        const dropY = (e.clientY - rect.top - pan.y) / zoom;

        const targetNode = nodes.find(
          (n) =>
            n.id !== connectingSourceId &&
            Math.abs(n.x - dropX) < n.w / 2 &&
            Math.abs(n.y - dropY) < n.h / 2
        );

        if (targetNode) {
          handleConnectNodes(connectingSourceId, targetNode.id);
        }
      }
      setConnectingSourceId(null);
      setConnectingPointerPos(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(2.0, Math.max(0.35, zoom * zoomFactor));

    // Zoom toward mouse pointer
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else {
      setZoom(newZoom);
    }
  };

  const nodeMap = new Map<string, InteractiveMindMapNode>(nodes.map((n) => [n.id, n]));
  const inspectingNode = nodes.find((n) => n.id === inspectingNodeId) || null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col bg-[#050510] text-slate-100 overflow-hidden select-none ${className}`}
    >
      {/* 1. TOP TOOLBAR */}
      <MindMapToolbar
        layoutMode={layoutMode}
        onChangeLayout={handleApplyLayout}
        onAddFloatingNode={handleAddFloatingNode}
        onAutoBalance={() => handleApplyLayout(layoutMode)}
        onZoomToFit={handleZoomToFit}
        onZoomIn={() => setZoom((z) => Math.min(2.0, z * 1.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.35, z / 1.15))}
        zoom={zoom}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchMatchesCount={filteredNodeIds.size}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        onSelectPreset={handleSelectPreset}
        onExportMarkdown={handleExportMarkdown}
        onClose={onClose}
      />

      {/* 2. MAIN INFINITE CANVAS VIEWPORT */}
      <div
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handleBackgroundPointerMove}
        onPointerUp={handleBackgroundPointerUp}
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Dynamic Subtle Tech Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.4) 1px, transparent 0),
              linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: `24px 24px, ${60 * zoom}px ${60 * zoom}px, ${60 * zoom}px ${60 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Scaled & Panned Canvas Layer */}
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none"
        >
          {/* SVG Connector Edge Layer */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            <defs>
              <linearGradient id="edge-flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>

              {/* Arrow Marker */}
              <marker
                id="mindmap-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" opacity="0.8" />
              </marker>
            </defs>

            {/* Render Existing Connecting Edges */}
            {edges.map((edge) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const pathString = generateOrganicSplinePath(
                { x: fromNode.x, y: fromNode.y },
                { x: toNode.x, y: toNode.y },
                layoutMode
              );

              const edgeColor = edge.color
                ? MINDMAP_COLOR_PALETTES[edge.color as keyof typeof MINDMAP_COLOR_PALETTES]?.edgeGradient || "#a855f7"
                : "#a855f7";

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              return (
                <g key={edge.id}>
                  {/* Glowing background stroke */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth="4"
                    strokeOpacity="0.2"
                    strokeLinecap="round"
                  />
                  {/* Core connector line */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth="2.2"
                    strokeOpacity="0.85"
                    strokeLinecap="round"
                    strokeDasharray={edge.animated ? "6, 4" : undefined}
                    className={edge.animated ? "animate-[dash_20s_linear_infinite]" : ""}
                  />

                  {/* Similarity / Label Badge along edge */}
                  {edge.similarity !== undefined && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-18"
                        y="-9"
                        width="36"
                        height="18"
                        rx="9"
                        fill="#0b0b1a"
                        stroke={edgeColor}
                        strokeWidth="1"
                        opacity="0.9"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {Math.round(edge.similarity * 100)}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Connecting line currently being dragged */}
            {connectingSourceId && connectingPointerPos && (
              (() => {
                const sourceNode = nodeMap.get(connectingSourceId);
                if (!sourceNode) return null;
                const pathString = generateOrganicSplinePath(
                  { x: sourceNode.x, y: sourceNode.y },
                  connectingPointerPos,
                  layoutMode
                );
                return (
                  <path
                    d={pathString}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    strokeDasharray="4, 4"
                    className="animate-pulse"
                    markerEnd="url(#mindmap-arrow)"
                  />
                );
              })()
            )}
          </svg>

          {/* Render Interactive Mind Map Nodes */}
          <div className="absolute inset-0 pointer-events-auto">
            {nodes.map((node) => (
              <MindMapNodeCard
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isConnectingSource={connectingSourceId === node.id}
                isHighlightedBySearch={filteredNodeIds.has(node.id)}
                hasSearchQuery={Boolean(searchQuery.trim())}
                onSelect={() => setSelectedNodeId(node.id)}
                onStartDrag={(e) => handleStartNodeDrag(node.id, e)}
                onExpand={() => handleExpandNode(node.id)}
                onAddChild={() => handleAddChildNode(node.id)}
                onStartConnect={(e) => {
                  e.stopPropagation();
                  setConnectingSourceId(node.id);
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setConnectingPointerPos({
                      x: (e.clientX - rect.left - pan.x) / zoom,
                      y: (e.clientY - rect.top - pan.y) / zoom,
                    });
                  }
                }}
                onUpdate={(patch) => handleUpdateNode(node.id, patch)}
                onDelete={() => handleDeleteNode(node.id)}
                onOpenDetails={() => setInspectingNodeId(node.id)}
                onAskMahr={tutorCallback}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. FLOATING VECTOR MEMORY ALERT TOAST */}
      {toastMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.35)] rounded-2xl px-4 py-2.5 backdrop-blur-xl flex items-center gap-2.5 text-xs font-mono text-purple-200 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={14} className="text-amber-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4. EXPANDING VECTOR INDICATOR PILL */}
      {isExpandingNodeId && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-purple-950/90 border border-purple-500/60 shadow-2xl rounded-full px-5 py-2 backdrop-blur-md flex items-center gap-3 text-xs font-mono text-purple-200 animate-pulse">
          <Brain size={16} className="text-cyan-400 animate-spin" />
          <span>Vector Memory Engine: Retrieving semantic graph & synthesizing deep concepts...</span>
        </div>
      )}

      {/* 5. BOTTOM HELPER OVERVIEW PILL */}
      <div className="absolute bottom-3 left-4 z-20 hidden md:flex items-center gap-3 bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-400 backdrop-blur-md">
        <span className="flex items-center gap-1">
          <MousePointer size={11} className="text-purple-400" />
          <span>Click node to expand</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Move size={11} className="text-cyan-400" />
          <span>Drag node to move</span>
        </span>
        <span>•</span>
        <span>Wheel to Zoom</span>
      </div>

      {/* 6. INSPECT DETAILS MODAL */}
      {inspectingNode && (
        <MindMapDetailModal
          node={inspectingNode}
          onClose={() => setInspectingNodeId(null)}
          onUpdate={handleUpdateNode}
          onAskMahr={tutorCallback}
          onExpandNode={handleExpandNode}
        />
      )}
    </div>
  );
};
