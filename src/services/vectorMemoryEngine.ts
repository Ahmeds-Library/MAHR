import { Memory } from "../lib/memoryTypes";
import { EntityNode, EntityRelation } from "../components/KnowledgeGraphDashboard";
import { dbGet, dbSet } from "../lib/db";

export interface VectorNode {
  id: string;
  label: string;
  type: "fact" | "person" | "project" | "concept" | "goal" | "technology" | "location" | "preference" | "event" | "note" | "whiteboard" | "flowchart" | "deficit" | "flashcard";
  category?: string;
  description: string;
  source: "transcript_fact" | "extracted_entity" | "study_notes" | "whiteboard_canvas" | "flowchart_diagram" | "knowledge_deficit" | "flashcard_pack";
  embedding: number[]; // 128-dimensional L2-normalized vector
  clusterId: number;
  clusterName: string;
  clusterColor: string;
  importance: number; // 1 to 5
  mentionCount: number;
  tags?: string[];
  projectId?: string;
  dueDate?: string;
  createdAt: string;
  // 2D Canvas Force Simulation coordinates
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null; // pinned coordinates if dragged
  fy?: number | null;
  radius?: number;
}

export interface VectorEdge {
  id: string;
  sourceId: string;
  targetId: string;
  similarity: number; // 0.0 - 1.0 (Cosine similarity)
  relationLabel: string;
  isExplicit?: boolean; // Relation found in transcripts or extracted by AI
}

export interface VectorKnowledgeGraph {
  nodes: VectorNode[];
  edges: VectorEdge[];
  clusters: Array<{ id: number; name: string; color: string; count: number }>;
  lastUpdated: string;
  embeddingDimensions: number;
  density: number;
}

const VECTOR_STORAGE_KEY = "myraa_vector_memory_graph_v1";
const EMBEDDING_DIM = 128;

// Semantic cluster definitions for Myraa's cognitive architecture
export const SEMANTIC_CLUSTERS = [
  { id: 0, name: "Identity & Persona", color: "#38bdf8", baseWords: ["name", "i am", "mirza", "ahmed", "tech", "identity", "student", "user", "who", "myself", "me"] },
  { id: 1, name: "Projects & Engineering", color: "#818cf8", baseWords: ["project", "code", "app", "build", "react", "node", "typescript", "fullstack", "github", "database", "circuit", "simulation", "web"] },
  { id: 2, name: "Concepts & Scientific Learning", color: "#34d399", baseWords: ["concept", "learn", "study", "physics", "math", "algorithm", "theory", "feynman", "chalkboard", "biology", "logic"] },
  { id: 3, name: "Goals, Deadlines & Planning", color: "#fbbf24", baseWords: ["goal", "deadline", "due", "exam", "tomorrow", "schedule", "task", "milestone", "plan", "target", "date"] },
  { id: 4, name: "Preferences & Emotional Resonance", color: "#f472b6", baseWords: ["like", "prefer", "love", "favorite", "hobby", "tone", "pasand", "interest", "habit", "mood", "feeling"] },
];

/**
 * Deterministic hash for string tokens
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Computes a high-dimensional 128-D dense semantic embedding vector
 * using subword hashing, character 3-grams, and semantic cluster projection.
 * L2-normalized so dot product directly equals Cosine Similarity.
 */
export function computeVectorEmbedding(text: string, tags?: string[]): number[] {
  const vec = new Array(EMBEDDING_DIM).fill(0);
  if (!text || !text.trim()) {
    vec[0] = 1;
    return vec;
  }

  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s_-]/g, " ");
  const tokens = cleanText.split(/\s+/).filter(t => t.length > 1);

  // 1. Token unigram hashing into dimensions 0-63
  for (const token of tokens) {
    const h = hashString(token);
    const idx = h % 64;
    vec[idx] += 1.5;

    // Subword character 3-grams for morphological semantic capture
    if (token.length >= 3) {
      for (let i = 0; i <= token.length - 3; i++) {
        const tri = token.substring(i, i + 3);
        const triIdx = (hashString(tri) % 64);
        vec[triIdx] += 0.4;
      }
    }
  }

  // 2. Extra weight for explicit metadata tags
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const h = hashString(tag.toLowerCase());
      const idx = h % 64;
      vec[idx] += 2.0;
    }
  }

  // 3. Semantic cluster keyword projection into dimensions 64-127
  // This gives strong semantic grouping to related concepts (projects with projects, deadlines with deadlines)
  SEMANTIC_CLUSTERS.forEach((cluster, clusterIndex) => {
    const dimStart = 64 + clusterIndex * 12; // 12 dims per cluster
    let matchScore = 0;

    for (const baseWord of cluster.baseWords) {
      if (cleanText.includes(baseWord)) {
        matchScore += 2.0;
      }
      for (const token of tokens) {
        if (token === baseWord || token.startsWith(baseWord)) {
          matchScore += 1.5;
        }
      }
    }

    if (matchScore > 0) {
      for (let offset = 0; offset < 12; offset++) {
        vec[dimStart + offset] += matchScore * (1 - offset * 0.05);
      }
    }
  });

  // 4. L2 Normalization (Unit Vector)
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      vec[i] /= norm;
    }
  } else {
    vec[0] = 1;
  }

  return vec;
}

