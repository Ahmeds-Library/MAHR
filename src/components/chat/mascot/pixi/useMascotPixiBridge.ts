import { useEffect, useRef, useState } from "react";
import { MascotPixiEngine, isWebGLFunctional } from "./MascotPixiEngine";
import { EyeExpression, MascotActivity } from "../useMascotPlayEngine";

export interface MascotPixiBridgeOptions {
  expression: EyeExpression;
  themeHex: string;
  activity: MascotActivity;
  isHovered: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  gaze: { x: number; y: number };
  audioFrequencies?: number[];
  audioVolume?: number;
  width?: number;
  height?: number;
}

/**
 * Layer 3: Mascot PixiJS Bridge Hook
 * Bridges high-frequency React state & audio props to the PixiJS WebGL canvas,
 * with graceful detection and failure recovery.
 */
export function useMascotPixiBridge(options: MascotPixiBridgeOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MascotPixiEngine | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const [isWebglReady, setIsWebglReady] = useState<boolean>(false);
  const [webglFailed, setWebglFailed] = useState<boolean>(!isWebGLFunctional());

  const {
    expression,
    themeHex,
    activity,
    isHovered,
    isSpeaking,
    isThinking,
    gaze,
    audioFrequencies = [],
    audioVolume = 0,
    width = 110,
    height = 110,
  } = options;

  // 1. Initialize Engine on canvas mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isWebGLFunctional()) {
      setWebglFailed(true);
      return;
    }

    const engine = new MascotPixiEngine();
    engineRef.current = engine;

    let isMounted = true;

    engine
      .init(canvas, width, height, themeHex)
      .then((success) => {
        if (!isMounted) return;
        if (success) {
          setIsWebglReady(true);
          setWebglFailed(false);
          engine.setExpression(expression, themeHex);
          engine.setTheme(themeHex);
        } else {
          setIsWebglReady(false);
          setWebglFailed(true);
        }
      })
      .catch((err) => {
        console.warn("[useMascotPixiBridge] engine.init failed safely:", err);
        if (isMounted) {
          setIsWebglReady(false);
          setWebglFailed(true);
        }
      });

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      engine.destroy();
      engineRef.current = null;
      setIsWebglReady(false);
    };
  }, [width, height]);

  // 2. Reactively update expression
  useEffect(() => {
    if (isWebglReady) {
      engineRef.current?.setExpression(expression, themeHex);
    }
  }, [expression, themeHex, isWebglReady]);

  // 3. Reactively update theme
  useEffect(() => {
    if (isWebglReady) {
      engineRef.current?.setTheme(themeHex);
    }
  }, [themeHex, isWebglReady]);

  // 4. Update Gaze target
  useEffect(() => {
    if (isWebglReady) {
      engineRef.current?.setGaze(gaze.x, gaze.y);
    }
  }, [gaze.x, gaze.y, isWebglReady]);

  // 5. High-frequency 60 FPS animation ticker loop
  useEffect(() => {
    if (!isWebglReady) return;
    let active = true;

    const loop = (currentTime: number) => {
      if (!active) return;
      const dt = Math.min(2.0, (currentTime - lastTimeRef.current) / 16.666);
      lastTimeRef.current = currentTime;

      engineRef.current?.tick(
        dt,
        activity,
        isHovered,
        isSpeaking,
        isThinking,
        audioFrequencies,
        audioVolume
      );

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [
    activity,
    isHovered,
    isSpeaking,
    isThinking,
    audioFrequencies,
    audioVolume,
    isWebglReady,
  ]);

  return {
    canvasRef,
    isWebglReady,
    webglFailed,
  };
}
