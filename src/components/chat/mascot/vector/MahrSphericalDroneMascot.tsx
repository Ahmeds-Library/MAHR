import React, { useId, useMemo } from "react";
import {
  getDroneColorTokens,
  MahrSphericalDroneProps,
} from "./droneVectorTypes";
import { useDronePerspectiveController } from "./useDronePerspectiveController";
import { DroneThrusterPlumes } from "./DroneThrusterPlumes";
import { DroneSphericalHull } from "./DroneSphericalHull";
import { DroneVisorAndRingEyes } from "./DroneVisorAndRingEyes";

/**
 * Layer 3: Master Vector Spherical Hover-Drone Companion
 * Renders a unified, solid 3D-shaded spherical shell with connected armor seams,
 * recessed lavender visor, hollow cyan ring eyes, continuous underside thruster projection,
 * and GSAP spring physics.
 */
export const MahrSphericalDroneMascot: React.FC<MahrSphericalDroneProps> = ({
  expression = "normal",
  themeHex = "#38bdf8",
  activity = "idle",
  isHovered = false,
  isSpeaking = false,
  isThinking = false,
  isRealtimeConnected = false,
  gaze = { x: 0, y: 0 },
  audioFrequencies = [],
  audioVolume = 0,
  velocityTilt = 0,
  size = 86,
  className = "",
  forcePose,
  showGroundShadow = false,
}) => {
  const rawId = useId();
  const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId]);

  const perspective = useDronePerspectiveController({
    gaze,
    activity,
    isHovered,
    isSpeaking,
    isThinking,
    audioVolume,
    velocityTilt,
    forcePose,
  });

  const colors = useMemo(
    () => getDroneColorTokens(expression, isRealtimeConnected, themeHex),
    [expression, isRealtimeConnected, themeHex]
  );

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      data-mascot-pose={perspective.activePose}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full overflow-visible"
        style={{
          filter: isHovered
            ? `drop-shadow(0 8px 16px rgba(56, 189, 248, 0.45))`
            : isSpeaking
            ? `drop-shadow(0 8px 18px rgba(103, 232, 249, 0.55))`
            : `drop-shadow(0 6px 12px rgba(15, 23, 42, 0.48))`,
          transition: "filter 0.3s ease",
        }}
      >
        <defs>
          {/* Main Spherical Clip Path (Centered at 60, 55, R=36) */}
          <clipPath id={`sphereClip-${uid}`}>
            <circle cx="60" cy="55" r="36" />
          </clipPath>

          {/* High-Gloss 3D Pearl-Titanium Hull Radial Gradient */}
          <radialGradient
            id={`hullBodyGrad-${uid}`}
            cx="34%"
            cy="24%"
            r="74%"
            fx="28%"
            fy="20%"
          >
            <stop offset="0%" stopColor={colors.hullHighlight} />
            <stop offset="42%" stopColor={colors.hullMid} />
            <stop offset="80%" stopColor={colors.hullShadow} />
            <stop offset="100%" stopColor={colors.hullDeepShadow} />
          </radialGradient>

          {/* Lower Hemisphere Lavender-Cyan Ambient Bounce Gradient */}
          <linearGradient
            id={`lowerBounceGrad-${uid}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colors.lavenderLight} stopOpacity="0.22" />
            <stop offset="65%" stopColor={colors.lavenderMid} stopOpacity="0.68" />
            <stop offset="100%" stopColor={colors.lavenderDark} stopOpacity="0.88" />
          </linearGradient>

          {/* Pastel Ice-Blue Top Crown Cap Gradient */}
          <linearGradient
            id={`crownCapGrad-${uid}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#F8FCFF" />
            <stop offset="52%" stopColor={colors.crownLight} />
            <stop offset="100%" stopColor={colors.crownMid} />
          </linearGradient>

          {/* Lavender-Silver Metallic Visor & Collar Bezel Gradient */}
          <linearGradient
            id={`bezelGrad-${uid}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colors.lavenderLight} />
            <stop offset="50%" stopColor={colors.lavenderMid} />
            <stop offset="100%" stopColor={colors.lavenderDark} />
          </linearGradient>

          {/* Deep Obsidian Curved Glass Visor Gradient */}
          <linearGradient
            id={`visorGlassGrad-${uid}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colors.visorGlassTop} />
            <stop offset="68%" stopColor={colors.visorGlassBottom} />
            <stop offset="100%" stopColor="#071B2E" />
          </linearGradient>

          {/* Recessed Optical Eye Lens Socket Radial Depth Gradient */}
          <radialGradient id={`eyeSocketGrad-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.eyeGlow} stopOpacity="0.32" />
            <stop offset="70%" stopColor="#040B18" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#010308" stopOpacity="1" />
          </radialGradient>

          {/* Cyan-Violet Plasma Jet Plume Gradient */}
          <linearGradient
            id={`thrusterPlumeGrad-${uid}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="28%" stopColor={colors.thrusterCore} stopOpacity="0.92" />
            <stop offset="68%" stopColor={colors.thrusterPlume} stopOpacity="0.58" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>

          {/* Golden-Orange Afterburner Boost Sheath Gradient */}
          <linearGradient
            id={`afterburnerPlumeGrad-${uid}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colors.afterburnerCore} stopOpacity="0.96" />
            <stop offset="45%" stopColor={colors.afterburnerSheath} stopOpacity="0.78" />
            <stop offset="85%" stopColor="#EF4444" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#7C2D12" stopOpacity="0" />
          </linearGradient>

          {/* Bioluminescent Cyan Ring Eye & Plasma Bloom Filter */}
          <filter
            id={`cyanEyeBloom-${uid}`}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Optional Ground Hover Shadow */}
        {showGroundShadow && (
          <ellipse
            cx={60 + perspective.hoverDriftX * 0.5}
            cy="111"
            rx={Math.max(14, 22 - perspective.hoverBobY * 0.85)}
            ry="3.5"
            fill="#020617"
            opacity="0.35"
          />
        )}

        {/* Unified Articulated Spherical Drone Group (GSAP Hover Harmonics, Banking Roll & Squash/Stretch) */}
        <g
          transform={`translate(${perspective.hoverDriftX}, ${perspective.hoverBobY}) translate(60, 55) rotate(${perspective.roll}) scale(${perspective.squashX}, ${perspective.squashY}) translate(-60, -55)`}
        >
          {/* 1. Underside Hover-Jet Thrusters & Plasma Mist (Anchored to lower propulsion collar with continuous 3D projection) */}
          <DroneThrusterPlumes
            perspective={perspective}
            colors={colors}
            isSpeaking={isSpeaking}
            uid={uid}
          />

          {/* 2. Unified Spherical Pearl-White Hull, Ice-Blue Crown, Connected Seams, Progressive Underside Collar & Molded Ear Pods */}
          <DroneSphericalHull
            perspective={perspective}
            colors={colors}
            uid={uid}
          />

          {/* 3. Recessed Obsidian Visor & Bioluminescent Hollow Ring Eyes */}
          <DroneVisorAndRingEyes
            perspective={perspective}
            colors={colors}
            expression={expression}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            audioFrequencies={audioFrequencies}
            audioVolume={audioVolume}
            uid={uid}
          />
        </g>
      </svg>
    </div>
  );
};

/**
 * Compact Vector Spherical Drone Avatar for Chat Headers, Message Badges & Toolbars
 */
export const MahrDroneMiniAvatar: React.FC<{
  size?: number;
  isRealtimeConnected?: boolean;
  isSpeaking?: boolean;
  className?: string;
}> = ({
  size = 32,
  isRealtimeConnected = false,
  isSpeaking = false,
  className = "",
}) => {
  const rawId = useId();
  const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId]);
  const ringColor = isRealtimeConnected ? "#34D399" : "#5CE1E6";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id={`miniHull-${uid}`} cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </radialGradient>
        </defs>

        {/* Connected Lower Collar & Mini Thruster Glow */}
        <ellipse cx="32" cy="52" rx="14" ry="4" fill="#C4B5FD" stroke="#94A3B8" strokeWidth="0.8" />
        <ellipse cx="22" cy="54.5" rx="4" ry="2" fill="#C4B5FD" />
        <ellipse cx="42" cy="54.5" rx="4" ry="2" fill="#C4B5FD" />
        <ellipse cx="32" cy="56" rx="5.5" ry="2.2" fill={ringColor} opacity="0.9" />

        {/* Molded Side Ear Discs */}
        <ellipse cx="7" cy="31" rx="2.8" ry="9" fill="#C4B5FD" stroke={ringColor} strokeWidth="0.9" />
        <ellipse cx="57" cy="31" rx="2.8" ry="9" fill="#C4B5FD" stroke={ringColor} strokeWidth="0.9" />

        {/* Main Spherical Pearl Body */}
        <circle cx="32" cy="30" r="24.5" fill={`url(#miniHull-${uid})`} stroke="#94A3B8" strokeWidth="1" />

        {/* Top Pastel Ice-Blue Crown */}
        <ellipse cx="32" cy="11" rx="14" ry="5.2" fill="#D4E6F6" stroke="#94A3B8" strokeWidth="0.8" />

        {/* Connected Equatorial Straps */}
        <line x1="7.5" y1="30" x2="13" y2="30" stroke="#C4B5FD" strokeWidth="3.5" />
        <line x1="51" y1="30" x2="56.5" y2="30" stroke="#C4B5FD" strokeWidth="3.5" />

        {/* Recessed Obsidian Pill Visor with Lavender Bezel */}
        <rect
          x="13"
          y="18.5"
          width="38"
          height="21"
          rx="10.5"
          fill="#060A14"
          stroke="#C4B5FD"
          strokeWidth="2.2"
        />

        {/* Signature Hollow Neon Cyan Ring Eyes */}
        <circle
          cx="24.5"
          cy="29"
          r="4.2"
          fill="none"
          stroke={ringColor}
          strokeWidth="2.2"
          className={isSpeaking ? "animate-pulse" : ""}
        />
        <circle
          cx="39.5"
          cy="29"
          r="4.2"
          fill="none"
          stroke={ringColor}
          strokeWidth="2.2"
          className={isSpeaking ? "animate-pulse" : ""}
        />
        <circle cx="24.5" cy="29" r="4.2" fill="none" stroke="#F0FDFA" strokeWidth="0.8" />
        <circle cx="39.5" cy="29" r="4.2" fill="none" stroke="#F0FDFA" strokeWidth="0.8" />

        {/* Visor Top Reflection */}
        <path
          d="M 19 22 Q 32 19.5 45 22"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.25"
        />
      </svg>
    </div>
  );
};
