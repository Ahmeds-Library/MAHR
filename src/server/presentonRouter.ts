import express, { type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { getSafeGeminiApiKey } from "../../server_vault.ts";

export const presentonRouter = express.Router();

const LAYOUT_ROTATION = [
  "hero-cover",
  "split-visual",
  "kpi-metrics",
  "architecture-pillars",
  "data-chart",
  "comparison-grid",
  "process-timeline",
  "quote-spotlight"
] as const;

function getCandidateModels(): string[] {
  return ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash-preview"];
}

function extractFirstJsonBlock(rawText: string): any {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Could not parse JSON from Gemini response");
  }
}

function buildTopicSpecificOutlineFallback(params: {
  topic: string;
  slideCount: number;
  tone: string;
  audience: string;
  documentContext?: string;
}) {
  const { topic, slideCount, tone, audience, documentContext } = params;
  const cleanTopic = topic.trim() || "Strategic Topic Overview";
  const count = Math.min(15, Math.max(4, Number(slideCount) || 8));

  const docLines = (documentContext || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 25)
    .slice(0, 12);

  const slideBlueprints = [
    {
      title: `${cleanTopic}: Executive Overview & Vision`,
      recommendedLayout: "hero-cover",
      keyPoints: [
        `Core definition, scope, and strategic relevance of ${cleanTopic} for ${audience}`,
        `Primary objectives and foundational thesis driving modern adoption`,
        docLines[0] || `Key transformation drivers reshaping how organizations approach ${cleanTopic}`
      ],
      visualIntent: `High-impact hero illustration representing ${cleanTopic}`
    },
    {
      title: `Core Concepts & Fundamental Mechanics of ${cleanTopic}`,
      recommendedLayout: "split-visual",
      keyPoints: [
        `How ${cleanTopic} operates at a foundational and operational level`,
        docLines[1] || `Critical components, workflows, and underlying principles`,
        `Why traditional approaches fall short compared to modern ${cleanTopic} methodologies`
      ],
      visualIntent: `Conceptual diagram showing the core workflow of ${cleanTopic}`
    },
    {
      title: `Key Performance Indicators & Impact Benchmarks`,
      recommendedLayout: "kpi-metrics",
      keyPoints: [
        `Quantifiable efficiency, quality, and adoption benchmarks for ${cleanTopic}`,
        docLines[2] || `Measurable ROI and performance gains observed in real-world implementations`,
        `Critical success metrics tracked by ${audience}`
      ],
      visualIntent: `Executive KPI scorecards highlighting key metrics for ${cleanTopic}`
    },
    {
      title: `Architectural Pillars & Structural Framework`,
      recommendedLayout: "architecture-pillars",
      keyPoints: [
        `Pillar 1: Foundation, governance, and core infrastructure for ${cleanTopic}`,
        `Pillar 2: Execution engine, integration workflows, and automation`,
        `Pillar 3: Continuous optimization, analytics, and scaling strategy`
      ],
      visualIntent: `3-pillar structural blueprint for ${cleanTopic}`
    },
    {
      title: `Data Trends & Quantitative Growth Trajectory`,
      recommendedLayout: "data-chart",
      keyPoints: [
        `Multi-stage progression and adoption curve across key segments`,
        docLines[3] || `Comparative performance improvements across implementation phases`,
        `Data-backed projections and resource allocation priorities`
      ],
      visualIntent: `Comparative bar and trend chart illustrating ${cleanTopic} progression`
    },
    {
      title: `Comparative Analysis: Legacy vs. Next-Gen ${cleanTopic}`,
      recommendedLayout: "comparison-grid",
      keyPoints: [
        `Side-by-side evaluation of conventional methods versus modern ${cleanTopic} practices`,
        `Trade-offs in speed, scalability, reliability, and total cost of ownership`,
        `Decision matrix for selecting the right approach`
      ],
      visualIntent: `Two-column structured comparison matrix`
    },
    {
      title: `Implementation Roadmap & Execution Timeline`,
      recommendedLayout: "process-timeline",
      keyPoints: [
        `Phase 1: Discovery, baseline assessment, and alignment on ${cleanTopic}`,
        `Phase 2: Pilot deployment, validation, and iterative refinement`,
        `Phase 3: Full-scale rollout, monitoring, and long-term governance`
      ],
      visualIntent: `Step-by-step milestone roadmap for ${cleanTopic}`
    },
    {
      title: `Strategic Synthesis & Actionable Next Steps`,
      recommendedLayout: "quote-spotlight",
      keyPoints: [
        `Executive synthesis of the most important takeaways on ${cleanTopic}`,
        `Immediate priority actions and recommended next steps for ${audience}`,
        `Long-term outlook and sustainable competitive advantage`
      ],
      visualIntent: `Spotlight synthesis card with key takeaway callout`
    }
  ];

  const items = Array.from({ length: count }).map((_, idx) => {
    const template = slideBlueprints[idx % slideBlueprints.length];
    const suffix = idx >= slideBlueprints.length ? ` (Part ${Math.floor(idx / slideBlueprints.length) + 1})` : "";
    return {
      id: `outline-${idx + 1}`,
      slideNumber: idx + 1,
      title: `${template.title}${suffix}`,
      recommendedLayout: idx === 0 ? "hero-cover" : template.recommendedLayout,
      keyPoints: template.keyPoints,
      visualIntent: template.visualIntent,
      researchFacts: docLines[idx] ? [docLines[idx]] : []
    };
  });

  return {
    topic: cleanTopic,
    title: cleanTopic,
    subtitle: `${tone} Presentation prepared for ${audience}`,
    audience,
    tone,
    outline: items,
    citations: []
  };
}

