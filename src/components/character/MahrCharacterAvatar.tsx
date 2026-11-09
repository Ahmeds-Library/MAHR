import React from "react";
import { HumanMoodType } from "@/services/humanEmotionEngine";
import { MahrEmotion } from "../MahrCoreVisualizer";
import { AssistantStatusIndicator } from "./AssistantStatusIndicator";
import { HolographicProjectionStage } from "./projection/HolographicProjectionStage";
import { useHolographicGsapMotion } from "@/hooks/character/useHolographicGsapMotion";

interface MahrCharacterAvatarProps {
  characterState: "idle" | "thinking" | "talking";
  themeColor?: string;
  activeEmotion?: MahrEmotion;
  currentHumanMood?: HumanMoodType;
  pulseScale?: number;
  isResponding?: boolean;
  onCharacterClick?: () => void;
}

/**
 * 3-Layer Orchestrated Presentation Component:
 * Full-Screen Unmasked Mahr Character Avatar.
 * 
 * Completely removes circular mask, circular light rings, and card frames:
 * - Clean unmasked video presentation
 * - Expansive presence directly on pitch-black OLED background
 * - Seamless GSAP breathing and state transition physics
 */
export const MahrCharacterAvatar: React.FC<MahrCharacterAvatarProps> = ({
  characterState,
  themeColor = "celestial",
  activeEmotion = "idle",
  pulseScale = 1.0,
  isResponding = false,
  onCharacterClick,
}) => {
  // GSAP Levitation & Excitation Physics
  const { containerRef } = useHolographicGsapMotion({
    characterState,
    pulseScale,
    isResponding,
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center select-none cursor-pointer group transition-transform will-change-transform"
      onClick={onCharacterClick}
    >
      {/* 1. 9:16 Portrait Projection Stage */}
      <div className="relative w-full h-full flex items-center justify-center">
        <HolographicProjectionStage
          characterState={characterState}
          themeColor={themeColor}
        />
      </div>

      {/* 2. Sleek Minimal Status Badge (Active during reasoning/speaking) */}
      {characterState !== "idle" && (
        <div className="absolute bottom-28 sm:bottom-32 md:bottom-36 lg:bottom-40 z-30 pointer-events-none transition-all duration-300">
          <AssistantStatusIndicator
            characterState={characterState}
            activeEmotion={activeEmotion}
            chipClass="border-white/10 text-slate-300 bg-black/70 backdrop-blur-md"
          />
        </div>
      )}
    </div>
  );
};

export default MahrCharacterAvatar;
