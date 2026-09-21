// 🏢 Layer 3: OfficeMailboxView Component
// Live feed of inter-agent memos, dispatches, and executive reviews

import React from "react";
import { OfficeMemo, OfficeAgent } from "../../types/munderDifflinTypes";
import { Mail, Crown, Send, CheckCheck, Clock, User } from "lucide-react";

interface OfficeMailboxViewProps {
  memos: OfficeMemo[];
  agents: OfficeAgent[];
  onMarkAllRead: () => void;
}

export function OfficeMailboxView({
  memos,
  agents,
  onMarkAllRead
}: OfficeMailboxViewProps) {
  const getAgent = (id: string) => agents.find((a) => a.id === id);

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#0a0a1a] to-[#060612] border border-purple-500/25 p-5 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <Mail size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Office Mailbox & Inter-Agent Dispatch</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Live transmission log between MAHR (The Boss) and the office floor desks
            </p>
          </div>
        </div>

        <button
          onClick={onMarkAllRead}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <CheckCheck size={12} className="text-emerald-400" />
          Mark All Read
        </button>
      </div>

      {/* Memos List */}
      <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
        {memos.length > 0 ? (
          memos.map((memo) => {
            const fromAgent = getAgent(memo.fromAgentId);
            const toAgent = memo.toAgentId === "all" ? { name: "All Staff", nickname: "All" } : getAgent(memo.toAgentId);
            const isBossMemo = fromAgent?.isBoss;

            return (
              <div
                key={memo.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                  isBossMemo
                    ? "bg-purple-950/40 border-purple-500/40 shadow-sm"
                    : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                {/* Memo Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{fromAgent?.avatarEmoji || "👤"}</span>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="font-bold text-white">{fromAgent?.nickname || "Unknown"}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-cyan-300 font-semibold">{toAgent?.nickname || "Recipient"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {memo.timestamp}
                    </span>
                    {isBossMemo && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold uppercase">
                        Boss Memo
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject & Content */}
                <div className="text-xs font-bold text-slate-100 font-mono">{memo.subject}</div>
                <div className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {memo.content}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            No memos recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
