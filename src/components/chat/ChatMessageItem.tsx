import React, { useState } from "react";
import {
  User,
  CheckCircle2,
  Volume2,
  Globe,
  ExternalLink,
  Play,
  Image as ImageIcon,
  Video,
  X,
  Copy,
  Check,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import { ChatMessageItemData } from "./types";
import { MahrDroneMiniAvatar } from "./mascot/vector/MahrSphericalDroneMascot";
import { RichMessageContent } from "./formatters/RichMessageContent";

interface ChatMessageItemProps {
  message: ChatMessageItemData;
  onReplayAudio: (text: string) => void;
  onSendCodeToChalkboard?: (code: string, language?: string) => void;
  themeColor?: string;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onReplayAudio,
  onSendCodeToChalkboard,
}) => {
  const isUser = message.sender === "user";
  const [copiedFullMsg, setCopiedFullMsg] = useState<boolean>(false);
  const [activeMediaModal, setActiveMediaModal] = useState<{
    type: "image" | "video";
    url: string;
    title?: string;
  } | null>(null);

  const handleCopyMessage = () => {
    navigator.clipboard?.writeText(message.text);
    setCopiedFullMsg(true);
    setTimeout(() => setCopiedFullMsg(false), 1800);
  };

  return (
    <div
      className={`flex gap-2.5 max-w-[94%] sm:max-w-[88%] transition-all duration-200 ${
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-[11px] shadow-md border bg-gradient-to-br from-cyan-500 to-indigo-600 text-white border-cyan-400/30">
          <User size={13} />
        </div>
      ) : (
        <MahrDroneMiniAvatar size={28} />
      )}

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg relative group break-words overflow-hidden transition-all duration-200 ${
            isUser
              ? "bg-gradient-to-br from-indigo-600/95 via-indigo-700/95 to-purple-700/90 text-white rounded-tr-none border border-indigo-400/30 shadow-indigo-950/50"
              : "bg-slate-900/95 text-slate-100 border border-cyan-500/20 rounded-tl-none shadow-black/50 backdrop-blur-md"
          }`}
        >
          {/* Mode Pill Tag if sent in a specialized instruction mode */}
          {message.modeUsed && message.modeUsed !== "auto" && (
            <div className="mb-1.5 flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 border border-white/15 font-mono text-[8.5px] uppercase tracking-wider text-cyan-200 font-semibold">
                <Sparkles size={8} />
                <span>{message.modeUsed} instruction</span>
              </span>
            </div>
          )}

          {/* Attached Images preview */}
          {message.attachedImages && message.attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {message.attachedImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="attachment"
                  onClick={() => setActiveMediaModal({ type: "image", url: img, title: "Attached Snapshot" })}
                  className="w-20 h-20 object-cover rounded-lg border border-white/20 shadow cursor-pointer hover:scale-105 transition-transform"
                />
              ))}
            </div>
          )}

          {/* Element 1: Recreated Rich Structured Message Content with Zero Scrollbars */}
          <RichMessageContent
            text={message.text}
            isUser={isUser}
            onSendCodeToChalkboard={onSendCodeToChalkboard}
          />

          {/* Live Web Grounding Search Sources */}
          {message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                <Globe size={11} className="animate-spin-slow" />
                <span>Google Search Verified Sources</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.groundingSources.slice(0, 4).map((source, sIdx) => {
                  let domain = "";
                  try {
                    domain = new URL(source.url).hostname.replace(/^www\./, "");
                  } catch {
                    domain = "web";
                  }
                  return (
                    <a
                      key={sIdx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-[9px] text-cyan-200 transition-colors max-w-[200px] truncate"
                      title={source.snippet || source.title}
                    >
                      <span className="truncate">{source.title || domain}</span>
                      <ExternalLink size={9} className="shrink-0 text-cyan-400" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Associated Visual Media & Explainer Videos */}
          {message.mediaItems && message.mediaItems.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
              <div className="text-[9px] font-mono text-purple-300 font-semibold uppercase flex items-center gap-1">
                <ImageIcon size={10} />
                <span>Related Media & Videos</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {message.mediaItems.slice(0, 2).map((item, mIdx) => (
                  <div
                    key={mIdx}
                    onClick={() =>
                      setActiveMediaModal({
                        type: item.type,
                        url: item.url,
                        title: item.title,
                      })
                    }
                    className="relative group/card cursor-pointer rounded-lg overflow-hidden border border-white/10 bg-black/40 hover:border-purple-500/50 transition-all hover:scale-[1.02]"
                  >
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.title || "media"}
                      className="w-full h-20 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-1.5">
                      <div className="flex items-center gap-1 text-[9px] text-white font-medium truncate">
                        {item.type === "video" ? (
                          <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                            <Play size={8} fill="currentColor" />
                          </div>
                        ) : (
                          <ImageIcon size={10} className="text-purple-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {item.title || (item.type === "video" ? "Video Explainer" : "Diagram")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automatic Vector Memory & Workspace Action Badges */}
          {(message.actionExecuted ||
            (message.memoryRecalledCount && message.memoryRecalledCount > 0) ||
            message.memorySavedTitle) && (
            <div className="mt-2 pt-1.5 border-t border-white/10 flex flex-wrap items-center gap-1.5">
              {message.memoryRecalledCount && message.memoryRecalledCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-950/70 border border-purple-500/35 text-[8.5px] font-mono text-purple-200 font-semibold"
                  title={
                    message.memoryRecalledLabels
                      ? `Recalled from 128-D Vector Graph: ${message.memoryRecalledLabels.join(", ")}`
                      : "Grounded with 128-D Vector Memory"
                  }
                >
                  <BrainCircuit size={9} className="text-purple-300" />
                  <span>
                    Recalled {message.memoryRecalledCount} Vector{" "}
                    {message.memoryRecalledCount === 1 ? "Node" : "Nodes"}
                  </span>
                </span>
              )}

              {message.memorySavedTitle && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/35 text-[8.5px] font-mono text-cyan-200 font-semibold truncate max-w-[220px]"
                  title={`Indexed into 128-D Vector Memory: ${message.memorySavedTitle}`}
                >
                  <BrainCircuit size={9} className="text-cyan-300" />
                  <span className="truncate">Indexed: {message.memorySavedTitle}</span>
                </span>
              )}

              {message.actionExecuted && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/35 text-[8.5px] font-mono text-emerald-200 font-semibold">
                  <CheckCircle2 size={9} className="text-emerald-400" />
                  <span>{message.actionExecuted}</span>
                </span>
              )}
            </div>
          )}

          {/* Hover Action Buttons (Replay Voice + Copy Text) for MAHR responses */}
          {!isUser && message.text && (
            <div className="absolute -top-2.5 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="p-1 rounded-full bg-slate-800 border border-white/15 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer shadow-lg"
                title="Copy response text"
              >
                {copiedFullMsg ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
              </button>
              <button
                type="button"
                onClick={() => onReplayAudio(message.text)}
                className="p-1 rounded-full bg-slate-800 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-600 transition-all cursor-pointer shadow-lg"
                title="Replay MAHR Voice Audio"
              >
                <Volume2 size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span
          className={`text-[8.5px] font-mono text-slate-500 px-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {message.timestamp}
        </span>
      </div>

      {/* Media Preview Modal */}
      {activeMediaModal && (
        <div
          className="fixed inset-0 z-[260] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveMediaModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-zinc-950 border border-white/20 rounded-2xl overflow-hidden shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                {activeMediaModal.type === "video" ? (
                  <Video size={16} className="text-red-400" />
                ) : (
                  <ImageIcon size={16} className="text-purple-400" />
                )}
                <h3 className="text-xs sm:text-sm font-semibold text-white truncate max-w-md">
                  {activeMediaModal.title || "Media Preview"}
                </h3>
              </div>
              <button
                onClick={() => setActiveMediaModal(null)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {activeMediaModal.type === "video" ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                <iframe
                  src={
                    activeMediaModal.url.includes("embed")
                      ? activeMediaModal.url
                      : `https://www.youtube.com/embed/${
                          activeMediaModal.url.split("v=")[1]?.split("&")[0] ||
                          activeMediaModal.url
                        }?autoplay=1`
                  }
                  title="Educational Video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative max-h-[70vh] flex items-center justify-center rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <img
                  src={activeMediaModal.url}
                  alt={activeMediaModal.title || "Full image"}
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
