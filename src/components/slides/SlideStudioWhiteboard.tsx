/**
 * SlideStudioWhiteboard (Presentation Studio Master Coordinator)
 * Implements 3-Layer Architecture:
 * - Layer 1 (Presentation): StudioHeader, StudioSlideList, StudioCanvas, StudioInspector, StudioMahrChatBar
 * - Layer 2 (State & Orchestration): useSlideStudio, useGoogleSlidesAuth
 * - Layer 3 (Domain & APIs): exportSlideDeckToGoogleSlides, Gemini AI integration
 */

import React, { useState, useCallback } from "react";
import { SlideDeck } from "../../services/slides/slideTypes";
import { SLIDE_THEMES, DEFAULT_THEME_ID } from "../../services/slides/slideThemes";
import { exportSlideDeckToGoogleSlides, GooglePresentationResult } from "../../services/slides/googleSlidesApi";
import { useGoogleSlidesAuth } from "../../hooks/slides/useGoogleSlidesAuth";
import { useSlideStudio } from "../../hooks/slides/useSlideStudio";

// Modular Studio Components (Layer 1)
import { StudioHeader } from "./studio/StudioHeader";
import { StudioSlideList } from "./studio/StudioSlideList";
import { StudioCanvas } from "./studio/StudioCanvas";
import { StudioInspector, StudioInspectorTab } from "./studio/inspector/StudioInspector";
import { StudioMahrChatBar } from "./studio/StudioMahrChatBar";
import { SlidePresentMode } from "./SlidePresentMode";
import { GoogleSlidesExportDialog } from "./GoogleSlidesExportDialog";

interface SlideStudioWhiteboardProps {
  onBackToSlate?: () => void;
  initialTopic?: string;
  onAskMahr?: (prompt: string) => void;
}

