import { useState, useCallback } from "react";
import { usePresentationPipeline } from "./usePresentationPipeline";
import { SlideDeck } from "../../services/slides/slideTypes";
import { enrichDeckWithVectorGraphics, findBestMatchingGraphic } from "../../services/slides/infographics/backgroundInfographicEnricher";
import { speakUtterance } from "../../services/speechSynthesisService";

/**
 * Background Presentation Pipeline & Infographics Orchestrator (Layer 2 - State & Orchestration)
 * Handles autonomous background execution of the 4-step pipeline and auto-enrichment of vector infographics.
 * Ensures the user is not bothered with manual modal popups or toolbar buttons.
 */
export function useBackgroundPresentationPipeline() {
  const {
    pipelineState,
    executePipeline,
    selectTemplate,
    resetPipeline
  } = usePresentationPipeline();

  const [backgroundNotice, setBackgroundNotice] = useState<string | null>(null);

  const notify = useCallback((msg: string, speak: boolean = false) => {
    setBackgroundNotice(msg);
    if (speak) {
      speakUtterance({ text: msg });
    }
    setTimeout(() => {
      setBackgroundNotice((cur) => (cur === msg ? null : cur));
    }, 4500);
  }, []);

  /**
   * Run the 4-step automated pipeline in the background and update the active deck when done
   */
  const runBackgroundPipeline = useCallback(
    async (topic: string, slideCount: number = 8, onDeckSynthesized?: (deck: SlideDeck) => void) => {
      notify(`⚡ Running presentation pipeline for "${topic}" in background...`);
      try {
        await executePipeline(topic, slideCount);
        if (pipelineState.deck) {
          // Auto-enrich deck with background infographics
          const enriched = enrichDeckWithVectorGraphics(pipelineState.deck);
          onDeckSynthesized?.(enriched);
          notify(`✨ Multi-engine pipeline completed! ${enriched.slides.length} slides synthesized with infographics.`);
        }
      } catch (err: any) {
        console.warn("[useBackgroundPresentationPipeline] Error running pipeline:", err);
      }
    },
    [executePipeline, notify, pipelineState.deck]
  );

  /**
   * Auto-inject an infographic into the current active slide in the background
   */
  const injectBackgroundInfographic = useCallback(
    (contextText: string, onGraphicReady: (graphic: any) => void) => {
      const graphic = findBestMatchingGraphic(contextText);
      onGraphicReady(graphic);
      notify(`📊 Vector graphic (${graphic.title}) attached in background.`);
    },
    [notify]
  );

  return {
    pipelineState,
    backgroundNotice,
    runBackgroundPipeline,
    injectBackgroundInfographic,
    autoEnrichDeck: enrichDeckWithVectorGraphics
  };
}
