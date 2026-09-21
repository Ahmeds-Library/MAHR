import { SimulationPreset, SimulationData } from "../simulationTypes";

// Mathematical helper function for parametric meshes
function generateParametricMesh(
  uSteps: number,
  vSteps: number,
  fn: (u: number, v: number) => [number, number, number]
): { vertices: number[]; faces: number[] } {
  const vertices: number[] = [];
  const faces: number[] = [];

  for (let i = 0; i <= uSteps; i++) {
    const u = i / uSteps;
    for (let j = 0; j <= vSteps; j++) {
      const v = j / vSteps;
      const [x, y, z] = fn(u, v);
      vertices.push(x, y, z);
    }
  }

  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < vSteps; j++) {
      const a = i * (vSteps + 1) + j;
      const b = (i + 1) * (vSteps + 1) + j;
      const c = (i + 1) * (vSteps + 1) + (j + 1);
      const d = i * (vSteps + 1) + (j + 1);
      faces.push(a, b, d);
      faces.push(b, c, d);
    }
  }

  return { vertices, faces };
}

export const BIOLOGY_CHAOS_SIMULATIONS: SimulationPreset[] = [
  {
    id: "dna_helix",
    name: "DNA Double Helix & Nucleotide Base Pairing",
    icon: "🧬",
    category: "biology",
    prompt: "Show me DNA double helix with Adenine-Thymine, Guanine-Cytosine base pairs and replication fork",
    description: "Watson-Crick B-DNA molecular geometry (10 base pairs per turn, 3.4 nm pitch, major and minor grooves), hydrogen bonding (A=T dual bonds, G≡C triple bonds), and replication unzipping.",
    parameters: [
      {
        id: "turnPitch",
        name: "Helical Pitch (nm)",
        unit: "nm",
        min: 2.5,
        max: 4.5,
        step: 0.1,
        defaultValue: 3.4,
        description: "Vertical rise per complete 360-degree helical revolution (B-DNA is 3.4 nm)."
      },
      {
        id: "unzipFactor",
        name: "Replication Fork Unzipping",
        unit: "%",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 35,
        description: "Helicase enzyme unwinding percentage opening the replication bubble."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe DNA Helicase Replication Unzipping",
        instruction: "Slide Replication Fork Unzipping to 80% to see DNA helicase breaking the hydrogen bonds between complementary base pairs.",
        hint: "Guanine-Cytosine pairs have 3 hydrogen bonds and require higher denaturation energy than Adenine-Thymine pairs with 2 bonds.",
        explanation: "This unzipping enables DNA Polymerase to synthesize complementary leading and lagging Okazaki fragments!"
      }
    ],
    init: (params) => ({
      twistOffset: 0
    }),
    update: (state, t, dt, params) => {
      const pitch = params?.turnPitch ?? 3.4;
      const unzipPct = (params?.unzipFactor ?? 35) / 100;

      const numBasePairs = 24;
      const radius = 1.2;
      const heightStep = 0.32 * (pitch / 3.4);
      const angleStep = (Math.PI * 2) / 10.5; // ~10.5 base pairs per helical turn in B-DNA

      const nodes: any[] = [];
      const rods: any[] = [];
      const particles: any[] = [];

      const basePairNames = [
        { name1: "Adenine (A)", name2: "Thymine (T)", color1: "#ef4444", color2: "#38bdf8", bonds: 2 },
        { name1: "Guanine (G)", name2: "Cytosine (C)", color1: "#10b981", color2: "#f59e0b", bonds: 3 },
        { name1: "Thymine (T)", name2: "Adenine (A)", color1: "#38bdf8", color2: "#ef4444", bonds: 2 },
        { name1: "Cytosine (C)", name2: "Guanine (G)", color1: "#f59e0b", color2: "#10b981", bonds: 3 }
      ];

      for (let i = 0; i < numBasePairs; i++) {
        const bp = basePairNames[i % basePairNames.length];
        const theta = i * angleStep + t * 0.6;
        const y = (i - numBasePairs / 2) * heightStep;

        // Unzipping replication separation at the top of the strand
        const isUnzipped = (i / numBasePairs) > (1 - unzipPct);
        const unzipSpread = isUnzipped ? ((i / numBasePairs) - (1 - unzipPct)) / unzipPct * 1.6 : 0;

        const x1 = (radius + unzipSpread) * Math.cos(theta);
        const z1 = (radius + unzipSpread) * Math.sin(theta);

        const x2 = (radius + unzipSpread) * Math.cos(theta + Math.PI);
        const z2 = (radius + unzipSpread) * Math.sin(theta + Math.PI);

        // Sugar-Phosphate Backbone Nodes (Strand 1 and Strand 2)
        nodes.push({
          id: `backbone_1_${i}`,
          x: x1,
          y,
          z: z1,
          radius: 0.1,
          color: "#94a3b8",
          name: `5' Phosphate Group (${bp.name1})`
        });

        nodes.push({
          id: `backbone_2_${i}`,
          x: x2,
          y,
          z: z2,
          radius: 0.1,
          color: "#cbd5e1",
          name: `3' Phosphate Group (${bp.name2})`
        });

        // Base 1 and Base 2 interior nodes
        const midX1 = (radius * 0.45 + unzipSpread * 0.5) * Math.cos(theta);
        const midZ1 = (radius * 0.45 + unzipSpread * 0.5) * Math.sin(theta);
        const midX2 = (radius * 0.45 + unzipSpread * 0.5) * Math.cos(theta + Math.PI);
        const midZ2 = (radius * 0.45 + unzipSpread * 0.5) * Math.sin(theta + Math.PI);

        nodes.push({
          id: `base_1_${i}`,
          x: midX1,
          y,
          z: midZ1,
          radius: 0.14,
          color: bp.color1,
          name: bp.name1
        });

        nodes.push({
          id: `base_2_${i}`,
          x: midX2,
          y,
          z: midZ2,
          radius: 0.14,
          color: bp.color2,
          name: bp.name2
        });

        // Rods connecting backbone to bases
        rods.push({ from: [x1, y, z1], to: [midX1, y, midZ1], color: bp.color1, radius: 0.04 });
        rods.push({ from: [x2, y, z2], to: [midX2, y, midZ2], color: bp.color2, radius: 0.04 });

        // Hydrogen bonds connecting complementary base pairs (if not unzipped)
        if (!isUnzipped) {
          rods.push({
            from: [midX1, y, midZ1],
            to: [midX2, y, midZ2],
            color: "#facc15",
            radius: 0.025,
            dashed: true,
            label: `${bp.bonds} H-Bonds`
          });
        }

        // Longitudinal backbone links
        if (i > 0) {
          const prevTheta = (i - 1) * angleStep + t * 0.6;
          const prevY = (i - 1 - numBasePairs / 2) * heightStep;
          const prevIsUnzipped = ((i - 1) / numBasePairs) > (1 - unzipPct);
          const prevUnzipSpread = prevIsUnzipped ? (((i - 1) / numBasePairs) - (1 - unzipPct)) / unzipPct * 1.6 : 0;

          const px1 = (radius + prevUnzipSpread) * Math.cos(prevTheta);
          const pz1 = (radius + prevUnzipSpread) * Math.sin(prevTheta);
          const px2 = (radius + prevUnzipSpread) * Math.cos(prevTheta + Math.PI);
          const pz2 = (radius + prevUnzipSpread) * Math.sin(prevTheta + Math.PI);

          rods.push({ from: [px1, prevY, pz1], to: [x1, y, z1], color: "#0284c7", radius: 0.05 });
          rods.push({ from: [px2, prevY, pz2], to: [x2, y, z2], color: "#0284c7", radius: 0.05 });
        }
      }

      return {
        title: "Watson-Crick B-DNA Double Helix & Molecular Replication",
        description: `Right-handed double helix with antiparallel 5'→3' and 3'→5' strands, major/minor grooves, and Chargaff's rule nucleotide base complementarity (A=T dual hydrogen bonds, G≡C triple hydrogen bonds).`,
        category: "biology",
        metrics: {
          "Helical Pitch": `${pitch.toFixed(1)} nm per turn (10.5 bp)`,
          "Helix Diameter": "2.0 nm",
          "Complementarity": "A = T (2 H-Bonds) | G ≡ C (3 H-Bonds)",
          "Replication Bubble": `${(unzipPct * 100).toFixed(0)}% Open (Helicase Activity)`,
          "Conformation": "B-DNA (Hydrated Physiological Form)"
        },
        nodes,
        rods,
        particles,
        formulas: [
          "Chargaff's Rule: [A] = [T] and [G] = [C]",
          "Helical Pitch: P = 10.5 bp · 0.34 nm/bp = 3.57 nm",
          "Hydrogen Bonding: ΔG(GC) = -1.2 kcal/mol > ΔG(AT) = -0.6 kcal/mol"
        ]
      };
    }
  },
  {
    id: "lungs_asthma",
    name: "Human Respiratory Mechanics & Asthma Constriction",
    icon: "🫁",
    category: "biology",
    prompt: "Show me human lungs breathing with asthma and airway resistance",
    description: "Real-time anatomical volumetric expansion, bronchial constriction during asthmatic attack, and alveolar pressure gradient.",
    parameters: [
      {
        id: "asthmaSeverity",
        name: "Asthma Constriction Severity",
        unit: "%",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 65,
        description: "Severity of bronchial smooth muscle hyper-reactivity and airway constriction."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Airway Resistance Explosion under Poiseuille's Law",
        instruction: "Increase asthma severity from 0% to 80%. Observe airway resistance surge dramatically because resistance scales as 1/r⁴.",
        hint: "Halving the bronchial airway radius increases flow resistance by 16 TIMES (2⁴ = 16)!",
        explanation: "This severe resistance causes trapped air, wheezing, and hyperinflation in asthma patients."
      }
    ],
    init: (params) => ({
      asthmaSeverity: (params?.asthmaSeverity ?? 65) / 100
    }),
    update: (state, t, dt, params) => {
      const severity = (params?.asthmaSeverity ?? 65) / 100;
      const breathFreq = 1.4;
      const breathPhase = (Math.sin(t * breathFreq) + 1) / 2;
      const airwayConstriction = 0.35 + (1 - severity) * 0.45;
      const tidalVolume = (400 + breathPhase * 350).toFixed(0);
      const airwayResistance = (12.5 + severity * 22.0 + (1 - breathPhase) * 6).toFixed(1);
      const o2Saturation = (98 - severity * 10 + Math.sin(t) * 1).toFixed(1);

      const lungMesh = generateParametricMesh(20, 16, (u, v) => {
        const phi = u * Math.PI;
        const theta = v * Math.PI * 2;
        const side = theta > Math.PI ? 1 : -1;
        const localTheta = theta > Math.PI ? theta - Math.PI : theta;

        const expansion = 1 + breathPhase * 0.32;
        const rx = 1.1 * expansion;
        const ry = 1.7 * expansion;
        const rz = 0.9 * expansion;

        let x = rx * Math.sin(phi) * Math.cos(localTheta);
        let y = ry * Math.cos(phi);
        let z = rz * Math.sin(phi) * Math.sin(localTheta);

        x = x + side * 1.35;
        if (side === -1 && y < 0.2 && y > -0.8 && x > -1.2) {
          x -= 0.28;
        }
        y += Math.sin(phi * 2) * 0.15;
        return [x, y, z];
      });

      const bronchialNodes = [
        { id: "trachea_top", x: 0, y: 2.2, z: 0, radius: 0.12, color: "#38bdf8", name: "Trachea" },
        { id: "carina", x: 0, y: 1.2, z: 0, radius: 0.1, color: "#f43f5e", name: "Carina (Bifurcation)" },
        { id: "left_bronchus", x: -0.7, y: 0.6, z: 0, radius: 0.08 * airwayConstriction, color: "#fb7185", name: "Left Bronchus (Narrowed)" },
        { id: "right_bronchus", x: 0.7, y: 0.7, z: 0, radius: 0.09 * airwayConstriction, color: "#fb7185", name: "Right Bronchus (Narrowed)" }
      ];

      const bronchialRods = [
        { from: [0, 2.2, 0] as [number, number, number], to: [0, 1.2, 0] as [number, number, number], color: "#38bdf8", radius: 0.09 },
        { from: [0, 1.2, 0] as [number, number, number], to: [-0.7, 0.6, 0] as [number, number, number], color: "#fb7185", radius: 0.06 * airwayConstriction },
        { from: [0, 1.2, 0] as [number, number, number], to: [0.7, 0.7, 0] as [number, number, number], color: "#fb7185", radius: 0.06 * airwayConstriction }
      ];

      const particles = [];
      for (let p = 0; p < 45; p++) {
        const prog = ((t * 1.5 + p * 0.08) % 1);
        const flowY = 2.2 - prog * 2.8;
        const side = p % 2 === 0 ? -1 : 1;
        const flowX = side * Math.sin(prog * Math.PI) * 1.1;
        particles.push({
          x: flowX + (Math.sin(p * 7) * 0.15),
          y: flowY,
          z: (Math.cos(p * 7) * 0.15),
          color: breathPhase > 0.5 ? "#38bdf8" : "#fbbf24",
          size: 0.04
        });
      }

      return {
        title: "Human Respiratory Mechanics & Asthmatic Airway Constriction",
        description: "Visualizing hyper-reactive bronchial smooth muscle spasms causing narrowed airway diameter, elevated airway resistance (cmH2O/L/s), and trapped alveolar gas volume during expiration.",
        category: "biology",
        metrics: {
          "Tidal Volume": `${tidalVolume} mL`,
          "Airway Resistance (Raw)": `${airwayResistance} cmH2O/L/s`,
          "SpO2 Saturation": `${o2Saturation}%`,
          "Respiratory Phase": breathPhase > 0.5 ? "Inspiration" : "Expiration (Obstructed)",
          "Bronchoconstriction": `${(severity * 100).toFixed(0)}% Narrowed`
        },
        nodes: bronchialNodes,
        rods: bronchialRods,
        mesh: {
          vertices: lungMesh.vertices,
          faces: lungMesh.faces,
          color: "#06b6d4",
          wireframe: true,
          opacity: 0.55,
          shadingMode: "hologram"
        },
        particles,
        formulas: [
          "Poiseuille's Resistance: R = (8 · η · L) / (π · r⁴)",
          "Tidal Flow: V'(t) = ΔP / Raw",
          "Alveolar Compliance: C = ΔV / ΔP"
        ]
      };
    }
  },
  {
    id: "lorenz_attractor",
    name: "Lorenz Strange Attractor & Deterministic Chaos",
    icon: "🦋",
    category: "chaos",
    prompt: "Show me the Lorenz attractor with butterfly effect and chaotic phase space trajectories",
    description: "System of three coupled non-linear ordinary differential equations (dx/dt = σ(y - x), dy/dt = x(ρ - z) - y, dz/dt = xy - βz) demonstrating deterministic chaos, strange attractors, and sensitive dependence on initial conditions.",
    parameters: [
      {
        id: "sigma",
        name: "Prandtl Number (σ)",
        unit: "",
        min: 2,
        max: 20,
        step: 0.5,
        defaultValue: 10,
        description: "Ratio of momentum diffusivity to thermal diffusivity."
      },
      {
        id: "rho",
        name: "Rayleigh Number (ρ)",
        unit: "",
        min: 10,
        max: 40,
        step: 1,
        defaultValue: 28,
        description: "Driving thermal buoyancy gradient (chaotic threshold occurs at ρ = 24.74)."
      },
      {
        id: "beta",
        name: "Geometric Aspect Ratio (β)",
        unit: "",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        defaultValue: 2.67, // 8/3
        description: "Physical aspect ratio of the convection rolls."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Stable Fixed Points vs Chaos Transition",
        instruction: "Lower Rayleigh Number ρ below 24.0. Notice how the chaotic trajectory collapses into one of two fixed point spiral sinks.",
        hint: "At ρ < 24.74, the Lorenz system undergoes a Hopf bifurcation and loses chaos.",
        explanation: "Edward Lorenz discovered this in 1963 while modeling atmospheric weather convection!"
      }
    ],
    init: (params) => {
      const trail1: [number, number, number][] = [];
      const trail2: [number, number, number][] = [];

      let x1 = 0.1, y1 = 0.0, z1 = 0.0;
      let x2 = 0.1001, y2 = 0.0, z2 = 0.0; // 0.0001 initial delta

      return {
        x1, y1, z1,
        x2, y2, z2,
        trail1,
        trail2
      };
    },
    update: (state, t, dt, params) => {
      const sigma = params?.sigma ?? 10;
      const rho = params?.rho ?? 28;
      const beta = params?.beta ?? 2.67;

      let { x1, y1, z1, x2, y2, z2 } = state;
      const substeps = 6;
      const subDt = Math.min(dt, 0.02) / substeps;

      for (let s = 0; s < substeps; s++) {
        // Runge-Kutta 2 for primary particle
        const dx1 = sigma * (y1 - x1);
        const dy1 = x1 * (rho - z1) - y1;
        const dz1 = x1 * y1 - beta * z1;

        x1 += dx1 * subDt;
        y1 += dy1 * subDt;
        z1 += dz1 * subDt;

        // Perturbed particle 2
        const dx2 = sigma * (y2 - x2);
        const dy2 = x2 * (rho - z2) - y2;
        const dz2 = x2 * y2 - beta * z2;

        x2 += dx2 * subDt;
        y2 += dy2 * subDt;
        z2 += dz2 * subDt;
      }

      state.x1 = x1;
      state.y1 = y1;
      state.z1 = z1;
      state.x2 = x2;
      state.y2 = y2;
      state.z2 = z2;

      const scale = 0.14;
      const offsetZ = -28 * scale;

      const pos1: [number, number, number] = [x1 * scale, (z1 * scale) + offsetZ, y1 * scale];
      const pos2: [number, number, number] = [x2 * scale, (z2 * scale) + offsetZ, y2 * scale];

      if (!state) {
        state = { x1: 0.1, y1: 0.0, z1: 0.0, x2: 0.1001, y2: 0.0, z2: 0.0, trail1: [], trail2: [] };
      }
      if (!state.trail1 || !Array.isArray(state.trail1)) state.trail1 = [];
      if (!state.trail2 || !Array.isArray(state.trail2)) state.trail2 = [];

      state.trail1.push(pos1);
      if (state.trail1.length > 500) state.trail1.shift();

      state.trail2.push(pos2);
      if (state.trail2.length > 500) state.trail2.shift();

      // Lyapunov divergence distance
      const divergenceDist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);

      const nodes = [
        { id: "lorenz_lead", x: pos1[0], y: pos1[1], z: pos1[2], radius: 0.18, color: "#38bdf8", name: `Trajectory A (x=${x1.toFixed(1)}, y=${y1.toFixed(1)}, z=${z1.toFixed(1)})` },
        { id: "lorenz_shadow", x: pos2[0], y: pos2[1], z: pos2[2], radius: 0.14, color: "#f43f5e", name: `Trajectory B (Perturbation Δ₀ = 10⁻⁴)` }
      ];

      return {
        title: "Lorenz Strange Attractor & The Butterfly Effect",
        description: `Visualizing sensitive dependence on initial conditions. Two trajectories starting with an imperceptible initial difference (Δ₀ = 0.0001) exponentially diverge onto opposite butterfly wing lobes with Lyapunov exponent λ > 0.`,
        category: "chaos",
        metrics: {
          "Trajectory Separation (Δ)": `${divergenceDist.toFixed(3)} units`,
          "Prandtl Number (σ)": `${sigma}`,
          "Rayleigh Number (ρ)": `${rho}`,
          "Geometric Factor (β)": `${beta.toFixed(2)}`,
          "Lyapunov Exponent (λ)": rho > 24.7 ? "+0.905 (Chaotic Divergence)" : "Negative (Stable Sink)",
          "Fractal Dimension": "2.06 (Strange Attractor)"
        },
        nodes,
        rods: [],
        trail: state.trail1,
        formulas: [
          "dx/dt = σ · (y - x)",
          "dy/dt = x · (ρ - z) - y",
          "dz/dt = x · y - β · z",
          "Lyapunov Divergence: |δZ(t)| ≈ |δZ(0)| · e^(λ·t)"
        ]
      };
    }
  }
];
