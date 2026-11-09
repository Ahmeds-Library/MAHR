/**
 * LAYER 2: Autonomous Asset Catalog & Prompt Regeneration Engine
 * Powers the Autonomous Asset Panel (drag-and-drop Infographics, 60FPS GIFs, 60FPS Videos, Concept Art)
 * and the Quick-Prompt "Re-generate or Arrange" Overlay.
 */

import { Slide, SlideDeck } from "../../services/slides/slideTypes";
import { SLIDE_THEMES, DEFAULT_THEME_ID } from "../../services/slides/slideThemes";
import {
  AutonomousMediaKind,
  AutonomousSlideMediaBundle,
  InfographicDataSeries
} from "../layer1_data/presentonTypes";
import {
  AutonomousAssetItem,
  SlideAssetArrangement
} from "../layer1_data/autonomousAssetTypes";
import {
  generateAutonomousMediaForSlide,
  synthesizeSlideConceptImageSvg
} from "./autonomousMediaGenerator";
import { computeOptimalSlideLayout } from "./autoLayoutEngine";

function seedFromText(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Generates a curated catalog of Autonomous Assets (Infographics, 60FPS GIFs, 60FPS Videos, Concept Art)
 * tailored to the active SlideDeck so users can drag and drop them onto any slide.
 */
export function generateDeckAssetLibrary(deck: SlideDeck): AutonomousAssetItem[] {
  const theme = SLIDE_THEMES[deck.themeId] || SLIDE_THEMES[DEFAULT_THEME_ID];
  const accentHex = theme.accentCol || "#f59e0b";
  const assets: AutonomousAssetItem[] = [];

  deck.slides.forEach((slide, idx) => {
    const bundle = slide.presentonMedia || generateAutonomousMediaForSlide(slide, deck.themeId);
    const num = idx + 1;

    // 1. Concept Art Asset
    assets.push({
      id: `asset-art-${slide.id}-${num}`,
      title: `${slide.title}`,
      subtitle: "High-Res Isometric Concept Illustration",
      kind: "ai_concept_image",
      promptUsed: bundle.aiImage.promptUsed,
      previewDataUrl: bundle.aiImage.dataUrl,
      accentHex,
      sourceSlideNumber: num
    });

    // 2. Quantitative Infographic Asset
    assets.push({
      id: `asset-infographic-${slide.id}-${num}`,
      title: `${slide.title} · Telemetry`,
      subtitle: `${bundle.infographic.takeawayBadge}`,
      kind: "svg_infographic",
      promptUsed: `Quantitative telemetry chart for ${slide.title}`,
      previewDataUrl: synthesizeSlideConceptImageSvg(
        `${slide.title} Telemetry`,
        bundle.infographic.takeawayBadge,
        "#38bdf8",
        num + 10
      ),
      accentHex: "#38bdf8",
      sourceSlideNumber: num,
      infographicConfig: {
        chartType: bundle.infographic.chartType,
        series: bundle.infographic.series,
        takeawayBadge: bundle.infographic.takeawayBadge
      }
    });

    // 3. 60FPS Animated GIF Motion Loop Asset
    assets.push({
      id: `asset-gif-${slide.id}-${num}`,
      title: `${slide.title} · Kinetic Loop`,
      subtitle: `60FPS ${bundle.animatedGif.loopStyle.replace(/_/g, " ")}`,
      kind: "animated_gif_loop",
      promptUsed: `60FPS kinetic GIF loop (${bundle.animatedGif.loopStyle}) for ${slide.title}`,
      previewDataUrl: synthesizeSlideConceptImageSvg(
        bundle.animatedGif.headline,
        "60FPS Continuous Motion Loop",
        "#a855f7",
        num + 20
      ),
      accentHex: "#a855f7",
      sourceSlideNumber: num,
      gifConfig: {
        loopStyle: bundle.animatedGif.loopStyle,
        headline: bundle.animatedGif.headline,
        fps: 60
      }
    });

    // 4. 60FPS Explainer Video Asset
    assets.push({
      id: `asset-video-${slide.id}-${num}`,
      title: `${slide.title} · 60FPS Video`,
      subtitle: `${bundle.embeddedVideo.durationSeconds}s Explainer + Voice Narration`,
      kind: "procedural_60fps_video",
      promptUsed: `60FPS procedural explainer video for ${slide.title}`,
      previewDataUrl: synthesizeSlideConceptImageSvg(
        bundle.embeddedVideo.title,
        "60FPS Interactive Explainer Video",
        "#10b981",
        num + 30
      ),
      accentHex: "#10b981",
      sourceSlideNumber: num,
      videoConfig: {
        sceneType: bundle.embeddedVideo.sceneType,
        durationSeconds: bundle.embeddedVideo.durationSeconds,
        narrationScript: bundle.embeddedVideo.narrationScript,
        keyframeLabels: bundle.embeddedVideo.keyframeLabels
      }
    });
  });

  return assets;
}

/**
 * Synthesizes a brand-new standalone AutonomousAssetItem from a user prompt inside the Asset Panel
 */
export function synthesizeCustomAssetItem(
  prompt: string,
  kind: AutonomousMediaKind,
  themeId: string = DEFAULT_THEME_ID
): AutonomousAssetItem {
  const theme = SLIDE_THEMES[themeId] || SLIDE_THEMES[DEFAULT_THEME_ID];
  const accentHex = theme.accentCol || "#f59e0b";
  const cleanPrompt = prompt.trim() || "Autonomous AI System Architecture";
  const seed = seedFromText(cleanPrompt);

  const previewDataUrl = synthesizeSlideConceptImageSvg(
    cleanPrompt.slice(0, 42),
    `Custom Synthesized ${kind.replace(/_/g, " ")}`,
    accentHex,
    (seed % 9) + 1
  );

  const keywords = cleanPrompt
    .split(/[,.;|-]+|\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);
  while (keywords.length < 4) {
    keywords.push(`Metric ${keywords.length + 1}`);
  }

  return {
    id: `custom-asset-${Date.now()}-${seed % 1000}`,
    title: cleanPrompt.slice(0, 38),
    subtitle: `Custom ${kind.replace(/_/g, " ").toUpperCase()}`,
    kind,
    promptUsed: cleanPrompt,
    previewDataUrl,
    accentHex,
    infographicConfig: {
      chartType: "bar_comparison",
      takeawayBadge: "+99.2% Verified Accuracy",
      series: keywords.map((kw, i) => ({
        label: kw.charAt(0).toUpperCase() + kw.slice(1),
        value: 74 + ((seed + i * 11) % 25),
        unit: "%",
        color: i === 0 ? accentHex : i === 1 ? "#38bdf8" : i === 2 ? "#10b981" : "#a855f7"
      }))
    },
    gifConfig: {
      loopStyle:
        cleanPrompt.toLowerCase().includes("wave") || cleanPrompt.toLowerCase().includes("stream")
          ? "wave_harmonics"
          : "orbital_system",
      headline: cleanPrompt.slice(0, 34),
      fps: 60
    },
    videoConfig: {
      sceneType: "architecture_pipeline",
      durationSeconds: 20,
      narrationScript: `Visual simulation of ${cleanPrompt}, highlighting key architectural stages and live performance metrics.`,
      keyframeLabels: keywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1))
    }
  };
}