/**
 * Calculates Cosine Similarity between two L2-normalized vector embeddings.
 * Since both vectors are unit length, cos(theta) = dotProduct(u, v).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  const len = vecA.length;
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
  }
  // Clamp between 0 and 1 for positive semantic affinity
  return Math.max(0, Math.min(1, dot));
}

/**
 * Assigns a node to its best matching semantic cluster based on its vector projection.
 */
function assignSemanticCluster(embedding: number[], text: string): { id: number; name: string; color: string } {
  const lower = text.toLowerCase();
  
  // Rule-based priority check for clear transcript classifications
  if (lower.includes("name is") || lower.includes("call me") || lower.includes("mera naam") || lower.includes("identity")) {
    return SEMANTIC_CLUSTERS[0];
  }
  if (lower.includes("due:") || lower.includes("deadline") || lower.includes("tomorrow") || lower.includes("exam") || lower.includes("schedule")) {
    return SEMANTIC_CLUSTERS[3];
  }
  if (lower.includes("prefer") || lower.includes("favorite") || lower.includes("i like") || lower.includes("hobby") || lower.includes("pasand")) {
    return SEMANTIC_CLUSTERS[4];
  }
  if (lower.includes("project") || lower.includes("building") || lower.includes("code") || lower.includes("app") || lower.includes("repo")) {
    return SEMANTIC_CLUSTERS[1];
  }

  // Vector cluster dimension matching
  let bestCluster = SEMANTIC_CLUSTERS[2]; // Default: Concepts
  let maxClusterVal = -1;

  SEMANTIC_CLUSTERS.forEach((c, idx) => {
    const dimStart = 64 + idx * 12;
    let clusterEnergy = 0;
    for (let o = 0; o < 12; o++) {
      clusterEnergy += embedding[dimStart + o] || 0;
    }
    if (clusterEnergy > maxClusterVal) {
      maxClusterVal = clusterEnergy;
      bestCluster = c;
    }
  });

  return bestCluster;
}

export interface ProjectArtifactsForVector {
  studyPadText?: string;
  whiteboardText?: string;
  whiteboardSlates?: Array<{ id: string; title?: string; content?: string }>;
  flowchartNodes?: Array<{ id: string; label: string; details?: string; type?: string }>;
  knowledgeDeficits?: Array<{ id: string; topic: string; reason?: string }>;
  flashcards?: Array<{ id: string; question: string; answer?: string; topic?: string }>;
}

/**
 * Synthesizes the full Vector Knowledge Graph by uniting:
 * 1. User Memories (Facts extracted from transcripts, identity, goals, deadlines)
 * 2. Extracted Entity Nodes (Projects, technologies, people, concepts)
 * 3. Whole-Project Artifacts (Study notes, chalkboard slates, flowcharts, knowledge deficits)
 * 4. Existing entity relationships
 * Computes vector embeddings and establishes cosine similarity edges.
 */
