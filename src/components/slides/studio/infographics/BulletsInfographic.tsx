import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Layers, Sparkles, Check } from "lucide-react";
import { SlideTheme } from "../../../../services/slides/slideTypes";

interface BulletsInfographicProps {
  bullets: string[];
  callout?: string;
  theme: SlideTheme;
}

export const BulletsInfographic: React.FC<BulletsInfographicProps> = ({
  bullets,
  callout,
  theme
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".bullet-card",
        { opacity: 0, x: -14 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [bullets]);

  return (
    <div ref={containerRef} className="my-2 space-y-2">
      {bullets.map((rawBullet, idx) => {
        const bullet = typeof rawBullet === "string"
          ? rawBullet
          : (rawBullet as any)?.text || (rawBullet as any)?.description || (rawBullet as any)?.point || (rawBullet as any)?.title || String(rawBullet || "");
        let label = (rawBullet as any)?.title || "";
        let body = bullet;

        if (typeof bullet === "string" && bullet.includes(":")) {
          const parts = bullet.split(":");
          label = parts[0].trim();
          body = parts.slice(1).join(":").trim();
        }

        return (
          <div
            key={idx}
            className="bullet-card p-3 rounded-xl border backdrop-blur-md flex items-start gap-2.5 transition-all duration-200 hover:translate-x-1"
            style={{
              background: theme.cardBg || "rgba(255,255,255,0.04)",
              borderColor: theme.borderCol || "rgba(255,255,255,0.12)"
            }}
          >
            <div
              className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: `${theme.accentCol || "#f59e0b"}20`,
                color: theme.accentCol || "#f59e0b"
              }}
            >
              <Check size={12} />
            </div>

            <div className="flex-1">
              {label ? (
                <>
                  <span
                    className="text-xs font-bold mr-1.5"
                    style={{ color: theme.accentCol || "#f59e0b" }}
                  >
                    {label}:
                  </span>
                  <span
                    className="text-xs leading-relaxed"
                    style={{ color: theme.textPrimary || "#f1f5f9" }}
                  >
                    {body}
                  </span>
                </>
              ) : (
                <span
                  className="text-xs leading-relaxed"
                  style={{ color: theme.textPrimary || "#f1f5f9" }}
                >
                  {bullet}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {callout && (
        <div
          className="mt-3 p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 backdrop-blur-md text-xs font-medium"
          style={{
            background: `${theme.accentCol || "#f59e0b"}10`,
            borderColor: `${theme.accentCol || "#f59e0b"}35`,
            color: theme.accentCol || "#f59e0b"
          }}
        >
          <Sparkles size={13} className="shrink-0" />
          <span className="truncate">{callout}</span>
        </div>
      )}
    </div>
  );
};
