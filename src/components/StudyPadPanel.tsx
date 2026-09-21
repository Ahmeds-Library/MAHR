import React, { useState } from "react";
import { 
  BookOpen, 
  X, 
  Check, 
  Edit, 
  Eye, 
  Sparkles, 
  Award, 
  List, 
  Bold, 
  PenTool,
  Brain,
  MessageSquare,
  GitFork,
  Highlighter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatMathText } from "../lib/mathFormatter";
import { MahrCollaborationSuite } from "./MahrCollaborationSuite";

interface StudyPadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  studyPadText: string;
  setStudyPadText: (val: string) => void;
  notesMode: "edit" | "preview";
  setNotesMode: (mode: "edit" | "preview") => void;
  notesStatusAlert: string | null;
  isSavingNotes: boolean;
  onSaveNotesToMemory: () => void;
  onGenerateStudyPack: () => void;
  isGeneratingPack: boolean;
  studyPack: {
    flashcards: { front: string; back: string }[];
    mcqs: { question: string; options: string[]; correctAnswer: string; explanation: string }[];
  };
  studySuggestions: Array<{ topic: string; title: string; url: string; snippet: string }>;
  isFetchingSuggestions: boolean;
  onFetchSuggestions: (query?: string) => void;
  notesTextareaRef: React.RefObject<HTMLTextAreaElement>;
  chatHistory?: any[];
  whiteboardText?: string;
  onConvertToMindMap?: (selectedText?: string) => void;
}

const studyTabVariants = {
  initial: { opacity: 0, x: 15 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -15, transition: { duration: 0.2, ease: "easeIn" } }
};

