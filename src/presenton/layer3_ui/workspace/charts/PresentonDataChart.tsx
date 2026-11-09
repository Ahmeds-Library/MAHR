/**
 * Layer 3 UI — Interactive SVG Data Chart Renderer (Bar, Area, Donut)
 * Powered by GSAP animations and inline chart type switching.
 */

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { PresentonChartData, PresentonTheme } from "../../../layer1_data/presentonTypes";

interface PresentonDataChartProps {
  chartData: PresentonChartData;
  theme: PresentonTheme;
  onChangeChartType?: (type: "bar" | "area" | "donut") => void;
}

export const PresentonDataChart: React.FC<PresentonDataChartProps> = ({
  chartData,
  theme,
  onChangeChartType
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const series = chartData.series && chartData.series.length > 0
    ? chartData.series
    : [
        { label: "Q1", value: 42 },
        { label: "Q2", value: 65 },
        { label: "Q3", value: 81 },
        { label: "Q4", value: 94 }
      ];

  const maxValue = Math.max(...series.map((s) => Number(s.value) || 0), 100);

  useEffect(() => {
    if (!containerRef.current) return;
    const bars = containerRef.current.querySelectorAll(".presenton-chart-anim");
    gsap.fromTo(
      bars,
      { opacity: 0, scaleY: 0.2, transformOrigin: "bottom" },
      { opacity: 1, scaleY: 1, duration: 0.55, stagger: 0.08, ease: "power3.out" }
    );
  }, [chartData.chartType, series.length]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl p-4 sm:p-5 border flex flex-col justify-between"
      style={{
        background: theme.cardSurface,
        borderColor: theme.cardBorder
      }}
    >
      {/* Header + Chart Type Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <div
            className="text-xs sm:text-sm font-bold"
            style={{ color: theme.textPrimary }}
          >
            {chartData.title}
          </div>
          {chartData.unit && (
            <div className="text-[11px]" style={{ color: theme.textMuted }}>
              Unit: {chartData.unit}
            </div>
          )}
        </div>

        {onChangeChartType && (
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
            {(["bar", "area", "donut"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChangeChartType(t)}
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: chartData.chartType === t ? theme.accentHex : "transparent",
                  color: chartData.chartType === t ? "#FFFFFF" : theme.textSecondary
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BAR CHART */}
      {chartData.chartType === "bar" && (
        <div className="flex-1 flex items-end justify-around gap-3 pt-4 pb-2 min-h-[160px]">
          {series.map((pt, idx) => {
            const pct = Math.max(12, Math.min(100, Math.round((pt.value / maxValue) * 100)));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                <div
                  className="text-xs font-extrabold mb-1.5"
                  style={{ color: theme.textPrimary }}
                >
                  {pt.value}
                </div>
                <div className="w-full max-w-[54px] bg-black/15 rounded-t-xl h-32 flex items-end overflow-hidden">
                  <div
                    className="presenton-chart-anim w-full rounded-t-xl"
                    style={{
                      height: `${pct}%`,
                      background: `linear-gradient(180deg, ${theme.accentHex} 0%, ${theme.accentSecondaryHex} 100%)`
                    }}
                  />
                </div>
                <div
                  className="text-[11px] font-semibold mt-2 text-center truncate w-full"
                  style={{ color: theme.textSecondary }}
                >
                  {pt.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AREA / TREND SVG CHART */}
      {chartData.chartType === "area" && (
        <div className="flex-1 flex flex-col justify-center min-h-[160px]">
          <svg viewBox="0 0 400 150" className="w-full h-36 overflow-visible">
            <defs>
              <linearGradient id="presentonAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accentHex} stopOpacity="0.55" />
                <stop offset="100%" stopColor={theme.accentHex} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {(() => {
              const coords = series.map((pt, idx) => {
                const x =
                  series.length === 1
                    ? 200
                    : 24 + (idx / (series.length - 1)) * 352;
                const y = 130 - (Math.min(pt.value, maxValue) / maxValue) * 105;
                return { x, y, pt };
              });
              const linePath = coords
                .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
                .join(" ");
              const areaPath = `${linePath} L ${coords[coords.length - 1].x} 135 L ${coords[0].x} 135 Z`;

              return (
                <>
                  <path d={areaPath} fill="url(#presentonAreaGrad)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={theme.accentHex}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {coords.map((c, idx) => (
                    <g key={idx}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r="5"
                        fill={theme.accentSecondaryHex}
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={c.x}
                        y={c.y - 10}
                        textAnchor="middle"
                        fill={theme.textPrimary}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {c.pt.value}
                      </text>
                      <text
                        x={c.x}
                        y={146}
                        textAnchor="middle"
                        fill={theme.textSecondary}
                        fontSize="10"
                      >
                        {c.pt.label.slice(0, 12)}
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {/* DONUT DISTRIBUTION CHART */}
      {chartData.chartType === "donut" && (
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4 min-h-[160px]">
          {(() => {
            const total = series.reduce((acc, s) => acc + (Number(s.value) || 1), 0) || 1;
            const palette = [
              theme.accentHex,
              theme.accentSecondaryHex,
              "#10B981",
              "#F59E0B",
              "#EC4899"
            ];
            let cumulative = 0;
            const radius = 46;
            const circumference = 2 * Math.PI * radius;

            return (
              <>
                <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0 -rotate-90">
                  {series.map((pt, idx) => {
                    const frac = (Number(pt.value) || 1) / total;
                    const strokeDasharray = `${frac * circumference} ${circumference}`;
                    const strokeDashoffset = -cumulative * circumference;
                    cumulative += frac;
                    return (
                      <circle
                        key={idx}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke={palette[idx % palette.length]}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  })}
                </svg>

                <div className="space-y-1.5 flex-1">
                  {series.map((pt, idx) => {
                    const pct = Math.round(((Number(pt.value) || 1) / total) * 100);
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: palette[idx % palette.length] }}
                          />
                          <span className="truncate" style={{ color: theme.textSecondary }}>
                            {pt.label}
                          </span>
                        </div>
                        <span className="font-bold" style={{ color: theme.textPrimary }}>
                          {pt.value} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