export const SlideStudioWhiteboard: React.FC<SlideStudioWhiteboardProps> = ({
  onBackToSlate,
  initialTopic,
  onAskMahr
}) => {
  const {
    deck,
    setDeck,
    currentSlideIndex,
    currentSlide,
    selectSlide,
    updateCurrentSlide,
    addSlide,
    removeSlide,
    duplicateSlide,
    reorderSlides,
    setTheme,
    isGenerating,
    vectorContext,
    statusMessage,
    isPresenting,
    setIsPresenting,
    showExportModal,
    setShowExportModal,
    executeMahrPrompt,
    enhanceCurrentSlide,
    convertSlideToMetrics,
    regenerateWithMemory
  } = useSlideStudio({ initialTopic });

  const { user, isAuthenticated, signIn, signOut } = useGoogleSlidesAuth();

  // Inspector Drawer state
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<StudioInspectorTab>("content");

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState("");
  const [exportProgressPercent, setExportProgressPercent] = useState(0);
  const [exportResult, setExportResult] = useState<GooglePresentationResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const currentTheme = SLIDE_THEMES[deck.themeId] || SLIDE_THEMES[DEFAULT_THEME_ID];
  const totalSlides = deck.slides.length;

  const handleOpenInspectorTab = (tab: StudioInspectorTab) => {
    setInspectorTab(tab);
    setIsInspectorOpen(true);
  };

  const handleMahrChatPrompt = useCallback(
    async (prompt: string) => {
      const lower = prompt.toLowerCase().trim();
      if (
        lower.includes("back to chalkboard") ||
        lower.includes("exit slides") ||
        lower.includes("return to slate") ||
        lower.includes("close slides") ||
        lower.includes("switch to chalkboard")
      ) {
        onBackToSlate?.();
        return;
      }
      if (lower.includes("export") || lower.includes("google slide export")) {
        setShowExportModal(true);
        return;
      }
      if (lower.includes("present") || lower.includes("fullscreen") || lower.includes("slideshow")) {
        setIsPresenting(true);
        return;
      }
      if (
        lower.startsWith("explain") ||
        lower.startsWith("what is") ||
        lower.startsWith("teach me") ||
        lower.startsWith("tell me about") ||
        lower.startsWith("solve")
      ) {
        onAskMahr?.(prompt);
      }
      await executeMahrPrompt(prompt);
    },
    [executeMahrPrompt, onBackToSlate, setShowExportModal, setIsPresenting, onAskMahr]
  );

  const handleExportToGoogleSlides = async (accessToken: string): Promise<GooglePresentationResult | null> => {
    setIsExporting(true);
    setExportError(null);
    setExportProgressPercent(10);
    setExportProgressText("Authenticating Google Slides & Drive Session...");

    try {
      const result = await exportSlideDeckToGoogleSlides(
        deck,
        accessToken,
        (text, percent) => {
          setExportProgressText(text);
          setExportProgressPercent(percent);
        }
      );

      setExportResult(result);
      if (result && result.presentationUrl) {
        setDeck((prev) => ({
          ...prev,
          googlePresentationId: result.presentationId,
          googlePresentationUrl: result.presentationUrl
        }));
      }
      return result;
    } catch (err: any) {
      setExportError(err.message || "Failed to create Google Slides presentation.");
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070913] text-zinc-100 overflow-hidden font-sans">
      {/* 1. Top Header Navbar */}
      <StudioHeader
        deck={deck}
        onBackToSlate={onBackToSlate}
        onPresent={() => setIsPresenting(true)}
        onExport={() => setShowExportModal(true)}
        onSelectTheme={setTheme}
        isAuthenticated={isAuthenticated}
        user={user}
        onSignIn={signIn}
        onSignOut={signOut}
      />

      {/* 2. Workspace Body: 3-Column Studio Layout */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Column: Slide Thumbnails Filmstrip */}
        <StudioSlideList
          deck={deck}
          currentSlideIndex={currentSlideIndex}
          onSelectSlide={selectSlide}
          onAddSlide={addSlide}
          onRemoveSlide={removeSlide}
          onDuplicateSlide={duplicateSlide}
          onReorderSlides={reorderSlides}
        />

        {/* Center Stage: Cinematic 16:9 Slide Canvas */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-radial from-zinc-900/30 to-[#070913]">
          <StudioCanvas
            deck={deck}
            currentSlideIndex={currentSlideIndex}
            currentSlide={currentSlide}
            theme={currentTheme}
            totalSlides={totalSlides}
            onSelectSlide={selectSlide}
            isInspectorOpen={isInspectorOpen}
            onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
            activeInspectorTab={inspectorTab}
            onOpenInspectorTab={handleOpenInspectorTab}
          />

          {/* Bottom MAHR AI Text Chat Bar */}
          <StudioMahrChatBar
            topic={deck.topic || deck.title}
            isGenerating={isGenerating}
            onExecutePrompt={handleMahrChatPrompt}
            onEnhanceCurrentSlide={enhanceCurrentSlide}
            onConvertSlideToMetrics={convertSlideToMetrics}
            onAddSlide={() => addSlide("bullets")}
          />
        </main>

        {/* Right Column: Slide Inspector Drawer (Content, Layout, Visuals, Notes) */}
        <StudioInspector
          deck={deck}
          currentSlideIndex={currentSlideIndex}
          currentSlide={currentSlide}
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          activeTab={inspectorTab}
          onSelectTab={setInspectorTab}
          onUpdateSlide={updateCurrentSlide}
          onDuplicateSlide={duplicateSlide}
          onRemoveSlide={removeSlide}
        />
      </div>

      {/* 3. Fullscreen Presentation Mode Dialog */}
      {isPresenting && (
        <SlidePresentMode
          deck={deck}
          theme={currentTheme}
          currentIndex={currentSlideIndex}
          onClose={() => setIsPresenting(false)}
          onNext={() => selectSlide(currentSlideIndex + 1)}
          onPrev={() => selectSlide(currentSlideIndex - 1)}
          onSelectIndex={selectSlide}
        />
      )}

      {/* 4. Google Slides Export Dialog */}
      <GoogleSlidesExportDialog
        deck={deck}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportToGoogleSlides}
        isExporting={isExporting}
        progressText={exportProgressText}
        progressPercent={exportProgressPercent}
        exportResult={exportResult}
        exportError={exportError}
      />
    </div>
  );
};
