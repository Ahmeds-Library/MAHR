import React from "react";
import {
  computeDroneSphericalProjection,
  DroneColorTokens,
  DronePerspectiveState,
} from "./droneVectorTypes";
import {
  computeAdaptivePlasmaJetGeometry,
  ThrusterJetGeometry,
} from "./droneThrusterPhysics";

interface DroneThrusterPlumesProps {
  perspective: DronePerspectiveState;
  colors: DroneColorTokens;
  isSpeaking?: boolean;
  uid: string;
}

/**
 * Layer 3: Articulated Thruster Gimbals & 60fps Adaptive Plasma Jet Plumes
 * Renders 3 vectoring hover-jet nozzles with:
 * - Cyan-violet turbulent plasma cone
 * - Golden-orange afterburner outer thermal sheath during fast boosts/leaps
 * - White-hot supersonic inner plasma spear
 * - Oscillating standing-wave Mach shock diamonds
 * - Continuous 60fps plasma exhaust sparks
 */
export const DroneThrusterPlumes: React.FC<DroneThrusterPlumesProps> = ({
  perspective,
  colors,
  isSpeaking = false,
  uid,
}) => {
  const {
    yaw,
    pitch,
    thrusterIntensity,
    flamePhase = 0,
    afterburnerIntensity = 0,
    nozzleGimbalDeg = 0,
  } = perspective;

  const proj = computeDroneSphericalProjection(yaw, pitch);
  const { sinYaw, collarX, collarY, upwardTiltFactor } = proj;

  // When looking steeply downward (Top-Down view, pitch > 22°), the underside nozzles tuck behind the lower rim
  const downwardOcclusion = Math.max(0, Math.min(1, (pitch - 14) / 22));
  const downwardShiftY = -downwardOcclusion * 5.5;
  const upwardShiftY = upwardTiltFactor * 2.6;

  const leftNozzleX = collarX - 15.2 + sinYaw * 1.6;
  const rightNozzleX = collarX + 15.2 + sinYaw * 1.6;
  const centerNozzleX = collarX;

  const sideNozzleY = collarY - 1.2 + upwardShiftY + downwardShiftY;
  const centerNozzleY = collarY + 2.1 + upwardShiftY * 1.15 + downwardShiftY;

  const sideApertureRy = 1.9 + upwardTiltFactor * 2.2;
  const centerApertureRy = 2.15 + upwardTiltFactor * 2.5;

  const foreshortenFactor =
    (1 - upwardTiltFactor * 0.16) * (1 - downwardOcclusion * 0.45);
  const effectiveIntensity = Math.min(
    1,
    thrusterIntensity + (isSpeaking ? 0.18 : 0)
  );

  // Compute 60fps Adaptive Plasma Jet geometry for Left, Center, and Right thrusters
  const leftJet = computeAdaptivePlasmaJetGeometry({
    nozzleRadius: 4.5,
    thrusterIntensity: effectiveIntensity,
    afterburnerIntensity,
    flamePhase,
    phaseOffset: 0,
    foreshortenFactor,
    diamondCount: 2,
  });

  const centerJet = computeAdaptivePlasmaJetGeometry({
    nozzleRadius: 6.2,
    thrusterIntensity: effectiveIntensity,
    afterburnerIntensity,
    flamePhase,
    phaseOffset: 2.1,
    foreshortenFactor,
    diamondCount: 3,
  });

  const rightJet = computeAdaptivePlasmaJetGeometry({
    nozzleRadius: 4.5,
    thrusterIntensity: effectiveIntensity,
    afterburnerIntensity,
    flamePhase,
    phaseOffset: 4.2,
    foreshortenFactor,
    diamondCount: 2,
  });

  const renderPlasmaJetPlume = (
    jet: ThrusterJetGeometry,
    x: number,
    y: number,
    angleDeg: number,
    keyId: string
  ) => (
    <g
      key={keyId}
      transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${angleDeg.toFixed(2)})`}
    >
      {/* 1. Ambient Thermal Plasma Haze */}
      <ellipse
        cx="0"
        cy={(jet.jetLength * 0.42).toFixed(2)}
        rx={(5.5 + afterburnerIntensity * 2.8).toFixed(2)}
        ry={(jet.jetLength * 0.56).toFixed(2)}
        fill={
          afterburnerIntensity > 0.35
            ? colors.afterburnerSheath
            : colors.thrusterPlume
        }
        opacity={(0.22 + effectiveIntensity * 0.2).toFixed(2)}
        filter={`url(#cyanEyeBloom-${uid})`}
      />

      {/* 2. Golden-Orange Afterburner Outer Sheath (Ignites on high-speed boosts, leaps & braking flares) */}
      {afterburnerIntensity > 0.04 && (
        <path
          d={jet.afterburnerSheathPath}
          fill={`url(#afterburnerPlumeGrad-${uid})`}
          opacity={Math.min(0.95, 0.25 + afterburnerIntensity * 0.75).toFixed(2)}
          filter={`url(#cyanEyeBloom-${uid})`}
        />
      )}

      {/* 3. Primary Turbulent Cyan-Violet Plasma Jet Cone */}
      <path
        d={jet.outerPlasmaPath}
        fill={`url(#thrusterPlumeGrad-${uid})`}
        opacity={(0.78 + effectiveIntensity * 0.22).toFixed(2)}
      />

      {/* 4. High-Velocity White-Hot Inner Plasma Spear */}
      <path
        d={jet.innerCorePath}
        fill={colors.eyeCore}
        opacity={(0.86 + effectiveIntensity * 0.14).toFixed(2)}
      />

      {/* 5. Standing-Wave Supersonic Mach Shock Diamonds */}
      {jet.machDiamonds.map((diamond, idx) => (
        <g key={idx} opacity={diamond.opacity.toFixed(2)}>
          <path
            d={diamond.pathD}
            fill={
              afterburnerIntensity > 0.4 && idx === 0
                ? colors.afterburnerCore
                : "#FFFFFF"
            }
            stroke={
              afterburnerIntensity > 0.35
                ? colors.afterburnerSheath
                : colors.eyeRing
            }
            strokeWidth="0.55"
          />
        </g>
      ))}

      {/* 6. 60fps Streaming Exhaust Spark Particles */}
      {jet.sparks.map((spark) => (
        <circle
          key={spark.id}
          cx={spark.x.toFixed(2)}
          cy={spark.y.toFixed(2)}
          r={spark.r.toFixed(2)}
          fill={
            spark.isAfterburnerSpark ? colors.afterburnerCore : colors.eyeCore
          }
          opacity={spark.opacity.toFixed(2)}
        />
      ))}
    </g>
  );

  const leftGimbalAngle = 16 + nozzleGimbalDeg * 0.85;
  const rightGimbalAngle = -16 + nozzleGimbalDeg * 0.85;
  const centerGimbalAngle = nozzleGimbalDeg;

  return (
    <g opacity={1 - downwardOcclusion * 0.45}>
      {/* 1. Unified Lower Chassis Propulsion Skirt (Bridges sphere bottom to gimbal housings with zero air gap) */}
      <path
        d={`M ${leftNozzleX - 6.2} ${sideNozzleY - 4.5}
            Q ${centerNozzleX} ${centerNozzleY + 3.4} ${rightNozzleX + 6.2} ${sideNozzleY - 4.5}
            L ${rightNozzleX + 3.4} ${sideNozzleY + 2.1}
            Q ${centerNozzleX} ${centerNozzleY + 5.4} ${leftNozzleX - 3.4} ${sideNozzleY + 2.1} Z`}
        fill={`url(#bezelGrad-${uid})`}
        stroke={colors.hullRim}
        strokeWidth="1"
      />

      {/* 2. 60fps Adaptive Plasma Jets (Rendered behind nozzle rims so flames emerge from inside the throat) */}
      <g>
        {renderPlasmaJetPlume(
          leftJet,
          leftNozzleX - 1.2,
          sideNozzleY + 2.6,
          leftGimbalAngle,
          "left-jet"
        )}
        {renderPlasmaJetPlume(
          centerJet,
          centerNozzleX,
          centerNozzleY + 2.9,
          centerGimbalAngle,
          "center-jet"
        )}
        {renderPlasmaJetPlume(
          rightJet,
          rightNozzleX + 1.2,
          sideNozzleY + 2.6,
          rightGimbalAngle,
          "right-jet"
        )}
      </g>

      {/* 3. Left Articulated Thruster Gimbal & Glowing Nozzle Throat */}
      <g
        transform={`translate(${leftNozzleX.toFixed(2)}, ${sideNozzleY.toFixed(
          2
        )}) rotate(${leftGimbalAngle.toFixed(2)})`}
      >
        {/* Gimbal Actuator Ring */}
        <ellipse
          cx="0"
          cy="-2.8"
          rx="6.2"
          ry="1.6"
          fill={colors.lavenderDark}
          stroke={colors.hullRim}
          strokeWidth="0.8"
        />
        {/* Sculpted Titanium-Lavender Nozzle Shroud */}
        <path
          d={`M -6.1 -4.8 L 6.1 -4.8 L 5.4 ${2.4 + upwardTiltFactor * 1.2} C 5.4 ${
            4.2 + upwardTiltFactor * 1.6
          } 3 ${5 + upwardTiltFactor * 1.8} 0 ${
            5 + upwardTiltFactor * 1.8
          } C -3 ${5 + upwardTiltFactor * 1.8} -5.4 ${
            4.2 + upwardTiltFactor * 1.6
          } -5.4 ${2.4 + upwardTiltFactor * 1.2} Z`}
          fill={`url(#bezelGrad-${uid})`}
          stroke={colors.hullRim}
          strokeWidth="0.95"
        />
        {/* Glowing Recessed Turbine Throat */}
        <ellipse
          cx="0"
          cy={2.6 + upwardTiltFactor * 0.8}
          rx="5.1"
          ry={sideApertureRy}
          fill="#060B16"
          stroke={
            afterburnerIntensity > 0.45
              ? colors.afterburnerCore
              : colors.thrusterCore
          }
          strokeWidth="1.4"
        />
        {/* Incandescent Plasma Injector Core */}
        <ellipse
          cx="0"
          cy={2.6 + upwardTiltFactor * 0.8}
          rx="3.1"
          ry={sideApertureRy * 0.58}
          fill="#FFFFFF"
        />
      </g>

      {/* 4. Right Articulated Thruster Gimbal & Glowing Nozzle Throat */}
      <g
        transform={`translate(${rightNozzleX.toFixed(2)}, ${sideNozzleY.toFixed(
          2
        )}) rotate(${rightGimbalAngle.toFixed(2)})`}
      >
        <ellipse
          cx="0"
          cy="-2.8"
          rx="6.2"
          ry="1.6"
          fill={colors.lavenderDark}
          stroke={colors.hullRim}
          strokeWidth="0.8"
        />
        <path
          d={`M -6.1 -4.8 L 6.1 -4.8 L 5.4 ${2.4 + upwardTiltFactor * 1.2} C 5.4 ${
            4.2 + upwardTiltFactor * 1.6
          } 3 ${5 + upwardTiltFactor * 1.8} 0 ${
            5 + upwardTiltFactor * 1.8
          } C -3 ${5 + upwardTiltFactor * 1.8} -5.4 ${
            4.2 + upwardTiltFactor * 1.6
          } -5.4 ${2.4 + upwardTiltFactor * 1.2} Z`}
          fill={`url(#bezelGrad-${uid})`}
          stroke={colors.hullRim}
          strokeWidth="0.95"
        />
        <ellipse
          cx="0"
          cy={2.6 + upwardTiltFactor * 0.8}
          rx="5.1"
          ry={sideApertureRy}
          fill="#060B16"
          stroke={
            afterburnerIntensity > 0.45
              ? colors.afterburnerCore
              : colors.thrusterCore
          }
          strokeWidth="1.4"
        />
        <ellipse
          cx="0"
          cy={2.6 + upwardTiltFactor * 0.8}
          rx="3.1"
          ry={sideApertureRy * 0.58}
          fill="#FFFFFF"
        />
      </g>

      {/* 5. Center Primary Gimbal Stabilizer Thruster Nozzle */}
      <g
        transform={`translate(${centerNozzleX.toFixed(2)}, ${centerNozzleY.toFixed(
          2
        )}) rotate(${centerGimbalAngle.toFixed(2)})`}
      >
        <ellipse
          cx="0"
          cy="-2.6"
          rx="8.5"
          ry="2.0"
          fill={colors.lavenderDark}
          stroke={colors.hullRim}
          strokeWidth="0.9"
        />
        <path
          d={`M -8.4 -4.6 L 8.4 -4.6 L 7.3 ${2.5 + upwardTiltFactor * 1.3} C 7.3 ${
            4.4 + upwardTiltFactor * 1.8
          } 4 ${5.2 + upwardTiltFactor * 2} 0 ${
            5.2 + upwardTiltFactor * 2
          } C -4 ${5.2 + upwardTiltFactor * 2} -7.3 ${
            4.4 + upwardTiltFactor * 1.8
          } -7.3 ${2.5 + upwardTiltFactor * 1.3} Z`}
          fill={`url(#bezelGrad-${uid})`}
          stroke={colors.hullRim}
          strokeWidth="1.05"
        />
        {/* Metallic nozzle cooling ribs */}
        <line
          x1="-4.2"
          y1="-3.5"
          x2="-3.8"
          y2="1.2"
          stroke={colors.hullRim}
          strokeWidth="0.75"
          opacity="0.65"
        />
        <line
          x1="0"
          y1="-3.6"
          x2="0"
          y2="1.4"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          opacity="0.55"
        />
        <line
          x1="4.2"
          y1="-3.5"
          x2="3.8"
          y2="1.2"
          stroke={colors.hullRim}
          strokeWidth="0.75"
          opacity="0.65"
        />
        <ellipse
          cx="0"
          cy={2.7 + upwardTiltFactor * 0.9}
          rx="7.0"
          ry={centerApertureRy}
          fill="#060B16"
          stroke={
            afterburnerIntensity > 0.35
              ? colors.afterburnerCore
              : colors.thrusterCore
          }
          strokeWidth="1.6"
        />
        <ellipse
          cx="0"
          cy={2.7 + upwardTiltFactor * 0.9}
          rx="4.4"
          ry={centerApertureRy * 0.6}
          fill="#FFFFFF"
        />
      </g>
    </g>
  );
};
