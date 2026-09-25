export type SlideLayout =
  | "title"
  | "bullets"
  | "columns"
  | "quote"
  | "stats"
  | "timeline"
  | "summary"
  | "media";

export interface SlideStat {
  label: string;
  value: string;
  description?: string;
}

export interface SlideWebCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface SlideMediaItem {
  type: "image" | "video";
  url: string;
  title?: string;
  thumbnailUrl?: string;
  caption?: string;
  videoId?: string;
}

export interface Slide {
  id: string;
  slideNumber: number;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  categoryTag?: string;
  bullets?: string[];
  stats?: SlideStat[];
  quote?: string;
  quoteAuthor?: string;
  callout?: string;
  speakerNotes?: string;
  animationStyle?: "fade" | "slide-up" | "zoom-in" | "stagger";
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoId?: string;
  citations?: SlideWebCitation[];
  mediaItems?: SlideMediaItem[];
}

export interface SlideTheme {
  id: string;
  name: string;
  description: string;
  bgGradient: string;
  slideBg: string;
  cardBg: string;
  borderCol: string;
  textPrimary: string;
  textSecondary: string;
  accentCol: string;
  accentGlow: string;
  fontHeading: string;
  fontBody: string;
  googleRgb: {
    background: { red: number; green: number; blue: number };
    titleText: { red: number; green: number; blue: number };
    bodyText: { red: number; green: number; blue: number };
    accent: { red: number; green: number; blue: number };
  };
}

export interface SlideDeck {
  id: string;
  title: string;
  subtitle?: string;
  topic: string;
  audience: string;
  themeId: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
  googlePresentationId?: string;
  googlePresentationUrl?: string;
}

export type AssistantQuestionStep =
  | "intro"
  | "ask_topic"
  | "ask_audience"
  | "ask_slide_count"
  | "ask_visual_tone"
  | "generating"
  | "ready"
  | "refining";

export interface AssistantChatMessage {
  id: string;
  role: "mahr" | "user";
  text: string;
  timestamp: string;
  quickReplies?: string[];
  deckSnapshot?: Partial<SlideDeck>;
}
