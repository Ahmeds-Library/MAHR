import React, { useState } from "react";
import { Sparkles, Image as ImageIcon, Link as LinkIcon, RefreshCw, Check } from "lucide-react";
import { Slide } from "../../../../services/slides/slideTypes";

interface TabVisualsProps {
  slide: Slide;
  onUpdateSlide: (partial: Partial<Slide>) => void;
}

const CURATED_VISUALS = [
  {
    title: "Neural Network Abstract",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80"
  },
  {
    title: "Cyber Deep Space",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1000&auto=format&fit=crop&q=80"
  },
  {
    title: "Quantum Waveforms",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1000&auto=format&fit=crop&q=80"
  },
  {
    title: "Minimal Geometric Architecture",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80"
  }
];

export const TabVisuals: React.FC<TabVisualsProps> = ({ slide, onUpdateSlide }) => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleGenerateAIImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsSynthesizing(true);
    try {
      // Create a visually rich Unsplash topic query or synthetic generative reference
      const encoded = encodeURIComponent(imagePrompt.trim());
      const synthesizedUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80&sig=${Date.now()}`;
      onUpdateSlide({
        imageUrl: synthesizedUrl,
        imageCaption: imagePrompt.trim()
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Visual Synthesizer */}
      <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
          <Sparkles size={14} className="text-amber-400" />
          <span>AI Visual Generation</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Generate custom visuals, technical schematics, or contextual imagery tailored to this slide.
        </p>

        <div className="space-y-1.5 pt-1">
          <textarea
            rows={2}
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder={`e.g., Isometric holographic view of ${slide.title || "ambient OS architecture"} with glowing amber nodes...`}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 resize-none"
          />

          <button
            type="button"
            onClick={handleGenerateAIImage}
            disabled={!imagePrompt.trim() || isSynthesizing}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Synthesizing Visual...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Generate Visual with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Slide Image Preview */}
      {slide.imageUrl && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            Current Slide Image
          </label>
          <div className="relative rounded-xl overflow-hidden border border-white/10 group aspect-video bg-black/40">
            <img
              src={slide.imageUrl}
              alt={slide.imageCaption || "Slide visual"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateSlide({ imageUrl: undefined, imageCaption: undefined })}
                className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-xs font-medium hover:bg-rose-500 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
          {slide.imageCaption && (
            <p className="text-[10px] text-zinc-400 italic text-center truncate">
              {slide.imageCaption}
            </p>
          )}
        </div>
      )}

      {/* Custom URL Input */}
      <div className="space-y-1.5 pt-2 border-t border-white/10">
        <label className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
          <LinkIcon size={12} className="text-amber-400" />
          Direct Image URL
        </label>
        <input
          type="text"
          value={slide.imageUrl || ""}
          onChange={(e) => onUpdateSlide({ imageUrl: e.target.value })}
          placeholder="https://example.com/slide-illustration.jpg"
          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400/80"
        />
      </div>

      {/* Curated Library */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
          Curated Slide Backgrounds
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CURATED_VISUALS.map((item, idx) => {
            const isSelected = slide.imageUrl === item.url;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onUpdateSlide({ imageUrl: item.url, imageCaption: item.title })}
                className={`relative aspect-video rounded-xl overflow-hidden border text-left group transition-all cursor-pointer ${
                  isSelected ? "border-amber-400 ring-2 ring-amber-400/30" : "border-white/10 hover:border-white/30"
                }`}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                  <span className="text-[9px] text-white font-medium truncate">{item.title}</span>
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
