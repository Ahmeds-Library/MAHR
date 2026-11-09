import React, { useState, useRef, useEffect } from "react";
import { motion, TargetAndTransition } from "motion/react";
import { X, Rotate3D } from "lucide-react";
import {
  useMascotPlayEngine,
  MascotActivity,
  EyeExpression,
} from "./mascot/useMascotPlayEngine";
import { useCursorTracker } from "./mascot/useCursorTracker";
import { useMascotMahrSync } from "./mascot/useMascotMahrSync";
import { MascotSparkles } from "./mascot/MascotSparkles";
import { MascotScreenBonkFx } from "./mascot/MascotScreenBonkFx";
import { MascotEnergyBallProp } from "./mascot/MascotEnergyBallProp";
import { MascotToyboxPropsFx } from "./mascot/MascotToyboxPropsFx";
import { MascotToyboxDock } from "./mascot/MascotToyboxDock";
import { MascotFlickAimOverlay } from "./mascot/MascotFlickAimOverlay";
import { useMascotFlickToss } from "./mascot/useMascotFlickToss";
import { MascotCursorPlayFx } from "./mascot/MascotCursorPlayFx";
import { MascotGreetingWave } from "./mascot/MascotGreetingWave";
import { MascotSteamFx } from "./mascot/MascotSteamFx";
import { MascotSleepBubbles } from "./mascot/MascotSleepBubbles";
import { MascotMahrAura } from "./mascot/MascotMahrAura";
import { MascotAudioWaveform } from "./mascot/MascotAudioWaveform";
import { MascotNeuralRing } from "./mascot/MascotNeuralRing";
import { MahrSphericalDroneMascot } from "./mascot/vector/MahrSphericalDroneMascot";
import { DroneTurnaroundSheetModal } from "./mascot/vector/DroneTurnaroundSheetModal";
import { DronePoseAngle } from "./mascot/vector/droneVectorTypes";
import { MahrEmotion } from "@/components/MahrCoreVisualizer";
import { MyraaAudioSession, LiveState } from "@/lib/audio";
import { ActiveWorkspacePage } from "@/core/mascot/mascotPageContextTypes";
import { useMascotWorkObserver } from "./mascot/useMascotWorkObserver";
import { MascotWorkAttentionBubble } from "./mascot/MascotWorkAttentionBubble";

export interface MahrCuteMascotTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  themeColor?: string;
  isRealtimeConnected?: boolean;
  activeEmotion?: MahrEmotion;
  characterState?: "idle" | "thinking" | "talking";
  isSpeaking?: boolean;
  isAiThinking?: boolean;
  audioSession?: MyraaAudioSession | null;
  liveState?: LiveState;
  activePage?: ActiveWorkspacePage;
}

