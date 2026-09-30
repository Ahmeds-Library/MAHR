import React from "react";
import { SvgMeshGradientConfig } from "@/services/humanEmotionEngine";

interface OrganicMeshLayerProps {
  config: SvgMeshGradientConfig;
  idPrefix: string;
  opacity: number;
}

export const OrganicMeshLayer: React.FC<OrganicMeshLayerProps> = ({
  config,
  idPrefix,
  opacity,
}) => {
  return (
    <svg
      className="w-full h-full object-cover pointer-events-none transition-opacity duration-75"
      style={{ opacity }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft Organic Gaussian Blur Filter with Turbulence Displacement */}
        <filter id={`${idPrefix}-mesh-blur`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          {config.turbulence && (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency={config.turbulence.baseFrequency}
                numOctaves={config.turbulence.numOctaves}
                result="noise"
              />
              <feDisplacementMap in="blur" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
            </>
          )}
        </filter>

        {/* Dynamic Radial Gradient Color Stops */}
        {config.meshStops.map((stop, idx) => (
          <radialGradient
            key={idx}
            id={`${idPrefix}-grad-${idx}`}
            cx={stop.cx}
            cy={stop.cy}
            r={stop.r}
            fx={stop.cx}
            fy={stop.cy}
          >
            <stop offset="0%" stopColor={stop.color} stopOpacity={stop.opacity} />
            <stop offset="55%" stopColor={stop.color} stopOpacity={stop.opacity * 0.45} />
            <stop offset="100%" stopColor={stop.color} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>

      {/* Mesh Nodes Group with filter and blend-mode */}
      <g filter={`url(#${idPrefix}-mesh-blur)`} style={{ mixBlendMode: config.blendMode }}>
        {config.meshStops.map((stop, idx) => (
          <rect
            key={idx}
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${idPrefix}-grad-${idx})`}
          />
        ))}
      </g>
    </svg>
  );
};
