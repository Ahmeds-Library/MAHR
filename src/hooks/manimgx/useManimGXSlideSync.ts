/**
 * ManimGX Google Slides & Export Bridge Hook
 * Connects ManimGX 3D scenes with Google Workspace Slides and Drive pipelines.
 */

import { useState, useCallback } from "react";
import { renderManimGXSceneToMp4, ManimGXExportResult } from "../../services/manimgx/manimgxPipelineBridge";

export function useManimGXSlideSync() {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("Ready for export");
  const [lastExport, setLastExport] = useState<ManimGXExportResult | null>(null);

  const exportSceneToMp4 = useCallback(async (
    sceneName: string,
    pythonCode: string,
    durationSeconds: number = 6
  ): Promise<ManimGXExportResult | null> => {
    setIsExporting(true);
    setExportProgress(10);
    setStatusMessage("Starting ManimGX GPU compilation...");

    try {
      const result = await renderManimGXSceneToMp4(
        {
          id: `manimgx_${Date.now()}`,
          slideIndex: 1,
          slideTitle: sceneName,
          conceptName: sceneName,
          pythonCode,
          status: "ready",
          durationSeconds
        },
        (pct, msg) => {
          setExportProgress(pct);
          setStatusMessage(msg);
        }
      );

      setLastExport(result);
      setStatusMessage("Export complete: 1080p60 MP4 ready for Google Slides");
      return result;
    } catch (err: any) {
      setStatusMessage(`Export failed: ${err?.message || "Unknown error"}`);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportProgress,
    statusMessage,
    lastExport,
    exportSceneToMp4
  };
}