export function buildVectorKnowledgeGraph(
  memories: Memory[],
  entities: EntityNode[],
  explicitEdges: EntityRelation[] = [],
  similarityThreshold: number = 0.38,
  projectArtifacts?: ProjectArtifactsForVector
): VectorKnowledgeGraph {
  const nodes: VectorNode[] = [];
  const nodeMap = new Map<string, VectorNode>();

  // 1. Process Extracted Entities from conversation
  for (const ent of entities) {
    const desc = ent.description || ent.name;
    const emb = computeVectorEmbedding(`${ent.name} ${desc} ${ent.type}`);
    const cluster = assignSemanticCluster(emb, `${ent.name} ${desc}`);

    const vNode: VectorNode = {
      id: ent.id,
      label: ent.name,
      type: ent.type,
      category: ent.type,
      description: desc,
      source: "extracted_entity",
      embedding: emb,
      clusterId: cluster.id,
      clusterName: cluster.name,
      clusterColor: cluster.color,
      importance: ent.importance || 3,
      mentionCount: ent.mentionCount || 1,
      tags: [ent.type],
      createdAt: ent.lastMentioned || new Date().toISOString(),
      radius: Math.max(14, Math.min(26, 12 + (ent.importance || 3) * 2.5 + (ent.mentionCount || 1) * 0.8))
    };

    nodes.push(vNode);
    nodeMap.set(vNode.id, vNode);
  }

  // 2. Process Memories extracted from dialogue transcripts
  for (const mem of memories) {
    const memId = mem.id || ("mem_" + Math.random().toString(36).substring(2, 9));
    // Avoid exact duplicate node labels
    if (nodeMap.has(memId)) continue;

    const fullText = `${mem.text} ${mem.category} ${mem.projectId || ""} ${mem.dueDate || ""} ${(mem.tags || []).join(" ")}`;
    const emb = computeVectorEmbedding(fullText, mem.tags);
    const cluster = assignSemanticCluster(emb, fullText);

    // Create readable short label from text
    let label = mem.text;
    if (label.startsWith("User identity/name: ")) label = label.replace('User identity/name: "', "").replace('"', "");
    else if (label.startsWith("User active project: ")) label = label.replace('User active project: "', "").replace('"', "");
    else if (label.startsWith("User study goal/topic: ")) label = label.replace('User study goal/topic: "', "").replace('"', "");
    else if (label.startsWith("User preference note: ")) label = label.replace('User preference note: "', "").replace('"', "");

    if (label.length > 36) {
      label = label.substring(0, 34) + "…";
    }

    let nodeType: VectorNode["type"] = "fact";
    if (mem.category === "identity") nodeType = "person";
    else if (mem.category === "project") nodeType = "project";
    else if (mem.category === "goal") nodeType = "goal";
    else if (mem.category === "preference") nodeType = "preference";

    const vNode: VectorNode = {
      id: memId,
      label,
      type: nodeType,
      category: mem.category,
      description: mem.text,
      source: "transcript_fact",
      embedding: emb,
      clusterId: cluster.id,
      clusterName: cluster.name,
      clusterColor: cluster.color,
      importance: mem.category === "identity" ? 5 : mem.category === "project" ? 4 : 3,
      mentionCount: 1,
      tags: mem.tags,
      projectId: mem.projectId,
      dueDate: mem.dueDate,
      createdAt: mem.createdAt || new Date().toISOString(),
      radius: mem.category === "identity" ? 24 : mem.category === "project" ? 22 : 16
    };

    nodes.push(vNode);
    nodeMap.set(vNode.id, vNode);
  }

  // 3. Process Whole-Project Artifacts (Study Pad, Whiteboard, Flowcharts, Deficits)
  if (projectArtifacts) {
    // 3A. Ingest Study Pad Sections
    if (projectArtifacts.studyPadText && projectArtifacts.studyPadText.trim().length > 15) {
      const paragraphs = projectArtifacts.studyPadText
        .split(/\n{2,}|\n(?=[#*-])/)
        .map(p => p.trim())
        .filter(p => p.length >= 25)
        .slice(0, 15);

      paragraphs.forEach((para, idx) => {
        const paraId = `study_note_${idx}`;
        if (!nodeMap.has(paraId)) {
          const firstLine = para.split("\n")[0].replace(/^#+\s*/, "").slice(0, 32);
          const emb = computeVectorEmbedding(para, ["study", "notes", "concept"]);
          const cluster = assignSemanticCluster(emb, para);
          const vNode: VectorNode = {
            id: paraId,
            label: `Note: ${firstLine}`,
            type: "note",
            category: "study_notes",
            description: para.slice(0, 240),
            source: "study_notes",
            embedding: emb,
            clusterId: cluster.id,
            clusterName: cluster.name,
            clusterColor: cluster.color,
            importance: 3,
            mentionCount: 1,
            tags: ["notes", "study"],
            createdAt: new Date().toISOString(),
            radius: 18
          };
          nodes.push(vNode);
          nodeMap.set(vNode.id, vNode);
        }
      });
    }

    // 3B. Ingest Whiteboard Slates
    if (projectArtifacts.whiteboardSlates && projectArtifacts.whiteboardSlates.length > 0) {
      projectArtifacts.whiteboardSlates.forEach((slate, idx) => {
        const slateId = slate.id || `wb_slate_${idx}`;
        if (!nodeMap.has(slateId) && slate.content && slate.content.trim()) {
          const emb = computeVectorEmbedding(slate.content, ["whiteboard", "diagram", "chalkboard"]);
          const cluster = assignSemanticCluster(emb, slate.content);
          const vNode: VectorNode = {
            id: slateId,
            label: slate.title || `Slate: ${slate.content.slice(0, 24)}`,
            type: "whiteboard",
            category: "whiteboard",
            description: slate.content.slice(0, 200),
            source: "whiteboard_canvas",
            embedding: emb,
            clusterId: cluster.id,
            clusterName: cluster.name,
            clusterColor: cluster.color,
            importance: 3,
            mentionCount: 1,
            tags: ["whiteboard", "slate"],
            createdAt: new Date().toISOString(),
            radius: 17
          };
          nodes.push(vNode);
          nodeMap.set(vNode.id, vNode);
        }
      });
    }

    // 3C. Ingest Flowchart & Mind Map Nodes
    if (projectArtifacts.flowchartNodes && projectArtifacts.flowchartNodes.length > 0) {
      projectArtifacts.flowchartNodes.slice(0, 20).forEach((fcNode) => {
        const fcId = `fc_${fcNode.id}`;
        if (!nodeMap.has(fcId)) {
          const fullDesc = `${fcNode.label} ${fcNode.details || ""} ${fcNode.type || ""}`;
          const emb = computeVectorEmbedding(fullDesc, ["flowchart", "process", "mindmap"]);
          const cluster = assignSemanticCluster(emb, fullDesc);
          const vNode: VectorNode = {
            id: fcId,
            label: `Diagram: ${fcNode.label}`,
            type: "flowchart",
            category: "flowchart",
            description: fcNode.details || fcNode.label,
            source: "flowchart_diagram",
            embedding: emb,
            clusterId: cluster.id,
            clusterName: cluster.name,
            clusterColor: cluster.color,
            importance: 3,
            mentionCount: 1,
            tags: ["flowchart", "architecture"],
            createdAt: new Date().toISOString(),
            radius: 16
          };
          nodes.push(vNode);
          nodeMap.set(vNode.id, vNode);
        }
      });
    }

    // 3D. Ingest Knowledge Deficits (Reinforcement Learning Goals)
    if (projectArtifacts.knowledgeDeficits && projectArtifacts.knowledgeDeficits.length > 0) {
      projectArtifacts.knowledgeDeficits.slice(0, 10).forEach((def) => {
        const defId = `def_node_${def.id}`;
        if (!nodeMap.has(defId)) {
          const fullDesc = `${def.topic} ${def.reason || ""}`;
          const emb = computeVectorEmbedding(fullDesc, ["deficit", "learning", "reinforcement"]);
          const cluster = assignSemanticCluster(emb, fullDesc);
          const vNode: VectorNode = {
            id: defId,
            label: `Deficit: ${def.topic.slice(0, 28)}`,
            type: "deficit",
            category: "deficit",
            description: def.reason || def.topic,
            source: "knowledge_deficit",
            embedding: emb,
            clusterId: cluster.id,
            clusterName: cluster.name,
            clusterColor: cluster.color,
            importance: 4,
            mentionCount: 1,
            tags: ["deficit", "learning-goal"],
            createdAt: new Date().toISOString(),
            radius: 17
          };
          nodes.push(vNode);
          nodeMap.set(vNode.id, vNode);
        }
      });
    }
  }

  // 4. Form Semantic Edges via Cosine Similarity & Explicit Relations
  const edges: VectorEdge[] = [];
  const edgeSet = new Set<string>();

  // A. Add explicit edges from AI extraction
  for (const rel of explicitEdges) {
    if (nodeMap.has(rel.sourceId) && nodeMap.has(rel.targetId) && rel.sourceId !== rel.targetId) {
      const srcNode = nodeMap.get(rel.sourceId)!;
      const tgtNode = nodeMap.get(rel.targetId)!;
      const sim = cosineSimilarity(srcNode.embedding, tgtNode.embedding);
      const edgeKey = `${rel.sourceId}---${rel.targetId}`;
      const reverseKey = `${rel.targetId}---${rel.sourceId}`;

      if (!edgeSet.has(edgeKey) && !edgeSet.has(reverseKey)) {
        edges.push({
          id: rel.id || `rel-${Math.random().toString(36).substring(2, 9)}`,
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          similarity: Math.max(sim, 0.75), // Explicit relation is strong
          relationLabel: rel.relation,
          isExplicit: true
        });
        edgeSet.add(edgeKey);
      }
    }
  }

  // B. Pairwise Vector Cosine Similarity graph computation
  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      // Check for explicit project affinity (e.g. Memory mentions #AI-Tutor, Project node is AI-Tutor)
      const isSameProject = Boolean(
        nodeA.projectId && 
        (nodeB.label.toLowerCase().includes(nodeA.projectId.replace("#", "").toLowerCase()) || 
         nodeB.projectId === nodeA.projectId)
      );

      const sim = cosineSimilarity(nodeA.embedding, nodeB.embedding);
      const effectiveSim = isSameProject ? Math.max(sim, 0.85) : sim;

      if (effectiveSim >= similarityThreshold) {
        const edgeKey = `${nodeA.id}---${nodeB.id}`;
        const reverseKey = `${nodeB.id}---${nodeA.id}`;

        if (!edgeSet.has(edgeKey) && !edgeSet.has(reverseKey)) {
          let label = "semantically relates to";
          if (isSameProject) {
            label = "part of project";
          } else if (nodeA.type === "goal" && nodeB.type === "project") {
            label = "targets milestone";
          } else if (nodeA.type === "technology" || nodeB.type === "technology") {
            label = "implements tech";
          } else if (effectiveSim > 0.65) {
            label = "strongly connected";
          }

          edges.push({
            id: `vedge-${nodeA.id}-${nodeB.id}`,
            sourceId: nodeA.id,
            targetId: nodeB.id,
            similarity: Number(effectiveSim.toFixed(3)),
            relationLabel: label,
            isExplicit: false
          });
          edgeSet.add(edgeKey);
        }
      }
    }
  }

  // Calculate cluster stats
  const clusterCounts = new Map<number, number>();
  for (const node of nodes) {
    clusterCounts.set(node.clusterId, (clusterCounts.get(node.clusterId) || 0) + 1);
  }

  const clusters = SEMANTIC_CLUSTERS.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    count: clusterCounts.get(c.id) || 0
  }));

  const maxPossibleEdges = (n * (n - 1)) / 2;
  const density = maxPossibleEdges > 0 ? Number((edges.length / maxPossibleEdges).toFixed(3)) : 0;

  return {
    nodes,
    edges,
    clusters,
    lastUpdated: new Date().toISOString(),
    embeddingDimensions: EMBEDDING_DIM,
    density
  };
}

