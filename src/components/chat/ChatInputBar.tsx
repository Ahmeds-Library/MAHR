import React, { useRef, useEffect } from "react";
import { Send, Sparkles, ImagePlus, Monitor, X } from "lucide-react";
import { ChatInputBarProps, ChatActionMode } from "./types";

const MODE_PLACEHOLDERS: Record<ChatActionMode, string> = {
  auto: "Ask MAHR anything, type instructions, or press '/' for commands...",
  whiteboard: "Describe formulas, notes, or diagrams to write on Chalkboard...",
  code: "Describe the code to write, explain, or debug on Chalkboard...",
  slides: "Enter a presentation topic to build in Classroom Slides Studio...",
  memory: "Type a personal fact, goal, or deadline to save in Vector Memory...",
};

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  activeMode = "auto",
  onKeyDownOverride,
  isScreenSharing = false,
  includeScreenSnapshot = true,
  onToggleScreenSnapshot,
  pendingImages = [],
  onAddPendingImage,
  onRemovePendingImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamically adjust height without ever showing a scrollbar
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "38px";
    const nextHeight = Math.min(Math.max(el.scrollHeight, 38), 88);
    el.style.height = `${nextHeight}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyDownOverride && onKeyDownOverride(e)) {
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onAddPendingImage) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onAddPendingImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onAddPendingImage || !e.clipboardData?.items) return;
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              onAddPendingImage(reader.result);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const canSend =
    !isLoading &&
    (Boolean(input.trim()) ||
      pendingImages.length > 0 ||
      (isScreenSharing && includeScreenSnapshot));

  return (
    <div className="flex flex-col bg-slate-950/95 border-t border-white/10 backdrop-blur-xl shrink-0">
      {/* Pending Images & Live Screen Snapshot Strip */}
      {(pendingImages.length > 0 || isScreenSharing) && (
        <div className="px-3 pt-2 flex flex-wrap items-center gap-2 overflow-hidden">
          {isScreenSharing && onToggleScreenSnapshot && (
            <button
              type="button"
              onClick={() => onToggleScreenSnapshot(!includeScreenSnapshot)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9.5px] font-mono font-semibold border transition-all cursor-pointer shrink-0 ${
                includeScreenSnapshot
                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}
              title="Automatically attach a snapshot of your shared screen with your message"
            >
              <Monitor size={11} className={includeScreenSnapshot ? "text-cyan-300 animate-pulse" : ""} />
              <span>{includeScreenSnapshot ? "Screen Snapshot ON" : "Screen Snapshot OFF"}</span>
            </button>
          )}

          {pendingImages.map((img, idx) => (
            <div key={idx} className="relative group shrink-0">
              <img
                src={img}
                alt="Pending upload"
                className="w-11 h-11 rounded-lg object-cover border border-cyan-400/40 shadow"
              />
              {onRemovePendingImage && (
                <button
                  type="button"
                  onClick={() => onRemovePendingImage(idx)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow cursor-pointer"
                  title="Remove image"
                >
                  <X size={9} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Typed Instruction Input Form */}
      <form onSubmit={onSubmit} className="p-2.5 flex items-end gap-1.5">
        {onAddPendingImage && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2.5 h-[38px] rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            title="Attach image or diagram for MAHR to analyze"
          >
            <ImagePlus size={14} />
          </button>
        )}

        <div className="relative flex-1 flex items-center overflow-hidden rounded-xl bg-slate-900/95 border border-cyan-500/25 focus-within:border-cyan-400/75 focus-within:ring-1 focus-within:ring-cyan-400/35 shadow-inner transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={MODE_PLACEHOLDERS[activeMode]}
            disabled={isLoading}
            className="w-full min-h-[38px] max-h-[88px] resize-none overflow-hidden no-scrollbar bg-transparent px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none font-sans pr-7 leading-relaxed"
          />
          {input.trim() && (
            <div className="absolute right-2.5 bottom-2.5 pointer-events-none text-cyan-400/70">
              <Sparkles size={12} />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSend}
          className="px-3.5 py-2.5 h-[38px] rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-lg shadow-indigo-950/50 flex items-center gap-1.5 justify-center border border-cyan-300/30 font-mono text-[11px] font-semibold shrink-0"
          title="Execute instruction (Enter)"
        >
          <span className="hidden sm:inline">Send</span>
          <Send size={13} className={canSend ? "translate-x-0.5 transition-transform" : ""} />
        </button>
      </form>
    </div>
  );
};

