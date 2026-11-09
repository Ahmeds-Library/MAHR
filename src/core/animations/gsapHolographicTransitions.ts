import gsap from "gsap";

/**
 * GSAP Holographic Animation Utilities for MAHR AI Assistant
 * Provides smooth, high-frame-rate spring and stagger animations
 * for smart cards, holographic HUD elements, and voice reactive waves.
 */

export const animateCardDeckReveal = (containerSelector: string | HTMLElement, itemSelector: string) => {
  if (typeof window === "undefined") return;

  const ctx = gsap.context(() => {
    gsap.fromTo(
      itemSelector,
      {
        opacity: 0,
        y: 24,
        scale: 0.94,
        filter: "blur(6px)",
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.55,
        stagger: 0.08,
        ease: "power3.out",
      }
    );
  }, containerSelector);

  return () => ctx.revert();
};

export const animateHologramPulse = (element: HTMLElement | null) => {
  if (!element || typeof window === "undefined") return;

  return gsap.to(element, {
    boxShadow: "0 0 35px rgba(34, 211, 238, 0.45), inset 0 0 15px rgba(34, 211, 238, 0.2)",
    scale: 1.02,
    duration: 1.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
};

export const animateWaveformBars = (barsSelector: string | HTMLElement[]) => {
  if (typeof window === "undefined") return;

  const elements = typeof barsSelector === "string" ? document.querySelectorAll(barsSelector) : barsSelector;
  if (!elements || elements.length === 0) return;

  return gsap.to(elements, {
    scaleY: () => 0.2 + Math.random() * 0.9,
    duration: 0.25,
    repeat: -1,
    yoyo: true,
    stagger: 0.04,
    ease: "power1.inOut",
  });
};

export const animateWidgetDismiss = (element: HTMLElement, onComplete?: () => void) => {
  if (!element || typeof window === "undefined") {
    onComplete?.();
    return;
  }

  gsap.to(element, {
    opacity: 0,
    y: 16,
    scale: 0.95,
    filter: "blur(4px)",
    duration: 0.25,
    ease: "power2.in",
    onComplete,
  });
};
