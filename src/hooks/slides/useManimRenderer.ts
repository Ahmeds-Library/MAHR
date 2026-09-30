import { useState, useCallback } from "react";
import { 
  ManimSceneAsset 
} from "../../services/slides/pipeline/pipelineTypes";
import { 
  renderManimSceneToMp4, 
  validateManimPythonCode, 
  PRESET_MANIM_SNIPPETS 
} from "../../services/slides/pipeline/manimRenderEngine";

export function useManimRenderer(initialAsset?: ManimSceneAsset) {
  const [activeAsset, setActiveAsset] = useState<ManimSceneAsset | null>(
    initialAsset || {
      id: "manim_active_1",
      slideIndex: 1,
      slideTitle: "Calculus & Mathematical Animation",
      conceptName: "GradientDescentOptimization",
      pythonCode: PRESET_MANIM_SNIPPETS.calculus_limit.code,
      status: "idle",
      durationSeconds: 6
    }
  );

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Ready to render");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateCode = useCallback((newCode: string) => {
    setActiveAsset((prev) => (prev ? { ...prev, pythonCode: newCode } : null));
    const validation = validateManimPythonCode(newCode);
    setValidationErrors(validation.errors);
  }, []);

  const loadPreset = useCallback((presetKey: keyof typeof PRESET_MANIM_SNIPPETS) => {
    const preset = PRESET_MANIM_SNIPPETS[presetKey];
    if (preset) {
      setActiveAsset((prev) =>
        prev
          ? {
              ...prev,
              conceptName: preset.name.replace(/\s+/g, ""),
              pythonCode: preset.code,
              status: "idle"
            }
          : null
      );
      setValidationErrors([]);
      setStatusMessage(`Loaded preset: ${preset.name}`);
    }
  }, []);

  const triggerRender = useCallback(async () => {
    if (!activeAsset) return;

    const validation = validateManimPythonCode(activeAsset.pythonCode);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setStatusMessage("Code contains syntax errors.");
      return;
    }

    setIsRendering(true);
    setRenderProgress(10);
    setStatusMessage("Initializing Manim Python renderer...");

    try {
      const result = await renderManimSceneToMp4(activeAsset, (pct, msg) => {
        setRenderProgress(pct);
        setStatusMessage(msg);
      });

      setActiveAsset((prev) =>
        prev
          ? {
              ...prev,
              videoUrl: result.videoUrl,
              status: "ready",
              driveFileId: result.driveFileId
            }
          : null
      );
      setStatusMessage("Render complete (1080p MP4 ready)");
    } catch (err: any) {
      setStatusMessage(`Render failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsRendering(false);
    }
  }, [activeAsset]);

  return {
    activeAsset,
    setActiveAsset,
    isRendering,
    renderProgress,
    statusMessage,
    validationErrors,
    updateCode,
    loadPreset,
    triggerRender
  };
}
