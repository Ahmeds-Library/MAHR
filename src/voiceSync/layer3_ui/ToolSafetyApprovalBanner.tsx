import React, { useEffect, useState } from "react";
import { ShieldAlert, Check, X } from "lucide-react";
import { ToolApprovalRequest } from "../layer1_data/assistantSessionTypes";

interface ToolSafetyApprovalBannerProps {
  request: ToolApprovalRequest | null;
  onResolve: (approved: boolean) => void;
}

/**
 * Layer 3 UI Component: Interactive Tool Safety Confirmation Gate
 * Prompts the user to explicitly Approve or Deny Tier-2 mutating / external actions
 * with a live 15-second auto-deny tabular countdown.
 */
export const ToolSafetyApprovalBanner: React.FC<ToolSafetyApprovalBannerProps> = ({
  request,
  onResolve,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(15);

  useEffect(() => {
    if (!request) return;
    const updateSeconds = () => {
      const rem = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000));
      setSecondsLeft(rem);
    };
    updateSeconds();
    const id = setInterval(updateSeconds, 250);
    return () => clearInterval(id);
  }, [request]);

  if (!request) return null;

  return (
    <div
      role="alertdialog"
      aria-labelledby="tool-approval-title"
      className="mb-3 w-[310px] sm:w-[350px] p-3.5 rounded-2xl bg-zinc-950/95 border border-amber-400/40 shadow-[0_16px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-slate-100 pointer-events-auto"
    >
      <div className="flex items-start justify-between gap-2.5 mb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span
            id="tool-approval-title"
            className="text-xs font-semibold tracking-tight text-white"
          >
            Confirm Action: {request.toolName}
          </span>
        </div>
        <span className="text-[11px] font-mono tabular-nums text-amber-300 shrink-0">
          {secondsLeft}s
        </span>
      </div>

      <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
        {request.reason}
      </p>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onResolve(false)}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <X className="w-3.5 h-3.5 text-rose-400" />
          <span>Deny</span>
        </button>
        <button
          type="button"
          onClick={() => onResolve(true)}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Approve</span>
        </button>
      </div>
    </div>
  );
};
