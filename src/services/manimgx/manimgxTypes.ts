/**
 * ManimGX Engine Types & Interfaces
 * High-performance 3D math and animation engine specification (academa-labs/manimgx)
 */

export type ManimGXSceneType = 
  | "ThreeDScene" 
  | "ParametricSurfaceScene" 
  | "VectorFieldScene" 
  | "ComplexAnalysisScene" 
  | "ChaosAttractorScene" 
  | "NeuralLossScene";

export interface Camera3DState {
  phi: number;       // Elevation angle in radians
  theta: number;     // Azimuth angle in radians
  distance: number;  // Distance from origin
  fov: number;       // Field of view in degrees
  autoRotate: boolean;
  autoRotateSpeed: number;
}

export interface StoryboardFrame {
  frameIndex: number;
  timeSeconds: number;
  label: string;
  thumbnailUrl?: string;
  description: string;
  mobjectsCount: number;
  activeAnimations: string[];
  layoutScore: number; // 0 - 100 layout balance score for agent feedback
  agentFeedbackNote: string;
}

export interface ManimGXCompileTelemetry {
  fps: number;
  drawCalls: number;
  polyCount: number;
  compileTimeMs: number;
  renderBackend: "WebGPU" | "WebGL2" | "Rust-WASM";
  memoryUsageMb: number;
  warnings: string[];
}

export interface ManimGXMathPreset {
  id: string;
  title: string;
  category: "Calculus" | "Complex Analysis" | "Chaos & Dynamics" | "Machine Learning" | "Geometry";
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  formulaLatex: string;
  code: string;
  defaultDuration: number;
}

export interface ManimGXSceneState {
  code: string;
  activePresetId: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  camera: Camera3DState;
  showAxes: boolean;
  showGrid: boolean;
  showWireframe: boolean;
  resolution: "1080p" | "1440p" | "4K";
}
