import React from "react";
import { EyeExpression } from "./useMascotPlayEngine";
import { MahrThemePalette } from "./useMascotMahrSync";
import { MahrSphericalDroneMascot } from "./vector/MahrSphericalDroneMascot";

interface MascotFaceVisorProps {
  expression: EyeExpression;
  isOpen: boolean;
  isRealtimeConnected: boolean;
  gazeOffset?: { x: number; y: number };
  isTrackingCursor?: boolean;
  palette?: MahrThemePalette;
  audioVolume?: number;
}

/**
 * Replaces the legacy flat visor with the new Spherical Hover-Drone Vector Companion.
 */
export const MascotFaceVisor: React.FC<MascotFaceVisorProps> = ({
  expression,
  isRealtimeConnected,
  gazeOffset = { x: 0, y: 0 },
  palette,
  audioVolume = 0,
}) => {
  return (
    <MahrSphericalDroneMascot
      expression={expression}
      themeHex={palette?.primary || "#38bdf8"}
      isRealtimeConnected={isRealtimeConnected}
      gaze={{ x: (gazeOffset.x || 0) / 8, y: (gazeOffset.y || 0) / 8 }}
      audioVolume={audioVolume}
      size={56}
    />
  );
};
