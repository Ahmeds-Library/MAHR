import React from "react";
import { MahrMinimalFloatingMic, MahrMinimalFloatingMicProps } from "./assistant/dock/MahrMinimalFloatingMic";

export interface FooterVisualizerProps extends MahrMinimalFloatingMicProps {}

export const FooterVisualizer: React.FC<FooterVisualizerProps> = (props) => {
  return <MahrMinimalFloatingMic {...props} />;
};

export default FooterVisualizer;

