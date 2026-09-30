import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Clock, ArrowRight, Flag, Calendar, CheckCircle2 } from "lucide-react";
import { SlideTheme } from "../../../../services/slides/slideTypes";

interface TimelineInfographicProps {
  bullets: string[];
  theme: SlideTheme;
}

export const TimelineInfographic: React.FC<TimelineInfographicProps> = ({ bullets, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".timeline-step",
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [bullets]);

  const steps = bullets.map((rawItem, idx) => {
    const item = typeof rawItem === "string"
      ? rawItem
      : (rawItem as any)?.text || (rawItem as any)?.description || (rawItem as any)?.phase || (rawItem as any)?.title || String(rawItem || "");
    let phase = (rawItem as any)?.phase || (rawItem as any)?.title || `Phase ${idx + 1}`;
    let description = item;

    if (typeof item === "string" && item.includes(":")) {
      const parts = item.split(":");
      phase = parts[0].trim();
      description = parts.slice(1).join(":").trim();
    } else if (typeof item === "string" && item.includes(" — ")) {
      const parts = item.split(" — ");
      phase = parts[0].trim();
      description = parts.slice(1).join(" — ").trim();
    }

    return { phase, description, stepNumber: idx + 1 };
  });

  return (
    <div ref={containerRef} className="my-2 space-y-2.5">
      {/* Phased Roadmap Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="timeline-step p-3 rounded-xl border backdrop-blur-md flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-md"
            style={{
              background: theme.cardBg || "rgba(255,255,255,0.04)",
              borderColor: theme.borderCol || "rgba(255,255,255,0.12)",
              boxShadow: `0 6px 20px -5px ${theme.accentGlow || "rgba(0,0,0,0.4)"}`
            }}
          >
            <div>
              {/* Step indicator header */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[9px] sm:text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border"
                  style={{
                    color: theme.accentCol || "#f59e0b",
                    borderColor: `${theme.accentCol || "#f59e0b"}40`,
                    background: `${theme.accentCol || "#f59e0b"}15`
                  }}
                >
                  Step 0{step.stepNumber}
                </span>

                <Calendar size={12} className="text-zinc-400" />
              </div>

              {/* Phase name */}
              <div
                className="text-xs font-bold mb-1.5 line-clamp-1"
                style={{ color: theme.textPrimary || "#ffffff" }}
              >
                {step.phase}
              </div>

              {/* Action item description */}
              <p
                className="text-[11px] leading-relaxed text-zinc-300 font-light line-clamp-3"
                style={{ color: theme.textSecondary || "#94a3b8" }}
              >
                {step.description}
              </p>
            </div>

            {/* Bottom Progress Bar indicator */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={10} style={{ color: theme.accentCol || "#f59e0b" }} />
                <span>Milestone</span>
              </span>
              <span>{Math.round(((idx + 1) / steps.length) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
