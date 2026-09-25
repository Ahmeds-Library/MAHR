import React, { useState } from "react";
import { FileText, Clock, Sparkles, RefreshCw } from "lucide-react";
import { Slide } from "../../../../services/slides/slideTypes";

interface TabNotesProps {
  slide: Slide;
  onUpdateSlide: (partial: Partial<Slide>) => void;
}

export const TabNotes: React.FC<TabNotesProps> = ({ slide, onUpdateSlide }) => {
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const notes = slide.speakerNotes || "";

  // Calculate words and estimated talk time (avg 130 words/minute)
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round((wordCount / 130) * 60);

  const handleGenerateAINotes = () => {
    setIsGeneratingNotes(true);
    setTimeout(() => {
      const generated = `In this slide on "${slide.title || "key concept"}", we focus on three strategic dimensions. ${
        slide.bullets && slide.bullets.length > 0
          ? `First, emphasize ${slide.bullets[0].toLowerCase()}. Next, draw attention to how this solves our foundational challenges.`
          : "Emphasize key takeaways and pause to allow the audience to digest the empirical evidence."
      } Conclude by transitioning smoothly into the next phase of implementation.`;

      onUpdateSlide({ speakerNotes: generated });
      setIsGeneratingNotes(false);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Header Info & Time Estimate */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Clock size={14} className="text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              {estimatedSeconds < 60 ? `${estimatedSeconds}s` : `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`}
            </div>
            <div className="text-[10px] text-zinc-400">Pacing (130 wpm)</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-semibold text-amber-300">
            {wordCount} words
          </div>
          <div className="text-[10px] text-zinc-400">Script length</div>
        </div>
      </div>

      {/* AI Draft Button */}
      <button
        type="button"
        onClick={handleGenerateAINotes}
        disabled={isGeneratingNotes}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all cursor-pointer"
      >
        {isGeneratingNotes ? (
          <>
            <RefreshCw size={13} className="animate-spin" />
            <span>Drafting Speaker Script...</span>
          </>
        ) : (
          <>
            <Sparkles size={13} className="text-amber-400" />
            <span>AI Draft Narration for this Slide</span>
          </>
        )}
      </button>

      {/* Script Textarea */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
          <FileText size={12} className="text-amber-400" />
          Presenter Talking Points & Teleprompter
        </label>
        <textarea
          rows={8}
          value={notes}
          onChange={(e) => onUpdateSlide({ speakerNotes: e.target.value })}
          placeholder="Type what you will say during this slide. When you enter presentation mode, these notes appear in the teleprompter..."
          className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-zinc-200 text-xs leading-relaxed placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 resize-none font-sans"
        />
      </div>

      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-zinc-400 leading-normal">
        <span className="text-amber-400 font-medium">Tip:</span> These speaker notes automatically sync to your exported Google Slides speaker notes!
      </div>
    </div>
  );
};
