/**
 * LAYER 2: Smart Bento Auto-Layout Engine
 * Automatically computes optimal grid compositions, text-to-media column spans,
 * and typography density whenever assets are added, removed, or reordered on a slide.
 */

import { Slide } from "../../services/slides/slideTypes";
import {
  AutonomousAssetItem,
  BentoCompositionPreset,
  SlideAssetArrangement,
  SlideAutoLayoutConfig,
  TextMediaBalancePreset
} from "../layer1_data/autonomousAssetTypes";

/**
 * Determines the optimal Bento composition preset based on the active asset count
 * and slide orientation.
 */
export function resolveBentoCompositionForCount(
  assetCount: number,
  arrangement: SlideAssetArrangement = "split_right"
): BentoCompositionPreset {
  if (assetCount <= 1) {
    return "single_spotlight";
  }
  if (assetCount === 2) {
    return arrangement === "hero_top" || arrangement === "full_canvas"
      ? "dual_side_by_side"
      : "dual_vertical";
  }
  if (assetCount === 3) {
    return arrangement === "hero_top" ? "triple_hero_top" : "triple_hero_left";
  }
  return "quad_bento_matrix";
}

/**
 * Determines the optimal text-to-media balance ratio based on how many assets
 * vs how many bullet points exist on the slide.
 */
export function resolveOptimalTextMediaBalance(
  assetCount: number,
  bulletCount: number
): TextMediaBalancePreset {
  if (assetCount >= 3 && bulletCount <= 3) {
    return "media_dominant";
  }
  if (assetCount <= 1 && bulletCount >= 4) {
    return "text_lead";
  }
  if (assetCount >= 2) {
    return "balanced";
  }
  return "text_lead";
}

/**
 * Computes the complete SlideAutoLayoutConfig when a new asset is added or removed.
 */
export function computeOptimalSlideLayout(
  slide: Slide,
  nextAssets: AutonomousAssetItem[],
  preferredArrangement?: SlideAssetArrangement
): SlideAutoLayoutConfig {
  const currentConfig = slide.autoLayout;
  const isEnabled = currentConfig?.enabled !== false;
  const arrangement = preferredArrangement || slide.assetArrangement || "split_right";
  const count = Math.max(1, nextAssets.length);
  const bulletCount = (slide.bullets || []).length;

  if (!isEnabled && currentConfig) {
    return {
      ...currentConfig,
      lastReflowTimestamp: Date.now()
    };
  }

  return {
    enabled: true,
    bentoComposition: resolveBentoCompositionForCount(count, arrangement),
    textMediaBalance: resolveOptimalTextMediaBalance(count, bulletCount),
    showGridGuides: currentConfig?.showGridGuides ?? false,
    lastReflowTimestamp: Date.now()
  };
}

/**
 * Cycles through available Bento compositions for the user's current slide
 * when they click "Re-balance Grid" in the Floating Canvas HUD.
 */
export function cycleBentoComposition(
  slide: Slide
): Partial<Slide> {
  const assets = slide.droppedAssets || [];
  const count = assets.length;
  const current = slide.autoLayout?.bentoComposition || "single_spotlight";

  let pool: BentoCompositionPreset[] = [
    "single_spotlight",
    "dual_vertical",
    "dual_side_by_side",
    "triple_hero_left",
    "triple_hero_top",
    "quad_bento_matrix"
  ];

  if (count === 2) {
    pool = ["dual_vertical", "dual_side_by_side"];
  } else if (count === 3) {
    pool = ["triple_hero_left", "triple_hero_top", "quad_bento_matrix"];
  } else if (count >= 4) {
    pool = ["quad_bento_matrix", "triple_hero_left", "triple_hero_top"];
  }

  const nextIdx = (pool.indexOf(current) + 1) % pool.length;
  const nextPreset = pool[nextIdx] || "single_spotlight";

  const arrangements: SlideAssetArrangement[] = [
    "split_right",
    "split_left",
    "hero_top",
    "full_canvas"
  ];
  const currentArr = slide.assetArrangement || "split_right";
  const nextArrangement =
    count <= 1
      ? arrangements[(arrangements.indexOf(currentArr) + 1) % arrangements.length]
      : currentArr;

  return {
    assetArrangement: nextArrangement,
    autoLayout: {
      enabled: slide.autoLayout?.enabled ?? true,
      bentoComposition: nextPreset,
      textMediaBalance: slide.autoLayout?.textMediaBalance || "balanced",
      showGridGuides: slide.autoLayout?.showGridGuides ?? false,
      lastReflowTimestamp: Date.now()
    }
  };
}

