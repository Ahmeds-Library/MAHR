import { SlideDeck, Slide, SlideTheme } from "./slideTypes";
import { DEFAULT_THEME_ID } from "./slideThemes";
import { getVectorGroundingForTopic, GroundedVectorContext } from "./slideVectorIntelligence";

export interface GenerateSlidesOptions {
  topic: string;
  audience?: string;
  slideCount?: number;
  visualTone?: string;
  themeId?: string;
  userPrompt?: string;
  extraNotes?: string;
  vectorContext?: GroundedVectorContext;
}

export async function generateSlideDeckWithAI(options: GenerateSlidesOptions): Promise<SlideDeck> {
  const {
    topic,
    audience = "General / Professional Audience",
    slideCount = 6,
    visualTone = "Executive, clear, high-impact",
    themeId = DEFAULT_THEME_ID,
    extraNotes = ""
  } = options;

  // Retrieve vector grounding if not already provided
  let vectorGrounding = options.vectorContext;
  if (!vectorGrounding) {
    try {
      vectorGrounding = await getVectorGroundingForTopic(topic);
    } catch {
      // Non-blocking fallback
    }
  }

  const enrichedNotes = vectorGrounding?.hasMemoryGrounding
    ? `${extraNotes ? extraNotes + "\n\n" : ""}${vectorGrounding.promptGrounding}`
    : extraNotes;

  try {
    const res = await fetch("/api/slides/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        audience,
        slideCount,
        visualTone,
        themeId,
        extraNotes: enrichedNotes
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.deck && Array.isArray(data.deck.slides) && data.deck.slides.length > 0) {
        const uniqueSlides = data.deck.slides.map((s: Slide, idx: number) => ({
          ...s,
          id: s.id || `slide_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          slideNumber: s.slideNumber || idx + 1
        }));

        return {
          ...data.deck,
          id: data.deck.id || `deck_${Date.now().toString(36)}`,
          slides: uniqueSlides,
          themeId: themeId || DEFAULT_THEME_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn("[SlideAIEngine] Backend generate endpoint fallback:", err);
  }

  // High-aesthetic fallback generator if offline or server timeout
  return createFallbackPresentationDeck(topic, audience, slideCount, themeId);
}

/**
 * High-quality procedural slide deck generator
 */
export function createFallbackPresentationDeck(
  topic: string,
  audience: string = "Professional",
  slideCount: number = 6,
  themeId: string = DEFAULT_THEME_ID
): SlideDeck {
  const cleanTopic = topic.trim() || "Artificial Intelligence & Ambient OS";
  const now = new Date().toISOString();

  const slides: Slide[] = [];

  // Slide 1: Title
  slides.push({
    id: `slide_1_${Date.now()}`,
    slideNumber: 1,
    layout: "title",
    title: cleanTopic,
    subtitle: `A Strategic Presentation Prepared for ${audience}`,
    categoryTag: "EXECUTIVE BRIEFING",
    speakerNotes: `Welcome everyone. Today we are exploring ${cleanTopic}. This presentation provides key strategic perspectives, actionable insights, and architectural takeaways.`,
    animationStyle: "zoom-in"
  });

  // Slide 2: Executive Summary / Context
  slides.push({
    id: `slide_2_${Date.now()}`,
    slideNumber: 2,
    layout: "bullets",
    title: "Executive Summary & Core Objectives",
    subtitle: "Setting the strategic foundation and measurable milestones",
    categoryTag: "STRATEGIC OVERVIEW",
    bullets: [
      `Accelerate adoption of modern frameworks centered around ${cleanTopic}`,
      "Bridge computational capability with human-centric intuitive workflows",
      "Drive measurable operational velocity while mitigating security and scalability risks",
      "Establish a continuous feedback loop and real-time observability telemetry"
    ],
    callout: "Simplicity is the prerequisite for reliability.",
    speakerNotes: "In this slide, frame the challenge and explain why addressing this now creates a 10x competitive advantage.",
    animationStyle: "slide-up"
  });

  // Slide 3: Key Pillars / Architecture
  slides.push({
    id: `slide_3_${Date.now()}`,
    slideNumber: 3,
    layout: "columns",
    title: "Core Architectural Pillars",
    subtitle: "Three pillars powering scalability and seamless user experience",
    categoryTag: "ARCHITECTURE",
    bullets: [
      "1. Resilient Foundation: Microservices with localized data caching & zero downtime",
      "2. Multimodal Cognition: Real-time voice, screen vision, and agentic reasoning",
      "3. Unified Integration: Native cloud sync with Google Workspace ecosystem"
    ],
    speakerNotes: "Highlight how each pillar reinforces the other to form a cohesive, future-proof ecosystem.",
    animationStyle: "fade"
  });

  // Slide 4: Data & Performance Metrics
  if (slideCount >= 4) {
    slides.push({
      id: `slide_4_${Date.now()}`,
      slideNumber: 4,
      layout: "stats",
      title: "Key Performance Indicators & ROI",
      subtitle: "Measurable benchmarks across reliability, speed, and user retention",
      categoryTag: "PERFORMANCE METRICS",
      stats: [
        { label: "Execution Velocity", value: "+340%", description: "Faster turnaround on complex workflows" },
        { label: "System Availability", value: "99.98%", description: "Zero-loss operational uptime" },
        { label: "User Delight Score", value: "4.9 / 5", description: "Validated across multiple cohorts" }
      ],
      speakerNotes: "Walk through these three metrics. The 340% velocity multiplier is our primary value proposition.",
      animationStyle: "stagger"
    });
  }

  // Slide 5: Implementation Roadmap
  if (slideCount >= 5) {
    slides.push({
      id: `slide_5_${Date.now()}`,
      slideNumber: 5,
      layout: "bullets",
      title: "Phased Execution Roadmap",
      subtitle: "Milestones from initial discovery to enterprise rollout",
      categoryTag: "ROADMAP",
      bullets: [
        "Phase 1 (Weeks 1-2): Requirement discovery, audience profiling & wireframing",
        "Phase 2 (Weeks 3-5): Core pipeline integration and end-to-end telemetry verification",
        "Phase 3 (Weeks 6-8): Production deployment, team onboarding, and live monitoring",
        "Phase 4 (Ongoing): Continuous model refinement, user feedback, and scale expansion"
      ],
      speakerNotes: "Provide confidence in the timeline. Each phase has clear exit criteria and measurable deliverables.",
      animationStyle: "slide-up"
    });
  }

  // Slide 6: Conclusion / Next Steps
  if (slideCount >= 6) {
    slides.push({
      id: `slide_6_${Date.now()}`,
      slideNumber: 6,
      layout: "summary",
      title: "Conclusion & Strategic Call to Action",
      subtitle: "Next steps to initiate deployment and maximize impact",
      categoryTag: "ACTION PLAN",
      bullets: [
        "Finalize integration roadmap and align key stakeholders",
        "Establish security audits and Google Workspace permission scopes",
        "Kick off Phase 1 pilot sprint with active observability",
        "Open for Q&A and technical deep-dive"
      ],
      callout: "The future belongs to those who build with precision and clarity.",
      speakerNotes: "Thank the audience, summarize the single most important takeaway, and invite questions.",
      animationStyle: "fade"
    });
  }

  return {
    id: `deck_${Date.now().toString(36)}`,
    title: cleanTopic,
    subtitle: `Prepared for ${audience}`,
    topic: cleanTopic,
    audience,
    themeId,
    slides,
    createdAt: now,
    updatedAt: now
  };
}
