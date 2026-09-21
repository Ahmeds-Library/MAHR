import { SimulationPreset } from "./simulationTypes";
import { FLUID_LIQUID_SIMULATIONS } from "./simulations/fluidLiquidSimulations";
import { OPTICS_SIMULATIONS } from "./simulations/opticsSimulations";
import { MECHANICS_SIMULATIONS } from "./simulations/mechanicsSimulations";
import { ELECTROMAGNETISM_SIMULATIONS } from "./simulations/electromagnetismSimulations";
import { QUANTUM_SIMULATIONS } from "./simulations/quantumSimulations";
import { ASTRONOMY_SIMULATIONS } from "./simulations/astronomySimulations";
import { BIOLOGY_CHAOS_SIMULATIONS } from "./simulations/biologyChaosSimulations";

export const SIMULATION_PRESETS: SimulationPreset[] = [
  ...FLUID_LIQUID_SIMULATIONS,
  ...OPTICS_SIMULATIONS,
  ...MECHANICS_SIMULATIONS,
  ...ELECTROMAGNETISM_SIMULATIONS,
  ...QUANTUM_SIMULATIONS,
  ...ASTRONOMY_SIMULATIONS,
  ...BIOLOGY_CHAOS_SIMULATIONS
];

export const SIMULATION_CATEGORIES = [
  { id: "all", label: "All Simulations", icon: "🌐" },
  { id: "fluids", label: "2D/3D Liquid & Fluids", icon: "🌊" },
  { id: "optics", label: "Optics & Light", icon: "🔍" },
  { id: "mechanics", label: "Mechanics & Kinematics", icon: "🎯" },
  { id: "electromagnetism", label: "Electromagnetism", icon: "🧲" },
  { id: "quantum", label: "Modern & Quantum", icon: "⚛️" },
  { id: "astronomy", label: "Astronomy & Gravity", icon: "🪐" },
  { id: "biology", label: "Biology & Anatomy", icon: "🧬" },
  { id: "chaos", label: "Chaos & Non-linear", icon: "🦋" }
] as const;

