/**
 * Layer 2 — Presenton Frontend API Client & Google Slides Deck Adapter
 */

import {
  PresentonCitation,
  PresentonDeck,
  PresentonInputConfig,
  PresentonOutlineItem,
  PresentonSlide
} from "../layer1_data/presentonTypes";
import { PRESENTON_THEMES, DEFAULT_PRESENTON_THEME_ID } from "../layer1_data/presentonThemes";
import { SlideDeck, Slide, SlideLayout } from "../../services/slides/slideTypes";

export interface GenerateOutlineResponse {
  topic: string;
  title: string;
  subtitle: string;
  audience: string;
  tone: string;
  outline: PresentonOutlineItem[];
  citations: PresentonCitation[];
}

export async function generatePresentonOutline(
  config: PresentonInputConfig
): Promise<GenerateOutlineResponse> {
  const response = await fetch("/api/presenton/outline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Failed to generate outline");
    throw new Error(errText || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function generatePresentonDeck(params: {
  topic: string;
  title: string;
  subtitle: string;
  audience: string;
  tone: string;
  language: string;
  themeId: string;
  outline: PresentonOutlineItem[];
  documentContext?: string;
  customInstructions?: string;
  citations?: PresentonCitation[];
}): Promise<PresentonDeck> {
  const response = await fetch("/api/presenton/generate-deck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Failed to generate presentation deck");
    throw new Error(errText || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function editPresentonSlideWithAI(params: {
  slide: PresentonSlide;
  instruction: string;
  topic: string;
}): Promise<PresentonSlide> {
  const response = await fetch("/api/presenton/edit-slide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error(`Slide edit failed (${response.status})`);
  }

  const data = await response.json();
  return data.slide || params.slide;
}

/**
 * Converts a PresentonDeck into the Google Slides compatible SlideDeck structure
 * so the existing OAuth Google Slides exporter works seamlessly.
 */
export function convertPresentonDeckToGoogleSlideDeck(deck: PresentonDeck): SlideDeck {
  const layoutMap: Record<string, SlideLayout> = {
    "hero-cover": "title",
    "split-visual": "bullets",
    "kpi-metrics": "stats",
    "data-chart": "stats",
    "comparison-grid": "columns",
    "process-timeline": "timeline",
    "architecture-pillars": "columns",
    "quote-spotlight": "quote"
  };

  const slides: Slide[] = deck.slides.map((s, idx) => ({
    id: s.id,
    slideNumber: idx + 1,
    layout: layoutMap[s.layout] || "bullets",
    title: s.title,
    subtitle: s.subtitle,
    categoryTag: s.categoryTag,
    bullets: s.bullets,
    stats: s.metrics.map((m) => ({
      label: m.label,
      value: m.value,
      description: m.description || m.delta
    })),
    quote: s.quote?.text,
    quoteAuthor: s.quote?.author,
    callout: s.callout,
    speakerNotes: s.speakerNotes
  }));

  const theme = PRESENTON_THEMES[deck.themeId] || PRESENTON_THEMES[DEFAULT_PRESENTON_THEME_ID];

  return {
    id: deck.id,
    title: deck.title,
    subtitle: deck.subtitle,
    topic: deck.topic,
    audience: deck.audience,
    themeId: theme.isDark ? "midnight-indigo" : "minimal-ivory",
    slides,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt
  };
}
