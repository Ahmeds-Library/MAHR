import React, { useState } from "react";
import { Bot, User, CheckCircle2, Volume2, Globe, ExternalLink, Play, Image as ImageIcon, Video, X } from "lucide-react";
import { ChatMessageItemData } from "./types";

interface ChatMessageItemProps {
  message: ChatMessageItemData;
  onReplayAudio: (text: string) => void;
  themeColor?: string;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onReplayAudio,
  themeColor = "#9D7AFF",
}) => {
  const isUser = message.sender === "user";
  const [activeMediaModal, setActiveMediaModal] = useState<{ type: "image" | "video"; url: string; title?: string } | null>(null);

  return (
    <div
      className={`flex gap-2.5 max-w-[92%] sm:max-w-[85%] transition-all duration-200 ${
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] shadow-md border ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400/30"
            : "bg-slate-900 text-purple-300 border-purple-500/30 shadow-purple-900/20"
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-md relative group break-words transition-all duration-200 ${
            isUser
              ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none border border-indigo-400/20 shadow-indigo-950/40"
              : "bg-slate-900/90 text-slate-100 border border-white/10 rounded-tl-none shadow-black/40 backdrop-blur-sm"
          }`}
        >
          {/* Attached Images preview */}
          {message.attachedImages && message.attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {message.attachedImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="attachment"
                  className="w-20 h-20 object-cover rounded-lg border border-white/20 shadow"
                />
              ))}
            </div>
          )}

          {/* Transcript / Message Text */}
          <div className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed selection:bg-purple-500/30">
            {message.text}
          </div>

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
                    onClick={() => setActiveMediaModal({ type: item.type, url: item.url, title: item.title })}
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
                        <span className="truncate">{item.title || (item.type === "video" ? "Video Explainer" : "Diagram")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action executed indicator */}
          {message.actionExecuted && (
            <div className="mt-2 pt-1.5 border-t border-white/10 text-[9px] font-mono text-emerald-300 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>{message.actionExecuted}</span>
            </div>
          )}

          {/* Replay audio button (for MAHR transcript messages) */}
          {!isUser && message.text && (
            <button
              onClick={() => onReplayAudio(message.text)}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-800 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-600 transition-all cursor-pointer shadow-lg"
              title="Replay MAHR Voice Audio"
            >
              <Volume2 size={10} />
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span
          className={`text-[8.5px] font-mono text-slate-400 px-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {message.timestamp}
        </span>
      </div>

      {/* Media Preview Modal */}
      {activeMediaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveMediaModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-zinc-950 border border-white/20 rounded-2xl overflow-hidden shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                {activeMediaModal.type === "video" ? <Video size={16} className="text-red-400" /> : <ImageIcon size={16} className="text-purple-400" />}
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
                      : `https://www.youtube.com/embed/${activeMediaModal.url.split("v=")[1]?.split("&")[0] || activeMediaModal.url}?autoplay=1`
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
