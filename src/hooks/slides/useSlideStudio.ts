import { useState, useEffect, useCallback, useTransition } from "react";
import { SlideDeck, Slide, SlideLayout } from "../../services/slides/slideTypes";
import { DEFAULT_THEME_ID } from "../../services/slides/slideThemes";
import { generateSlideDeckWithAI } from "../../services/slides/slideAIEngine";
import {
  getVectorGroundingForTopic,
  GroundedVectorContext
} from "../../services/slides/slideVectorIntelligence";

interface UseSlideStudioProps {
  initialTopic?: string;
}

export function useSlideStudio({ initialTopic = "Artificial Intelligence & Ambient OS" }: UseSlideStudioProps = {}) {
  const [deck, setDeck] = useState<SlideDeck>(() => ({
    id: `deck_${Date.now()}`,
    title: initialTopic,
    subtitle: "Strategic Executive Overview",
    audience: "Professional Audience",
    topic: initialTopic,
    themeId: DEFAULT_THEME_ID,
    slides: [
      {
        id: `slide_init_1`,
        slideNumber: 1,
        layout: "title",
        title: initialTopic,
        subtitle: "Keynote Architecture & Strategic Insights",
        categoryTag: "EXECUTIVE BRIEFING",
        speakerNotes: `Welcome to this presentation on ${initialTopic}. We will explore technical architecture, core paradigms, and future horizons.`,
        animationStyle: "zoom-in"
      },
      {
        id: `slide_init_2`,
        slideNumber: 2,
        layout: "bullets",
        title: "Key Foundational Pillars",
        subtitle: "Core tenets powering modern ambient intelligence",
        categoryTag: "FOUNDATIONS",
        bullets: [
          "Zero-latency multi-modal cognitive pipelines",
          "128-dimensional vector memory retrieval & associative recall",
          "Decoupled 3-layer architecture ensuring robust scalability",
          "Contextual ambient audio and teleprompter narration"
        ],
        speakerNotes: "Here we examine the four primary foundational pillars that underpin the framework.",
        animationStyle: "slide-up"
      },
      {
        id: `slide_init_3`,
        slideNumber: 3,
        layout: "stats",
        title: "Empirical Performance & Metrics",
        subtitle: "Benchmarked efficiency across production workloads",
        categoryTag: "METRICS & DATA",
        stats: [
          { value: "99.98%", label: "Real-time Reliability" },
          { value: "<45ms", label: "Vector Query Latency" },
          { value: "10x", label: "Productivity Velocity" }
        ],
        speakerNotes: "Notice the quantitative advantages highlighted by these benchmark metrics.",
        animationStyle: "zoom-in"
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

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
        if (lower.includes("present") || lower.includes("fullscreen") || lower.includes("start slideshow")) {
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

        // Full Deck Synthesis or Regeneration
        const generated = await generateSlideDeckWithAI({
          topic: prompt,
          themeId: deck.themeId,
          slideCount: 6,
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
        slideCount: deck.slides.length || 6,
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
