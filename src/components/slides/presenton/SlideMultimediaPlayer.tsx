/**
 * LAYER 3: SlideMultimediaPlayer
 * Renders MAHR's Autonomous Multi-Modal Assets inside each slide:
 * 1. AI Concept Illustration (High-Res SVG/Image)
 * 2. Interactive Data Infographic Chart
 * 3. 60FPS Animated GIF / Kinetic Motion Loop
 * 4. 60FPS Embedded Presentation Explainer Video with Narration
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  BarChart3,
  Sparkles,
  Video,
  Play,
  Pause,
  CheckCircle2,
  RotateCcw
} from "lucide-react";
import { Slide, SlideTheme } from "../../../services/slides/slideTypes";
import {
  AutonomousMediaKind,
  AutonomousSlideMediaBundle
} from "../../../slidesStudio/layer1_data/presentonTypes";
import { generateAutonomousMediaForSlide } from "../../../slidesStudio/layer2_logic/autonomousMediaGenerator";
import { speakUtterance } from "../../../services/speechSynthesisService";

interface SlideMultimediaPlayerProps {
  slide: Slide;
  theme: SlideTheme;
  onChangeMediaTab?: (tab: AutonomousMediaKind) => void;
}

export const SlideMultimediaPlayer: React.FC<SlideMultimediaPlayerProps> = ({
  slide,
  theme,
  onChangeMediaTab
}) => {
  const mediaBundle: AutonomousSlideMediaBundle =
    slide.presentonMedia || generateAutonomousMediaForSlide(slide, theme.id);

  const [activeTab, setActiveTab] = useState<AutonomousMediaKind>(
    mediaBundle.activeTab || "ai_concept_image"
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const gifCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (slide.presentonMedia?.activeTab) {
      setActiveTab(slide.presentonMedia.activeTab);
    }
    setIsVideoPlaying(false);
    setVideoProgress(0);
  }, [slide.id, slide.presentonMedia?.activeTab]);

  const handleSelectTab = (tab: AutonomousMediaKind) => {
    setActiveTab(tab);
    onChangeMediaTab?.(tab);
  };

  // 60FPS Animated GIF Motion Loop Canvas
  useEffect(() => {
    if (activeTab !== "animated_gif_loop") return;
    const canvas = gifCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let frame = 0;
    const style = mediaBundle.animatedGif.loopStyle;
    const accent = mediaBundle.animatedGif.accentHex || theme.accentCol || "#f59e0b";

    const renderLoop = () => {
      frame += 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Subtle dark studio backdrop
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#050814");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const cx = w / 2;
      const cy = h / 2;
      const t = frame * 0.035;

      if (style === "orbital_system" || style === "neural_pulse") {
        for (let r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.arc(cx, cy, r * 32 + Math.sin(t + r) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = r === 1 ? accent : "rgba(56, 189, 248, 0.35)";
          ctx.lineWidth = 1.8;
          ctx.stroke();

          const angle = t * (1.4 - r * 0.3) + r * 2;
          const nx = cx + Math.cos(angle) * (r * 32);
          const ny = cy + Math.sin(angle) * (r * 32);

          ctx.beginPath();
          ctx.arc(nx, ny, 6, 0, Math.PI * 2);
          ctx.fillStyle = r % 2 === 0 ? "#38bdf8" : accent;
          ctx.fill();
        }
      } else {
        // Wave harmonics / data stream matrix
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          for (let x = 20; x < w - 20; x += 6) {
            const y =
              cy +
              Math.sin(x * 0.025 + t * (1.2 + layer * 0.4) + layer) * (26 + layer * 12);
            if (x === 20) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = layer === 0 ? accent : layer === 1 ? "#38bdf8" : "#10b981";
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
      }

      // Center core pulse
      ctx.beginPath();
      ctx.arc(cx, cy, 12 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, mediaBundle.animatedGif.loopStyle, mediaBundle.animatedGif.accentHex, theme.accentCol]);

  // 60FPS Procedural Explainer Video Player Canvas + Progress Timer
  useEffect(() => {
    if (activeTab !== "procedural_60fps_video") return;
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let tick = 0;
    const accent = theme.accentCol || "#f59e0b";
    const labels = mediaBundle.embeddedVideo.keyframeLabels;

    const renderVideo = () => {
      if (isVideoPlaying) {
        tick += 1;
        setVideoProgress((prev) => {
          const next = prev + 0.25;
          if (next >= 100) {
            setIsVideoPlaying(false);
            return 100;
          }
          return next;
        });
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dark 3D Stage Background
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 15, w * 0.5, h * 0.5, w * 0.7);
      grad.addColorStop(0, "#111827");
      grad.addColorStop(1, "#05070f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const phase = tick * 0.04;
      const activeIdx = Math.min(
        labels.length - 1,
        Math.floor((videoProgress / 100) * labels.length)
      );

      // Draw animated pipeline nodes
      const nodeCount = Math.max(3, labels.length);
      const spacing = (w - 90) / Math.max(1, nodeCount - 1);

      for (let i = 0; i < nodeCount; i++) {
        const x = 45 + i * spacing;
        const y = h * 0.48 + Math.sin(phase + i * 1.1) * 14;

        if (i < nodeCount - 1) {
          const nx = 45 + (i + 1) * spacing;
          const ny = h * 0.48 + Math.sin(phase + (i + 1) * 1.1) * 14;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nx, ny);
          ctx.strokeStyle = i <= activeIdx ? accent : "rgba(148,163,184,0.25)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, i === activeIdx ? 15 : 10, 0, Math.PI * 2);
        ctx.fillStyle = i <= activeIdx ? accent : "#1e293b";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText((labels[i] || `Stage ${i + 1}`).slice(0, 14), x, y + 28);
      }

      // Top telemetry overlay inside video frame
      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.fillRect(12, 12, w - 24, 28);
      ctx.fillStyle = accent;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `60FPS VIDEO SYNTHESIS // ${labels[activeIdx] || slide.title}`.slice(0, 46),
        20,
        30
      );

      animId = requestAnimationFrame(renderVideo);
    };

    animId = requestAnimationFrame(renderVideo);
    return () => cancelAnimationFrame(animId);
  }, [
    activeTab,
    isVideoPlaying,
    videoProgress,
    mediaBundle.embeddedVideo.keyframeLabels,
    slide.title,
    theme.accentCol
  ]);

  const togglePlayExplainerVideo = () => {
    if (isVideoPlaying) {
      setIsVideoPlaying(false);
      window.speechSynthesis?.cancel();
    } else {
      if (videoProgress >= 100) setVideoProgress(0);
      setIsVideoPlaying(true);
      speakUtterance({
        text: mediaBundle.embeddedVideo.narrationScript,
        onEnd: () => setIsVideoPlaying(false)
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Multi-Modal Switcher Pills (Image | Infographic | GIF Loop | 60FPS Video) */}
      <div className="flex items-center justify-between gap-1 bg-zinc-950/85 border border-white/10 rounded-xl p-1 backdrop-blur-md">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleSelectTab("ai_concept_image")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
              activeTab === "ai_concept_image"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ImageIcon size={11} />
            <span>AI Image</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab("svg_infographic")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
              activeTab === "svg_infographic"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart3 size={11} />
            <span>Infographic</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab("animated_gif_loop")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
              activeTab === "animated_gif_loop"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles size={11} />
            <span>GIF Loop</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab("procedural_60fps_video")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
              activeTab === "procedural_60fps_video"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Video size={11} />
            <span>60FPS Video</span>
          </button>
        </div>

        <span
          className="hidden xl:inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/20 shrink-0"
          title="Autonomous Fact-Check & Grounding Score"
        >
          <CheckCircle2 size={9} />
          <span>{mediaBundle.factCheckConfidence}% Verified</span>
        </span>
      </div>

      {/* Active Multi-Modal Stage */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/70 aspect-video flex flex-col justify-between group">
        {/* 1. AI CONCEPT IMAGE */}
        {activeTab === "ai_concept_image" && (
          <div className="relative w-full h-full">
            <img
              src={slide.imageUrl || mediaBundle.aiImage.dataUrl}
              alt={slide.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-between p-3">
              <div className="text-[10px] font-mono text-zinc-200 truncate">
                {mediaBundle.aiImage.caption}
              </div>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                AI SYNTHESIZED
              </span>
            </div>
          </div>
        )}

        {/* 2. INTERACTIVE SVG INFOGRAPHIC */}
        {activeTab === "svg_infographic" && (
          <div className="w-full h-full p-3.5 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-white truncate">
                  {mediaBundle.infographic.title}
                </div>
                <div className="text-[9px] font-mono text-zinc-400">
                  {mediaBundle.infographic.subtitle}
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {mediaBundle.infographic.takeawayBadge}
              </span>
            </div>

            <div className="space-y-2 my-auto py-1">
              {mediaBundle.infographic.series.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-300 truncate">{item.label}</span>
                    <span className="font-bold" style={{ color: item.color || theme.accentCol }}>
                      {item.value}
                      {item.unit}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800/90 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, item.value)}%`,
                        backgroundColor: item.color || theme.accentCol
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[9px] font-mono text-zinc-500 flex items-center justify-between">
              <span>AUTONOMOUS TELEMETRY CHART</span>
              <span>GROUNDED METRICS</span>
            </div>
          </div>
        )}

        {/* 3. 60FPS ANIMATED GIF / MOTION LOOP */}
        {activeTab === "animated_gif_loop" && (
          <div className="relative w-full h-full">
            <canvas
              ref={gifCanvasRef}
              width={420}
              height={236}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[9px] font-mono font-bold">
              GIF • 60FPS MOTION LOOP
            </div>
            <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-200 truncate">
                {mediaBundle.animatedGif.headline}
              </span>
              <span className="text-[9px] font-mono text-purple-300 uppercase">
                {mediaBundle.animatedGif.loopStyle.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        )}

        {/* 4. 60FPS PROCEDURAL EXPLAINER VIDEO */}
        {activeTab === "procedural_60fps_video" && (
          <div className="relative w-full h-full flex flex-col justify-between">
            <canvas
              ref={videoCanvasRef}
              width={420}
              height={236}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-1.5">
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-150"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePlayExplainerVideo}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] font-mono transition-all cursor-pointer"
                  >
                    {isVideoPlaying ? <Pause size={10} /> : <Play size={10} fill="currentColor" />}
                    <span>{isVideoPlaying ? "Pause Video" : "Play AI Video"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoProgress(0);
                      setIsVideoPlaying(false);
                      window.speechSynthesis?.cancel();
                    }}
                    className="p-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-white/10 cursor-pointer"
                    title="Restart Video"
                  >
                    <RotateCcw size={10} />
                  </button>
                </div>
                <span className="text-[9px] font-mono text-emerald-300 truncate">
                  {mediaBundle.embeddedVideo.title}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
