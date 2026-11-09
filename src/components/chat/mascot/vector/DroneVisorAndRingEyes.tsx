import React from "react";
import { EyeExpression } from "../useMascotPlayEngine";
import {
  computeDroneSphericalProjection,
  DroneColorTokens,
  DronePerspectiveState,
} from "./droneVectorTypes";
import {
  buildMiniHeartPath,
  buildStarlightSparklePath,
  computeHolographicEyeMetrics,
} from "./droneEyeOpticsMath";

interface DroneVisorAndRingEyesProps {
  perspective: DronePerspectiveState;
  colors: DroneColorTokens;
  expression: EyeExpression;
  isSpeaking?: boolean;
  isThinking?: boolean;
  audioFrequencies?: number[];
  audioVolume?: number;
  uid: string;
}

/**
 * Layer 3: Deep Holographic HUD Visor & Multi-Layered 60fps Optical Ring Eyes
 * Upgraded with:
 * - 5-layer optical iris depth (recessed lens socket, rotating segmented iris aperture ring,
 *   reactive dilating pupil core, electric cyan torus ring, dual starlight catchlights)
 * - Deep holographic HUD visor scanlines & corner telemetry brackets
 * - Smooth 60fps emotional morphs (happy/excited starlight arches, loving heart-optics,
 *   curious asymmetric zoom, thinking HUD reticle, dizzy counter-spirals, laser-crimson angry brows)
 */
