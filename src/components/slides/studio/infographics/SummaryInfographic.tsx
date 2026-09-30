import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { CheckCircle2, DollarSign, Sparkles, Target, ArrowUpRight } from "lucide-react";
import { SlideTheme } from "../../../../services/slides/slideTypes";

interface SummaryInfographicProps {
  bullets: string[];
  callout?: string;
  theme: SlideTheme;
}

export const SummaryInfographic: React.FC<SummaryInfographicProps> = ({
  bullets,
  callout,
  theme
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".summary-item",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [bullets]);

  return (
    <div ref={containerRef} className="my-2 space-y-3">
      {/* Top Strategic Callout Box */}
      {callout && (
        <div
          className="p-3 sm:p-3.5 rounded-xl border flex items-center gap-2.5 backdrop-blur-md shadow-md"
          style={{
            background: `${theme.accentCol || "#f59e0b"}15`,
            borderColor: `${theme.accentCol || "#f59e0b"}40`,
            color: theme.accentCol || "#f59e0b"
          }}
        >
          <Sparkles size={16} className="shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide leading-snug">
            {callout}
          </span>
        </div>
      )}

      {/* Grid of Key Outcomes / Action Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {bullets.map((rawBullet, idx) => {
          const bullet = typeof rawBullet === "string"
            ? rawBullet
            : (rawBullet as any)?.text || (rawBullet as any)?.description || (rawBullet as any)?.point || (rawBullet as any)?.title || String(rawBullet || "");
          let title = (rawBullet as any)?.title || `Strategic Milestone ${idx + 1}`;
          let desc = bullet;

          if (typeof bullet === "string" && bullet.includes(":")) {
            const parts = bullet.split(":");
            title = parts[0].trim();
            desc = parts.slice(1).join(":").trim();
          }

          return (
            <div
              key={idx}
              className="summary-item p-3 rounded-xl border backdrop-blur-md flex items-start gap-2.5 transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                background: theme.cardBg || "rgba(255,255,255,0.04)",
                borderColor: theme.borderCol || "rgba(255,255,255,0.12)"
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: `${theme.accentCol || "#f59e0b"}25`,
                  color: theme.accentCol || "#f59e0b"
                }}
              >
                <CheckCircle2 size={13} />
              </div>

              <div>
                <div
                  className="text-xs font-bold leading-tight mb-1"
                  style={{ color: theme.textPrimary || "#ffffff" }}
                >
                  {title}
                </div>
                <p
                  className="text-[11px] leading-relaxed text-zinc-300 font-light"
                  style={{ color: theme.textSecondary || "#94a3b8" }}
                >
                  {desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
