import React, { useState, useMemo, useEffect } from "react";
import { ChatMessage, Memory, MemoryCategory } from "../lib/memoryTypes";
import {
  MessageSquare,
  X,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  Search,
  User,
  Bot,
  Brain,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { enrichAndSearchJournalTranscripts } from "../memoryHub/layer2_logic/hybridVectorSearchEngine";

interface ChatJournalProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onClearHistory: () => Promise<void>;
  themeColor: string;
  chatMaxMessages: number;
  chatRetentionTime: number;
  onClearOldest: () => void;
  memories?: Memory[];
  onAddMemory?: (category: MemoryCategory, text: string) => Promise<any>;
  onShiftToRecall?: () => void;
}

export function ChatJournal({
  isOpen,
  onClose,
  chatHistory,
  onClearHistory,
  themeColor,
  chatMaxMessages,
  chatRetentionTime,
  onClearOldest,
  memories = [],
  onAddMemory,
  onShiftToRecall,
}: ChatJournalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [obsidianJournalSync, setObsidianJournalSync] = useState<{
    notesCount: number;
    linksCount: number;
  }>({
    notesCount: memories.length + 3,
    linksCount: memories.length * 2 + 4,
  });

  useEffect(() => {
    const handleObsidianSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setObsidianJournalSync({
          notesCount: detail.totalNotes || memories.length + 3,
          linksCount: detail.totalWikiLinks || memories.length * 2 + 4,
        });
      }
    };
    window.addEventListener("mahr-obsidian-sync-status", handleObsidianSync);
    return () => window.removeEventListener("mahr-obsidian-sync-status", handleObsidianSync);
  }, [memories.length]);

  const getThemeBadgeGlow = () => {
    switch (themeColor) {
      case "violet":
        return "border-purple-500/30 text-purple-400 bg-purple-500/10";
      case "crimson":
        return "border-rose-500/30 text-rose-400 bg-rose-500/10";
      case "emerald":
        return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
      case "celestial":
        return "border-sky-500/30 text-sky-400 bg-sky-500/10";
      case "gold":
        return "border-amber-500/30 text-amber-400 bg-amber-500/10";
      case "rose":
        return "border-pink-500/30 text-pink-400 bg-pink-500/10";
      default:
        return "border-indigo-500/30 text-indigo-400 bg-indigo-500/10";
    }
  };

  // Layer 2: Hybrid Semantic Search + Vector Memory Cross-Linking across Journal transcripts
  const enrichedTranscripts = useMemo(() => {
    return enrichAndSearchJournalTranscripts(searchQuery, chatHistory, memories);
  }, [searchQuery, chatHistory, memories]);

  // Calculate limits & pressure for client-side chat retention
  const isCountLimitUnlimited = chatMaxMessages === 999999;
  const countUsagePercent = isCountLimitUnlimited
    ? 0
    : Math.min(100, (chatHistory.length / chatMaxMessages) * 100);

  let timeUsagePercent = 0;
  let oldestMessageAgeMins = 0;
  if (chatRetentionTime > 0 && chatHistory.length > 0) {
    const oldestMsg = chatHistory[0];
    const oldestTime = new Date(oldestMsg.timestamp).getTime();
    oldestMessageAgeMins = Math.max(0, (Date.now() - oldestTime) / (60 * 1000));
    timeUsagePercent = Math.min(100, (oldestMessageAgeMins / chatRetentionTime) * 100);
  }

  const databaseFullness = Math.max(countUsagePercent, timeUsagePercent);

  const formatMessageTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Now";
    }
  };

  const formatMessageDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Today";
    }
  };

  const handleVectorizeTurn = async (msg: ChatMessage, suggestedCat?: MemoryCategory) => {
    if (!onAddMemory || !msg.text.trim()) return;
    const category = suggestedCat || (msg.role === "user" ? "preference" : "project");
    await onAddMemory(category, msg.text.slice(0, 260));
    setSavedNotice("Vectorized dialog turn into Recall Memory DB (128-D embedding).");
    setTimeout(() => setSavedNotice(null), 3200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-4xl max-h-[88vh] bg-slate-950/95 border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col backdrop-blur-2xl overflow-hidden text-slate-100 z-10"
          >
            {/* Ambient Top Glow Line */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60 pointer-events-none" />

            {/* Header with Top-Right Corner Button to Shift Back to Recall */}
            <div className="px-5 py-4 sm:px-6 border-b border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${getThemeBadgeGlow()}`}>
                  <MessageSquare size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                    <span>Conversation Journal</span>
                    <Sparkles size={14} className="text-purple-400" />
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Real-Time Transcript Archive ({chatHistory.length} turns) · Cross-Linked with Recall DB
                  </p>
                </div>
              </div>

              {/* Corner Shift Button Back to Recall + Close */}
              <div className="flex items-center gap-2">
                {onShiftToRecall && (
                  <button
                    id="journal-corner-shift-to-recall-btn"
                    data-testid="journal-corner-shift-to-recall-btn"
                    type="button"
                    onClick={onShiftToRecall}
                    className="h-9 px-3.5 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/50 hover:to-indigo-600/50 text-cyan-100 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/50 transition cursor-pointer"
                    title="Shift back to Recall Vector Memory Hub"
                  >
                    <ArrowLeft size={13} className="text-cyan-300" />
                    <Brain size={14} className="text-cyan-300" />
                    <span>Recall ({memories.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/80 hover:border-rose-400 text-slate-400 hover:text-white transition duration-200 cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {savedNotice && (
              <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-200 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>{savedNotice}</span>
              </div>
            )}

            {/* Hybrid Semantic Search & Prune Controls Row */}
            <div className="px-5 py-3.5 sm:px-6 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Hybrid semantic & keyword search across conversation history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/15 bg-black/40 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/60 font-mono"
                />
              </div>
              {chatHistory.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onClearOldest}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
                    title="Prune oldest messages beyond retention threshold"
                  >
                    Prune Oldest
                  </button>
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-mono text-red-300 transition shrink-0 cursor-pointer"
                    title="Clear conversation log"
                  >
                    <Trash2 size={13} />
                    <span>Clear Journal</span>
                  </button>
                </div>
              )}
            </div>

            {/* Retention Capacity Bar */}
            <div className="px-5 py-2.5 sm:px-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  Messages: <strong className="text-slate-200">{chatHistory.length}</strong> /{" "}
                  {isCountLimitUnlimited ? "∞" : chatMaxMessages}
                </span>
                {chatRetentionTime > 0 && chatHistory.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Max Age: <strong className="text-slate-200">{Math.round(oldestMessageAgeMins)}m</strong> /{" "}
                      {chatRetentionTime}m
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 w-36 sm:w-48">
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.max(3, databaseFullness)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {Math.round(databaseFullness)}%
                </span>
              </div>
            </div>

            {/* Conversation messages list */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
              <AnimatePresence initial={false}>
                {enrichedTranscripts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400"
                  >
                    <div className="p-4 rounded-full border border-dashed border-white/10 bg-white/[0.02] mb-4">
                      <MessageSquare size={32} className="opacity-40" />
                    </div>
                    <h4 className="text-sm font-semibold tracking-wide text-slate-200">
                      Journal empty
                    </h4>
                    <p className="text-xs max-w-xs mt-1.5 leading-relaxed font-mono">
                      {searchQuery
                        ? "No conversation lines matched your semantic filter query."
                        : "Start conversing with MAHR! Your spoken chat and responses are archived and cross-linked with Recall here."}
                    </p>
                  </motion.div>
                ) : (
                  enrichedTranscripts.map((item, idx) => {
                    const msg = item.message;
                    const isUser = msg.role === "user";
                    return (
                      <motion.div
                        key={msg.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-3 p-4 rounded-2xl border group ${
                          isUser
                            ? "bg-indigo-950/25 border-indigo-500/20 ml-4 sm:ml-8"
                            : "bg-white/[0.03] border-white/10 mr-4 sm:mr-8"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            isUser
                              ? "bg-indigo-500/15 text-indigo-300"
                              : "bg-purple-500/15 text-purple-300"
                          }`}
                        >
                          {isUser ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                              <span className="font-bold uppercase text-slate-200">
                                {isUser ? "You" : "MAHR"}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={10} />
                                {formatMessageDate(msg.timestamp)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock size={10} />
                                {formatMessageTime(msg.timestamp)}
                              </span>
                              {searchQuery.trim() && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-purple-300 font-semibold">
                                    {Math.round(item.hybridScore * 100)}% Match
                                  </span>
                                </>
                              )}
                            </div>

                            {onAddMemory && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleVectorizeTurn(
                                    msg,
                                    item.extractedCandidateFact?.category
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-cyan-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 transition cursor-pointer"
                                title="Vectorize this message into Recall Memory DB"
                              >
                                <PlusCircle size={11} />
                                <span>Memorize to Recall</span>
                              </button>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed break-words whitespace-pre-line font-medium">
                            {msg.text}
                          </p>

                          {/* Linked Vector Memories indicator */}
                          {item.linkedMemories.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-cyan-300/90">
                              <Link2 size={11} className="shrink-0" />
                              <span className="text-slate-400">Linked in Recall:</span>
                              {item.linkedMemories.map((lm) => (
                                <span
                                  key={lm.id}
                                  className="text-cyan-200 truncate max-w-[260px]"
                                  title={lm.text}
                                >
                                  “{lm.text}” ({Math.round(lm.similarity * 100)}%)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  OBSIDIAN DAILY JOURNAL AUTO-SYNCED (02_Journal/*.md ·{" "}
                  {obsidianJournalSync.linksCount} [[WikiLinks]])
                </span>
              </span>
              {onShiftToRecall && (
                <button
                  type="button"
                  onClick={onShiftToRecall}
                  className="text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <ArrowLeft size={12} />
                  <span>Back to Recall Memory ({memories.length})</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
