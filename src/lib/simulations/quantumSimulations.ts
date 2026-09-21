import { SimulationPreset, SimulationData } from "../simulationTypes";

export const QUANTUM_SIMULATIONS: SimulationPreset[] = [
  {
    id: "bohr_atom",
    name: "Bohr Hydrogen Atom & Quantum Spectral Lines",
    icon: "⚛️",
    category: "quantum",
    prompt: "Show me Bohr model of hydrogen atom with electron quantum jumps and emitted photon wavelengths",
    description: "Quantized electronic energy levels (En = -13.6 eV / n²), Bohr orbital radii (rn = n² · a₀), quantum jump transitions, and emitted photon wavelength spectral lines (Lyman, Balmer, Paschen series).",
    parameters: [
      {
        id: "initialLevel",
        name: "Initial Quantum Level (n_i)",
        unit: "n",
        min: 2,
        max: 6,
        step: 1,
        defaultValue: 3,
        description: "Initial excited electron orbital energy state."
      },
      {
        id: "finalLevel",
        name: "Final Quantum Level (n_f)",
        unit: "n",
        min: 1,
        max: 5,
        step: 1,
        defaultValue: 2,
        description: "Target lower orbital state (n_f=1: Lyman UV, n_f=2: Balmer Visible, n_f=3: Paschen IR)."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Produce the Famous Red Hydrogen-Alpha Line (656.3 nm)",
        instruction: "Set initial level n_i = 3 and final level n_f = 2 (Balmer series transition).",
        hint: "Energy difference ΔE = -13.6 · (1/9 - 1/4) = 1.89 eV. Wavelength λ = hc / ΔE = 656.3 nm (Crimson Red).",
        explanation: "This exact red emission line colors the glowing interstellar emission nebulae across our galaxy!"
      },
      {
        id: "c2",
        title: "Observe the High-Energy Lyman-Alpha Ultraviolet Transition",
        instruction: "Transition from n_i = 2 to ground state n_f = 1.",
        hint: "Energy release ΔE = 10.2 eV, emitting a 121.6 nm photon in the deep vacuum ultraviolet.",
        explanation: "Lyman-alpha is the most prominent spectral signature used by astronomers to map cosmic redshift and the early universe."
      }
    ],
    init: (params) => ({
      orbitAngle: 0,
      jumpProgress: 1.0
    }),
    update: (state, t, dt, params) => {
      let ni = Math.round(params?.initialLevel ?? 3);
      let nf = Math.round(params?.finalLevel ?? 2);
      if (nf >= ni) nf = ni - 1; // Ensure downward quantum jump

      const E_i = -13.6 / (ni * ni);
      const E_f = -13.6 / (nf * nf);
      const deltaE = E_f - E_i; // Positive energy released (eV)
      const lambdaNm = 1240 / deltaE; // Wavelength in nanometers (hc = 1240 eV*nm)

      // Determine series and visual color
      let seriesName = "Balmer (Visible)";
      let photonColor = "#ef4444"; // Red default

      if (nf === 1) {
        seriesName = "Lyman Series (Ultraviolet)";
        photonColor = "#a855f7"; // UV purple
      } else if (nf === 2) {
        seriesName = "Balmer Series (Visible Spectrum)";
        if (lambdaNm > 620) photonColor = "#ef4444"; // H-alpha (656nm Red)
        else if (lambdaNm > 470) photonColor = "#06b6d4"; // H-beta (486nm Cyan)
        else if (lambdaNm > 420) photonColor = "#3b82f6"; // H-gamma (434nm Blue)
        else photonColor = "#8b5cf6"; // H-delta (410nm Violet)
      } else {
        seriesName = "Paschen Series (Infrared)";
        photonColor = "#f59e0b"; // IR amber
      }

      // Visual Bohr radii for orbits n = 1 to 5
      const orbitRadii = [0.8, 1.4, 2.1, 2.9, 3.8, 4.8];
      const r_i = orbitRadii[ni - 1];
      const r_f = orbitRadii[nf - 1];

      // Jump animation phase
      const cycleTime = (t % 3.0);
      const isJumping = cycleTime > 1.2 && cycleTime < 1.8;
      const jumpRatio = isJumping ? (cycleTime - 1.2) / 0.6 : (cycleTime >= 1.8 ? 1.0 : 0.0);

      const currentOrbitR = r_i + (r_f - r_i) * jumpRatio;
      const electronOmega = 4.0 / (ni ** 1.5);
      const electronAngle = t * electronOmega;

      const ex = currentOrbitR * Math.cos(electronAngle);
      const ez = currentOrbitR * Math.sin(electronAngle);
      const ey = 0;

      const nodes: any[] = [
        // Nucleus (Proton)
        { id: "nucleus", x: 0, y: 0, z: 0, radius: 0.28, color: "#f43f5e", name: "Proton Nucleus (+1e)" },
        // Orbiting Electron
        { id: "electron", x: ex, y: ey, z: ez, radius: 0.14, color: "#38bdf8", name: `Electron (State n = ${jumpRatio >= 1.0 ? nf : ni})` }
      ];

      const rods: any[] = [];
      const particles: any[] = [];

      // Concentric Bohr orbit rings
      for (let n = 1; n <= 5; n++) {
        const rN = orbitRadii[n - 1];
        const isCurrentActive = n === ni || n === nf;
        for (let seg = 0; seg < 36; seg++) {
          const theta = (seg / 36) * Math.PI * 2;
          particles.push({
            x: rN * Math.cos(theta),
            y: 0,
            z: rN * Math.sin(theta),
            color: isCurrentActive ? "#06b6d4" : "rgba(148, 163, 184, 0.25)",
            size: isCurrentActive ? 0.04 : 0.02
          });
        }
      }

      // Emitted Photon Wavepacket during / after jump
      if (cycleTime > 1.4) {
        const photonProg = (cycleTime - 1.4) / 1.6;
        const photonDist = photonProg * 6.5;
        const pAngle = electronAngle + 0.5;

        const phX = Math.cos(pAngle) * (r_f + photonDist);
        const phZ = Math.sin(pAngle) * (r_f + photonDist);
        const phY = Math.sin(photonProg * Math.PI * 8) * 0.25;

        nodes.push({
          id: "emitted_photon",
          x: phX,
          y: phY,
          z: phZ,
          radius: 0.16,
          color: photonColor,
          name: `Photon (λ = ${lambdaNm.toFixed(1)} nm, E = ${deltaE.toFixed(2)} eV)`
        });

        // Wiggle trace of light wave
        for (let w = 0; w < 10; w++) {
          const sub = photonProg - w * 0.02;
          if (sub > 0) {
            const wx = Math.cos(pAngle) * (r_f + sub * 6.5);
            const wz = Math.sin(pAngle) * (r_f + sub * 6.5);
            const wy = Math.sin((sub) * Math.PI * 8) * 0.25;
            particles.push({ x: wx, y: wy, z: wz, color: photonColor, size: 0.05 });
          }
        }
      }

      return {
        title: `Bohr Atom Quantum Orbital Transition (n = ${ni} → n = ${nf})`,
        description: `Electron drops from higher quantized energy state n = ${ni} (E = ${E_i.toFixed(2)} eV) to n = ${nf} (E = ${E_f.toFixed(2)} eV), releasing energy quantum ΔE = ${deltaE.toFixed(2)} eV as an emitted photon of wavelength λ = ${lambdaNm.toFixed(1)} nm (${seriesName}).`,
        category: "quantum",
        metrics: {
          "Initial State (ni)": `n = ${ni} (${E_i.toFixed(2)} eV)`,
          "Final State (nf)": `n = ${nf} (${E_f.toFixed(2)} eV)`,
          "Photon Energy (ΔE)": `${deltaE.toFixed(2)} eV (${(deltaE * 1.602e-19).toExponential(2)} J)`,
          "Photon Wavelength (λ)": `${lambdaNm.toFixed(1)} nm`,
          "Spectral Series": seriesName,
          "Bohr Radius Scale (r)": `rn = n² · a₀ = ${(ni * ni * 0.0529).toFixed(3)} nm`
        },
        nodes,
        rods,
        particles,
        formulas: [
          "Bohr Quantized Energy: E_n = -13.6 eV / n²",
          "Rydberg Formula: 1/λ = R_H · (1/n_f² - 1/n_i²)",
          "Photon Energy: E_photon = h·f = h·c / λ = E_i - E_f",
          "Orbital Angular Momentum: L = n · ℏ = n · (h / 2π)"
        ]
      };
    }
  },
  {
    id: "rutherford_scattering",
    name: "Rutherford Alpha Particle Gold Foil Scattering",
    icon: "🟡",
    category: "quantum",
    prompt: "Show me Rutherford gold foil experiment with alpha particle hyperbolic scattering off gold nucleus",
    description: "Coulomb repulsive force (F = 1/(4πε₀) · 2Ze²/r²), impact parameter (b), hyperbolic Keplerian scattering trajectories, and discovery of the dense atomic nucleus.",
    parameters: [
      {
        id: "impactParameter",
        name: "Impact Parameter (b)",
        unit: "fm",
        min: 1.0,
        max: 20.0,
        step: 1.0,
        defaultValue: 5.0,
        description: "Perpendicular distance of the incoming alpha particle from the center of the gold nucleus."
      },
      {
        id: "alphaEnergy",
        name: "Alpha Kinetic Energy (E)",
        unit: "MeV",
        min: 2.0,
        max: 10.0,
        step: 0.5,
        defaultValue: 5.5,
        description: "Kinetic energy of alpha particles emitted from radioactive Polonium/Radium source."
      },
      {
        id: "targetZ",
        name: "Target Nucleus (Z)",
        unit: "Protons",
        min: 29, // Copper
        max: 79, // Gold
        step: 10,
        defaultValue: 79, // Gold
        description: "Atomic number of the foil target (Gold Z=79, Silver Z=47, Copper Z=29)."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Large-Angle Backward Scattering (Head-On Collision)",
        instruction: "Decrease impact parameter b to very small value (b < 2 fm).",
        hint: "A near head-on collision causes the alpha particle to experience massive Coulomb repulsion and deflect backwards by θ > 90°.",
        explanation: "As Ernest Rutherford famously remarked: 'It was as if you fired a 15-inch shell at a piece of tissue paper and it came back and hit you!'"
      }
    ],
    init: (params) => ({
      particlesCount: 20
    }),
    update: (state, t, dt, params) => {
      const bFm = params?.impactParameter ?? 5.0;
      const E_Mev = params?.alphaEnergy ?? 5.5;
      const Z = params?.targetZ ?? 79;

      // Rutherford scattering angle: cot(theta/2) = (4 * pi * eps0 * E * b) / (z * Z * e^2)
      // theta = 2 * atan( (k * z * Z * e^2) / (2 * E * b) )
      const kConst = 1.44; // MeV * fm
      const alphaZ = 2; // Helium nucleus
      const numerator = (kConst * alphaZ * Z) / (2 * E_Mev);
      const scatteringAngleRad = 2 * Math.atan(numerator / bFm);
      const scatteringAngleDeg = (scatteringAngleRad * 180) / Math.PI;

      const nodes: any[] = [
        { id: "gold_nucleus", x: 0, y: 0, z: 0, radius: 0.45, color: "#facc15", name: `Gold Nucleus (Au Z=${Z})` }
      ];

      const rods: any[] = [];
      const particles: any[] = [];

      // Multiple beam lines with various impact parameters
      const numBeams = 11;
      for (let i = 0; i < numBeams; i++) {
        const localB = (i - Math.floor(numBeams / 2)) * 1.6;
        const bAbs = Math.max(Math.abs(localB), 0.3);
        const thetaScat = 2 * Math.atan(numerator / bAbs) * (localB > 0 ? 1 : -1);

        const prog = ((t * 1.5 + i * 0.12) % 1);
        let px = 0;
        let py = 0;

        if (prog < 0.45) {
          // Approaching from left
          px = -5.0 + (prog / 0.45) * 5.0;
          py = localB;
        } else {
          // Scattered beam
          const postProg = (prog - 0.45) / 0.55;
          const dist = postProg * 5.5;
          px = dist * Math.cos(thetaScat);
          py = localB + dist * Math.sin(thetaScat);
        }

        particles.push({
          x: px,
          y: py,
          z: 0,
          color: Math.abs(thetaScat) > 1.2 ? "#ef4444" : "#38bdf8",
          size: 0.06
        });
      }

      return {
        title: "Rutherford Alpha Particle Gold Foil Scattering Laboratory",
        description: `Alpha particles (q = +2e, E = ${E_Mev} MeV) deflected by the electrostatic Coulomb field of Gold nucleus (Z = ${Z}). The measured scattering deflection angle for b = ${bFm} fm is θ = ${scatteringAngleDeg.toFixed(1)}°.`,
        category: "quantum",
        metrics: {
          "Scattering Angle (θ)": `${scatteringAngleDeg.toFixed(1)}°`,
          "Impact Parameter (b)": `${bFm.toFixed(1)} fm (10⁻¹⁵ m)`,
          "Alpha Kinetic Energy": `${E_Mev} MeV`,
          "Target Nuclear Charge": `+${Z}e (Gold Au)`,
          "Distance of Closest Approach": `${(numerator * 2).toFixed(2)} fm`
        },
        nodes,
        rods,
        particles,
        formulas: [
          "Coulomb Repulsion: F = (1 / 4πε₀) · (2 · Z · e²) / r²",
          "Scattering Angle Formula: tan(θ/2) = (Z·e²) / (4πε₀ · E · b)",
          "Differential Cross Section: dσ/dΩ = ( (zZe²) / (4E) )² · 1 / sin⁴(θ/2)"
        ]
      };
    }
  }
];
