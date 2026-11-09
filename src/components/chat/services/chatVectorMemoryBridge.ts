import { Memory, ChatMessage } from "../../../lib/memoryTypes";
import { DailyTask } from "../../../lib/subagentTypes";
import { KnowledgeDeficit } from "../../../services/reinforcementLearningEngine";
import {
  buildVectorKnowledgeGraph,
  queryVectorMemory,
  findSemanticallySimilarMemory,
  saveVectorGraphToStorage,
  formatVectorGroundingPrompt,
} from "../../../services/vectorMemoryEngine";
import { classifyMemoryFromText } from "../../../services/memoryClassifierService";

export interface VectorRecallResult {
  groundingBlock: string;
  recalledCount: number;
  recalledLabels: string[];
  topSimilarity: number;
}

export interface AutoSavedMemoryInfo {
  saved: boolean;
  updatedExisting: boolean;
  memory?: Memory;
  summaryLabel?: string;
}

/**
 * Layer 1 Service: Unites client-side 128-D VectorKnowledgeGraph recall with server-side
 * vector memory lookup, active tasks, chalkboard state, and recent multi-turn dialogue.
 */
export async function recallChatVectorContext(params: {
  query: string;
  memories: Memory[];
  studyPadText?: string;
  whiteboardText?: string;
  knowledgeDeficits?: KnowledgeDeficit[];
  dailyTasks?: DailyTask[];
  recentHistory?: ChatMessage[];
}): Promise<VectorRecallResult> {
  const {
    query,
    memories = [],
    studyPadText = "",
    whiteboardText = "",
    knowledgeDeficits = [],
    dailyTasks = [],
    recentHistory = [],
  } = params;

  const recalledLabelsSet = new Set<string>();
  const combinedMatches: Array<{ label: string; description: string; clusterName: string; similarity: number }> = [];

  // 1. Local 128-D Vector Knowledge Graph semantic search across all memories & workspace artifacts
  try {
    const graph = buildVectorKnowledgeGraph(memories, [], [], 0.30, {
      studyPadText,
      whiteboardText,
      knowledgeDeficits,
    });

    // Persist updated graph snapshot asynchronously
    saveVectorGraphToStorage(graph).catch(() => {});

    if (query && query.trim().length >= 2 && graph.nodes.length > 0) {
      const localQuery = queryVectorMemory(query, graph, 6);
      const relevantLocal = (localQuery.topMatches || []).filter((m) => m.similarity >= 0.24);

      for (const match of relevantLocal) {
        recalledLabelsSet.add(match.node.label);
        combinedMatches.push({
          label: match.node.label,
          description: match.node.description,
          clusterName: match.node.clusterName,
          similarity: match.similarity,
        });
      }

      // Include up to 2 1-hop semantic graph neighbors for richer context continuity
      for (const neighbor of (localQuery.connectedNeighbors || []).slice(0, 2)) {
        if (!recalledLabelsSet.has(neighbor.label)) {
          recalledLabelsSet.add(neighbor.label);
          combinedMatches.push({
            label: neighbor.label,
            description: neighbor.description,
            clusterName: `${neighbor.clusterName} (Linked Node)`,
            similarity: 0.42,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[chatVectorMemoryBridge] Local 128-D graph recall warning:", err);
  }

  // 2. Server-side vector endpoint lookup (merges any backend-indexed nodes)
  try {
    const res = await fetch("/api/vector-memory/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK: 4, minSimilarity: 0.25 }),
    });
    if (res.ok) {
      const data = await res.json();
      const serverMatches = data.topMatches || [];
      for (const sm of serverMatches) {
        const label = sm.node?.label || "Concept";
        if (!recalledLabelsSet.has(label)) {
          recalledLabelsSet.add(label);
          combinedMatches.push({
            label,
            description: sm.node?.description || "",
            clusterName: sm.node?.clusterName || "Knowledge Base",
            similarity: sm.similarity || 0.5,
          });
        }
      }
    }
  } catch {
    // Non-fatal fallback to local 128-D vector graph
  }

  // Sort combined matches by cosine similarity descending
  combinedMatches.sort((a, b) => b.similarity - a.similarity);
  const topCombined = combinedMatches.slice(0, 6);

  // Also include core identity/goal memories even if query is general
  const coreIdentityMemories = memories
    .filter((m) => m.category === "identity" || m.category === "goal" || m.category === "project")
    .slice(0, 4);

  const sections: string[] = [];

  if (topCombined.length > 0) {
    const vectorBlock =
      "=== 128-D VECTOR MEMORY & KNOWLEDGE GRAPH RECALL ===\n" +
      topCombined
        .map(
          (m, idx) =>
            `${idx + 1}. [${m.clusterName}] ${m.label}: ${m.description} (Cosine Match: ${Math.round(
              m.similarity * 100
            )}%)`
        )
        .join("\n") +
      "\n====================================================";
    sections.push(vectorBlock);
  } else if (coreIdentityMemories.length > 0) {
    const fallbackBlock = formatVectorGroundingPrompt(
      coreIdentityMemories.map((m) => ({
        node: {
          id: m.id,
          label: m.category.toUpperCase(),
          type: "fact",
          description: m.text,
          source: "transcript_fact",
          embedding: [],
          clusterId: 0,
          clusterName: m.category,
          clusterColor: "#38bdf8",
          importance: 5,
          mentionCount: 1,
          projectId: m.projectId,
          dueDate: m.dueDate,
          createdAt: m.createdAt,
        },
        similarity: 0.75,
      }))
    );
    if (fallbackBlock) sections.push(fallbackBlock);
  }

  // 3. Active Daily Tasks Context
  if (dailyTasks && dailyTasks.length > 0) {
    const pendingTasks = dailyTasks.filter((t) => !t.completed).slice(0, 6);
    if (pendingTasks.length > 0) {
      sections.push(
        `[ACTIVE DAILY TASKS (${pendingTasks.length} pending)]\n` +
          pendingTasks.map((t) => `- [${t.priority.toUpperCase()}] ${t.title} (${t.timeBlock || "Today"})`).join("\n")
      );
    }
  }

  // 4. Multi-Turn Conversation Continuity (Last 6 messages)
  if (recentHistory && recentHistory.length > 0) {
    const recentTurns = recentHistory.slice(-6);
    sections.push(
      `[RECENT CONVERSATION CONTINUITY]\n` +
        recentTurns
          .map((msg) => `${msg.role === "user" ? "Student" : "MAHR"}: ${msg.text.slice(0, 280)}`)
          .join("\n")
    );
  }

  // 5. Study Pad & Classroom Chalkboard
  if (studyPadText && studyPadText.trim()) {
    sections.push(`[STUDY PAD NOTES]\n${studyPadText.slice(0, 1200)}`);
  }
  if (whiteboardText && whiteboardText.trim()) {
    sections.push(`[CLASSROOM CHALKBOARD SLATE]\n${whiteboardText.slice(0, 1200)}`);
  }

  return {
    groundingBlock: sections.join("\n\n"),
    recalledCount: topCombined.length,
    recalledLabels: topCombined.map((m) => m.label),
    topSimilarity: topCombined[0]?.similarity || 0,
  };
}

/**
 * Automatically classifies, deduplicates, and stores personal facts, preferences,
 * goals, projects, or explicit `/remember` instructions from a chat message.
 */
export async function autoIndexChatTurnToVectorMemory(params: {
  userText: string;
  forceRemember?: boolean;
  existingMemories: Memory[];
  onAddManualMemory?: (category: Memory["category"], text: string) => Promise<any>;
}): Promise<AutoSavedMemoryInfo> {
  const { userText, forceRemember = false, existingMemories = [], onAddManualMemory } = params;
  if (!userText || userText.trim().length < 4) {
    return { saved: false, updatedExisting: false };
  }

  const cleanText = userText
    .replace(/^\/remember\s+/i, "")
    .replace(/^(?:remember\s+that|remember|yaad\s+rakhna|yaad\s+rakho|memorize\s+that|note\s+down)\s*[:,-]?\s*/i, "")
    .trim();

  if (!cleanText) {
    return { saved: false, updatedExisting: false };
  }

  const classified = classifyMemoryFromText(cleanText);

  const explicitRememberTrigger =
    forceRemember ||
    /^\/remember\b/i.test(userText.trim()) ||
    /\b(?:remember\s+that|please\s+remember|yaad\s+rakhna|yaad\s+rakho|memorize\s+this|save\s+to\s+memory)\b/i.test(
      userText
    );

  if (!classified && !explicitRememberTrigger) {
    return { saved: false, updatedExisting: false };
  }

  const category: Memory["category"] = classified?.category || "goal";
  const factText = classified?.extractedFact || `Saved user note: "${cleanText}"`;

  // Check semantic similarity so we don't duplicate existing facts
  const similar = findSemanticallySimilarMemory(factText, existingMemories, 0.84);
  if (similar && !forceRemember) {
    return {
      saved: false,
      updatedExisting: true,
      memory: similar.memory,
      summaryLabel: similar.memory.text.slice(0, 42),
    };
  }

  if (onAddManualMemory) {
    try {
      await onAddManualMemory(category, cleanText);
      return {
        saved: true,
        updatedExisting: false,
        summaryLabel: cleanText.length > 44 ? cleanText.slice(0, 42) + "…" : cleanText,
      };
    } catch (e) {
      console.warn("[chatVectorMemoryBridge] Failed saving via onAddManualMemory:", e);
    }
  }

  return {
    saved: true,
    updatedExisting: false,
    summaryLabel: cleanText.length > 44 ? cleanText.slice(0, 42) + "…" : cleanText,
  };
}