/**
 * Searches the Vector Knowledge Graph using Cosine Similarity
 * to find the closest semantic nodes and their 1-hop connected neighbors.
 * This empowers Myraa to recall interconnected facts in real time.
 */
export function queryVectorMemory(
  query: string,
  graph: VectorKnowledgeGraph,
  topK: number = 5
): {
  topMatches: Array<{ node: VectorNode; similarity: number }>;
  connectedNeighbors: VectorNode[];
  subgraphEdges: VectorEdge[];
} {
  if (!query || !query.trim() || graph.nodes.length === 0) {
    return { topMatches: [], connectedNeighbors: [], subgraphEdges: [] };
  }

  const queryEmbedding = computeVectorEmbedding(query);

  const scoredNodes = graph.nodes.map(node => ({
    node,
    similarity: cosineSimilarity(queryEmbedding, node.embedding)
  }));

  scoredNodes.sort((a, b) => b.similarity - a.similarity);
  const topMatches = scoredNodes.slice(0, topK);

  const matchedNodeIds = new Set(topMatches.map(m => m.node.id));
  const neighborIds = new Set<string>();
  const subgraphEdges: VectorEdge[] = [];

  for (const edge of graph.edges) {
    if (matchedNodeIds.has(edge.sourceId)) {
      neighborIds.add(edge.targetId);
      subgraphEdges.push(edge);
    } else if (matchedNodeIds.has(edge.targetId)) {
      neighborIds.add(edge.sourceId);
      subgraphEdges.push(edge);
    }
  }

  // Remove nodes that are already in topMatches
  for (const id of matchedNodeIds) {
    neighborIds.delete(id);
  }

  const connectedNeighbors = graph.nodes.filter(n => neighborIds.has(n.id));

  return {
    topMatches,
    connectedNeighbors,
    subgraphEdges
  };
}

