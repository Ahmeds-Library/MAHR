import React from "react";
import { EyeExpression, MascotActivity } from "../useMascotPlayEngine";
import { MahrSphericalDroneMascot } from "../vector/MahrSphericalDroneMascot";
import { DronePoseAngle } from "../vector/droneVectorTypes";

export interface MascotSvgVectorRigProps {
  expression: EyeExpression;
  themeHex: string;
  activity?: MascotActivity;
  isHovered?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  isRealtimeConnected?: boolean;
  gaze?: { x: number; y: number };
  audioFrequencies?: number[];
  audioVolume?: number;
  size?: number;
  className?: string;
  forcePose?: DronePoseAngle;
}

/**
 * Unified Vector Rig Adapter
 * Delegates directly to the multi-angle Spherical Hover-Drone Vector Companion.
 */
export const MascotSvgVectorRig: React.FC<MascotSvgVectorRigProps> = (props) => {
  return <MahrSphericalDroneMascot {...props} />;
};
