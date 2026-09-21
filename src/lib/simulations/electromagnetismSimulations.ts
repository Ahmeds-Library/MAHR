import { SimulationPreset, SimulationData } from "../simulationTypes";

export const ELECTROMAGNETISM_SIMULATIONS: SimulationPreset[] = [
  {
    id: "lorentz_force",
    name: "Lorentz Force & Helical Cyclotron Motion",
    icon: "🧲",
    category: "electromagnetism",
    prompt: "Show me a charged particle moving through magnetic and electric fields with helical Lorentz force trajectories",
    description: "Electrodynamics Lorentz force law (F = q(E + v × B)), cyclotron gyroradius (r = mv/qB), pitch angle helical motion, and magnetic bottle plasma reflection.",
    parameters: [
      {
        id: "bField",
        name: "Magnetic Field (B)",
        unit: "Tesla",
        min: 0.2,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.2,
        description: "Strength of the uniform external magnetic field along the Z/Y axis."
      },
      {
        id: "charge",
        name: "Particle Charge (q)",
        unit: "e",
        min: -2,
        max: 2,
        step: 1,
        defaultValue: 1,
        description: "Charge of the particle (+1 for Proton, -1 for Electron, +2 for Alpha)."
      },
      {
        id: "velocity",
        name: "Perpendicular Velocity (v⊥)",
        unit: "m/s",
        min: 1.0,
        max: 6.0,
        step: 0.2,
        defaultValue: 3.0,
        description: "Velocity component perpendicular to the magnetic field line."
      },
      {
        id: "driftVelocity",
        name: "Parallel Drift Velocity (v∥)",
        unit: "m/s",
        min: 0.0,
        max: 3.0,
        step: 0.2,
        defaultValue: 0.8,
        description: "Velocity component parallel to the B field producing helical pitch."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Inversion of Orbit Direction by Charge Sign",
        instruction: "Switch particle charge from +1 (Proton) to -1 (Electron). Notice the right-hand rule circular rotation reverses direction.",
        hint: "Lorentz force F = q(v × B). When charge q changes sign, the cross-product direction flips 180°.",
        explanation: "This allows mass spectrometers and particle accelerators to separate isotopes and antimatter!"
      },
      {
        id: "c2",
        title: "Shrink Gyroradius with Stronger Field",
        instruction: "Increase Magnetic Field B to maximum (3.0 T). Observe the tight spiral radius r = mv / (qB).",
        hint: "Higher magnetic flux density exerts greater centripetal curvature.",
        explanation: "This principle confines 100-million-degree thermonuclear fusion plasma inside Tokamak reactors!"
      }
    ],
    init: (params) => ({
      trail: [] as [number, number, number][]
    }),
    update: (state, t, dt, params) => {
      const B = params?.bField ?? 1.2;
      const q = params?.charge === 0 ? 0.001 : (params?.charge ?? 1);
      const vPerp = params?.velocity ?? 3.0;
      const vPara = params?.driftVelocity ?? 0.8;
      const m = 1.0; // Normalized mass

      // Cyclotron frequency & Gyroradius
      const omegaC = (Math.abs(q) * B) / m;
      const rLarmor = (m * vPerp) / (Math.abs(q) * B);
      const period = (2 * Math.PI) / omegaC;
      const pitchLength = vPara * period;

      const sign = q > 0 ? 1 : -1;
      const currentAngle = sign * omegaC * t;

      const px = rLarmor * Math.cos(currentAngle);
      const pz = rLarmor * Math.sin(currentAngle);
      const py = ((vPara * t) % 8.0) - 4.0;

      // Velocity components
      const vx = -sign * vPerp * Math.sin(currentAngle);
      const vz = sign * vPerp * Math.cos(currentAngle);
      const vy = vPara;

      // Lorentz Force components: F = q * (v × B), where B is along Y axis (0, B, 0)
      // v × B = (vz*B - 0, 0 - 0, 0 - vx*B) = (vz*B, 0, -vx*B)
      const fx = q * vz * B;
      const fz = -q * vx * B;
      const forceMag = Math.sqrt(fx * fx + fz * fz);

      if (!state) state = { trail: [] };
      if (!state.trail || !Array.isArray(state.trail)) {
        state.trail = [];
      }
      const trail = state.trail;
      trail.push([px, py, pz]);
      if (trail.length > 300) {
        trail.shift();
      }

      const nodes: any[] = [
        {
          id: "charged_ion",
          x: px,
          y: py,
          z: pz,
          radius: 0.22,
          color: q > 0 ? "#f43f5e" : "#38bdf8",
          name: `${q > 0 ? "Positive Ion (q > 0)" : "Negative Electron (q < 0)"}`
        }
      ];

      const rods: any[] = [];

      // Magnetic Field Lines (Cyan Vertical Arrows along Y)
      for (let bx = -3.5; bx <= 3.5; bx += 1.8) {
        for (let bz = -3.5; bz <= 3.5; bz += 1.8) {
          rods.push({
            from: [bx, -4.5, bz],
            to: [bx, 4.5, bz],
            color: "rgba(6, 182, 212, 0.2)",
            radius: 0.015,
            label: "B Field"
          });
        }
      }

      // Velocity Vector (Green Arrow)
      const vScale = 0.35;
      rods.push({
        from: [px, py, pz],
        to: [px + vx * vScale, py + vy * vScale, pz + vz * vScale],
        color: "#22c55e",
        radius: 0.045,
        label: `v = ${(Math.sqrt(vPerp * vPerp + vPara * vPara)).toFixed(1)} m/s`
      });

      // Lorentz Force Vector (Red Inward Arrow)
      const fScale = 0.25;
      rods.push({
        from: [px, py, pz],
        to: [px + (fx / (forceMag || 1)) * 1.2, py, pz + (fz / (forceMag || 1)) * 1.2],
        color: "#ef4444",
        radius: 0.045,
        label: `F_Lorentz = ${forceMag.toFixed(1)} N`
      });

      return {
        title: "Lorentz Force & Helical Cyclotron Particle Motion",
        description: `Charged particle (q = ${q}e, m = 1.0) moving through uniform magnetic field B = ${B.toFixed(1)} T. The magnetic force acts perpendicular to both velocity and field vectors, driving uniform helical gyration with Larmor radius rL = ${rLarmor.toFixed(2)} m.`,
        category: "electromagnetism",
        metrics: {
          "Magnetic Field (B)": `${B.toFixed(1)} Tesla`,
          "Particle Charge (q)": `${q > 0 ? "+" : ""}${q} e`,
          "Larmor Gyroradius (rL)": `${rLarmor.toFixed(2)} m`,
          "Cyclotron Frequency (ωc)": `${omegaC.toFixed(2)} rad/s`,
          "Helical Pitch Length": `${pitchLength.toFixed(2)} m`,
          "Lorentz Force Magnitude": `${forceMag.toFixed(2)} N`
        },
        nodes,
        rods,
        trail,
        formulas: [
          "Lorentz Force Law: F = q · (E + v × B)",
          "Cyclotron Radius: r_L = (m · v⊥) / (|q| · B)",
          "Cyclotron Frequency: ω_c = (|q| · B) / m",
          "Work by Magnetic Field: W = ∫ F · ds = 0 (Speed is constant)"
        ]
      };
    }
  },
  {
    id: "ac_generator",
    name: "AC Generator & Faraday Electromagnetic Induction",
    icon: "⚡",
    category: "electromagnetism",
    prompt: "Show me an AC generator coil rotating in magnetic field with induced EMF sine wave output",
    description: "Faraday's Law of Induction (ε = -dΦ/dt), magnetic flux through rotating armature coil (Φ = B A cos(ωt)), Fleming's Right-Hand Rule, and sinusoidal AC voltage waveform.",
    parameters: [
      {
        id: "rotationSpeed",
        name: "Coil Rotational Speed (ω)",
        unit: "rad/s",
        min: 0.5,
        max: 5.0,
        step: 0.2,
        defaultValue: 2.0,
        description: "Angular speed of mechanical turbine spinning the armature loop."
      },
      {
        id: "bField",
        name: "Stator Magnetic Field (B)",
        unit: "Tesla",
        min: 0.5,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.5,
        description: "Magnetic flux density between permanent North and South pole shoes."
      },
      {
        id: "coilTurns",
        name: "Coil Turns (N)",
        unit: "turns",
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 50,
        description: "Number of insulated wire loop turns in the armature winding."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Understand 90° Phase Offset between Flux and EMF",
        instruction: "Notice that when magnetic flux Φ is at its maximum (coil horizontal, cos(ωt) = 1), the induced EMF voltage is exactly ZERO (dΦ/dt = 0).",
        hint: "Faraday's Law depends on the RATE OF CHANGE of flux, not the absolute flux itself.",
        explanation: "When coil is vertical, flux is passing through zero at maximum speed, producing PEAK induced EMF voltage!"
      }
    ],
    init: (params) => ({
      angle: 0
    }),
    update: (state, t, dt, params) => {
      const omega = params?.rotationSpeed ?? 2.0;
      const B = params?.bField ?? 1.5;
      const N = params?.coilTurns ?? 50;
      const A = 0.8; // Coil Area (m²)

      const theta = omega * t;
      const flux = B * A * Math.cos(theta); // Magnetic Flux (Webers)
      const emf = N * B * A * omega * Math.sin(theta); // Induced EMF (Volts)
      const peakEmf = N * B * A * omega;

      // Armature Coil rectangular vertices in 3D
      const w = 1.6;
      const h = 2.4;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Rotating rectangle points
      const p1: [number, number, number] = [-w / 2, h / 2 * cosT, h / 2 * sinT];
      const p2: [number, number, number] = [w / 2, h / 2 * cosT, h / 2 * sinT];
      const p3: [number, number, number] = [w / 2, -h / 2 * cosT, -h / 2 * sinT];
      const p4: [number, number, number] = [-w / 2, -h / 2 * cosT, -h / 2 * sinT];

      const nodes: any[] = [
        // North & South Magnetic Poles
        { id: "north_pole", x: 0, y: 3.2, z: 0, radius: 0.4, color: "#ef4444", name: "North Stator Magnet (N)" },
        { id: "south_pole", x: 0, y: -3.2, z: 0, radius: 0.4, color: "#38bdf8", name: "South Stator Magnet (S)" },
        { id: "axis_front", x: -w / 2 - 0.5, y: 0, z: 0, radius: 0.12, color: "#94a3b8", name: "Rotor Axle" },
        { id: "axis_back", x: w / 2 + 0.5, y: 0, z: 0, radius: 0.12, color: "#94a3b8", name: "Slip Rings & Carbon Brushes" }
      ];

      const rods: any[] = [
        // Magnetic Stator Field Lines (Red to Blue vertical)
        { from: [-1.2, 2.8, 0], to: [-1.2, -2.8, 0], color: "rgba(239, 68, 68, 0.3)", radius: 0.02 },
        { from: [0, 2.8, 0], to: [0, -2.8, 0], color: "rgba(239, 68, 68, 0.4)", radius: 0.025 },
        { from: [1.2, 2.8, 0], to: [1.2, -2.8, 0], color: "rgba(239, 68, 68, 0.3)", radius: 0.02 },

        // Armature Coil Wire Perimeter
        { from: p1, to: p2, color: "#facc15", radius: 0.06 },
        { from: p2, to: p3, color: "#facc15", radius: 0.06 },
        { from: p3, to: p4, color: "#facc15", radius: 0.06 },
        { from: p4, to: p1, color: "#facc15", radius: 0.06 },

        // Central Rotation Axle
        { from: [-w / 2 - 0.8, 0, 0], to: [w / 2 + 0.8, 0, 0], color: "#64748b", radius: 0.04 }
      ];

      // Induced electric current flow particles around loop
      const particles: any[] = [];
      const numElectrons = 16;
      for (let i = 0; i < numElectrons; i++) {
        const prog = ((t * (emf > 0 ? 1 : -1) * 1.5 + i / numElectrons) % 1);
        let ex = 0, ey = 0, ez = 0;
        if (prog < 0.25) {
          const sub = prog / 0.25;
          ex = p1[0] + (p2[0] - p1[0]) * sub;
          ey = p1[1] + (p2[1] - p1[1]) * sub;
          ez = p1[2] + (p2[2] - p1[2]) * sub;
        } else if (prog < 0.5) {
          const sub = (prog - 0.25) / 0.25;
          ex = p2[0] + (p3[0] - p2[0]) * sub;
          ey = p2[1] + (p3[1] - p2[1]) * sub;
          ez = p2[2] + (p3[2] - p2[2]) * sub;
        } else if (prog < 0.75) {
          const sub = (prog - 0.5) / 0.25;
          ex = p3[0] + (p4[0] - p3[0]) * sub;
          ey = p3[1] + (p4[1] - p3[1]) * sub;
          ez = p3[2] + (p4[2] - p3[2]) * sub;
        } else {
          const sub = (prog - 0.75) / 0.25;
          ex = p4[0] + (p1[0] - p4[0]) * sub;
          ey = p4[1] + (p1[1] - p4[1]) * sub;
          ez = p4[2] + (p1[2] - p4[2]) * sub;
        }

        particles.push({
          x: ex,
          y: ey,
          z: ez,
          color: Math.abs(emf) > 5 ? "#10b981" : "#facc15",
          size: 0.05
        });
      }

      return {
        title: "AC Electromagnetic Generator & Faraday Induction",
        description: `Armature coil (N = ${N} turns, Area A = ${A} m²) spinning at ω = ${omega.toFixed(1)} rad/s inside uniform field B = ${B.toFixed(1)} T. Continuous variation in magnetic flux induces alternating sinusoidal electromotive force ε(t) = ${emf.toFixed(1)} V.`,
        category: "electromagnetism",
        metrics: {
          "Instantaneous EMF (ε)": `${emf.toFixed(1)} V`,
          "Peak Voltage (ε₀)": `${peakEmf.toFixed(1)} V`,
          "Magnetic Flux (Φ)": `${(flux * 1000).toFixed(1)} mWb`,
          "AC Frequency (f)": `${(omega / (2 * Math.PI)).toFixed(2)} Hz`,
          "Current Direction": emf > 0 ? "Clockwise (Positive Half-Cycle)" : "Counter-Clockwise (Negative Half-Cycle)"
        },
        nodes,
        rods,
        particles,
        currentGraphSample: {
          time: t,
          voltage: emf,
          angle: (theta * 180 / Math.PI) % 360
        },
        formulas: [
          "Magnetic Flux: Φ_B = B · A · cos(ωt)",
          "Faraday's Law: ε = -N · (dΦ_B / dt)",
          "Induced EMF: ε(t) = N · B · A · ω · sin(ωt) = ε₀ · sin(ωt)",
          "Peak Voltage: ε₀ = N · B · A · ω"
        ]
      };
    }
  }
];
