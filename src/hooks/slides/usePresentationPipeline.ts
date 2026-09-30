import { useState, useCallback } from "react";
import { 
  PipelineStage, 
  PipelineExecutionState, 
  DriveMasterTemplate 
} from "../../services/slides/pipeline/pipelineTypes";
import { runGeminiPresentationPlanner } from "../../services/slides/pipeline/geminiPipelineEngine";
import { renderManimSceneToMp4 } from "../../services/slides/pipeline/manimRenderEngine";
import { 
  MASTER_DRIVE_TEMPLATES, 
  cloneMasterPresentationTemplate 
} from "../../services/slides/pipeline/googleDriveTemplateEngine";
import { injectAssetsIntoClonedPresentation } from "../../services/slides/pipeline/googleSlidesInjectionEngine";
import { speakUtterance } from "../../services/speechSynthesisService";

export function usePresentationPipeline() {
  const [pipelineState, setPipelineState] = useState<PipelineExecutionState>({
    currentStage: "idle",
    stageProgress: 0,
    activeLog: "Mahr Presentation Pipeline standby. Enter a topic or speak to Mahr.",
    logs: [],
    manimAssets: [],
    chartAssets: [],
    youtubeAssets: [],
    selectedTemplate: MASTER_DRIVE_TEMPLATES[0],
    error: null
  });

  const appendLog = useCallback((stage: PipelineStage, message: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setPipelineState((prev) => ({
      ...prev,
      activeLog: message,
      logs: [{ timestamp, stage, message, type }, ...prev.logs.slice(0, 40)]
    }));
  }, []);

  const selectTemplate = useCallback((template: DriveMasterTemplate) => {
    setPipelineState((prev) => ({
      ...prev,
      selectedTemplate: template
    }));
    appendLog("idle", `Selected master template: ${template.name} (${template.transitionType} transitions)`);
  }, [appendLog]);

  const executePipeline = useCallback(async (promptText: string, slideCount: number = 8, accessToken?: string) => {
    if (!promptText || promptText.trim().length === 0) {
      appendLog("error", "Please provide a valid presentation topic or prompt.", "error");
      return;
    }

    try {
      // Announce with Mahr Voice
      speakUtterance({
        text: `Starting presentation pipeline for ${promptText}. Aap ki requested ${slideCount} slides synthesize ho rahi hain. Suggested count 6 se 10 slides hain.`
      });

      // ──────────────────────────────────────────────
      // STEP 1: Content Planning & Asset Generation (Gemini AI Engine)
      // ──────────────────────────────────────────────
      setPipelineState((prev) => ({
        ...prev,
        currentStage: "step1_planning",
        stageProgress: 10,
        error: null
      }));
      appendLog("step1_planning", `[Step 1: Gemini AI Engine] Analyzing topic: "${promptText}" (${slideCount} slides requested, Suggested: 6-10)`);

      const plan = await runGeminiPresentationPlanner(promptText, slideCount, (msg) => {
        appendLog("step1_planning", msg);
      });

      setPipelineState((prev) => ({
        ...prev,
        deck: plan.deck,
        manimAssets: plan.manimAssets,
        chartAssets: plan.chartAssets,
        youtubeAssets: plan.youtubeAssets,
        stageProgress: 35
      }));
      appendLog("step1_planning", "Step 1 Completed: Slide structure, Manim formula script, and charts synthesized.", "success");

      // ──────────────────────────────────────────────
      // STEP 2: Core Asset Creation (The Rendering Phase)
      // ──────────────────────────────────────────────
      setPipelineState((prev) => ({
        ...prev,
        currentStage: "step2_assets",
        stageProgress: 40
      }));
      appendLog("step2_assets", "[Step 2: Core Asset Creation] Rendering Manim mathematical video (.mp4) in parallel...");

      speakUtterance({ text: "Rendering Manim mathematical animation and assembling high-resolution infographics." });

      // Render Manim scene in background
      if (plan.manimAssets.length > 0) {
        const primaryManim = plan.manimAssets[0];
        const manimResult = await renderManimSceneToMp4(primaryManim, (pct, msg) => {
          setPipelineState((prev) => ({ ...prev, stageProgress: 40 + Math.round(pct * 0.25) }));
          appendLog("step2_assets", msg);
        });

        // Update Manim asset with rendered video
        setPipelineState((prev) => ({
          ...prev,
          manimAssets: prev.manimAssets.map((m) =>
            m.id === primaryManim.id
              ? { ...m, videoUrl: manimResult.videoUrl, status: "ready", driveFileId: manimResult.driveFileId }
              : m
          )
        }));
      }

      appendLog("step2_assets", "Step 2 Completed: All video and infographic assets rendered.", "success");

      // ──────────────────────────────────────────────
      // STEP 3: Base Template Cloning (Google Drive API)
      // ──────────────────────────────────────────────
      setPipelineState((prev) => ({
        ...prev,
        currentStage: "step3_cloning",
        stageProgress: 70
      }));
      appendLog("step3_cloning", `[Step 3: Base Template Cloning] Duplicating master animated template via Drive API...`);

      speakUtterance({ text: "Cloning master animated template from Google Drive." });

      let currentTemplate = MASTER_DRIVE_TEMPLATES[0];
      setPipelineState((prev) => {
        currentTemplate = prev.selectedTemplate;
        return prev;
      });

      const cloneResult = await cloneMasterPresentationTemplate(
        currentTemplate,
        promptText,
        accessToken,
        (pct, msg) => {
          setPipelineState((prev) => ({ ...prev, stageProgress: 70 + Math.round(pct * 0.15) }));
          appendLog("step3_cloning", msg);
        }
      );

      setPipelineState((prev) => ({
        ...prev,
        clonedPresentationId: cloneResult.clonedPresentationId,
        clonedPresentationUrl: cloneResult.clonedPresentationUrl,
        stageProgress: 85
      }));
      appendLog("step3_cloning", `Step 3 Completed: Cloned template ready (${cloneResult.transitionType} transitions).`, "success");

      // ──────────────────────────────────────────────
      // STEP 4: Smart Asset Injection (Google Slides API)
      // ──────────────────────────────────────────────
      setPipelineState((prev) => ({
        ...prev,
        currentStage: "step4_injection",
        stageProgress: 90
      }));
      appendLog("step4_injection", "[Step 4: Smart Asset Injection] Opening Google Slides API batchUpdate runner...");

      speakUtterance({ text: "Injecting Manim video, real-time charts, and text into Google Slides." });

      const injectionSummary = await injectAssetsIntoClonedPresentation(
        cloneResult.clonedPresentationId,
        plan.deck,
        plan.manimAssets,
        plan.chartAssets,
        plan.youtubeAssets,
        accessToken,
        (pct, msg) => {
          setPipelineState((prev) => ({ ...prev, stageProgress: 90 + Math.round(pct * 0.1) }));
          appendLog("step4_injection", msg);
        }
      );

      // Finished!
      setPipelineState((prev) => ({
        ...prev,
        currentStage: "completed",
        stageProgress: 100,
        activeLog: `Presentation generated successfully! Injected ${injectionSummary.videosInjectedCount} videos, ${injectionSummary.imagesInjectedCount} infographics, and ${injectionSummary.textReplacementsCount} text blocks.`
      }));

      speakUtterance({ text: "Your presentation has been built with animated transitions and mathematical video embeddings." });
      appendLog("completed", `Pipeline finished successfully! View deck: ${injectionSummary.presentationUrl}`, "success");

    } catch (err: any) {
      const errMsg = err?.message || "An unexpected error occurred during pipeline execution.";
      setPipelineState((prev) => ({
        ...prev,
        currentStage: "error",
        error: errMsg,
        activeLog: errMsg
      }));
      appendLog("error", errMsg, "error");
    }
  }, [appendLog]);

  const resetPipeline = useCallback(() => {
    setPipelineState((prev) => ({
      ...prev,
      currentStage: "idle",
      stageProgress: 0,
      activeLog: "Mahr Presentation Pipeline standby. Enter a topic or speak to Mahr.",
      error: null
    }));
  }, []);

  return {
    pipelineState,
    executePipeline,
    selectTemplate,
    resetPipeline,
    appendLog
  };
}
