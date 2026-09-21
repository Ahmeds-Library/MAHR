import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MyraaAudioSession, LiveState } from "../lib/audio";
import { Sparkles, Radio, MessageSquare, ShieldAlert, Cpu, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type MahrEmotion = 
  | "idle" 
  | "happy" 
  | "excited" 
  | "curious" 
  | "thinking" 
  | "proud" 
  | "sad" 
  | "confused" 
  | "surprised" 
  | "embarrassed" 
  | "playful"
  | "therapist"
  | "naraz"
  | "gussa"
  | "loving"
  | "analytical";

export type MyraaEmotion = MahrEmotion;

interface MahrCoreVisualizerProps {
  session: MyraaAudioSession | null;
  state: LiveState;
  themeColor: string; // Violet, crimson, emerald, celestial, gold, rose, charcoal
  activeEmotion?: MahrEmotion;
  characterState: "idle" | "thinking" | "talking";
  wakeWordTriggered?: number | boolean;
  sleepTriggered?: number | boolean;
  onManualWakeRequested?: () => void;
  onManualSleepRequested?: () => void;
  isMicDenied?: boolean;
  isWakeWordEnabled?: boolean;
  projectorIntensity?: number;
  valenceScore?: number;
  beamPulseSpeed?: number;
  laserGridOpacity?: number;
}

export type MyraaCoreVisualizerProps = MahrCoreVisualizerProps;

export const MahrCoreVisualizer: React.FC<MahrCoreVisualizerProps> = ({
  session,
  state,
  themeColor,
  activeEmotion = "idle",
  characterState,
  wakeWordTriggered,
  sleepTriggered,
  onManualWakeRequested,
  onManualSleepRequested,
  isMicDenied = false,
  isWakeWordEnabled = true,
  projectorIntensity = 1.0,
  valenceScore = 0.0,
  beamPulseSpeed = 1.8,
  laserGridOpacity = 0.25
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Three.js Engine References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const coreLatticeRef = useRef<THREE.Mesh | null>(null);
  const ring1Ref = useRef<THREE.Mesh | null>(null);
  const ring2Ref = useRef<THREE.Mesh | null>(null);
  const beamConeRef = useRef<THREE.Mesh | null>(null);
  const emitterRingRef = useRef<THREE.Mesh | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Audio & Animation states
  const speechVolumeRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Ripple animation states
  const [isRippleActive, setIsRippleActive] = useState<boolean>(false);
  const [isSleepActive, setIsSleepActive] = useState<boolean>(false);

  // Video element refs for character state machine
  const idleVideoRef = useRef<HTMLVideoElement | null>(null);
  const thinkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const talkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (wakeWordTriggered) {
      setIsRippleActive(true);
      const timer = setTimeout(() => setIsRippleActive(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [wakeWordTriggered]);

  useEffect(() => {
    if (sleepTriggered) {
      setIsSleepActive(true);
      const timer = setTimeout(() => setIsSleepActive(false), 2800);
      return () => clearTimeout(timer);
    }
  }, [sleepTriggered]);

  const handleVideoError = (videoName: string) => {
    console.warn(`[Myraa Web Video] Failed to load video source for: ${videoName}`);
    setHasError(true);
  };

  // Video playback sync
  useEffect(() => {
    const playVideo = (videoEl: HTMLVideoElement | null) => {
      if (!videoEl) return;
      try {
        videoEl.currentTime = 0;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } catch (err) {}
    };

    const pauseVideo = (videoEl: HTMLVideoElement | null) => {
      if (!videoEl) return;
      try { videoEl.pause(); } catch (err) {}
    };

    if (characterState === "idle") {
      playVideo(idleVideoRef.current);
      pauseVideo(thinkingVideoRef.current);
      pauseVideo(talkingVideoRef.current);
    } else if (characterState === "thinking") {
      playVideo(thinkingVideoRef.current);
      pauseVideo(idleVideoRef.current);
      pauseVideo(talkingVideoRef.current);
    } else if (characterState === "talking") {
      playVideo(talkingVideoRef.current);
      pauseVideo(idleVideoRef.current);
      pauseVideo(thinkingVideoRef.current);
    }
  }, [characterState]);

  // Cursor position tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Get theme hex colors
  const getThemeHex = () => {
    switch (themeColor) {
      case "violet": return { primary: 0x9333ea, secondary: 0xc026d3, glow: 0xa855f7 };
      case "crimson": return { primary: 0xe11d48, secondary: 0xea580c, glow: 0xf43f5e };
      case "emerald": return { primary: 0x059669, secondary: 0x0d9488, glow: 0x10b981 };
      case "celestial": return { primary: 0x0284c7, secondary: 0x0891b2, glow: 0x0ea5e9 };
      case "gold": return { primary: 0xca8a04, secondary: 0xd97706, glow: 0xeab308 };
      case "rose": return { primary: 0xdb2777, secondary: 0xdc2626, glow: 0xec4899 };
      case "charcoal": return { primary: 0x475569, secondary: 0x334155, glow: 0x64748b };
      default: return { primary: 0x22d3ee, secondary: 0x4f46e5, glow: 0x06b6d4 };
    }
  };

  // Three.js High Performance Holographic Engine Initialization
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 110);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const theme = getThemeHex();

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const primaryLight = new THREE.PointLight(theme.glow, 3, 200);
    primaryLight.position.set(0, 20, 30);
    scene.add(primaryLight);

    const cyanRim = new THREE.DirectionalLight(0x22d3ee, 2);
    cyanRim.position.set(-50, 50, 50);
    scene.add(cyanRim);

    // Clean background without 3D particles or orb overlays
    let clock = new THREE.Clock();

    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);
      renderer.render(scene, camera);
    };

    render();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [themeColor, projectorIntensity, state, session]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* 1. Behind Overlay / Atmospheric Backlight Glow */}
      <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none z-0">
        <div className={`w-[500px] h-[500px] rounded-full blur-[140px] opacity-25 bg-gradient-to-tr transition-all duration-1000 ${
          themeColor === "violet" ? "from-purple-600/30 to-fuchsia-600/5" :
          themeColor === "crimson" ? "from-rose-600/30 to-orange-600/5" :
          themeColor === "emerald" ? "from-emerald-600/30 to-teal-600/5" :
          themeColor === "celestial" ? "from-sky-600/30 to-cyan-600/5" :
          themeColor === "gold" ? "from-amber-600/30 to-yellow-600/5" :
          themeColor === "rose" ? "from-rose-600/30 to-pink-600/5" :
          "from-indigo-600/30 to-cyan-600/5"
        }`} />
      </div>

      {/* 2. Character Videos State Crossfade Manager */}
      <div 
        id="myraa-animated-presence"
        className="absolute z-10 w-full h-full flex items-center justify-center pointer-events-auto transition-all duration-700"
      >
        <div className="relative w-full max-w-4xl aspect-[16/9] flex items-center justify-center scale-[0.95] sm:scale-110 select-none pointer-events-none md:max-h-[72vh] max-h-[62vh]">
          {/* Subtle Outer Ambient Shadow Cast */}
          <div className="absolute inset-0 rounded-[2.5rem] blur-[30px] opacity-20 bg-cyan-600/15 pointer-events-none mix-blend-screen" />

          {/* SUBTLE HOLOGRAPHIC RIPPLE ANIMATION ON WAKE WORD DETECTION */}
          <AnimatePresence>
            {isRippleActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                {[0, 1, 2].map((ring) => (
                  <motion.div
                    key={ring}
                    initial={{ opacity: 0.9, scale: 0.65 }}
                    animate={{ opacity: 0, scale: 1.35 + ring * 0.2 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.7 + ring * 0.2,
                      ease: [0.16, 1, 0.3, 1],
                      delay: ring * 0.15
                    }}
                    className="absolute rounded-[2.5rem] border-2 pointer-events-none"
                    style={{
                      width: "92%",
                      height: "92%",
                      borderColor: themeColor === "crimson" ? "rgba(244, 63, 94, 0.9)" :
                                   themeColor === "emerald" ? "rgba(16, 185, 129, 0.9)" :
                                   themeColor === "gold" ? "rgba(245, 158, 11, 0.9)" :
                                   "rgba(34, 211, 238, 0.9)",
                      boxShadow: themeColor === "crimson"
                        ? "0 0 60px rgba(244, 63, 94, 0.5), inset 0 0 35px rgba(244, 63, 94, 0.3)"
                        : "0 0 60px rgba(34, 211, 238, 0.5), inset 0 0 35px rgba(168, 85, 247, 0.35)",
                      background: "radial-gradient(circle, rgba(34,211,238,0.14) 0%, rgba(168,85,247,0.06) 50%, rgba(0,0,0,0) 80%)"
                    }}
                  />
                ))}

                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.85, 1.05, 1, 0.95], y: 0 }}
                  transition={{ duration: 2.2, times: [0, 0.25, 0.8, 1], ease: "easeInOut" }}
                  className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-cyan-400/80 text-cyan-200 font-mono text-xs font-black tracking-widest uppercase shadow-[0_0_40px_rgba(34,211,238,0.6)] flex items-center gap-2 z-50 backdrop-blur-xl"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>✨ WAKE WORD DETECTED • AWAKENING MAHR</span>
                </motion.div>
              </div>
            )}

            {isSleepActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                {[0, 1].map((ring) => (
                  <motion.div
                    key={ring}
                    initial={{ opacity: 0.8, scale: 1.2 }}
                    animate={{ opacity: 0, scale: 0.7 - ring * 0.15 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 2.0 + ring * 0.3,
                      ease: "easeInOut",
                      delay: ring * 0.2
                    }}
                    className="absolute rounded-[2.5rem] border-2 border-indigo-400/80 pointer-events-none"
                    style={{
                      width: "90%",
                      height: "90%",
                      boxShadow: "0 0 50px rgba(99, 102, 241, 0.4), inset 0 0 30px rgba(79, 70, 229, 0.3)",
                      background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(15,23,42,0.4) 80%)"
                    }}
                  />
                ))}

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1.02, 1, 0.95], y: 0 }}
                  transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                  className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-indigo-500/80 text-indigo-200 font-mono text-xs font-black tracking-widest uppercase shadow-[0_0_40px_rgba(99,102,241,0.5)] flex items-center gap-2 z-50 backdrop-blur-xl"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>🌙 SLEEP MODE ACTIVATED • STANDBY LISTENING</span>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* IDLE VIDEO */}
          <motion.div
            key="idle-video-container"
            animate={{ 
              opacity: characterState === "idle" ? 1 : 0,
              scale: characterState === "idle" ? 1.0 : 0.96,
              filter: characterState === "idle" ? "blur(0px) brightness(1.05)" : "blur(14px) brightness(0.55)",
            }}
            transition={{ duration: 0.9, ease: [0.25, 0.8, 0.25, 1] }}
            className={`absolute inset-0 w-full h-full pointer-events-none ${characterState === "idle" ? "z-10" : "z-0"}`}
          >
            <video
              ref={idleVideoRef}
              src="/assets/idle.mp4"
              loop
              muted
              playsInline
              autoPlay
              className="w-full h-full object-cover rounded-[2.5rem]"
              style={{
                maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
              }}
              onError={() => handleVideoError("idle")}
            />
          </motion.div>

          {/* THINKING VIDEO */}
          <motion.div
            key="thinking-video-container"
            animate={{ 
              opacity: characterState === "thinking" ? 1 : 0,
              scale: characterState === "thinking" ? 1.0 : 0.96,
              filter: characterState === "thinking" ? "blur(0px) brightness(1.05)" : "blur(14px) brightness(0.55)",
            }}
            transition={{ duration: 0.9, ease: [0.25, 0.8, 0.25, 1] }}
            className={`absolute inset-0 w-full h-full pointer-events-none ${characterState === "thinking" ? "z-10" : "z-0"}`}
          >
            <video
              ref={thinkingVideoRef}
              src="/assets/thinking.mp4"
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-[2.5rem]"
              style={{
                maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
              }}
              onError={() => handleVideoError("thinking")}
            />
          </motion.div>

          {/* TALKING VIDEO */}
          <motion.div
            key="talking-video-container"
            animate={{ 
              opacity: characterState === "talking" ? 1 : 0,
              scale: characterState === "talking" ? 1.015 : 0.96,
              filter: characterState === "talking" ? "blur(0px) brightness(1.1)" : "blur(14px) brightness(0.55)",
            }}
            transition={{ duration: 0.9, ease: [0.25, 0.8, 0.25, 1] }}
            className={`absolute inset-0 w-full h-full pointer-events-none ${characterState === "talking" ? "z-10" : "z-0"}`}
          >
            <video
              ref={talkingVideoRef}
              src="/assets/talking.mp4"
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-[2.5rem]"
              style={{
                maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
              }}
              onError={() => handleVideoError("talking")}
            />
          </motion.div>

          {/* Holographic Avatar Core Fallback when video is loading or unsupported */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-radial from-cyan-950/20 via-[#05060f]/60 to-[#05060f]/90 backdrop-blur-sm rounded-3xl p-6 text-center z-10 pointer-events-auto">
              <div className="relative flex items-center justify-center w-36 h-36 mb-4">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
                <div className="absolute inset-2 rounded-full border border-cyan-400/40 animate-spin" style={{ animationDuration: '12s' }} />
                <div className="absolute inset-6 rounded-full border border-purple-500/30 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400/30 via-purple-600/30 to-blue-500/20 backdrop-blur-md border border-cyan-300/50 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Sparkles className="text-cyan-300 animate-pulse" size={28} />
                </div>
              </div>
              <span className="text-xs font-mono font-semibold tracking-widest text-cyan-300 uppercase">
                MAHR Neural Core
              </span>
              <span className="text-[11px] text-slate-400 mt-1 font-sans">
                Real-Time Quantum Holographic Avatar
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Three.js Real-time WebGL Holographic Projection Canvas */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />
    </div>
  );
};

export const MyraaCoreVisualizer = MahrCoreVisualizer;
