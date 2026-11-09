import { Memory, MemoryCategory, MemoryTier, ChatMessage } from "../../lib/memoryTypes";

export type RecallJournalViewMode = "recall" | "journal";

export type MemorySortMode = "hybrid" | "retention" | "importance" | "newest";

export interface MemoryCognitiveOverride {
  id: string;
  tier?: MemoryTier;
  pinned?: boolean;
  importancePercent?: number; // 0 - 100
  accessCount?: number;
  lastAccessedAt?: string;
  consolidatedIntoId?: string;
}

export interface HybridVectorMatch {
  memory: Memory;
  denseCosineScore: number; // 0.0 - 1.0 (128-D L2 unit vector dot product)
  bm25LexicalScore: number; // 0.0 - 1.0 (TF-IDF / BM25 token overlap)
  recencyConfidenceBoost: number; // 0.0 - 1.0
  hybridScore: number; // Weighted combined score 0.0 - 1.0
  clusterName: string;
  clusterColor: string;
  matchedKeywords: string[];
  tier: MemoryTier;
  importancePercent: number; // 0 - 100
  retentionPercent: number; // 0 - 100 Ebbinghaus retention strength
  pinned: boolean;
  accessCount: number;
}

export interface MemoryConsolidationCluster {
  id: string;
  clusterName: string;
  clusterColor: string;
  dominantCategory: MemoryCategory;
  sourceMemories: Memory[];
  synthesizedRulePreview: string;
  averageSimilarity: number;
  estimatedRetentionGain: number;
}

export interface HybridTranscriptMatch {
  message: ChatMessage;
  hybridScore: number;
  linkedMemories: Array<{
    id: string;
    text: string;
    category: MemoryCategory;
    similarity: number;
  }>;
  extractedCandidateFact?: {
    category: MemoryCategory;
    factText: string;
    confidence: number;
    tags: string[];
  } | null;
}

export interface AutoLearningTelemetry {
  totalVectorNodes: number;
  semanticEdgesCount: number;
  graphDensityPercent: number;
  avgConfidencePercent: number;
  avgRetentionPercent?: number;
  pinnedCount?: number;
  episodicCount?: number;
  semanticCount?: number;
  proceduralCount?: number;
  rlEmpathyScore: number;
  rlExplanationDepthPercent: number;
  rlTotalInteractions: number;
  rlTotalReward: number;
  openDeficitsCount: number;
  clusterBreakdown: Array<{
    name: string;
    color: string;
    count: number;
  }>;
}
