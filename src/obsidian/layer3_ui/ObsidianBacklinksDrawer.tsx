import React from "react";
import { Link2, Sparkles, ArrowUpRight, PlusCircle } from "lucide-react";
import {
  ObsidianLinkedBacklink,
  ObsidianUnlinkedMention,
} from "../layer1_data/obsidianTypes";

interface ObsidianBacklinksDrawerProps {
  linkedBacklinks: ObsidianLinkedBacklink[];
  unlinkedMentions: ObsidianUnlinkedMention[];
  onSelectNoteById: (noteId: string) => void;
  onConvertUnlinkedMention: (mention: ObsidianUnlinkedMention) => void;
}

export const ObsidianBacklinksDrawer: React.FC<ObsidianBacklinksDrawerProps> = ({
  linkedBacklinks,
  unlinkedMentions,
  onSelectNoteById,
  onConvertUnlinkedMention,
}) => {
  return (
    <div className="space-y-4 pt-3 border-t border-white/10">
      {/* 1. Linked Backlinks Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-purple-300 tabular-nums">
          <span className="font-bold flex items-center gap-1.5">
            <Link2 size={13} />
            <span>Linked Backlinks ({linkedBacklinks.length})</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Notes referencing this note
          </span>
        </div>

        {linkedBacklinks.length === 0 ? (
          <p className="text-xs font-mono text-slate-500">
            No incoming [[WikiLinks]] yet. Convert an unlinked mention below or run AI Auto-Connect.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {linkedBacklinks.map((bl) => (
              <button
                key={bl.sourceNoteId}
                type="button"
                onClick={() => onSelectNoteById(bl.sourceNoteId)}
                className="w-full text-left p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-400/40 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-purple-200">
                  <span className="font-semibold truncate">
                    [[{bl.sourceNoteTitle}]]
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                    <span>{bl.sourceFolder}</span>
                    <ArrowUpRight size={11} />
                  </span>
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-1 line-clamp-2">
                  {bl.contextSnippet}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Unlinked Mentions Detector Section */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-xs font-mono text-cyan-300 tabular-nums">
          <span className="font-bold flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>Unlinked Mentions Detector ({unlinkedMentions.length})</span>
          </span>
          <span className="text-[11px] text-slate-400">
            1-click convert to [[WikiLink]]
          </span>
        </div>

        {unlinkedMentions.length === 0 ? (
          <p className="text-xs font-mono text-slate-500">
            All detected concept mentions across the vault are already linked.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {unlinkedMentions.map((um) => (
              <div
                key={um.id}
                className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/15 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                    <button
                      type="button"
                      onClick={() => onSelectNoteById(um.sourceNoteId)}
                      className="font-semibold hover:text-cyan-300 underline cursor-pointer truncate"
                    >
                      {um.sourceNoteTitle}.md
                    </button>
                    <span className="text-slate-500">·</span>
                    <span className="text-[11px] text-cyan-300">
                      mentions "{um.matchedPhrase}"
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-400 mt-1">
                    {um.contextSnippet}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onConvertUnlinkedMention(um)}
                  className="px-2.5 py-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 text-[11px] font-mono font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Convert plain-text mention into a bidirectional [[WikiLink]] and add Knowledge Graph edge"
                >
                  <PlusCircle size={12} />
                  <span>Link [[...]]</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
