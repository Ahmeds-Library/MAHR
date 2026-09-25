import React, { useState } from "react";
import { X, Sparkles, Wand2, Loader2, Image as ImageIcon, Download, Stamp } from "lucide-react";

interface WhiteboardAIImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStampToCanvas: (imageUrl: string) => void;
}

export const WhiteboardAIImageModal: React.FC<WhiteboardAIImageModalProps> = ({
  isOpen,
  onClose,
  onStampToCanvas
}) => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "1:1">("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt.trim()}. Technical scientific diagram, academic illustration, clean chalkboard style contrast, high detail.`,
          aspectRatio,
          numberOfImages: 2
        })
      });
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        setGeneratedImages(data.images);
        setSelectedImage(data.images[0]);
      } else {
        setError(data.error || "Could not synthesize image. Please try another prompt.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <div
        className="w-full max-w-xl rounded-3xl bg-zinc-950/95 border border-purple-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-5 flex flex-col gap-4 text-white overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-md">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">Gemini AI Visual Studio</h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  gemini-3.1-flash-image
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">Synthesize diagrams & stamp them onto the chalkboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input & Config */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Visual Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Optical refraction through glass prism with rainbow spectrum, annotated technical diagram..."
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-mono">Aspect Ratio:</span>
              {(["16:9", "4:3", "1:1"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    aspectRatio === r
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              <span>{isGenerating ? "Synthesizing..." : "Generate Visual"}</span>
            </button>
          </div>

          {error && (
            <div className="text-xs text-rose-400 font-mono bg-rose-950/40 border border-rose-500/20 p-2 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Results Preview & Stamp Action */}
        {generatedImages.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <label className="text-[11px] font-mono text-purple-400 uppercase tracking-wider block">
              Generated Visual Artifacts
            </label>
            <div className="grid grid-cols-2 gap-3">
              {generatedImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`group relative aspect-video rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedImage === img
                      ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.02]"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <img src={img} alt={`Generated visual ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {selectedImage && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    onStampToCanvas(selectedImage);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Stamp size={14} />
                  <span>Stamp onto Blackboard</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
