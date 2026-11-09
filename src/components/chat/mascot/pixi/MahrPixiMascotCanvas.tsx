import React from "react";
import { EyeExpression, MascotActivity } from "../useMascotPlayEngine";
import { MahrSphericalDroneMascot } from "../vector/MahrSphericalDroneMascot";
import { DronePoseAngle } from "../vector/droneVectorTypes";

export interface MahrPixiMascotCanvasProps {
  expression: EyeExpression;
  themeHex: string;
  activity: MascotActivity;
  isHovered: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isRealtimeConnected?: boolean;
  gaze: { x: number; y: number };
  audioFrequencies?: number[];
  audioVolume?: number;
  className?: string;
  size?: number;
  forcePose?: DronePoseAngle;
}

/**
 * Layer 3: Presentation Component for the Spherical Hover-Drone Companion
 * Replaces the legacy PixiJS rectangle/antenna mascot with the pure-vector
 * multi-angle spherical hover-drone rig converted from the character sheet.
 */
export const MahrPixiMascotCanvas: React.FC<MahrPixiMascotCanvasProps> = ({
  expression,
  themeHex,
  activity,
  isHovered,
  isSpeaking,
  isThinking,
  isRealtimeConnected = false,
  gaze,
  audioFrequencies = [],
  audioVolume = 0,
  className = "",
  size = 88,
  forcePose,
}) => {
  return (
    <MahrSphericalDroneMascot
      expression={expression}
      themeHex={themeHex}
      activity={activity}
      isHovered={isHovered}
      isSpeaking={isSpeaking}
      isThinking={isThinking}
      isRealtimeConnected={isRealtimeConnected}
      gaze={gaze}
      audioFrequencies={audioFrequencies}
      audioVolume={audioVolume}
      className={className}
      size={size}
      forcePose={forcePose}
    />
  );
};