export const MahrCuteMascotTrigger: React.FC<MahrCuteMascotTriggerProps> = ({
  isOpen,
  onToggle,
  unreadCount = 0,
  themeColor = "celestial",
  isRealtimeConnected = false,
  activeEmotion = "idle",
  characterState = "idle",
  isSpeaking = false,
  isAiThinking = false,
  audioSession = null,
  liveState = "disconnected",
  activePage = "home",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTurnaroundModal, setShowTurnaroundModal] = useState(false);
  const [activePoseMode, setActivePoseMode] = useState<
    DronePoseAngle | "auto"
  >("auto");
  const triggerRef = useRef<HTMLDivElement>(null);

  // Observe user work actions across all pages + 10s inactivity threshold
  const workObserver = useMascotWorkObserver({
    activePage,
    isChatOpen: isOpen,
    isMascotHovered: isHovered,
    mascotRef: triggerRef,
  });

  // Mahr synchronization engine
  const mahrSync = useMascotMahrSync({
    activeEmotion,
    characterState,
    isSpeaking,
    isAiThinking,
    audioSession,
    liveState,
    themeColor,
  });

  const {
    activity,
    expression,
    sparkles,
    isBonkFxActive,
    bonkState,
    isWaving,
    showGreetingBubble,
    isAngry,
    isTrembling,
    isSleeping,
    isDrowsy,
    hideStage,
    roamOffset,
    ballState,
    toyPropState,
    cursorPlay,
    velocityTilt,
    landingScale,
    selectedTossProp,
    setSelectedTossProp,
    launchTossedProp,
    poke,
    wakeUp,
    executeTrick,
    dismissGreeting,
    resetToOrigin,
  } = useMascotPlayEngine(
    isOpen,
    isHovered,
    workObserver.isUserActivelyWorking
  );

  // Direct click-and-drag flick throw controller
  const { flickState, handlePointerDown, consumeDidDrag } = useMascotFlickToss({
    disabled: isOpen,
    selectedTossProp,
    onSelectNextProp: setSelectedTossProp,
    onTossProp: launchTossedProp,
  });

  // Continuous 3D spherical orientation tracking relative to cursor position when awake
  const gaze = useCursorTracker(triggerRef, !isOpen && !isSleeping);

  // Brief physical micro-nod whenever the user clicks, types, draws, or switches pages
  const [isNoticingAction, setIsNoticingAction] = useState(false);
  useEffect(() => {
    if (workObserver.workPulseKey === 0) return;
    setIsNoticingAction(true);
    const timer = setTimeout(() => setIsNoticingAction(false), 240);
    return () => clearTimeout(timer);
  }, [workObserver.workPulseKey]);

  // Effective gaze: blend real-time damped cursor tracker with focused typing/work coordinates
  const isTypingWithoutMouse =
    workObserver.isUserActivelyWorking &&
    workObserver.lastWorkAction === "typing" &&
    !gaze.isPointerActive &&
    Boolean(workObserver.workFocusGaze);

  const effectiveLookX =
    isTypingWithoutMouse && workObserver.workFocusGaze
      ? workObserver.workFocusGaze.x
      : gaze.lookX;
  const effectiveLookY =
    isTypingWithoutMouse && workObserver.workFocusGaze
      ? workObserver.workFocusGaze.y
      : gaze.lookY;

  const effectiveEyeLookX =
    isTypingWithoutMouse && workObserver.workFocusGaze
      ? workObserver.workFocusGaze.x
      : gaze.eyeLookX;
  const effectiveEyeLookY =
    isTypingWithoutMouse && workObserver.workFocusGaze
      ? workObserver.workFocusGaze.y
      : gaze.eyeLookY;

  const effectiveExpression: EyeExpression =
    isBonkFxActive || isAngry
      ? expression
      : mahrSync.isMahrActive
      ? mahrSync.syncedExpression
      : workObserver.isUserActivelyWorking && workObserver.activeReaction
      ? workObserver.activeReaction.expression
      : expression;

  const isSpatial60FpsTrick =
    activity === "ball_play" ||
    activity === "butterfly_chase" ||
    activity === "cyber_cube_juggle" ||
    activity === "roam" ||
    activity === "star_ring_hop" ||
    activity === "mouse_play" ||
    activity === "hide_and_seek" ||
    activity === "backflip" ||
    activity === "screen_bonk";

  const getActivityAnimation = (): TargetAndTransition => {
    if (isTrembling) {
      return {
        x: [-2, 2, -1.5, 1.5, 0],
        scale: 1.05,
        transition: { repeat: Infinity, duration: 0.32, ease: "easeInOut" },
      };
    }

    if (mahrSync.isMahrSpeaking) {
      return {
        scale: 1.03 + mahrSync.audioVolume * 0.08,
        rotate: velocityTilt,
        transition: { duration: 0.08, ease: "linear" },
      };
    }

    const baseScale = flickState.isDragging
      ? 0.92
      : workObserver.isEdgePeeking
      ? 0.86
      : isNoticingAction && !isSpatial60FpsTrick
      ? 1.04 * landingScale
      : isHovered && !isSpatial60FpsTrick
      ? 1.05 * landingScale
      : landingScale;

    // Subtle attentive head tilt / nod when actively noticing user actions and cursor movement
    const workReactionTilt =
      workObserver.isUserActivelyWorking &&
      !isSpatial60FpsTrick &&
      workObserver.activeReaction
        ? workObserver.activeReaction.headMotion === "curious_tilt"
          ? -5 + gaze.rotateZ * 0.45
          : workObserver.activeReaction.headMotion === "analytical_scan"
          ? effectiveLookX * 6
          : gaze.rotateZ * 0.55
        : gaze.rotateZ * 0.45;

    const noticeNodY =
      isNoticingAction && !isSpatial60FpsTrick
        ? workObserver.activeReaction?.headMotion === "cheer_bounce"
          ? -4.5
          : 2.8
        : 0;

    return {
      x: isSpatial60FpsTrick ? 0 : effectiveLookX * 5.8,
      y: isSpatial60FpsTrick ? 0 : effectiveLookY * 4.8 + noticeNodY,
      scale: baseScale,
      rotate: velocityTilt + workReactionTilt,
      transition: {
        type: "tween",
        duration: 0.016,
        ease: "linear",
      },
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    // If the user just released a click-and-drag flick throw, do not toggle the chat modal
    if (consumeDidDrag()) {
      return;
    }

    if (
      isSleeping ||
      isDrowsy ||
      activity === "sleeping" ||
      activity === "sleepy" ||
      activity === "idle_drowsy"
    ) {
      wakeUp();
      return;
    }

    if (isAngry || e.shiftKey) {
      poke();
      return;
    }

    const distFromDock = Math.hypot(roamOffset.x, roamOffset.y);
    if (activity === "hide_and_seek" || distFromDock > 32) {
      resetToOrigin();
      return;
    }

    if (showGreetingBubble) {
      dismissGreeting();
    }

    onToggle();
  };

  const effectiveDroneActivity: MascotActivity = activity;

  const edgePeekOffsetX = workObserver.isEdgePeeking ? 28 : 0;
  const edgePeekOffsetY = workObserver.isEdgePeeking ? 14 : 0;

  return (
    <>
      <div
        ref={triggerRef}
        className="fixed bottom-6 right-6 z-[220] select-none pointer-events-auto will-change-transform"
        onMouseEnter={() => {
          setIsHovered(true);
          if (isSleeping || isDrowsy) {
            wakeUp();
          }
        }}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: `translate3d(${roamOffset.x + edgePeekOffsetX}px, ${
            roamOffset.y + edgePeekOffsetY
          }px, 0)`,
          transition: workObserver.isEdgePeeking
            ? "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)"
            : "none",
        }}
      >
        {/* Spontaneous Warm Companion Speech Bubble */}
        <MascotWorkAttentionBubble
          visible={workObserver.showAttentionBubble && !isHovered && !isOpen}
          reaction={workObserver.activeReaction}
        />
        {/* Hover Mini-Toybox Dock for Manual Prop & Trick Triggering */}
        <MascotToyboxDock
          visible={isHovered && !isOpen && !flickState.isDragging}
          activeActivity={activity}
          selectedTossProp={selectedTossProp}
          onSelectTossProp={setSelectedTossProp}
          onTriggerTrick={executeTrick}
        />

        {/* Direct Click-and-Drag Flick Throw Aim Vector HUD */}
        <MascotFlickAimOverlay flickState={flickState} />

        {/* Directional Screen & Boundary Wall Glass Bonk FX */}
        <MascotScreenBonkFx
          isActive={isBonkFxActive}
          bonkState={bonkState}
        />

        {/* Screen-Pet Bouncing Plasma Ball Prop */}
        <MascotEnergyBallProp ballState={ballState} />

        {/* Screen-Pet Toybox Props (Holo Butterfly, Cyber-Cube, Sonic Star Rings) */}
        <MascotToyboxPropsFx toyProp={toyPropState} />

        {/* Screen-Pet Cursor Stalk & Pounce FX */}
        <MascotCursorPlayFx cursorPlay={cursorPlay} />

        {/* Playful Floating Sparkles */}
        <MascotSparkles sparkles={sparkles} />

        {/* Angry Tantrum Steam FX */}
        <MascotSteamFx isAngry={isAngry} />

        {/* Cozy Starry Dream Particles & Sleepy Zzz Bubbles */}
        <MascotSleepBubbles isSleeping={isSleeping} isDrowsy={isDrowsy} />

        {/* Mahr Holographic Energy Aura */}
        <MascotMahrAura
          palette={mahrSync.palette}
          isSpeaking={mahrSync.isMahrSpeaking}
          isThinking={mahrSync.isMahrThinking}
          isActive={mahrSync.isMahrActive}
          audioVolume={mahrSync.audioVolume}
        />

        {/* Mascot Neural Orbital Ring when Mahr is thinking */}
        <MascotNeuralRing
          isThinking={mahrSync.isMahrThinking}
          palette={mahrSync.palette}
        />

        {/* Hide & Seek Peeking Wrapper */}
        <motion.div
          animate={{
            opacity: hideStage === "hiding" ? 0.42 : 1,
            scale: hideStage === "hiding" ? 0.86 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated Greeting Bubble */}
          <MascotGreetingWave
            isWaving={isWaving}
            showBubble={showGreetingBubble}
            onDismissBubble={dismissGreeting}
          />

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="relative group"
          >
            {/* Quick 360° Turnaround Sheet Inspector Button (Appears on Hover) */}
            {!isOpen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTurnaroundModal(true);
                }}
                title="Inspect 360° Vector Turnaround Poses"
                className="absolute -bottom-1 -left-2 z-30 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-cyan-400/50 bg-slate-900/95 text-cyan-300 opacity-0 shadow-md transition-opacity duration-200 hover:bg-cyan-500 hover:text-slate-950 group-hover:opacity-100"
              >
                <Rotate3D className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Real-time Voice Audio Equalizer Waveform when Mahr is speaking */}
            <MascotAudioWaveform
              isSpeaking={mahrSync.isMahrSpeaking}
              frequencies={mahrSync.audioFrequencies}
              palette={mahrSync.palette}
            />

            <motion.button
              type="button"
              onPointerDown={handlePointerDown}
              onClick={handleClick}
              aria-label={isOpen ? "Close MAHR Chat" : "Open MAHR Chat or Drag to Toss Prop"}
              className="relative flex h-22 w-22 cursor-grab items-center justify-center rounded-full p-0 transition-all duration-300 focus:outline-none active:cursor-grabbing sm:h-24 sm:w-24 touch-none"
            >
              {/* Soft Cyan/Lavender Ambient Hover Glow */}
              <div
                className="pointer-events-none absolute inset-1 rounded-full opacity-65 blur-md transition-all duration-300 group-hover:opacity-100"
                style={{
                  background: isAngry
                    ? "radial-gradient(circle, rgba(244,63,94,0.75) 0%, rgba(225,29,72,0.3) 70%, transparent 100%)"
                    : isRealtimeConnected
                    ? "radial-gradient(circle, rgba(52,211,153,0.65) 0%, rgba(56,189,248,0.25) 70%, transparent 100%)"
                    : "radial-gradient(circle, rgba(103,232,249,0.55) 0%, rgba(196,181,253,0.3) 68%, transparent 100%)",
                }}
              />

              {/* Multi-Angle Vector Spherical Hover-Drone Companion */}
              <motion.div
                animate={getActivityAnimation()}
                className="relative flex h-full w-full items-center justify-center"
              >
                <MahrSphericalDroneMascot
                  expression={effectiveExpression}
                  themeHex={
                    isAngry
                      ? "#f43f5e"
                      : mahrSync.palette.primary || "#38bdf8"
                  }
                  activity={effectiveDroneActivity}
                  isHovered={isHovered}
                  isSpeaking={mahrSync.isMahrSpeaking}
                  isThinking={
                    mahrSync.isMahrThinking ||
                    (workObserver.isUserActivelyWorking &&
                      workObserver.activeReaction?.expression === "analytical")
                  }
                  isRealtimeConnected={isRealtimeConnected}
                  gaze={{
                    x: effectiveLookX,
                    y: effectiveLookY,
                    eyeX: effectiveEyeLookX,
                    eyeY: effectiveEyeLookY,
                    blinkProgress: gaze.blinkProgress,
                  }}
                  audioFrequencies={mahrSync.audioFrequencies}
                  audioVolume={mahrSync.audioVolume}
                  velocityTilt={velocityTilt}
                  size={92}
                  forcePose={
                    activePoseMode === "auto" ? undefined : activePoseMode
                  }
                />

                {/* When Open: Subtle floating close badge overlay */}
                {isOpen && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-2 z-20 flex items-center justify-center rounded-full border border-cyan-400/30 bg-slate-950/85 backdrop-blur-sm"
                  >
                    <X size={20} className="text-cyan-200 drop-shadow-md" />
                  </motion.div>
                )}
              </motion.div>

              {/* Unread Counter Badge */}
              {unreadCount > 0 && !isOpen && (
                <span className="absolute right-0 top-0 flex h-5 w-5 animate-bounce items-center justify-center rounded-full border border-white/40 bg-rose-500 font-mono text-[10px] font-bold text-white shadow-lg">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* 10-View Vector Turnaround Inspector Modal */}
      <DroneTurnaroundSheetModal
        isOpen={showTurnaroundModal}
        onClose={() => setShowTurnaroundModal(false)}
        activePoseMode={activePoseMode}
        onSelectPoseMode={(pose) => setActivePoseMode(pose)}
      />
    </>
  );
};
