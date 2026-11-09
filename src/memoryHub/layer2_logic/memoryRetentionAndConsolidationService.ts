import { Memory, MemoryCategory, MemoryTier } from "../../lib/memoryTypes";
import {
  computeVectorEmbedding,
  cosineSimilarity,
} from "../../services/vectorMemoryEngine";
import {
  MemoryCognitiveOverride,
  MemoryConsolidationCluster,
} from "../layer1_data/hybridVectorTypes";
import { resolveDominantCluster } from "./hybridVectorSearchEngine";

const OVERRIDES_STORAGE_KEY = "mahr_memory_cognitive_overrides_v1";

export function loadMemoryCognitiveOverrides(): Record<string, MemoryCognitiveOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveMemoryCognitiveOverrides(
  map: Record<string, MemoryCognitiveOverride>
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function updateSingleMemoryOverride(
  memoryId: string,
  patch: Partial<MemoryCognitiveOverride>
): Record<string, MemoryCognitiveOverride> {
  const current = loadMemoryCognitiveOverrides();
  const existing = current[memoryId] || { id: memoryId };
  const updated: Record<string, MemoryCognitiveOverride> = {
    ...current,
    [memoryId]: {
      ...existing,
      ...patch,
      id: memoryId,
    },
  };
  saveMemoryCognitiveOverrides(updated);
  return updated;
}

/**
 * Resolves the cognitive memory tier (Episodic, Semantic, Procedural)
 * from explicit override, memory.tier, or archetype category.
 */
export function resolveMemoryTier(
  memory: Memory,
  override?: MemoryCognitiveOverride
): MemoryTier {
  if (override?.tier) return override.tier;
  if (memory.tier) return memory.tier;

  switch (memory.category) {
    case "emotional":
    case "relationship":
      return "episodic";
    case "identity":
      return "semantic";
    case "preference":
    case "goal":
    case "project":
    case "behavior":
    case "simulation":
      return "procedural";
    default: {
      // Heuristic: if text mentions dates/events/conversations -> episodic; rules/facts -> semantic
      const lower = (memory.text || "").toLowerCase();
      if (
        /\b(today|yesterday|session|discussed|asked|felt|milestone|remembered when)\b/.test(
          lower
        )
      ) {
        return "episodic";
      }
      if (/\b(prefers|workflow|habit|goal|build|step|always|routine)\b/.test(lower)) {
        return "procedural";
      }
      return "semantic";
    }
  }
}

/**
 * Computes Importance Score (0 - 100%)
 */
export function computeMemoryImportancePercent(
  memory: Memory,
  override?: MemoryCognitiveOverride
): number {
  if (typeof override?.importancePercent === "number") {
    return Math.min(100, Math.max(10, Math.round(override.importancePercent)));
  }
  if (typeof memory.importance === "number") {
    const scaled =
      memory.importance <= 1 ? memory.importance * 100 : memory.importance;
    return Math.min(100, Math.max(10, Math.round(scaled)));
  }

  const baseConf = (memory.confidence ?? 0.85) * 100;
  const categoryBoost =
    memory.category === "identity" || memory.category === "goal"
      ? 8
      : memory.category === "project"
        ? 6
        : 0;
  return Math.min(99, Math.max(45, Math.round(baseConf + categoryBoost)));
}

/**
 * Computes Ebbinghaus-inspired Retention Strength (0 - 100%)
 * - Pinned memories are locked at 100% retention.
 * - Unpinned memories decay gently over time unless reinforced by accessCount & importance.
 */
export function computeMemoryRetentionPercent(
  memory: Memory,
  override?: MemoryCognitiveOverride
): number {
  const isPinned = override?.pinned ?? memory.pinned ?? false;
  if (isPinned) return 100;

  const now = Date.now();
  const refIso =
    override?.lastAccessedAt ||
    memory.lastAccessedAt ||
    memory.updatedAt ||
    memory.createdAt;
  const refMs = refIso ? new Date(refIso).getTime() : now;
  const elapsedDays = Math.max(0, (now - refMs) / (1000 * 60 * 60 * 24));

  const accessCount = override?.accessCount ?? memory.accessCount ?? 1;
  const importance = computeMemoryImportancePercent(memory, override);

  // Stability S increases with each recall reinforcement and higher importance
  const stabilityDays = 14 * (1 + 0.45 * accessCount) * (importance / 75);
  const rawRetention = Math.exp(-elapsedDays / Math.max(3, stabilityDays)) * 100;

  // Blend with base confidence so active memories stay realistic (52% - 99%)
  const blended = 0.65 * rawRetention + 0.35 * importance;
  return Math.min(99, Math.max(35, Math.round(blended)));
}

/**
 * Detects candidate clusters of related memories that can be consolidated
 * into a unified high-retention Semantic Principle.
 */
export function detectConsolidationCandidates(
  memories: Memory[],
  overrides: Record<string, MemoryCognitiveOverride> = {}
): MemoryConsolidationCluster[] {
  if (memories.length < 2) return [];

  const embeddings = memories.map((m) => ({
    memory: m,
    vec: computeVectorEmbedding(m.text, m.tags),
  }));

  const usedIds = new Set<string>();
  const clusters: MemoryConsolidationCluster[] = [];

  for (let i = 0; i < embeddings.length; i++) {
    const itemA = embeddings[i];
    if (usedIds.has(itemA.memory.id)) continue;
    if (overrides[itemA.memory.id]?.consolidatedIntoId) continue;

    const group: Memory[] = [itemA.memory];
    let simSum = 0;
    let simPairs = 0;

    for (let j = i + 1; j < embeddings.length; j++) {
      const itemB = embeddings[j];
      if (usedIds.has(itemB.memory.id)) continue;

      const sim = cosineSimilarity(itemA.vec, itemB.vec);
      const sameCategory = itemA.memory.category === itemB.memory.category;
      if (sim >= 0.34 || (sameCategory && sim >= 0.24)) {
        group.push(itemB.memory);
        simSum += sim;
        simPairs += 1;
        if (group.length >= 4) break;
      }
    }

    if (group.length >= 2) {
      group.forEach((m) => usedIds.add(m.id));
      const domCluster = resolveDominantCluster(itemA.vec);
      const avgSim = simPairs > 0 ? simSum / simPairs : 0.68;

      const snippets = group
        .map((m) => m.text.replace(/\.$/, "").trim())
        .slice(0, 3);
      const synthesizedRulePreview = `[Consolidated Semantic Principle · ${domCluster.name}]: ${snippets.join(" — furthermore, ")}.`;

      clusters.push({
        id: `cluster_${itemA.memory.id}`,
        clusterName: domCluster.name,
        clusterColor: domCluster.color,
        dominantCategory: itemA.memory.category,
        sourceMemories: group,
        synthesizedRulePreview,
        averageSimilarity: Number(Math.max(0.55, avgSim).toFixed(2)),
        estimatedRetentionGain: 18 + group.length * 4,
      });
    }
  }

  return clusters.slice(0, 4);
}
