import { Slide, SlideDeck } from "../slideTypes";
import { SlideVectorGraphic } from "../infographics/infographicTypes";

export type PipelineStage = "idle" | "step1_planning" | "step2_assets" | "step3_cloning" | "step4_injection" | "completed" | "error";

export interface ManimSceneAsset {
  id: string;
  slideIndex: number;
  slideTitle: string;
  conceptName: string;
  pythonCode: string;
  videoUrl?: string;
  durationSeconds: number;
  status: "idle" | "generating_code" | "rendering_mp4" | "ready" | "failed";
  driveFileId?: string;
}

export interface ChartAsset {
  id: string;
  slideIndex: number;
  slideTitle: string;
  chartType: "bar" | "line" | "radar" | "waterfall" | "commodity_fmc";
  title: string;
  dataPoints: Array<{ label: string; value: number; change?: number; unit?: string }>;
  highResImageUrl?: string;
  vectorGraphic?: SlideVectorGraphic;
  status: "idle" | "generating" | "ready";
}

export interface YouTubeAsset {
  id: string;
  slideIndex: number;
  slideTitle: string;
  searchKeyword: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  embedUrl: string;
  status: "searching" | "found";
}

export interface DriveMasterTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  transitionType: "Fade" | "Slide" | "Zoom" | "Flip";
  aspectRatio: "16:9" | "4:3";
  isPreAnimated: boolean;
  driveFileId: string;
}

export interface PipelineExecutionState {
  currentStage: PipelineStage;
  stageProgress: number; // 0 to 100
  activeLog: string;
  logs: Array<{ timestamp: string; stage: PipelineStage; message: string; type?: "info" | "success" | "warn" | "error" }>;
  deck?: SlideDeck;
  manimAssets: ManimSceneAsset[];
  chartAssets: ChartAsset[];
  youtubeAssets: YouTubeAsset[];
  selectedTemplate: DriveMasterTemplate;
  clonedPresentationId?: string;
  clonedPresentationUrl?: string;
  error?: string | null;
}
