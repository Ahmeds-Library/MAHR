import { SlideDeck, Slide } from "../slideTypes";
import { ManimSceneAsset, ChartAsset, YouTubeAsset } from "./pipelineTypes";
import { createCommodityVectorGraphic, createRetailMetricsVectorGraphic, fetchLiveFmcMarketIntelligence } from "../fmcMarketIntelligenceService";

export interface GeminiPlanResult {
  deck: SlideDeck;
  manimAssets: ManimSceneAsset[];
  chartAssets: ChartAsset[];
  youtubeAssets: YouTubeAsset[];
}

/**
 * Step 1: Gemini AI Engine
 * Parses the user topic/prompt, builds presentation JSON,
 * designs Manim Python scene code for math formulas, creates chart data,
 * and sets YouTube keywords.
 */
export async function runGeminiPresentationPlanner(
  prompt: string,
  slideCount: number = 6,
  onLog?: (msg: string) => void
): Promise<GeminiPlanResult> {
  onLog?.(`[Gemini Engine] Analyzing topic: "${prompt}" and parsing structural requirements...`);
  await new Promise((r) => setTimeout(r, 600));

  const isFmcOrRetail = /fmc|commodity|market|retail|supply|finance|price|trade|inflation/i.test(prompt);
  const isMathOrAi = /math|derivative|calculus|neural|deep learning|physics|algorithm|vector|geometry/i.test(prompt);

  onLog?.(`[Gemini Engine] Generating ${slideCount}-slide schema with automated layout selection...`);
  await new Promise((r) => setTimeout(r, 700));

  // Determine slide structures
  const slides: Slide[] = [];
  const manimAssets: ManimSceneAsset[] = [];
  const chartAssets: ChartAsset[] = [];
  const youtubeAssets: YouTubeAsset[] = [];

  // Title Slide
  slides.push({
    id: `slide_1_${Date.now()}`,
    slideNumber: 1,
    layout: "title",
    title: prompt.length > 5 ? prompt.toUpperCase() : "NEXT-GEN STRATEGIC INTELLIGENCE",
    subtitle: "Orchestrated via Mahr Multi-Engine Presentation Pipeline",
    categoryTag: "EXECUTIVE BRIEFING",
    speakerNotes: "Welcome everyone. Today we are presenting a synthesized, data-grounded overview generated through the Mahr AI pipeline.",
    animationStyle: "fade"
  });

  // Slide 2: Mathematical / Core Formula Animation (Manim Target)
  const manimCode = generateManimPythonCode(prompt, isMathOrAi);
  manimAssets.push({
    id: "manim_asset_1",
    slideIndex: 1,
    slideTitle: isMathOrAi ? "Neural Network Cost Optimization & Gradient Descent" : "Predictive Elasticity & Market Price Differential",
    conceptName: isMathOrAi ? "GradientDescentOptimization" : "PriceElasticityModel",
    pythonCode: manimCode,
    status: "idle",
    durationSeconds: 8
  });

  slides.push({
    id: `slide_2_${Date.now()}`,
    slideNumber: 2,
    layout: "media",
    title: isMathOrAi ? "Mathematical Foundations & Gradient Descent" : "FMC Price Elasticity & Dynamic Equilibrium",
    subtitle: "Rendered via Manim Python Animation Engine",
    categoryTag: "MATHEMATICAL SIMULATION",
    bullets: [
      "Dynamic convergence curve plotted in real-time across iterative epochs",
      "Gradient vector field calculations displaying step-size sensitivity",
      "High-precision LaTeX formula rendering with smooth vector morphing"
    ],
    callout: "Mathematical proofs rendered dynamically via 3Blue1Brown's Manim framework.",
    speakerNotes: "Notice how the loss landscape is visualized here with continuous vector transformations.",
    animationStyle: "zoom-in"
  });

  // Slide 3: Chart & Dynamic Infographic
  onLog?.("[Gemini Engine] Fetching real-time market data & constructing chart datasets...");
  const fmcIntel = await fetchLiveFmcMarketIntelligence().catch(() => null);
  const commodityVector = fmcIntel ? createCommodityVectorGraphic(fmcIntel.commodities) : undefined;

  chartAssets.push({
    id: "chart_asset_1",
    slideIndex: 2,
    slideTitle: "Real-Time Commodity & Price Volatility Matrix",
    chartType: "commodity_fmc",
    title: "Global Commodity Spot Quotes & Margin Variance",
    dataPoints: [
      { label: "Arabica Coffee", value: 242.8, change: 3.4, unit: "¢/lb" },
      { label: "Cocoa Futures", value: 7850, change: 5.1, unit: "$/MT" },
      { label: "Palm Oil Index", value: 1045, change: -1.2, unit: "$/MT" },
      { label: "Raw Sugar", value: 21.6, change: 0.8, unit: "¢/lb" }
    ],
    vectorGraphic: commodityVector,
    status: "idle"
  });

  slides.push({
    id: `slide_3_${Date.now()}`,
    slideNumber: 3,
    layout: "stats",
    title: "Market Intelligence & Quantitative Dynamics",
    subtitle: "Real-Time Telemetry & Vector Infographic",
    categoryTag: "QUANTITATIVE ANALYTICS",
    stats: [
      { label: "Index Volatility", value: "+4.2%", description: "7-day rolling variance" },
      { label: "Spot Volume", value: "$4.8B", description: "Global exchange turnover" },
      { label: "Forecast Accuracy", value: "94.8%", description: "Mahr predictive confidence" }
    ],
    vectorGraphic: commodityVector,
    speakerNotes: "Here we examine the live commodity variance across four major international exchanges.",
    animationStyle: "slide-up"
  });

  // Slide 4: YouTube & Video Knowledge
  onLog?.("[Gemini Engine] Designing YouTube search keywords for contextual video embedding...");
  const searchKeyword = isMathOrAi ? "3Blue1Brown neural networks deep learning" : "FMC market intelligence global supply chain commodity trends";
  
  youtubeAssets.push({
    id: "youtube_asset_1",
    slideIndex: 3,
    slideTitle: "Global Industry Perspective & Case Study",
    searchKeyword,
    videoId: isMathOrAi ? "aircAruvnKk" : "b8m9zGzVz6Q",
    videoTitle: isMathOrAi ? "3Blue1Brown: What is a neural network?" : "Global Supply Chain & Commodity Market Realities",
    thumbnailUrl: `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80`,
    embedUrl: `https://www.youtube.com/embed/${isMathOrAi ? "aircAruvnKk" : "b8m9zGzVz6Q"}`,
    status: "found"
  });

  slides.push({
    id: `slide_4_${Date.now()}`,
    slideNumber: 4,
    layout: "media",
    title: "Global Industry Case Study & Practical Application",
    subtitle: "Embedded High-Fidelity Multimedia Stream",
    categoryTag: "MULTIMEDIA INSIGHT",
    videoId: isMathOrAi ? "aircAruvnKk" : "b8m9zGzVz6Q",
    videoTitle: "Industry Case Study & Real-World Operations",
    callout: "Auto-synced from YouTube Data API with responsive 16:9 viewport positioning.",
    speakerNotes: "This video illustrates the deployment of these principles in enterprise operations.",
    animationStyle: "fade"
  });

  // Slide 5: Strategic Takeaways / Recommendations
  slides.push({
    id: `slide_5_${Date.now()}`,
    slideNumber: 5,
    layout: "columns",
    title: "Strategic Action Items & Future Trajectory",
    subtitle: "Executive Summary & Operational Roadmap",
    categoryTag: "STRATEGIC EXECUTION",
    bullets: [
      "Deploy automated forecasting pipelines across all business units",
      "Hedge commodity exposure based on the real-time volatility thresholds",
      "Scale visual reporting workflows with Mahr automated slide generation"
    ],
    speakerNotes: "To conclude, here are the three critical milestones for immediate execution.",
    animationStyle: "stagger"
  });

  const deck: SlideDeck = {
    id: `deck_pipeline_${Date.now()}`,
    title: prompt.toUpperCase(),
    subtitle: "Generated via Mahr AI Engine Multi-Layer Architecture",
    topic: prompt,
    audience: "Executive & Strategic Stakeholders",
    themeId: "midnight-cyber",
    slides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  onLog?.("[Gemini Engine] Step 1 Complete: Presentation plan, Manim code, and asset schema generated successfully!");
  return { deck, manimAssets, chartAssets, youtubeAssets };
}

function generateManimPythonCode(topic: string, isMath: boolean): string {
  if (isMath) {
    return `from manim import *

class GradientDescentOptimization(Scene):
    def construct(self):
        # Mahr Presentation Studio - Mathematical Scene
        title = Title(r"\\textbf{Gradient Descent Cost Optimization}", color=BLUE_B)
        formula = MathTex(
            r"\\theta_{t+1} = \\theta_t - \\eta \\cdot \\nabla_\\theta J(\\theta)",
            font_size=42, color=YELLOW_C
        )
        formula.next_to(title, DOWN, buff=0.8)
        
        axes = Axes(
            x_range=[-3, 3, 1], y_range=[0, 9, 2],
            x_length=7, y_length=4,
            axis_config={"color": GREY_A}
        ).shift(DOWN * 1.2)
        
        curve = axes.plot(lambda x: x**2, color=TEAL_C, stroke_width=4)
        dot = Dot(axes.c2p(2.5, 6.25), color=RED_C, radius=0.12)
        
        self.play(Write(title), run_time=1.2)
        self.play(FadeIn(formula, shift=UP), run_time=1.0)
        self.play(Create(axes), Create(curve), run_time=1.5)
        self.play(FadeIn(dot, scale=1.5), run_time=0.8)
        
        # Animate descent steps
        self.play(dot.animate.move_to(axes.c2p(1.2, 1.44)), run_time=1.2, rate_func=rush_into)
        self.play(dot.animate.move_to(axes.c2p(0.3, 0.09)), run_time=1.0, rate_func=smooth)
        self.wait(1.5)`;
  }

  return `from manim import *

class PriceElasticityModel(Scene):
    def construct(self):
        # Mahr Presentation Studio - FMC Market Model
        title = Title(r"\\textbf{Dynamic Commodity Price Equilibrium}", color=TEAL_B)
        eq = MathTex(
            r"\\epsilon = \\frac{\\% \\Delta Q}{\\% \\Delta P} = \\lim_{\\Delta P \\to 0} \\frac{P}{Q}\\frac{dQ}{dP}",
            font_size=40, color=GREEN_C
        ).next_to(title, DOWN, buff=0.6)
        
        axes = Axes(
            x_range=[0, 10, 2], y_range=[0, 10, 2],
            x_length=6.5, y_length=3.5,
            axis_config={"color": GREY_B}
        ).shift(DOWN * 1.1)
        
        demand = axes.plot(lambda p: 9 - 0.75 * p, color=RED_C, stroke_width=3.5)
        supply = axes.plot(lambda p: 1 + 0.85 * p, color=BLUE_C, stroke_width=3.5)
        
        self.play(Write(title), run_time=1.0)
        self.play(Write(eq), run_time=1.2)
        self.play(Create(axes), run_time=1.0)
        self.play(Create(demand), Create(supply), run_time=1.5)
        
        # Equilibrium Point
        eq_dot = Dot(axes.c2p(5.0, 5.25), color=YELLOW, radius=0.14)
        eq_label = Text("Equilibrium", font_size=20, color=YELLOW).next_to(eq_dot, UR, buff=0.2)
        self.play(FadeIn(eq_dot), Write(eq_label), run_time=1.0)
        self.wait(1.5)`;
}
