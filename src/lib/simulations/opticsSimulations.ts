import { SimulationPreset, SimulationData } from "../simulationTypes";

export const OPTICS_SIMULATIONS: SimulationPreset[] = [
  {
    id: "thin_lens",
    name: "Thin Lens Image Formation & Ray Optics",
    icon: "🔍",
    category: "optics",
    prompt: "Show me convex and concave lens image formation with real-time ray tracing and focal points",
    description: "Interactive Gauss ray tracing for thin converging and diverging lenses showing principal rays, focal points, real/virtual images, and lateral magnification.",
    parameters: [
      {
        id: "objectDistance",
        name: "Object Distance (u)",
        unit: "cm",
        min: 1.0,
        max: 8.0,
        step: 0.1,
        defaultValue: 4.0,
        description: "Distance of the illuminated object from the optical center of the lens."
      },
      {
        id: "focalLength",
        name: "Focal Length (f)",
        unit: "cm",
        min: 0.8,
        max: 3.5,
        step: 0.1,
        defaultValue: 2.0,
        description: "Focal length of the lens. Positive for convex (converging), negative for concave."
      },
      {
        id: "objectHeight",
        name: "Object Height (h)",
        unit: "cm",
        min: 0.5,
        max: 2.5,
        step: 0.1,
        defaultValue: 1.4,
        description: "Height of the arrow object above the principal axis."
      },
      {
        id: "lensType",
        name: "Lens Type (1=Convex, -1=Concave)",
        unit: "",
        min: -1,
        max: 1,
        step: 2,
        defaultValue: 1,
        description: "Convex (+1) converges rays; Concave (-1) diverges rays."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Find the 2F Equal-Size Inverted Image",
        instruction: "Set the Object Distance u to exactly twice the Focal Length (u = 2f = 4.0 cm). Observe the image distance and magnification.",
        hint: "When u = 2f, image distance v = 2f and magnification M = -1.0 (same size, inverted).",
        explanation: "By the lens equation 1/f = 1/v - 1/(-u) => 1/v = 1/f - 1/u. When u = 2f, 1/v = 1/2f => v = 2f."
      },
      {
        id: "c2",
        title: "Create a Magnified Virtual Image (Magnifying Glass)",
        instruction: "Move the object closer than the focal length (u < f, e.g. u = 1.2 cm with f = 2.0 cm).",
        hint: "When u < f, rays diverge behind the lens, forming a virtual, upright, magnified image on the same side as the object.",
        explanation: "This is the working principle of a simple magnifying glass or reading loupe!"
      }
    ],
    init: (params) => ({
      objDist: params?.objectDistance ?? 4.0,
      focal: params?.focalLength ?? 2.0,
      height: params?.objectHeight ?? 1.4,
      isConvex: (params?.lensType ?? 1) > 0
    }),
    update: (state, t, dt, params) => {
      const u = params?.objectDistance ?? 4.0;
      const rawF = params?.focalLength ?? 2.0;
      const isConvex = (params?.lensType ?? 1) > 0;
      const f = isConvex ? rawF : -rawF;
      const h = params?.objectHeight ?? 1.4;

      // Lens Equation: 1/f = 1/v - 1/(-u) => 1/v = 1/f - 1/u => v = (f * u) / (u - f)
      const denominator = u - f;
      let v = 0;
      let m = 0;
      let imgH = 0;
      let isVirtual = false;

      if (Math.abs(denominator) < 0.001) {
        // Object at focal point -> parallel rays to infinity
        v = 999;
        m = 999;
        imgH = 999;
      } else {
        v = (f * u) / denominator;
        m = -v / u;
        imgH = h * m;
        isVirtual = v < 0;
      }

      const objX = -u;
      const objY = h;
      const imgX = v;
      const imgY = imgH;

      const nodes: any[] = [
        // Lens Center & Principal Axis Points
        { id: "optical_center", x: 0, y: 0, z: 0, radius: 0.12, color: "#38bdf8", name: "Optical Center (O)" },
        { id: "focus_left", x: -rawF, y: 0, z: 0, radius: 0.09, color: "#f59e0b", name: `Focal Point F1 (-${rawF.toFixed(1)}cm)` },
        { id: "focus_right", x: rawF, y: 0, z: 0, radius: 0.09, color: "#f59e0b", name: `Focal Point F2 (+${rawF.toFixed(1)}cm)` },
        { id: "2f_left", x: -2 * rawF, y: 0, z: 0, radius: 0.07, color: "#94a3b8", name: `2F Point (-${(2 * rawF).toFixed(1)}cm)` },
        { id: "2f_right", x: 2 * rawF, y: 0, z: 0, radius: 0.07, color: "#94a3b8", name: `2F Point (+${(2 * rawF).toFixed(1)}cm)` },

        // Object Arrow Tip & Base
        { id: "obj_base", x: objX, y: 0, z: 0, radius: 0.08, color: "#22c55e", name: "Object Base" },
        { id: "obj_tip", x: objX, y: objY, z: 0, radius: 0.14, color: "#22c55e", name: `Object Tip (h = ${h.toFixed(1)}cm)` }
      ];

      if (Math.abs(v) < 20) {
        nodes.push(
          { id: "img_base", x: imgX, y: 0, z: 0, radius: 0.08, color: isVirtual ? "#ec4899" : "#a855f7", name: isVirtual ? "Virtual Image Base" : "Real Image Base" },
          { id: "img_tip", x: imgX, y: imgY, z: 0, radius: 0.14, color: isVirtual ? "#ec4899" : "#a855f7", name: `${isVirtual ? "Virtual" : "Real"} Image Tip (h' = ${imgH.toFixed(2)}cm)` }
        );
      }

      const rods: any[] = [
        // Principal Axis (Horizontal Line)
        { from: [-9, 0, 0] as [number, number, number], to: [9, 0, 0] as [number, number, number], color: "#334155", radius: 0.02 },

        // Object Arrow
        { from: [objX, 0, 0] as [number, number, number], to: [objX, objY, 0] as [number, number, number], color: "#22c55e", radius: 0.06 }
      ];

      // Lens Vertical Profile
      const lensHeight = 3.2;
      rods.push({
        from: [0, -lensHeight, 0] as [number, number, number],
        to: [0, lensHeight, 0] as [number, number, number],
        color: "#06b6d4",
        radius: 0.06
      });

      // Lens Curvature indicators
      if (isConvex) {
        rods.push(
          { from: [0, lensHeight, 0], to: [-0.2, lensHeight - 0.3, 0], color: "#06b6d4", radius: 0.04 },
          { from: [0, lensHeight, 0], to: [0.2, lensHeight - 0.3, 0], color: "#06b6d4", radius: 0.04 },
          { from: [0, -lensHeight, 0], to: [-0.2, -lensHeight + 0.3, 0], color: "#06b6d4", radius: 0.04 },
          { from: [0, -lensHeight, 0], to: [0.2, -lensHeight + 0.3, 0], color: "#06b6d4", radius: 0.04 }
        );
      }

      // Principal Ray 1: Parallel to axis, then through focal point F2
      rods.push(
        { from: [objX, objY, 0], to: [0, objY, 0], color: "#ef4444", radius: 0.035, label: "Ray 1: Parallel" }
      );
      if (isConvex) {
        const ray1End: [number, number, number] = [8.5, objY - (8.5 / rawF) * objY, 0];
        rods.push({ from: [0, objY, 0], to: ray1End, color: "#ef4444", radius: 0.035 });
        if (isVirtual) {
          // Virtual extension back
          rods.push({ from: [0, objY, 0], to: [imgX, imgY, 0], color: "#fca5a5", radius: 0.02, dashed: true });
        }
      } else {
        // Concave diverges away from F1 on object side
        const slope = (objY - 0) / (0 - (-rawF));
        const ray1End: [number, number, number] = [8.5, objY + slope * 8.5, 0];
        rods.push({ from: [0, objY, 0], to: ray1End, color: "#ef4444", radius: 0.035 });
        rods.push({ from: [0, objY, 0], to: [-rawF, 0, 0], color: "#fca5a5", radius: 0.02, dashed: true });
      }

      // Principal Ray 2: Straight through optical center (O) without deviation
      const slope2 = objY / objX;
      const ray2End: [number, number, number] = [8.5, slope2 * 8.5, 0];
      rods.push(
        { from: [objX, objY, 0], to: ray2End, color: "#eab308", radius: 0.035, label: "Ray 2: Central" }
      );
      if (isVirtual) {
        rods.push({ from: [0, 0, 0], to: [imgX, imgY, 0], color: "#fef08a", radius: 0.02, dashed: true });
      }

      // Principal Ray 3: Through front focus F1, emerges parallel to axis
      if (isConvex && Math.abs(u - rawF) > 0.05) {
        const yAtLens = objY * (rawF / (rawF - u));
        if (Math.abs(yAtLens) < lensHeight) {
          rods.push(
            { from: [objX, objY, 0], to: [0, yAtLens, 0], color: "#3b82f6", radius: 0.035, label: "Ray 3: Focal" },
            { from: [0, yAtLens, 0], to: [8.5, yAtLens, 0], color: "#3b82f6", radius: 0.035 }
          );
          if (isVirtual) {
            rods.push({ from: [0, yAtLens, 0], to: [imgX, imgY, 0], color: "#93c5fd", radius: 0.02, dashed: true });
          }
        }
      }

      // Image Arrow
      if (Math.abs(v) < 20) {
        rods.push({
          from: [imgX, 0, 0] as [number, number, number],
          to: [imgX, imgY, 0] as [number, number, number],
          color: isVirtual ? "#ec4899" : "#a855f7",
          radius: 0.06
        });
      }

      return {
        title: `${isConvex ? "Convex (Converging)" : "Concave (Diverging)"} Thin Lens Optics`,
        description: `Visualizing Gaussian thin lens geometrical ray tracing. Object at u = -${u.toFixed(1)} cm produces an ${isVirtual ? "upright virtual" : "inverted real"} image at v = ${v.toFixed(2)} cm with magnification M = ${m.toFixed(2)}x.`,
        category: "optics",
        metrics: {
          "Object Distance (u)": `-${u.toFixed(2)} cm`,
          "Focal Length (f)": `${f > 0 ? "+" : ""}${f.toFixed(2)} cm`,
          "Image Distance (v)": `${v > 0 ? "+" : ""}${v.toFixed(2)} cm`,
          "Magnification (M)": `${m.toFixed(2)}x (${Math.abs(m) > 1 ? "Magnified" : "Diminished"})`,
          "Image Nature": isVirtual ? "Virtual & Upright" : "Real & Inverted",
          "Lens Power (P)": `${(100 / f).toFixed(1)} Diopters`
        },
        nodes,
        rods,
        formulas: [
          "Thin Lens Formula: 1/f = 1/v - 1/u",
          "Lateral Magnification: M = h'/h = v/u",
          "Optical Power: P = 1 / f (in meters)"
        ]
      };
    }
  },
  {
    id: "refraction_snell",
    name: "Snell's Law Refraction & Total Internal Reflection (TIR)",
    icon: "💎",
    category: "optics",
    prompt: "Show me light refraction at boundary with Snell's law and total internal reflection critical angle",
    description: "Electromagnetic wave boundary refraction between optical media (air, water, glass, diamond), Brewster polarization angle, and critical angle Total Internal Reflection (TIR).",
    parameters: [
      {
        id: "incidentAngle",
        name: "Angle of Incidence (θ₁)",
        unit: "°",
        min: 0,
        max: 88,
        step: 1,
        defaultValue: 45,
        description: "Angle of the incoming light ray relative to the surface normal."
      },
      {
        id: "n1",
        name: "Refractive Index 1 (n₁)",
        unit: "",
        min: 1.0,
        max: 2.5,
        step: 0.05,
        defaultValue: 1.5,
        description: "Medium 1 index: Air=1.00, Water=1.33, Glass=1.50, Diamond=2.42."
      },
      {
        id: "n2",
        name: "Refractive Index 2 (n₂)",
        unit: "",
        min: 1.0,
        max: 2.5,
        step: 0.05,
        defaultValue: 1.0,
        description: "Medium 2 index: Air=1.00, Water=1.33, Glass=1.50, Diamond=2.42."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Total Internal Reflection (TIR)",
        instruction: "Set Medium 1 to Glass (n₁ = 1.5) and Medium 2 to Air (n₂ = 1.0). Increase the incident angle beyond the critical angle θc = 41.8°.",
        hint: "When θ₁ > θc = arcsin(n₂/n₁), light cannot enter Medium 2 and reflects 100% back into Medium 1.",
        explanation: "TIR is the foundational physics behind fiber optic telecommunications, medical endoscopes, and sparkling diamond cuts!"
      }
    ],
    init: (params) => ({
      theta1: params?.incidentAngle ?? 45,
      n1: params?.n1 ?? 1.5,
      n2: params?.n2 ?? 1.0
    }),
    update: (state, t, dt, params) => {
      const theta1Deg = params?.incidentAngle ?? 45;
      const theta1Rad = (theta1Deg * Math.PI) / 180;
      const n1 = params?.n1 ?? 1.5;
      const n2 = params?.n2 ?? 1.0;

      // Snell's Law: n1 * sin(theta1) = n2 * sin(theta2) => sin(theta2) = (n1/n2) * sin(theta1)
      const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad);
      const isTIR = sinTheta2 > 1.0;

      let theta2Deg = 0;
      let theta2Rad = 0;
      let criticalAngleDeg = 0;

      if (n1 > n2) {
        criticalAngleDeg = (Math.asin(n2 / n1) * 180) / Math.PI;
      }

      if (!isTIR) {
        theta2Rad = Math.asin(sinTheta2);
        theta2Deg = (theta2Rad * 180) / Math.PI;
      }

      const rayLength = 4.2;

      // Incident ray: comes from Medium 1 (top or bottom, let's put medium 1 on left x < 0 or top y > 0)
      // Boundary is horizontal at y = 0
      const inX = -rayLength * Math.sin(theta1Rad);
      const inY = rayLength * Math.cos(theta1Rad);

      // Reflected ray (Law of Reflection: theta_r = theta_1)
      const refX = rayLength * Math.sin(theta1Rad);
      const refY = rayLength * Math.cos(theta1Rad);

      // Refracted ray in Medium 2 (y < 0)
      const refrX = rayLength * Math.sin(theta2Rad);
      const refrY = -rayLength * Math.cos(theta2Rad);

      const nodes: any[] = [
        { id: "boundary_center", x: 0, y: 0, z: 0, radius: 0.12, color: "#38bdf8", name: "Point of Incidence (0,0)" },
        { id: "ray_source", x: inX, y: inY, z: 0, radius: 0.1, color: "#facc15", name: `Light Source (θ₁ = ${theta1Deg}°)` }
      ];

      if (!isTIR) {
        nodes.push({ id: "refr_exit", x: refrX, y: refrY, z: 0, radius: 0.1, color: "#06b6d4", name: `Refracted Ray (θ₂ = ${theta2Deg.toFixed(1)}°)` });
      }

      const rods: any[] = [
        // Boundary Surface Interface (y = 0)
        { from: [-6, 0, 0] as [number, number, number], to: [6, 0, 0] as [number, number, number], color: "#38bdf8", radius: 0.04 },

        // Normal Line (Dashed vertical line at x = 0)
        { from: [0, -5, 0] as [number, number, number], to: [0, 5, 0] as [number, number, number], color: "#94a3b8", radius: 0.02, dashed: true },

        // Incident Ray
        { from: [inX, inY, 0], to: [0, 0, 0], color: "#facc15", radius: 0.05, label: "Incident Ray" },

        // Reflected Ray (Always present, 100% during TIR)
        { from: [0, 0, 0], to: [refX, refY, 0], color: isTIR ? "#facc15" : "#fef08a", radius: isTIR ? 0.05 : 0.025, label: "Reflected Ray" }
      ];

      if (!isTIR) {
        // Refracted Ray
        rods.push({
          from: [0, 0, 0],
          to: [refrX, refrY, 0],
          color: "#06b6d4",
          radius: 0.045,
          label: "Refracted Ray"
        });
      }

      // Animated photons travelling along the rays
      const particles: any[] = [];
      for (let i = 0; i < 15; i++) {
        const prog = ((t * 1.8 + i * 0.1) % 1);
        particles.push({
          x: inX * (1 - prog),
          y: inY * (1 - prog),
          z: 0,
          color: "#facc15",
          size: 0.05
        });

        if (isTIR) {
          particles.push({
            x: refX * prog,
            y: refY * prog,
            z: 0,
            color: "#facc15",
            size: 0.05
          });
        } else {
          particles.push({
            x: refrX * prog,
            y: refrY * prog,
            z: 0,
            color: "#06b6d4",
            size: 0.05
          });
        }
      }

      return {
        title: "Snell's Law of Refraction & Total Internal Reflection",
        description: isTIR
          ? `Total Internal Reflection active! Incident angle θ₁ = ${theta1Deg}° exceeds the critical angle θc = ${criticalAngleDeg.toFixed(1)}°. 100% of light energy is reflected back into Medium 1.`
          : `Light refracts across interface from Medium 1 (n₁ = ${n1}) to Medium 2 (n₂ = ${n2}). Angle of refraction θ₂ = ${theta2Deg.toFixed(1)}°.`,
        category: "optics",
        metrics: {
          "Angle of Incidence (θ₁)": `${theta1Deg}°`,
          "Angle of Refraction (θ₂)": isTIR ? "TIR (No Refraction)" : `${theta2Deg.toFixed(1)}°`,
          "Critical Angle (θc)": n1 > n2 ? `${criticalAngleDeg.toFixed(1)}°` : "N/A (n1 ≤ n2)",
          "Refractive Index Ratio (n1/n2)": `${(n1 / n2).toFixed(2)}`,
          "Optical Regime": isTIR ? "100% Total Internal Reflection" : "Partial Transmission & Reflection"
        },
        nodes,
        rods,
        particles,
        formulas: [
          "Snell's Law: n₁ · sin(θ₁) = n₂ · sin(θ₂)",
          "Critical Angle: θc = arcsin(n₂ / n₁) (for n₁ > n₂)",
          "Law of Reflection: θ_reflected = θ_incident"
        ]
      };
    }
  },
  {
    id: "double_slit",
    name: "Young's Double Slit Wave Interference & Wavefronts",
    icon: "🌊",
    category: "optics",
    prompt: "Show me Young's double slit interference fringes and coherent wave diffraction",
    description: "Wave optics Huygens-Fresnel diffraction, constructive and destructive interference fringes, path length difference (d sin θ = m λ), and intensity distribution profile.",
    parameters: [
      {
        id: "wavelength",
        name: "Wavelength (λ)",
        unit: "nm",
        min: 400,
        max: 700,
        step: 25,
        defaultValue: 532,
        description: "Wavelength of coherent monochromatic laser source (Green=532nm, Red=650nm, Blue=450nm)."
      },
      {
        id: "slitSeparation",
        name: "Slit Separation (d)",
        unit: "μm",
        min: 1.0,
        max: 6.0,
        step: 0.2,
        defaultValue: 2.4,
        description: "Distance between the two narrow optical slits."
      },
      {
        id: "screenDistance",
        name: "Screen Distance (D)",
        unit: "m",
        min: 1.0,
        max: 5.0,
        step: 0.2,
        defaultValue: 2.5,
        description: "Distance from the double-slit aperture to the viewing detector screen."
      }
    ],
    challenges: [
      {
        id: "c1",
        title: "Observe Fringe Width Variation with Wavelength",
        instruction: "Switch wavelength from Blue (400nm) to Red (700nm). Notice how red light creates wider, more spread out interference fringes (β = λD / d).",
        hint: "Fringe width β is directly proportional to wavelength λ.",
        explanation: "Longer wavelengths diffract more broadly, confirming the wave nature of light demonstrated by Thomas Young in 1801."
      }
    ],
    init: (params) => ({
      lambda: params?.wavelength ?? 532,
      d: params?.slitSeparation ?? 2.4,
      D: params?.screenDistance ?? 2.5
    }),
    update: (state, t, dt, params) => {
      const lambdaNm = params?.wavelength ?? 532;
      const dUm = params?.slitSeparation ?? 2.4;
      const D = params?.screenDistance ?? 2.5;

      const lambda = lambdaNm * 1e-9;
      const d = dUm * 1e-6;
      const fringeWidthMm = (lambda * D / d) * 1000;

      // Color mapping from wavelength
      let laserColor = "#10b981"; // Green
      if (lambdaNm < 480) laserColor = "#38bdf8"; // Blue
      else if (lambdaNm > 600) laserColor = "#ef4444"; // Red
      else if (lambdaNm > 560) laserColor = "#eab308"; // Yellow

      const slitY1 = (dUm * 0.4);
      const slitY2 = -(dUm * 0.4);

      const nodes: any[] = [
        { id: "laser_source", x: -4.5, y: 0, z: 0, radius: 0.18, color: laserColor, name: `Laser Source (λ = ${lambdaNm} nm)` },
        { id: "slit_1", x: -1.5, y: slitY1, z: 0, radius: 0.1, color: "#38bdf8", name: "Slit S1 (Coherent Source 1)" },
        { id: "slit_2", x: -1.5, y: slitY2, z: 0, radius: 0.1, color: "#38bdf8", name: "Slit S2 (Coherent Source 2)" },
        { id: "screen_center", x: 3.5, y: 0, z: 0, radius: 0.1, color: "#ffffff", name: "Central Maxima (m = 0)" }
      ];

      // Double slit barrier & detector screen
      const rods: any[] = [
        // Barrier segments with two slits
        { from: [-1.5, -4, 0] as [number, number, number], to: [-1.5, slitY2 - 0.1, 0] as [number, number, number], color: "#475569", radius: 0.05 },
        { from: [-1.5, slitY2 + 0.1, 0] as [number, number, number], to: [-1.5, slitY1 - 0.1, 0] as [number, number, number], color: "#475569", radius: 0.05 },
        { from: [-1.5, slitY1 + 0.1, 0] as [number, number, number], to: [-1.5, 4, 0] as [number, number, number], color: "#475569", radius: 0.05 },

        // Detector Screen
        { from: [3.5, -4, 0] as [number, number, number], to: [3.5, 4, 0] as [number, number, number], color: "#94a3b8", radius: 0.04 }
      ];

      // Interference pattern on screen with intensity peaks
      const particles: any[] = [];
      const numFringes = 9;
      for (let m = -numFringes; m <= numFringes; m++) {
        const yPos = (m * fringeWidthMm * 0.45);
        if (Math.abs(yPos) < 3.8) {
          const isBright = m % 1 === 0;
          const intensity = Math.cos((m * Math.PI) / 2) ** 2;

          nodes.push({
            id: `fringe_${m}`,
            x: 3.55,
            y: yPos,
            z: 0,
            radius: 0.06 + intensity * 0.08,
            color: laserColor,
            name: `Fringe m = ${m} (${m === 0 ? "Central Maximum" : `${Math.abs(m)}th Order ${intensity > 0.5 ? "Bright" : "Dark"}`})`
          });
        }
      }

      // Wavefront ripple rings from S1 and S2
      for (let r = 0; r < 8; r++) {
        const ringRadius = ((t * 2.2 + r * 0.5) % 5.0);
        const theta = (t * 2) % (Math.PI * 2);
        for (let a = -1.2; a <= 1.2; a += 0.25) {
          const wx1 = -1.5 + ringRadius * Math.cos(a);
          const wy1 = slitY1 + ringRadius * Math.sin(a);
          const wx2 = -1.5 + ringRadius * Math.cos(a);
          const wy2 = slitY2 + ringRadius * Math.sin(a);

          if (wx1 < 3.5) {
            particles.push({ x: wx1, y: wy1, z: 0, color: laserColor, size: 0.035 });
          }
          if (wx2 < 3.5) {
            particles.push({ x: wx2, y: wy2, z: 0, color: laserColor, size: 0.035 });
          }
        }
      }

      return {
        title: "Young's Double Slit Wave Interference Laboratory",
        description: `Coherent monochromatic light (λ = ${lambdaNm} nm) passes through two slits separated by d = ${dUm.toFixed(1)} μm, forming interference fringes with fringe spacing β = ${fringeWidthMm.toFixed(2)} mm on a screen at D = ${D.toFixed(1)} m.`,
        category: "optics",
        metrics: {
          "Wavelength (λ)": `${lambdaNm} nm (${laserColor.toUpperCase()})`,
          "Slit Separation (d)": `${dUm.toFixed(2)} μm`,
          "Screen Distance (D)": `${D.toFixed(2)} m`,
          "Fringe Width (β)": `${fringeWidthMm.toFixed(2)} mm`,
          "Angular Width (θ)": `${((lambda / d) * (180 / Math.PI)).toFixed(3)}°`,
          "Condition for Maxima": "Δx = d · sin(θ) = m · λ"
        },
        nodes,
        rods,
        particles,
        formulas: [
          "Path Difference: Δx = d · sin(θ) ≈ d · (y / D)",
          "Constructive Maxima: d · sin(θ) = m · λ (m = 0, ±1, ±2...)",
          "Destructive Minima: d · sin(θ) = (m + 1/2) · λ",
          "Fringe Separation: β = (λ · D) / d",
          "Intensity Profile: I(θ) = I₀ · cos²(π·d·sinθ / λ)"
        ]
      };
    }
  }
];
