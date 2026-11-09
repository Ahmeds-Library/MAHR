import React from "react";
import {
  computeDroneSphericalProjection,
  DroneColorTokens,
  DronePerspectiveState,
} from "./droneVectorTypes";

interface DroneSphericalHullProps {
  perspective: DronePerspectiveState;
  colors: DroneColorTokens;
  uid: string;
}

/**
 * Layer 1: Unified Solid 3D-Shaded Spherical Hull, Molded Ear Pods & Locked Armor Seams
 * Uses shared spherical projection geometry so every panel seam, equator strap,
 * crown dome, lateral ear pod, and lower propulsion collar remains 100% connected
 * and smoothly reveals the underside turbine manifold as the drone pitches upward.
 */
export const DroneSphericalHull: React.FC<DroneSphericalHullProps> = ({
  perspective,
  colors,
  uid,
}) => {
  const { yaw, pitch } = perspective;
  const proj = computeDroneSphericalProjection(yaw, pitch);
  const {
    CX,
    CY,
    R,
    sinYaw,
    sinPitch,
    upwardTiltFactor,
    crownX,
    crownY,
    crownRx,
    crownRy,
    visorLeft,
    visorRight,
    visorTop,
    visorBottom,
    visorCenterY,
    leftEarX,
    rightEarX,
    earY,
    leftEarRx,
    rightEarRx,
    earRy,
    leftEarInFront,
    rightEarInFront,
    collarX,
    collarY,
    collarRx,
    collarRy,
  } = proj;

  const isBackVisible = Math.abs(yaw) > 95;
  const backCenterX = CX - sinYaw * R * 0.72;

  // Renders a molded lateral ear pod assembly (either occluded behind the sphere or flush on the near hemisphere)
  const renderMoldedEarPod = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    side: "left" | "right",
    isForeground: boolean
  ) => (
    <g
      key={`${side}-${isForeground ? "fg" : "bg"}`}
      transform={`translate(${x}, ${y})`}
    >
      {/* Soft ambient occlusion shadow where the ear pod meets the spherical hull */}
      {isForeground && (
        <ellipse
          cx={side === "left" ? 1.5 : -1.5}
          cy="0.8"
          rx={rx + 3.2}
          ry={ry + 2.8}
          fill="#475569"
          opacity="0.24"
        />
      )}

      {/* Molded Lavender-Silver Metallic Outer Housing */}
      <ellipse
        cx="0"
        cy="0"
        rx={rx + 2}
        ry={ry + 1.8}
        fill={`url(#bezelGrad-${uid})`}
        stroke={colors.hullRim}
        strokeWidth="1.05"
      />

      {/* Recessed Dark Groove + Bioluminescent Cyan Accent Ring */}
      <ellipse
        cx="0"
        cy="0"
        rx={rx + 0.3}
        ry={ry}
        fill="#0F172A"
        stroke={colors.eyeRing}
        strokeWidth="1.5"
        opacity="0.95"
      />

      {/* Convex Pearl-White Inner Acoustic Cap */}
      <ellipse
        cx={side === "left" ? -0.4 : 0.4}
        cy="0"
        rx={Math.max(1.8, rx - 1.1)}
        ry={ry - 2}
        fill={`url(#hullBodyGrad-${uid})`}
        stroke={colors.hullShadow}
        strokeWidth="0.8"
      />

      {/* Specular highlight on convex ear cap */}
      {rx > 4.5 && (
        <ellipse
          cx={-rx * 0.25}
          cy={-ry * 0.28}
          rx={rx * 0.32}
          ry={ry * 0.2}
          fill="#FFFFFF"
          opacity="0.7"
        />
      )}
    </g>
  );

  return (
    <g>
      {/* 1. Far-Side / Edge-On Lateral Ear Pods (Naturally occluded behind the main sphere silhouette) */}
      {!leftEarInFront &&
        renderMoldedEarPod(leftEarX, earY, leftEarRx, earRy, "left", false)}
      {!rightEarInFront &&
        renderMoldedEarPod(rightEarX, earY, rightEarRx, earRy, "right", false)}

      {/* 2. Main Unified Spherical Ceramic Hull & Locked Surface Seams */}
      <g clipPath={`url(#sphereClip-${uid})`}>
        {/* Base 3D Pearl-White Ceramic Sphere */}
        <circle cx={CX} cy={CY} r={R} fill={`url(#hullBodyGrad-${uid})`} />

        {/* Subtle Lavender-Blue Lower Hemisphere Ambient Bounce Shading */}
        <path
          d={`M ${CX - R - 2} ${CY + 10} Q ${CX + sinYaw * 10} ${
            CY + 28 - sinPitch * 8
          } ${CX + R + 2} ${CY + 10} L ${CX + R + 2} ${CY + R + 4} L ${
            CX - R - 2
          } ${CY + R + 4} Z`}
          fill={`url(#lowerBounceGrad-${uid})`}
          opacity="0.78"
        />

        {/* Connected Chin Armor Plate (Locked directly between Visor Bottom Corners and Lower Collar) */}
        {!isBackVisible && (
          <path
            d={`M ${visorLeft + 5} ${visorBottom - 1}
                Q ${visorLeft + 7} ${(visorBottom + collarY) * 0.5} ${
              collarX - collarRx * 0.58
            } ${collarY - 2}
                Q ${collarX} ${collarY + 2.5} ${
              collarX + collarRx * 0.58
            } ${collarY - 2}
                Q ${visorRight - 7} ${(visorBottom + collarY) * 0.5} ${
              visorRight - 5
            } ${visorBottom - 1} Z`}
            fill={colors.crownLight}
            fillOpacity="0.52"
            stroke={colors.hullRim}
            strokeWidth="1.05"
            strokeLinejoin="round"
          />
        )}

        {/* Sculpted Lower Propulsion Collar + Progressive Underside Turbine Manifold */}
        <g>
          <ellipse
            cx={collarX}
            cy={collarY}
            rx={collarRx}
            ry={collarRy}
            fill={`url(#bezelGrad-${uid})`}
            stroke={colors.hullRim}
            strokeWidth="1.15"
          />

          {/* Progressive Underside Recessed Turbine Ring (Smoothly rotates into view as drone looks up) */}
          {upwardTiltFactor > 0.01 && (
            <g opacity={Math.min(1, upwardTiltFactor * 1.35)}>
              {/* Recessed dark-chrome underside turbine bay */}
              <ellipse
                cx={collarX}
                cy={collarY + 1.2}
                rx={collarRx * 0.72}
                ry={Math.max(1.8, collarRy * 0.65)}
                fill="#0B1120"
                stroke={colors.thrusterCore}
                strokeWidth="1.2"
              />
              {/* Left & Right underside attitude ports inside the collar */}
              <ellipse
                cx={collarX - collarRx * 0.52}
                cy={collarY + 0.8}
                rx="3.8"
                ry={Math.max(1.1, collarRy * 0.34)}
                fill="#0F172A"
                stroke={colors.thrusterCore}
                strokeWidth="1.05"
              />
              <ellipse
                cx={collarX + collarRx * 0.52}
                cy={collarY + 0.8}
                rx="3.8"
                ry={Math.max(1.1, collarRy * 0.34)}
                fill="#0F172A"
                stroke={colors.thrusterCore}
                strokeWidth="1.05"
              />
              {/* Central glowing primary hover core */}
              <ellipse
                cx={collarX}
                cy={collarY + 1.4}
                rx="6.2"
                ry={Math.max(1.2, collarRy * 0.38)}
                fill={colors.thrusterCore}
                opacity="0.92"
              />
            </g>
          )}
        </g>

        {/* Connected Equatorial Lavender Straps (Locked between Visor Sides and Lateral Ear Pods) */}
        {!isBackVisible && (
          <g>
            {/* Left Equatorial Strap */}
            <path
              d={`M ${leftEarX} ${earY - 3.5}
                  Q ${(leftEarX + visorLeft) * 0.5} ${visorCenterY - 4} ${
                visorLeft + 2
              } ${visorCenterY - 3.5}
                  L ${visorLeft + 2} ${visorCenterY + 4.5}
                  Q ${(leftEarX + visorLeft) * 0.5} ${visorCenterY + 4} ${leftEarX} ${
                earY + 4.5
              } Z`}
              fill={`url(#bezelGrad-${uid})`}
              stroke={colors.hullRim}
              strokeWidth="0.95"
            />
            {/* Right Equatorial Strap */}
            <path
              d={`M ${visorRight - 2} ${visorCenterY - 3.5}
                  Q ${(rightEarX + visorRight) * 0.5} ${visorCenterY - 4} ${rightEarX} ${
                earY - 3.5
              }
                  L ${rightEarX} ${earY + 4.5}
                  Q ${(rightEarX + visorRight) * 0.5} ${visorCenterY + 4} ${
                visorRight - 2
              } ${visorCenterY + 4.5} Z`}
              fill={`url(#bezelGrad-${uid})`}
              stroke={colors.hullRim}
              strokeWidth="0.95"
            />
          </g>
        )}

        {/* Connected Upper Temple Meridian Seams (Locked from Visor Top Corners to Crown Dome) */}
        {!isBackVisible && (
          <g
            fill="none"
            stroke={colors.hullRim}
            strokeWidth="1.15"
            strokeLinecap="round"
            opacity="0.82"
          >
            <path
              d={`M ${visorLeft + 6} ${visorTop + 1} Q ${
                visorLeft + 3
              } ${(visorTop + crownY) * 0.52} ${crownX - crownRx * 0.68} ${
                crownY + crownRy * 0.55
              }`}
            />
            <path
              d={`M ${visorRight - 6} ${visorTop + 1} Q ${
                visorRight - 3
              } ${(visorTop + crownY) * 0.52} ${crownX + crownRx * 0.68} ${
                crownY + crownRy * 0.55
              }`}
            />
          </g>
        )}

        {/* Back-View Rear Reactor Plate & Connected Straps (Visible during 3/4 Back & Back turnaround) */}
        {isBackVisible && (
          <g transform={`translate(${backCenterX}, ${CY})`}>
            <rect
              x="-34"
              y="-3.5"
              width="68"
              height="7"
              rx="3.5"
              fill={`url(#bezelGrad-${uid})`}
              stroke={colors.hullRim}
              strokeWidth="1"
            />
            <circle
              cx="0"
              cy="0"
              r="14.5"
              fill={colors.hullMid}
              stroke={colors.hullRim}
              strokeWidth="1.25"
            />
            <circle
              cx="0"
              cy="0"
              r="9.5"
              fill={colors.crownLight}
              stroke={colors.eyeRing}
              strokeWidth="1.2"
              opacity="0.85"
            />
            <path
              d="M -5.5 -14 L -5.5 -28 M 5.5 -14 L 5.5 -28 M -5.5 14 L -5.5 28 M 5.5 14 L 5.5 28"
              stroke={colors.hullRim}
              strokeWidth="1.1"
            />
          </g>
        )}

        {/* Molded Pastel Ice-Blue Top Crown Dome (Matches Front, Top-Down, and Isometric Views) */}
        <ellipse
          cx={crownX}
          cy={crownY}
          rx={crownRx}
          ry={crownRy}
          fill={`url(#crownCapGrad-${uid})`}
          stroke={colors.hullRim}
          strokeWidth="1.15"
        />

        {/* Subtle Inner Highlight Rim along the Crown Seam */}
        <ellipse
          cx={crownX}
          cy={crownY + 0.8}
          rx={crownRx * 0.94}
          ry={crownRy * 0.9}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          opacity="0.65"
        />

        {/* Top-Down View Concentric Crown Cap Detail */}
        {pitch > 8 && (
          <ellipse
            cx={crownX}
            cy={crownY - 1.5}
            rx={crownRx * 0.52}
            ry={crownRy * 0.54}
            fill={colors.crownLight}
            stroke={colors.hullRim}
            strokeWidth="0.95"
          />
        )}

        {/* Precision Micro-Rivet Accents Anchored to Seam Junctions */}
        {!isBackVisible && (
          <g fill={colors.hullRim} opacity="0.88">
            <circle cx={visorLeft + 6} cy={visorTop - 3} r="0.95" />
            <circle cx={visorRight - 6} cy={visorTop - 3} r="0.95" />
            <circle cx={visorLeft + 6.5} cy={visorBottom + 3.2} r="0.95" />
            <circle cx={visorRight - 6.5} cy={visorBottom + 3.2} r="0.95" />
          </g>
        )}

        {/* High-Gloss 3D Pearl-Titanium Top-Left Studio Softbox Specular Highlight */}
        <ellipse
          cx={CX - 12.2}
          cy={CY - 19.8}
          rx="14.2"
          ry="6.4"
          transform={`rotate(-26 ${CX - 12.2} ${CY - 19.8})`}
          fill="#FFFFFF"
          opacity="0.72"
        />
        <ellipse
          cx={CX - 13.5}
          cy={CY - 20.6}
          rx="7.5"
          ry="2.9"
          transform={`rotate(-26 ${CX - 13.5} ${CY - 20.6})`}
          fill="#FFFFFF"
          opacity="0.92"
        />

        {/* Secondary Micro Specular Glint + Rim Fresnel Arc */}
        <circle cx={CX - 22.2} cy={CY - 8.2} r="2.2" fill="#FFFFFF" opacity="0.62" />
        <path
          d={`M ${CX + R * 0.56} ${CY - R * 0.72} A ${R - 1.4} ${
            R - 1.4
          } 0 0 1 ${CX + R * 0.88} ${CY + R * 0.25}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Outer Spherical Rim Contour Shadow for Crisp 3D Pearl-Titanium Definition */}
        <circle
          cx={CX}
          cy={CY}
          r={R - 0.55}
          fill="none"
          stroke={colors.hullRim}
          strokeWidth="1.25"
          opacity="0.82"
        />
      </g>

      {/* 3. Near-Side Molded Lateral Ear Pod (Smoothly integrated when rotated toward viewer) */}
      {leftEarInFront &&
        renderMoldedEarPod(leftEarX, earY, leftEarRx, earRy, "left", true)}
      {rightEarInFront &&
        renderMoldedEarPod(rightEarX, earY, rightEarRx, earRy, "right", true)}
    </g>
  );
};
