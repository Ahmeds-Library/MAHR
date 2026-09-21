import { SimulationPreset, SimulationData } from "../simulationTypes";

export const MECHANICS_SIMULATIONS: SimulationPreset[] = [
  {
    id: "projectile_motion",
    name: "3D Projectile Motion Laboratory & Vector Field",
    icon: "🎯",
    category: "mechanics",
    prompt: "Show me 3D projectile motion with launch angle, initial speed, air resistance, and real-time velocity vectors",
    description: "Ballistic kinematics in 2D/3D with gravitational acceleration, quadratic aerodynamic drag, trajectory path trace, and instantaneous vector decomposition (vx, vy, net velocity v, and acceleration g).",
    parameters: [
      {
        id: "launchAngle",
        name: "Launch Angle (θ)",
        unit: "°",
        min: 5,
        max: 85,
        step: 1,
        defaultValue: 45,
        description: "Angle of elevation for projectile launch above the horizontal ground."
      },
      {
        id: "initialVelocity",
        name: "Initial Velocity (v₀)",
        unit: "m/s",
        min: 5,
        max: 40,
        step: 1,
        defaultValue: 20,
        description: "Muzzle velocity of the cannon or projectile launcher."
      },
      {
        id: "gravity",
        name: "Gravitational Field (g)",
        unit: "m/s²",
        min: 1.62, // Moon
        max: 24.79, // Jupiter
        step: 0.1,
        defaultValue: 9.81, // Earth
        description: "Local gravitational field acceleration (Earth=9.81, Moon=1.62, Mars=3.71, Jupiter=24.79)."
      },
      {
        id: "airResistance",
        name: "Air Drag Coefficient (Cd)",
        unit: "",
        min: 0.0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.05,
        description: "Aerodynamic quadratic air resistance drag factor."
      },
      {
        id: "initialHeight",
        name: "Launch Platform Height (y₀)",
        unit: "m",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 0,
        description: "Height of the launching cliff or platform above target elevation."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Maximize Horizontal Range on Level Ground",
        instruction: "Set Air Resistance to 0.0 and find which launch angle achieves the maximum range.",
        hint: "Range R = (v₀² · sin(2θ)) / g. The maximum of sin(2θ) occurs when 2θ = 90°, so θ = 45°.",
        explanation: "At 45°, horizontal and vertical velocity components are equal (v_x = v_y = v₀ / √2), optimally trading off time of flight against horizontal velocity."
      },
      {
        id: "c2",
        title: "Observe Trajectory Distortion Under High Drag",
        instruction: "Increase Air Drag to 0.5 and observe how the descent angle steepens towards a terminal vertical plunge.",
        hint: "Air resistance continuously drains horizontal kinetic energy, causing the parabolic trajectory to distort into an asymmetric drop.",
        explanation: "This realistic ballistic path matches the actual flight of bullets, artillery shells, and baseballs in atmosphere!"
      }
    ],
    init: (params) => {
      return {
        traj: [] as [number, number, number][],
        simTime: 0
      };
    },
    update: (state, t, dt, params) => {
      const thetaDeg = params?.launchAngle ?? 45;
      const thetaRad = (thetaDeg * Math.PI) / 180;
      const v0 = params?.initialVelocity ?? 20;
      const g = params?.gravity ?? 9.81;
      const cd = params?.airResistance ?? 0.05;
      const y0 = params?.initialHeight ?? 0;

      // Analytical Ideal (vacuum) values
      const tFlightIdeal = (v0 * Math.sin(thetaRad) + Math.sqrt((v0 * Math.sin(thetaRad)) ** 2 + 2 * g * y0)) / g;
      const maxHIdeal = y0 + (v0 * Math.sin(thetaRad)) ** 2 / (2 * g);
      const rangeIdeal = v0 * Math.cos(thetaRad) * tFlightIdeal;

      // Compute numerical trajectory curve
      const substeps = 60;
      const dtStep = tFlightIdeal / substeps;
      let currX = 0;
      let currY = y0;
      let currVx = v0 * Math.cos(thetaRad);
      let currVy = v0 * Math.sin(thetaRad);

      const trajectoryPoints: [number, number, number][] = [];
      const scale = 0.2; // Visual scaling factor to fit 3D viewport

      for (let i = 0; i <= substeps; i++) {
        trajectoryPoints.push([currX * scale - 4, currY * scale - 1.5, 0]);

        const speed = Math.sqrt(currVx * currVx + currVy * currVy);
        const dragX = -cd * speed * currVx;
        const dragY = -cd * speed * currVy;

        const ax = dragX;
        const ay = -g + dragY;

        currVx += ax * dtStep;
        currVy += ay * dtStep;
        currX += currVx * dtStep;
        currY += currVy * dtStep;

        if (currY < 0) {
          currY = 0;
          trajectoryPoints.push([currX * scale - 4, 0 - 1.5, 0]);
          break;
        }
      }

      // Current moving projectile position
      const cycleTime = tFlightIdeal > 0 ? (t % (tFlightIdeal + 0.6)) : 0;
      const normT = Math.min(cycleTime / tFlightIdeal, 1.0);

      // Current kinematics
      let animX = 0;
      let animY = y0;
      let animVx = v0 * Math.cos(thetaRad);
      let animVy = v0 * Math.sin(thetaRad);

      const simSubsteps = 30;
      const simDt = (cycleTime) / (simSubsteps || 1);
      for (let s = 0; s < simSubsteps; s++) {
        const spd = Math.sqrt(animVx * animVx + animVy * animVy);
        const ax = -cd * spd * animVx;
        const ay = -g - cd * spd * animVy;
        animVx += ax * simDt;
        animVy += ay * simDt;
        animX += animVx * simDt;
        animY += animVy * simDt;
        if (animY < 0) {
          animY = 0;
          break;
        }
      }

      const pX = animX * scale - 4;
      const pY = animY * scale - 1.5;
      const pZ = 0;

      const currentSpeed = Math.sqrt(animVx * animVx + animVy * animVy);
      const mass = 2.0; // kg
      const kineticEnergy = 0.5 * mass * currentSpeed * currentSpeed;
      const potentialEnergy = mass * g * animY;
      const totalEnergy = kineticEnergy + potentialEnergy;

      const nodes: any[] = [
        { id: "cannon_pivot", x: -4, y: y0 * scale - 1.5, z: 0, radius: 0.18, color: "#38bdf8", name: `Launcher Platform (y₀ = ${y0}m)` },
        { id: "projectile", x: pX, y: pY, z: pZ, radius: 0.16, color: "#f43f5e", name: `Projectile (v = ${currentSpeed.toFixed(1)} m/s)` },
        { id: "apex_node", x: (rangeIdeal / 2) * scale - 4, y: maxHIdeal * scale - 1.5, z: 0, radius: 0.08, color: "#f59e0b", name: `Maximum Height Apex (${maxHIdeal.toFixed(1)}m)` },
        { id: "target_landing", x: currX * scale - 4, y: -1.5, z: 0, radius: 0.12, color: "#10b981", name: `Impact Point (R = ${currX.toFixed(1)}m)` }
      ];

      const rods: any[] = [
        // Ground line
        { from: [-5, -1.5, 0] as [number, number, number], to: [6, -1.5, 0] as [number, number, number], color: "#334155", radius: 0.03 }
      ];

      // Cannon barrel vector
      const barrelLen = 0.8;
      rods.push({
        from: [-4, y0 * scale - 1.5, 0],
        to: [-4 + barrelLen * Math.cos(thetaRad), (y0 * scale - 1.5) + barrelLen * Math.sin(thetaRad), 0],
        color: "#38bdf8",
        radius: 0.08
      });

      // Platform vertical tower if y0 > 0
      if (y0 > 0) {
        rods.push({
          from: [-4, -1.5, 0],
          to: [-4, y0 * scale - 1.5, 0],
          color: "#475569",
          radius: 0.06
        });
      }

      // Velocity Vector (Green Arrow)
      const vVectorScale = 0.06;
      rods.push({
        from: [pX, pY, pZ],
        to: [pX + animVx * vVectorScale, pY + animVy * vVectorScale, pZ],
        color: "#22c55e",
        radius: 0.045,
        label: `v = ${currentSpeed.toFixed(1)} m/s`
      });

      // Horizontal Velocity Vector vx (Cyan)
      rods.push({
        from: [pX, pY, pZ],
        to: [pX + animVx * vVectorScale, pY, pZ],
        color: "#06b6d4",
        radius: 0.025,
        label: `vx = ${animVx.toFixed(1)} m/s`
      });

      // Vertical Velocity Vector vy (Yellow)
      rods.push({
        from: [pX, pY, pZ],
        to: [pX, pY + animVy * vVectorScale, pZ],
        color: "#eab308",
        radius: 0.025,
        label: `vy = ${animVy.toFixed(1)} m/s`
      });

      // Gravity Acceleration Vector (Red Downward Arrow)
      rods.push({
        from: [pX, pY, pZ],
        to: [pX, pY - 0.4, pZ],
        color: "#ef4444",
        radius: 0.03,
        label: `g = ${g} m/s²`
      });

      // Trail of trajectory
      const trail = trajectoryPoints;

      return {
        title: "3D Ballistic Projectile Motion & Vector Laboratory",
        description: `Simulating 2D/3D projectile launched at θ = ${thetaDeg}° with v₀ = ${v0} m/s under g = ${g} m/s² and drag Cd = ${cd}. Real-time vector decomposition reveals independent horizontal and vertical Newtonian motions.`,
        category: "mechanics",
        metrics: {
          "Time of Flight (T)": `${tFlightIdeal.toFixed(2)} s`,
          "Maximum Height (H)": `${maxHIdeal.toFixed(2)} m`,
          "Horizontal Range (R)": `${currX.toFixed(2)} m (Drag Adjusted)`,
          "Instantaneous Speed (v)": `${currentSpeed.toFixed(1)} m/s`,
          "Kinetic Energy (K)": `${kineticEnergy.toFixed(1)} J`,
          "Potential Energy (U)": `${potentialEnergy.toFixed(1)} J`,
          "Total Mechanical Energy": `${totalEnergy.toFixed(1)} J`
        },
        nodes,
        rods,
        trail,
        currentGraphSample: {
          time: cycleTime,
          kineticEnergy,
          potentialEnergy,
          totalEnergy,
          x: animX,
          v: currentSpeed
        },
        formulas: [
          "Horizontal Position: x(t) = v₀ · cos(θ) · t",
          "Vertical Position: y(t) = y₀ + v₀ · sin(θ) · t - 1/2 g · t²",
          "Maximum Height: H = y₀ + (v₀ · sinθ)² / (2g)",
          "Range (level): R = (v₀² · sin(2θ)) / g",
          "Quadratic Air Drag: F_drag = -1/2 · ρ · Cd · A · v²"
        ]
      };
    }
  },
  {
    id: "circular_motion",
    name: "Uniform Circular Motion & Centripetal Acceleration",
    icon: "🔄",
    category: "mechanics",
    prompt: "Show me uniform circular motion with tangential velocity and centripetal force vectors",
    description: "Centripetal acceleration (ac = v²/r = ω²r), tangential velocity vector, string tension / gravitational centripetal force, and period T = 2π/ω.",
    parameters: [
      {
        id: "radius",
        name: "Orbit Radius (r)",
        unit: "m",
        min: 1.0,
        max: 4.5,
        step: 0.1,
        defaultValue: 2.5,
        description: "Distance of the revolving object from the central axis."
      },
      {
        id: "angularVelocity",
        name: "Angular Velocity (ω)",
        unit: "rad/s",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        defaultValue: 2.0,
        description: "Rate of rotational angle change over time (RPM = ω * 9.55)."
      },
      {
        id: "mass",
        name: "Object Mass (m)",
        unit: "kg",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        defaultValue: 1.5,
        description: "Mass of the revolving orbiting body."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Quadratic Scaling of Centripetal Force",
        instruction: "Double the angular velocity ω from 1.0 to 2.0 rad/s. Notice that centripetal force Fc quadruples (Fc ∝ ω²).",
        hint: "Centripetal Force equation: Fc = m · ω² · r.",
        explanation: "Because acceleration scales with the square of velocity, high-speed cornering demands vastly higher friction or string tension!"
      }
    ],
    init: (params) => ({
      r: params?.radius ?? 2.5,
      omega: params?.angularVelocity ?? 2.0,
      m: params?.mass ?? 1.5
    }),
    update: (state, t, dt, params) => {
      const r = params?.radius ?? 2.5;
      const omega = params?.angularVelocity ?? 2.0;
      const m = params?.mass ?? 1.5;

      const angle = t * omega;
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      const y = 0;

      const v = omega * r; // Tangential speed
      const ac = (v * v) / r; // Centripetal acceleration
      const fc = m * ac; // Centripetal force
      const period = (2 * Math.PI) / omega;
      const freq = omega / (2 * Math.PI);

      // Tangential velocity vector direction (perpendicular to radius)
      const vxDir = -Math.sin(angle);
      const vzDir = Math.cos(angle);

      // Centripetal acceleration vector direction (inwards towards center)
      const axDir = -Math.cos(angle);
      const azDir = -Math.sin(angle);

      const nodes: any[] = [
        { id: "center_pivot", x: 0, y: 0, z: 0, radius: 0.14, color: "#38bdf8", name: "Central Pivot Axis (0,0)" },
        { id: "revolving_body", x, y, z, radius: 0.22, color: "#f43f5e", name: `Mass (${m} kg, v = ${v.toFixed(1)} m/s)` }
      ];

      const rods: any[] = [
        // Radial tether / string
        { from: [0, 0, 0] as [number, number, number], to: [x, y, z] as [number, number, number], color: "#06b6d4", radius: 0.04 },

        // Tangential Velocity Vector (Green Arrow)
        { from: [x, y, z], to: [x + vxDir * 1.2, y, z + vzDir * 1.2], color: "#22c55e", radius: 0.05, label: `v = ${v.toFixed(1)} m/s` },

        // Centripetal Force Vector (Inward Red Arrow)
        { from: [x, y, z], to: [x + axDir * 1.2, y, z + azDir * 1.2], color: "#ef4444", radius: 0.05, label: `Fc = ${fc.toFixed(1)} N` }
      ];

      // Orbital circle guideline particles
      const particles: any[] = [];
      for (let i = 0; i < 48; i++) {
        const theta = (i / 48) * Math.PI * 2;
        particles.push({
          x: r * Math.cos(theta),
          y: 0,
          z: r * Math.sin(theta),
          color: "#38bdf8",
          size: 0.03
        });
      }

      return {
        title: "Uniform Circular Motion & Centripetal Acceleration",
        description: `A mass m = ${m} kg moves along a circular path of radius r = ${r.toFixed(1)} m at angular speed ω = ${omega.toFixed(1)} rad/s. Velocity is constantly changing direction, demanding a continuous inward centripetal force Fc = ${fc.toFixed(1)} N.`,
        category: "mechanics",
        metrics: {
          "Tangential Speed (v)": `${v.toFixed(2)} m/s`,
          "Centripetal Acceleration (ac)": `${ac.toFixed(2)} m/s²`,
          "Centripetal Force (Fc)": `${fc.toFixed(2)} N`,
          "Time Period (T)": `${period.toFixed(2)} s`,
          "Frequency (f)": `${freq.toFixed(2)} Hz (${(freq * 60).toFixed(0)} RPM)`,
          "Kinetic Energy": `${(0.5 * m * v * v).toFixed(2)} J`
        },
        nodes,
        rods,
        particles,
        formulas: [
          "Tangential Speed: v = ω · r",
          "Centripetal Acceleration: ac = v² / r = ω² · r",
          "Centripetal Force: Fc = m · v² / r = m · ω² · r",
          "Period: T = 2π / ω = 1 / f"
        ]
      };
    }
  },
  {
    id: "spring_mass_shm",
    name: "Spring-Mass Harmonic Oscillator (SHM) & Energy Conservation",
    icon: "🪀",
    category: "mechanics",
    prompt: "Show me a spring mass oscillator with Hooke's law, damping, and real-time kinetic and potential energy graphs",
    description: "Simple Harmonic Motion (SHM) under Hooke's Law (F = -kx), viscous damping, continuous harmonic phase exchange between Kinetic Energy (K = 1/2 m v²) and Elastic Potential Energy (U = 1/2 k x²).",
    parameters: [
      {
        id: "springConstant",
        name: "Spring Constant (k)",
        unit: "N/m",
        min: 5,
        max: 60,
        step: 2,
        defaultValue: 25,
        description: "Stiffness factor of the mechanical coil spring."
      },
      {
        id: "mass",
        name: "Oscillator Mass (m)",
        unit: "kg",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        defaultValue: 1.5,
        description: "Mass attached to the end of the spring."
      },
      {
        id: "amplitude",
        name: "Initial Amplitude (A)",
        unit: "m",
        min: 0.5,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.8,
        description: "Maximum displacement from mechanical equilibrium."
      },
      {
        id: "damping",
        name: "Damping Coefficient (γ)",
        unit: "kg/s",
        min: 0.0,
        max: 0.5,
        step: 0.02,
        defaultValue: 0.04,
        description: "Fluid or air friction damping causing exponential energy dissipation."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Energy Exchange at Extreme vs Equilibrium",
        instruction: "Watch the energy meters as the mass passes through Equilibrium (x=0) and Maximum Amplitude (x=±A).",
        hint: "At x=0: Potential Energy U = 0, Kinetic Energy K is maximum. At x=±A: Speed v = 0, K = 0, U is maximum.",
        explanation: "Total Mechanical Energy E = K + U remains strictly conserved in the undamped ideal harmonic oscillator!"
      }
    ],
    init: (params) => ({
      x: params?.amplitude ?? 1.8,
      v: 0.0,
      t: 0
    }),
    update: (state, t, dt, params) => {
      const k = params?.springConstant ?? 25;
      const m = params?.mass ?? 1.5;
      const A0 = params?.amplitude ?? 1.8;
      const gamma = params?.damping ?? 0.04;

      const omega0 = Math.sqrt(k / m);
      const dampedOmega = Math.sqrt(Math.max(0, omega0 * omega0 - (gamma / (2 * m)) ** 2));
      const decay = Math.exp((-gamma / (2 * m)) * t);

      // Displacement & Velocity
      const x = A0 * decay * Math.cos(dampedOmega * t);
      const v = -A0 * decay * (dampedOmega * Math.sin(dampedOmega * t) + (gamma / (2 * m)) * Math.cos(dampedOmega * t));

      const period = (2 * Math.PI) / (dampedOmega || 0.001);
      const frequency = 1 / period;

      const kineticEnergy = 0.5 * m * v * v;
      const potentialEnergy = 0.5 * k * x * x;
      const totalEnergy = kineticEnergy + potentialEnergy;
      const restoringForce = -k * x;

      const nodes: any[] = [
        { id: "spring_wall", x: -3.5, y: 0, z: 0, radius: 0.16, color: "#38bdf8", name: "Rigid Anchor Wall" },
        { id: "mass_block", x, y: 0, z: 0, radius: 0.26, color: "#f43f5e", name: `Mass Block (${m}kg, x = ${x.toFixed(2)}m)` },
        { id: "equilibrium_marker", x: 0, y: 0, z: 0, radius: 0.08, color: "#94a3b8", name: "Equilibrium Position (x = 0)" }
      ];

      const rods: any[] = [
        // Guide rod
        { from: [-4, 0, 0] as [number, number, number], to: [4, 0, 0] as [number, number, number], color: "#1e293b", radius: 0.02 }
      ];

      // Helical Spring Coils (Zig-Zag Rods)
      const numCoils = 14;
      const springStart = -3.5;
      const springEnd = x - 0.26;
      const coilLength = (springEnd - springStart) / numCoils;

      for (let i = 0; i < numCoils; i++) {
        const x1 = springStart + i * coilLength;
        const x2 = springStart + (i + 1) * coilLength;
        const side = i % 2 === 0 ? 0.35 : -0.35;
        const nextSide = (i + 1) % 2 === 0 ? 0.35 : -0.35;

        rods.push({
          from: [x1, side, 0],
          to: [x2, nextSide, 0],
          color: "#06b6d4",
          radius: 0.04
        });
      }

      // Restoring Force Vector (Red Arrow)
      if (Math.abs(restoringForce) > 0.5) {
        const forceScale = 0.05;
        rods.push({
          from: [x, 0, 0],
          to: [x + restoringForce * forceScale, 0, 0],
          color: "#ef4444",
          radius: 0.045,
          label: `F = ${restoringForce.toFixed(1)} N`
        });
      }

      // Velocity Vector (Green Arrow)
      if (Math.abs(v) > 0.1) {
        const vScale = 0.3;
        rods.push({
          from: [x, 0.4, 0],
          to: [x + v * vScale, 0.4, 0],
          color: "#22c55e",
          radius: 0.04,
          label: `v = ${v.toFixed(1)} m/s`
        });
      }

      return {
        title: "Spring-Mass Harmonic Oscillator (Hooke's Law & Energy)",
        description: `Harmonic oscillation of mass m = ${m} kg attached to spring k = ${k} N/m with natural frequency f₀ = ${frequency.toFixed(2)} Hz. Total mechanical energy constantly exchanges between kinetic and elastic forms.`,
        category: "mechanics",
        metrics: {
          "Displacement (x)": `${x.toFixed(2)} m`,
          "Instantaneous Velocity (v)": `${v.toFixed(2)} m/s`,
          "Restoring Force (F)": `${restoringForce.toFixed(2)} N`,
          "Kinetic Energy (K)": `${kineticEnergy.toFixed(2)} J`,
          "Elastic Potential (U)": `${potentialEnergy.toFixed(2)} J`,
          "Total Mechanical Energy (E)": `${totalEnergy.toFixed(2)} J`,
          "Natural Period (T₀)": `${period.toFixed(2)} s`,
          "Frequency (f)": `${frequency.toFixed(2)} Hz`
        },
        nodes,
        rods,
        currentGraphSample: {
          time: t,
          kineticEnergy,
          potentialEnergy,
          totalEnergy,
          x,
          v
        },
        formulas: [
          "Hooke's Restoring Law: F = -k · x",
          "Differential Equation: m · (d²x/dt²) + γ · (dx/dt) + k · x = 0",
          "Angular Frequency: ω₀ = √(k / m)",
          "Period: T = 2π · √(m / k)",
          "Energy Conservation: E = 1/2 m v² + 1/2 k x² = constant"
        ]
      };
    }
  }
];
