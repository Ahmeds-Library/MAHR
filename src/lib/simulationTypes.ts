export interface SimulationNode {
  id: string;
  x: number;
  y: number;
  z: number;
  radius?: number;
  color?: string;
  name?: string;
  vx?: number;
  vy?: number;
  vz?: number;
  isVector?: boolean;
}

export interface SimulationRod {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  radius?: number;
  dashed?: boolean;
  arrow?: boolean;
  label?: string;
}

export interface SimulationMesh {
  vertices: number[]; // 1D flat array [x1, y1, z1, x2, y2, z2, ...]
  faces?: number[];   // 1D index array [i1, i2, i3, ...]
  indices?: number[]; // 1D index array alias
  colors?: number[];  // Optional per-vertex RGB colors
  color?: string;
  wireframe?: boolean;
  opacity?: number;
  shadingMode?: "hologram" | "glass" | "solid" | "wireframe" | "points";
}

export interface SimulationParticle {
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
  color?: string;
  size?: number;
}

export interface SimulationVector {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  label: string;
  type: "velocity" | "acceleration" | "force" | "field" | "ray" | "custom";
}

export interface SimulationGraphPoint {
  time: number;
  kineticEnergy?: number;
  potentialEnergy?: number;
  totalEnergy?: number;
  x?: number;
  v?: number;
  intensity?: number;
  voltage?: number;
  angle?: number;
}

export interface SimulationStudyChallenge {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  targetMetricKey?: string;
  targetValueCheck?: (metrics: Record<string, any>, params: Record<string, any>) => boolean;
  explanation: string;
}

export interface SimulationParameter {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description: string;
}

export interface SimulationData {
  title?: string;
  description?: string;
  category?: "physics" | "optics" | "mechanics" | "electromagnetism" | "quantum" | "astronomy" | "biology" | "chemistry" | "chaos" | "custom";
  metrics?: Record<string, string | number>;
  telemetry?: Record<string, string | number>;
  nodes?: SimulationNode[];
  rods?: SimulationRod[];
  vectors?: SimulationVector[];
  trail?: [number, number, number][];
  mesh?: SimulationMesh;
  particles?: SimulationParticle[];
  timeScale?: number;
  cameraHint?: {
    x?: number;
    y?: number;
    z?: number;
    targetX?: number;
    targetY?: number;
    targetZ?: number;
  };
  explanation?: string;
  educationalExplanation?: string;
  suggestedExperiments?: string[];
  formulas?: string[];
  graphData?: SimulationGraphPoint[];
  currentGraphSample?: SimulationGraphPoint;
}

export interface SimulationPreset {
  id: string;
  name: string;
  icon: string;
  category: "optics" | "mechanics" | "electromagnetism" | "quantum" | "astronomy" | "biology" | "chaos";
  prompt: string;
  description: string;
  parameters: SimulationParameter[];
  challenges?: SimulationStudyChallenge[];
  init: (customParams?: Record<string, number>) => any;
  update: (state: any, t: number, dt: number, params?: Record<string, number>) => SimulationData;
}
