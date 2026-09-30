import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Layers, CheckCircle2, ShieldCheck, Zap, Compass } from "lucide-react";
import { SlideTheme } from "../../../../services/slides/slideTypes";

interface ColumnsInfographicProps {
  bullets: string[];
  theme: SlideTheme;
}

export const ColumnsInfographic: React.FC<ColumnsInfographicProps> = ({ bullets, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pillar-column",
        { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [bullets]);

  // Parse items into title and description if separated by ":" or " - "
  const parsedItems = bullets.map((rawBullet, idx) => {
    const bullet = typeof rawBullet === "string"
      ? rawBullet
      : (rawBullet as any)?.text || (rawBullet as any)?.description || (rawBullet as any)?.point || (rawBullet as any)?.title || String(rawBullet || "");
    let title = (rawBullet as any)?.title || `Pillar ${idx + 1}`;
    let desc = bullet;

    if (typeof bullet === "string" && bullet.includes(":")) {
      const parts = bullet.split(":");
      title = parts[0].trim();
      desc = parts.slice(1).join(":").trim();
    } else if (typeof bullet === "string" && bullet.includes(" - ")) {
      const parts = bullet.split(" - ");
      title = parts[0].trim();
      desc = parts.slice(1).join(" - ").trim();
    }

    return { title, desc, index: idx + 1 };
  });

  return (
    <div
      ref={containerRef}
      className={`grid gap-3 my-2 ${
        parsedItems.length <= 2
          ? "grid-cols-1 sm:grid-cols-2"
          : parsedItems.length === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
      }`}
    >
      {parsedItems.map((item, idx) => (
        <div
          key={idx}
          className="pillar-column p-3.5 sm:p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 shadow-lg"
          style={{
            background: theme.cardBg || "rgba(255,255,255,0.04)",
            borderColor: theme.borderCol || "rgba(255,255,255,0.12)",
            boxShadow: `0 8px 24px -6px ${theme.accentGlow || "rgba(0,0,0,0.4)"}`
          }}
        >
          {/* Pillar Index & Top Accent */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border"
                style={{
                  color: theme.accentCol || "#f59e0b",
                  borderColor: `${theme.accentCol || "#f59e0b"}40`,
                  background: `${theme.accentCol || "#f59e0b"}15`
                }}
              >
                0{item.index} // ARCHITECTURE
              </span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: theme.accentCol || "#f59e0b" }}
              />
            </div>

            <h3
              className="text-xs sm:text-sm font-bold tracking-tight mb-2"
              style={{ color: theme.textPrimary || "#ffffff" }}
            >
              {item.title}
            </h3>

            <p
              className="text-[11px] sm:text-xs leading-relaxed text-zinc-300 font-light"
              style={{ color: theme.textSecondary || "#94a3b8" }}
            >
              {item.desc}
            </p>
          </div>

          {/* Bottom Verification Badge */}
          <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} style={{ color: theme.accentCol || "#f59e0b" }} />
              <span>Grounded Model</span>
            </span>
            <span className="opacity-70">Stage {item.index}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
