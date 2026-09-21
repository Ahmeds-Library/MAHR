import React, { useState } from "react";
import { ChatMessage } from "../lib/memoryTypes";
import { 
  MessageSquare, 
  X, 
  Trash2, 
  Clock, 
  Calendar,
  Sparkles,
  Search,
  User,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatJournalProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onClearHistory: () => Promise<void>;
  themeColor: string;
  chatMaxMessages: number;
  chatRetentionTime: number;
  onClearOldest: () => void;
}

export function ChatJournal({
  isOpen,
  onClose,
  chatHistory,
  onClearHistory,
  themeColor,
  chatMaxMessages,
  chatRetentionTime,
  onClearOldest
}: ChatJournalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const getThemeBadgeGlow = () => {
    switch (themeColor) {
      case "violet": return "border-purple-500/30 text-purple-400 bg-purple-500/10";
      case "crimson": return "border-rose-500/30 text-rose-400 bg-rose-500/10";
      case "emerald": return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
      case "celestial": return "border-sky-500/30 text-sky-400 bg-sky-500/10";
      case "gold": return "border-amber-500/30 text-amber-400 bg-amber-500/10";
      case "rose": return "border-pink-500/30 text-pink-400 bg-pink-500/10";
      case "charcoal":
      default:
        return "border-indigo-500/30 text-indigo-400 bg-indigo-500/10";
    }
  };

  const getThemeTextGlow = () => {
    switch (themeColor) {
      case "violet": return "text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]";
      case "crimson": return "text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
      case "emerald": return "text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
      case "celestial": return "text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]";
      case "gold": return "text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
      case "rose": return "text-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.3)]";
      case "charcoal":
      default:
        return "text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]";
    }
  };

  const filteredHistory = chatHistory.filter((msg) =>
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate limits & pressure for client-side chat retention
  const isCountLimitUnlimited = chatMaxMessages === 999999;
  const countUsagePercent = isCountLimitUnlimited ? 0 : Math.min(100, (chatHistory.length / chatMaxMessages) * 100);

  let timeUsagePercent = 0;
  let oldestMessageAgeMins = 0;
  if (chatRetentionTime > 0 && chatHistory.length > 0) {
    const oldestMsg = chatHistory[0]; // chronological order, oldest is first
    const oldestTime = new Date(oldestMsg.timestamp).getTime();
    oldestMessageAgeMins = Math.max(0, (Date.now() - oldestTime) / (60 * 1000));
    timeUsagePercent = Math.min(100, (oldestMessageAgeMins / chatRetentionTime) * 100);
  }

  const databaseFullness = Math.max(countUsagePercent, timeUsagePercent);

  const formatMessageTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "Now";
    }
  };

  const formatMessageDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "Today";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 z-[100] backdrop-blur-md"
          />

          {/* Slide-over Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#020206]/95 border-l border-white/15 backdrop-blur-2xl z-[101] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${getThemeBadgeGlow()}`}>
                  <MessageSquare size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-medium text-lg tracking-tight text-white flex items-center gap-2">
                    Conversation Journal
                    <Sparkles size={14} className="text-purple-400" />
                  </h3>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">
                    Recent session dialog logs ({chatHistory.length})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions / Search Bar Row */}
            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search previous dialog lines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/15 bg-black/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-mono tracking-wider text-red-300 transition shrink-0 cursor-pointer"
                  title="Clear conversation log"
                >
                  <Trash2 size={12} />
                  <span>CLEAR JOURNAL</span>
                </button>
              )}
            </div>

            {/* Database Storage Capacity Gauge & Prune Controls */}
            <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.7)] animate-pulse ${
                    databaseFullness > 85 ? "bg-red-400" : databaseFullness > 60 ? "bg-amber-400" : "bg-cyan-400"
                  }`} />
                  <span className="text-[10px] font-mono tracking-wider font-bold text-slate-300 uppercase">
                    Journal Database Pressure
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {Math.round(databaseFullness)}% Capacity Used
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    databaseFullness > 85 
                      ? "bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                      : databaseFullness > 60 
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                  }`}
                  style={{ width: `${Math.max(2, databaseFullness)}%` }}
                />
              </div>

              {/* Usage Details Legend */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-mono text-slate-400">
                  <span>
                    Messages: <strong className="text-slate-200">{chatHistory.length}</strong> / {isCountLimitUnlimited ? "∞" : chatMaxMessages}
                  </span>
                  {chatRetentionTime > 0 && chatHistory.length > 0 && (
                    <span>
                      Max Age: <strong className="text-slate-200">{Math.round(oldestMessageAgeMins)}m</strong> / {chatRetentionTime}m
                    </span>
                  )}
                </div>

                {chatHistory.length > 0 && (
                  <button
                    onClick={onClearOldest}
                    className="flex items-center justify-center gap-1 px-2 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-mono font-bold tracking-wider text-slate-300 hover:text-white transition cursor-pointer"
                    title="Prune oldest messages beyond the set duration/count"
                  >
                    <span>CLEAR OLDEST</span>
                  </button>
                )}
              </div>
            </div>

            {/* Conversation messages list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence initial={false}>
                {filteredHistory.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500"
                  >
                    <div className="p-4 rounded-full border border-dashed border-white/10 bg-white/[0.02] mb-4">
                      <MessageSquare size={32} className="opacity-40" />
                    </div>
                    <h4 className="text-sm font-semibold tracking-wide text-slate-300">Journal empty</h4>
                    <p className="text-xs max-w-xs mt-1.5 leading-relaxed font-mono">
                      {searchQuery 
                        ? "No conversation lines matched your filter query."
                        : "Start conversing verbally with MAHR! Your spoken chat and responses are beautifully archived here in real-time."}
                    </p>
                  </motion.div>
                ) : (
                  filteredHistory.map((msg, idx) => {
                    const isUser = msg.role === "user";
                    return (
                      <motion.div
                        key={msg.id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                          isUser 
                            ? "bg-indigo-950/20 border-indigo-500/10 ml-8" 
                            : "bg-white/[0.02] border-white/5 mr-8"
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                          isUser ? "bg-indigo-500/10 text-indigo-400" : "bg-purple-500/10 text-purple-400"
                        }`}>
                          {isUser ? <User size={13} /> : <Bot size={13} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                              {isUser ? "You (TECH)" : "MAHR"}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-mono">
                              <Calendar size={10} />
                              <span>{formatMessageDate(msg.timestamp)}</span>
                              <Clock size={10} className="ml-0.5" />
                              <span>{formatMessageTime(msg.timestamp)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-200 font-sans leading-relaxed break-words whitespace-pre-line font-medium">
                            {msg.text}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Technical visual footer */}
            <div className="p-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[9px] font-mono text-slate-600 tracking-wider">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.7)] animate-pulse" />
                <span>JOURNAL RETENTION AUTO-LOCK</span>
              </span>
              <span>INDEXEDDB DURABLE STATE</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
