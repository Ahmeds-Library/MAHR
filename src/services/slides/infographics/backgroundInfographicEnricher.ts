import { Slide, SlideDeck } from "../slideTypes";
import { SlideVectorGraphic } from "./infographicTypes";
import { INFOGRAPHIC_TEMPLATES } from "./infographicTemplates";

/**
 * Background Infographic Auto-Enricher Service (Layer 3 - Domain / Intelligence)
 * Runs autonomously in the background to analyze presentation content and inject
 * rich, mathematically grounded vector graphics (Value Chains, Market Pyramids, Matrices, Donuts, Roadmaps)
 * directly into slides without requiring user manual intervention.
 */

interface KeywordMapping {
  keywords: string[];
  templateId: string;
}

const KEYWORD_MAPPINGS: KeywordMapping[] = [
  {
    keywords: ["value chain", "supply chain", "logistics", "procurement", "sourcing", "fulfillment", "fleet", "cold-chain"],
    templateId: "value_chain_pipeline"
  },
  {
    keywords: ["tam", "sam", "som", "market size", "market sizing", "addressable market", "valuation", "trillion", "billion"],
    templateId: "tam_sam_som_pyramid"
  },
  {
    keywords: ["competitive", "matrix", "competitor", "incumbents", "challengers", "quadrant", "positioning", "landscape"],
    templateId: "competitive_matrix_2x2"
  },
  {
    keywords: ["market share", "share distribution", "penetration", "segment share", "pie", "donut", "volume"],
    templateId: "market_share_ring"
  },
  {
    keywords: ["roadmap", "timeline", "quarterly", "milestone", "phases", "rollout", "horizon"],
    templateId: "quarterly_roadmap"
  },
  {
    keywords: ["brand health", "equity", "loyalty", "perception", "nps", "sentiment", "consumer awareness"],
    templateId: "brand_health_matrix"
  },
  {
    keywords: ["omnichannel", "consumer touchpoint", "digital shelf", "retail media", "channels", "ecosystem"],
    templateId: "omnichannel_wheel"
  },
  {
    keywords: ["swot", "strengths", "weaknesses", "opportunities", "threats"],
    templateId: "swot_analysis_grid"
  },
  {
    keywords: ["funnel", "conversion", "retention", "acquisition", "pipeline velocity", "journey"],
    templateId: "conversion_funnel"
  },
  {
    keywords: ["unit economics", "cac", "ltv", "margin", "payback", "ebitda", "financials"],
    templateId: "unit_economics_dashboard"
  }
];

/**
 * Finds the most relevant vector infographic template for a given text prompt or slide context
 */
export function findBestMatchingGraphic(contextText: string): SlideVectorGraphic {
  const normalized = contextText.toLowerCase();

  for (const mapping of KEYWORD_MAPPINGS) {
    if (mapping.keywords.some((kw) => normalized.includes(kw))) {
      const template = INFOGRAPHIC_TEMPLATES.find((t) => t.id === mapping.templateId);
      if (template) {
        return JSON.parse(JSON.stringify(template.defaultData));
      }
    }
  }

  // Fallback to value chain or market pyramid default based on length
  const fallbackId = normalized.includes("market") ? "tam_sam_som_pyramid" : "value_chain_pipeline";
  const fallback = INFOGRAPHIC_TEMPLATES.find((t) => t.id === fallbackId) || INFOGRAPHIC_TEMPLATES[0];
  return JSON.parse(JSON.stringify(fallback.defaultData));
}

/**
 * Enriches a single slide in the background if it can benefit from an infographic
 */
export function enrichSlideWithOptimalVectorGraphic(slide: Slide): Slide {
  if (slide.vectorGraphic) {
    return slide; // Already has an enriched vector graphic
  }

  const combinedText = [
    slide.title,
    slide.subtitle,
    slide.categoryTag,
    ...(slide.bullets || []),
    slide.speakerNotes
  ]
    .filter(Boolean)
    .join(" ");

  const graphic = findBestMatchingGraphic(combinedText);
  return {
    ...slide,
    vectorGraphic: graphic,
    categoryTag: graphic.category === "value_chain" ? "VALUE CHAIN VECTOR" : "MARKET INTELLIGENCE"
  };
}

/**
 * Scans a full deck in the background, identifying analytical slides and attaching
 * high-fidelity infographics to suitable slides (usually 2-3 per deck to avoid visual clutter).
 */
export function enrichDeckWithVectorGraphics(deck: SlideDeck, maxEnrichments: number = 3): SlideDeck {
  let enrichedCount = deck.slides.filter((s) => !!s.vectorGraphic).length;
  if (enrichedCount >= maxEnrichments) return deck;

  const updatedSlides = deck.slides.map((slide, idx) => {
    // Avoid enriching title slide or conclusion
    if (idx === 0 || idx === deck.slides.length - 1) return slide;
    if (slide.vectorGraphic) return slide;
    if (enrichedCount >= maxEnrichments) return slide;

    const combinedText = [slide.title, slide.subtitle, ...(slide.bullets || [])].join(" ").toLowerCase();
    const hasTriggerKeyword = KEYWORD_MAPPINGS.some((m) =>
      m.keywords.some((kw) => combinedText.includes(kw))
    );

    if (hasTriggerKeyword) {
      enrichedCount++;
      return enrichSlideWithOptimalVectorGraphic(slide);
    }
    return slide;
  });

  return {
    ...deck,
    slides: updatedSlides,
    updatedAt: new Date().toISOString()
  };
}
