import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { TrendingUp, ArrowUpRight, BarChart3, Activity } from "lucide-react";
import { SlideStat, SlideTheme } from "../../../../services/slides/slideTypes";

interface StatsInfographicProps {
  stats: SlideStat[];
  theme: SlideTheme;
}

export const StatsInfographic: React.FC<StatsInfographicProps> = ({ stats, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stat-card",
        { opacity: 0, y: 16, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [stats]);

  return (
    <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 my-2">
      {stats.map((stat, idx) => {
        const valStr = String(stat.value ?? "");
        const isPositive = valStr.includes("+") || !valStr.includes("-");
        return (
          <div
            key={idx}
            className="stat-card p-3.5 sm:p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 shadow-lg"
            style={{
              background: theme.cardBg || "rgba(255,255,255,0.04)",
              borderColor: theme.borderCol || "rgba(255,255,255,0.12)",
              boxShadow: `0 8px 24px -6px ${theme.accentGlow || "rgba(0,0,0,0.4)"}`
            }}
          >
            {/* Header label and icon */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold truncate max-w-[150px]">
                {stat.label}
              </span>
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center border"
                style={{
                  borderColor: `${theme.accentCol || "#f59e0b"}40`,
                  background: `${theme.accentCol || "#f59e0b"}15`,
                  color: theme.accentCol || "#f59e0b"
                }}
              >
                {isPositive ? <TrendingUp size={13} /> : <Activity size={13} />}
              </div>
            </div>

            {/* Large KPI Value */}
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span
                className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight"
                style={{ color: theme.accentCol || "#f59e0b" }}
              >
                {stat.value}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {idx === 0 ? "Benchmark" : idx === 1 ? "Target" : "Velocity"}
              </span>
            </div>

            {/* Contextual description */}
            {stat.description && (
              <p
                className="text-[11px] sm:text-xs leading-relaxed text-zinc-300 font-light mt-1 mb-2 line-clamp-2"
                style={{ color: theme.textSecondary || "#94a3b8" }}
              >
                {stat.description}
              </p>
            )}

            {/* Mini Progress / Comparison Infographic Gauge Bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-auto">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: idx === 0 ? "88%" : idx === 1 ? "74%" : "96%",
                  background: `linear-gradient(90deg, ${theme.accentCol || "#f59e0b"}, ${theme.accentCol || "#f59e0b"}aa)`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