/**
 * Applies a dragged-and-dropped (or clicked) AutonomousAssetItem onto a Slide,
 * updating both the active media modality and the spatial arrangement preset.
 */
export function applyDroppedAssetToSlide(
  slide: Slide,
  asset: AutonomousAssetItem,
  targetArrangement?: SlideAssetArrangement,
  themeId: string = DEFAULT_THEME_ID
): Partial<Slide> {
  const existingBundle: AutonomousSlideMediaBundle =
    slide.presentonMedia || generateAutonomousMediaForSlide(slide, themeId);

  const updatedBundle: AutonomousSlideMediaBundle = {
    ...existingBundle,
    activeTab: asset.kind,
    aiImage:
      asset.kind === "ai_concept_image"
        ? {
            ...existingBundle.aiImage,
            dataUrl: asset.previewDataUrl,
            promptUsed: asset.promptUsed,
            caption: asset.title
          }
        : existingBundle.aiImage,
    infographic:
      asset.kind === "svg_infographic" && asset.infographicConfig
        ? {
            ...existingBundle.infographic,
            title: asset.title,
            subtitle: asset.subtitle,
            chartType: asset.infographicConfig.chartType,
            series: asset.infographicConfig.series,
            takeawayBadge: asset.infographicConfig.takeawayBadge
          }
        : existingBundle.infographic,
    animatedGif:
      asset.kind === "animated_gif_loop" && asset.gifConfig
        ? {
            ...existingBundle.animatedGif,
            loopStyle: asset.gifConfig.loopStyle,
            headline: asset.gifConfig.headline,
            accentHex: asset.accentHex
          }
        : existingBundle.animatedGif,
    embeddedVideo:
      asset.kind === "procedural_60fps_video" && asset.videoConfig
        ? {
            ...existingBundle.embeddedVideo,
            title: asset.title,
            sceneType: asset.videoConfig.sceneType,
            durationSeconds: asset.videoConfig.durationSeconds,
            narrationScript: asset.videoConfig.narrationScript,
            keyframeLabels: asset.videoConfig.keyframeLabels
          }
        : existingBundle.embeddedVideo
  };

  const existingDropped = slide.droppedAssets || [];
  const nextDropped = [asset, ...existingDropped.filter((a) => a.id !== asset.id)].slice(0, 6);
  const resolvedArrangement = targetArrangement || slide.assetArrangement || "split_right";
  const nextAutoLayout = computeOptimalSlideLayout(slide, nextDropped, resolvedArrangement);

  return {
    presentonMedia: updatedBundle,
    assetArrangement: resolvedArrangement,
    autoLayout: nextAutoLayout,
    droppedAssets: nextDropped,
    imageUrl: asset.customMediaUrl || asset.previewDataUrl,
    imageCaption: `${asset.title} (${asset.subtitle})`,
    videoTitle: updatedBundle.embeddedVideo.title
  };
}

/**
 * Regenerates or rearranges a slide's specific multimedia asset via the Quick-Prompt Overlay.
 */
export function regenerateSlideAssetWithPrompt(
  slide: Slide,
  prompt: string,
  targetKind: AutonomousMediaKind,
  arrangement: SlideAssetArrangement,
  themeId: string = DEFAULT_THEME_ID
): Partial<Slide> {
  const customAsset = synthesizeCustomAssetItem(
    prompt.trim() || slide.title,
    targetKind,
    themeId
  );

  return applyDroppedAssetToSlide(slide, customAsset, arrangement, themeId);
}