/**
 * Caches the vector knowledge graph in IndexedDB for fast retrieval.
 */
export async function saveVectorGraphToStorage(graph: VectorKnowledgeGraph): Promise<void> {
  try {
    // Avoid saving large volatile simulation variables
    const cleanNodes = graph.nodes.map(n => ({
      ...n,
      vx: undefined,
      vy: undefined
    }));
    await dbSet(VECTOR_STORAGE_KEY, { ...graph, nodes: cleanNodes });
  } catch (err) {
    console.error("[VectorMemoryEngine] Failed saving vector graph:", err);
  }
}

/**
 * Loads the cached vector knowledge graph from IndexedDB.
 */
export async function loadVectorGraphFromStorage(): Promise<VectorKnowledgeGraph | null> {
  try {
    const data = await dbGet(VECTOR_STORAGE_KEY);
    return data ? (data as VectorKnowledgeGraph) : null;
  } catch (err) {
    console.error("[VectorMemoryEngine] Failed loading vector graph:", err);
    return null;
  }
}

/**
 * Performs a fast semantic similarity check against existing user memories
 * using 128-D vector embeddings.
 * Returns the closest matching memory if similarity exceeds threshold (default 0.82),
 * allowing Myraa to reinforce or update existing memories rather than creating redundant duplicates.
 */
