import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { GoogleProductInfo } from "../../services/google/googleWorkspaceTypes";
import { PRODUCT_BRAND_LOGOS } from "./GoogleBrandLogos";

interface GoogleProductCardProps {
  product: GoogleProductInfo;
  onAction?: (product: GoogleProductInfo) => void;
  isLoading?: boolean;
}

const PRODUCT_THEME: Record<
  string,
  {
    glow: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    categoryText: string;
    officialUrl: string;
  }
> = {
  slides: {
    glow: "hover:shadow-amber-500/15 group-hover:border-amber-500/40",
    border: "border-amber-500/20",
    badgeBg: "bg-amber-500/15 border-amber-500/30",
    badgeText: "text-amber-300",
    categoryText: "text-amber-400/80",
    officialUrl: "https://slides.google.com",
  },
  drive: {
    glow: "hover:shadow-emerald-500/15 group-hover:border-emerald-500/40",
    border: "border-emerald-500/20",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30",
    badgeText: "text-emerald-300",
    categoryText: "text-emerald-400/80",
    officialUrl: "https://drive.google.com",
  },
  docs: {
    glow: "hover:shadow-blue-500/15 group-hover:border-blue-500/40",
    border: "border-blue-500/20",
    badgeBg: "bg-blue-500/15 border-blue-500/30",
    badgeText: "text-blue-300",
    categoryText: "text-blue-400/80",
    officialUrl: "https://docs.google.com",
  },
  sheets: {
    glow: "hover:shadow-green-500/15 group-hover:border-green-500/40",
    border: "border-green-500/20",
    badgeBg: "bg-green-500/15 border-green-500/30",
    badgeText: "text-green-300",
    categoryText: "text-green-400/80",
    officialUrl: "https://sheets.google.com",
  },
  calendar: {
    glow: "hover:shadow-sky-500/15 group-hover:border-sky-500/40",
    border: "border-sky-500/20",
    badgeBg: "bg-sky-500/15 border-sky-500/30",
    badgeText: "text-sky-300",
    categoryText: "text-sky-400/80",
    officialUrl: "https://calendar.google.com",
  },
  gmail: {
    glow: "hover:shadow-rose-500/15 group-hover:border-rose-500/40",
    border: "border-rose-500/20",
    badgeBg: "bg-rose-500/15 border-rose-500/30",
    badgeText: "text-rose-300",
    categoryText: "text-rose-400/80",
    officialUrl: "https://mail.google.com",
  },
  tasks: {
    glow: "hover:shadow-indigo-500/15 group-hover:border-indigo-500/40",
    border: "border-indigo-500/20",
    badgeBg: "bg-indigo-500/15 border-indigo-500/30",
    badgeText: "text-indigo-300",
    categoryText: "text-indigo-400/80",
    officialUrl: "https://tasks.google.com",
  },
};

export const GoogleProductCard: React.FC<GoogleProductCardProps> = ({
  product,
  onAction,
  isLoading = false,
}) => {
  const LogoComponent = PRODUCT_BRAND_LOGOS[product.id];
  const theme = PRODUCT_THEME[product.id] || PRODUCT_THEME.docs;
  const isConnected = product.status === "connected";

  return (
    <div
      data-testid={`google-product-card-${product.id}`}
      className={`group relative flex flex-col justify-between p-5 rounded-2xl border ${theme.border} bg-slate-900/85 hover:bg-slate-900 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 shadow-lg ${theme.glow}`}
    >
      <div>
        {/* Top Header: Brand Logo & Status */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            {/* Authentic Brand SVG Logo Icon Box */}
            <div className="w-12 h-12 rounded-xl bg-white/[0.07] border border-white/15 p-2 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-200">
              {LogoComponent ? (
                <LogoComponent size={32} />
              ) : (
                <Sparkles className="w-6 h-6 text-cyan-400" />
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors truncate">
                {product.name}
              </h4>
              <p className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${theme.categoryText} truncate`}>
                {product.category}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {isConnected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold font-mono shrink-0 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-[11px] font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Sign-In Required</span>
            </div>
          )}
        </div>

        {/* Product Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4 min-h-[36px]">
          {product.description}
        </p>
      </div>

      {/* Footer Actions & Stats */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2">
          {isConnected && product.itemCount !== undefined && (
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Layers size={13} className="text-cyan-400" />
              <strong className="text-white">{product.itemCount}</strong> items
            </span>
          )}
          {product.errorMessage && (
            <span className="text-[11px] text-rose-400 flex items-center gap-1 truncate max-w-[140px]" title={product.errorMessage}>
              <AlertCircle size={13} className="shrink-0" />
              <span>Auth Error</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Action Trigger */}
          <button
            type="button"
            onClick={() => onAction?.(product)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isConnected
                ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 hover:border-cyan-300 shadow-sm"
                : "bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:border-white/30"
            }`}
          >
            {isConnected ? (
              <>
                <CheckCircle2 size={13} className="text-cyan-400" />
                <span>Live View</span>
              </>
            ) : (
              <span>Connect</span>
            )}
          </button>

          {/* Direct Link to Google Product Web App */}
          <a
            href={theme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open official ${product.name} web app`}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
};
