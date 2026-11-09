/**
 * Layer 3 UI — Step 2: Interactive AI Outline Review & Editor
 * Allows users to edit slide titles, bullet points, target layouts, reorder slides, or add/remove slides
 * before generating the full presentation.
 */

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Layout,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import {
  PresentonCitation,
  PresentonLayoutType,
  PresentonOutlineItem
} from "../../layer1_data/presentonTypes";
import { PRESENTON_LAYOUT_CATALOG } from "../../layer1_data/presentonStarters";

interface Step2OutlineEditorProps {
  deckTitle: string;
  deckSubtitle: string;
  onUpdateDeckMeta: (title: string, subtitle: string) => void;
  outline: PresentonOutlineItem[];
  citations: PresentonCitation[];
  onUpdateOutlineItem: (index: number, updated: PresentonOutlineItem) => void;
  onMoveOutlineItem: (index: number, direction: "up" | "down") => void;
  onDeleteOutlineItem: (index: number) => void;
  onAddOutlineItem: () => void;
  onBackToInput: () => void;
  onRegenerateOutline: () => void;
  onContinueToTheme: () => void;
  isRegenerating: boolean;
}

export const Step2OutlineEditor: React.FC<Step2OutlineEditorProps> = ({
  deckTitle,
  deckSubtitle,
  onUpdateDeckMeta,
  outline,
  citations,
  onUpdateOutlineItem,
  onMoveOutlineItem,
  onDeleteOutlineItem,
  onAddOutlineItem,
  onBackToInput,
  onRegenerateOutline,
  onContinueToTheme,
  isRegenerating
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll(".presenton-outline-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }
    );
  }, [outline.length]);

  const handlePointChange = (slideIdx: number, pointIdx: number, value: string) => {
    const item = outline[slideIdx];
    const nextPoints = [...item.keyPoints];
    nextPoints[pointIdx] = value;
    onUpdateOutlineItem(slideIdx, { ...item, keyPoints: nextPoints });
  };

  const handleAddPoint = (slideIdx: number) => {
    const item = outline[slideIdx];
    onUpdateOutlineItem(slideIdx, {
      ...item,
      keyPoints: [...item.keyPoints, "New key point for this slide"]
    });
  };

  const handleRemovePoint = (slideIdx: number, pointIdx: number) => {
    const item = outline[slideIdx];
    if (item.keyPoints.length <= 1) return;
    onUpdateOutlineItem(slideIdx, {
      ...item,
      keyPoints: item.keyPoints.filter((_, i) => i !== pointIdx)
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Step 2 of 4 • Interactive Outline Architect
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
            Review & Customize Your Slide Outline ({outline.length} Slides)
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToInput}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Prompt</span>
          </button>

          <button
            type="button"
            onClick={onRegenerateOutline}
            disabled={isRegenerating}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            <span>Re-Generate</span>
          </button>

          <button
            type="button"
            onClick={onContinueToTheme}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <span>Select Theme & Build Slides</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deck Title & Subtitle Editor */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 space-y-3">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Presentation Title
          </label>
          <input
            type="text"
            value={deckTitle}
            onChange={(e) => onUpdateDeckMeta(e.target.value, deckSubtitle)}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-base font-bold text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Subtitle / Framing Context
          </label>
          <input
            type="text"
            value={deckSubtitle}
            onChange={(e) => onUpdateDeckMeta(deckTitle, e.target.value)}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Web Search Citations if available */}
        {citations.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-emerald-400 mb-1.5">
              Grounded with {citations.length} Live Web Sources:
            </div>
            <div className="flex flex-wrap gap-2">
              {citations.map((c, i) => (
                <a
                  key={i}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-indigo-300 hover:border-indigo-500/40"
                >
                  <span className="truncate max-w-[200px]">{c.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide-by-Slide Editable Cards */}
      <div ref={listRef} className="space-y-4">
        {outline.map((item, idx) => (
          <div
            key={item.id}
            className="presenton-outline-card bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <span className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) =>
                    onUpdateOutlineItem(idx, { ...item, title: e.target.value })
                  }
                  className="w-full bg-slate-950/90 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none"
                />
              </div>

              {/* Target Layout Selector & Reorder Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
                  <Layout className="w-3.5 h-3.5 text-indigo-400" />
                  <select
                    value={item.recommendedLayout}
                    onChange={(e) =>
                      onUpdateOutlineItem(idx, {
                        ...item,
                        recommendedLayout: e.target.value as PresentonLayoutType
                      })
                    }
                    className="bg-transparent text-xs text-slate-200 focus:outline-none"
                  >
                    {PRESENTON_LAYOUT_CATALOG.map((l) => (
                      <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMoveOutlineItem(idx, "up")}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-800"
                  title="Move Slide Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === outline.length - 1}
                  onClick={() => onMoveOutlineItem(idx, "down")}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-800"
                  title="Move Slide Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={outline.length <= 2}
                  onClick={() => onDeleteOutlineItem(idx)}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/60 disabled:opacity-30 text-slate-400 hover:text-rose-400 border border-slate-800"
                  title="Remove Slide"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Key Bullet Points */}
            <div className="space-y-2 pl-0 sm:pl-11">
              {item.keyPoints.map((pt, pIdx) => (
                <div key={pIdx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <input
                    type="text"
                    value={pt}
                    onChange={(e) => handlePointChange(idx, pIdx, e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  {item.keyPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(idx, pIdx)}
                      className="text-slate-500 hover:text-rose-400 text-xs px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddPoint(idx)}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 pt-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Point</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Add Slide + Continue Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onAddOutlineItem}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Slide to Outline</span>
        </button>

        <button
          type="button"
          onClick={onContinueToTheme}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25"
        >
          <span>Continue to Template & Theme Selection</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
