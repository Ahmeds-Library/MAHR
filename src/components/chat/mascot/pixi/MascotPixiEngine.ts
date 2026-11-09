import { Application } from "pixi.js";
import { MascotSpriteRig } from "./MascotSpriteRig";
import { EyeExpression, MascotActivity } from "../useMascotPlayEngine";

/**
 * Layer 2: Mascot PixiJS Engine
 * Encapsulates the Pixi v8 WebGL Application lifecycle,
 * canvas mounting, auto-scaling, and ticker loop execution.
 * Built with robust WebGL context loss resilience and graceful fallback.
 */

export function isWebGLFunctional(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    const isLost =
      typeof (gl as any).isContextLost === "function" && (gl as any).isContextLost();
    return !isLost;
  } catch {
    return false;
  }
}

export class MascotPixiEngine {
  private app: Application | null = null;
  private rig: MascotSpriteRig | null = null;
  private isDestroyed: boolean = false;
  private canvasElement: HTMLCanvasElement | null = null;
  private onContextLostHandler: ((e: Event) => void) | null = null;

  public async init(
    canvas: HTMLCanvasElement,
    width: number = 120,
    height: number = 120,
    themeHex: string = "#38bdf8"
  ): Promise<boolean> {
    this.canvasElement = canvas;
    this.isDestroyed = false;

    // 1. Proactive WebGL capability check
    if (!isWebGLFunctional()) {
      console.warn("[MascotPixiEngine] WebGL context unavailable or lost, falling back to SVG vector rig.");
      return false;
    }

    try {
      // 2. Prevent default on context loss so Chromium allows restoration
      this.onContextLostHandler = (e: Event) => {
        e.preventDefault();
        console.warn("[MascotPixiEngine] WebGL context lost on mascot canvas. Safe fallback active.");
      };
      canvas.addEventListener("webglcontextlost", this.onContextLostHandler, false);

      // 3. Create and initialize Pixi v8 Application
      const app = new Application();
      await app.init({
        canvas,
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1,
        autoDensity: true,
        preference: "webgl",
      });

      if (this.isDestroyed) {
        try {
          app.destroy(true);
        } catch {
          // ignore cleanup errors on destroyed app
        }
        return false;
      }

      this.app = app;

      // 4. Build the hierarchical sprite rig
      const rig = new MascotSpriteRig(themeHex);
      rig.root.position.set(width / 2, height / 2 + 6);
      app.stage.addChild(rig.root);
      this.rig = rig;

      return true;
    } catch (err) {
      console.warn(
        "[MascotPixiEngine] PixiJS WebGL initialization caught safely (WebGL context lost / shader unsupported). Falling back to SVG.",
        err
      );
      this.destroy();
      return false;
    }
  }

  /**
   * Resize canvas and reposition root container
   */
  public resize(width: number, height: number) {
    if (!this.app || !this.rig) return;
    try {
      this.app.renderer.resize(width, height);
      this.rig.root.position.set(width / 2, height / 2 + 6);
    } catch (e) {
      console.warn("[MascotPixiEngine] resize error:", e);
    }
  }

  /**
   * Set eye expression on the sprite rig
   */
  public setExpression(expression: EyeExpression, themeHex?: string) {
    this.rig?.setExpression(expression, themeHex);
  }

  /**
   * Set theme color on the sprite rig
   */
  public setTheme(themeHex: string) {
    this.rig?.setTheme(themeHex);
  }

  /**
   * Set normalized cursor gaze vector [-1, 1]
   */
  public setGaze(x: number, y: number) {
    this.rig?.setGaze(x, y);
  }

  /**
   * Execute frame physics update
   */
  public tick(
    deltaTime: number,
    activity: MascotActivity,
    isHovered: boolean,
    isSpeaking: boolean,
    isThinking: boolean,
    frequencies: number[] = [],
    volume: number = 0
  ) {
    if (!this.app || !this.rig) return;
    try {
      this.rig.update(
        deltaTime,
        activity,
        isHovered,
        isSpeaking,
        isThinking,
        frequencies,
        volume
      );
    } catch (e) {
      // Catch transient render errors
    }
  }

  /**
   * Safely destroy the application and free WebGL resources
   */
  public destroy() {
    this.isDestroyed = true;

    if (this.canvasElement && this.onContextLostHandler) {
      try {
        this.canvasElement.removeEventListener("webglcontextlost", this.onContextLostHandler);
      } catch {
        // ignore
      }
      this.onContextLostHandler = null;
    }

    if (this.rig) {
      try {
        this.rig.destroy();
      } catch {
        // ignore
      }
      this.rig = null;
    }

    if (this.app) {
      try {
        this.app.destroy(true, { children: true });
      } catch (e) {
        console.warn("[MascotPixiEngine] destroy warning:", e);
      }
      this.app = null;
    }
  }
}
