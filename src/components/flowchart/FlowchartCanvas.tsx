"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FlowNodeCard } from "./FlowNodeCard";
import { FlowchartToolbar } from "./FlowchartToolbar";
import { StepNode, FlowchartEdge, FlowchartPreset } from "../../types/flowchartTypes";
import { FLOWCHART_PRESETS, generateFlowchartFromTopic, PURPLE, AMBER, EMERALD, ROSE, CYAN, mix } from "../../lib/flowchartPresets";
import { calculateNodeAnchors, generateBezierPath, clampNodeX } from "../../services/flowchartEngine";

interface FlowchartCanvasProps {
  initialPresetId?: string;
  onAskMahr?: (question: string) => void;
  onAskMyraa?: (question: string) => void;
  className?: string;
  onClose?: () => void;
}

export function FlowchartCanvas({
  initialPresetId = "order-fraud-trigger",
  onAskMahr,
  onAskMyraa,
  className = "",
  onClose,
}: FlowchartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<StepNode[]>(() => {
    const preset = FLOWCHART_PRESETS.find((p) => p.id === initialPresetId) || FLOWCHART_PRESETS[0];
    return preset.nodes;
  });
  const [edges, setEdges] = useState<FlowchartEdge[]>(() => {
    const preset = FLOWCHART_PRESETS.find((p) => p.id === initialPresetId) || FLOWCHART_PRESETS[0];
    return preset.edges;
  });
  const [currentPresetId, setCurrentPresetId] = useState<string>(initialPresetId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Store measured rendered heights of nodes
  const [nodeHeights, setNodeHeights] = useState<Record<string, number>>({});
  const [containerWidth, setContainerWidth] = useState(1000);

  // ResizeObserver for canvas container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width || 1000);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update a node's measured height
  const handleNodeResize = useCallback((nodeId: string, height: number) => {
    setNodeHeights((prev) => {
      if (prev[nodeId] === height) return prev;
      return { ...prev, [nodeId]: height };
    });
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (preset: FlowchartPreset) => {
    setCurrentPresetId(preset.id);
    setNodes(preset.nodes);
    setEdges(preset.edges);
    setSelectedNodeId(null);
    setIsSimulating(false);
  };

  // Generate from prompt
  const handleGenerateFromPrompt = (prompt: string) => {
    const newPreset = generateFlowchartFromTopic(prompt);
    setCurrentPresetId(newPreset.id);
    setNodes(newPreset.nodes);
    setEdges(newPreset.edges);
    setSelectedNodeId(null);
    setIsSimulating(false);
  };

  // Update a single node's state or position
  const handleUpdateNode = (nodeId: string, patch: Partial<StepNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, ...patch } : n))
    );
  };

  // Delete a node and connected edges
  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.from !== nodeId && e.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Add new Node
  const handleAddNode = (type: "trigger" | "condition" | "action") => {
    const maxRow = nodes.reduce((max, n) => Math.max(max, n.row), 0);
    const newId = `node-${Date.now()}`;
    let newNode: StepNode;

    if (type === "trigger") {
      newNode = {
        id: newId,
        row: 0,
        x: 0.5,
        w: 420,
        kind: { label: "Trigger", hue: PURPLE },
        hue: PURPLE,
        title: "New Inbound Trigger",
        caption: "Listens for real-time external events or user actions.",
        actionType: "trigger",
      };
    } else if (type === "condition") {
      newNode = {
        id: newId,
        row: maxRow + 1,
        x: 0.5,
        w: 500,
        kind: { label: "Condition", hue: AMBER },
        hue: AMBER,
        condition: true,
        actionType: "condition",
        conditionRules: [
          {
            id: `r-${Date.now()}`,
            prefix: "If",
            sourceLabel: "input",
            property: "Status",
            operator: "is",
            value: "Success",
            dotColor: EMERALD,
            propertyOptions: ["Status", "Value", "Risk", "Type"],
            valueOptions: [
              { name: "Success", tag: "Pass" },
              { name: "Pending", tag: "Wait" },
              { name: "Error", tag: "Fail" },
            ],
          },
        ],
      };
    } else {
      newNode = {
        id: newId,
        row: maxRow + 1,
        x: 0.5,
        w: 360,
        kind: { label: "Action Step", hue: EMERALD },
        hue: EMERALD,
        title: "Execute Automated Action",
        caption: "Processes output payload and dispatches notifications.",
        actionType: "action",
      };
    }

    setNodes((prev) => [...prev, newNode]);

    // Auto connect to previous lowest row node if available
    const lowestRowNodes = nodes.filter((n) => n.row === maxRow);
    if (lowestRowNodes.length > 0 && type !== "trigger") {
      setEdges((prev) => [
        ...prev,
        { from: lowestRowNodes[0].id, to: newId },
      ]);
    }
  };

  // Node Drag Handler with smooth pointer capture
  const handlePointerDownDrag = (node: StepNode, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const initialNodeX = node.x;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const currentPixelCenter = initialNodeX * containerWidth + deltaX;
      const clampedNormalizedX = clampNodeX(currentPixelCenter, node.w, containerWidth, 32);

      handleUpdateNode(node.id, { x: clampedNormalizedX });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Simulation Runner
  const handleRunSimulation = async () => {
    if (isSimulating || nodes.length === 0) return;
    setIsSimulating(true);

    // Reset status
    setNodes((prev) => prev.map((n) => ({ ...n, status: "idle" })));

    // Find row hierarchy
    const rows = Array.from(new Set(nodes.map((n) => n.row))).sort((a: number, b: number) => a - b);

    for (const row of rows) {
      const rowNodes = nodes.filter((n) => n.row === row);

      // Set active running
      setNodes((prev) =>
        prev.map((n) => (n.row === row ? { ...n, status: "running" } : n))
      );

      await new Promise((resolve) => setTimeout(resolve, 850));

      // Mark success
      setNodes((prev) =>
        prev.map((n) => (n.row === row ? { ...n, status: "success" } : n))
      );

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    setIsSimulating(false);
  };

  const handleResetWorkflow = () => {
    setNodes((prev) => prev.map((n) => ({ ...n, status: "idle" })));
    setIsSimulating(false);
  };

  // Calculate absolute geometry for each row and node
  const ROW_GAP = 96;
  const TOP_PADDING = 48;

  // Group nodes by row
  const rowHeights: Record<number, number> = {};
  nodes.forEach((n) => {
    const h = nodeHeights[n.id] || (n.condition ? 160 : 110);
    rowHeights[n.row] = Math.max(rowHeights[n.row] || 0, h);
  });

  const rowTops: Record<number, number> = {};
  let currentY = TOP_PADDING;
  const sortedRows = Object.keys(rowHeights)
    .map(Number)
    .sort((a, b) => a - b);

  sortedRows.forEach((r) => {
    rowTops[r] = currentY;
    currentY += (rowHeights[r] || 120) + ROW_GAP;
  });

  const totalContentHeight = currentY + 100;

  // Get Node Anchors Map
  const nodeAnchorsMap: Record<string, { top: { x: number; y: number }; bottom: { x: number; y: number } }> = {};
  nodes.forEach((n) => {
    const topY = rowTops[n.row] || TOP_PADDING;
    const h = nodeHeights[n.id] || (n.condition ? 160 : 110);
    const pixelCenterX = n.x * containerWidth;

    nodeAnchorsMap[n.id] = calculateNodeAnchors({
      x: pixelCenterX,
      y: topY,
      w: n.w,
      h,
    });
  });

  // Handle Export
  const handleExport = () => {
    const jsonStr = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowchart-${currentPresetId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col w-full h-full bg-[#070712] overflow-hidden select-none relative ${className}`}>
      {/* Top Toolbar */}
      <FlowchartToolbar
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        onGenerateFromPrompt={handleGenerateFromPrompt}
        onAddNode={handleAddNode}
        onRunSimulation={handleRunSimulation}
        onResetWorkflow={handleResetWorkflow}
        isSimulating={isSimulating}
        onExport={handleExport}
        zoom={zoom}
        onZoomChange={setZoom}
        onResetView={() => {
          setZoom(1.0);
          setPan({ x: 0, y: 0 });
        }}
      />

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full relative overflow-hidden cursor-crosshair"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.12) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onPointerDown={(e) => {
          if (e.button === 1 || e.altKey || (e.target as HTMLElement).tagName === "DIV") {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          }
          setSelectedNodeId(null);
        }}
        onPointerMove={(e) => {
          if (isPanning) {
            setPan({
              x: e.clientX - panStartRef.current.x,
              y: e.clientY - panStartRef.current.y,
            });
          }
        }}
        onPointerUp={() => setIsPanning(false)}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            setZoom((z) => Math.min(1.8, Math.max(0.4, z + delta)));
          }
        }}
      >
        {/* Zoomed & Panned Content Container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top center",
            width: "100%",
            height: totalContentHeight,
            position: "relative",
          }}
        >
          {/* SVG Connector Lines Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ width: "100%", height: totalContentHeight }}
          >
            <defs>
              <linearGradient id="flow-line-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9a5cff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f09a2f" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="flow-line-true" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f09a2f" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="flow-line-false" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f09a2f" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {edges.map((edge, idx) => {
              const fromAnchor = nodeAnchorsMap[edge.from]?.bottom;
              const toAnchor = nodeAnchorsMap[edge.to]?.top;
              if (!fromAnchor || !toAnchor) return null;

              const pathString = generateBezierPath(fromAnchor, toAnchor);
              const isTrueBranch = edge.branch === "true";
              const isFalseBranch = edge.branch === "false";
              const strokeColor = isTrueBranch
                ? "url(#flow-line-true)"
                : isFalseBranch
                ? "url(#flow-line-false)"
                : "url(#flow-line-grad)";

              // Midpoint for label badge
              const midX = (fromAnchor.x + toAnchor.x) / 2;
              const midY = (fromAnchor.y + toAnchor.y) / 2;

              return (
                <g key={`edge-${edge.from}-${edge.to}-${idx}`}>
                  {/* Glowing background path */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={isTrueBranch ? EMERALD : isFalseBranch ? ROSE : PURPLE}
                    strokeWidth={6}
                    strokeOpacity={0.15}
                  />

                  {/* Primary connector line */}
                  <path
                    d={pathString}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    strokeDasharray={isSimulating ? "6 4" : "none"}
                    className={isSimulating ? "animate-[dash_1.5s_linear_infinite]" : ""}
                  />

                  {/* Branch label chip */}
                  {edge.label && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x={-28}
                        y={-10}
                        width={56}
                        height={20}
                        rx={10}
                        fill="#0c0c17"
                        stroke={isTrueBranch ? EMERALD : isFalseBranch ? ROSE : "#9a5cff"}
                        strokeWidth={1}
                        strokeOpacity={0.6}
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        fill={isTrueBranch ? EMERALD : isFalseBranch ? ROSE : "#9a5cff"}
                        fontSize={9}
                        fontFamily="monospace"
                        fontWeight="bold"
                        letterSpacing="0.5px"
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node Cards Layer */}
          {nodes.map((node) => {
            const topY = rowTops[node.row] || TOP_PADDING;
            const pixelCenterX = node.x * containerWidth;
            const leftX = pixelCenterX - node.w / 2;

            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: leftX,
                  top: topY,
                  zIndex: selectedNodeId === node.id ? 30 : 20,
                }}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <FlowNodeCard
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onPointerDownDrag={(e) => handlePointerDownDrag(node, e)}
                  onUpdateNode={(patch) => handleUpdateNode(node.id, patch)}
                  onDeleteNode={nodes.length > 1 ? () => handleDeleteNode(node.id) : undefined}
                  onResize={(height) => handleNodeResize(node.id, height)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas Footer Status */}
      <div className="px-5 py-2 border-t border-white/5 bg-slate-950/80 shrink-0 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest pointer-events-none select-none">
        <span>Nodes: {nodes.length} | Edges: {edges.length}</span>
        <span>Drag cards by grip handle • Measured cubic-bezier connectors</span>
      </div>
    </div>
  );
}
