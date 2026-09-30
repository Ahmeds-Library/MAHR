import { useState, useEffect, useCallback, useTransition } from "react";
import { SlideDeck, Slide, SlideLayout } from "../../services/slides/slideTypes";
import { DEFAULT_THEME_ID } from "../../services/slides/slideThemes";
import { generateSlideDeckWithAI, createFallbackPresentationDeck } from "../../services/slides/slideAIEngine";
import {
  getVectorGroundingForTopic,
  GroundedVectorContext
} from "../../services/slides/slideVectorIntelligence";

interface UseSlideStudioProps {
  initialTopic?: string;
}

export function useSlideStudio({ initialTopic = "FMCG Market Dynamics & Omnichannel Strategy" }: UseSlideStudioProps = {}) {
  const [deck, setDeck] = useState<SlideDeck>(() =>
    createFallbackPresentationDeck(initialTopic, "Executive Leadership", 10, DEFAULT_THEME_ID)
  );

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [vectorContext, setVectorContext] = useState<GroundedVectorContext | null>(null);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Load vector grounding on topic change or mount
  useEffect(() => {
    let isMounted = true;
    getVectorGroundingForTopic(deck.topic || deck.title)
      .then((ctx) => {
        if (isMounted) setVectorContext(ctx);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [deck.topic, deck.title]);

  const currentSlide = deck.slides[currentSlideIndex] || deck.slides[0];

  // Select active slide safely
  const selectSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < deck.slides.length) {
        setCurrentSlideIndex(index);
      }
    },
    [deck.slides.length]
  );

  // Update current slide
  const updateCurrentSlide = useCallback(
    (partial: Partial<Slide>) => {
      setDeck((prev) => {
        const slides = [...prev.slides];
        if (!slides[currentSlideIndex]) return prev;
        slides[currentSlideIndex] = {
          ...slides[currentSlideIndex],
          ...partial
        };
        return {
          ...prev,
          slides,
          updatedAt: new Date().toISOString()
        };
      });
    },
    [currentSlideIndex]
  );

  // Add slide
  const addSlide = useCallback(
    (layout: SlideLayout = "bullets") => {
      setDeck((prev) => {
        const newIndex = currentSlideIndex + 1;
        const newSlide: Slide = {
          id: `slide_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          slideNumber: newIndex + 1,
          layout,
          title: "New Strategic Point",
          subtitle: "Explain the concept, data, or implications here",
          categoryTag: "INSIGHT",
          bullets: layout === "bullets" ? ["First essential point", "Second actionable insight", "Key conclusion"] : undefined,
          stats: layout === "stats" ? [{ value: "85%", label: "Adoption Rate" }, { value: "3.2x", label: "Throughput" }, { value: "Zero", label: "Downtime" }] : undefined,
          speakerNotes: "Explain the importance of this concept to the audience.",
          animationStyle: "slide-up"
        };

        const nextSlides = [...prev.slides];
        nextSlides.splice(newIndex, 0, newSlide);

        // Re-number
        const renumbered = nextSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));

        return {
          ...prev,
          slides: renumbered,
          updatedAt: new Date().toISOString()
        };
      });
      setCurrentSlideIndex((prev) => prev + 1);
    },
    [currentSlideIndex]
  );

  // Remove slide
  const removeSlide = useCallback(
    (index: number) => {
      setDeck((prev) => {
        if (prev.slides.length <= 1) return prev;
        const nextSlides = prev.slides.filter((_, idx) => idx !== index);
        const renumbered = nextSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
        return {
          ...prev,
          slides: renumbered,
          updatedAt: new Date().toISOString()
        };
      });
      setCurrentSlideIndex((prev) => Math.max(0, Math.min(prev, deck.slides.length - 2)));
    },
    [deck.slides.length]
  );

  // Duplicate slide
  const duplicateSlide = useCallback((index: number) => {
    setDeck((prev) => {
      const source = prev.slides[index];
      if (!source) return prev;
      const clone: Slide = {
        ...source,
        id: `slide_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: `${source.title} (Copy)`
      };
      const nextSlides = [...prev.slides];
      nextSlides.splice(index + 1, 0, clone);
      const renumbered = nextSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
      return {
        ...prev,
        slides: renumbered,
        updatedAt: new Date().toISOString()
      };
    });
    setCurrentSlideIndex(index + 1);
  }, []);

  // Reorder slides
  const reorderSlides = useCallback((startIdx: number, endIdx: number) => {
    setDeck((prev) => {
      const nextSlides = [...prev.slides];
      const [moved] = nextSlides.splice(startIdx, 1);
      nextSlides.splice(endIdx, 0, moved);
      const renumbered = nextSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
      return {
        ...prev,
        slides: renumbered,
        updatedAt: new Date().toISOString()
      };
    });
    setCurrentSlideIndex(endIdx);
  }, []);

  // Set theme
  const setTheme = useCallback((themeId: string) => {
    setDeck((prev) => ({ ...prev, themeId, updatedAt: new Date().toISOString() }));
  }, []);

  // Execute AI Prompt / Command
  const executeMahrPrompt = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);
      setStatusMessage("MAHR is reasoning with Vector Grounding...");

      try {
        const lower = prompt.toLowerCase();
        // Check if user is asking to change theme
        if (lower.includes("theme") || lower.includes("dark") || lower.includes("cyberpunk") || lower.includes("minimal")) {
          if (lower.includes("cyber") || lower.includes("gold")) setTheme("cyberpunk_gold");
          else if (lower.includes("emerald") || lower.includes("academic")) setTheme("academic_emerald");
          else if (lower.includes("royal") || lower.includes("indigo")) setTheme("royal_indigo");
          else if (lower.includes("minimal") || lower.includes("mono")) setTheme("minimal_monochrome");
          else setTheme("obsidian_neon");
          setIsGenerating(false);
          setStatusMessage("Theme updated!");
          return;
        }

        // Check if user is asking to present
        const isPresentCommand =
          /^(start\s+)?(slideshow|fullscreen|full\s+screen)$/i.test(lower.trim()) ||
          /^(play|start|run|launch)\s+(the\s+)?(slides?|presentation|slideshow)$/i.test(lower.trim()) ||
          /^(enter\s+)?present(ation)?\s+mode$/i.test(lower.trim());
        if (isPresentCommand) {
          setIsPresenting(true);
          setIsGenerating(false);
          return;
        }

        // Check if user is asking to add a specific slide
        if (lower.startsWith("add slide") || lower.startsWith("new slide") || lower.includes("add a slide")) {
          const slideTopic = prompt.replace(/^(add slide|new slide|add a slide about|add a slide on)/i, "").trim() || "Deep Dive";
          addSlide("bullets");
          updateCurrentSlide({
            title: slideTopic,
            subtitle: "Strategic exploration and architectural takeaways",
            categoryTag: "NEW INSIGHT"
          });
          setIsGenerating(false);
          setStatusMessage(`Added slide on ${slideTopic}`);
          return;
        }

        // Parse requested slide count or default to suggested (6-10)
        const countMatch = prompt.match(/\b(\d+)\s*(?:slides?|pages?)\b/i);
        const targetCount = countMatch ? Math.max(3, Math.min(parseInt(countMatch[1], 10), 16)) : 8;

        setStatusMessage(`MAHR is generating ${targetCount} slides (Suggested: 6 se 10 slides)...`);

        // Full Deck Synthesis or Regeneration
        const generated = await generateSlideDeckWithAI({
          topic: prompt,
          themeId: deck.themeId,
          slideCount: targetCount,
          vectorContext: vectorContext || undefined
        });

        if (generated && generated.slides && generated.slides.length > 0) {
          setDeck(generated);
          setCurrentSlideIndex(0);
          setStatusMessage("MAHR crafted a new grounded slide deck!");
        }
      } catch (err) {
        console.warn("[useSlideStudio] AI execution fallback:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [deck.themeId, vectorContext, setTheme, addSlide, updateCurrentSlide]
  );

  // Quick Enhancements
  const enhanceCurrentSlide = useCallback(() => {
    if (!currentSlide) return;
    updateCurrentSlide({
      subtitle: currentSlide.subtitle ? `${currentSlide.subtitle} — Refined with strategic precision` : "Key strategic takeaway",
      categoryTag: currentSlide.categoryTag ? currentSlide.categoryTag : "STRATEGIC FOCUS"
    });
  }, [currentSlide, updateCurrentSlide]);

  const convertSlideToMetrics = useCallback(() => {
    if (!currentSlide) return;
    updateCurrentSlide({
      layout: "stats",
      stats: [
        { value: "3.5x", label: "System Velocity" },
        { value: "99.9%", label: "Operational SLA" },
        { value: "<50ms", label: "Latency Ceiling" }
      ]
    });
  }, [currentSlide, updateCurrentSlide]);

  const regenerateWithMemory = useCallback(async () => {
    setIsGenerating(true);
    setStatusMessage("Grounding with associative vector memory nodes...");
    try {
      const refreshedContext = await getVectorGroundingForTopic(deck.topic || deck.title);
      setVectorContext(refreshedContext);

      const generated = await generateSlideDeckWithAI({
        topic: deck.topic || deck.title,
        themeId: deck.themeId,
        slideCount: Math.max(10, deck.slides.length || 10),
        vectorContext: refreshedContext
      });

      if (generated && generated.slides && generated.slides.length > 0) {
        setDeck(generated);
        setCurrentSlideIndex(0);
      }
    } catch (err) {
      console.warn("[useSlideStudio] Memory ground error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [deck.topic, deck.title, deck.themeId, deck.slides.length]);

  return {
    deck,
    setDeck,
    currentSlideIndex,
    currentSlide,
    selectSlide,
    updateCurrentSlide,
    addSlide,
    removeSlide,
    duplicateSlide,
    reorderSlides,
    setTheme,
    isGenerating,
    vectorContext,
    statusMessage,
    isPresenting,
    setIsPresenting,
    showExportModal,
    setShowExportModal,
    executeMahrPrompt,
    enhanceCurrentSlide,
    convertSlideToMetrics,
    regenerateWithMemory
  };
}
