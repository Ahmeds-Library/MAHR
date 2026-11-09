import { Memory, ChatMessage, MemoryTier } from "../../lib/memoryTypes";
import {
  computeVectorEmbedding,
  cosineSimilarity,
  SEMANTIC_CLUSTERS,
} from "../../services/vectorMemoryEngine";
import { classifyMemoryFromText } from "../../services/memoryClassifierService";
import {
  HybridVectorMatch,
  HybridTranscriptMatch,
  MemorySortMode,
  MemoryCognitiveOverride,
} from "../layer1_data/hybridVectorTypes";
import {
  resolveMemoryTier,
  computeMemoryImportancePercent,
  computeMemoryRetentionPercent,
  loadMemoryCognitiveOverrides,
} from "./memoryRetentionAndConsolidationService";

/**
 * Computes BM25-inspired lexical relevance score (normalized 0.0 - 1.0)
 * between a query string and a document string + tags.
 */
export function computeBM25LexicalScore(
  query: string,
  docText: string,
  tags?: string[]
): { score: number; matchedKeywords: string[] } {
  const cleanQuery = query
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .trim();
  if (!cleanQuery) return { score: 1.0, matchedKeywords: [] };

  const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 1);
  if (queryTokens.length === 0) return { score: 1.0, matchedKeywords: [] };

  const fullDoc = `${docText} ${(tags || []).join(" ")}`.toLowerCase();
  const docTokens = fullDoc.split(/\s+/);
  const k1 = 1.5;
  const b = 0.75;
  const avgDocLen = 24;
  const docLen = Math.max(1, docTokens.length);

  let rawScore = 0;
  const matchedKeywords: string[] = [];

  for (const qToken of queryTokens) {
    let tf = 0;
    for (const dToken of docTokens) {
      if (dToken === qToken) tf += 1.0;
      else if (dToken.includes(qToken) || qToken.includes(dToken)) tf += 0.55;
    }

    if (tf > 0) {
      matchedKeywords.push(qToken);
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
      rawScore += numerator / denominator;
    }
  }

  const maxPossible = queryTokens.length * (k1 + 1);
  const normalized = Math.min(1.0, rawScore / Math.max(1, maxPossible * 0.65));

  return {
    score: Number(normalized.toFixed(4)),
    matchedKeywords: Array.from(new Set(matchedKeywords)),
  };
}

/**
 * Resolves the dominant semantic cluster for a 128-D embedding vector
 */
export function resolveDominantCluster(embedding: number[]): {
  name: string;
  color: string;
} {
  let bestIdx = 0;
  let bestEnergy = -1;

  SEMANTIC_CLUSTERS.forEach((cluster, idx) => {
    const start = 64 + idx * 12;
    let energy = 0;
    for (let i = 0; i < 12; i++) {
      energy += Math.abs(embedding[start + i] || 0);
    }
    if (energy > bestEnergy) {
      bestEnergy = energy;
      bestIdx = idx;
    }
  });

  const chosen = SEMANTIC_CLUSTERS[bestIdx] || SEMANTIC_CLUSTERS[0];
  return { name: chosen.name, color: chosen.color };
}

/**
 * Hybrid Vector Search across Recalled Memories:
 * Combines 128-D Dense Cosine Similarity (58%) + BM25 Lexical Match (27%) + Confidence/Recency/Retention Boost (15%)
 * Supports Cognitive Tier filtering (Episodic / Semantic / Procedural) and multi-criteria sorting.
 */
