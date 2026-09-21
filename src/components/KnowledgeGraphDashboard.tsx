import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  Network, 
  X, 
  User, 
  Briefcase, 
  BookOpen, 
  Target, 
  Cpu, 
  MapPin, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  ArrowRight, 
  Bot,
  Zap,
  Info,
  Search,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Share2,
  CheckCircle2,
  Calendar,
  Hash,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Memory } from "../lib/memoryTypes";
import { 
  VectorNode, 
  VectorEdge, 
  VectorKnowledgeGraph, 
  buildVectorKnowledgeGraph, 
  queryVectorMemory,
  cosineSimilarity,
  computeVectorEmbedding,
  SEMANTIC_CLUSTERS 
} from "../services/vectorMemoryEngine";

export interface EntityNode {
  id: string;
  name: string;
  type: "person" | "project" | "concept" | "goal" | "technology" | "location" | "event";
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
}

export const KnowledgeGraphDashboard: React.FC<KnowledgeGraphDashboardProps> = ({
  isOpen,
  onClose,
  themeColor,
  memories = []
}) => {
  // Raw server entity graph
  const [serverGraph, setServerGraph] = useState<KnowledgeGraphData>({ nodes: [], edges: [], lastUpdated: "" });
  const [liveContextPrompts, setLiveContextPrompts] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);

  // Active view mode: "canvas" (Interactive Node-Link Force Graph) or "clusters" (Bento Clusters)
  const [viewMode, setViewMode] = useState<"canvas" | "clusters">("canvas");
  
  // Filtering and vector controls
  const [activeClusterId, setActiveClusterId] = useState<number | "all">("all");
  const [activeNodeType, setActiveNodeType] = useState<string>("all");
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.35);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showPromptsModal, setShowPromptsModal] = useState<boolean>(false);

  // Canvas Viewport Transformation (Pan & Zoom)
  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 });
  const isDraggingCanvas = useRef<boolean>(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNode = useRef<VectorNode | null>(null);

  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Synaptic pulse particles along edges
  const edgeParticles = useRef<Array<{ edgeId: string; progress: number; speed: number }>>([]);

  // Fetch backend entity graph
  const fetchKnowledgeGraph = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/knowledge-graph");
      if (res.ok) {
        const data = await res.json();
        setServerGraph(data.graph || { nodes: [], edges: [], lastUpdated: "" });
        setLiveContextPrompts(data.liveContextPrompts || "");
      }
    } catch (err) {
      console.error("[Knowledge Graph UI] Failed fetching graph:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKnowledgeGraph();
    }
  }, [isOpen]);

  // Re-parse chat history using AI worker
  const handleBuildGraph = async () => {
    setIsBuilding(true);
    try {
      const res = await fetch("/api/knowledge-graph/build", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setServerGraph(data.graph || { nodes: [], edges: [], lastUpdated: "" });
        setLiveContextPrompts(data.liveContextPrompts || "");
      }
    } catch (err) {
      console.error("[Knowledge Graph UI] Build error:", err);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDeleteEntity = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge-graph/entity/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setServerGraph(data.graph || { nodes: [], edges: [], lastUpdated: "" });
        if (selectedNodeId === id) setSelectedNodeId(null);
      }
    } catch (err) {
      console.error("[Knowledge Graph UI] Delete error:", err);
    }
  };

  // Synthesize Unified Vector Knowledge Graph (Memories from transcripts + Extracted Entities)
  const vectorGraph: VectorKnowledgeGraph = useMemo(() => {
    return buildVectorKnowledgeGraph(
      memories,
      serverGraph.nodes,
      serverGraph.edges,
      similarityThreshold
    );
  }, [memories, serverGraph, similarityThreshold]);

  // Query search similarity scores
  const queryResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return queryVectorMemory(searchQuery, vectorGraph, 10);
  }, [searchQuery, vectorGraph]);

  const searchScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    if (queryResults) {
      queryResults.topMatches.forEach(m => map.set(m.node.id, m.similarity));
    }
    return map;
  }, [queryResults]);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return vectorGraph.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, vectorGraph.nodes]);

  // Connected edges and neighbor nodes for selected or hovered node
  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedEdgeSet = useMemo(() => {
    const set = new Set<string>();
    if (!activeFocusId) return set;
    for (const edge of vectorGraph.edges) {
      if (edge.sourceId === activeFocusId || edge.targetId === activeFocusId) {
        set.add(edge.id);
      }
    }
    return set;
  }, [activeFocusId, vectorGraph.edges]);

  const connectedNeighborIds = useMemo(() => {
    const set = new Set<string>();
    if (!activeFocusId) return set;
    set.add(activeFocusId);
    for (const edge of vectorGraph.edges) {
      if (edge.sourceId === activeFocusId) set.add(edge.targetId);
      if (edge.targetId === activeFocusId) set.add(edge.sourceId);
    }
    return set;
  }, [activeFocusId, vectorGraph.edges]);

  // Initialize node physics coordinates in circular / clustered constellation
  useEffect(() => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;
    const height = canvas ? canvas.height : 600;
    const cx = width / 2;
    const cy = height / 2;

    vectorGraph.nodes.forEach((node, i) => {
      if (node.x === undefined || node.y === undefined) {
        // Position by cluster angle offset
        const clusterAngle = (node.clusterId / SEMANTIC_CLUSTERS.length) * Math.PI * 2;
        const radius = 120 + (i % 5) * 45;
        const jitter = (Math.random() - 0.5) * 60;
        node.x = cx + Math.cos(clusterAngle) * radius + jitter;
        node.y = cy + Math.sin(clusterAngle) * radius + jitter;
        node.vx = (Math.random() - 0.5) * 1.5;
        node.vy = (Math.random() - 0.5) * 1.5;
      }
    });

    // Seed pulse particles
    edgeParticles.current = vectorGraph.edges.map(e => ({
      edgeId: e.id,
      progress: Math.random(),
      speed: 0.004 + (e.similarity * 0.008)
    }));
  }, [vectorGraph]);

  // Canvas Physics Simulation & Rendering Loop
  useEffect(() => {
    if (viewMode !== "canvas") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // 1. Force Simulation Step (Euler Integration)
      const nodes = vectorGraph.nodes;
      const edges = vectorGraph.edges;
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // Repulsive force between all nodes (Coulomb's law)
      const kRep = 1400;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const na = nodes[i];
          const nb = nodes[j];
          if (!na.x || !na.y || !nb.x || !nb.y) continue;

          let dx = nb.x - na.x;
          let dy = nb.y - na.y;
          let distSq = dx * dx + dy * dy;
          if (distSq < 1) distSq = 1;
          const dist = Math.sqrt(distSq);

          if (dist < 380) {
            const force = (kRep / distSq);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (na.fx === null || na.fx === undefined) {
              na.vx = (na.vx || 0) - fx;
              na.vy = (na.vy || 0) - fy;
            }
            if (nb.fx === null || nb.fx === undefined) {
              nb.vx = (nb.vx || 0) + fx;
              nb.vy = (nb.vy || 0) + fy;
            }
          }
        }
      }

      // Attractive spring force along semantic edges (Hooke's law)
      for (const edge of edges) {
        const na = nodeMap.get(edge.sourceId);
        const nb = nodeMap.get(edge.targetId);
        if (!na || !nb || !na.x || !na.y || !nb.x || !nb.y) continue;

        const dx = nb.x - na.x;
        const dy = nb.y - na.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Target distance is inversely proportional to cosine similarity
        const targetDist = 90 + (1 - edge.similarity) * 110;
        const springForce = (dist - targetDist) * (0.02 + edge.similarity * 0.03);

        const fx = (dx / dist) * springForce;
        const fy = (dy / dist) * springForce;

        if (na.fx === null || na.fx === undefined) {
          na.vx = (na.vx || 0) + fx;
          na.vy = (na.vy || 0) + fy;
        }
        if (nb.fx === null || nb.fx === undefined) {
          nb.vx = (nb.vx || 0) - fx;
          nb.vy = (nb.vy || 0) - fy;
        }
      }

      // Centering gravity pull and velocity damping
      const damping = 0.88;
      const gravity = 0.008;

      for (const node of nodes) {
        if (node.fx !== null && node.fx !== undefined && node.fy !== null && node.fy !== undefined) {
          node.x = node.fx;
          node.y = node.fy;
          node.vx = 0;
          node.vy = 0;
          continue;
        }

        if (node.x === undefined || node.y === undefined) continue;

        // Gravity to center
        node.vx = ((node.vx || 0) + (cx - node.x) * gravity) * damping;
        node.vy = ((node.vy || 0) + (cy - node.y) * gravity) * damping;

        node.x += node.vx;
        node.y += node.vy;
      }

      // 2. Render Frame
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Apply viewport transformation (Zoom & Pan)
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Background Subtle Cluster Halo Glows
      SEMANTIC_CLUSTERS.forEach(cluster => {
        const clusterNodes = nodes.filter(n => n.clusterId === cluster.id && n.x !== undefined && n.y !== undefined);
        if (clusterNodes.length > 0) {
          let avgX = 0;
          let avgY = 0;
          clusterNodes.forEach(n => { avgX += n.x!; avgY += n.y!; });
          avgX /= clusterNodes.length;
          avgY /= clusterNodes.length;

          const grad = ctx.createRadialGradient(avgX, avgY, 10, avgX, avgY, 160);
          grad.addColorStop(0, `${cluster.color}15`);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(avgX, avgY, 160, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Edges (Synaptic Semantic Links)
      for (const edge of edges) {
        const na = nodeMap.get(edge.sourceId);
        const nb = nodeMap.get(edge.targetId);
        if (!na || !nb || !na.x || !na.y || !nb.x || !nb.y) continue;

        const isHighlighted = connectedEdgeSet.has(edge.id);
        const hasActiveFocus = Boolean(activeFocusId);
        const isDimmed = hasActiveFocus && !isHighlighted;

        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);

        if (isHighlighted) {
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#c084fc";
          ctx.shadowBlur = 8;
        } else if (isDimmed) {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 0;
        } else {
          // Opacity scaled by Cosine similarity
          const alpha = Math.max(0.12, Math.min(0.7, edge.similarity * 0.75));
          ctx.strokeStyle = edge.isExplicit ? `rgba(99, 102, 241, ${alpha + 0.15})` : `rgba(148, 163, 184, ${alpha})`;
          ctx.lineWidth = 1 + edge.similarity * 1.5;
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Edge label if hovered or selected
        if (isHighlighted) {
          const midX = (na.x + nb.x) / 2;
          const midY = (na.y + nb.y) / 2;
          ctx.font = "10px monospace";
          ctx.fillStyle = "#e2e8f0";
          const labelText = `${edge.relationLabel} (${Math.round(edge.similarity * 100)}%)`;
          const textMetrics = ctx.measureText(labelText);
          
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.fillRect(midX - textMetrics.width / 2 - 4, midY - 8, textMetrics.width + 8, 16);
          ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
          ctx.lineWidth = 1;
          ctx.strokeRect(midX - textMetrics.width / 2 - 4, midY - 8, textMetrics.width + 8, 16);

          ctx.fillStyle = "#c084fc";
          ctx.fillText(labelText, midX - textMetrics.width / 2, midY + 4);
        }
      }

      // Draw Synaptic Pulse Particles along edges
      for (const p of edgeParticles.current) {
        const edge = edges.find(e => e.id === p.edgeId);
        if (!edge) continue;
        const na = nodeMap.get(edge.sourceId);
        const nb = nodeMap.get(edge.targetId);
        if (!na || !nb || !na.x || !na.y || !nb.x || !nb.y) continue;

        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const px = na.x + (nb.x - na.x) * p.progress;
        const py = na.y + (nb.y - na.y) * p.progress;

        const isEdgeLit = connectedEdgeSet.has(edge.id);
        ctx.beginPath();
        ctx.arc(px, py, isEdgeLit ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isEdgeLit ? "#f43f5e" : "#818cf8";
        ctx.fill();
      }

      // Draw Nodes
      for (const node of nodes) {
        if (node.x === undefined || node.y === undefined) continue;

        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isNeighbor = connectedNeighborIds.has(node.id);
        const hasActiveFocus = Boolean(activeFocusId);
        const isDimmed = hasActiveFocus && !isNeighbor;

        const searchScore = searchScoreMap.get(node.id);
        const isSearchMatch = searchScore !== undefined && searchScore > 0.3;

        const radius = (node.radius || 18) * (isSelected ? 1.25 : isHovered ? 1.15 : 1.0);

        // Search Match Radar Ring
        if (isSearchMatch) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.5 + Math.sin(Date.now() * 0.006) * 0.4})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Selection / Hover Outer Halo
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? "#38bdf8" : "#818cf8";
          ctx.lineWidth = 2;
          ctx.shadowColor = isSelected ? "#38bdf8" : "#818cf8";
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Main Node Body Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

        if (isDimmed) {
          ctx.fillStyle = "rgba(30, 41, 59, 0.4)";
          ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
        } else {
          ctx.fillStyle = node.source === "transcript_fact" ? "#0f172a" : "#1e1b4b";
          ctx.strokeStyle = node.clusterColor;
        }

        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fill();
        ctx.stroke();

        // Node Inner Core Dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = isDimmed ? "#475569" : node.clusterColor;
        ctx.fill();

        // Node Text Label
        ctx.font = isSelected ? "bold 12px sans-serif" : "11px sans-serif";
        ctx.fillStyle = isDimmed ? "#64748b" : isSelected ? "#ffffff" : "#e2e8f0";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textY = node.y + radius + 13;
        ctx.fillText(node.label, node.x, textY);

        // Subtext / Match Badge
        if (isSearchMatch) {
          ctx.font = "9px monospace";
          ctx.fillStyle = "#fbbf24";
          ctx.fillText(`${Math.round(searchScore * 100)}% match`, node.x, textY + 12);
        } else if (node.source === "transcript_fact") {
          ctx.font = "8px monospace";
          ctx.fillStyle = isDimmed ? "#475569" : "#94a3b8";
          ctx.fillText(node.category?.toUpperCase() || "FACT", node.x, textY + 11);
        }
      }

      ctx.restore();
      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [viewMode, vectorGraph, transform, selectedNodeId, hoveredNodeId, connectedEdgeSet, connectedNeighborIds, searchScoreMap, activeFocusId]);

  // Handle Canvas Mouse & Touch Interactions (Drag Node, Pan Canvas, Zoom)
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    // Un-transform back to world coordinates
    const worldX = (screenX - transform.x) / transform.k;
    const worldY = (screenY - transform.y) / transform.k;
    return { worldX, worldY, screenX, screenY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY, screenX, screenY } = getCanvasMousePos(e);
    
    // Check if clicked on a node
    let clickedNode: VectorNode | null = null;
    for (const node of vectorGraph.nodes) {
      if (node.x !== undefined && node.y !== undefined) {
        const dx = worldX - node.x;
        const dy = worldY - node.y;
        const radius = (node.radius || 18) + 4;
        if (dx * dx + dy * dy <= radius * radius) {
          clickedNode = node;
          break;
        }
      }
    }

    if (clickedNode) {
      draggedNode.current = clickedNode;
      clickedNode.fx = clickedNode.x;
      clickedNode.fy = clickedNode.y;
      setSelectedNodeId(clickedNode.id);
    } else {
      isDraggingCanvas.current = true;
      dragStartPos.current = { x: screenX - transform.x, y: screenY - transform.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY, screenX, screenY } = getCanvasMousePos(e);

    if (draggedNode.current) {
      draggedNode.current.fx = worldX;
      draggedNode.current.fy = worldY;
      return;
    }

    if (isDraggingCanvas.current) {
      setTransform(prev => ({
        ...prev,
        x: screenX - dragStartPos.current.x,
        y: screenY - dragStartPos.current.y
      }));
      return;
    }

    // Hover detection
    let hovered: VectorNode | null = null;
    for (const node of vectorGraph.nodes) {
      if (node.x !== undefined && node.y !== undefined) {
        const dx = worldX - node.x;
        const dy = worldY - node.y;
        const radius = (node.radius || 18) + 4;
        if (dx * dx + dy * dy <= radius * radius) {
          hovered = node;
          break;
        }
      }
    }
    setHoveredNodeId(hovered ? hovered.id : null);
  };

  const handleMouseUp = () => {
    if (draggedNode.current) {
      // Unpin node so it resumes organic force movement
      draggedNode.current.fx = null;
      draggedNode.current.fy = null;
      draggedNode.current = null;
    }
    isDraggingCanvas.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newK = Math.max(0.3, Math.min(3.0, transform.k * zoomFactor));
    setTransform(prev => ({ ...prev, k: newK }));
  };

  const handleResetZoom = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  // Resize canvas according to container dimensions
  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isOpen, viewMode]);

  // Filtered nodes for cluster bento view
  const filteredBentoNodes = useMemo(() => {
    return vectorGraph.nodes.filter(n => {
      if (activeClusterId !== "all" && n.clusterId !== activeClusterId) return false;
      if (activeNodeType !== "all" && n.type !== activeNodeType) return false;
      return true;
    });
  }, [vectorGraph.nodes, activeClusterId, activeNodeType]);

  // Connected neighbors for inspection panel
  const selectedNodeNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    const neighbors: Array<{ node: VectorNode; similarity: number; label: string }> = [];
    for (const edge of vectorGraph.edges) {
      if (edge.sourceId === selectedNode.id) {
        const tgt = vectorGraph.nodes.find(n => n.id === edge.targetId);
        if (tgt) neighbors.push({ node: tgt, similarity: edge.similarity, label: edge.relationLabel });
      } else if (edge.targetId === selectedNode.id) {
        const src = vectorGraph.nodes.find(n => n.id === edge.sourceId);
        if (src) neighbors.push({ node: src, similarity: edge.similarity, label: edge.relationLabel });
      }
    }
    return neighbors.sort((a, b) => b.similarity - a.similarity);
  }, [selectedNode, vectorGraph]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 z-[100] backdrop-blur-md"
          />

          {/* Main Visual Exploration Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="fixed inset-2 sm:inset-6 md:inset-8 z-[101] flex flex-col rounded-3xl border border-indigo-500/20 bg-slate-900/95 shadow-[0_0_80px_-15px_rgba(99,102,241,0.4)] backdrop-blur-2xl overflow-hidden text-white max-w-7xl mx-auto"
          >
            {/* Header: Title, Real-time Metrics, and Controls */}
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60 gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-inner">
                  <Network size={22} className="animate-pulse text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-white tracking-wide">
                      MAHR Cognitive Vector Memory Network
                    </h2>
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-semibold text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      128-D Vector Embeddings Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Interactive node-link neural topology linking dialogue transcripts, learned facts, and semantic entities
                  </p>
                </div>
              </div>

              {/* Top Action Bar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex items-center p-0.5 rounded-xl bg-slate-800/80 border border-white/10">
                  <button
                    onClick={() => setViewMode("canvas")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      viewMode === "canvas" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Share2 size={13} />
                    Neural Canvas
                  </button>
                  <button
                    onClick={() => setViewMode("clusters")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      viewMode === "clusters" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers size={13} />
                    Vector Clusters
                  </button>
                </div>

                {/* AI Worker Re-parse */}
                <button
                  onClick={handleBuildGraph}
                  disabled={isBuilding}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-300 transition disabled:opacity-50"
                  title="Run background AI worker to parse dialogue transcripts and synthesize new semantic nodes"
                >
                  <RefreshCw size={13} className={isBuilding ? "animate-spin" : ""} />
                  {isBuilding ? "Synthesizing..." : "Re-synthesize"}
                </button>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-slate-400 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Neural Context & Vector Search Bar */}
            <div className="px-6 py-2.5 border-b border-white/5 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              {/* Live Vector Search */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Semantic Vector Query (e.g. 'React', 'deadline', 'AI Tutor')..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Cosine Similarity Threshold Slider */}
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5">
                <Sliders size={13} className="text-indigo-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-mono">
                  Similarity Threshold: <strong className="text-indigo-300">{similarityThreshold.toFixed(2)}</strong>
                </span>
                <input
                  type="range"
                  min="0.20"
                  max="0.80"
                  step="0.02"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  className="w-24 h-1.5 accent-indigo-500 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Topology Stats */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Hash size={12} className="text-cyan-400" /> {vectorGraph.nodes.length} Nodes
                </span>
                <span className="flex items-center gap-1">
                  <Share2 size={12} className="text-purple-400" /> {vectorGraph.edges.length} Semantic Edges
                </span>
                <button
                  onClick={() => setShowPromptsModal(!showPromptsModal)}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline font-semibold"
                >
                  <Info size={12} /> MAHR Context Injection
                </button>
              </div>
            </div>

            {/* Semantic Cluster Filter Pills */}
            <div className="flex items-center gap-1.5 px-6 py-2 border-b border-white/5 bg-slate-950/20 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveClusterId("all")}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                  activeClusterId === "all"
                    ? "bg-indigo-600/30 border border-indigo-400/50 text-white font-semibold"
                    : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                All Clusters ({vectorGraph.nodes.length})
              </button>
              {SEMANTIC_CLUSTERS.map(c => {
                const count = vectorGraph.nodes.filter(n => n.clusterId === c.id).length;
                const isActive = activeClusterId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveClusterId(isActive ? "all" : c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? "border font-semibold text-white shadow-sm"
                        : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                    }`}
                    style={{
                      borderColor: isActive ? c.color : "rgba(255,255,255,0.06)",
                      backgroundColor: isActive ? `${c.color}25` : undefined
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Main Stage: Canvas or Cluster Bento Grid */}
            <div className="flex-1 relative overflow-hidden flex">
              {viewMode === "canvas" ? (
                <div className="relative w-full h-full bg-radial from-slate-900 via-slate-950 to-slate-950 select-none">
                  {/* The Physics Canvas */}
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                    className="w-full h-full block cursor-grab active:cursor-grabbing"
                  />

                  {/* Canvas Floating Controls */}
                  <div className="absolute bottom-5 left-5 flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-lg text-slate-300">
                    <button
                      onClick={() => setTransform(prev => ({ ...prev, k: Math.min(2.5, prev.k * 1.2) }))}
                      className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
                      title="Zoom In"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      onClick={() => setTransform(prev => ({ ...prev, k: Math.max(0.4, prev.k * 0.8) }))}
                      className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
                      title="Fit to Center"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>

                  {/* Canvas Legend */}
                  <div className="absolute top-4 left-5 pointer-events-none bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-3 text-[11px] text-slate-300 space-y-1.5 shadow-lg">
                    <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                      <Activity size={13} className="text-indigo-400" />
                      Synaptic Flow Legend
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border-2 border-indigo-400" />
                      <span>Extracted Entity Node</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-cyan-400" />
                      <span>Transcript Fact / Memory</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-400" />
                      <span>Cosine Synapse (Pulses)</span>
                    </div>
                  </div>

                  {/* Empty state overlay if no nodes */}
                  {vectorGraph.nodes.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <Network size={44} className="text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-300">Memory Graph is currently empty</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                        Start chatting or click "Re-synthesize" to extract facts and build the vector node network.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Cluster Bento Grid View */
                <div className="w-full h-full overflow-y-auto p-6 space-y-6 bg-slate-950/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBentoNodes.map(node => {
                      const isSelected = selectedNodeId === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-400"
                              : "bg-slate-900/60 hover:bg-slate-800/70 border-white/5 hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: node.clusterColor }}
                              />
                              <h4 className="text-sm font-bold text-white line-clamp-1">{node.label}</h4>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">
                              {node.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                            {node.description}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
                            <span>Cluster: {node.clusterName}</span>
                            <span className="text-indigo-400 font-semibold">{node.source === "transcript_fact" ? "Transcript Fact" : "Entity"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Node Details Inspection Drawer (Slide-Over from Right) */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ x: 340, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 340, opacity: 0 }}
                    className="w-80 md:w-96 border-l border-white/10 bg-slate-950/90 backdrop-blur-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 shrink-0"
                  >
                    <div className="space-y-4">
                      {/* Close Drawer Button */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: selectedNode.clusterColor }}
                          />
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                            {selectedNode.type} Node
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedNodeId(null)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-bold text-white leading-snug">{selectedNode.label}</h3>
                        <p className="text-xs text-slate-300 mt-2 bg-slate-900/80 p-3 rounded-xl border border-white/5 leading-relaxed">
                          {selectedNode.description}
                        </p>
                      </div>

                      {/* Metadata Chips */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 font-mono text-[11px]">
                          <span className="text-slate-400">Semantic Cluster:</span>
                          <span className="font-semibold" style={{ color: selectedNode.clusterColor }}>
                            {selectedNode.clusterName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 font-mono text-[11px]">
                          <span className="text-slate-400">Information Source:</span>
                          <span className="text-slate-200">
                            {selectedNode.source === "transcript_fact" ? "Extracted Transcript Fact" : "AI Extracted Entity"}
                          </span>
                        </div>

                        {selectedNode.projectId && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-mono text-[11px]">
                            <span className="text-indigo-300">Project Tag:</span>
                            <span className="font-bold text-indigo-200">{selectedNode.projectId}</span>
                          </div>
                        )}

                        {selectedNode.dueDate && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 font-mono text-[11px]">
                            <span className="text-amber-300 flex items-center gap-1">
                              <Calendar size={12} /> Target Deadline:
                            </span>
                            <span className="font-bold text-amber-200">{selectedNode.dueDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Connected Synaptic Links (Cosine Neighbors) */}
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Share2 size={13} className="text-indigo-400" />
                          Connected Synapses ({selectedNodeNeighbors.length})
                        </h4>

                        {selectedNodeNeighbors.length === 0 ? (
                          <p className="text-xs text-slate-500 italic p-3 bg-white/5 rounded-xl text-center">
                            Isolated node below similarity threshold. Try lowering the threshold slider.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {selectedNodeNeighbors.map(({ node, similarity, label }) => (
                              <button
                                key={node.id}
                                onClick={() => setSelectedNodeId(node.id)}
                                className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/40 transition flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: node.clusterColor }}
                                  />
                                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                                    {node.label}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold shrink-0">
                                  {Math.round(similarity * 100)}%
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-white/10 mt-4 flex items-center gap-2">
                      {selectedNode.source === "extracted_entity" && (
                        <button
                          onClick={() => handleDeleteEntity(selectedNode.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                        >
                          <Trash2 size={13} />
                          Prune Node
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* System Prompt Injection Modal */}
            <AnimatePresence>
              {showPromptsModal && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-4 sm:inset-12 z-20 rounded-2xl bg-slate-950/95 border border-indigo-500/40 p-6 flex flex-col shadow-2xl backdrop-blur-3xl overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                      <Bot size={18} />
                      Live Vector Memory Context Injected into MAHR
                    </div>
                    <button
                      onClick={() => setShowPromptsModal(false)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto mt-4 font-mono text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                    {liveContextPrompts || (
                      "No knowledge graph context currently injected. Extract entities to see structured background prompt."
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
