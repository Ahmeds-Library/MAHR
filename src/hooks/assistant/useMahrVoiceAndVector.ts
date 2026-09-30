import { useCallback } from "react";
import { speakUtterance } from "@/services/speechSynthesisService";
import { MahrEmotion } from "@/components/MahrCoreVisualizer";

interface UseMahrVoiceAndVectorOptions {
  onNotifyUser?: (msg: string) => void;
  onOpenKnowledgeGraph?: () => void;
  onOpenMemories?: () => void;
  agentName?: string;
}

export function useMahrVoiceAndVector({
  onNotifyUser,
  onOpenKnowledgeGraph,
  onOpenMemories,
  agentName = "MAHR",
}: UseMahrVoiceAndVectorOptions = {}) {
  // 1. Proactive Voice Synthesizer for Mahr
  const speakAsMahr = useCallback((text: string, emotion: MahrEmotion = "idle") => {
    speakUtterance({
      text,
      activeEmotion: emotion,
    });
  }, []);

  // 2. High-Dimensional Vector Memory Semantic Search
  const queryVectorMemory = useCallback(
    async (query: string): Promise<{ topMatches: any[]; summary: string }> => {
      if (!query || !query.trim()) {
        return { topMatches: [], summary: "Empty query." };
      }

      onNotifyUser?.(`🔍 Querying 128-D vector memory for "${query.slice(0, 30)}"...`);
      speakAsMahr(`Searching your vector memory graph for ${query}...`, "thinking");

      try {
        const res = await fetch("/api/vector-memory/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, topK: 4, minSimilarity: 0.25 }),
        });

        if (!res.ok) {
          throw new Error(`Vector query status: ${res.status}`);
        }

        const data = await res.json();
        const topMatches = data.topMatches || [];

        if (topMatches.length === 0) {
          const emptyMsg = `I searched your vector memory, but found no strongly related concepts for "${query}".`;
          speakAsMahr(emptyMsg, "idle");
          return { topMatches: [], summary: emptyMsg };
        }

        const topItem = topMatches[0];
        const matchLabel = topItem.node?.label || "Memory";
        const matchDesc = topItem.node?.description || "";
        const simPercent = Math.round((topItem.similarity || 0.8) * 100);

        const summary = `Found related vector memory: "${matchLabel}" with ${simPercent}% semantic relevance. ${matchDesc.slice(0, 120)}`;
        speakAsMahr(summary, "happy");
        onNotifyUser?.(`🧠 Vector recall: ${matchLabel} (${simPercent}%)`);

        return { topMatches, summary };
      } catch (err: any) {
        console.warn("[useMahrVoiceAndVector] Vector search fallback:", err);
        const fallbackMsg = `Queried vector space for "${query}". Check your Knowledge Graph for full visualization.`;
        speakAsMahr(fallbackMsg, "idle");
        return { topMatches: [], summary: fallbackMsg };
      }
    },
    [onNotifyUser, speakAsMahr]
  );

  // 3. Autonomous Vector Memory Ingestion
  const ingestVectorArtifact = useCallback(
    async (concept: string, notes: string, category: string = "General Learning") => {
      try {
        const res = await fetch("/api/vector-memory/ingest-artifacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studyNotes: [{ title: concept, content: notes, tags: [category, "MahrVector"] }],
          }),
        });

        if (res.ok) {
          speakAsMahr(`Embedded "${concept}" into your 128-dimensional vector memory graph.`, "happy");
          onNotifyUser?.(`✨ Vector Memory Ingested: ${concept}`);
        }
      } catch (e) {
        console.error("[useMahrVoiceAndVector] Ingest error:", e);
      }
    },
    [onNotifyUser, speakAsMahr]
  );

  return {
    speakAsMahr,
    queryVectorMemory,
    ingestVectorArtifact,
  };
}
