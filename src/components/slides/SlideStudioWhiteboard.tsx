/**
 * SlideStudioWhiteboard — Replaced with the 3-Layer Presenton AI Presentation Studio
 * Preserves the exact component signature so all existing Mahr voice commands,
 * navigation tabs, and workspace triggers launch the new Presenton Studio seamlessly.
 */

import React from "react";
import { PresentonStudioRoot } from "../../presenton/layer3_ui/PresentonStudioRoot";

export interface SlideStudioWhiteboardProps {
  onBackToSlate?: () => void;
  initialTopic?: string;
  onAskMahr?: (prompt: string) => void;
}

export const SlideStudioWhiteboard: React.FC<SlideStudioWhiteboardProps> = ({
  onBackToSlate,
  initialTopic,
  onAskMahr
}) => {
  return (
    <PresentonStudioRoot
      onBackToSlate={onBackToSlate}
      initialTopic={initialTopic}
      onAskMahr={onAskMahr}
    />
  );
};
