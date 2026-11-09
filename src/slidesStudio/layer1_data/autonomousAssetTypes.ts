/**
 * LAYER 1: Autonomous Asset Panel, Custom Upload & Smart Bento Auto-Layout Types
 * Supports drag-and-drop of AI Infographics, 60FPS GIFs, 60FPS Videos, Concept Art,
 * and Custom User Uploads directly onto slides, plus automatic Bento Grid Reflow.
 */

import {
  AutonomousMediaKind,
  InfographicDataSeries
} from "./presentonTypes";

export const PRESENTON_ASSET_DRAG_MIME = "application/x-mahr-presenton-asset";

export type SlideAssetArrangement =
  | "split_right"
  | "split_left"
  | "hero_top"
  | "pip_corner"
  | "full_canvas";

export type BentoCompositionPreset =
  | "single_spotlight"
  | "dual_vertical"
  | "dual_side_by_side"
  | "triple_hero_left"
  | "triple_hero_top"
  | "quad_bento_matrix";

export type TextMediaBalancePreset =
  | "text_lead"
  | "balanced"
  | "media_dominant";

export interface SlideAutoLayoutConfig {
  enabled: boolean;
  bentoComposition: BentoCompositionPreset;
  textMediaBalance: TextMediaBalancePreset;
  showGridGuides?: boolean;
  lastReflowTimestamp?: number;
}

export type UploadedMediaKind = "image" | "video" | "gif" | "svg";

export interface AutonomousAssetItem {
  id: string;
  title: string;
  subtitle: string;
  kind: AutonomousMediaKind;
  promptUsed: string;
  previewDataUrl: string;
  accentHex: string;
  sourceSlideNumber?: number;
  // Custom User Upload fields
  isCustomUpload?: boolean;
  uploadedMediaType?: UploadedMediaKind;
  customMediaUrl?: string;
  mimeType?: string;
  fileSizeLabel?: string;
  // Modality-specific payloads
  infographicConfig?: {
    chartType: "bar_comparison" | "area_trajectory" | "radial_gauge" | "architecture_flow";
    series: InfographicDataSeries[];
    takeawayBadge: string;
  };
  gifConfig?: {
    loopStyle: "neural_pulse" | "orbital_system" | "data_stream_matrix" | "wave_harmonics";
    headline: string;
    fps: number;
  };
  videoConfig?: {
    sceneType: "3d_topology_flythrough" | "algorithmic_simulation" | "architecture_pipeline" | "executive_data_story";
    durationSeconds: number;
    narrationScript: string;
    keyframeLabels: string[];
  };
}

export const BENTO_COMPOSITION_METADATA: Record<
  BentoCompositionPreset,
  { label: string; shortLabel: string; idealCount: number; description: string }
> = {
  single_spotlight: {
    label: "Single Spotlight Stage",
    shortLabel: "1x Spotlight",
    idealCount: 1,
    description: "Focused primary media stage paired with balanced typography"
  },
  dual_vertical: {
    label: "Dual Stacked Bento",
    shortLabel: "2x Stacked",
    idealCount: 2,
    description: "Two vertically stacked media cards aligned beside slide points"
  },
  dual_side_by_side: {
    label: "Dual Split Bento",
    shortLabel: "2x Columns",
    idealCount: 2,
    description: "Two equal-height side-by-side media showcases"
  },
  triple_hero_left: {
    label: "Asymmetric Triple Bento (Hero Left)",
    shortLabel: "3x Hero Left",
    idealCount: 3,
    description: "Primary tall hero card on the left with two stacked companion cards on the right"
  },
  triple_hero_top: {
    label: "Asymmetric Triple Bento (Hero Top)",
    shortLabel: "3x Hero Top",
    idealCount: 3,
    description: "Wide panoramic hero banner on top with two comparison cards below"
  },
  quad_bento_matrix: {
    label: "2x2 Quad Bento Matrix",
    shortLabel: "4x Bento Grid",
    idealCount: 4,
    description: "Balanced 2x2 architectural grid displaying up to four media assets simultaneously"
  }
};

export const ARRANGEMENT_PRESET_METADATA: Record<
  SlideAssetArrangement,
  { label: string; shortBadge: string; description: string }
> = {
  split_right: {
    label: "Split Right (Executive)",
    shortBadge: "Split Right",
    description: "Structured text on the left with interactive Bento media showcase on the right"
  },
  split_left: {
    label: "Split Left (Visual Lead)",
    shortBadge: "Split Left",
    description: "Visual Bento media leads on the left followed by structured takeaways on the right"
  },
  hero_top: {
    label: "Top Hero Banner",
    shortBadge: "Top Hero",
    description: "Panoramic widescreen media stage above a compact multi-column bullet grid"
  },
  pip_corner: {
    label: "Compact Corner Dock",
    shortBadge: "Corner Dock",
    description: "Expanded slide typography with a compact media dock"
  },
  full_canvas: {
    label: "Full Stage Cinema",
    shortBadge: "Full Stage",
    description: "Bento media fills the primary stage with an executive caption overlay"
  }
};
