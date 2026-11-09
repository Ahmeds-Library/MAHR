/**
 * Layer 3 UI — Fullscreen Cinema Presenter Modal with Mahr Auto-Narration
 */

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX
} from "lucide-react";
import { PresentonDeck, PresentonTheme } from "../../layer1_data/presentonTypes";
import { SlideLayoutRenderer } from "./layouts/SlideLayoutRenderer";
import { speakWithMahrVoice, stopMahrVoice } from "../../layer2_services/presentonVoiceService";

interface FullscreenPresenterModalProps {
  deck: PresentonDeck;
  theme: PresentonTheme;
  initialSlideIndex: number;
  onClose: () => void;
}

export const FullscreenPresenterModal: React.FC<FullscreenPresenterModalProps> = ({
  deck,
  theme,
  initialSlideIndex,
  onClose
}) => {
  const [index, setIndex] = useState(initialSlideIndex);
  const [autoNarrate, setAutoNarrate] = useState(false);

  const slide = deck.slides[index] || deck.slides[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        setIndex((i) => Math.min(deck.slides.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Escape") {
        stopMahrVoice();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deck.slides.length, onClose]);

  useEffect(() => {
    if (!autoNarrate || !slide) return;
    const script = `${slide.title}. ${slide.speakerNotes || slide.bullets.join(". ")}`;
    speakWithMahrVoice(script);
    return () => stopMahrVoice();
  }, [index, autoNarrate, slide]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Floating Controls */}
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            {deck.title}
          </span>
          <span className="text-xs text-slate-400">
            Slide {index + 1} of {deck.slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (autoNarrate) stopMahrVoice();
              setAutoNarrate((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              autoNarrate
                ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            {autoNarrate ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{autoNarrate ? "Mahr Auto-Narration ON" : "Narrate with Mahr"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopMahrVoice();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center 16:9 Slide Stage */}
      <div className="flex-1 flex items-center justify-center my-4 min-h-0">
        <div className="w-full max-w-6xl aspect-video max-h-full">
          <SlideLayoutRenderer
            slide={slide}
            theme={theme}
            totalSlides={deck.slides.length}
            readOnly
          />
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1.5">
          {deck.slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === index ? "w-6 bg-indigo-500" : "w-2 bg-slate-700"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={index === deck.slides.length - 1}
          onClick={() => setIndex((i) => Math.min(deck.slides.length - 1, i + 1))}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
