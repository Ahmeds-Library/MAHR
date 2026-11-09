import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MyraaAudioSession, LiveState } from "../lib/audio";
import { Sparkles, Radio, MessageSquare, ShieldAlert, Cpu, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HumanMoodType } from "@/services/humanEmotionEngine";
import { RLAtmospherePolicy } from "@/services/ml/rlMoodOptimizer";
import { useMoodPulseResonance } from "@/hooks/visualizer/useMoodPulseResonance";
import { MahrMoodResonanceAura } from "@/components/visualizer/MahrMoodResonanceAura";
import { MahrCharacterAvatar } from "@/components/character/MahrCharacterAvatar";

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
  currentHumanMood?: HumanMoodType;
  rlPolicy?: RLAtmospherePolicy | null;
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
  laserGridOpacity = 0.25,
  currentHumanMood = "neutral",
  rlPolicy = null,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Hook up adaptive ML/RL mood resonance pulsing
  const { pulseScale, auraOpacity, isResponding, resonanceProfile } = useMoodPulseResonance({
    currentMood: currentHumanMood,
    characterState,
    session,
    rlPolicy,
  });

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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent">
      {/* 2. Character Videos State Crossfade Manager */}
      <div 
        id="myraa-animated-presence"
        className="absolute z-10 w-full h-full flex items-center justify-center pointer-events-auto transition-all duration-700"
      >
        <div 
          className="relative w-full h-full flex items-center justify-center select-none pointer-events-none"
          style={{
            transform: `scale(${characterState === "idle" ? 1.0 : pulseScale})`,
            transition: "transform 0.08s ease-out",
          }}
        >

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
                    className="absolute rounded-full border-2 pointer-events-none aspect-square w-72 sm:w-96 md:w-[480px]"
                    style={{
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
                    className="absolute rounded-full border-2 border-indigo-400/80 pointer-events-none aspect-square w-72 sm:w-96 md:w-[480px]"
                    style={{
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

          {/* Real-Time MAHR Holographic Character Avatar */}
          <MahrCharacterAvatar
            characterState={characterState}
            themeColor={themeColor}
            activeEmotion={activeEmotion}
            currentHumanMood={currentHumanMood}
            pulseScale={pulseScale}
            isResponding={isResponding}
            onCharacterClick={onManualWakeRequested}
          />
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
