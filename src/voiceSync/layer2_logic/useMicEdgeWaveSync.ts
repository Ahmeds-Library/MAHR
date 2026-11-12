import { RefObject, useEffect } from "react";
import {
  buildAuroraSilkRibbonPath,
  buildClosedCatmullRomBezierPath,
  DEFAULT_MIC_DUAL_FILAMENT_CONFIG,
  PolarWavePoint,
  stepCircularCoupledSprings,
} from "../layer1_data/micEdgeWaveTypes";
import { LiveState } from "../../lib/audio";
import { AssistantStage } from "../layer1_data/assistantSessionTypes";

interface UseMicEdgeWaveDomSyncOptions {
  session: any | null;
  state: LiveState;
  assistantStage?: AssistantStage;
  isMuted: boolean;
  primaryPathRef: RefObject<SVGPathElement | null>;
  secondaryPathRef: RefObject<SVGPathElement | null>;
  silkRibbonPathRef: RefObject<SVGPathElement | null>;
  glowCircleRef: RefObject<SVGCircleElement | null>;
  primaryGradRef: RefObject<SVGLinearGradientElement | null>;
  secondaryGradRef: RefObject<SVGLinearGradientElement | null>;
  micButtonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Layer 2 Zero-Lag Coupled Spring & Rotating Aurora Silk Wave Engine
 * Directly updates SVG `<path>`, `<linearGradient>`, `<circle>`, and the Mic Button's
 * GPU `scale3d` + glow inside `requestAnimationFrame` with zero React re-renders.
 */
export function useMicEdgeWaveDomSync({
  session,
  state,
  assistantStage,
  isMuted,
  primaryPathRef,
  secondaryPathRef,
  silkRibbonPathRef,
  glowCircleRef,
  primaryGradRef,
  secondaryGradRef,
  micButtonRef,
}: UseMicEdgeWaveDomSyncOptions): void {
  useEffect(() => {
    const isStageVoiceListening = assistantStage
      ? assistantStage === "listen" || assistantStage === "follow_up"
      : state === "listening";
    const isListeningActive = isStageVoiceListening && !isMuted;
    if (!isListeningActive) {
      if (primaryPathRef.current) primaryPathRef.current.setAttribute("d", "");
      if (secondaryPathRef.current) secondaryPathRef.current.setAttribute("d", "");
      if (silkRibbonPathRef.current) silkRibbonPathRef.current.setAttribute("d", "");
      if (glowCircleRef.current) glowCircleRef.current.setAttribute("opacity", "0");
      if (micButtonRef?.current) {
        micButtonRef.current.style.transform = "";
      }
      return;
    }

    const cfg = DEFAULT_MIC_DUAL_FILAMENT_CONFIG;
    const N = cfg.numControlPoints;

    // Coupled circular spring buffers for Primary & Secondary silk filaments
    const primaryTargets = new Float32Array(N);
    const primaryPos = new Float32Array(N);
    const primaryVel = new Float32Array(N);

    const secondaryTargets = new Float32Array(N);
    const secondaryPos = new Float32Array(N);
    const secondaryVel = new Float32Array(N);

    // Second-order spring state for overall voice envelope & Mic Button elastic scale
    let buttonSpringPos = 0;
    let buttonSpringVel = 0;

    const freqBuffer = new Uint8Array(128);
    const floatTimeBuffer = new Float32Array(256);
    const byteTimeBuffer = new Uint8Array(256);

    let phase = 0;
    let gradAngle = 0;
    let prevSyllableEnergy = 0;
    let rafId: number | null = null;
    let lastTime = performance.now();

    const primaryPoints: PolarWavePoint[] = Array.from({ length: N }, () => ({ x: 0, y: 0 }));
    const secondaryPoints: PolarWavePoint[] = Array.from({ length: N }, () => ({ x: 0, y: 0 }));
    const innerBasePoints: PolarWavePoint[] = Array.from({ length: N }, (_, i) => {
      const angle = (i / N) * Math.PI * 2;
      return {
        x: cfg.centerX + Math.cos(angle) * (cfg.baseRadius - 0.6),
        y: cfg.centerY + Math.sin(angle) * (cfg.baseRadius - 0.6),
      };
    });

    const tick = (now: number) => {
      const dt = Math.min(0.04, Math.max(0.004, (now - lastTime) / 1000));
      lastTime = now;

      const analyser: AnalyserNode | null =
        session &&
        (typeof session.getInputAnalyser === "function"
          ? session.getInputAnalyser()
          : session.inputAnalyser)
          ? typeof session.getInputAnalyser === "function"
            ? session.getInputAnalyser()
            : session.inputAnalyser
          : null;

      let rawSyllableEnergy = 0;
      let rawFormantEnergy = 0;

      if (analyser) {
        try {
          analyser.getByteFrequencyData(freqBuffer);

          // Sample time-domain waveform for instantaneous vocal syllable transients
          if (typeof analyser.getFloatTimeDomainData === "function") {
            analyser.getFloatTimeDomainData(floatTimeBuffer);
            let sumSq = 0;
            let peak = 0;
            for (let i = 0; i < floatTimeBuffer.length; i++) {
              const v = Math.abs(floatTimeBuffer[i]);
              sumSq += v * v;
              if (v > peak) peak = v;
            }
            const rms = Math.sqrt(sumSq / floatTimeBuffer.length);
            const gated = Math.max(0, rms * 0.72 + peak * 0.28 - 0.0055);
            rawSyllableEnergy = Math.min(1, Math.pow(gated * 5.5, 0.76));
          } else {
            analyser.getByteTimeDomainData(byteTimeBuffer);
            let sumSq = 0;
            for (let i = 0; i < byteTimeBuffer.length; i++) {
              const v = (byteTimeBuffer[i] - 128) / 128;
              sumSq += v * v;
            }
            rawSyllableEnergy = Math.min(1, Math.sqrt(sumSq / byteTimeBuffer.length) * 4.8);
          }

          // Human vocal fundamental & formant bands (120Hz - 3400Hz)
          let formantSum = 0;
          for (let b = 2; b <= 42; b++) {
            formantSum += freqBuffer[b] || 0;
          }
          rawFormantEnergy = Math.min(1, (formantSum / (41 * 255)) * 2.45);
        } catch {
          // Ignore transient closed AudioContext during disconnect
        }
      }

      const targetVoiceEnergy = Math.min(1, Math.max(rawSyllableEnergy, rawFormantEnergy * 0.94));

      // Detect sudden syllable onset and inject an immediate upward velocity impulse
      const onsetDelta = Math.max(0, targetVoiceEnergy - prevSyllableEnergy);
      prevSyllableEnergy = targetVoiceEnergy;
      if (onsetDelta > 0.08) {
        buttonSpringVel += onsetDelta * 4.2;
      }

      // Step second-order spring for the Mic Button & global voice envelope
      const btnSubDt = dt * 0.5;
      for (let s = 0; s < 2; s++) {
        const force =
          -cfg.buttonSpringStiffness * (buttonSpringPos - targetVoiceEnergy) -
          cfg.buttonSpringDamping * buttonSpringVel;
        buttonSpringVel += force * btnSubDt;
        buttonSpringPos = Math.max(0, Math.min(1.25, buttonSpringPos + buttonSpringVel * btnSubDt));
      }

      const springVoice = Math.min(1.15, Math.max(0, buttonSpringPos));

      // Advance orbital wave phase & continuous 360° Aurora Gradient rotation
      const phaseVelocity = 2.1 + springVoice * 6.2;
      phase = (phase + dt * phaseVelocity) % (Math.PI * 24);
      gradAngle = (gradAngle + dt * (52 + springVoice * 195)) % 360;

      // Subtle liquid breathing (0.55px) when silent, springing up to maxDisplacement on syllables
      const activeAmp = 0.55 + springVoice * cfg.maxDisplacement;
      const half = N / 2;

      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const mirrorIdx = i < half ? i : N - 1 - i;

        const binLow = (freqBuffer[mirrorIdx + 2] || 0) / 255;
        const binMid = (freqBuffer[mirrorIdx * 2 + 4] || 0) / 255;
        const timeSample = Math.abs(floatTimeBuffer[(i * 7) % floatTimeBuffer.length] || 0);
        const localSpectral = Math.min(1, (binLow * 0.45 + binMid * 0.4 + timeSample * 1.45) * 1.38);

        // Multi-harmonic liquid silk carrier waves
        const carrierPrimary =
          Math.sin(angle * 3 + phase) * 0.44 +
          Math.cos(angle * 5 - phase * 1.32) * 0.36 +
          Math.sin(angle * 7 + phase * 1.75) * 0.2;

        const carrierSecondary =
          Math.cos(angle * 4 - phase * 1.18) * 0.48 +
          Math.sin(angle * 6 + phase * 1.52) * 0.34 +
          Math.cos(angle * 2 + phase * 0.85) * 0.18;

        primaryTargets[i] =
          springVoice * 1.35 + (carrierPrimary * 0.52 + localSpectral * 0.88) * activeAmp;

        secondaryTargets[i] =
          0.55 +
          springVoice * 1.05 +
          (carrierSecondary * 0.5 + localSpectral * 0.68) * (activeAmp * 0.82);

        // Inject localized syllable onset velocity into radial springs for natural ripple bounce
        if (onsetDelta > 0.06) {
          primaryVel[i] += onsetDelta * localSpectral * 26;
          secondaryVel[i] += onsetDelta * localSpectral * 18;
        }
      }

      // Step coupled circular spring-mass arrays for primary & secondary silk filaments
      stepCircularCoupledSprings(
        primaryPos,
        primaryVel,
        primaryTargets,
        dt,
        cfg.springStiffness,
        cfg.springDamping,
        cfg.neighborCoupling
      );

      stepCircularCoupledSprings(
        secondaryPos,
        secondaryVel,
        secondaryTargets,
        dt,
        cfg.springStiffness * 0.82,
        cfg.springDamping * 0.9,
        cfg.neighborCoupling * 0.88
      );

      // Convert polar spring displacements into 2D Cartesian control points
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const rPrimary = Math.max(
          cfg.baseRadius - 1.2,
          cfg.baseRadius + primaryPos[i]
        );
        primaryPoints[i].x = cfg.centerX + cosA * rPrimary;
        primaryPoints[i].y = cfg.centerY + sinA * rPrimary;

        const rSecondary = Math.max(
          cfg.baseRadius - 1.0,
          cfg.baseRadius + secondaryPos[i]
        );
        secondaryPoints[i].x = cfg.centerX + cosA * rSecondary;
        secondaryPoints[i].y = cfg.centerY + sinA * rSecondary;
      }

      // 1. Rotate SVG Aurora Gradients continuously around (48, 48)
      if (primaryGradRef.current) {
        primaryGradRef.current.setAttribute(
          "gradientTransform",
          `rotate(${gradAngle.toFixed(1)} 48 48)`
        );
      }
      if (secondaryGradRef.current) {
        secondaryGradRef.current.setAttribute(
          "gradientTransform",
          `rotate(${(-gradAngle * 1.25).toFixed(1)} 48 48)`
        );
      }

      // 2. Update Translucent Aurora Silk Ribbon Fill Path
      if (silkRibbonPathRef.current) {
        const ribbonD = buildAuroraSilkRibbonPath(
          primaryPoints,
          innerBasePoints,
          cfg.splineTension
        );
        silkRibbonPathRef.current.setAttribute("d", ribbonD);
        silkRibbonPathRef.current.setAttribute(
          "fill-opacity",
          Math.min(0.34, 0.08 + springVoice * 0.24).toFixed(2)
        );
      }

      // 3. Update Primary Aurora Silk Bezier Filament
      if (primaryPathRef.current) {
        const primaryD = buildClosedCatmullRomBezierPath(primaryPoints, cfg.splineTension);
        primaryPathRef.current.setAttribute("d", primaryD);
        primaryPathRef.current.setAttribute(
          "stroke-opacity",
          Math.min(1, 0.52 + springVoice * 0.48).toFixed(2)
        );
        primaryPathRef.current.setAttribute(
          "stroke-width",
          (1.55 + springVoice * 0.75).toFixed(2)
        );
      }

      // 4. Update Secondary Counter-Rotating Harmonic Silk Echo Filament
      if (secondaryPathRef.current) {
        const secondaryD = buildClosedCatmullRomBezierPath(secondaryPoints, cfg.splineTension);
        secondaryPathRef.current.setAttribute("d", secondaryD);
        secondaryPathRef.current.setAttribute(
          "stroke-opacity",
          Math.min(0.88, 0.28 + springVoice * 0.56).toFixed(2)
        );
        secondaryPathRef.current.setAttribute(
          "stroke-width",
          (1.1 + springVoice * 0.45).toFixed(2)
        );
      }

      // 5. Update Soft Perimeter Glow Circle
      if (glowCircleRef.current) {
        glowCircleRef.current.setAttribute(
          "r",
          (cfg.baseRadius + springVoice * 2.6).toFixed(2)
        );
        glowCircleRef.current.setAttribute(
          "opacity",
          Math.min(0.82, 0.16 + springVoice * 0.6).toFixed(2)
        );
      }

      // 6. Synchronized Mic Button Spring Physics (GPU scale3d + dynamic aurora glow)
      if (micButtonRef?.current) {
        const idleBreath = Math.sin(phase * 0.6) * 0.012;
        const btnScale = 1 + idleBreath + springVoice * 0.078;
        micButtonRef.current.style.transform = `scale3d(${btnScale.toFixed(4)}, ${btnScale.toFixed(4)}, 1)`;
        const glowRadius = Math.round(28 + springVoice * 26);
        const glowAlpha = Math.min(0.88, 0.42 + springVoice * 0.45).toFixed(2);
        micButtonRef.current.style.boxShadow = `0 0 ${glowRadius}px rgba(16, 185, 129, ${glowAlpha}), 0 0 ${Math.round(glowRadius * 0.55)}px rgba(34, 211, 238, ${(Number(glowAlpha) * 0.75).toFixed(2)})`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (micButtonRef?.current) {
        micButtonRef.current.style.transform = "";
      }
    };
  }, [
    session,
    state,
    assistantStage,
    isMuted,
    primaryPathRef,
    secondaryPathRef,
    silkRibbonPathRef,
    glowCircleRef,
    primaryGradRef,
    secondaryGradRef,
    micButtonRef,
  ]);
}
