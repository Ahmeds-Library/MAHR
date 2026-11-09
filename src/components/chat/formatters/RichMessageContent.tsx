import React, { useMemo, useState } from "react";
import { Check, Copy, PenTool, Sparkles, Terminal } from "lucide-react";
import {
  parseInlineTokens,
  parseRichMessageBlocks,
} from "./messageMarkdownParser";

interface RichMessageContentProps {
  text: string;
  isUser: boolean;
  onSendCodeToChalkboard?: (code: string, language?: string) => void;
}

const InlineFormattedText: React.FC<{ text: string; isUser: boolean }> = ({
  text,
  isUser,
}) => {
  const tokens = useMemo(() => parseInlineTokens(text), [text]);

  return (
    <>
      {tokens.map((token, idx) => {
        if (token.type === "bold") {
          return (
            <strong
              key={idx}
              className={`font-semibold ${
                isUser
                  ? "text-white underline decoration-white/30 underline-offset-2"
                  : "text-cyan-100"
              }`}
            >
              {token.value}
            </strong>
          );
        }
        if (token.type === "italic") {
          return (
            <em key={idx} className="italic text-indigo-200/95">
              {token.value}
            </em>
          );
        }
        if (token.type === "code") {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-950/90 border border-cyan-400/30 font-mono text-[11px] text-cyan-200 break-words"
            >
              {token.value}
            </code>
          );
        }
        return <React.Fragment key={idx}>{token.value}</React.Fragment>;
      })}
    </>
  );
};

export const RichMessageContent: React.FC<RichMessageContentProps> = ({
  text,
  isUser,
  onSendCodeToChalkboard,
}) => {
  const blocks = useMemo(() => parseRichMessageBlocks(text), [text]);
  const [copiedBlockIdx, setCopiedBlockIdx] = useState<number | null>(null);
  const [sentBlockIdx, setSentBlockIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard?.writeText(code);
    setCopiedBlockIdx(idx);
    setTimeout(() => setCopiedBlockIdx(null), 1800);
  };

  const handleSendToBoard = (
    code: string,
    lang: string | undefined,
    idx: number
  ) => {
    if (onSendCodeToChalkboard) {
      onSendCodeToChalkboard(code, lang);
      setSentBlockIdx(idx);
      setTimeout(() => setSentBlockIdx(null), 2200);
    }
  };

  return (
    <div className="space-y-2.5 font-sans text-[12.5px] leading-relaxed break-words overflow-hidden selection:bg-cyan-500/30">
      {blocks.map((block, bIdx) => {
        if (block.type === "divider") {
          return (
            <div
              key={bIdx}
              className="my-2 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
            />
          );
        }

        if (block.type === "heading") {
          const sizeClass =
            block.level === 1
              ? "text-[13.5px] font-bold text-white tracking-tight"
              : block.level === 2
              ? "text-[13px] font-semibold text-cyan-100"
              : "text-[12px] font-semibold text-indigo-200 uppercase tracking-wider font-mono";

          return (
            <div
              key={bIdx}
              className="pt-1 pb-0.5 flex items-center gap-1.5 border-b border-white/10"
            >
              <Sparkles
                size={11}
                className="text-cyan-400 shrink-0"
              />
              <h4 className={`${sizeClass} break-words`}>
                <InlineFormattedText text={block.text} isUser={isUser} />
              </h4>
            </div>
          );
        }

        if (block.type === "bullet_list") {
          return (
            <ul
              key={bIdx}
              className={`space-y-1.5 rounded-xl p-2.5 border ${
                isUser
                  ? "bg-white/10 border-white/15"
                  : "bg-slate-950/60 border-cyan-500/15"
              }`}
            >
              {block.items.map((item, iIdx) => (
                <li
                  key={iIdx}
                  className="flex items-start gap-2 text-[12px] leading-relaxed"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] shrink-0" />
                  <span className="flex-1 min-w-0 break-words">
                    <InlineFormattedText text={item} isUser={isUser} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered_list") {
          return (
            <ol
              key={bIdx}
              className={`space-y-1.5 rounded-xl p-2.5 border ${
                isUser
                  ? "bg-white/10 border-white/15"
                  : "bg-slate-950/60 border-indigo-500/20"
              }`}
            >
              {block.items.map((item, iIdx) => (
                <li
                  key={iIdx}
                  className="flex items-start gap-2 text-[12px] leading-relaxed"
                >
                  <span className="mt-0.5 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-md bg-cyan-500/20 border border-cyan-400/35 text-cyan-200 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    {item.numberLabel}
                  </span>
                  <span className="flex-1 min-w-0 break-words">
                    <InlineFormattedText text={item.text} isUser={isUser} />
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote
              key={bIdx}
              className="pl-3 pr-2.5 py-2 rounded-r-xl border-l-2 border-cyan-400 bg-cyan-950/25 text-cyan-100/90 text-[12px] space-y-1 break-words"
            >
              {block.lines.map((line, lIdx) => (
                <p key={lIdx} className="leading-relaxed">
                  <InlineFormattedText text={line} isUser={isUser} />
                </p>
              ))}
            </blockquote>
          );
        }

        if (block.type === "code") {
          return (
            <div
              key={bIdx}
              className="my-2 rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950/95 shadow-inner"
            >
              <div className="px-2.5 py-1.5 bg-slate-900/95 border-b border-white/10 flex items-center justify-between gap-2">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1">
                  <Terminal size={10} className="text-cyan-400" />
                  <span>{block.language || "code"}</span>
                </span>
                <div className="flex items-center gap-1">
                  {onSendCodeToChalkboard && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSendToBoard(block.content, block.language, bIdx)
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-[9px] font-mono text-emerald-200 transition-colors cursor-pointer"
                      title="Send this code directly to the Classroom Chalkboard"
                    >
                      {sentBlockIdx === bIdx ? (
                        <>
                          <Check size={9} className="text-emerald-300" />
                          <span>On Chalkboard</span>
                        </>
                      ) : (
                        <>
                          <PenTool size={9} />
                          <span>Chalkboard</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyCode(block.content, bIdx)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-mono text-slate-300 transition-colors cursor-pointer"
                    title="Copy code block"
                  >
                    {copiedBlockIdx === bIdx ? (
                      <>
                        <Check size={9} className="text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={9} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="p-2.5 whitespace-pre-wrap break-words overflow-hidden font-mono text-[11px] leading-relaxed text-cyan-100">
                <code className="break-words">{block.content}</code>
              </pre>
            </div>
          );
        }

        // Standard paragraph with line-break awareness and zero scrollbars
        const paragraphLines = block.text.split("\n");
        return (
          <div key={bIdx} className="leading-relaxed break-words">
            {paragraphLines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                <InlineFormattedText text={line} isUser={isUser} />
                {lIdx < paragraphLines.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
};
