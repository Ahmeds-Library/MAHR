import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Sparkles,
  Quote,
  TrendingUp,
  Layers,
  CheckCircle2,
  Play,
  Video,
  Image as ImageIcon,
  Globe,
  ExternalLink,
  Maximize2
} from "lucide-react";
import { Slide, SlideTheme } from "../../services/slides/slideTypes";
import { ColumnsInfographic } from "./studio/infographics/ColumnsInfographic";
import { TimelineInfographic } from "./studio/infographics/TimelineInfographic";
import { SummaryInfographic } from "./studio/infographics/SummaryInfographic";
import { CitationsBar } from "./studio/infographics/CitationsBar";
import { VectorInfographicRenderer } from "../../services/slides/infographics/svgRenderers";
import { SlideMultimediaPlayer } from "./presenton/SlideMultimediaPlayer";
import { BentoMediaStage } from "./presenton/BentoMediaStage";
import { getAutoLayoutColumnSpans } from "../../slidesStudio/layer2_logic/autoLayoutEngine";
import { SLIDE_TRANSITION_METADATA } from "../../slidesStudio/layer1_data/presentonTypes";

interface SlideCanvasPreviewProps {
  slide: Slide;
  theme: SlideTheme;
  totalSlides: number;
  currentSlideIndex: number;
}