/**
 * Promotes a specific asset inside `droppedAssets` to index 0 (Primary Hero Cell)
 * and triggers an auto-layout timestamp update.
 */
export function promoteAssetInSlide(
  slide: Slide,
  assetId: string
): Partial<Slide> {
  const existing = slide.droppedAssets || [];
  const target = existing.find((a) => a.id === assetId);
  if (!target) return {};

  const reordered = [target, ...existing.filter((a) => a.id !== assetId)];
  return {
    droppedAssets: reordered,
    imageUrl: target.customMediaUrl || target.previewDataUrl,
    imageCaption: `${target.title} (${target.subtitle})`,
    autoLayout: computeOptimalSlideLayout(slide, reordered)
  };
}

/**
 * Removes an asset from `droppedAssets` and automatically reflows the remaining items
 * into a balanced grid composition.
 */
export function removeAssetFromSlide(
  slide: Slide,
  assetId: string
): Partial<Slide> {
  const existing = slide.droppedAssets || [];
  const remaining = existing.filter((a) => a.id !== assetId);
  const nextPrimary = remaining[0];

  return {
    droppedAssets: remaining,
    imageUrl: nextPrimary ? nextPrimary.customMediaUrl || nextPrimary.previewDataUrl : slide.imageUrl,
    imageCaption: nextPrimary ? `${nextPrimary.title} (${nextPrimary.subtitle})` : slide.imageCaption,
    autoLayout: computeOptimalSlideLayout(slide, remaining)
  };
}

/**
 * Computes responsive 12-column CSS Grid spans for the Text Column vs Media Bento Stage.
 */
export function getAutoLayoutColumnSpans(
  slide: Slide
): { textColClass: string; mediaColClass: string; ratioLabel: string } {
  const balance: TextMediaBalancePreset =
    slide.autoLayout?.textMediaBalance ||
    resolveOptimalTextMediaBalance(
      (slide.droppedAssets || []).length,
      (slide.bullets || []).length
    );

  switch (balance) {
    case "media_dominant":
      return {
        textColClass: "md:col-span-5",
        mediaColClass: "md:col-span-7",
        ratioLabel: "42 : 58 Media Dominant"
      };
    case "balanced":
      return {
        textColClass: "md:col-span-6",
        mediaColClass: "md:col-span-6",
        ratioLabel: "50 : 50 Balanced Grid"
      };
    case "text_lead":
    default:
      return {
        textColClass: "md:col-span-7",
        mediaColClass: "md:col-span-5",
        ratioLabel: "58 : 42 Executive Split"
      };
  }
}

/**
 * Computes adaptive typography sizing based on slide content & media density
 * so text blocks and bullets never overflow the 16:9 canvas.
 */
export function getAdaptiveTextScale(slide: Slide): {
  titleClass: string;
  subtitleClass: string;
  bulletPaddingClass: string;
  bulletTextClass: string;
} {
  const assetCount = (slide.droppedAssets || []).length;
  const bulletCount = (slide.bullets || []).length;
  const isDense = assetCount >= 3 || bulletCount >= 5 || slide.assetArrangement === "hero_top";

  if (isDense) {
    return {
      titleClass: "text-lg sm:text-2xl",
      subtitleClass: "text-xs",
      bulletPaddingClass: "p-2",
      bulletTextClass: "text-xs"
    };
  }

  return {
    titleClass: "text-xl sm:text-3xl",
    subtitleClass: "text-xs sm:text-sm",
    bulletPaddingClass: "p-2.5",
    bulletTextClass: "text-xs sm:text-sm"
  };
}
