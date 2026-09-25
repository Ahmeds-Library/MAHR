import React from "react";
import {
  LayoutTemplate,
  List,
  Columns,
  BarChart3,
  Quote,
  Image as ImageIcon,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Slide, SlideLayout } from "../../../../services/slides/slideTypes";

interface TabLayoutProps {
  slide: Slide;
  onUpdateSlide: (partial: Partial<Slide>) => void;
}

interface LayoutItem {
  id: SlideLayout;
  name: string;
  desc: string;
  icon: React.FC<{ size: number; className?: string }>;
}

const LAYOUT_PRESETS: LayoutItem[] = [
  {
    id: "title",
    name: "Title Cover",
    desc: "Hero headline & presentation intro",
    icon: LayoutTemplate
  },
  {
    id: "bullets",
    name: "Key Takeaways",
    desc: "Structured bullet list with highlights",
    icon: List
  },
  {
    id: "columns",
    name: "Two Columns",
    desc: "Comparative analysis or dual concepts",
    icon: Columns
  },
  {
    id: "stats",
    name: "Metrics & Data",
    desc: "KPIs and quantitative benchmarks",
    icon: BarChart3
  },
  {
    id: "quote",
    name: "Callout / Quote",
    desc: "Impactful statement or testimonial",
    icon: Quote
  },
  {
    id: "media",
    name: "Visual Media",
    desc: "Hero visual imagery with captions",
    icon: ImageIcon
  },
  {
    id: "timeline",
    name: "Timeline Milestones",
    desc: "Chronological sequence & roadmap",
    icon: Calendar
  },
  {
    id: "summary",
    name: "Action Roadmap",
    desc: "Final conclusions & next steps",
    icon: CheckCircle2
  }
];

export const TabLayout: React.FC<TabLayoutProps> = ({ slide, onUpdateSlide }) => {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
        Select Structure Preset
      </div>

      <div className="grid grid-cols-2 gap-2">
        {LAYOUT_PRESETS.map((p) => {
          const isSelected = slide.layout === p.id;
          const IconComponent = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onUpdateSlide({ layout: p.id })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-22 ${
                isSelected
                  ? "bg-amber-500/15 border-amber-400/90 shadow-[0_0_12px_rgba(245,158,11,0.25)] text-white"
                  : "bg-zinc-900/80 border-white/10 hover:border-white/20 hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <IconComponent
                  size={16}
                  className={isSelected ? "text-amber-400" : "text-zinc-400"}
                />
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                )}
              </div>

              <div>
                <div className="text-xs font-semibold leading-tight">{p.name}</div>
                <div className="text-[10px] text-zinc-400 leading-tight line-clamp-1 mt-0.5">
                  {p.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
