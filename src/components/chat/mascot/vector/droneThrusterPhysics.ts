/**
 * Layer 1: 60fps Adaptive Plasma Jet & Mach Shock Diamond Physics Math
 * Pure mathematical geometry generator for the 3 articulated hover-jet nozzles.
 * Computes dynamic Bezier flame cones, golden-orange afterburner outer sheaths,
 * oscillating supersonic Mach shock diamonds, and recycling plasma exhaust sparks.
 */

export interface MachDiamondNode {
  y: number;
  halfWidth: number;
  halfHeight: number;
  opacity: number;
  pathD: string;
}

export interface PlasmaExhaustSpark {
  id: number;
  x: number;
  y: number;
  r: number;
  opacity: number;
  isAfterburnerSpark: boolean;
}

export interface ThrusterJetGeometry {
  /** Turbulent cyan-violet outer plasma cone SVG path */
  outerPlasmaPath: string;
  /** Golden-orange afterburner thermal boost sheath SVG path (scales with afterburnerIntensity) */
  afterburnerSheathPath: string;
  /** White-hot high-velocity inner plasma spear SVG path */
  innerCorePath: string;
  /** Supersonic standing wave Mach shock diamonds along the jet axis */
  machDiamonds: MachDiamondNode[];
  /** High-velocity micro plasma sparks streaming out of the jet tail */
  sparks: PlasmaExhaustSpark[];
  /** Total dynamic jet length in SVG units */
  jetLength: number;
}

export interface ComputeJetGeometryParams {
  /** Base nozzle radius (e.g. 5.0 for side nozzles, 6.8 for center main thruster) */
  nozzleRadius: number;
  /** [0.25 .. 1.0] Overall thruster output intensity */
  thrusterIntensity: number;
  /** [0.0 .. 1.0] Golden-orange afterburner boost intensity */
  afterburnerIntensity: number;
  /** Continuous 60fps phase angle in radians */
  flamePhase: number;
  /** Phase offset per nozzle so left, center, and right plumes flicker organically */
  phaseOffset: number;
  /** Perspective foreshortening multiplier [0.4 .. 1.0] */
  foreshortenFactor: number;
  /** Number of Mach shock diamonds to synthesize (2 for side, 3 for center) */
  diamondCount: number;
}

