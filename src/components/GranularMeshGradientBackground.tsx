import React from "react";
import { HumanMoodType } from "@/services/humanEmotionEngine";
import { useMeshCrossfade } from "./mesh/useMeshCrossfade";
import { OrganicMeshLayer } from "./mesh/OrganicMeshLayer";

interface GranularMeshGradientBackgroundProps {
  currentMood: HumanMoodType;
  fallbackGradient?: string;
  autoShiftBackground?: boolean;
  intensity?: number;
  transitionDurationMs?: number;
}

export const GranularMeshGradientBackground: React.FC<GranularMeshGradientBackgroundProps> = ({
  currentMood,
  intensity = 1.0,
  transitionDurationMs = 1800,
}) => {
  const {
    activeConfig,
    prevConfig,
    progress,
    blendedBackground,
  } = useMeshCrossfade({
    currentMood,
    transitionDurationMs,
  });

  return (
    <div
      id="granular-mesh-gradient-viewport"
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none transition-colors duration-500 ease-out"
      style={{ backgroundColor: blendedBackground }}
    >
      {/* Layer 1: Previous Mood SVG Mesh (smoothly fading out with cubic easing) */}
      {prevConfig && (
        <div className="absolute inset-0 pointer-events-none">
          <OrganicMeshLayer
            config={prevConfig}
            idPrefix="prev"
            opacity={(1 - progress) * intensity}
          />
        </div>
      )}

      {/* Layer 2: Incoming Active Mood SVG Mesh (smoothly fading in with cubic easing) */}
      <div className="absolute inset-0 pointer-events-none">
        <OrganicMeshLayer
          config={activeConfig}
          idPrefix="active"
          opacity={progress * intensity}
        />
      </div>

      {/* Layer 3: Fine Organic Film Grain Overlay for optical depth & texture */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none bg-repeat"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
};

export default GranularMeshGradientBackground;
