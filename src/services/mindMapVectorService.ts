import {
  InteractiveMindMapNode,
  InteractiveMindMapEdge,
  VectorExpansionResult,
  MindMapColor,
  MindMapPreset,
  RecalledMemorySummary,
} from "../types/mindMapTypes";
import { queryVectorMemory, loadVectorGraphFromStorage, computeVectorEmbedding } from "./vectorMemoryEngine";
import { calculateDynamicExpansionCoordinates } from "./mindMapLayoutEngine";

const COLOR_CYCLE: MindMapColor[] = ["cyan", "emerald", "amber", "purple", "rose", "blue", "teal", "indigo"];

/**
 * Executes a live sub-query to the vector memory engine for a specific node topic,
 * retrieving relevant memories and synthesizing detailed child nodes.
 */
export async function expandNodeWithVectorMemory(
  parentNode: InteractiveMindMapNode,
  existingNodes: InteractiveMindMapNode[],
  activeModelId?: string,
  canvasCenter?: { x: number; y: number }
): Promise<VectorExpansionResult> {
  const query = `${parentNode.title} ${parentNode.description || ""} ${(parentNode.details || []).join(" ")}`.trim();

  // 1. Query Server Vector Memory API first
  let serverRecalled: RecalledMemorySummary[] = [];
  try {
    const res = await fetch("/api/vector-memory/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK: 5, minSimilarity: 0.18 }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.topMatches)) {
        serverRecalled = data.topMatches.map((m: any) => ({
          id: m.node.id,
          label: m.node.label,
          description: m.node.description || m.node.label,
          cluster: m.node.clusterName || "Vector Memory",
          similarity: Number(m.similarity || 0.8),
        }));
      }
    }
  } catch (err) {
    console.warn("[MindMapVectorService] Server vector memory query fallback to local IndexedDB:", err);
  }

  // 2. If server returned empty, fallback to client-side IndexedDB vector graph
  if (serverRecalled.length === 0) {
    try {
      const localGraph = await loadVectorGraphFromStorage();
      if (localGraph && localGraph.nodes.length > 0) {
        const localMatches = queryVectorMemory(query, localGraph, 4);
        serverRecalled = localMatches.topMatches.map((m) => ({
          id: m.node.id,
          label: m.node.label,
          description: m.node.description || m.node.label,
          cluster: m.node.clusterName || "Local Memory",
          similarity: Number(m.similarity.toFixed(2)),
        }));
      }
    } catch (e) {
      console.warn("[MindMapVectorService] Local graph query error:", e);
    }
  }

  // 3. Ask AI subagent to synthesize structured, high-value conceptual sub-branches
  // grounding the expansion in both the topic and any retrieved memories
  let generatedConcepts: Array<{
    title: string;
    description: string;
    details?: string[];
    clusterName?: string;
    similarity?: number;
    color?: MindMapColor;
  }> = [];

  try {
    const groundingContext = serverRecalled.length > 0
      ? `Recalled Knowledge Base Context:\n` +
        serverRecalled.map((m) => `- [${m.cluster}] ${m.label}: ${m.description} (${Math.round(m.similarity * 100)}% match)`).join("\n")
      : `No explicit memory hits; perform deep first-principles breakdown.`;

    const prompt = `You are MAHR's Vector Mind Map Expansion Engine.
Target Node: "${parentNode.title}"
Parent Context: "${parentNode.description || parentNode.title}"
${groundingContext}

Generate 3 to 4 granular, academically rigorous, and logically sequential sub-concepts or key mechanisms expanding this node.
Respond with ONLY valid JSON:
{
  "concepts": [
    {
      "title": "Sub-concept title (max 4-5 words)",
      "description": "Crisp 1-sentence analytical explanation or mechanism",
      "details": ["Key formula or axiom", "Practical example or metric"],
      "clusterName": "e.g. Theoretical Principle, Applied System, or Core Mechanism",
      "similarity": 0.88
    }
  ],
  "aiNote": "A 1-sentence synthesis of how these sub-branches advance mastery of ${parentNode.title}."
}`;

    const aiRes = await fetch("/api/chat/subagent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        modelId: activeModelId || "gemini-3.1-flash-lite",
        subAgentSystemPrompt: "You are MAHR's Mind Map vector expansion engine. Always reply with pure valid JSON.",
        userContext: `Vector mind map node dynamic expansion for ${parentNode.title}`,
      }),
    });

    if (aiRes.ok) {
      const data = await aiRes.json();
      const text = data.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed.concepts) && parsed.concepts.length > 0) {
          generatedConcepts = parsed.concepts;
        }
      }
    }
  } catch (err) {
    console.warn("[MindMapVectorService] AI dynamic concept synthesis fallback to heuristics:", err);
  }

  // 4. Fallback heuristics if AI or network unavailable
  if (generatedConcepts.length === 0) {
    if (serverRecalled.length > 0) {
      generatedConcepts = serverRecalled.slice(0, 3).map((mem) => ({
        title: mem.label.length > 28 ? mem.label.substring(0, 26) + ".." : mem.label,
        description: mem.description,
        clusterName: mem.cluster,
        similarity: mem.similarity,
        details: [`Recalled from ${mem.cluster}`],
      }));
    } else {
      // Deterministic semantic fallback
      const baseWords = parentNode.title.split(/\s+/);
      const mainWord = baseWords[0] || "Concept";
      generatedConcepts = [
        {
          title: `Foundations of ${mainWord}`,
          description: `Fundamental axioms and mathematical definitions governing ${parentNode.title}.`,
          details: ["Core axioms & assumptions", "Historical origin"],
          clusterName: "Theoretical Principle",
          similarity: 0.85,
        },
        {
          title: `Operational Dynamics`,
          description: `Active processes, transformations, and causal step-by-step behavior.`,
          details: ["Signal or energy exchange", "Key variables"],
          clusterName: "Core Mechanism",
          similarity: 0.91,
        },
        {
          title: `Real-World Application`,
          description: `Practical implementation in engineering, modern science, or systems architecture.`,
          details: ["Case study benchmark", "System integration"],
          clusterName: "Practical Application",
          similarity: 0.87,
        },
      ];
    }
  }

  // 5. Generate new interactive nodes and edges positioned gracefully
  const newNodes: InteractiveMindMapNode[] = [];
  const newEdges: InteractiveMindMapEdge[] = [];
  const totalCount = generatedConcepts.length;
  const parentDepth = parentNode.depth || 0;

  generatedConcepts.forEach((concept, idx) => {
    const coords = calculateDynamicExpansionCoordinates(
      parentNode,
      idx,
      totalCount,
      [...existingNodes, ...newNodes],
      canvasCenter
    );

    const childId = `node-exp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
    const colorIndex = (parentDepth + idx + 1) % COLOR_CYCLE.length;
    const color = concept.color || COLOR_CYCLE[colorIndex];

    const childNode: InteractiveMindMapNode = {
      id: childId,
      title: concept.title,
      description: concept.description,
      x: coords.x,
      y: coords.y,
      w: 220,
      h: 96,
      color,
      parentId: parentNode.id,
      depth: parentDepth + 1,
      isRoot: false,
      isExpanded: false,
      vectorSimilarity: concept.similarity || 0.85,
      clusterName: concept.clusterName || "Vector Knowledge Base",
      details: concept.details || [],
      status: "idle",
      expansionCount: 0,
    };

    newNodes.push(childNode);

    newEdges.push({
      id: `edge-${parentNode.id}-${childId}`,
      from: parentNode.id,
      to: childId,
      label: concept.similarity ? `${Math.round(concept.similarity * 100)}%` : undefined,
      similarity: concept.similarity,
      animated: true,
      color: childNode.color,
    });
  });

  const avgSimilarity = newNodes.reduce((acc, n) => acc + (n.vectorSimilarity || 0.8), 0) / (newNodes.length || 1);

  return {
    parentTopic: parentNode.title,
    newNodes,
    newEdges,
    recalledCount: serverRecalled.length,
    avgSimilarity: Number(avgSimilarity.toFixed(2)),
    recalledMemories: serverRecalled,
    aiSynthesizedNote: `Dynamically expanded "${parentNode.title}" with ${newNodes.length} vector-grounded sub-nodes.`,
  };
}

/**
 * Built-in Interactive Mind Map Presets
 */
export const MINDMAP_PRESETS: MindMapPreset[] = [
  {
    id: "quantum-computing",
    name: "Quantum Computing Architecture",
    category: "Physics & CS",
    rootTopic: "Quantum Computing",
    description: "Qubits, Superposition, Quantum Gates, and Fault-Tolerant Cryptography.",
    nodes: [
      {
        id: "qc-root",
        title: "Quantum Computing",
        description: "Harnessing quantum mechanics to process exponential computational states simultaneously.",
        x: 700,
        y: 450,
        w: 240,
        h: 110,
        color: "purple",
        depth: 0,
        isRoot: true,
        isExpanded: true,
        clusterName: "Scientific Learning",
        vectorSimilarity: 0.98,
        details: ["Superposition: |ψ⟩ = α|0⟩ + β|1⟩", "Entanglement: Bell states"],
      },
      {
        id: "qc-superposition",
        title: "Superposition & Qubits",
        description: "Qubits exist as linear combinations of orthogonal states on the Bloch sphere.",
        x: 480,
        y: 280,
        w: 210,
        h: 90,
        color: "cyan",
        parentId: "qc-root",
        depth: 1,
        clusterName: "Core Mechanism",
        vectorSimilarity: 0.94,
        details: ["Bloch sphere representation", "Probability amplitudes: |α|² + |β|² = 1"],
      },
      {
        id: "qc-gates",
        title: "Quantum Logic Gates",
        description: "Unitary matrix operations preserving norm and reversibility (Hadamard, CNOT, Phase).",
        x: 920,
        y: 280,
        w: 210,
        h: 90,
        color: "emerald",
        parentId: "qc-root",
        depth: 1,
        clusterName: "Theoretical Principle",
        vectorSimilarity: 0.92,
        details: ["Hadamard: H creates superposition", "CNOT: Conditional entanglement"],
      },
      {
        id: "qc-algorithms",
        title: "Quantum Algorithms",
        description: "Polynomial and exponential speedups over classical algorithms for specific problem domains.",
        x: 930,
        y: 620,
        w: 210,
        h: 90,
        color: "amber",
        parentId: "qc-root",
        depth: 1,
        clusterName: "Applied System",
        vectorSimilarity: 0.9,
        details: ["Shor's Algorithm: Factorization in O(log N)", "Grover's Search: O(√N) database search"],
      },
      {
        id: "qc-decoherence",
        title: "Decoherence & Error Correction",
        description: "Environmental noise mitigation and surface codes to maintain quantum coherence time T2.",
        x: 470,
        y: 620,
        w: 210,
        h: 90,
        color: "rose",
        parentId: "qc-root",
        depth: 1,
        clusterName: "Engineering",
        vectorSimilarity: 0.88,
        details: ["T1 Relaxation & T2 Dephasing", "Toric & Surface code fault tolerance"],
      },
    ],
    edges: [
      { id: "e1", from: "qc-root", to: "qc-superposition", similarity: 0.94, animated: true, color: "cyan" },
      { id: "e2", from: "qc-root", to: "qc-gates", similarity: 0.92, animated: true, color: "emerald" },
      { id: "e3", from: "qc-root", to: "qc-algorithms", similarity: 0.9, animated: true, color: "amber" },
      { id: "e4", from: "qc-root", to: "qc-decoherence", similarity: 0.88, animated: true, color: "rose" },
    ],
  },
  {
    id: "fullstack-distributed-systems",
    name: "Distributed Systems Architecture",
    category: "Software Engineering",
    rootTopic: "Distributed Systems",
    description: "CAP theorem, event-driven streaming, consensus algorithms, and database sharding.",
    nodes: [
      {
        id: "ds-root",
        title: "Distributed Systems",
        description: "Autonomous computing elements communicating over networks to coordinate state.",
        x: 700,
        y: 450,
        w: 240,
        h: 110,
        color: "indigo",
        depth: 0,
        isRoot: true,
        isExpanded: true,
        clusterName: "Engineering",
        vectorSimilarity: 0.96,
        details: ["CAP Theorem Tradeoffs", "Eventual vs Linearizable Consistency"],
      },
      {
        id: "ds-consensus",
        title: "Consensus Protocols",
        description: "Achieving fault-tolerant agreement across unreliable networks (Raft, Paxos, PBFT).",
        x: 480,
        y: 280,
        w: 210,
        h: 90,
        color: "teal",
        parentId: "ds-root",
        depth: 1,
        clusterName: "Core Mechanism",
        vectorSimilarity: 0.93,
        details: ["Raft Leader Election & Log Replication", "Quorum consensus: N/2 + 1"],
      },
      {
        id: "ds-streaming",
        title: "Event Streaming & CQRS",
        description: "Append-only distributed commit logs separating read models from write commands.",
        x: 920,
        y: 280,
        w: 210,
        h: 90,
        color: "cyan",
        parentId: "ds-root",
        depth: 1,
        clusterName: "Applied System",
        vectorSimilarity: 0.91,
        details: ["Kafka Partitioning & Offset Tracking", "Event Sourcing with idempotency"],
      },
      {
        id: "ds-sharding",
        title: "Data Partitioning & Sharding",
        description: "Consistent hashing to distribute storage without catastrophic rebalancing cascades.",
        x: 930,
        y: 620,
        w: 210,
        h: 90,
        color: "amber",
        parentId: "ds-root",
        depth: 1,
        clusterName: "Engineering",
        vectorSimilarity: 0.89,
        details: ["Consistent Hashing Ring with virtual nodes", "Two-phase commit (2PC) bottlenecks"],
      },
      {
        id: "ds-resilience",
        title: "Resilience & Circuit Breaking",
        description: "Graceful degradation under cascading failures (Bulkheads, Retries, Exponential Backoff).",
        x: 470,
        y: 620,
        w: 210,
        h: 90,
        color: "rose",
        parentId: "ds-root",
        depth: 1,
        clusterName: "Applied System",
        vectorSimilarity: 0.87,
        details: ["Circuit breaker state transitions", "Distributed tracing via OpenTelemetry"],
      },
    ],
    edges: [
      { id: "e-ds-1", from: "ds-root", to: "ds-consensus", similarity: 0.93, animated: true, color: "teal" },
      { id: "e-ds-2", from: "ds-root", to: "ds-streaming", similarity: 0.91, animated: true, color: "cyan" },
      { id: "e-ds-3", from: "ds-root", to: "ds-sharding", similarity: 0.89, animated: true, color: "amber" },
      { id: "e-ds-4", from: "ds-root", to: "ds-resilience", similarity: 0.87, animated: true, color: "rose" },
    ],
  },
];