export const SlideCanvasPreview: React.FC<SlideCanvasPreviewProps> = ({
  slide,
  theme,
  totalSlides,
  currentSlideIndex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<HTMLDivElement>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Reset video playback on slide switch
  useEffect(() => {
    setIsPlayingVideo(false);
  }, [slide.id, currentSlideIndex]);

  // Trigger Keynote / PowerPoint-grade GSAP transition & entrance animations on slide change
  useEffect(() => {
    if (!elementsRef.current || !containerRef.current) return;

    const transition = slide.transitionPreset || "morph_smooth";
    const entrance = slide.entrancePreset || "stagger_cascade";

    const ctx = gsap.context(() => {
      // 1. Stage-level Slide Transition Choreography
      if (transition === "cube_3d") {
        gsap.fromTo(
          containerRef.current,
          { rotateY: -22, scale: 0.94, opacity: 0.25, transformPerspective: 1200 },
          { rotateY: 0, scale: 1, opacity: 1, duration: 0.65, ease: "power3.out" }
        );
      } else if (transition === "parallax_wipe") {
        gsap.fromTo(
          containerRef.current,
          { x: 45, skewX: -2, opacity: 0.2 },
          { x: 0, skewX: 0, opacity: 1, duration: 0.55, ease: "expo.out" }
        );
      } else if (transition === "zoom_spotlight") {
        gsap.fromTo(
          containerRef.current,
          { scale: 1.08, filter: "brightness(1.35)", opacity: 0.2 },
          { scale: 1, filter: "brightness(1)", opacity: 1, duration: 0.6, ease: "power2.out" }
        );
      } else if (transition === "cinematic_fade") {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0.15 },
          { opacity: 1, duration: 0.5, ease: "sine.inOut" }
        );
      } else {
        // Default: Keynote Magic Morph
        gsap.fromTo(
          containerRef.current,
          { scale: 0.96, y: 12, opacity: 0.35 },
          { scale: 1, y: 0, opacity: 1, duration: 0.55, ease: "back.out(1.2)" }
        );
      }

      // 2. Per-Element Entrance Choreography
      gsap.fromTo(
        ".gsap-slide-header",
        { opacity: 0, y: -18 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
      );

      gsap.fromTo(
        ".gsap-slide-body",
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: 0.08,
          ease: entrance === "spring_pop" ? "back.out(1.5)" : "power3.out"
        }
      );

      gsap.fromTo(
        ".gsap-slide-item",
        {
          opacity: 0,
          x: entrance === "typewriter_reveal" ? -28 : -16,
          scale: entrance === "spring_pop" ? 0.92 : 1
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.42,
          stagger: 0.08,
          delay: 0.16,
          ease: entrance === "spring_pop" ? "back.out(1.6)" : "power2.out"
        }
      );
    }, elementsRef);

    return () => ctx.revert();
  }, [slide.id, currentSlideIndex, slide.transitionPreset, slide.entrancePreset]);

  const hasMedia = true; // Every slide is autonomously enriched with Presenton 4-in-1 Multimedia
  const youtubeVideoId = slide.videoId || (slide.videoUrl ? slide.videoUrl.split("v=")[1]?.split("&")[0] : null);
  const transitionMeta = SLIDE_TRANSITION_METADATA[slide.transitionPreset || "morph_smooth"];
  const { textColClass, mediaColClass } = getAutoLayoutColumnSpans(slide);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden border shadow-2xl flex flex-col justify-between p-5 sm:p-8 select-none transition-all duration-300"
      style={{
        background: theme.bgGradient,
        borderColor: theme.borderCol,
        boxShadow: `0 20px 50px -10px ${theme.slideBg}, 0 0 35px ${theme.borderCol}`
      }}
    >
      {/* Decorative Cybernetic Grid Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:28px_28px]"
      />

      {/* Top Header Row */}
      <div ref={elementsRef} className="relative z-10 flex flex-col h-full justify-between">
        <div className="gsap-slide-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] sm:text-xs font-mono font-bold tracking-widest px-2.5 py-1 rounded-full uppercase border backdrop-blur-md"
              style={{
                borderColor: theme.borderCol,
                backgroundColor: theme.cardBg,
                color: theme.accentCol
              }}
            >
              {slide.categoryTag || "MAHR INTELLIGENCE"}
            </span>

            <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300">
              <span>{transitionMeta?.badge || "MORPH"}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              <Video size={10} />
              <span>AI IMAGE • GIF • 60FPS VIDEO</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>SLIDE {slide.slideNumber} OF {totalSlides}</span>
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accentCol }}
            />
          </div>
        </div>

        {/* Dynamic Center / Body Content by Layout */}
        <div className="gsap-slide-body my-auto w-full max-w-5xl mx-auto py-1 sm:py-2">
          {slide.vectorGraphic && (
            <div className="mb-2">
              <VectorInfographicRenderer graphic={slide.vectorGraphic} theme={theme} />
            </div>
          )}

          {slide.layout === "title" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-left">
              <div className="md:col-span-7 space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border backdrop-blur-md"
                  style={{ borderColor: theme.borderCol, color: theme.accentCol }}>
                  <Sparkles size={14} />
                  <span>Presenton Autonomous Presentation</span>
                </div>
                <h1
                  className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
                  style={{ color: theme.textPrimary }}
                >
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p
                    className="text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed"
                    style={{ color: theme.textSecondary }}
                  >
                    {slide.subtitle}
                  </p>
                )}
              </div>

              <div className="md:col-span-5">
                <BentoMediaStage
                  slide={slide}
                  theme={theme}
                  onPromoteAsset={() => {}}
                  onRemoveAsset={() => {}}
                />
              </div>
            </div>
          )}

          {slide.layout === "stats" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2
                  className="text-xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2"
                  style={{ color: theme.textPrimary }}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-xs sm:text-sm" style={{ color: theme.textSecondary }}>
                    {slide.subtitle}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1 sm:pt-2">
                {(slide.stats || [
                  { label: "Execution Efficiency", value: "+300%", description: "Productivity multiplier" },
                  { label: "Reliability Benchmark", value: "99.9%", description: "Verified uptime standard" },
                  { label: "Market Resonance", value: "Top 1%", description: "Best-in-class feedback" }
                ]).map((stat, idx) => (
                  <div
                    key={idx}
                    className="gsap-slide-item p-4 sm:p-5 rounded-xl border backdrop-blur-md flex flex-col justify-between"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderCol
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                        {stat.label}
                      </span>
                      <TrendingUp size={14} style={{ color: theme.accentCol }} />
                    </div>
                    <div
                      className="text-2xl sm:text-4xl font-extrabold tracking-tight my-1"
                      style={{ color: theme.accentCol }}
                    >
                      {stat.value}
                    </div>
                    {stat.description && (
                      <p className="text-[11px] sm:text-xs" style={{ color: theme.textSecondary }}>
                        {stat.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.layout === "quote" && (
            <div className="text-center space-y-6 max-w-3xl mx-auto py-4">
              <Quote size={36} className="mx-auto opacity-70" style={{ color: theme.accentCol }} />
              <blockquote
                className="text-lg sm:text-2xl md:text-3xl italic font-serif leading-relaxed"
                style={{ color: theme.textPrimary }}
              >
                "{slide.quote || slide.title}"
              </blockquote>
              {slide.quoteAuthor && (
                <div className="text-xs sm:text-sm font-mono tracking-widest uppercase" style={{ color: theme.accentCol }}>
                  — {slide.quoteAuthor}
                </div>
              )}
            </div>
          )}

          {/* Layout Variant: Columns */}
          {slide.layout === "columns" && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h2
                  className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight mb-1"
                  style={{ color: theme.textPrimary }}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-xs sm:text-sm" style={{ color: theme.textSecondary }}>
                    {slide.subtitle}
                  </p>
                )}
              </div>
              <ColumnsInfographic bullets={slide.bullets || []} theme={theme} />
            </div>
          )}

          {/* Layout Variant: Timeline */}
          {slide.layout === "timeline" && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h2
                  className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight mb-1"
                  style={{ color: theme.textPrimary }}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-xs sm:text-sm" style={{ color: theme.textSecondary }}>
                    {slide.subtitle}
                  </p>
                )}
              </div>
              <TimelineInfographic bullets={slide.bullets || []} theme={theme} />
            </div>
          )}

          {/* Layout Variant: Summary */}
          {slide.layout === "summary" && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h2
                  className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight mb-1"
                  style={{ color: theme.textPrimary }}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-xs sm:text-sm" style={{ color: theme.textSecondary }}>
                    {slide.subtitle}
                  </p>
                )}
              </div>
              <SummaryInfographic
                bullets={slide.bullets || []}
                callout={slide.callout}
                theme={theme}
              />
            </div>
          )}

          {(slide.layout === "bullets" || slide.layout === "media") && (
            <div className={`space-y-4 ${hasMedia ? "grid grid-cols-1 md:grid-cols-12 gap-5 items-center" : ""}`}>
              {/* Text & Bullets Column */}
              <div
                className={`${
                  hasMedia
                    ? `${textColClass} space-y-3 sm:space-y-4 ${
                        slide.assetArrangement === "split_left" ? "md:order-2" : "md:order-1"
                      }`
                    : "space-y-4 sm:space-y-6"
                }`}
              >
                <div>
                  <h2
                    className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight mb-1"
                    style={{ color: theme.textPrimary }}
                  >
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="text-xs sm:text-sm" style={{ color: theme.textSecondary }}>
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  {(slide.bullets || []).map((bullet, idx) => (
                    <div
                      key={idx}
                      className="gsap-slide-item flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border backdrop-blur-md transition-transform hover:translate-x-1"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.borderCol
                      }}
                    >
                      <div className="mt-0.5 shrink-0" style={{ color: theme.accentCol }}>
                        {slide.layout === "summary" ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <Layers size={15} />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.textPrimary }}>
                        {typeof bullet === "string" ? bullet : (bullet as any)?.text || (bullet as any)?.point || (bullet as any)?.title || String(bullet || "")}
                      </span>
                    </div>
                  ))}
                </div>

                {slide.callout && (
                  <div
                    className="p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.3)",
                      borderColor: theme.borderCol,
                      color: theme.accentCol
                    }}
                  >
                    <Sparkles size={13} className="shrink-0" />
                    <span className="truncate">{slide.callout}</span>
                  </div>
                )}
              </div>

              {/* Autonomous Bento & 4-in-1 Multimedia Stage Column */}
              {hasMedia && (
                <div
                  className={`${mediaColClass} flex flex-col gap-2 ${
                    slide.assetArrangement === "split_left" ? "md:order-1" : "md:order-2"
                  }`}
                >
                  {isPlayingVideo && youtubeVideoId ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60 aspect-video flex items-center justify-center">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
                        title={slide.videoTitle || "Video player"}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <BentoMediaStage
                      slide={slide}
                      theme={theme}
                      onPromoteAsset={() => {}}
                      onRemoveAsset={() => {}}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Slide Bottom Bar with Citations & Grounding */}
        <div className="relative z-10 space-y-1.5 pt-2">
          <CitationsBar citations={slide.citations} theme={theme} />
          <div className="flex flex-wrap items-center justify-between text-[9px] sm:text-[11px] text-zinc-500 font-mono gap-2 pt-1 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span>MAHR Presentation Studio · Powered by Gemini & Google Slides</span>
              {slide.citations && slide.citations.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  <Globe size={10} />
                  <span>Web Grounded</span>
                </span>
              )}
            </div>
            <span className="uppercase tracking-widest">{theme.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
