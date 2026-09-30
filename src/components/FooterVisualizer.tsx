import React from "react";
import { MahrAssistantDock, MahrAssistantDockProps } from "./assistant/dock/MahrAssistantDock";

export interface FooterVisualizerProps extends MahrAssistantDockProps {}

export const FooterVisualizer: React.FC<FooterVisualizerProps> = (props) => {
  return <MahrAssistantDock {...props} />;
};

export default FooterVisualizer;