export const DroneVisorAndRingEyes: React.FC<DroneVisorAndRingEyesProps> = ({
  perspective,
  colors,
  expression,
  isSpeaking = false,
  isThinking = false,
  audioFrequencies = [],
  audioVolume = 0,
  uid,
}) => {
  const {
    yaw,
    pitch,
    blinkProgress,
    eyeGazeX = 0,
    eyeGazeY = 0,
    irisRotationDeg = 0,
    pupilScale = 1,
    flamePhase = 0,
  } = perspective;

  // Hide visor when turned completely around to the Back View (|yaw| > 100°)
  if (Math.abs(yaw) > 100) {
    return null;
  }

  const proj = computeDroneSphericalProjection(yaw, pitch);
  const {
    sinYaw,
    cosYaw,
    sinPitch,
    visorCenterX,
    visorCenterY,
    visorWidth,
    visorHeight,
    visorRx,
  } = proj;

  // Eye coordinates inside the recessed visor cavity + micro-saccade offsets
  const eyeSpacing = 10.6 * Math.max(0.32, Math.abs(cosYaw));
  const eyeOffsetX = sinYaw * 3.0 + eyeGazeX * Math.max(0.4, Math.abs(cosYaw));
  const eyeOffsetY = sinPitch * 2.1 + eyeGazeY;

  const leftEyeX = visorCenterX - eyeSpacing + eyeOffsetX;
  const rightEyeX = visorCenterX + eyeSpacing + eyeOffsetX;
  const eyeY = visorCenterY + 0.3 + eyeOffsetY;

  // Perspective foreshortening of left vs right eye (Matches 3/4 Front & Isometric views)
  const leftEyeScaleX = yaw > 6 ? Math.max(0.46, 1 - (yaw / 90) * 0.5) : 1;
  const rightEyeScaleX =
    yaw < -6 ? Math.max(0.46, 1 - (Math.abs(yaw) / 90) * 0.5) : 1;

  // Smooth continuous vertical eyelid squash from GSAP blinkProgress (0 = open, 1 = closed slit)
  const isDeepSleep = expression === "sleepy";
  const isDrowsyOrYawn = expression === "drowsy" || expression === "yawn";

  const effectiveBlink = isDeepSleep
    ? 0.92
    : isDrowsyOrYawn
    ? Math.max(0.48, blinkProgress)
    : blinkProgress;

  // Natural vertical foreshortening when tilting up/down
  const pitchForeshortenY = Math.max(
    0.76,
    Math.cos(((pitch * Math.PI) / 180) * 0.65)
  );
  const smoothEyeScaleY = Math.max(
    0.08,
    pitchForeshortenY * (1 - effectiveBlink * 0.92)
  );

  // Voice reactive ring scale
  const voiceRingBoost = isSpeaking
    ? 1 + Math.min(0.22, audioVolume * 0.44)
    : 1;

  const renderHolographicEye = (
    cx: number,
    cy: number,
    scaleX: number,
    scaleY: number,
    side: "left" | "right"
  ) => {
    const metrics = computeHolographicEyeMetrics(
      5.65,
      expression,
      side,
      pupilScale,
      voiceRingBoost
    );
    const r = metrics.outerRadius;
    const irisDir = side === "left" ? 1 : -1;

    // 1. Deep Sleep or Closed Blink -> Serene multi-layered glowing cyan curved eyelash slit
    if (effectiveBlink > 0.85) {
      return (
        <g key={side} transform={`translate(${cx}, ${cy}) scale(${scaleX}, 1)`}>
          <path
            d={`M ${-r - 0.4} -0.5 Q 0 2.5 ${r + 0.4} -0.5`}
            fill="none"
            stroke={colors.eyeGlow}
            strokeWidth="4.2"
            strokeLinecap="round"
            opacity="0.78"
            filter={`url(#cyanEyeBloom-${uid})`}
          />
          <path
            d={`M ${-r + 0.2} -0.5 Q 0 2.2 ${r - 0.2} -0.5`}
            fill="none"
            stroke={colors.eyeRing}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={`M ${-r + 0.8} -0.5 Q 0 1.9 ${r - 0.8} -0.5`}
            fill="none"
            stroke={colors.eyeCore}
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // 2. Dizzy / Bonked -> 60fps Counter-rotating holographic spiral optics + star glints
    if (expression === "dizzy" || expression === "bonked") {
      const spinAngle = (flamePhase * 95 * irisDir) % 360;
      return (
        <g
          key={side}
          transform={`translate(${cx}, ${cy}) scale(${scaleX}, ${scaleY})`}
        >
          <circle
            cx="0"
            cy="0"
            r={r + 0.9}
            fill="#02050B"
            stroke={colors.eyeGlow}
            strokeWidth="3.2"
            opacity="0.68"
            filter={`url(#cyanEyeBloom-${uid})`}
          />
          <g transform={`rotate(${spinAngle.toFixed(1)})`}>
            <path
              d={`M 0 0 m 0 ${-r * 0.25}
                  a ${r * 0.25} ${r * 0.25} 0 1 1 0 ${r * 0.5}
                  a ${r * 0.55} ${r * 0.55} 0 1 1 0 ${-r * 1.1}
                  a ${r * 0.85} ${r * 0.85} 0 1 1 0 ${r * 1.7}`}
              fill="none"
              stroke={colors.eyeRing}
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <path
              d={`M 0 0 m 0 ${-r * 0.25}
                  a ${r * 0.25} ${r * 0.25} 0 1 1 0 ${r * 0.5}
                  a ${r * 0.55} ${r * 0.55} 0 1 1 0 ${-r * 1.1}`}
              fill="none"
              stroke={colors.eyeCore}
              strokeWidth="1.05"
              strokeLinecap="round"
            />
            <circle cx="0" cy={-r * 0.52} r="1.2" fill="#FFFFFF" />
          </g>
        </g>
      );
    }

    // 3. Happy / Excited / Loving -> Radiant Holographic Crescent Arches with Starlight / Heart Accents
    if (
      expression === "happy" ||
      expression === "excited" ||
      expression === "loving"
    ) {
      const shimmerScale = 0.9 + Math.sin(flamePhase * 1.8) * 0.16;
      return (
        <g
          key={side}
          transform={`translate(${cx}, ${cy}) scale(${scaleX}, ${scaleY})`}
        >
          {/* Soft Outer Bloom */}
          <path
            d={`M ${-r} 2.2 Q 0 ${-r * 1.46} ${r} 2.2`}
            fill="none"
            stroke={colors.eyeGlow}
            strokeWidth="5.2"
            strokeLinecap="round"
            opacity="0.85"
            filter={`url(#cyanEyeBloom-${uid})`}
          />
          {/* Secondary Lower Iris Echo Arc */}
          <path
            d={`M ${-r * 0.68} 2.8 Q 0 ${-r * 0.58} ${r * 0.68} 2.8`}
            fill="none"
            stroke={colors.eyeRing}
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.65"
          />
          {/* Primary Neon Arch */}
          <path
            d={`M ${-r} 2.2 Q 0 ${-r * 1.46} ${r} 2.2`}
            fill="none"
            stroke={colors.eyeRing}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* White-Hot Inner Core Arch */}
          <path
            d={`M ${-r + 0.55} 2.1 Q 0 ${-r * 1.38} ${r - 0.55} 2.1`}
            fill="none"
            stroke={colors.eyeCore}
            strokeWidth="1.45"
            strokeLinecap="round"
          />
          {/* Top-Left Specular Glint */}
          <circle
            cx={-r * 0.42}
            cy={-r * 0.45}
            r="0.95"
            fill="#FFFFFF"
            opacity="0.95"
          />
          {/* Loving Miniature Glowing Heart or Excited Starlight Glint */}
          {expression === "loving" ? (
            <path
              d={buildMiniHeartPath(0.82 * shimmerScale)}
              transform={`translate(0, 0.8)`}
              fill={colors.eyeCore}
              stroke={colors.eyeRing}
              strokeWidth="0.4"
            />
          ) : (
            <path
              d={buildStarlightSparklePath(
                side === "left" ? -r * 0.55 : r * 0.55,
                -r * 0.55,
                1.65 * shimmerScale
              )}
              fill="#FFFFFF"
            />
          )}
        </g>
      );
    }

    // 4. Wink -> Left eye winks into a cheerful glowing arch with starlight glint
    if (expression === "wink" && side === "left") {
      return (
        <g
          key={side}
          transform={`translate(${cx}, ${cy}) scale(${scaleX}, ${scaleY})`}
        >
          <path
            d={`M ${-r} 1.4 Q 0 ${-r * 1.2} ${r} 1.4`}
            fill="none"
            stroke={colors.eyeGlow}
            strokeWidth="4.6"
            strokeLinecap="round"
            filter={`url(#cyanEyeBloom-${uid})`}
          />
          <path
            d={`M ${-r} 1.4 Q 0 ${-r * 1.2} ${r} 1.4`}
            fill="none"
            stroke={colors.eyeRing}
            strokeWidth="3.0"
            strokeLinecap="round"
          />
          <path
            d={`M ${-r + 0.5} 1.4 Q 0 ${-r * 1.12} ${r - 0.5} 1.4`}
            fill="none"
            stroke={colors.eyeCore}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx={-r * 0.35} cy={-r * 0.38} r="0.85" fill="#FFFFFF" />
        </g>
      );
    }

    // 5. Signature 5-Layer Holographic Optical Ring Eye ("Best Eyes" Upgrade)
    return (
      <g
        key={side}
        transform={`translate(${cx}, ${cy}) scale(${scaleX}, ${scaleY})`}
      >
        {/* Layer A: Atmospheric Bioluminescent Halo behind the optical socket */}
        <circle
          cx="0"
          cy="0"
          r={r + 2.4}
          fill={colors.eyeGlow}
          opacity="0.22"
          filter={`url(#cyanEyeBloom-${uid})`}
        />

        {/* Layer B: Outer Diffused Neon Torus Bloom */}
        <circle
          cx="0"
          cy="0"
          r={r + 0.65}
          fill="none"
          stroke={colors.eyeGlow}
          strokeWidth="4.2"
          opacity="0.82"
          filter={`url(#cyanEyeBloom-${uid})`}
        />

        {/* Layer C: Deep Recessed Optical Lens Socket */}
        <circle cx="0" cy="0" r={r - 0.4} fill="#02050C" />
        <circle
          cx="0"
          cy="0"
          r={r - 0.9}
          fill={`url(#eyeSocketGrad-${uid})`}
          opacity="0.85"
        />

        {/* Layer D: 60fps Rotating Segmented Holographic Iris Aperture Ring & Radial Ticks */}
        <g
          transform={`rotate(${(irisRotationDeg * irisDir).toFixed(1)})`}
          opacity="0.72"
        >
          <circle
            cx="0"
            cy="0"
            r={metrics.irisRadius}
            fill="none"
            stroke={colors.eyeRing}
            strokeWidth="0.95"
            strokeDasharray="3.2 2.1"
          />
          {metrics.irisTicks.map((tick, idx) => (
            <line
              key={idx}
              x1={tick.x1.toFixed(2)}
              y1={tick.y1.toFixed(2)}
              x2={tick.x2.toFixed(2)}
              y2={tick.y2.toFixed(2)}
              stroke={tick.isMajor ? colors.eyeCore : colors.eyeRing}
              strokeWidth={tick.isMajor ? "0.85" : "0.6"}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Layer E: Reactive Dilating Inner Pupil Core Ring & Soft Bioluminescent Center */}
        <circle
          cx={(eyeGazeX * 0.18).toFixed(2)}
          cy={(eyeGazeY * 0.18).toFixed(2)}
          r={metrics.pupilRadius}
          fill={colors.eyeGlow}
          fillOpacity="0.28"
          stroke={colors.eyeCore}
          strokeWidth="1.05"
          opacity="0.9"
        />
        <circle
          cx={(eyeGazeX * 0.22).toFixed(2)}
          cy={(eyeGazeY * 0.22).toFixed(2)}
          r={metrics.pupilRadius * 0.45}
          fill={colors.eyeCore}
          opacity="0.88"
        />

        {/* Layer F: Primary Electric Cyan Hollow Torus Ring */}
        <circle
          cx="0"
          cy="0"
          r={r}
          fill="none"
          stroke={colors.eyeRing}
          strokeWidth="2.95"
        />

        {/* Layer G: White-Hot Inner Neon Core Ring */}
        <circle
          cx="0"
          cy="0"
          r={r}
          fill="none"
          stroke={colors.eyeCore}
          strokeWidth="1.3"
          opacity="0.98"
        />

        {/* Layer H: Dual Optical Lens Starlight Catchlights (Give lifelike soul & glossy depth) */}
        <path
          d={`M ${(-r * 0.68).toFixed(2)} ${(-r * 0.42).toFixed(2)} A ${(
            r * 0.82
          ).toFixed(2)} ${(r * 0.82).toFixed(2)} 0 0 1 ${(-r * 0.14).toFixed(
            2
          )} ${(-r * 0.8).toFixed(2)}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.35"
          strokeLinecap="round"
          opacity="0.96"
        />
        <ellipse
          cx={metrics.primaryCatchlight.cx}
          cy={metrics.primaryCatchlight.cy}
          rx={metrics.primaryCatchlight.rx}
          ry={metrics.primaryCatchlight.ry}
          transform={`rotate(-32 ${metrics.primaryCatchlight.cx} ${metrics.primaryCatchlight.cy})`}
          fill="#FFFFFF"
          opacity="0.95"
        />
        <circle
          cx={metrics.secondaryCatchlight.cx}
          cy={metrics.secondaryCatchlight.cy}
          r={metrics.secondaryCatchlight.r}
          fill="#FFFFFF"
          opacity="0.78"
        />

        {/* Thinking / Analytical Counter-Rotating Outer Telemetry Ring */}
        {(isThinking ||
          expression === "thinking" ||
          expression === "analytical") && (
          <g
            transform={`rotate(${(-irisRotationDeg * 1.6 * irisDir).toFixed(1)})`}
          >
            <circle
              cx="0"
              cy="0"
              r={r + 2.35}
              fill="none"
              stroke={colors.eyeCore}
              strokeWidth="1.15"
              strokeDasharray="4.2 3.2"
            />
          </g>
        )}

        {/* Drowsy / Yawn Hooded Upper Eyelid Mask with Glowing Lash Line */}
        {isDrowsyOrYawn && (
          <g>
            <path
              d={`M ${-r - 2.2} ${-r - 2.2} L ${r + 2.2} ${-r - 2.2} L ${
                r + 2.2
              } -0.4 Q 0 1.3 ${-r - 2.2} -0.4 Z`}
              fill="#050A14"
            />
            <path
              d={`M ${-r - 1.2} -0.4 Q 0 1.3 ${r + 1.2} -0.4`}
              fill="none"
              stroke={colors.eyeRing}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Angry Slanted Laser-Crimson Brow */}
        {expression === "angry" && (
          <g>
            <polygon
              points={
                side === "left"
                  ? `${-r - 3},${-r - 3} ${r + 3},${-r - 3} ${r + 3},${
                      -r + 3.4
                    } ${-r - 3},${-r - 0.8}`
                  : `${-r - 3},${-r - 3} ${r + 3},${-r - 3} ${r + 3},${
                      -r - 0.8
                    } ${-r - 3},${-r + 3.4}`
              }
              fill="#050A14"
            />
            <line
              x1={side === "left" ? -r - 2 : r + 2}
              y1={-r - 1.4}
              x2={side === "left" ? r + 2 : -r - 2}
              y2={-r + 3.0}
              stroke={colors.eyeRing}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    );
  };

  return (
    <g clipPath={`url(#sphereClip-${uid})`}>
      {/* Soft Recessed Ambient Occlusion Shadow Around Visor Bezel */}
      <rect
        x={visorCenterX - visorWidth / 2 - 3.8}
        y={visorCenterY - visorHeight / 2 - 3.4}
        width={visorWidth + 7.6}
        height={visorHeight + 7.6}
        rx={visorRx + 3.8}
        fill="#334155"
        opacity="0.32"
      />

      {/* 1. Molded Lavender-Silver Metallic Outer Visor Bezel */}
      <rect
        x={visorCenterX - visorWidth / 2 - 2.6}
        y={visorCenterY - visorHeight / 2 - 2.6}
        width={visorWidth + 5.2}
        height={visorHeight + 5.2}
        rx={visorRx + 2.6}
        fill={`url(#bezelGrad-${uid})`}
        stroke={colors.hullRim}
        strokeWidth="1.15"
      />

      {/* Inner Metallic Bezel Specular Chamfer */}
      <rect
        x={visorCenterX - visorWidth / 2 - 0.85}
        y={visorCenterY - visorHeight / 2 - 0.85}
        width={visorWidth + 1.7}
        height={visorHeight + 1.7}
        rx={visorRx + 0.85}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        opacity="0.72"
      />

      {/* 2. Deep Obsidian Curved Glass Visor Screen */}
      <rect
        x={visorCenterX - visorWidth / 2}
        y={visorCenterY - visorHeight / 2}
        width={visorWidth}
        height={visorHeight}
        rx={visorRx}
        fill={`url(#visorGlassGrad-${uid})`}
      />

      {/* Subtle Internal Glass Rim Glow */}
      <rect
        x={visorCenterX - visorWidth / 2 + 0.6}
        y={visorCenterY - visorHeight / 2 + 0.6}
        width={Math.max(4, visorWidth - 1.2)}
        height={Math.max(4, visorHeight - 1.2)}
        rx={Math.max(2, visorRx - 0.6)}
        fill="none"
        stroke={colors.eyeRing}
        strokeWidth="0.65"
        opacity="0.28"
      />

      {/* 3. Deep Holographic HUD Scanlines & Micro-Telemetry Brackets inside Visor */}
      {visorWidth > 26 && (
        <g opacity="0.16" stroke={colors.visorHudGrid} strokeWidth="0.45">
          <line
            x1={visorCenterX - visorWidth * 0.36}
            y1={visorCenterY - 4}
            x2={visorCenterX + visorWidth * 0.36}
            y2={visorCenterY - 4}
            strokeDasharray="1.5 2.5"
          />
          <line
            x1={visorCenterX - visorWidth * 0.38}
            y1={visorCenterY + 4}
            x2={visorCenterX + visorWidth * 0.38}
            y2={visorCenterY + 4}
            strokeDasharray="1.5 2.5"
          />
        </g>
      )}

      {/* 4. Interior Visor Elements (5-Layer Holographic Eyes, Cyan Floor Glow & Voice Equalizer) */}
      <g>
        {/* Bottom Bioluminescent Cyan Floor Reflection inside the Visor Bevel */}
        <ellipse
          cx={visorCenterX}
          cy={visorCenterY + visorHeight * 0.42}
          rx={visorWidth * 0.4}
          ry="3.4"
          fill={colors.eyeGlow}
          opacity={isSpeaking ? 0.68 : 0.38}
          filter={`url(#cyanEyeBloom-${uid})`}
        />

        {/* Render Left & Right Multi-Layered Holographic Eyes */}
        {yaw < 76 &&
          renderHolographicEye(
            leftEyeX,
            eyeY,
            leftEyeScaleX,
            smoothEyeScaleY,
            "left"
          )}
        {yaw > -76 &&
          renderHolographicEye(
            rightEyeX,
            eyeY,
            rightEyeScaleX,
            smoothEyeScaleY,
            "right"
          )}

        {/* Cute glowing cyan oval mouth indicator during Yawn */}
        {expression === "yawn" && (
          <ellipse
            cx={visorCenterX + eyeOffsetX * 0.5}
            cy={visorCenterY + visorHeight * 0.28}
            rx="2.6"
            ry="3.2"
            fill="#02050B"
            stroke={colors.eyeRing}
            strokeWidth="1.5"
            filter={`url(#cyanEyeBloom-${uid})`}
          />
        )}

        {/* Real-time Voice Equalizer Shimmer on Lower Visor Glass when Speaking */}
        {isSpeaking && (
          <g
            transform={`translate(${visorCenterX}, ${
              visorCenterY + visorHeight * 0.36
            })`}
          >
            {[-8, -4, 0, 4, 8].map((offset, i) => {
              const freq = (audioFrequencies[i * 2] || 120) / 255;
              const barH = Math.max(
                1.6,
                Math.min(5.2, freq * 4.6 + audioVolume * 3.2)
              );
              return (
                <rect
                  key={i}
                  x={offset - 1}
                  y={-barH / 2}
                  width="2"
                  height={barH}
                  rx="1"
                  fill={colors.eyeCore}
                  opacity="0.92"
                />
              );
            })}
          </g>
        )}

        {/* Top Curved Glass Specular Reflection Arc + Secondary Diagonal Glass Sheen */}
        <path
          d={`M ${visorCenterX - visorWidth * 0.36} ${
            visorCenterY - visorHeight * 0.28
          } Q ${visorCenterX} ${visorCenterY - visorHeight * 0.45} ${
            visorCenterX + visorWidth * 0.36
          } ${visorCenterY - visorHeight * 0.28}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.28"
        />
      </g>
    </g>
  );
};