export function searchMemoriesHybridVector(
  query: string,
  memories: Memory[],
  categoryFilter: string = "all",
  tierFilter: MemoryTier | "all" = "all",
  sortMode: MemorySortMode = "hybrid",
  overridesMap?: Record<string, MemoryCognitiveOverride>
): HybridVectorMatch[] {
  const activeOverrides = overridesMap || loadMemoryCognitiveOverrides();

  const categoryFiltered =
    categoryFilter === "all"
      ? memories
      : memories.filter(
          (m) =>
            m.category === categoryFilter ||
            m.category?.toLowerCase() === categoryFilter.toLowerCase()
        );

  const trimmedQuery = query.trim();
  const queryVec = trimmedQuery ? computeVectorEmbedding(trimmedQuery) : null;
  const now = Date.now();

  const results: HybridVectorMatch[] = categoryFiltered
    .map((memory) => {
      const ov = activeOverrides[memory.id];
      const tier = resolveMemoryTier(memory, ov);
      const importancePercent = computeMemoryImportancePercent(memory, ov);
      const retentionPercent = computeMemoryRetentionPercent(memory, ov);
      const pinned = ov?.pinned ?? memory.pinned ?? false;
      const accessCount = ov?.accessCount ?? memory.accessCount ?? 1;

      const memVec = computeVectorEmbedding(memory.text, memory.tags);
      const cluster = resolveDominantCluster(memVec);

      // Recency & Confidence factor
      const createdMs = memory.createdAt
        ? new Date(memory.createdAt).getTime()
        : now;
      const ageHours = Math.max(0, (now - createdMs) / (1000 * 60 * 60));
      const recencyFactor = Math.exp(-ageHours / (24 * 30)); // 30-day smooth decay
      const confFactor = memory.confidence ?? 0.85;
      const recencyConfidenceBoost = Number(
        (
          0.5 * confFactor +
          0.25 * recencyFactor +
          0.25 * (retentionPercent / 100)
        ).toFixed(3)
      );

      if (!queryVec) {
        return {
          memory,
          denseCosineScore: 1.0,
          bm25LexicalScore: 1.0,
          recencyConfidenceBoost,
          hybridScore: recencyConfidenceBoost,
          clusterName: cluster.name,
          clusterColor: cluster.color,
          matchedKeywords: [],
          tier,
          importancePercent,
          retentionPercent,
          pinned,
          accessCount,
        };
      }

      const denseCosineScore = Math.max(0, cosineSimilarity(queryVec, memVec));
      const bm25 = computeBM25LexicalScore(
        trimmedQuery,
        memory.text,
        memory.tags
      );

      const hybridScore = Number(
        Math.min(
          0.99,
          0.58 * denseCosineScore +
            0.27 * bm25.score +
            0.15 * recencyConfidenceBoost
        ).toFixed(3)
      );

      return {
        memory,
        denseCosineScore,
        bm25LexicalScore: bm25.score,
        recencyConfidenceBoost,
        hybridScore,
        clusterName: cluster.name,
        clusterColor: cluster.color,
        matchedKeywords: bm25.matchedKeywords,
        tier,
        importancePercent,
        retentionPercent,
        pinned,
        accessCount,
      };
    })
    .filter((item) => tierFilter === "all" || item.tier === tierFilter);

  const queryFiltered = trimmedQuery
    ? results.filter((r) => r.hybridScore >= 0.22 || r.bm25LexicalScore > 0)
    : results;

  // Sort with Pinned priority first when not doing a strict query match, or according to sortMode
  return [...queryFiltered].sort((a, b) => {
    if (!trimmedQuery && a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (sortMode === "retention") {
      return b.retentionPercent - a.retentionPercent;
    }
    if (sortMode === "importance") {
      return b.importancePercent - a.importancePercent;
    }
    if (sortMode === "newest") {
      const tA = a.memory.createdAt ? new Date(a.memory.createdAt).getTime() : 0;
      const tB = b.memory.createdAt ? new Date(b.memory.createdAt).getTime() : 0;
      return tB - tA;
    }
    return b.hybridScore - a.hybridScore;
  });
}

/**
 * Hybrid Semantic Search & Memory Cross-Linking for Journal Transcripts
 */
export function enrichAndSearchJournalTranscripts(
  query: string,
  chatHistory: ChatMessage[],
  memories: Memory[]
): HybridTranscriptMatch[] {
  const trimmedQuery = query.trim();
  const queryVec = trimmedQuery ? computeVectorEmbedding(trimmedQuery) : null;

  const memoryEmbeddings = memories.map((m) => ({
    memory: m,
    vec: computeVectorEmbedding(m.text, m.tags),
  }));

  const matches: HybridTranscriptMatch[] = chatHistory.map((msg) => {
    const msgVec = computeVectorEmbedding(msg.text);

    const linkedMemories = memoryEmbeddings
      .map((item) => ({
        id: item.memory.id,
        text: item.memory.text,
        category: item.memory.category,
        similarity: Number(cosineSimilarity(msgVec, item.vec).toFixed(2)),
      }))
      .filter((link) => link.similarity >= 0.45)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 2);

    const classified =
      msg.role === "user" && msg.text.length >= 10
        ? classifyMemoryFromText(msg.text)
        : null;

    let hybridScore = 1.0;
    if (queryVec) {
      const dense = Math.max(0, cosineSimilarity(queryVec, msgVec));
      const bm25 = computeBM25LexicalScore(trimmedQuery, msg.text);
      hybridScore = Number((0.6 * dense + 0.4 * bm25.score).toFixed(3));
    }

    return {
      message: msg,
      hybridScore,
      linkedMemories,
      extractedCandidateFact: classified
        ? {
            category: classified.category,
            factText: classified.extractedFact,
            confidence: classified.confidence,
            tags: classified.tags,
          }
        : null,
    };
  });

  if (!trimmedQuery) {
    return matches;
  }

  return matches
    .filter(
      (m) =>
        m.hybridScore >= 0.24 ||
        m.message.text.toLowerCase().includes(trimmedQuery.toLowerCase())
    )
    .sort((a, b) => b.hybridScore - a.hybridScore);
}