export function computeAdaptivePlasmaJetGeometry({
  nozzleRadius,
  thrusterIntensity,
  afterburnerIntensity,
  flamePhase,
  phaseOffset,
  foreshortenFactor,
  diamondCount,
}: ComputeJetGeometryParams): ThrusterJetGeometry {
  const p = flamePhase + phaseOffset;

  // High-frequency 60fps multi-harmonic flame flicker
  const fastFlutter =
    Math.sin(p * 3.4) * 0.95 +
    Math.cos(p * 5.7 + 0.8) * 0.55 +
    Math.sin(p * 9.2) * 0.3;
  const lateralWhip =
    Math.sin(p * 2.6 + 0.4) * (0.75 + afterburnerIntensity * 0.85);

  const baseLength =
    nozzleRadius * (2.15 + thrusterIntensity * 1.65 + afterburnerIntensity * 1.45);
  const jetLength = Math.max(
    6.5,
    (baseLength + fastFlutter * 1.35) * foreshortenFactor
  );

  const topHalfW = nozzleRadius * 0.88;
  const midHalfW =
    nozzleRadius *
      (1.06 + thrusterIntensity * 0.18 + afterburnerIntensity * 0.24) +
    Math.sin(p * 4.2) * 0.38;
  const tailX = lateralWhip;

  // 1. Outer Cyan-Violet Turbulent Plasma Cone Path
  const outerPlasmaPath = [
    `M ${(-topHalfW).toFixed(2)} 0`,
    `C ${(-midHalfW * 1.12).toFixed(2)} ${(jetLength * 0.32).toFixed(2)}, ${(
      tailX -
      midHalfW * 0.48
    ).toFixed(2)} ${(jetLength * 0.74).toFixed(2)}, ${tailX.toFixed(2)} ${jetLength.toFixed(2)}`,
    `C ${(tailX + midHalfW * 0.48).toFixed(2)} ${(jetLength * 0.74).toFixed(2)}, ${(
      midHalfW * 1.12
    ).toFixed(2)} ${(jetLength * 0.32).toFixed(2)}, ${topHalfW.toFixed(2)} 0`,
    "Z",
  ].join(" ");

  // 2. Golden-Orange Afterburner Outer Thermal Sheath (flares wider & longer during boost)
  const abLength = jetLength * (0.88 + afterburnerIntensity * 0.34);
  const abHalfW = midHalfW * (1.05 + afterburnerIntensity * 0.28);
  const afterburnerSheathPath = [
    `M ${(-topHalfW * 0.96).toFixed(2)} 0.4`,
    `C ${(-abHalfW * 1.18).toFixed(2)} ${(abLength * 0.28).toFixed(2)}, ${(
      tailX * 1.15 -
      abHalfW * 0.52
    ).toFixed(2)} ${(abLength * 0.68).toFixed(2)}, ${(tailX * 1.18).toFixed(2)} ${abLength.toFixed(2)}`,
    `C ${(tailX * 1.15 + abHalfW * 0.52).toFixed(2)} ${(abLength * 0.68).toFixed(2)}, ${(
      abHalfW * 1.18
    ).toFixed(2)} ${(abLength * 0.28).toFixed(2)}, ${(topHalfW * 0.96).toFixed(2)} 0.4`,
    "Z",
  ].join(" ");

  // 3. White-Hot Inner High-Velocity Plasma Spear
  const coreLength = jetLength * (0.64 + afterburnerIntensity * 0.14);
  const coreHalfW = topHalfW * 0.58;
  const coreTipX = tailX * 0.48;
  const innerCorePath = [
    `M ${(-coreHalfW).toFixed(2)} 0`,
    `Q ${(-coreHalfW * 0.85).toFixed(2)} ${(coreLength * 0.45).toFixed(2)} ${coreTipX.toFixed(2)} ${coreLength.toFixed(2)}`,
    `Q ${(coreHalfW * 0.85).toFixed(2)} ${(coreLength * 0.45).toFixed(2)} ${coreHalfW.toFixed(2)} 0`,
    "Z",
  ].join(" ");

  // 4. Supersonic Standing-Wave Mach Shock Diamonds
  const machDiamonds: MachDiamondNode[] = [];
  for (let i = 0; i < diamondCount; i++) {
    const progress = (i + 1) / (diamondCount + 0.85);
    const waveOsc = Math.sin(p * 4.8 - i * 1.45) * 0.55;
    const cy = Math.max(1.8, jetLength * progress * 0.78 + waveOsc);
    const cx = tailX * progress * 0.55;
    const taper = 1 - progress * 0.52;
    const hw = Math.max(1.1, topHalfW * 0.62 * taper);
    const hh = Math.max(1.0, (1.65 + afterburnerIntensity * 0.95) * taper * foreshortenFactor);
    const opacity = Math.min(
      0.96,
      (0.58 + thrusterIntensity * 0.32 + afterburnerIntensity * 0.25) * (1 - i * 0.22)
    );

    const pathD = `M ${cx.toFixed(2)} ${(cy - hh).toFixed(2)} L ${(cx + hw).toFixed(
      2
    )} ${cy.toFixed(2)} L ${cx.toFixed(2)} ${(cy + hh).toFixed(2)} L ${(
      cx - hw
    ).toFixed(2)} ${cy.toFixed(2)} Z`;

    machDiamonds.push({
      y: cy,
      halfWidth: hw,
      halfHeight: hh,
      opacity,
      pathD,
    });
  }

  // 5. Continuous 60fps Recycling Exhaust Spark Particles
  const sparks: PlasmaExhaustSpark[] = [];
  const sparkTotal = 3;
  for (let i = 0; i < sparkTotal; i++) {
    // Deterministic 60fps modulo lifecycle [0..1]
    const rawProgress = ((p * 0.42 + i * (1 / sparkTotal)) % 1 + 1) % 1;
    const sy = 2.5 + rawProgress * (jetLength * 1.18);
    const spread = (i % 2 === 0 ? 1 : -1) * Math.sin(p * 2.1 + i * 2.3);
    const sx =
      tailX * rawProgress + spread * (nozzleRadius * 0.45 * (1 - rawProgress * 0.35));
    const sr = Math.max(
      0.45,
      (1.25 - rawProgress * 0.85) * (1 + afterburnerIntensity * 0.35)
    );
    const sOpacity =
      rawProgress < 0.15
        ? rawProgress / 0.15
        : Math.max(0, (1 - rawProgress) * (0.65 + thrusterIntensity * 0.35));

    sparks.push({
      id: i,
      x: sx,
      y: sy,
      r: sr,
      opacity: sOpacity,
      isAfterburnerSpark: afterburnerIntensity > 0.28 && i % 2 === 0,
    });
  }

  return {
    outerPlasmaPath,
    afterburnerSheathPath,
    innerCorePath,
    machDiamonds,
    sparks,
    jetLength,
  };
}