export function findSemanticallySimilarMemory(
  newFactText: string,
  existingMemories: Memory[],
  threshold: number = 0.82
): { memory: Memory; similarity: number; index: number } | null {
  if (!newFactText || !newFactText.trim() || !existingMemories || existingMemories.length === 0) {
    return null;
  }

  const candidateEmb = computeVectorEmbedding(newFactText);
  let highestSim = -1;
  let bestMatch: Memory | null = null;
  let bestIdx = -1;

  for (let i = 0; i < existingMemories.length; i++) {
    const mem = existingMemories[i];
    const memFullText = `${mem.text} ${mem.category} ${mem.projectId || ""} ${(mem.tags || []).join(" ")}`;
    const memEmb = computeVectorEmbedding(memFullText, mem.tags);
    const sim = cosineSimilarity(candidateEmb, memEmb);

    if (sim > highestSim) {
      highestSim = sim;
      bestMatch = mem;
      bestIdx = i;
    }
  }

  if (highestSim >= threshold && bestMatch) {
    return {
      memory: bestMatch,
      similarity: Number(highestSim.toFixed(3)),
      index: bestIdx
    };
  }

  return null;
}

/**
 * Formats recalled vector memory matches and whole-project artifacts
 * into a compact grounding block to inform Myraa's live cognitive context.
 */
export function formatVectorGroundingPrompt(
  topMatches: Array<{ node: VectorNode; similarity: number }>
): string {
  if (!topMatches || topMatches.length === 0) return "";

  let prompt = "=== RECALLED MEMORIES & VECTOR KNOWLEDGE BASE (PAST INTERACTIONS) ===\n";
  topMatches.forEach((match, idx) => {
    prompt += `${idx + 1}. [${match.node.clusterName} / ${match.node.type}] ${match.node.label}: ${match.node.description} (${Math.round(match.similarity * 100)}% relevance${match.node.projectId ? ` | Project: ${match.node.projectId}` : ""}${match.node.dueDate ? ` | Due: ${match.node.dueDate}` : ""})\n`;
  });
  prompt += "INSTRUCTION: Seamlessly weave these verified memories and past interactions into your response for accurate personalization.\n";
  prompt += "=======================================================================\n";

  return prompt;
}
