/**
 * Layer 3 UI — Master Presenton Studio Coordinator
 * Orchestrates the 4-Step Presenton Pipeline:
 * Step 1: Multi-Source Input Hub (Topic, Document Upload, Web Search Grounding, Voice)
 * Step 2: Interactive AI Outline Review & Editor
 * Step 3: Presenton Template & Theme Picker
 * Step 4: Live GSAP Studio Canvas, AI Copilot & Triple Export (.pptx, .pdf, Google Slides)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PresentonCitation,
  PresentonDeck,
  PresentonInputConfig,
  PresentonLayoutType,
  PresentonOutlineItem,
  PresentonSlide,
  PresentonWizardStep
} from "../layer1_data/presentonTypes";
import {
  DEFAULT_PRESENTON_THEME_ID,
  PRESENTON_THEMES
} from "../layer1_data/presentonThemes";
import {
  convertPresentonDeckToGoogleSlideDeck,
  editPresentonSlideWithAI,
  generatePresentonDeck,
  generatePresentonOutline
} from "../layer2_services/presentonApiService";
import { exportPresentonDeckToPptx } from "../layer2_services/pptxExportService";
import { exportPresentonDeckToPdf } from "../layer2_services/pdfExportService";
import {
  parsePresentonVoiceCommand,
  speakWithMahrVoice,
  stopMahrVoice
} from "../layer2_services/presentonVoiceService";
import { PresentonTopBar } from "./components/PresentonTopBar";
import { Step1InputHub } from "./wizard/Step1InputHub";
import { Step2OutlineEditor } from "./wizard/Step2OutlineEditor";
import { Step3ThemeSelector } from "./wizard/Step3ThemeSelector";
import { SlideFilmstripSidebar } from "./workspace/SlideFilmstripSidebar";
import { SlideLayoutRenderer } from "./workspace/layouts/SlideLayoutRenderer";
import { PresentonCopilotDock } from "./workspace/PresentonCopilotDock";
import { FullscreenPresenterModal } from "./workspace/FullscreenPresenterModal";
import { GoogleSlidesExportDialog } from "../../components/slides/GoogleSlidesExportDialog";
import {
  exportSlideDeckToGoogleSlides,
  GooglePresentationResult
} from "../../services/slides/googleSlidesApi";

const STORAGE_KEY = "mahr_presenton_saved_deck_v2";

interface PresentonStudioRootProps {
  onBackToSlate?: () => void;
  initialTopic?: string;
  onAskMahr?: (prompt: string) => void;
}

export const PresentonStudioRoot: React.FC<PresentonStudioRootProps> = ({
  onBackToSlate,
  initialTopic
}) => {
  // Wizard step state
  const [activeStep, setActiveStep] = useState<PresentonWizardStep>("step1_input");

  // Step 1 Input Config
  const [inputConfig, setInputConfig] = useState<PresentonInputConfig>({
    topic: initialTopic && !initialTopic.includes("FMCG") ? initialTopic : "",
    customInstructions: "",
    slideCount: 8,
    tone: "Executive & Analytical",
    audience: "Decision Makers & Peers",
    language: "English",
    enableWebSearch: true,
    documentName: "",
    documentContext: ""
  });

  // Step 2 Outline State
  const [outlineTitle, setOutlineTitle] = useState("");
  const [outlineSubtitle, setOutlineSubtitle] = useState("");
  const [outlineItems, setOutlineItems] = useState<PresentonOutlineItem[]>([]);
  const [citations, setCitations] = useState<PresentonCitation[]>([]);

  // Step 3 & 4 Theme + Full Deck State
  const [selectedThemeId, setSelectedThemeId] = useState<string>(DEFAULT_PRESENTON_THEME_ID);
  const [deck, setDeck] = useState<PresentonDeck | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Loading & Status States
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isBuildingDeck, setIsBuildingDeck] = useState(false);
  const [isEditingSlideAI, setIsEditingSlideAI] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Google Slides Export Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isExportingGoogle, setIsExportingGoogle] = useState(false);
  const [googleProgressText, setGoogleProgressText] = useState("");
  const [googleProgressPercent, setGoogleProgressPercent] = useState(0);
  const [googleExportResult, setGoogleExportResult] = useState<GooglePresentationResult | null>(
    null
  );
  const [googleExportError, setGoogleExportError] = useState<string | null>(null);

  const lastVoiceTopicRef = useRef<string>("");

  const showNotice = useCallback((msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Restore saved Presenton deck on mount if no new initialTopic was requested
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && (!initialTopic || initialTopic.includes("FMCG"))) {
        const parsed = JSON.parse(raw) as PresentonDeck;
        if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          setDeck(parsed);
          setSelectedThemeId(parsed.themeId || DEFAULT_PRESENTON_THEME_ID);
          setOutlineTitle(parsed.title);
          setOutlineSubtitle(parsed.subtitle);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [initialTopic]);

  // Persist deck changes
  useEffect(() => {
    if (deck && deck.slides.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
      } catch {
        // Ignore quota errors
      }
    }
  }, [deck]);

  // Step 1 -> Step 2: Generate AI Outline
  const handleGenerateOutline = useCallback(
    async (overrideTopic?: string) => {
      const effectiveTopic = (overrideTopic ?? inputConfig.topic).trim();
      if (!effectiveTopic) return;

      setIsGeneratingOutline(true);
      showNotice(`Researching & structuring outline for "${effectiveTopic}"...`);

      try {
        const res = await generatePresentonOutline({
          ...inputConfig,
          topic: effectiveTopic
        });
        setOutlineTitle(res.title || effectiveTopic);
        setOutlineSubtitle(res.subtitle || "");
        setOutlineItems(res.outline || []);
        setCitations(res.citations || []);
        setActiveStep("step2_outline");
        showNotice(`Generated ${res.outline.length}-slide interactive outline.`);
      } catch (err) {
        showNotice(`Outline error: ${(err as Error)?.message}`);
      } finally {
        setIsGeneratingOutline(false);
      }
    },
    [inputConfig, showNotice]
  );

  // Step 3 -> Step 4: Build Full Presentation Deck from Approved Outline
  const handleBuildFullDeck = useCallback(
    async (customOutline?: PresentonOutlineItem[], customTitle?: string, customSub?: string) => {
      const listToUse = customOutline || outlineItems;
      if (listToUse.length === 0) return;

      setIsBuildingDeck(true);
      showNotice("Synthesizing slides, KPI metrics, and charts...");

      try {
        const fullDeck = await generatePresentonDeck({
          topic: inputConfig.topic || customTitle || outlineTitle,
          title: customTitle || outlineTitle || inputConfig.topic,
          subtitle: customSub || outlineSubtitle,
          audience: inputConfig.audience,
          tone: inputConfig.tone,
          language: inputConfig.language,
          themeId: selectedThemeId,
          outline: listToUse,
          documentContext: inputConfig.documentContext,
          customInstructions: inputConfig.customInstructions,
          citations
        });

        setDeck(fullDeck);
        setActiveSlideIndex(0);
        setActiveStep("step4_studio");
        showNotice(`Presentation ready: "${fullDeck.title}"`);
      } catch (err) {
        showNotice(`Deck generation error: ${(err as Error)?.message}`);
      } finally {
        setIsBuildingDeck(false);
      }
    },
    [
      outlineItems,
      inputConfig,
      outlineTitle,
      outlineSubtitle,
      selectedThemeId,
      citations,
      showNotice
    ]
  );

  // When Mahr Voice Assistant passes a new live initialTopic, automatically run outline + slide synthesis
  useEffect(() => {
    const clean = (initialTopic || "").trim();
    if (!clean || clean.includes("FMCG Market Dynamics")) return;
    if (lastVoiceTopicRef.current === clean) return;
    lastVoiceTopicRef.current = clean;

    setInputConfig((prev) => ({ ...prev, topic: clean }));

    (async () => {
      setIsGeneratingOutline(true);
      showNotice(`Mahr is creating your presentation on "${clean}"...`);
      try {
        const outlineRes = await generatePresentonOutline({
          ...inputConfig,
          topic: clean
        });
        setOutlineTitle(outlineRes.title);
        setOutlineSubtitle(outlineRes.subtitle);
        setOutlineItems(outlineRes.outline);
        setCitations(outlineRes.citations || []);
        setActiveStep("step2_outline");
      } catch {
        // Fallback handled in router
      } finally {
        setIsGeneratingOutline(false);
      }
    })();
  }, [initialTopic]);

  // Outline Manipulation Handlers
  const handleUpdateOutlineItem = (idx: number, updated: PresentonOutlineItem) => {
    setOutlineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...updated, slideNumber: i + 1 } : item))
    );
  };

  const handleMoveOutlineItem = (idx: number, dir: "up" | "down") => {
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= outlineItems.length) return;
    setOutlineItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      return copy.map((it, i) => ({ ...it, slideNumber: i + 1 }));
    });
  };

  const handleDeleteOutlineItem = (idx: number) => {
    if (outlineItems.length <= 2) return;
    setOutlineItems((prev) =>
      prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, slideNumber: i + 1 }))
    );
  };

  const handleAddOutlineItem = () => {
    setOutlineItems((prev) => [
      ...prev,
      {
        id: `outline-${Date.now()}`,
        slideNumber: prev.length + 1,
        title: `Additional Insight — ${outlineTitle || inputConfig.topic}`,
        recommendedLayout: "split-visual",
        keyPoints: [
          "Primary analytical takeaway",
          "Supporting evidence and operational impact",
          "Recommended execution step"
        ],
        visualIntent: "Structured narrative breakdown"
      }
    ]);
  };

  // Studio Slide Manipulation Handlers
  const currentSlide: PresentonSlide | undefined =
    deck?.slides[activeSlideIndex] || deck?.slides[0];

  const handleUpdateCurrentSlide = (partial: Partial<PresentonSlide>) => {
    if (!deck || !currentSlide) return;
    setDeck((prev) => {
      if (!prev) return prev;
      const nextSlides = prev.slides.map((s, idx) =>
        idx === activeSlideIndex ? { ...s, ...partial } : s
      );
      return { ...prev, slides: nextSlides, updatedAt: new Date().toISOString() };
    });
  };

  const handleAddStudioSlide = () => {
    if (!deck) return;
    const newSlideNum = deck.slides.length + 1;
    const newSlide: PresentonSlide = {
      id: `slide-${Date.now()}`,
      slideNumber: newSlideNum,
      layout: "split-visual",
      categoryTag: `SLIDE 0${newSlideNum} • ${deck.topic.slice(0, 24).toUpperCase()}`,
      title: `New Slide — ${deck.title}`,
      subtitle: "Click to customize subtitle or ask Mahr Copilot below",
      callout: "Key takeaway for this slide",
      bullets: [
        "First key strategic point for this slide",
        "Second supporting evidence or benchmark",
        "Third actionable recommendation"
      ],
      metrics: [
        { label: "Impact Score", value: "94%", delta: "+18%", description: "Primary benchmark" },
        { label: "Efficiency", value: "2.6x", delta: "Verified", description: "Workflow speedup" },
        { label: "Confidence", value: "98%", delta: "Tier-1", description: "Target reliability" }
      ],
      chartData: {
        chartType: "bar",
        title: "Performance Trajectory",
        unit: "Index",
        series: [
          { label: "Phase 1", value: 45 },
          { label: "Phase 2", value: 68 },
          { label: "Phase 3", value: 92 }
        ]
      },
      comparisonColumns: [
        { heading: "Option A", badge: "Baseline", points: ["Point 1", "Point 2"] },
        { heading: "Option B", badge: "Optimal", points: ["Point 1", "Point 2"] }
      ],
      timelineSteps: [
        { phase: "Step 1", title: "Discovery", description: "Initial assessment" },
        { phase: "Step 2", title: "Execution", description: "Core rollout" }
      ],
      pillars: [
        { tag: "01", title: "Pillar One", description: "Foundation" },
        { tag: "02", title: "Pillar Two", description: "Execution" },
        { tag: "03", title: "Pillar Three", description: "Scale" }
      ],
      quote: {
        text: "Strategic alignment drives sustainable execution.",
        author: deck.title
      },
      speakerNotes: "Here we examine the next dimension of our presentation."
    };

    setDeck({
      ...deck,
      slides: [...deck.slides, newSlide],
      updatedAt: new Date().toISOString()
    });
    setActiveSlideIndex(deck.slides.length);
  };

  const handleDuplicateStudioSlide = (idx: number) => {
    if (!deck) return;
    const source = deck.slides[idx];
    if (!source) return;
    const clone: PresentonSlide = {
      ...source,
      id: `slide-${Date.now()}`,
      title: `${source.title} (Copy)`
    };
    const nextSlides = [...deck.slides];
    nextSlides.splice(idx + 1, 0, clone);
    setDeck({
      ...deck,
      slides: nextSlides.map((s, i) => ({ ...s, slideNumber: i + 1 })),
      updatedAt: new Date().toISOString()
    });
    setActiveSlideIndex(idx + 1);
  };

  const handleDeleteStudioSlide = (idx: number) => {
    if (!deck || deck.slides.length <= 1) return;
    const nextSlides = deck.slides
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, slideNumber: i + 1 }));
    setDeck({
      ...deck,
      slides: nextSlides,
      updatedAt: new Date().toISOString()
    });
    setActiveSlideIndex(Math.max(0, Math.min(activeSlideIndex, nextSlides.length - 1)));
  };

  const handleMoveStudioSlide = (idx: number, dir: "up" | "down") => {
    if (!deck) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= deck.slides.length) return;
    const copy = [...deck.slides];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    setDeck({
      ...deck,
      slides: copy.map((s, i) => ({ ...s, slideNumber: i + 1 })),
      updatedAt: new Date().toISOString()
    });
    setActiveSlideIndex(target);
  };

  // AI Slide Copilot Edit
  const handleRunCopilotEdit = async (instruction: string) => {
    if (!deck || !currentSlide) return;
    setIsEditingSlideAI(true);
    showNotice(`Mahr Copilot is updating Slide ${currentSlide.slideNumber}...`);
    try {
      const updated = await editPresentonSlideWithAI({
        slide: currentSlide,
        instruction,
        topic: deck.topic
      });
      handleUpdateCurrentSlide(updated);
      showNotice(`Updated Slide ${currentSlide.slideNumber}.`);
    } catch (err) {
      showNotice(`Could not update slide: ${(err as Error)?.message}`);
    } finally {
      setIsEditingSlideAI(false);
    }
  };

  // Exports (.pptx, .pdf, Google Slides)
  const handleExportPptx = async () => {
    if (!deck) return;
    setIsExportingPptx(true);
    showNotice("Generating native editable PowerPoint (.pptx)...");
    try {
      await exportPresentonDeckToPptx(deck);
      showNotice("PowerPoint (.pptx) downloaded!");
    } catch (err) {
      showNotice(`PPTX export error: ${(err as Error)?.message}`);
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleExportPdf = () => {
    if (!deck) return;
    showNotice("Preparing high-resolution 16:9 PDF deck...");
    exportPresentonDeckToPdf(deck);
  };

  const handleConfirmGoogleSlidesExport = async (accessToken: string) => {
    if (!deck) return null;
    setIsExportingGoogle(true);
    setGoogleExportError(null);
    setGoogleExportResult(null);
    try {
      const googleDeck = convertPresentonDeckToGoogleSlideDeck(deck);
      const result = await exportSlideDeckToGoogleSlides(
        googleDeck,
        accessToken,
        (text, pct) => {
          setGoogleProgressText(text);
          setGoogleProgressPercent(pct);
        }
      );
      setGoogleExportResult(result);
      return result;
    } catch (err) {
      setGoogleExportError((err as Error)?.message || "Google Slides export failed");
      return null;
    } finally {
      setIsExportingGoogle(false);
    }
  };

  // Mahr Voice Narration & Voice Command Handler
  const handleToggleSpeakSlide = () => {
    if (isSpeaking) {
      stopMahrVoice();
      setIsSpeaking(false);
      return;
    }
    if (!currentSlide) return;
    const script = `${currentSlide.title}. ${
      currentSlide.speakerNotes || currentSlide.bullets.join(". ")
    }`;
    speakWithMahrVoice(
      script,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleVoiceCommand = (transcript: string) => {
    const intent = parsePresentonVoiceCommand(transcript);
    if (!intent) return;

    if (intent.type === "next_slide" && deck) {
      setActiveSlideIndex((i) => Math.min(deck.slides.length - 1, i + 1));
    } else if (intent.type === "prev_slide" && deck) {
      setActiveSlideIndex((i) => Math.max(0, i - 1));
    } else if (intent.type === "read_slide") {
      handleToggleSpeakSlide();
    } else if (intent.type === "export_pptx") {
      handleExportPptx();
    } else if (intent.type === "export_pdf") {
      handleExportPdf();
    } else if (intent.type === "approve_outline") {
      handleBuildFullDeck();
    } else if (intent.type === "create_presentation") {
      setInputConfig((prev) => ({ ...prev, topic: intent.topic }));
      handleGenerateOutline(intent.topic);
    } else if (intent.type === "edit_slide") {
      handleRunCopilotEdit(intent.instruction);
    }
  };

  const activeTheme =
    PRESENTON_THEMES[deck?.themeId || selectedThemeId] ||
    PRESENTON_THEMES[DEFAULT_PRESENTON_THEME_ID];

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      {/* Top Bar */}
      <PresentonTopBar
        activeStep={activeStep}
        onSelectStep={setActiveStep}
        hasOutline={outlineItems.length > 0}
        hasDeck={!!deck && deck.slides.length > 0}
        deckTitle={deck?.title || outlineTitle || inputConfig.topic}
        activeThemeId={deck?.themeId || selectedThemeId}
        onChangeTheme={(newThemeId) => {
          setSelectedThemeId(newThemeId);
          if (deck) {
            setDeck({ ...deck, themeId: newThemeId, updatedAt: new Date().toISOString() });
          }
        }}
        onBackToSlate={onBackToSlate}
        onNewPresentation={() => {
          stopMahrVoice();
          setActiveStep("step1_input");
        }}
        onStartPresentMode={() => setIsPresenting(true)}
        onExportPptx={handleExportPptx}
        onExportPdf={handleExportPdf}
        onExportGoogleSlides={() => setShowGoogleModal(true)}
        isExportingPptx={isExportingPptx}
        isSpeaking={isSpeaking}
        onToggleSpeakSlide={handleToggleSpeakSlide}
      />

      {/* Non-intrusive Status Toast */}
      {statusToast && (
        <div className="fixed bottom-5 right-5 z-40 px-4 py-2.5 rounded-xl bg-indigo-950/95 border border-indigo-500/50 text-indigo-200 text-xs font-semibold shadow-2xl">
          {statusToast}
        </div>
      )}

      {/* Main Content Area by Step */}
      <main className="flex-1 flex flex-col min-h-0">
        {activeStep === "step1_input" && (
          <div className="flex-1 overflow-y-auto">
            <Step1InputHub
              config={inputConfig}
              onUpdateConfig={(partial) =>
                setInputConfig((prev) => ({ ...prev, ...partial }))
              }
              onGenerateOutline={() => handleGenerateOutline()}
              isGeneratingOutline={isGeneratingOutline}
            />
          </div>
        )}

        {activeStep === "step2_outline" && (
          <div className="flex-1 overflow-y-auto">
            <Step2OutlineEditor
              deckTitle={outlineTitle}
              deckSubtitle={outlineSubtitle}
              onUpdateDeckMeta={(t, s) => {
                setOutlineTitle(t);
                setOutlineSubtitle(s);
              }}
              outline={outlineItems}
              citations={citations}
              onUpdateOutlineItem={handleUpdateOutlineItem}
              onMoveOutlineItem={handleMoveOutlineItem}
              onDeleteOutlineItem={handleDeleteOutlineItem}
              onAddOutlineItem={handleAddOutlineItem}
              onBackToInput={() => setActiveStep("step1_input")}
              onRegenerateOutline={() => handleGenerateOutline()}
              onContinueToTheme={() => setActiveStep("step3_theme")}
              isRegenerating={isGeneratingOutline}
            />
          </div>
        )}

        {activeStep === "step3_theme" && (
          <div className="flex-1 overflow-y-auto">
            <Step3ThemeSelector
              selectedThemeId={selectedThemeId}
              onSelectTheme={setSelectedThemeId}
              onBackToOutline={() => setActiveStep("step2_outline")}
              onBuildPresentation={() => handleBuildFullDeck()}
              isBuildingDeck={isBuildingDeck}
              slideCount={outlineItems.length}
              deckTitle={outlineTitle || inputConfig.topic}
            />
          </div>
        )}

        {activeStep === "step4_studio" && deck && currentSlide && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left/Top Responsive Slide Filmstrip */}
            <SlideFilmstripSidebar
              slides={deck.slides}
              activeSlideIndex={activeSlideIndex}
              theme={activeTheme}
              onSelectSlide={setActiveSlideIndex}
              onAddSlide={handleAddStudioSlide}
              onDuplicateSlide={handleDuplicateStudioSlide}
              onDeleteSlide={handleDeleteStudioSlide}
              onMoveSlide={handleMoveStudioSlide}
            />

            {/* Center 16:9 Presenton Stage + Bottom AI Copilot Dock */}
            <div
              className="flex-1 flex flex-col justify-between p-3 sm:p-6 overflow-y-auto"
              style={{ background: activeTheme.canvasBg }}
            >
              <div className="w-full max-w-5xl mx-auto my-auto aspect-video min-h-[340px]">
                <SlideLayoutRenderer
                  slide={currentSlide}
                  theme={activeTheme}
                  totalSlides={deck.slides.length}
                  onUpdateSlide={handleUpdateCurrentSlide}
                />
              </div>

              <PresentonCopilotDock
                currentSlide={currentSlide}
                onChangeLayout={(layout: PresentonLayoutType) =>
                  handleUpdateCurrentSlide({ layout })
                }
                onUpdateSpeakerNotes={(speakerNotes) =>
                  handleUpdateCurrentSlide({ speakerNotes })
                }
                onRunCopilotEdit={handleRunCopilotEdit}
                onVoiceCommand={handleVoiceCommand}
                isEditingWithAI={isEditingSlideAI}
              />
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen Presenter Modal */}
      {isPresenting && deck && (
        <FullscreenPresenterModal
          deck={deck}
          theme={activeTheme}
          initialSlideIndex={activeSlideIndex}
          onClose={() => setIsPresenting(false)}
        />
      )}

      {/* Google Slides Cloud Sync Dialog */}
      {showGoogleModal && deck && (
        <GoogleSlidesExportDialog
          deck={convertPresentonDeckToGoogleSlideDeck(deck)}
          isOpen={showGoogleModal}
          onClose={() => setShowGoogleModal(false)}
          onExport={handleConfirmGoogleSlidesExport}
          isExporting={isExportingGoogle}
          progressText={googleProgressText}
          progressPercent={googleProgressPercent}
          exportResult={googleExportResult}
          exportError={googleExportError}
        />
      )}
    </div>
  );
};
