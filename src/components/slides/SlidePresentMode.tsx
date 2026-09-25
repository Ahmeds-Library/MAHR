import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { SlideCanvasPreview } from "./SlideCanvasPreview";
import { SlideDeck, SlideTheme } from "../../services/slides/slideTypes";
import { speakUtterance } from "../../services/speechSynthesisService";

interface SlidePresentModeProps {
  deck: SlideDeck;
  theme: SlideTheme;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectIndex: (index: number) => void;
}

export const SlidePresentMode: React.FC<SlidePresentModeProps> = ({
  deck,
  theme,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onSelectIndex
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [showHelp, setShowHelp] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = deck.slides[currentIndex] || deck.slides[0];
  const totalSlides = deck.slides.length;

  // Stopwatch timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // GSAP 3D perspective transition on slide change
  useEffect(() => {
    if (!stageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        stageRef.current,
        { opacity: 0, scale: 0.96, rotateY: 2 },
        { opacity: 1, scale: 1, rotateY: 0, duration: 0.45, ease: "power2.out" }
      );
    });
    return () => ctx.revert();
  }, [currentIndex]);

  // Voice narration toggle
  const toggleNarration = () => {
    if (isNarrating) {
      window.speechSynthesis?.cancel();
      setIsNarrating(false);
      return;
    }

    const narrationText =
      currentSlide.speakerNotes ||
      `${currentSlide.title}. ${currentSlide.subtitle || ""}. ${
        currentSlide.bullets?.join(". ") || ""
      }`;

    setIsNarrating(true);
    speakUtterance({
      text: narrationText,
      onEnd: () => {
        setIsNarrating(false);
      }
    });
  };

  // Mouse move for laser pointer
  const handleMouseMove = (e: React.MouseEvent) => {
    if (laserActive) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        onPrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes((prev) => !prev);
      } else if (e.key === "l" || e.key === "L") {
        setLaserActive((prev) => !prev);
      } else if (e.key === "v" || e.key === "V") {
        toggleNarration();
      } else if (e.key === "?") {
        setShowHelp((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, onClose, isNarrating, currentSlide]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 bg-[#050510] flex flex-col justify-between overflow-hidden select-none ${
        laserActive ? "cursor-none" : "cursor-default"
      }`}
    >
      {/* Laser Pointer Dot */}
      {laserActive && (
        <div
          className="fixed pointer-events-none z-[100] w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out shadow-[0_0_20px_#ef4444,0_0_40px_#dc2626]"
          style={{
            left: `${laserPos.x}px`,
            top: `${laserPos.y}px`,
            backgroundColor: "#ef4444"
          }}
        />
      )}

      {/* Top Floating Control Bar */}
      <div className="relative z-30 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold tracking-wider text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles size={12} />
            MAHR PRESENTATION STAGE
          </span>
          <h2 className="text-sm font-semibold text-zinc-300 truncate max-w-md hidden sm:block">
            {deck.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-xs font-mono text-zinc-300">
            <Clock size={13} className="text-amber-400" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          {/* Laser Pointer Toggle */}
          <button
            onClick={() => setLaserActive(!laserActive)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              laserActive
                ? "bg-rose-500 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white"
            }`}
            title="Toggle Laser Pointer (Key: L)"
          >
            <Zap size={13} className={laserActive ? "fill-white" : ""} />
            <span className="hidden sm:inline">Laser</span>
          </button>

          {/* Voice Narration Toggle */}
          <button
            onClick={toggleNarration}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              isNarrating
                ? "bg-amber-500 border-amber-400 text-zinc-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white"
            }`}
            title="Mahr Voice Narration (Key: V)"
          >
            {isNarrating ? <VolumeX size={13} /> : <Volume2 size={13} className="text-amber-400" />}
            <span className="hidden sm:inline">{isNarrating ? "Stop Voice" : "Narrate"}</span>
          </button>

          {/* Toggle Speaker Notes */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              showNotes
                ? "bg-amber-600 border-amber-400 text-white"
                : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white"
            }`}
            title="Toggle Speaker Teleprompter (Key: N)"
          >
            <FileText size={13} />
            <span className="hidden sm:inline">Notes</span>
          </button>

          {/* Help Overlay Toggle */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle size={15} />
          </button>

          {/* Close / Exit Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Exit Presentation (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Slide Stage Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div ref={stageRef} className="w-full max-w-6xl aspect-video max-h-[82vh]">
          <SlideCanvasPreview
            slide={currentSlide}
            theme={theme}
            totalSlides={totalSlides}
            currentSlideIndex={currentIndex}
          />
        </div>

        {/* Floating Speaker Notes Teleprompter HUD */}
        {showNotes && (
          <div className="absolute right-6 bottom-20 w-80 sm:w-96 max-h-72 bg-zinc-950/95 border border-amber-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-40 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 size={13} />
                Speaker Teleprompter
              </span>
              <button
                onClick={() => setShowNotes(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {currentSlide.speakerNotes || "No speaker notes recorded for this slide. Use Mahr AI or the editor to add talking points."}
            </p>
          </div>
        )}

        {/* Keyboard Shortcuts Help Overlay */}
        {showHelp && (
          <div className="absolute left-6 bottom-20 w-72 bg-zinc-950/95 border border-white/20 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-40 space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-xs font-mono font-bold text-white uppercase">Shortcuts</span>
              <button onClick={() => setShowHelp(false)} className="text-zinc-500 hover:text-white text-xs cursor-pointer">
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
              <span className="text-zinc-400">Space / →</span>
              <span className="text-white">Next Slide</span>
              <span className="text-zinc-400">←</span>
              <span className="text-white">Previous Slide</span>
              <span className="text-zinc-400">N</span>
              <span className="text-white">Toggle Notes</span>
              <span className="text-zinc-400">L</span>
              <span className="text-white">Laser Pointer</span>
              <span className="text-zinc-400">V</span>
              <span className="text-white">Voice Narration</span>
              <span className="text-zinc-400">Esc</span>
              <span className="text-white">Exit Present</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation & Progress HUD */}
      <div className="relative z-30 px-6 py-4 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs font-medium text-zinc-300 disabled:opacity-30 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          {/* Slide Pill Dots Indicator */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm px-2">
            {deck.slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelectIndex(idx)}
                className={`transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "w-6 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                    : "w-2 h-2 rounded-full bg-zinc-700 hover:bg-zinc-500"
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            disabled={currentIndex === totalSlides - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-zinc-950 disabled:opacity-30 transition-colors shadow-lg shadow-amber-500/30 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Smooth Bottom Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
