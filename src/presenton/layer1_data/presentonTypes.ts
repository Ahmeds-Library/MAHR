/**
 * Layer 1 — Data & Domain Schema for Presenton AI Presentation Studio
 */

export type PresentonWizardStep =
  | "step1_input"
  | "step2_outline"
  | "step3_theme"
  | "step4_studio";

export type PresentonLayoutType =
  | "hero-cover"
  | "split-visual"
  | "kpi-metrics"
  | "data-chart"
  | "comparison-grid"
  | "process-timeline"
  | "architecture-pillars"
  | "quote-spotlight";

export interface PresentonCitation {
  title: string;
  url: string;
}

export interface PresentonOutlineItem {
  id: string;
  slideNumber: number;
  title: string;
  recommendedLayout: PresentonLayoutType;
  keyPoints: string[];
  visualIntent: string;
  researchFacts?: string[];
}

export interface PresentonMetricItem {
  label: string;
  value: string;
  delta?: string;
  description?: string;
}

export interface PresentonChartSeriesPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface PresentonChartData {
  chartType: "bar" | "area" | "donut";
  title: string;
  unit?: string;
  series: PresentonChartSeriesPoint[];
}

export interface PresentonComparisonColumn {
  heading: string;
  badge?: string;
  points: string[];
}

export interface PresentonTimelineStep {
  phase: string;
  title: string;
  description: string;
}

export interface PresentonPillarItem {
  tag: string;
  title: string;
  description: string;
}

export interface PresentonQuoteData {
  text: string;
  author: string;
  role?: string;
}

export interface PresentonSlide {
  id: string;
  slideNumber: number;
  layout: PresentonLayoutType;
  categoryTag: string;
  title: string;
  subtitle: string;
  callout?: string;
  bullets: string[];
  metrics: PresentonMetricItem[];
  chartData: PresentonChartData;
  comparisonColumns: PresentonComparisonColumn[];
  timelineSteps: PresentonTimelineStep[];
  pillars: PresentonPillarItem[];
  quote: PresentonQuoteData;
  speakerNotes: string;
}

export interface PresentonDeck {
  id: string;
  title: string;
  subtitle: string;
  topic: string;
  audience: string;
  tone: string;
  language: string;
  themeId: string;
  slides: PresentonSlide[];
  citations: PresentonCitation[];
  createdAt: string;
  updatedAt: string;
}

export interface PresentonInputConfig {
  topic: string;
  customInstructions: string;
  slideCount: number;
  tone: string;
  audience: string;
  language: string;
  enableWebSearch: boolean;
  documentName: string;
  documentContext: string;
}

export interface PresentonTheme {
  id: string;
  name: string;
  tagline: string;
  isDark: boolean;
  canvasBg: string;
  slideSurface: string;
  cardSurface: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentHex: string;
  accentSecondaryHex: string;
  badgeBg: string;
  badgeText: string;
  fontHeading: string;
  fontBody: string;
  pptxColors: {
    background: string;
    cardBg: string;
    title: string;
    body: string;
    accent: string;
    border: string;
  };
  googleRgb: {
    background: { red: number; green: number; blue: number };
    titleText: { red: number; green: number; blue: number };
    bodyText: { red: number; green: number; blue: number };
    accent: { red: number; green: number; blue: number };
  };
}
