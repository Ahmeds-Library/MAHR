import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Sparkles, Brain, Film, BarChart3, Youtube, Copy, Send, CheckCircle2 } from "lucide-react";
import { PipelineStage } from "../../../services/slides/pipeline/pipelineTypes";

interface PipelineFlowDiagramProps {
  currentStage: PipelineStage;
  onSelectStage?: (stage: PipelineStage) => void;
}

export const PipelineFlowDiagram: React.FC<PipelineFlowDiagramProps> = ({
  currentStage,
  onSelectStage
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP subtle pulsing animation on active step
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(".active-glow", {
        boxShadow: "0 0 25px rgba(6, 182, 212, 0.6), inset 0 0 15px rgba(6, 182, 212, 0.3)",
        borderColor: "rgba(6, 182, 212, 0.9)",
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }, containerRef);
    return () => ctx.revert();
  }, [currentStage]);

  const isStepActive = (stage: PipelineStage) => currentStage === stage;
  const isStepDone = (stage: PipelineStage) => {
    const order: PipelineStage[] = ["idle", "step1_planning", "step2_assets", "step3_cloning", "step4_injection", "completed"];
    return order.indexOf(currentStage) > order.indexOf(stage);
  };

  return (
    <div ref={containerRef} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Automated Mahr Presentation Pipeline Architecture
          </span>
        </div>
        <div className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono">
          Stage: {currentStage.toUpperCase()}
        </div>
      </div>

      {/* Interactive Responsive Architecture Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {/* Step 1: Gemini AI Engine */}
        <div
          onClick={() => onSelectStage?.("step1_planning")}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-300 ${
            isStepActive("step1_planning")
              ? "active-glow bg-cyan-950/40 border-cyan-400"
              : isStepDone("step1_planning")
              ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300"
              : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">Step 1</span>
            {isStepDone("step1_planning") ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Brain className={`w-4 h-4 ${isStepActive("step1_planning") ? "text-cyan-400 animate-pulse" : "text-slate-400"}`} />
            )}
          </div>
          <h4 className="text-xs font-bold text-slate-200">Gemini AI Engine</h4>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Parses topic prompt, writes slide schema JSON & dispatches asset code.
          </p>
        </div>

        {/* Step 2: Core Asset Creation */}
        <div
          onClick={() => onSelectStage?.("step2_assets")}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-300 ${
            isStepActive("step2_assets")
              ? "active-glow bg-purple-950/40 border-purple-400"
              : isStepDone("step2_assets")
              ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300"
              : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">Step 2</span>
            {isStepDone("step2_assets") ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <div className="flex items-center gap-1">
                <Film className="w-3 h-3 text-purple-400" />
                <BarChart3 className="w-3 h-3 text-emerald-400" />
                <Youtube className="w-3 h-3 text-rose-400" />
              </div>
            )}
          </div>
          <h4 className="text-xs font-bold text-slate-200">Asset Creation Hub</h4>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Renders Manim Python (.mp4), builds FMC charts & searches YouTube.
          </p>
        </div>

        {/* Step 3: Base Template Cloning */}
        <div
          onClick={() => onSelectStage?.("step3_cloning")}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-300 ${
            isStepActive("step3_cloning")
              ? "active-glow bg-amber-950/40 border-amber-400"
              : isStepDone("step3_cloning")
              ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300"
              : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">Step 3</span>
            {isStepDone("step3_cloning") ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className={`w-4 h-4 ${isStepActive("step3_cloning") ? "text-amber-400 animate-pulse" : "text-slate-400"}`} />
            )}
          </div>
          <h4 className="text-xs font-bold text-slate-200">Google Drive Cloner</h4>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Clones master presentation template with pre-baked Fade/Slide/Zoom transitions.
          </p>
        </div>

        {/* Step 4: Smart Asset Injection */}
        <div
          onClick={() => onSelectStage?.("step4_injection")}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-300 ${
            isStepActive("step4_injection")
              ? "active-glow bg-cyan-950/40 border-cyan-400"
              : isStepDone("step4_injection")
              ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300"
              : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">Step 4</span>
            {isStepDone("step4_injection") ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Send className={`w-4 h-4 ${isStepActive("step4_injection") ? "text-cyan-400 animate-pulse" : "text-slate-400"}`} />
            )}
          </div>
          <h4 className="text-xs font-bold text-slate-200">Slides API Injector</h4>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Runs replaceAllText, createVideo, and createImage commands into final PPT.
          </p>
        </div>
      </div>
    </div>
  );
};
