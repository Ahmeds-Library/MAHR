import { SimulationPreset, SimulationData } from "../simulationTypes";

export const ASTRONOMY_SIMULATIONS: SimulationPreset[] = [
  {
    id: "solar_system",
    name: "Keplerian Planetary System & Gravitational Mechanics",
    icon: "🪐",
    category: "astronomy",
    prompt: "Simulate Keplerian orbits with orbital velocity variations, perihelion, aphelion, and gravitational vectors",
    description: "N-Body gravitational dynamics, Kepler's 3 Laws of Planetary Motion (Elliptical orbits, equal areas in equal times dA/dt = const, and harmonic period law T² ∝ a³).",
    parameters: [
      {
        id: "eccentricity",
        name: "Orbital Eccentricity (e)",
        unit: "",
        min: 0.0,
        max: 0.7,
        step: 0.05,
        defaultValue: 0.25,
        description: "Elliptical elongation of the orbit (e=0 is circular, e>0 is elongated ellipse)."
      },
      {
        id: "starMass",
        name: "Central Star Mass (M)",
        unit: "M☉",
        min: 0.5,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.0,
        description: "Mass of the central stellar body in solar mass units."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Verify Kepler's 2nd Law (Areal Velocity Conservation)",
        instruction: "Set Eccentricity e = 0.5 and observe the planet accelerating rapidly when closest to the star (Perihelion) and slowing down when farthest away (Aphelion).",
        hint: "Angular momentum L = m · r × v is strictly conserved in any central force field.",
        explanation: "Because L is constant, the planet sweeps out equal areas in equal intervals of time (dA/dt = L / 2m)!"
      }
    ],
    init: (params) => ({
      planets: [
        { name: "Mercury", a: 1.5, e: 0.2, color: "#94a3b8", radius: 0.14 },
        { name: "Venus", a: 2.2, e: 0.05, color: "#f59e0b", radius: 0.2 },
        { name: "Earth", a: 3.1, e: 0.15, color: "#38bdf8", radius: 0.22 },
        { name: "Mars", a: 4.2, e: 0.3, color: "#ef4444", radius: 0.18 },
        { name: "Jupiter", a: 5.8, e: 0.1, color: "#d97706", radius: 0.45 }
      ]
    }),
    update: (state, t, dt, params) => {
      const globalE = params?.eccentricity ?? 0.25;
      const M = params?.starMass ?? 1.0;

      const nodes: any[] = [
        { id: "star_core", x: 0, y: 0, z: 0, radius: 0.65, color: "#fbbf24", name: `Central Star (M = ${M.toFixed(1)} M☉)` }
      ];

      const rods: any[] = [];
      const particles: any[] = [];

      state.planets.forEach((p: any, idx: number) => {
        const a = p.a;
        const e = Math.min(globalE + p.e * 0.2, 0.85);
        const b = a * Math.sqrt(1 - e * e); // Semi-minor axis
        const c = a * e; // Focal offset distance

        // Mean motion n = sqrt(G*M / a^3)
        const n = Math.sqrt(M / (a * a * a)) * 1.5;
        const M_anomaly = (t * n) % (Math.PI * 2);

        // Solve Kepler's equation M = E - e*sin(E) by Newton iteration
        let E = M_anomaly;
        for (let iter = 0; iter < 4; iter++) {
          E = E - (E - e * Math.sin(E) - M_anomaly) / (1 - e * Math.cos(E));
        }

        // True position in ellipse
        const px = a * (Math.cos(E) - e);
        const pz = b * Math.sin(E);
        const py = 0;

        const rDist = Math.sqrt(px * px + pz * pz);
        const vOrbital = Math.sqrt(M * (2 / (rDist || 1) - 1 / a)) * 29.8; // km/s scale

        nodes.push({
          id: `planet_${idx}`,
          x: px,
          y: py,
          z: pz,
          radius: p.radius,
          color: p.color,
          name: `${p.name} (r = ${rDist.toFixed(2)} AU, v = ${vOrbital.toFixed(1)} km/s)`
        });

        // Gravitational tether vector
        rods.push({
          from: [0, 0, 0] as [number, number, number],
          to: [px, py, pz] as [number, number, number],
          color: "rgba(6, 182, 212, 0.15)",
          radius: 0.015
        });

        // Render full elliptical orbit trail
        for (let seg = 0; seg < 32; seg++) {
          const theta = (seg / 32) * Math.PI * 2;
          const ox = a * (Math.cos(theta) - e);
          const oz = b * Math.sin(theta);
          particles.push({
            x: ox,
            y: 0,
            z: oz,
            color: p.color,
            size: 0.02
          });
        }
      });

      return {
        title: "Keplerian Planetary Mechanics & Gravitational Orbits",
        description: `Simulating Keplerian celestial orbits around a star of mass M = ${M.toFixed(1)} M☉. Orbital speed constantly varies according to the Vis-Viva equation: v² = GM(2/r - 1/a).`,
        category: "astronomy",
        metrics: {
          "Star Mass (M)": `${M.toFixed(1)} M☉`,
          "Earth Orbit Eccentricity": `${globalE.toFixed(2)}`,
          "Kepler 3rd Law": "T² / a³ = 4π² / (G·M) = constant",
          "Areal Velocity (dA/dt)": "Constant (Conserved Angular Momentum)",
          "Perihelion Speed Multiplier": `${((1 + globalE) / (1 - globalE)).toFixed(2)}x vs Aphelion`
        },
        nodes,
        rods,
        particles,
        formulas: [
          "Kepler's First Law: r(θ) = a(1 - e²) / (1 + e · cosθ)",
          "Kepler's Second Law: dA/dt = 1/2 · r² · (dθ/dt) = L / (2m) = const",
          "Kepler's Third Law: T² = (4π² / GM) · a³",
          "Vis-Viva Speed Formula: v = √( GM · (2/r - 1/a) )"
        ]
      };
    }
  },
  {
    id: "black_hole",
    name: "Kerr Black Hole Spacetime & Accretion Disk",
    icon: "🕳️",
    category: "astronomy",
    prompt: "Show me a spinning Kerr black hole with event horizon, ergosphere frame dragging, and relativistic accretion disk",
    description: "General Relativity Einstein field equations around a rotating Kerr black hole, showing Event Horizon (r+), Ergosphere boundary, Photon Sphere (1.5 rs), frame-dragging gravitomagnetic Lense-Thirring effect, and gravitational redshift.",
    parameters: [
      {
        id: "spinParameter",
        name: "Black Hole Spin (a = J/M)",
        unit: "",
        min: 0.0,
        max: 0.99,
        step: 0.05,
        defaultValue: 0.85,
        description: "Dimensionless angular momentum spin parameter (0 is static Schwarzschild, 0.99 is near-extremal Kerr)."
      },
      {
        id: "mass",
        name: "Black Hole Mass (M)",
        unit: "M☉",
        min: 3.0,
        max: 30.0,
        step: 1.0,
        defaultValue: 10.0,
        description: "Mass of the stellar or intermediate-mass black hole in solar masses."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Spacetime Frame-Dragging in the Ergosphere",
        instruction: "Increase Spin parameter 'a' towards 0.95. Notice the outer Ergosphere boundary bulges at the equator, dragging all matter and spacetime itself at superluminal rotation rates.",
        hint: "Inside the Ergosphere (r < r_ergo), stationary observers cannot exist (the Penrose Process allows energy extraction)!",
        explanation: "Roger Penrose won the 2020 Nobel Prize in Physics for showing how black hole formation is a robust prediction of General Relativity."
      }
    ],
    init: (params) => ({
      particlesCount: 140
    }),
    update: (state, t, dt, params) => {
      const a = params?.spinParameter ?? 0.85;
      const M = params?.mass ?? 10.0;

      // Schwarzschild & Kerr Radii
      const rs = 1.2; // Visual scale
      const rPlus = (rs / 2) * (1 + Math.sqrt(Math.max(0, 1 - a * a))); // Event Horizon
      const rPhoton = rs * (1 + Math.cos((2 / 3) * Math.acos(-a))); // Photon orbit

      const nodes: any[] = [
        { id: "event_horizon", x: 0, y: 0, z: 0, radius: rPlus, color: "#000000", name: `Event Horizon (r+ = ${rPlus.toFixed(2)})` }
      ];

      const rods: any[] = [];
      const particles: any[] = [];

      // Relativistic Accretion Disk with Doppler beaming (Approaching side is brighter/bluer, receding is redder)
      const numDiskParticles = 160;
      for (let i = 0; i < numDiskParticles; i++) {
        const ringRadius = 1.4 + Math.sqrt(i / numDiskParticles) * 3.2;
        const orbitalSpeed = Math.sqrt(1 / (ringRadius * ringRadius * ringRadius)) * 3.5 * (1 + a * 0.4);
        const theta = (i * 0.35 + t * orbitalSpeed) % (Math.PI * 2);

        const px = ringRadius * Math.cos(theta);
        const pz = ringRadius * Math.sin(theta);
        const py = (Math.sin(i * 13) * 0.12) * (1 - Math.exp(-ringRadius));

        // Doppler Beaming: Left side coming towards viewer (px < 0) gets blue-shifted, right side gets redshifted
        let pColor = "#f97316";
        if (Math.sin(theta) > 0.3) {
          pColor = "#38bdf8"; // Relativistic blueshift
        } else if (Math.sin(theta) < -0.3) {
          pColor = "#ef4444"; // Relativistic redshift
        } else {
          pColor = "#facc15";
        }

        particles.push({
          x: px,
          y: py,
          z: pz,
          color: pColor,
          size: 0.05
        });
      }

      // Ergosphere Wireframe Rings
      for (let ring = -3; ring <= 3; ring++) {
        const latAngle = (ring / 4) * (Math.PI / 2);
        const rErgo = (rs / 2) * (1 + Math.sqrt(Math.max(0, 1 - a * a * Math.cos(latAngle) ** 2)));
        const rRing = rErgo * Math.cos(latAngle);
        const yRing = rErgo * Math.sin(latAngle);

        for (let seg = 0; seg < 24; seg++) {
          const theta = (seg / 24) * Math.PI * 2;
          particles.push({
            x: rRing * Math.cos(theta),
            y: yRing,
            z: rRing * Math.sin(theta),
            color: "rgba(168, 85, 247, 0.4)",
            size: 0.025
          });
        }
      }

      return {
        title: "Kerr Spinning Black Hole Spacetime Laboratory",
        description: `General Relativistic Kerr metric around rotating black hole (M = ${M} M☉, dimensionless spin a* = ${a.toFixed(2)}). Features dynamic frame dragging, ergosphere boundary, and Doppler boosted relativistic accretion disk.`,
        category: "astronomy",
        metrics: {
          "Black Hole Mass": `${M} M☉`,
          "Dimensionless Spin (a*)": `${a.toFixed(2)} (${(a * 100).toFixed(0)}% of Extremal Speed)`,
          "Event Horizon (r+)": `${(rPlus * 2.95 * M / 10).toFixed(1)} km`,
          "Ergosphere Equatorial Radius": `${(rs * 2.95 * M / 10).toFixed(1)} km`,
          "Innermost Stable Orbit (ISCO)": `${(rPhoton * 2.95 * M / 10).toFixed(1)} km`,
          "Penrose Energy Extraction": "Active inside Ergosphere"
        },
        nodes,
        rods,
        particles,
        formulas: [
          "Kerr Horizon: r± = M ± √(M² - a²)",
          "Ergosphere Boundary: r_ergo(θ) = M + √(M² - a² · cos²θ)",
          "Gravitational Redshift: 1 + z = (1 - 2GM/rc²)^(-1/2)",
          "Frame Dragging Angular Frequency: ω = 2aMr / ( (r² + a²)² - Δ a² sin²θ )"
        ]
      };
    }
  }
];
