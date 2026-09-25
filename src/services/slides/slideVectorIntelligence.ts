/**
 * Slide Vector Intelligence Service (Layer 3 - Intelligence & Memory)
 * Bridges MAHR's 128-dimensional Vector Memory Graph with Presentation Deck Synthesis.
 */

import {
  queryVectorMemory,
  formatVectorGroundingPrompt,
  loadVectorGraphFromStorage,
  buildVectorKnowledgeGraph,
  VectorNode
} from "../vectorMemoryEngine";
import { Memory } from "../../lib/memoryTypes";
import { dbGet } from "../../lib/db";

export interface GroundedVectorContext {
  promptGrounding: string;
  matchedNodes: Array<{ node: VectorNode; similarity: number }>;
  hasMemoryGrounding: boolean;
  topic: string;
}

/**
 * Searches local cognitive vector memories for concepts, study notes, or projects
 * that correlate semantically with the target presentation topic.
 */
export async function getVectorGroundingForTopic(topic: string): Promise<GroundedVectorContext> {
  if (!topic || !topic.trim()) {
    return {
      promptGrounding: "",
      matchedNodes: [],
      hasMemoryGrounding: false,
      topic: ""
    };
  }

  try {
    // 1. Retrieve or build the active vector knowledge graph
    let graph = await loadVectorGraphFromStorage();
    if (!graph || graph.nodes.length === 0) {
      const storedMemories = (await dbGet("myraa_memories_v1")) as Memory[] | null;
      const memories: Memory[] = Array.isArray(storedMemories) ? storedMemories : [];
      graph = buildVectorKnowledgeGraph(memories, []);
    }

    // 2. Perform Cosine Similarity query against the 128-dimensional vector space
    const queryResult = queryVectorMemory(topic, graph, 4);

    if (queryResult.topMatches && queryResult.topMatches.length > 0) {
      const promptGrounding = formatVectorGroundingPrompt(queryResult.topMatches);
      return {
        promptGrounding,
        matchedNodes: queryResult.topMatches,
        hasMemoryGrounding: true,
        topic
      };
    }
  } catch (err) {
    console.warn("[SlideVectorIntelligence] Vector retrieval fallback:", err);
  }

  return {
    promptGrounding: "",
    matchedNodes: [],
    hasMemoryGrounding: false,
    topic
  };
}

/**
 * Augments slide generation options with retrieved vector memory context
 */
export function augmentOptionsWithVectorContext(
  userPrompt: string,
  vectorContext: GroundedVectorContext
): string {
  if (!vectorContext.hasMemoryGrounding || !vectorContext.promptGrounding) {
    return userPrompt;
  }

  return `${userPrompt}\n\n${vectorContext.promptGrounding}`;
}
