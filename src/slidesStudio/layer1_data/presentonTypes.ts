/**
 * LAYER 1: Presenton Autonomous Multimedia Presentation Studio Data & Types
 * Inspired by https://github.com/presenton/presenton + Keynote/PowerPoint Motion & Autonomous Multi-Modal Media
 */

import { SlideLayout, SlideStat, SlideWebCitation } from "../../services/slides/slideTypes";

export type SlideTransitionPreset =
  | "morph_smooth"
  | "cube_3d"
  | "parallax_wipe"
  | "zoom_spotlight"
  | "cinematic_fade";

export type ElementEntrancePreset =
  | "stagger_cascade"
  | "typewriter_reveal"
  | "spring_pop"
  | "svg_draw_in"
  | "spotlight_glow";

export type AutonomousMediaKind =
  | "ai_concept_image"
  | "svg_infographic"
  | "animated_gif_loop"
  | "procedural_60fps_video";

export interface InfographicDataSeries {
  label: string;
  value: number;
  secondaryValue?: number;
  unit?: string;
  color?: string;
}

export interface AutonomousSlideMediaBundle {
  activeTab: AutonomousMediaKind;
  // 1. High-Res AI Concept Illustration (SVG/Canvas Data URI + Prompt)
  aiImage: {
    dataUrl: string;
    promptUsed: string;
    caption: string;
    aspectRatio: "16:9" | "4:3";
  };
  // 2. Structured Data Infographic / Chart
  infographic: {
    chartType: "bar_comparison" | "area_trajectory" | "radial_gauge" | "architecture_flow";
    title: string;
    subtitle: string;
    series: InfographicDataSeries[];
    takeawayBadge: string;
  };
  // 3. Animated GIF / Motion Loop Config
  animatedGif: {
    loopStyle: "neural_pulse" | "orbital_system" | "data_stream_matrix" | "wave_harmonics";
    headline: string;
    caption: string;
    accentHex: string;
    secondaryHex: string;
    fps: number;
  };
  // 4. Embedded 60FPS Procedural Presentation Video
  embeddedVideo: {
    sceneType: "3d_topology_flythrough" | "algorithmic_simulation" | "architecture_pipeline" | "executive_data_story";
    title: string;
    durationSeconds: number;
    narrationScript: string;
    keyframeLabels: string[];
    autoPlayInPresentMode: boolean;
  };
  factCheckConfidence: number; // e.g., 99.4%
  verifiedSources: string[];
}

export interface PresentonSlideOutline {
  id: string;
  slideNumber: number;
  layout: SlideLayout;
  title: string;
  subtitle: string;
  categoryTag: string;
  bullets: string[];
  stats?: SlideStat[];
  callout?: string;
  speakerNotes: string;
  transitionPreset: SlideTransitionPreset;
  entrancePreset: ElementEntrancePreset;
  preferredMediaKind: AutonomousMediaKind;
  citations: SlideWebCitation[];
}

export interface PresentonIngestionConfig {
  topicPrompt: string;
  audience: string;
  slideCount: number;
  themeId: string;
  defaultTransition: SlideTransitionPreset;
  defaultEntrance: ElementEntrancePreset;
  includeStudyPad: boolean;
  includeObsidianVault: boolean;
  includeWebGrounding: boolean;
  autoGenerateAllMedia: boolean; // Images + Infographics + GIFs + Videos
}

export const SLIDE_TRANSITION_METADATA: Record<
  SlideTransitionPreset,
  { name: string; badge: string; description: string }
> = {
  morph_smooth: {
    name: "Keynote Magic Morph",
    badge: "MORPH",
    description: "Seamless geometric interpolation and fluid depth scaling across slide states"
  },
  cube_3d: {
    name: "PowerPoint 3D Cube",
    badge: "3D CUBE",
    description: "True 3D perspective rotation along the Y/Z stage axes with specular lighting"
  },
  parallax_wipe: {
    name: "Cinematic Parallax",
    badge: "PARALLAX",
    description: "Multi-layer differential velocity sweep between foreground cards and media"
  },
  zoom_spotlight: {
    name: "Optical Zoom Reveal",
    badge: "OPTICAL",
    description: "Camera focal pull from macro concept canvas into high-precision typography"
  },
  cinematic_fade: {
    name: "Executive Dissolve",
    badge: "DISSOLVE",
    description: "Ultra-clean studio cross-fade with staggered cubic-bezier micro-motion"
  }
};

export const ELEMENT_ENTRANCE_METADATA: Record<
  ElementEntrancePreset,
  { name: string; description: string }
> = {
  stagger_cascade: {
    name: "Staggered Cascade",
    description: "Sequential 80ms vertical reveal for headings, bullets, and media cards"
  },
  typewriter_reveal: {
    name: "Precision Kinetic Text",
    description: "Crisp technical title lock-in followed by spring-damped bullet cards"
  },
  spring_pop: {
    name: "Elastic Physics Pop",
    description: "High-energy spring-physics entrance for KPI counters and visual callouts"
  },
  svg_draw_in: {
    name: "Vector Path Draw-In",
    description: "Progressive stroke-dashoffset rendering for charts, diagrams, and borders"
  },
  spotlight_glow: {
    name: "Ambient Spotlight",
    description: "Radial luminescence sweep highlighting primary multimedia and citations"
  }
};
