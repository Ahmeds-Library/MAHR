"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

export interface MenuOption {
  name: string;
  tag?: string;
}

interface FlowchartMenuProps {
  options: (string | MenuOption)[];
  value: string;
  onSelect: (val: string) => void;
  onClose: () => void;
  className?: string;
  align?: "left" | "right" | "center";
}

export function FlowchartMenu({
  options,
  value,
  onSelect,
  onClose,
  className = "",
  align = "left",
}: FlowchartMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener("pointerdown", handleClickOutside);
    return () => window.removeEventListener("pointerdown", handleClickOutside);
  }, [onClose]);

  const normalizedOptions: MenuOption[] = options.map((opt) =>
    typeof opt === "string" ? { name: opt } : opt
  );

  return (
    <div
      ref={menuRef}
      className={`absolute top-full mt-1.5 z-50 min-w-[200px] max-w-[280px] p-1.5 rounded-xl bg-[#0c0c17] border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-pop-in select-none text-xs font-sans ${
        align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
      } ${className}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-0.5 relative">
        {normalizedOptions.map((opt, idx) => {
          const isSelected = opt.name.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={opt.name}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                onSelect(opt.name);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between gap-2 transition-all cursor-pointer relative z-10 ${
                isSelected
                  ? "text-purple-300 font-semibold bg-purple-500/15 border border-purple-500/30"
                  : hoveredIdx === idx
                  ? "text-white bg-white/10"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{opt.name}</span>
                {opt.tag && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                    {opt.tag}
                  </span>
                )}
              </div>
              {isSelected && <Check size={13} className="text-purple-400 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
