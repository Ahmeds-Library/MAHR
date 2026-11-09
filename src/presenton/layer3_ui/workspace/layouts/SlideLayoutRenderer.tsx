/**
 * Layer 3 UI — Modular Presenton Slide Layout Renderer
 * Renders all 8 structured Presenton layouts with GSAP entrance choreography and direct inline editing.
 */

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Quote, Sparkles, TrendingUp, CheckCircle2, Layers } from "lucide-react";
import { PresentonSlide, PresentonTheme } from "../../../layer1_data/presentonTypes";
import { PresentonDataChart } from "../charts/PresentonDataChart";

interface SlideLayoutRendererProps {
  slide: PresentonSlide;
  theme: PresentonTheme;
  totalSlides: number;
  readOnly?: boolean;
  onUpdateSlide?: (partial: Partial<PresentonSlide>) => void;
}

export const SlideLayoutRenderer: React.FC<SlideLayoutRendererProps> = ({
  slide,
  theme,
  totalSlides,
  readOnly = false,
  onUpdateSlide
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!stageRef.current) return;
    const items = stageRef.current.querySelectorAll(".presenton-anim-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.42, stagger: 0.06, ease: "power2.out" }
    );
  }, [slide.id, slide.layout]);

  const handleBulletEdit = (idx: number, text: string) => {
    if (!onUpdateSlide) return;
    const next = [...slide.bullets];
    next[idx] = text;
    onUpdateSlide({ bullets: next });
  };

  const handleMetricEdit = (idx: number, field: "label" | "value" | "delta" | "description", val: string) => {
    if (!onUpdateSlide) return;
    const next = slide.metrics.map((m, i) => (i === idx ? { ...m, [field]: val } : m));
    onUpdateSlide({ metrics: next });
  };

  return (
    <div
      ref={stageRef}
      className="w-full h-full rounded-2xl p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden select-text shadow-2xl border transition-all"
      style={{
        background: theme.slideSurface,
        borderColor: theme.cardBorder,
        color: theme.textPrimary,
        fontFamily: theme.fontBody
      }}
    >
      {/* Subtle Ambient Accent Glow */}
      <div
        className="pointer-events-none absolute -top-28 -right-28 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{ background: theme.accentHex }}
      />

      {/* Top Slide Header: Category Badge & Page Counter */}
      <div className="presenton-anim-item flex items-center justify-between gap-4 z-10">
        <span
          className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ background: theme.badgeBg, color: theme.badgeText }}
        >
          {slide.categoryTag || `SLIDE 0${slide.slideNumber}`}
        </span>
        <span
          className="text-xs font-mono font-semibold"
          style={{ color: theme.textMuted }}
        >
          {String(slide.slideNumber).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
        </span>
      </div>

      {/* Title & Subtitle Block */}
      <div className="presenton-anim-item my-3 z-10">
        {readOnly ? (
          <h1
            className={`font-extrabold tracking-tight leading-tight ${
              slide.layout === "hero-cover" ? "text-2xl sm:text-4xl lg:text-5xl" : "text-xl sm:text-3xl"
            }`}
            style={{ color: theme.textPrimary, fontFamily: theme.fontHeading }}
          >
            {slide.title}
          </h1>
        ) : (
          <input
            type="text"
            value={slide.title}
            onChange={(e) => onUpdateSlide?.({ title: e.target.value })}
            className={`w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-400 focus:outline-none font-extrabold tracking-tight leading-tight ${
              slide.layout === "hero-cover" ? "text-2xl sm:text-4xl lg:text-5xl" : "text-xl sm:text-3xl"
            }`}
            style={{ color: theme.textPrimary, fontFamily: theme.fontHeading }}
          />
        )}

        {readOnly ? (
          <p
            className="text-xs sm:text-base mt-1.5 max-w-4xl"
            style={{ color: theme.textSecondary }}
          >
            {slide.subtitle}
          </p>
        ) : (
          <input
            type="text"
            value={slide.subtitle}
            onChange={(e) => onUpdateSlide?.({ subtitle: e.target.value })}
            className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-400 focus:outline-none text-xs sm:text-base mt-1.5"
            style={{ color: theme.textSecondary }}
          />
        )}
      </div>

      {/* Main Dynamic Body by Layout */}
      <div className="presenton-anim-item flex-1 my-2 z-10 flex flex-col justify-center min-h-0">
        {/* 1. HERO COVER LAYOUT */}
        {slide.layout === "hero-cover" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div
              className="lg:col-span-7 rounded-2xl p-5 border space-y-3"
              style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: theme.accentHex }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Briefing Highlights</span>
              </div>
              {slide.bullets.slice(0, 3).map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: theme.accentHex }}
                  />
                  {readOnly ? (
                    <span className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                      {b}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => handleBulletEdit(i, e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm focus:outline-none border-b border-transparent focus:border-indigo-400"
                      style={{ color: theme.textSecondary }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {slide.metrics.slice(0, 2).map((m, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 border"
                  style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.accentHex }}>
                    {m.label}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black mt-0.5" style={{ color: theme.textPrimary }}>
                    {m.value}
                  </div>
                  <div className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                    {m.description || m.delta}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. SPLIT VISUAL / NARRATIVE LAYOUT */}
        {slide.layout === "split-visual" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div
              className="lg:col-span-7 rounded-2xl p-5 border flex flex-col justify-center space-y-3.5"
              style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
            >
              {slide.bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: theme.badgeBg, color: theme.badgeText }}
                  >
                    0{i + 1}
                  </span>
                  {readOnly ? (
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                      {b}
                    </p>
                  ) : (
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => handleBulletEdit(i, e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm focus:outline-none border-b border-transparent focus:border-indigo-400"
                      style={{ color: theme.textSecondary }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div
              className="lg:col-span-5 rounded-2xl p-5 border flex flex-col justify-between"
              style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
            >
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                  style={{ color: theme.accentHex }}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Key Domain Synthesis</span>
                </div>
                <p
                  className="text-sm sm:text-base font-semibold leading-relaxed"
                  style={{ color: theme.textPrimary }}
                >
                  “{slide.quote?.text || slide.callout || slide.bullets[0]}”
                </p>
              </div>

              {slide.metrics[0] && (
                <div
                  className="mt-4 pt-3 border-t flex items-center justify-between"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <div>
                    <div className="text-[11px] uppercase font-bold" style={{ color: theme.textMuted }}>
                      {slide.metrics[0].label}
                    </div>
                    <div className="text-xl font-black" style={{ color: theme.accentHex }}>
                      {slide.metrics[0].value}
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: theme.badgeBg, color: theme.badgeText }}
                  >
                    {slide.metrics[0].delta}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. KPI METRICS SCORECARDS LAYOUT */}
        {slide.layout === "kpi-metrics" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {slide.metrics.slice(0, 3).map((m, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-5 border flex flex-col justify-between"
                style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
              >
                <div>
                  {readOnly ? (
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accentHex }}>
                      {m.label}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={m.label}
                      onChange={(e) => handleMetricEdit(idx, "label", e.target.value)}
                      className="w-full bg-transparent text-xs font-bold uppercase tracking-wider focus:outline-none"
                      style={{ color: theme.accentHex }}
                    />
                  )}

                  {readOnly ? (
                    <div className="text-3xl sm:text-4xl font-black my-2" style={{ color: theme.textPrimary }}>
                      {m.value}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={m.value}
                      onChange={(e) => handleMetricEdit(idx, "value", e.target.value)}
                      className="w-full bg-transparent text-3xl sm:text-4xl font-black my-2 focus:outline-none"
                      style={{ color: theme.textPrimary }}
                    />
                  )}
                </div>

                <div>
                  <span
                    className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md mb-2"
                    style={{ background: theme.badgeBg, color: theme.badgeText }}
                  >
                    {m.delta || "Verified Benchmark"}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
                    {m.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. DATA CHART LAYOUT */}
        {slide.layout === "data-chart" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7">
              <PresentonDataChart
                chartData={slide.chartData}
                theme={theme}
                onChangeChartType={
                  readOnly
                    ? undefined
                    : (chartType) =>
                        onUpdateSlide?.({
                          chartData: { ...slide.chartData, chartType }
                        })
                }
              />
            </div>
            <div
              className="lg:col-span-5 rounded-2xl p-5 border flex flex-col justify-center space-y-3"
              style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
            >
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accentHex }}>
                Analytical Takeaways
              </div>
              {slide.bullets.slice(0, 3).map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: theme.accentHex }}
                  />
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                    {b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. COMPARISON GRID LAYOUT */}
        {slide.layout === "comparison-grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {slide.comparisonColumns.slice(0, 2).map((col, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-5 border flex flex-col justify-between"
                style={{
                  background: theme.cardSurface,
                  borderColor: idx === 1 ? theme.accentHex : theme.cardBorder
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-base sm:text-lg font-extrabold" style={{ color: theme.textPrimary }}>
                      {col.heading}
                    </h3>
                    {col.badge && (
                      <span
                        className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full"
                        style={{ background: theme.badgeBg, color: theme.badgeText }}
                      >
                        {col.badge}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5">
                    {col.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm" style={{ color: theme.textSecondary }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: theme.accentHex }} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. PROCESS TIMELINE LAYOUT */}
        {slide.layout === "process-timeline" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slide.timelineSteps.slice(0, 4).map((step, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-4 border relative flex flex-col justify-between"
                style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
              >
                <div>
                  <span
                    className="inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded mb-2"
                    style={{ background: theme.badgeBg, color: theme.badgeText }}
                  >
                    {step.phase}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold mb-1.5" style={{ color: theme.textPrimary }}>
                    {step.title}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 7. ARCHITECTURE PILLARS LAYOUT */}
        {slide.layout === "architecture-pillars" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {slide.pillars.slice(0, 3).map((pillar, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-5 border flex flex-col justify-between"
                style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center"
                      style={{ background: theme.badgeBg, color: theme.badgeText }}
                    >
                      {pillar.tag || `0${idx + 1}`}
                    </span>
                    <Layers className="w-4 h-4 opacity-50" style={{ color: theme.accentHex }} />
                  </div>
                  <h4 className="text-base font-extrabold mb-2" style={{ color: theme.textPrimary }}>
                    {pillar.title}
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 8. QUOTE / EXECUTIVE SYNTHESIS SPOTLIGHT LAYOUT */}
        {slide.layout === "quote-spotlight" && (
          <div
            className="rounded-2xl p-6 sm:p-8 border flex flex-col justify-center items-start space-y-4"
            style={{ background: theme.cardSurface, borderColor: theme.cardBorder }}
          >
            <Quote className="w-8 h-8" style={{ color: theme.accentHex }} />
            <blockquote
              className="text-lg sm:text-2xl font-bold leading-relaxed"
              style={{ color: theme.textPrimary, fontFamily: theme.fontHeading }}
            >
              “{slide.quote?.text || slide.bullets[0]}”
            </blockquote>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-0.5 rounded" style={{ background: theme.accentHex }} />
              <div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: theme.textPrimary }}>
                  {slide.quote?.author || "Executive Research Synthesis"}
                </div>
                {slide.quote?.role && (
                  <div className="text-[11px]" style={{ color: theme.textMuted }}>
                    {slide.quote.role}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Executive Takeaway Banner */}
      {slide.callout && (
        <div
          className="presenton-anim-item mt-3 px-4 py-2.5 rounded-xl border flex items-center gap-2.5 z-10"
          style={{
            background: theme.badgeBg,
            borderColor: theme.cardBorder,
            color: theme.badgeText
          }}
        >
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: theme.accentHex }} />
          {readOnly ? (
            <span className="text-xs font-semibold truncate">{slide.callout}</span>
          ) : (
            <input
              type="text"
              value={slide.callout}
              onChange={(e) => onUpdateSlide?.({ callout: e.target.value })}
              className="w-full bg-transparent text-xs font-semibold focus:outline-none"
              style={{ color: theme.badgeText }}
            />
          )}
        </div>
      )}
    </div>
  );
};
