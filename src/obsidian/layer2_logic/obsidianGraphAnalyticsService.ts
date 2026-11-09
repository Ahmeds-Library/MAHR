import {
  ObsidianGraphNode,
  ObsidianGraphEdge,
  ObsidianNoteFile,
  ObsidianShortestPathResult,
} from "../layer1_data/obsidianTypes";
import {
  computeVectorEmbedding,
  cosineSimilarity,
} from "../../services/vectorMemoryEngine";

/**
 * Breadth-First Search (BFS) Shortest-Path Connection Finder between any two nodes
 * in the Knowledge Graph.
 */
export function findShortestGraphPath(
  sourceId: string,
  targetId: string,
  nodes: ObsidianGraphNode[],
  edges: ObsidianGraphEdge[]
): ObsidianShortestPathResult {
  if (!sourceId || !targetId || sourceId === targetId) {
    return { found: false, nodeIds: [], edgeIds: [], titles: [] };
  }

  // Build adjacency list
  const adj = new Map<string, Array<{ neighborId: string; edgeId: string }>>();
  for (const n of nodes) {
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (!adj.has(e.sourceId)) adj.set(e.sourceId, []);
    if (!adj.has(e.targetId)) adj.set(e.targetId, []);
    adj.get(e.sourceId)!.push({ neighborId: e.targetId, edgeId: e.id });
    adj.get(e.targetId)!.push({ neighborId: e.sourceId, edgeId: e.id });
  }

  // Prefer paths that don't trivially route through the global MOC index unless necessary
  const runBfs = (ignoreMocIntermediate: boolean): ObsidianShortestPathResult => {
    const queue: string[] = [sourceId];
    const visited = new Set<string>([sourceId]);
    const parentMap = new Map<
      string,
      { prevNodeId: string; viaEdgeId: string }
    >();

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === targetId) {
        const pathNodes: string[] = [];
        const pathEdges: string[] = [];
        let step: string | undefined = targetId;
        while (step) {
          pathNodes.unshift(step);
          const p = parentMap.get(step);
          if (p) {
            pathEdges.unshift(p.viaEdgeId);
            step = p.prevNodeId;
          } else {
            step = undefined;
          }
        }
        const titles = pathNodes.map(
          (id) => nodes.find((n) => n.id === id)?.title || id
        );
        return {
          found: true,
          nodeIds: pathNodes,
          edgeIds: pathEdges,
          titles,
        };
      }

      const neighbors = adj.get(curr) || [];
      for (const { neighborId, edgeId } of neighbors) {
        if (visited.has(neighborId)) continue;
        if (
          ignoreMocIntermediate &&
          neighborId === "obs_master_moc" &&
          neighborId !== targetId
        ) {
          continue;
        }
        visited.add(neighborId);
        parentMap.set(neighborId, { prevNodeId: curr, viaEdgeId: edgeId });
        queue.push(neighborId);
      }
    }

    return { found: false, nodeIds: [], edgeIds: [], titles: [] };
  };

  // First try direct semantic/wikilink path without using master MOC hub as shortcut
  const directResult = runBfs(true);
  if (directResult.found) return directResult;

  // Fallback to full graph including MOC hub
  return runBfs(false);
}

/**
 * Filters the Knowledge Graph to a 1-Hop or 2-Hop Ego Network around the selected node.
 */
export function filterGraphByHopDistance(
  centerNodeId: string | undefined,
  hopFilter: "all" | "1hop" | "2hop",
  nodes: ObsidianGraphNode[],
  edges: ObsidianGraphEdge[]
): {
  visibleNodeIds: Set<string>;
  visibleEdgeIds: Set<string>;
} {
  if (hopFilter === "all" || !centerNodeId) {
    return {
      visibleNodeIds: new Set(nodes.map((n) => n.id)),
      visibleEdgeIds: new Set(edges.map((e) => e.id)),
    };
  }

  const maxHops = hopFilter === "1hop" ? 1 : 2;
  const visited = new Set<string>([centerNodeId]);
  let frontier = new Set<string>([centerNodeId]);

  for (let hop = 1; hop <= maxHops; hop++) {
    const nextFrontier = new Set<string>();
    for (const edge of edges) {
      if (frontier.has(edge.sourceId) && !visited.has(edge.targetId)) {
        visited.add(edge.targetId);
        nextFrontier.add(edge.targetId);
      } else if (frontier.has(edge.targetId) && !visited.has(edge.sourceId)) {
        visited.add(edge.sourceId);
        nextFrontier.add(edge.sourceId);
      }
    }
    frontier = nextFrontier;
  }

  const visibleEdgeIds = new Set<string>();
  for (const edge of edges) {
    if (visited.has(edge.sourceId) && visited.has(edge.targetId)) {
      visibleEdgeIds.add(edge.id);
    }
  }

  return {
    visibleNodeIds: visited,
    visibleEdgeIds,
  };
}

/**
 * AI Semantic Auto-Linker:
 * Scans all notes for latent semantic connections (128-D embeddings + shared concept tokens)
 * and creates new bidirectional [[Wikilinks]] + Knowledge Graph edges.
 */
export function discoverSemanticAutoLinks(
  notes: ObsidianNoteFile[],
  existingEdges: ObsidianGraphEdge[],
  similarityThreshold = 0.26
): {
  newEdges: ObsidianGraphEdge[];
  updatedNotes: ObsidianNoteFile[];
  addedLinksCount: number;
} {
  const existingEdgePairs = new Set<string>();
  for (const e of existingEdges) {
    existingEdgePairs.add(`${e.sourceId}::${e.targetId}`);
    existingEdgePairs.add(`${e.targetId}::${e.sourceId}`);
  }

  const embeddings = notes.map((n) =>
    computeVectorEmbedding(`${n.title} ${n.markdownBody}`, n.tags)
  );

  const clonedNotes = notes.map((n) => ({
    ...n,
    wikiLinks: [...n.wikiLinks],
    backlinks: [...n.backlinks],
  }));

  const newEdges: ObsidianGraphEdge[] = [];
  let addedLinksCount = 0;

  for (let i = 0; i < clonedNotes.length; i++) {
    for (let j = i + 1; j < clonedNotes.length; j++) {
      const noteA = clonedNotes[i];
      const noteB = clonedNotes[j];
      if (noteA.id === "obs_master_moc" || noteB.id === "obs_master_moc") {
        continue;
      }

      const pairKey = `${noteA.id}::${noteB.id}`;
      if (existingEdgePairs.has(pairKey)) continue;

      const sim = cosineSimilarity(embeddings[i], embeddings[j]);
      if (sim >= similarityThreshold) {
        existingEdgePairs.add(pairKey);
        if (!noteA.wikiLinks.includes(noteB.title)) {
          noteA.wikiLinks.push(noteB.title);
        }
        if (!noteB.backlinks.includes(noteA.title)) {
          noteB.backlinks.push(noteA.title);
        }
        newEdges.push({
          id: `ai_edge_${noteA.id}_${noteB.id}`,
          sourceId: noteA.id,
          targetId: noteB.id,
          label: `Semantic (${Math.round(sim * 100)}%)`,
          isExplicitWikiLink: false,
          similarity: Number(sim.toFixed(2)),
        });
        addedLinksCount += 1;
      }
    }
  }

  return {
    newEdges,
    updatedNotes: clonedNotes,
    addedLinksCount,
  };
}
