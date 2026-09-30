import React, { useState } from "react";
import { X, Sparkles, Terminal, Layers, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink } from "lucide-react";
import { usePresentationPipeline } from "../../../hooks/slides/usePresentationPipeline";
import { PipelineStage } from "../../../services/slides/pipeline/pipelineTypes";
import { PipelineFlowDiagram } from "./PipelineFlowDiagram";
import { Step1GeminiPlannerView } from "./Step1GeminiPlannerView";
import { Step2AssetCreationView } from "./Step2AssetCreationView";
import { Step3TemplateCloningView } from "./Step3TemplateCloningView";
import { Step4SlidesInjectionView } from "./Step4SlidesInjectionView";
import { MahrVoicePresentationBar } from "./MahrVoicePresentationBar";

interface SlidePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  accessToken?: string;
}

export const SlidePipelineModal: React.FC<SlidePipelineModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = "FMC Commodity Trends & Price Volatility",
  accessToken
}) => {
  const {
    pipelineState,
    executePipeline,
    selectTemplate,
    resetPipeline
  } = usePresentationPipeline();

  const [activeTab, setActiveTab] = useState<PipelineStage | "logs">("step1_planning");

  if (!isOpen) return null;

  const isRunning = ["step1_planning", "step2_assets", "step3_cloning", "step4_injection"].includes(
    pipelineState.currentStage
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">MAHR PRESENTATION STUDIO</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Multi-Engine Pipeline
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gemini AI Engine • Manim Python Renderer • Google Drive Cloner • Google Slides API Injector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pipelineState.clonedPresentationUrl && (
              <a
                href={pipelineState.clonedPresentationUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Google Slides
              </a>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-900 h-1 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${pipelineState.stageProgress}%` }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Architecture Pipeline Flow Diagram */}
          <PipelineFlowDiagram
            currentStage={pipelineState.currentStage}
            onSelectStage={(stage) => setActiveTab(stage)}
          />

          {/* Active Log Status Chip */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-2 truncate">
              {isRunning ? (
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              ) : pipelineState.currentStage === "completed" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
              )}
              <span className="truncate">{pipelineState.activeLog}</span>
            </div>
            <span className="text-[11px] text-cyan-400 font-bold ml-2 shrink-0">
              {pipelineState.stageProgress}%
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("step1_planning")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "step1_planning"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              1. Gemini Plan & Schema
            </button>

            <button
              onClick={() => setActiveTab("step2_assets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "step2_assets"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              2. Manim & Assets
            </button>

            <button
              onClick={() => setActiveTab("step3_cloning")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "step3_cloning"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              3. Master Drive Templates
            </button>

            <button
              onClick={() => setActiveTab("step4_injection")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "step4_injection"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              4. Slides API Injection
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "logs"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 inline mr-1" /> Telemetry Logs ({pipelineState.logs.length})
            </button>
          </div>

          {/* Active Tab View Body */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 min-h-[300px]">
            {activeTab === "step1_planning" && (
              <Step1GeminiPlannerView
                deck={pipelineState.deck}
                manimAssets={pipelineState.manimAssets}
                chartAssets={pipelineState.chartAssets}
                youtubeAssets={pipelineState.youtubeAssets}
              />
            )}

            {activeTab === "step2_assets" && (
              <Step2AssetCreationView
                manimAssets={pipelineState.manimAssets}
                chartAssets={pipelineState.chartAssets}
                youtubeAssets={pipelineState.youtubeAssets}
              />
            )}

            {activeTab === "step3_cloning" && (
              <Step3TemplateCloningView
                selectedTemplate={pipelineState.selectedTemplate}
                onSelectTemplate={selectTemplate}
                clonedPresentationId={pipelineState.clonedPresentationId}
                clonedPresentationUrl={pipelineState.clonedPresentationUrl}
              />
            )}

            {activeTab === "step4_injection" && (
              <Step4SlidesInjectionView
                deck={pipelineState.deck}
                manimAssets={pipelineState.manimAssets}
                chartAssets={pipelineState.chartAssets}
                youtubeAssets={pipelineState.youtubeAssets}
                clonedPresentationUrl={pipelineState.clonedPresentationUrl}
              />
            )}

            {activeTab === "logs" && (
              <div className="space-y-1 font-mono text-xs max-h-80 overflow-y-auto pr-1">
                {pipelineState.logs.map((lg, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded flex items-start gap-2 ${
                      lg.type === "error"
                        ? "bg-rose-950/40 text-rose-300"
                        : lg.type === "success"
                        ? "bg-emerald-950/40 text-emerald-300"
                        : "bg-slate-900/50 text-slate-300"
                    }`}
                  >
                    <span className="text-[10px] text-slate-500">{lg.timestamp}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400">
                      {lg.stage}
                    </span>
                    <span>{lg.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Mahr AI Personal Assistant Bar */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800">
          <MahrVoicePresentationBar
            onStartPipeline={(prompt, count) => executePipeline(prompt, count, accessToken)}
            isRunning={isRunning}
          />
        </div>
      </div>
    </div>
  );
};
