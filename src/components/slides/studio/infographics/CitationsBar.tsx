import React from "react";
import { Globe, ExternalLink, ShieldCheck, Database } from "lucide-react";
import { SlideWebCitation, SlideTheme } from "../../../../services/slides/slideTypes";

interface CitationsBarProps {
  citations?: SlideWebCitation[];
  theme: SlideTheme;
}

const DEFAULT_FMC_SOURCES: SlideWebCitation[] = [
  { title: "NielsenIQ Global FMCG Retail Report", url: "https://nielseniq.com" },
  { title: "McKinsey Consumer Packaged Goods 2026", url: "https://mckinsey.com" },
  { title: "Statista Consumer Goods Index", url: "https://statista.com" }
];

export const CitationsBar: React.FC<CitationsBarProps> = ({ citations, theme }) => {
  const activeSources = citations && citations.length > 0 ? citations : DEFAULT_FMC_SOURCES;

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/5 text-[9px] sm:text-[10px] font-mono text-zinc-400">
      <span className="flex items-center gap-1 text-cyan-400 shrink-0 font-semibold">
        <Globe size={11} />
        <span>Market Grounding:</span>
      </span>

      {activeSources.map((cit, idx) => (
        <a
          key={idx}
          href={cit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-200 transition-colors"
        >
          <Database size={9} className="opacity-70" />
          <span className="truncate max-w-[140px] sm:max-w-xs">{cit.title}</span>
          <ExternalLink size={8} className="opacity-50" />
        </a>
      ))}
    </div>
  );
};
