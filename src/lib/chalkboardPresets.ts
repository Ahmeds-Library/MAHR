export interface ChalkColor {
  name: string;
  code: string;
  shadow: string;
}

export const CHALK_COLORS: ChalkColor[] = [
  { name: "White", code: "#f8fafc", shadow: "rgba(248, 250, 252, 0.4)" },
  { name: "Neon Cyan", code: "#06b6d4", shadow: "rgba(6, 182, 212, 0.6)" },
  { name: "Neon Rose", code: "#f43f5e", shadow: "rgba(244, 63, 94, 0.6)" },
  { name: "Neon Gold", code: "#f59e0b", shadow: "rgba(245, 158, 11, 0.6)" },
  { name: "Neon Mint", code: "#10b981", shadow: "rgba(16, 185, 129, 0.6)" },
  { name: "Neon Purple", code: "#a855f7", shadow: "rgba(168, 85, 247, 0.6)" },
];

export interface VoicePresetCommand {
  type: string;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  color?: string;
  text?: string;
  thickness?: number;
}

export interface VoicePreset {
  name: string;
  description: string;
  commands: VoicePresetCommand[];
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    name: "Feedforward Neural Network",
    description: "simple feedforward artificial intelligence neural network node layer diagram",
    commands: [
      { type: "text", x1: 20, y1: 15, text: "Input Layer", color: "cyan" },
      { type: "text", x1: 50, y1: 15, text: "Hidden Layer", color: "purple" },
      { type: "text", x1: 80, y1: 15, text: "Output Layer", color: "gold" },
      { type: "circle", x1: 20, y1: 30, x2: 24, y2: 30, color: "cyan" },
      { type: "circle", x1: 20, y1: 50, x2: 24, y2: 50, color: "cyan" },
      { type: "circle", x1: 20, y1: 70, x2: 24, y2: 70, color: "cyan" },
      { type: "circle", x1: 50, y1: 30, x2: 54, y2: 30, color: "purple" },
      { type: "circle", x1: 50, y1: 50, x2: 54, y2: 50, color: "purple" },
      { type: "circle", x1: 50, y1: 70, x2: 54, y2: 70, color: "purple" },
      { type: "circle", x1: 80, y1: 40, x2: 84, y2: 40, color: "gold" },
      { type: "circle", x1: 80, y1: 60, x2: 84, y2: 60, color: "gold" },
      { type: "arrow", x1: 23, y1: 30, x2: 47, y2: 30, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 30, x2: 47, y2: 50, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 50, x2: 47, y2: 30, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 50, x2: 47, y2: 50, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 50, x2: 47, y2: 70, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 70, x2: 47, y2: 50, color: "white", thickness: 1 },
      { type: "arrow", x1: 23, y1: 70, x2: 47, y2: 70, color: "white", thickness: 1 },
      { type: "arrow", x1: 53, y1: 30, x2: 77, y2: 40, color: "white", thickness: 1 },
      { type: "arrow", x1: 53, y1: 50, x2: 77, y2: 40, color: "white", thickness: 1 },
      { type: "arrow", x1: 53, y1: 50, x2: 77, y2: 60, color: "white", thickness: 1 },
      { type: "arrow", x1: 53, y1: 70, x2: 77, y2: 60, color: "white", thickness: 1 }
    ]
  },
  {
    name: "Parallel Electrical Circuit",
    description: "schematic diagram of a parallel resistor loop electrical circuit",
    commands: [
      { type: "line", x1: 15, y1: 25, x2: 15, y2: 75, color: "rose" },
      { type: "line", x1: 15, y1: 25, x2: 85, y2: 25, color: "white" },
      { type: "line", x1: 15, y1: 75, x2: 85, y2: 75, color: "white" },
      { type: "rect", x1: 11, y1: 45, x2: 19, y2: 55, color: "rose" },
      { type: "text", x1: 11, y1: 38, text: "9V BATTERY", color: "rose" },
      { type: "line", x1: 45, y1: 25, x2: 45, y2: 40, color: "white" },
      { type: "rect", x1: 41, y1: 40, x2: 49, y2: 60, color: "mint" },
      { type: "text", x1: 37, y1: 35, text: "R1: 220Ω", color: "mint" },
      { type: "line", x1: 45, y1: 60, x2: 45, y2: 75, color: "white" },
      { type: "line", x1: 75, y1: 25, x2: 75, y2: 40, color: "white" },
      { type: "rect", x1: 71, y1: 40, x2: 79, y2: 60, color: "gold" },
      { type: "text", x1: 67, y1: 35, text: "R2: 10k", color: "gold" },
      { type: "line", x1: 75, y1: 60, x2: 75, y2: 75, color: "white" }
    ]
  },
  {
    name: "Feedback Control Loop System",
    description: "control theory automation feedback loop with plant process and sum block",
    commands: [
      { type: "text", x1: 10, y1: 40, text: "Input R(s)", color: "white" },
      { type: "arrow", x1: 10, y1: 50, x2: 23, y2: 50, color: "white" },
      { type: "circle", x1: 25, y1: 50, x2: 29, y2: 50, color: "rose" },
      { type: "text", x1: 24, y1: 48, text: "Σ", color: "rose" },
      { type: "arrow", x1: 29, y1: 50, x2: 40, y2: 50, color: "white" },
      { type: "rect", x1: 40, y1: 42, x2: 60, y2: 58, color: "cyan" },
      { type: "text", x1: 42, y1: 48, text: "Controller G(s)", color: "cyan" },
      { type: "arrow", x1: 60, y1: 50, x2: 80, y2: 50, color: "white" },
      { type: "text", x1: 82, y1: 48, text: "Output C(s)", color: "white" },
      { type: "line", x1: 70, y1: 50, x2: 70, y2: 70, color: "gold" },
      { type: "line", x1: 70, y1: 70, x2: 25, y2: 70, color: "gold" },
      { type: "arrow", x1: 25, y1: 70, x2: 25, y2: 55, color: "gold" },
      { type: "text", x1: 40, y1: 73, text: "Feedback Sensor H(s)", color: "gold" }
    ]
  }
];
