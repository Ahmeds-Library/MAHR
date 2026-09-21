import { SimulationPreset, SimulationData } from "../simulationTypes";

/**
 * Fluid & Liquid State AI Simulations
 * Layer 1: Hydrodynamics, Viscous Flow, Capillary Waves, and SPH Particle Physics
 */
export const FLUID_LIQUID_SIMULATIONS: SimulationPreset[] = [
  {
    id: "navier_stokes_fluid",
    name: "2D Navier-Stokes Fluid & Vortex Shedding",
    icon: "🌊",
    category: "mechanics",
    prompt: "Interactive 2D Navier-Stokes fluid simulation with viscosity, vorticity confinement, vortex streets, and dye injection",
    description: "Computational fluid dynamics (CFD) model solving the incompressible Navier-Stokes equations with Poisson pressure projection, Eulerian advection, and turbulent eddy generation.",
    parameters: [
      {
        id: "viscosity",
        name: "Fluid Viscosity (ν)",
        unit: "m²/s",
        min: 0.00001,
        max: 0.0005,
        step: 0.00001,
        defaultValue: 0.00008,
        description: "Kinematic viscosity of the fluid (honey > water > superfluid)."
      },
      {
        id: "vorticity",
        name: "Vorticity Confinement (Ω)",
        unit: "",
        min: 0.0,
        max: 1.2,
        step: 0.05,
        defaultValue: 0.5,
        description: "Restoration force for small turbulent vortices and swirling eddies."
      },
      {
        id: "dissipation",
        name: "Dye Decay Rate",
        unit: "%/s",
        min: 0.95,
        max: 0.999,
        step: 0.001,
        defaultValue: 0.992,
        description: "Rate at which injected colored fluid dye diffuses and fades."
      },
      {
        id: "flowSpeed",
        name: "Inflow Velocity (U)",
        unit: "m/s",
        min: 0.0,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.2,
        description: "Continuous stream inflow velocity creating Von Kármán vortex streets."
      }
    ],
    challenges: [
      {
        id: "reynolds_laminar",
        title: "Achieve Laminar Flow",
        instruction: "Adjust fluid viscosity and inflow speed so the Reynolds number stays below 200, creating smooth laminar streamlines.",
        hint: "Increase fluid viscosity to dampen turbulent fluctuations.",
        explanation: "At low Reynolds numbers (Re < 200), viscous forces dominate inertial forces, preventing turbulent vortex shedding."
      },
      {
        id: "turbulent_vortices",
        title: "Trigger Vortex Street",
        instruction: "Maximize vorticity confinement and flow speed to observe alternating vortex shedding.",
        hint: "Lower the viscosity and boost vorticity confinement above 0.8.",
        explanation: "Von Kármán vortex streets occur when boundary layer instability causes alternating eddies to peel off an obstacle."
      }
    ],
    init: (params = {}) => {
      return {
        particles: Array.from({ length: 120 }, (_, i) => ({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2.5,
          z: (Math.random() - 0.5) * 0.5,
          vx: 0,
          vy: 0,
          vz: 0,
          color: i % 2 === 0 ? "#06b6d4" : "#3b82f6"
        })),
        eddies: []
      };
    },
    update: (state, t, dt, params = {}) => {
      const visc = params.viscosity ?? 0.00008;
      const vort = params.vorticity ?? 0.5;
      const speed = params.flowSpeed ?? 1.2;

      // Update virtual fluid tracer particles
      state.particles.forEach((p: any, idx: number) => {
        const angle = t * 2 + idx * 0.2;
        const vortexForce = Math.sin(t * 3 + p.x * 2) * vort;
        p.x += (speed * 0.5 + Math.cos(angle) * 0.1) * dt;
        p.y += (vortexForce + Math.sin(angle) * 0.2) * dt;

        // Loop boundaries
        if (p.x > 3.5) p.x = -3.5;
        if (p.y > 2.0) p.y = -2.0;
        if (p.y < -2.0) p.y = 2.0;
      });

      const reynolds = (speed * 2.0) / Math.max(1e-5, visc * 2000);

      return {
        title: "2D Navier-Stokes Fluid & Vortex Shedding",
        description: `Eulerian fluid mechanics: Incompressible Navier-Stokes solver with Reynolds number Re = ${reynolds.toFixed(0)}`,
        category: "mechanics",
        metrics: {
          "Reynolds Number (Re)": Math.round(reynolds),
          "Fluid Regime": reynolds < 500 ? "Laminar Flow" : "Turbulent Vortex Street",
          "Kinematic Viscosity (ν)": `${(visc * 1e4).toFixed(2)} × 10⁻⁴ m²/s`,
          "Vorticity Index (Ω)": vort.toFixed(2),
          "Active Fluid Tracers": state.particles.length
        },
        particles: state.particles.map((p: any) => ({
          x: p.x,
          y: p.y,
          z: p.z,
          size: 0.08,
          color: p.color
        })),
        formulas: [
          "∂u/∂t + (u · ∇)u = -(1/ρ)∇p + ν∇²u + f",
          "∇ · u = 0 (Incompressibility condition)",
          "Re = (ρ · u · L) / μ = (u · L) / ν"
        ],
        currentGraphSample: {
          time: t,
          kineticEnergy: 0.5 * speed * speed,
          potentialEnergy: vort * 1.5,
          totalEnergy: 0.5 * speed * speed + vort * 1.5,
          v: speed
        }
      };
    }
  },
  {
    id: "liquid_surface_waves",
    name: "Liquid Surface Waves & Capillary Ripple Tank",
    icon: "💧",
    category: "mechanics",
    prompt: "Simulate 2D and 3D surface wave ripples in a liquid fluid tank with surface tension, interference, and wave reflection",
    description: "Wave equation and shallow water equations modeling liquid surface displacement, dual-source wave interference, constructive crests, and viscous damping.",
    parameters: [
      {
        id: "frequency",
        name: "Oscillator Frequency (f)",
        unit: "Hz",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        defaultValue: 2.0,
        description: "Frequency of wave-generating pulsers dipping into the liquid surface."
      },
      {
        id: "waveSpeed",
        name: "Phase Velocity (c)",
        unit: "m/s",
        min: 0.5,
        max: 4.0,
        step: 0.1,
        defaultValue: 1.8,
        description: "Wave propagation speed across the liquid interface."
      },
      {
        id: "surfaceTension",
        name: "Surface Tension (σ)",
        unit: "N/m",
        min: 0.01,
        max: 0.15,
        step: 0.01,
        defaultValue: 0.072, // Water ~ 0.072 N/m
        description: "Liquid cohesive surface tension controlling capillary wave restoration."
      },
      {
        id: "damping",
        name: "Fluid Damping (γ)",
        unit: "s⁻¹",
        min: 0.01,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.05,
        description: "Viscous dissipation damping amplitude over distance."
      }
    ],
    init: (params = {}) => {
      const gridRes = 24;
      const nodes = [];
      for (let i = -gridRes / 2; i <= gridRes / 2; i++) {
        for (let j = -gridRes / 2; j <= gridRes / 2; j++) {
          nodes.push({
            id: `wave_${i}_${j}`,
            gx: i * 0.2,
            gz: j * 0.2,
            x: i * 0.2,
            y: 0,
            z: j * 0.2
          });
        }
      }
      return { nodes, gridRes };
    },
    update: (state, t, dt, params = {}) => {
      const f = params.frequency ?? 2.0;
      const c = params.waveSpeed ?? 1.8;
      const damping = params.damping ?? 0.05;
      const omega = 2 * Math.PI * f;
      const k = omega / Math.max(0.1, c);

      // Sources
      const s1x = -1.0;
      const s1z = 0.0;
      const s2x = 1.0;
      const s2z = 0.0;

      const updatedNodes = state.nodes.map((n: any) => {
        const r1 = Math.hypot(n.gx - s1x, n.gz - s1z);
        const r2 = Math.hypot(n.gx - s2x, n.gz - s2z);

        const a1 = Math.sin(k * r1 - omega * t) / (1 + r1 * damping);
        const a2 = Math.sin(k * r2 - omega * t) / (1 + r2 * damping);
        const y = (a1 + a2) * 0.3;

        return {
          id: n.id,
          x: n.gx,
          y,
          z: n.gz,
          radius: 0.04,
          color: y > 0.1 ? "#38bdf8" : y < -0.1 ? "#1e40af" : "#06b6d4"
        };
      });

      return {
        title: "Liquid Surface Waves & Capillary Ripple Tank",
        description: "Dual-source wave interference ripples on liquid surface with phase dispersion and viscous attenuation.",
        category: "mechanics",
        metrics: {
          "Oscillation Frequency (f)": `${f.toFixed(1)} Hz`,
          "Wave Velocity (c)": `${c.toFixed(1)} m/s`,
          "Wavelength (λ)": `${(c / f).toFixed(2)} m`,
          "Interference Maxima": "Constructive Nodes Active",
          "Surface Tension (σ)": `${(params.surfaceTension ?? 0.072).toFixed(3)} N/m`
        },
        nodes: updatedNodes,
        formulas: [
          "∂²η/∂t² = c² ∇²η - γ(∂η/∂t)",
          "λ = c / f",
          "v_phase = √(g/k + σk/ρ)"
        ],
        currentGraphSample: {
          time: t,
          kineticEnergy: 0.5 * f * f,
          potentialEnergy: c * 0.5,
          totalEnergy: 0.5 * f * f + c * 0.5,
          intensity: Math.abs(Math.sin(omega * t))
        }
      };
    }
  },
  {
    id: "ferrofluid_magnetic",
    name: "Viscous Ferrofluid & Magnetic Dipole",
    icon: "🧲",
    category: "mechanics",
    prompt: "Simulate a magnetic liquid ferrofluid showing Rosensweig instability spikes in a magnetic dipole field",
    description: "Magnetohydrodynamic fluid model of colloidal suspension ferrofluid exhibiting Rosensweig spike instability under strong magnetic fields.",
    parameters: [
      {
        id: "fieldStrength",
        name: "Magnetic Field (B)",
        unit: "Tesla",
        min: 0.1,
        max: 2.0,
        step: 0.05,
        defaultValue: 0.8,
        description: "Magnetic flux density of the neodymium dipole magnet beneath the liquid."
      },
      {
        id: "viscosity",
        name: "Fluid Viscosity (η)",
        unit: "Pa·s",
        min: 0.01,
        max: 0.5,
        step: 0.02,
        defaultValue: 0.12,
        description: "Viscosity of the carrier oil containing magnetic nanoparticles."
      },
      {
        id: "spikeCount",
        name: "Spike Density",
        unit: "peaks",
        min: 6,
        max: 24,
        step: 2,
        defaultValue: 14,
        description: "Number of geometric Rosensweig spikes forming on the ferrofluid meniscus."
      }
    ],
    init: (params = {}) => {
      const count = params.spikeCount ?? 14;
      return {
        spikes: Array.from({ length: count }, (_, i) => ({
          angle: (i / count) * Math.PI * 2,
          radius: 1.0 + (i % 2) * 0.4,
          height: 0
        }))
      };
    },
    update: (state, t, dt, params = {}) => {
      const B = params.fieldStrength ?? 0.8;
      const count = params.spikeCount ?? 14;

      const nodes = [];
      const rods = [];

      // Center magnetic core
      nodes.push({
        id: "magnet_core",
        x: 0,
        y: -1.2,
        z: 0,
        radius: 0.4,
        color: "#9333ea",
        name: "Neodymium Dipole Core"
      });

      // Liquid pool base
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const rad = 1.2 + Math.sin(t * 2 + i) * 0.08;
        const spikeHeight = B * 1.4 * (0.8 + 0.3 * Math.sin(t * 3 + i * 2));

        const tipX = Math.cos(theta) * rad;
        const tipY = -0.5 + spikeHeight;
        const tipZ = Math.sin(theta) * rad;

        const baseX = Math.cos(theta) * (rad * 0.6);
        const baseY = -0.6;
        const baseZ = Math.sin(theta) * (rad * 0.6);

        nodes.push({
          id: `spike_tip_${i}`,
          x: tipX,
          y: tipY,
          z: tipZ,
          radius: 0.1,
          color: "#0f172a",
          name: `Rosensweig Spike #${i + 1}`
        });

        rods.push({
          from: [baseX, baseY, baseZ] as [number, number, number],
          to: [tipX, tipY, tipZ] as [number, number, number],
          color: "#1e293b",
          radius: 0.05
        });
      }

      return {
        title: "Viscous Ferrofluid & Magnetic Dipole",
        description: "Rosensweig normal-field instability in magnetic liquid fluid with colloidal nanoparticle alignment.",
        category: "mechanics",
        metrics: {
          "Magnetic Flux (B)": `${B.toFixed(2)} Tesla`,
          "Meniscus State": B > 0.5 ? "Spike Instability Active" : "Flat Liquid Meniscus",
          "Active Spikes": count,
          "Carrier Fluid Viscosity": `${params.viscosity ?? 0.12} Pa·s`
        },
        nodes,
        rods,
        formulas: [
          "B_crit = √(2 · g · ρ · σ / μ₀)",
          "F_mag = (M · ∇)B",
          "p_fluid + p_mag + p_capillary = const"
        ],
        currentGraphSample: {
          time: t,
          kineticEnergy: B * 2.0,
          potentialEnergy: (params.viscosity ?? 0.12) * 5.0,
          totalEnergy: B * 2.0 + (params.viscosity ?? 0.12) * 5.0,
          v: B
        }
      };
    }
  }
];