/**
 * POST /api/presenton/outline
 * Step 1 -> Step 2: Generates a structured, editable slide-by-slide outline using Gemini + optional Google Search Grounding.
 */
presentonRouter.post("/presenton/outline", async (req: Request, res: Response) => {
  try {
    const {
      topic = "",
      customInstructions = "",
      slideCount = 8,
      tone = "Executive & Analytical",
      audience = "Decision Makers & Peers",
      language = "English",
      enableWebSearch = true,
      documentContext = "",
      documentName = ""
    } = req.body || {};

    const cleanTopic = String(topic || documentName || "Strategic Presentation").trim();
    const targetCount = Math.min(15, Math.max(4, Number(slideCount) || 8));

    const apiKey = getSafeGeminiApiKey();
    if (!apiKey) {
      return res.json(
        buildTopicSpecificOutlineFallback({
          topic: cleanTopic,
          slideCount: targetCount,
          tone,
          audience,
          documentContext
        })
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const models = getCandidateModels();

    const docSection = documentContext
      ? `\n\nUPLOADED REFERENCE DOCUMENT (${documentName || "Attached Document"}):\n"""\n${String(documentContext).slice(0, 14000)}\n"""\nUse the facts, structure, and details from this document as primary source material.`
      : "";

    const instructionsSection = customInstructions
      ? `\nUSER CUSTOM INSTRUCTIONS:\n${String(customInstructions).slice(0, 3000)}`
      : "";

    const prompt = `You are Presenton, a world-class AI Presentation Architect.
Create a deeply researched, topic-specific ${targetCount}-slide presentation outline about:
TOPIC: "${cleanTopic}"
TARGET AUDIENCE: ${audience}
TONE / STYLE: ${tone}
LANGUAGE: ${language}${instructionsSection}${docSection}

CRITICAL RULES:
1. Every single slide title and bullet point MUST be 100% specific to "${cleanTopic}". NEVER use generic placeholder jargon.
2. Assign each slide the most fitting layout from this exact list:
   - "hero-cover" (Always use for Slide 1)
   - "split-visual" (Concept explanation + visual breakdown)
   - "kpi-metrics" (Quantifiable statistics, percentages, benchmarks, or key numbers)
   - "data-chart" (Data trends, comparisons across categories/years, distributions)
   - "comparison-grid" (Side-by-side pros/cons, before/after, or multi-option comparison)
   - "process-timeline" (Chronological history, step-by-step workflow, or implementation roadmap)
   - "architecture-pillars" (3 to 4 core pillars, layers, or foundational components)
   - "quote-spotlight" (Key insight, synthesis, expert principle, or conclusion)
3. Return ONLY valid JSON matching this exact structure (no markdown fences):
{
  "title": "Compelling Presentation Title",
  "subtitle": "Clear, insightful subtitle tailored to the topic and audience",
  "outline": [
    {
      "slideNumber": 1,
      "title": "Specific Slide Title",
      "recommendedLayout": "hero-cover",
      "keyPoints": [
        "Detailed, factual point 1 specific to the topic",
        "Detailed, factual point 2 specific to the topic",
        "Detailed, factual point 3 specific to the topic"
      ],
      "visualIntent": "Description of the visual, chart, or diagram for this slide",
      "researchFacts": ["Specific real-world stat, date, or fact grounding this slide"]
    }
  ]
}`;

    let parsedResult: any = null;
    let extractedCitations: Array<{ title: string; url: string }> = [];

    for (const modelName of models) {
      try {
        const config: Record<string, any> = {
          temperature: 0.4
        };
        if (enableWebSearch) {
          config.tools = [{ googleSearch: {} }];
        } else {
          config.responseMimeType = "application/json";
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config
        });

        const rawText = response.text || "";
        parsedResult = extractFirstJsonBlock(rawText);

        const groundingChunks =
          (response as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of groundingChunks) {
          if (chunk?.web?.uri && chunk?.web?.title) {
            extractedCitations.push({
              title: String(chunk.web.title),
              url: String(chunk.web.uri)
            });
          }
        }

        if (parsedResult && Array.isArray(parsedResult.outline) && parsedResult.outline.length > 0) {
          break;
        }
      } catch (err) {
        console.warn(`[Presenton Outline] Model ${modelName} attempt failed:`, (err as Error)?.message);
      }
    }

    if (!parsedResult || !Array.isArray(parsedResult.outline) || parsedResult.outline.length === 0) {
      return res.json(
        buildTopicSpecificOutlineFallback({
          topic: cleanTopic,
          slideCount: targetCount,
          tone,
          audience,
          documentContext
        })
      );
    }

    const normalizedOutline = parsedResult.outline.slice(0, targetCount).map((item: any, idx: number) => {
      const validLayout = LAYOUT_ROTATION.includes(item.recommendedLayout)
        ? item.recommendedLayout
        : LAYOUT_ROTATION[idx % LAYOUT_ROTATION.length];
      return {
        id: `outline-${idx + 1}-${Date.now()}`,
        slideNumber: idx + 1,
        title: String(item.title || `${cleanTopic} — Slide ${idx + 1}`),
        recommendedLayout: idx === 0 ? "hero-cover" : validLayout,
        keyPoints: Array.isArray(item.keyPoints) && item.keyPoints.length > 0
          ? item.keyPoints.map((kp: any) => String(kp))
          : [`Key analysis and insights for ${cleanTopic}`],
        visualIntent: String(item.visualIntent || `Visual illustration of ${item.title || cleanTopic}`),
        researchFacts: Array.isArray(item.researchFacts)
          ? item.researchFacts.map((f: any) => String(f))
          : []
      };
    });

    return res.json({
      topic: cleanTopic,
      title: String(parsedResult.title || cleanTopic),
      subtitle: String(parsedResult.subtitle || `${tone} Presentation for ${audience}`),
      audience,
      tone,
      outline: normalizedOutline,
      citations: extractedCitations.slice(0, 8)
    });
  } catch (error) {
    console.error("[Presenton Outline Error]:", error);
    return res.status(500).json({
      error: "Failed to generate presentation outline",
      details: (error as Error)?.message
    });
  }
});

/**
 * POST /api/presenton/generate-deck
 * Step 3 -> Step 4: Expands the user-approved outline into full structured Presenton slides.
 */
presentonRouter.post("/presenton/generate-deck", async (req: Request, res: Response) => {
  try {
    const {
      topic = "",
      title = "",
      subtitle = "",
      audience = "Decision Makers",
      tone = "Executive & Analytical",
      language = "English",
      themeId = "midnight-executive",
      outline = [],
      documentContext = "",
      customInstructions = "",
      citations = []
    } = req.body || {};

    const cleanTopic = String(topic || title || "Presentation").trim();
    const outlineList = Array.isArray(outline) && outline.length > 0 ? outline : [];

    const apiKey = getSafeGeminiApiKey();

    if (apiKey && outlineList.length > 0) {
      const ai = new GoogleGenAI({ apiKey });
      const models = getCandidateModels();

      const docSnippet = documentContext
        ? `\nREFERENCE DOCUMENT CONTEXT:\n"""\n${String(documentContext).slice(0, 10000)}\n"""`
        : "";

      const prompt = `You are Presenton, an expert AI Presentation Designer and Subject Matter Specialist.
Generate the complete, rich slide deck content in ${language} for the approved outline below.

PRESENTATION TOPIC: "${cleanTopic}"
TITLE: "${title || cleanTopic}"
SUBTITLE: "${subtitle}"
AUDIENCE: ${audience}
TONE: ${tone}
${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ""}${docSnippet}

APPROVED SLIDE OUTLINE:
${JSON.stringify(outlineList, null, 2)}

CRITICAL REQUIREMENTS FOR EACH SLIDE:
1. Keep the exact slide count (${outlineList.length} slides) and honor each slide's "recommendedLayout" as its "layout".
2. Every slide MUST contain rich, accurate, topic-specific content—NEVER generic filler.
3. Populate layout-specific structured fields for EVERY slide so the user can switch layouts at any time:
   - "bullets": 3 to 4 crisp, informative bullet points (12–25 words each).
   - "metrics": Array of 3 KPI objects: { "label": "Metric Name", "value": "e.g. 94% or 3.2x or $4.8B", "delta": "+18% YoY", "description": "Short context" }.
   - "chartData": { "chartType": "bar" | "area" | "donut", "title": "Chart Title", "unit": "% or USD or Score", "series": [ { "label": "Category/Year 1", "value": 42, "secondaryValue": 28 }, { "label": "Category/Year 2", "value": 68, "secondaryValue": 45 }, { "label": "Category/Year 3", "value": 85, "secondaryValue": 60 }, { "label": "Category/Year 4", "value": 96, "secondaryValue": 74 } ] } (values must be realistic numbers).
   - "comparisonColumns": Array of 2 comparison objects: [ { "heading": "Option / Approach A", "badge": "Baseline", "points": ["Point 1", "Point 2", "Point 3"] }, { "heading": "Option / Approach B", "badge": "Recommended", "points": ["Point 1", "Point 2", "Point 3"] } ].
   - "timelineSteps": Array of 4 sequential steps: [ { "phase": "Phase 1", "title": "Step Title", "description": "Concise explanation" } ].
   - "pillars": Array of 3 structural pillars: [ { "tag": "01", "title": "Pillar Name", "description": "Detailed explanation of this pillar" } ].
   - "quote": { "text": "Compelling executive insight or synthesis statement specific to the slide topic", "author": "Domain Synthesis / Research Insight", "role": "${cleanTopic}" }.
   - "speakerNotes": 2–3 natural sentences that Mahr (the AI voice presenter) can speak aloud when presenting this slide.

Return ONLY valid JSON with this structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "layout": "hero-cover",
      "categoryTag": "EXECUTIVE BRIEFING",
      "title": "...",
      "subtitle": "...",
      "callout": "Key single-sentence takeaway for the bottom banner",
      "bullets": ["...", "...", "..."],
      "metrics": [...],
      "chartData": {...},
      "comparisonColumns": [...],
      "timelineSteps": [...],
      "pillars": [...],
      "quote": {...},
      "speakerNotes": "..."
    }
  ]
}`;

      for (const modelName of models) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.35,
              responseMimeType: "application/json"
            }
          });

          const parsed = extractFirstJsonBlock(response.text || "");
          if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
            const enrichedSlides = parsed.slides.map((s: any, idx: number) => {
              const outlineItem = outlineList[idx] || {};
              return normalizePresentonSlide(s, outlineItem, idx, cleanTopic);
            });

            return res.json({
              id: `presenton-deck-${Date.now()}`,
              title: String(title || cleanTopic),
              subtitle: String(subtitle || `${tone} Presentation for ${audience}`),
              topic: cleanTopic,
              audience,
              tone,
              language,
              themeId,
              slides: enrichedSlides,
              citations: Array.isArray(citations) ? citations : [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn(`[Presenton GenerateDeck] Model ${modelName} failed:`, (err as Error)?.message);
        }
      }
    }

    // Topic-faithful fallback synthesis directly from the approved outline
    const fallbackSlides = (outlineList.length > 0
      ? outlineList
      : buildTopicSpecificOutlineFallback({
          topic: cleanTopic,
          slideCount: 8,
          tone,
          audience,
          documentContext
        }).outline
    ).map((outlineItem: any, idx: number) =>
      normalizePresentonSlide({}, outlineItem, idx, cleanTopic)
    );

    return res.json({
      id: `presenton-deck-${Date.now()}`,
      title: String(title || cleanTopic),
      subtitle: String(subtitle || `${tone} Presentation for ${audience}`),
      topic: cleanTopic,
      audience,
      tone,
      language,
      themeId,
      slides: fallbackSlides,
      citations: Array.isArray(citations) ? citations : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("[Presenton GenerateDeck Error]:", error);
    return res.status(500).json({
      error: "Failed to generate presentation deck",
      details: (error as Error)?.message
    });
  }
});

/**
 * POST /api/presenton/edit-slide
 * AI Copilot endpoint for modifying a single slide via natural language or Mahr voice command.
 */
presentonRouter.post("/presenton/edit-slide", async (req: Request, res: Response) => {
  try {
    const { slide, instruction, topic = "" } = req.body || {};
    if (!slide || !instruction) {
      return res.status(400).json({ error: "Both slide and instruction are required" });
    }

    const apiKey = getSafeGeminiApiKey();
    if (!apiKey) {
      return res.json({
        slide: {
          ...slide,
          subtitle: `${slide.subtitle || ""} — Updated: ${instruction}`.trim()
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are Presenton's AI Slide Copilot.
Update the following slide JSON according to the user's instruction.
PRESENTATION TOPIC: "${topic || slide.title}"
USER INSTRUCTION: "${instruction}"

CURRENT SLIDE JSON:
${JSON.stringify(slide, null, 2)}

Allowed values for "layout":
"hero-cover", "split-visual", "kpi-metrics", "data-chart", "comparison-grid", "process-timeline", "architecture-pillars", "quote-spotlight".
If the user asks to change the layout (e.g. "show as chart", "make it a timeline", "use KPI metrics", "compare options"), update "layout" accordingly and ensure the corresponding data fields (metrics, chartData, comparisonColumns, timelineSteps, pillars, quote, bullets) are richly populated and accurate.

Return ONLY the updated slide as valid JSON.`;

    for (const modelName of getCandidateModels()) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.35,
            responseMimeType: "application/json"
          }
        });
        const updated = extractFirstJsonBlock(response.text || "");
        if (updated && updated.title) {
          return res.json({
            slide: normalizePresentonSlide(updated, slide, (slide.slideNumber || 1) - 1, topic || slide.title)
          });
        }
      } catch (err) {
        console.warn(`[Presenton EditSlide] Model ${modelName} failed:`, (err as Error)?.message);
      }
    }

    return res.json({ slide });
  } catch (error) {
    console.error("[Presenton EditSlide Error]:", error);
    return res.status(500).json({ error: "Failed to edit slide" });
  }
});

function normalizePresentonSlide(raw: any, outlineItem: any, idx: number, topic: string) {
  const slideNum = idx + 1;
  const fallbackLayout = outlineItem?.recommendedLayout || LAYOUT_ROTATION[idx % LAYOUT_ROTATION.length];
  const layout = LAYOUT_ROTATION.includes(raw?.layout) ? raw.layout : fallbackLayout;
  const slideTitle = String(raw?.title || outlineItem?.title || `${topic} — Key Insight ${slideNum}`);
  const bullets: string[] =
    Array.isArray(raw?.bullets) && raw.bullets.length > 0
      ? raw.bullets.map((b: any) => String(b))
      : Array.isArray(outlineItem?.keyPoints) && outlineItem.keyPoints.length > 0
      ? outlineItem.keyPoints.map((b: any) => String(b))
      : [
          `Core strategic dimension of ${slideTitle}`,
          `Operational execution and measurable outcomes for ${topic}`,
          `Long-term sustainability and synthesis recommendations`
        ];

  const metrics =
    Array.isArray(raw?.metrics) && raw.metrics.length >= 2
      ? raw.metrics.slice(0, 4).map((m: any, mIdx: number) => ({
          label: String(m?.label || `Indicator ${mIdx + 1}`),
          value: String(m?.value || `${82 + mIdx * 6}%`),
          delta: String(m?.delta || `+${12 + mIdx * 4}%`),
          description: String(m?.description || bullets[mIdx % bullets.length] || "")
        }))
      : [
          {
            label: "Strategic Impact",
            value: "92%",
            delta: "+24% Benchmark",
            description: bullets[0] || `High-impact alignment across ${topic}`
          },
          {
            label: "Execution Velocity",
            value: "2.8x",
            delta: "+40% Efficiency",
            description: bullets[1] || `Accelerated workflow delivery`
          },
          {
            label: "Adoption Confidence",
            value: "96.4%",
            delta: "Verified Tier-1",
            description: bullets[2] || `Consistent reliability across core stages`
          }
        ];

  const chartSeries =
    Array.isArray(raw?.chartData?.series) && raw.chartData.series.length >= 2
      ? raw.chartData.series.slice(0, 6).map((pt: any, pIdx: number) => ({
          label: String(pt?.label || `Stage ${pIdx + 1}`),
          value: Number(pt?.value) || 45 + pIdx * 15,
          secondaryValue: Number(pt?.secondaryValue) || 30 + pIdx * 12
        }))
      : [
          { label: "Baseline", value: 42, secondaryValue: 30 },
          { label: "Phase 1", value: 64, secondaryValue: 48 },
          { label: "Phase 2", value: 81, secondaryValue: 65 },
          { label: "Target State", value: 95, secondaryValue: 82 }
        ];

  const chartType = ["bar", "area", "donut"].includes(raw?.chartData?.chartType)
    ? raw.chartData.chartType
    : idx % 3 === 0
    ? "bar"
    : idx % 3 === 1
    ? "area"
    : "donut";

  const comparisonColumns =
    Array.isArray(raw?.comparisonColumns) && raw.comparisonColumns.length >= 2
      ? raw.comparisonColumns.slice(0, 2).map((col: any, cIdx: number) => ({
          heading: String(col?.heading || (cIdx === 0 ? "Conventional Approach" : `Modern ${topic} Strategy`)),
          badge: String(col?.badge || (cIdx === 0 ? "Legacy" : "Recommended")),
          points:
            Array.isArray(col?.points) && col.points.length > 0
              ? col.points.map((p: any) => String(p))
              : bullets
        }))
      : [
          {
            heading: "Conventional Baseline",
            badge: "Standard",
            points: [
              `Fragmented workflows and manual coordination in ${topic}`,
              `Delayed feedback loops and reactive decision-making`,
              `Higher overhead when scaling across teams`
            ]
          },
          {
            heading: `Next-Gen ${topic} Framework`,
            badge: "Optimal",
            points: bullets.slice(0, 3)
          }
        ];

  const timelineSteps =
    Array.isArray(raw?.timelineSteps) && raw.timelineSteps.length >= 2
      ? raw.timelineSteps.slice(0, 4).map((step: any, sIdx: number) => ({
          phase: String(step?.phase || `Stage 0${sIdx + 1}`),
          title: String(step?.title || `Milestone ${sIdx + 1}`),
          description: String(step?.description || bullets[sIdx % bullets.length] || "")
        }))
      : bullets.slice(0, 4).map((b, sIdx) => ({
          phase: `Phase 0${sIdx + 1}`,
          title: b.split(":")[0]?.slice(0, 42) || `Stage ${sIdx + 1}`,
          description: b
        }));

  const pillars =
    Array.isArray(raw?.pillars) && raw.pillars.length >= 2
      ? raw.pillars.slice(0, 4).map((p: any, pIdx: number) => ({
          tag: String(p?.tag || `0${pIdx + 1}`),
          title: String(p?.title || `Core Pillar ${pIdx + 1}`),
          description: String(p?.description || bullets[pIdx % bullets.length] || "")
        }))
      : bullets.slice(0, 3).map((b, pIdx) => ({
          tag: `0${pIdx + 1}`,
          title: b.split(":")[0]?.slice(0, 38) || `Pillar ${pIdx + 1}`,
          description: b
        }));

  const quote = {
    text: String(raw?.quote?.text || bullets[0] || slideTitle),
    author: String(raw?.quote?.author || `Executive Insight — ${topic}`),
    role: String(raw?.quote?.role || "Presenton Research Synthesis")
  };

  return {
    id: String(raw?.id || outlineItem?.id || `slide-${slideNum}-${Date.now()}`),
    slideNumber: slideNum,
    layout,
    categoryTag: String(raw?.categoryTag || `SLIDE 0${slideNum} • ${topic.slice(0, 28).toUpperCase()}`),
    title: slideTitle,
    subtitle: String(raw?.subtitle || outlineItem?.visualIntent || `Key analytical breakdown of ${slideTitle}`),
    callout: String(raw?.callout || bullets[bullets.length - 1] || `Core takeaway for ${slideTitle}`),
    bullets,
    metrics,
    chartData: {
      chartType,
      title: String(raw?.chartData?.title || `${slideTitle} — Performance Trajectory`),
      unit: String(raw?.chartData?.unit || "Index"),
      series: chartSeries
    },
    comparisonColumns,
    timelineSteps,
    pillars,
    quote,
    speakerNotes: String(
      raw?.speakerNotes ||
        `In this slide on ${slideTitle}, we examine ${bullets[0] || topic}. Furthermore, ${
          bullets[1] || "we highlight the core operational takeaways."
        }`
    )
  };
}
