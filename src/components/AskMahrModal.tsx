import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Bot, User, Sparkles, Image, Monitor, Paperclip, Volume2, CheckCircle2 } from "lucide-react";
import { AskMahrMessage } from "../hooks/useAskMahr";
import { speakUtterance } from "../services/speechSynthesisService";

export type AskMyraaMessage = AskMahrMessage;

interface AskMahrModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AskMahrMessage[];
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent, customText?: string) => void;
  isLoading: boolean;
  activeSubAgentName: string;
  activeModelId: string;
  themeColor?: string;
  isScreenSharing?: boolean;
  includeScreenSnapshot?: boolean;
  onToggleScreenSnapshot?: (val: boolean) => void;
  isAutoSpeakEnabled?: boolean;
  onToggleAutoSpeak?: (val: boolean) => void;
  pendingImages?: string[];
  onAddPendingImage?: (base64: string) => void;
  onRemovePendingImage?: (index: number) => void;
}

export type AskMyraaModalProps = AskMahrModalProps;

const QUICK_PROMPTS = [
  "📷 Analyze my active screen & code",
  "🖊️ Write the formula on chalkboard",
  "🎨 Shift theme to Gold atmosphere",
  "📋 Add daily task: Review physics",
  "❓ Generate 3 quiz questions"
];

export const AskMahrModal: React.FC<AskMahrModalProps> = ({
  isOpen,
  onClose,
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  activeSubAgentName,
  activeModelId,
  themeColor = "#9D7AFF",
  isScreenSharing = false,
  includeScreenSnapshot = true,
  onToggleScreenSnapshot,
  isAutoSpeakEnabled = false,
  onToggleAutoSpeak,
  pendingImages = [],
  onAddPendingImage,
  onRemovePendingImage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      if (b64 && onAddPendingImage) {
        onAddPendingImage(b64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSpeakText = (txt: string) => {
    speakUtterance({
      text: txt,
      activeEmotion: "happy",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-14 sm:bottom-16 left-2 right-2 sm:left-auto sm:right-6 md:right-8 z-[300] sm:w-[420px] md:w-[460px] h-[65vh] max-h-[440px] sm:h-[440px] bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans"
          style={{ boxShadow: `0 25px 70px -15px rgba(0,0,0,0.8), 0 0 30px rgba(157,122,255,0.15)` }}
        >
          {/* Modal Header */}
          <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-md relative"
                style={{ background: `linear-gradient(135deg, ${themeColor}, #4f46e5)` }}
              >
                <Bot size={16} className="animate-pulse" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase flex items-center gap-2">
                  <span>Ask MAHR // Text Console</span>
                </h3>
                <p className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span>{activeSubAgentName} • {activeModelId}</span>
                  {isScreenSharing && (
                    <span className="inline-flex items-center gap-1 text-cyan-400 font-bold bg-cyan-950/80 px-1.5 py-0.2 rounded text-[8px] border border-cyan-500/30">
                      <Monitor size={9} />
                      <span>Vision Connected</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onToggleAutoSpeak && (
                <button
                  type="button"
                  onClick={() => onToggleAutoSpeak(!isAutoSpeakEnabled)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono font-semibold transition-all cursor-pointer border ${
                    isAutoSpeakEnabled
                      ? "bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-sm shadow-purple-500/20"
                      : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200"
                  }`}
                  title={isAutoSpeakEnabled ? "Auto-Voice ON: Speaks response once generated" : "Auto-Voice OFF: Silent text response (click speaker icon on any message to listen)"}
                >
                  <Volume2 size={11} className={isAutoSpeakEnabled ? "text-purple-300 animate-pulse" : "text-slate-500"} />
                  <span>{isAutoSpeakEnabled ? "Voice ON" : "Voice OFF"}</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages Stream Area */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-slate-950/40">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[90%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div 
                  className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[11px] shadow-sm ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-purple-300 border border-white/10"
                  }`}
                >
                  {msg.sender === "user" ? <User size={12} /> : <Bot size={12} />}
                </div>

                <div className="flex flex-col gap-1">
                  <div
                    className={`px-3 py-2 rounded-xl text-xs leading-relaxed shadow-sm relative group ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-900/90 text-slate-200 border border-white/10 rounded-tl-none"
                    }`}
                  >
                    {/* Attached Images preview in message */}
                    {msg.attachedImages && msg.attachedImages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {msg.attachedImages.map((img, i) => (
                          <img key={i} src={img} alt="attachment" className="w-16 h-16 object-cover rounded-lg border border-white/20" />
                        ))}
                      </div>
                    )}

                    {msg.text}

                    {/* Action executed indicator */}
                    {msg.actionExecuted && (
                      <div className="mt-1.5 pt-1 border-t border-white/10 text-[9px] font-mono text-emerald-300 flex items-center gap-1 font-bold">
                        <CheckCircle2 size={10} />
                        <span>{msg.actionExecuted}</span>
                      </div>
                    )}

                    {/* Speaker replay button */}
                    {(msg.sender === "mahr" || msg.sender === "myraa") && (
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-800 border border-white/20 text-purple-300 hover:text-white transition-opacity cursor-pointer shadow"
                        title="Replay Voice Audio"
                      >
                        <Volume2 size={10} />
                      </button>
                    )}
                  </div>
                  <span className={`text-[8px] font-mono text-slate-500 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 max-w-[80%] mr-auto">
                <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[11px] bg-slate-800 text-purple-300 border border-white/10">
                  <Bot size={12} />
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="font-mono text-[9px] ml-1">{activeSubAgentName} is thinking & processing screen...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-1.5 bg-slate-900/40 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => onSubmit(undefined, prompt.slice(2).trim())}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 whitespace-nowrap transition duration-150 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Pending Attachments Thumbnail Bar */}
          {pendingImages.length > 0 && (
            <div className="px-3 py-1.5 bg-slate-950 border-t border-white/10 flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-400 uppercase">Attached:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {pendingImages.map((img, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <img src={img} alt="preview" className="w-8 h-8 object-cover rounded-md border border-purple-500/50" />
                    <button
                      onClick={() => onRemovePendingImage && onRemovePendingImage(idx)}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[8px] cursor-pointer"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screen Sharing Vision Bar */}
          {isScreenSharing && (
            <div className="px-3 py-1 bg-cyan-950/40 border-t border-cyan-500/20 flex items-center justify-between text-[10px] font-mono">
              <span className="text-cyan-300 flex items-center gap-1.5">
                <Monitor size={11} className="text-cyan-400 animate-pulse" />
                <span>Screen Vision Auto-Snapshot</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeScreenSnapshot}
                  onChange={(e) => onToggleScreenSnapshot && onToggleScreenSnapshot(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900 cursor-pointer"
                />
                <span className="text-[9px]">Include Frame</span>
              </label>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={onSubmit} className="p-2.5 bg-slate-900/80 border-t border-white/10 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              title="Attach Image or Code Screenshot"
            >
              <Paperclip size={14} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask MAHR, analyze screen, or type command..."
              disabled={isLoading}
              className="flex-1 bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && pendingImages.length === 0 && !isScreenSharing)}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-lg flex items-center justify-center"
            >
              <Send size={15} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const AskMyraaModal = AskMahrModal;