export const StudyPadPanel: React.FC<StudyPadPanelProps> = ({
  isOpen,
  onClose,
  studyPadText,
  setStudyPadText,
  notesMode,
  setNotesMode,
  notesStatusAlert,
  isSavingNotes,
  onSaveNotesToMemory,
  onGenerateStudyPack,
  isGeneratingPack,
  studyPack,
  studySuggestions,
  isFetchingSuggestions,
  onFetchSuggestions,
  notesTextareaRef,
  chatHistory = [],
  whiteboardText = "",
  onConvertToMindMap = (_text?: string) => {}
}) => {
  const [studyActiveTab, setStudyActiveTab] = useState<"notes" | "collab" | "flashcards" | "quiz" | "materials">("notes");
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [answeredMCQs, setAnsweredMCQs] = useState<Record<number, string>>({});
  const [highlightedText, setHighlightedText] = useState<string>("");

  const handleTextSelection = () => {
    if (notesTextareaRef.current) {
      const start = notesTextareaRef.current.selectionStart;
      const end = notesTextareaRef.current.selectionEnd;
      if (start !== end) {
        const sel = notesTextareaRef.current.value.substring(start, end).trim();
        if (sel.length > 2) {
          setHighlightedText(sel);
          return;
        }
      }
    }
    const winSel = window.getSelection()?.toString().trim();
    if (winSel && winSel.length > 2) {
      setHighlightedText(winSel);
    } else {
      setHighlightedText("");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-0 right-0 h-full w-[440px] max-w-full z-50 bg-slate-950/95 border-l border-white/10 flex flex-col backdrop-blur-2xl shadow-[0_0_100px_rgba(52,211,153,0.15)] overflow-hidden"
        >
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/15 rounded-xl text-emerald-400">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">Exam Preparation Pad</h3>
                </div>
                <p className="text-sm font-semibold text-white">Your Personal Study Guide</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500 hover:border-rose-400 text-slate-400 hover:text-white transition duration-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Floating Status Notification Overlay */}
          <AnimatePresence>
            {notesStatusAlert && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] flex justify-center w-full max-w-xs px-4 pointer-events-none"
              >
                <div className="px-4 py-2.5 border border-emerald-500/30 bg-emerald-950/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-2xl text-[11px] font-mono text-emerald-300 flex items-center gap-2 font-bold animate-pulse">
                  <Check size={13} className="text-emerald-400 shrink-0" />
                  <span className="leading-tight">{notesStatusAlert}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Study Pad Section Tabs */}
          <div className="flex border-b border-white/5 bg-slate-950/40 px-4 py-2 gap-1 shrink-0">
            <button
              onClick={() => setStudyActiveTab("notes")}
              className={`flex-1 py-1 px-1.5 text-center text-[10px] font-mono rounded-lg transition border cursor-pointer uppercase font-bold tracking-wider ${
                studyActiveTab === "notes"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-transparent border-transparent text-slate-400 hover:text-white"
              }`}
            >
              📝 Notes
            </button>
            <button
              onClick={() => setStudyActiveTab("collab")}
              className={`flex-1 py-1 px-1.5 text-center text-[10px] font-mono rounded-lg transition border cursor-pointer uppercase font-bold tracking-wider ${
                studyActiveTab === "collab"
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                  : "bg-transparent border-transparent text-slate-400 hover:text-white"
              }`}
            >
              🤝 Labs
            </button>
            <button
              onClick={() => setStudyActiveTab("flashcards")}
              disabled={!studyPack || !studyPack.flashcards?.length}
              className={`flex-1 py-1 px-1.5 text-center text-[10px] font-mono rounded-lg transition border cursor-pointer uppercase font-bold tracking-wider disabled:opacity-25 disabled:cursor-not-allowed ${
                studyActiveTab === "flashcards"
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                  : "bg-transparent border-transparent text-slate-400 hover:text-white"
              }`}
            >
              🎴 Cards ({studyPack?.flashcards?.length || 0})
            </button>
            <button
              onClick={() => setStudyActiveTab("quiz")}
              disabled={!studyPack || !studyPack.mcqs?.length}
              className={`flex-1 py-1 px-1.5 text-center text-[10px] font-mono rounded-lg transition border cursor-pointer uppercase font-bold tracking-wider disabled:opacity-25 disabled:cursor-not-allowed ${
                studyActiveTab === "quiz"
                  ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                  : "bg-transparent border-transparent text-slate-400 hover:text-white"
              }`}
            >
              🧠 Quiz ({studyPack?.mcqs?.length || 0})
            </button>
          </div>

          {/* Main Interactive Box */}
          <div className="flex-1 flex flex-col min-h-0">
            {isGeneratingPack ? (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-slate-950/20">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500/15 border-t-emerald-400 animate-spin mb-4" />
                <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest font-bold">A.I. COMPILES ACTIVE...</span>
                <p className="text-xs text-slate-400 mt-2 max-w-xs font-sans leading-relaxed">
                  MAHR is analyzing your formulas, concepts, and notes to construct interactive digital flashcards and practice questions!
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {studyActiveTab === "notes" && (
                  <motion.div
                    key="notes"
                    variants={studyTabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex-1 flex flex-col min-h-0 overflow-hidden"
                  >
                    {/* Markdown & Math Toolbar */}
                    <div className="px-6 py-2 border-b border-white/5 bg-slate-900/40 flex justify-between items-center shrink-0 flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setNotesMode("edit")}
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border flex items-center gap-1 transition cursor-pointer ${
                            notesMode === "edit"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-transparent border-transparent text-slate-400 hover:text-white"
                          }`}
                        >
                          <Edit size={11} />
                          <span>EDIT</span>
                        </button>
                        <button
                          onClick={() => setNotesMode("preview")}
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border flex items-center gap-1 transition cursor-pointer ${
                            notesMode === "preview"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-transparent border-transparent text-slate-400 hover:text-white"
                          }`}
                        >
                          <Eye size={11} />
                          <span>PREVIEW</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onConvertToMindMap(highlightedText || studyPadText)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                          title="Convert highlighted text or full notes into an interactive Mind Map on Whiteboard"
                        >
                          <GitFork size={11} className="text-cyan-400 animate-pulse" />
                          <span>{highlightedText ? "Map Selection 🗺️" : "Mind Map 🗺️"}</span>
                        </button>

                        <button
                          onClick={onGenerateStudyPack}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Sparkles size={11} className="text-emerald-400 animate-spin-slow" />
                          <span>Flashcards</span>
                        </button>

                        <button
                          onClick={onSaveNotesToMemory}
                          disabled={isSavingNotes}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        >
                          {isSavingNotes ? <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <Award size={11} />}
                          <span>Memorize</span>
                        </button>
                      </div>
                    </div>

                    {/* Floating Selection Banner */}
                    <AnimatePresence>
                      {highlightedText && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="px-6 py-2 bg-gradient-to-r from-cyan-950/90 to-purple-950/90 border-b border-cyan-500/30 backdrop-blur-md flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2 truncate max-w-[260px]">
                            <Highlighter size={13} className="text-cyan-400 shrink-0 animate-bounce" />
                            <span className="text-slate-300 truncate">
                              "{highlightedText}"
                            </span>
                          </div>
                          <button
                            onClick={() => onConvertToMindMap(highlightedText)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[10px] font-bold flex items-center gap-1 shrink-0 transition shadow-lg cursor-pointer"
                          >
                            <GitFork size={11} />
                            <span>Convert to Mind Map</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Main Note Textarea / Preview Box */}
                    <div 
                      className="flex-1 p-6 overflow-y-auto"
                      onMouseUp={handleTextSelection}
                      onKeyUp={handleTextSelection}
                    >
                      {notesMode === "edit" ? (
                        <textarea
                          ref={notesTextareaRef}
                          value={studyPadText}
                          onChange={(e) => setStudyPadText(e.target.value)}
                          onSelect={handleTextSelection}
                          onMouseUp={handleTextSelection}
                          onKeyUp={handleTextSelection}
                          placeholder="Type or dictate your study notes, equations, and cheat sheet here... Highlight any text to generate an instant Mind Map on the Whiteboard!"
                          className="w-full h-full bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-cyan-500/30 selection:text-white"
                        />
                      ) : (
                        <div 
                          className="prose prose-invert prose-emerald text-xs max-w-none font-sans leading-relaxed selection:bg-cyan-500/30 selection:text-white cursor-text"
                          onMouseUp={handleTextSelection}
                        >
                          <div dangerouslySetInnerHTML={{ __html: formatMathText(studyPadText) }} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {studyActiveTab === "collab" && (
                  <motion.div
                    key="collab"
                    variants={studyTabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex-1 flex flex-col min-h-0 overflow-y-auto"
                  >
                    <MahrCollaborationSuite
                      chatHistory={chatHistory}
                      studyPadText={studyPadText}
                      setStudyPadText={setStudyPadText}
                      whiteboardText={whiteboardText}
                    />
                  </motion.div>
                )}

                {studyActiveTab === "flashcards" && studyPack.flashcards.length > 0 && (
                  <motion.div
                    key="flashcards"
                    variants={studyTabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex-1 p-6 flex flex-col justify-between items-center"
                  >
                    <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Card {activeCardIndex + 1} of {studyPack.flashcards.length}</span>
                      <span className="text-emerald-400">Click card to flip</span>
                    </div>

                    <div
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="w-full h-64 my-auto p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-300 hover:border-emerald-400/60"
                    >
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 font-bold">
                        {isCardFlipped ? "ANSWER / EXPLANATION" : "QUESTION / PROMPT"}
                      </span>
                      <p className="text-base font-semibold text-white leading-relaxed">
                        {isCardFlipped
                          ? studyPack.flashcards[activeCardIndex].back
                          : studyPack.flashcards[activeCardIndex].front}
                      </p>
                    </div>

                    <div className="w-full flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          setIsCardFlipped(false);
                          setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : studyPack.flashcards.length - 1));
                        }}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold transition border border-white/10 cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          setIsCardFlipped(false);
                          setActiveCardIndex((prev) => (prev < studyPack.flashcards.length - 1 ? prev + 1 : 0));
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-mono font-bold transition hover:bg-emerald-400 cursor-pointer"
                      >
                        Next Card
                      </button>
                    </div>
                  </motion.div>
                )}

                {studyActiveTab === "quiz" && studyPack.mcqs.length > 0 && (
                  <motion.div
                    key="quiz"
                    variants={studyTabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex-1 p-6 overflow-y-auto flex flex-col gap-6"
                  >
                    {studyPack.mcqs.map((q, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
                        <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                          Question {idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-white leading-snug">{q.question}</h4>
                        <div className="flex flex-col gap-2 mt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = answeredMCQs[idx] === opt;
                            const isCorrect = opt === q.correctAnswer;
                            const showResult = Boolean(answeredMCQs[idx]);

                            return (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  if (!answeredMCQs[idx]) {
                                    setAnsweredMCQs({ ...answeredMCQs, [idx]: opt });
                                    if (opt === q.correctAnswer) setQuizScore(quizScore + 1);
                                  }
                                }}
                                disabled={Boolean(answeredMCQs[idx])}
                                className={`w-full p-2.5 rounded-lg text-xs text-left font-mono transition flex items-center justify-between border cursor-pointer ${
                                  showResult
                                    ? isCorrect
                                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                                      : isSelected
                                      ? "bg-rose-500/20 border-rose-500/50 text-rose-200"
                                      : "bg-white/5 border-white/5 text-slate-400"
                                    : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20"
                                }`}
                              >
                                <span>{opt}</span>
                                {showResult && isCorrect && <Check size={14} className="text-emerald-400" />}
                              </button>
                            );
                          })}
                        </div>
                        {answeredMCQs[idx] && (
                          <p className="text-[11px] text-slate-300 font-sans mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                            💡 <span className="font-semibold text-emerald-400">Explanation:</span> {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
