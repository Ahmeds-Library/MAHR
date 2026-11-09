/**
 * Layer 1 — Starter Prompts, Layout Metadata, and Configuration Options
 */

import { PresentonLayoutType } from "./presentonTypes";

export interface PresentonLayoutMeta {
  id: PresentonLayoutType;
  label: string;
  shortDesc: string;
}

export const PRESENTON_LAYOUT_CATALOG: PresentonLayoutMeta[] = [
  {
    id: "hero-cover",
    label: "Hero Cover",
    shortDesc: "Executive title banner, thesis callout & key highlights"
  },
  {
    id: "split-visual",
    label: "Split Narrative",
    shortDesc: "Structured key points alongside an insight spotlight card"
  },
  {
    id: "kpi-metrics",
    label: "KPI Scorecards",
    shortDesc: "High-impact numeric benchmarks with deltas & context"
  },
  {
    id: "data-chart",
    label: "Data Chart",
    shortDesc: "Interactive SVG Bar, Area, or Donut chart with analysis"
  },
  {
    id: "comparison-grid",
    label: "Comparison Matrix",
    shortDesc: "Side-by-side evaluation of two approaches or options"
  },
  {
    id: "process-timeline",
    label: "Process Roadmap",
    shortDesc: "Sequential 4-stage execution timeline & milestones"
  },
  {
    id: "architecture-pillars",
    label: "Core Pillars",
    shortDesc: "3-column structural framework & architectural layers"
  },
  {
    id: "quote-spotlight",
    label: "Executive Synthesis",
    shortDesc: "High-impact synthesis statement & strategic takeaways"
  }
];

export const PRESENTON_STARTER_PROMPTS = [
  {
    label: "AI Agents in Healthcare",
    topic: "Autonomous AI Agents in Clinical Healthcare Diagnostics & Patient Triage",
    tone: "Executive & Analytical",
    audience: "Hospital Executives & Medical Directors",
    slideCount: 8
  },
  {
    label: "Clean Energy Grid 2030",
    topic: "Next-Generation Solid-State Battery Storage & Smart Microgrid Economics",
    tone: "Data-Driven & Technical",
    audience: "Infrastructure Investors & Policy Makers",
    slideCount: 8
  },
  {
    label: "SaaS Series-A Pitch Deck",
    topic: "B2B Developer Productivity Platform — Series A Venture Pitch & Unit Economics",
    tone: "Persuasive & High-Impact",
    audience: "Venture Capital Partners",
    slideCount: 9
  },
  {
    label: "Quantum Cryptography Lesson",
    topic: "Post-Quantum Cryptography: Lattice-Based Encryption & TLS Migration",
    tone: "Educational & Clear",
    audience: "Computer Science Students & Security Engineers",
    slideCount: 7
  }
];

export const PRESENTON_TONE_OPTIONS = [
  "Executive & Analytical",
  "Educational & Clear",
  "Persuasive & Pitch-Ready",
  "Data-Driven & Technical",
  "Academic & Research-Focused"
];

export const PRESENTON_LANGUAGE_OPTIONS = [
  "English",
  "Urdu (Roman / Script)",
  "Spanish",
  "Arabic",
  "French",
  "German",
  "Chinese"
];
