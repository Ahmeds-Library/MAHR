import { useState, useEffect, useRef, useCallback } from "react";
import {
  MascotActivity,
  EyeExpression,
  HideStage,
  SparkleParticle,
  BallPlayState,
  ToyPropState,
  BonkState,
  CursorPlayState,
  pickNextNonRepeatingActivity,
} from "./mascotPlayTypes";
import { TossablePropKind } from "./mascotPhysicsTypes";
import { useMascotPhysicsLoop } from "./useMascotPhysicsLoop";

export type {
  MascotActivity,
  EyeExpression,
  HideStage,
  SparkleParticle,
  BallPlayState,
  ToyPropState,
  BonkState,
  CursorPlayState,
  TossablePropKind,
};

export function useMascotPlayEngine(
  isOpen: boolean,
  isHovered: boolean,
  isUserActivelyWorking = false
) {
  const [activity, setActivity] = useState<MascotActivity>("idle");
  const [expression, setExpression] = useState<EyeExpression>("normal");
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const [isBonkFxActive, setIsBonkFxActive] = useState<boolean>(false);
  const [bonkState, setBonkState] = useState<BonkState>({
    active: false,
    impactX: 0,
    impactY: 0,
    variant: "front_glass",
    label: "BONK!",
  });
  const [isWaving, setIsWaving] = useState<boolean>(false);
  const [isEntryComplete, setIsEntryComplete] = useState<boolean>(false);
  const [isAngry, setIsAngry] = useState<boolean>(false);
  const [isTrembling, setIsTrembling] = useState<boolean>(false);
  const [isTrackingCursor, setIsTrackingCursor] = useState<boolean>(false);
  const [isAntennaPulsing, setIsAntennaPulsing] = useState<boolean>(false);
  const [hideStage, setHideStage] = useState<HideStage>("none");
  const [selectedTossProp, setSelectedTossProp] =
    useState<TossablePropKind>("plasma_ball");

  // Dynamic roam position offsets (x, y) across the full-screen arena (driven at 60fps)
  const [roamOffset, setRoamOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Multi-bounce Plasma Ball prop state
  const [ballState, setBallState] = useState<BallPlayState>({
    active: false,
    ballX: 0,
    ballY: -42,
    bounceCount: 0,
    hitTrigger: 0,
    wallBounce: "none",
    comboCount: 0,
  });

  // Multi-item Toybox prop state (Butterfly, Cyber-Cube, Star Rings)
  const [toyPropState, setToyPropState] = useState<ToyPropState>({
    active: false,
    toyType: "none",
    x: 0,
    y: -48,
    rotation: 0,
    scale: 1,
    phase: "spawn",
    step: 0,
  });

  // Cursor pounce / mouse play prop state
  const [cursorPlay, setCursorPlay] = useState<CursorPlayState>({
    active: false,
    targetX: -48,
    targetY: -36,
    phase: "stalking",
  });

  // Live refs to prevent effect cleanup from cancelling active tricks when state transitions
  const activityRef = useRef<MascotActivity>(activity);
  activityRef.current = activity;

  const isHoveredRef = useRef<boolean>(isHovered);
  isHoveredRef.current = isHovered;

  const isOpenRef = useRef<boolean>(isOpen);
  isOpenRef.current = isOpen;

  const isWorkingRef = useRef<boolean>(isUserActivelyWorking);
  isWorkingRef.current = isUserActivelyWorking;

  const randomTimerRef = useRef<NodeJS.Timeout | null>(null);
  const actionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const deepSleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDeepSleepingRef = useRef<boolean>(false);
  const isWakingUpRef = useRef<boolean>(false);
  const hideSequenceTimersRef = useRef<NodeJS.Timeout[]>([]);
  const particleIdRef = useRef<number>(0);
  const hasInitialGreetedRef = useRef<boolean>(false);

  // Rolling 5-trick anti-repeat history window + shuffle bag
  const recentHistoryRef = useRef<MascotActivity[]>([]);
  const activityBagRef = useRef<MascotActivity[]>([]);
  const lastMouseClientRef = useRef<{ x: number; y: number } | null>(null);
  const bonkVariantToggleRef = useRef<number>(0);
  const scheduleNextRef = useRef<() => void>(() => {});

  // Track latest mouse client coordinates so mouse_play can pounce toward the user's cursor if nearby
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      lastMouseClientRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Clear multi-step sequence timers
  const clearHideTimers = useCallback(() => {
    hideSequenceTimersRef.current.forEach((t) => clearTimeout(t));
    hideSequenceTimersRef.current = [];
  }, []);

  // Spawn fun particles (stars, hearts, sparkles)
  const spawnParticles = useCallback(
    (
      count = 4,
      type: "star" | "heart" | "sparkle" = "star",
      customColors?: string[]
    ) => {
      const defaultColors = [
        "#38bdf8",
        "#c084fc",
        "#f472b6",
        "#fbbf24",
        "#34d399",
      ];
      const colors = customColors || defaultColors;
      const newItems: SparkleParticle[] = [];
      for (let i = 0; i < count; i++) {
        particleIdRef.current += 1;
        newItems.push({
          id: particleIdRef.current,
          x: (Math.random() - 0.5) * 65,
          y: -15 - Math.random() * 40,
          type,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      setSparkles((prev) => [...prev, ...newItems]);
      setTimeout(() => {
        setSparkles((prev) =>
          prev.filter((p) => !newItems.some((n) => n.id === p.id))
        );
      }, 1200);
    },
    []
  );

  const handleTrickSettled = useCallback(() => {
    scheduleNextRef.current();
  }, []);

  // 60fps Continuous Physics, Spline & Curved Return-Flight Engine
  const {
    isPhysicsActive,
    velocityTilt,
    landingScale,
    launchPropPhysics,
    startRoamPatrolPhysics,
    startStarRingHopPhysics,
    startMousePlayPhysics,
    startHideAndSeekPhysics,
    startBackflipPhysics,
    startScreenBonkPhysics,
    stopPhysicsLoop,
  } = useMascotPhysicsLoop({
    isOpen,
    setRoamOffset,
    setBallState,
    setToyPropState,
    setCursorPlay,
    setBonkState,
    setIsBonkFxActive,
    setHideStage,
    setIsTrackingCursor,
    setActivity,
    setExpression,
    spawnParticles,
    isHoveredRef,
    activityRef,
    onTrickSettled: handleTrickSettled,
  });

  const dismissGreeting = useCallback(() => {
    setIsWaving(false);
  }, []);

  // Record a trick in the 5-trick rolling anti-repeat history
  const recordTrickHistory = useCallback((trick: MascotActivity) => {
    if (trick === "idle") return;
    recentHistoryRef.current = [...recentHistoryRef.current.slice(-4), trick];
  }, []);

  // Launch a user-tossed toybox prop with custom velocity vector (from click-and-drag flick throw)
  const launchTossedProp = useCallback(
    (kind: TossablePropKind, vx: number, vy: number) => {
      dismissGreeting();
      clearHideTimers();
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      if (randomTimerRef.current) clearTimeout(randomTimerRef.current);

      setIsAngry(false);
      setIsTrembling(false);
      setHideStage("none");
      setIsBonkFxActive(false);
      setBonkState((prev) => (prev.active ? { ...prev, active: false } : prev));
      setCursorPlay((prev) =>
        prev.active ? { ...prev, active: false } : prev
      );
      setIsTrackingCursor(false);
      setIsAntennaPulsing(false);

      const actName: MascotActivity =
        kind === "plasma_ball"
          ? "ball_play"
          : kind === "butterfly"
          ? "butterfly_chase"
          : "cyber_cube_juggle";
      recordTrickHistory(actName);

      spawnParticles(5, "sparkle", ["#38bdf8", "#e879f9", "#34d399"]);
      launchPropPhysics(kind, vx, vy, 5.2);
    },
    [
      clearHideTimers,
      dismissGreeting,
      launchPropPhysics,
      recordTrickHistory,
      spawnParticles,
    ]
  );

  // Execute a specific playful screen-pet trick or autonomous behavior (all spatial tricks run at 60fps)
  const executeTrick = useCallback(
    (trick: MascotActivity) => {
      clearHideTimers();
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      if (randomTimerRef.current) clearTimeout(randomTimerRef.current);

      recordTrickHistory(trick);

      const is60FpsSplineOrPhysics =
        trick === "ball_play" ||
        trick === "butterfly_chase" ||
        trick === "cyber_cube_juggle" ||
        trick === "roam" ||
        trick === "star_ring_hop" ||
        trick === "mouse_play" ||
        trick === "hide_and_seek" ||
        trick === "backflip" ||
        trick === "screen_bonk";

      if (!is60FpsSplineOrPhysics) {
        stopPhysicsLoop(false);
      }

      setActivity(trick);
      setIsAngry(false);
      setIsTrembling(false);
      setHideStage("none");
      setIsBonkFxActive(false);
      setBonkState((prev) => (prev.active ? { ...prev, active: false } : prev));

      if (trick !== "ball_play") {
        setBallState((prev) =>
          prev.active ? { ...prev, active: false } : prev
        );
      }
      if (
        trick !== "butterfly_chase" &&
        trick !== "cyber_cube_juggle" &&
        trick !== "star_ring_hop"
      ) {
        setToyPropState((prev) =>
          prev.active ? { ...prev, active: false, toyType: "none" } : prev
        );
      }
      if (trick !== "mouse_play") {
        setCursorPlay((prev) =>
          prev.active ? { ...prev, active: false } : prev
        );
      }
      if (trick !== "cursor_track" && trick !== "mouse_play") {
        setIsTrackingCursor(false);
      }
      if (trick !== "idle_antenna_pulse" && trick !== "idle_spin") {
        setIsAntennaPulsing(false);
      }

      if (trick === "ball_play") {
        // 60fps Full-Screen Physics Plasma Ball Chase with Wall Ricochets & Curved Return Arc!
        setSelectedTossProp("plasma_ball");
        const initialVx = -(320 + Math.random() * 340);
        const initialVy = -(380 + Math.random() * 240);
        launchPropPhysics("plasma_ball", initialVx, initialVy, 4.8);
      } else if (trick === "butterfly_chase") {
        // 60fps Full-Screen Holographic Butterfly Flutter & Evasive Pounce Chase!
        setSelectedTossProp("butterfly");
        const initialVx = -(260 + Math.random() * 280);
        const initialVy = -(220 + Math.random() * 180);
        launchPropPhysics("butterfly", initialVx, initialVy, 4.6);
      } else if (trick === "cyber_cube_juggle") {
        // 60fps Full-Screen Isometric Cyber-Cube Tumbling Juggle!
        setSelectedTossProp("cyber_cube");
        const initialVx = -(240 + Math.random() * 280);
        const initialVy = -(360 + Math.random() * 200);
        launchPropPhysics("cyber_cube", initialVx, initialVy, 4.6);
      } else if (trick === "roam") {
        // 60fps Full-Screen Continuous Steering Patrol with Velocity Banking & Curved Return Arc!
        startRoamPatrolPhysics();
      } else if (trick === "star_ring_hop") {
        // 60fps Parabolic 3-Ring Sonic Aerial Hop Trajectory!
        startStarRingHopPhysics();
      } else if (trick === "mouse_play") {
        // 60fps Cursor Stalk Crouch -> Parabolic Pounce Arc -> Boop -> Curved Return!
        let targetRelX = -150 + Math.round((Math.random() - 0.5) * 90);
        let targetRelY = -92 + Math.round((Math.random() - 0.5) * 65);
        if (typeof window !== "undefined" && lastMouseClientRef.current) {
          const homeX = window.innerWidth - 72;
          const homeY = window.innerHeight - 72;
          const dx = lastMouseClientRef.current.x - homeX;
          const dy = lastMouseClientRef.current.y - homeY;
          if (Math.hypot(dx, dy) < 680 && Math.hypot(dx, dy) > 45) {
            targetRelX = Math.max(
              -(window.innerWidth - 150),
              Math.min(24, dx * 0.75)
            );
            targetRelY = Math.max(
              -(window.innerHeight - 150),
              Math.min(20, dy * 0.75)
            );
          }
        }
        startMousePlayPhysics(targetRelX, targetRelY);
      } else if (trick === "screen_bonk") {
        // 60fps Directional Screen Glass & Viewport Boundary Collision!
        bonkVariantToggleRef.current = (bonkVariantToggleRef.current + 1) % 3;
        const mode = bonkVariantToggleRef.current;
        const variant: BonkState["variant"] =
          mode === 0
            ? "front_glass"
            : mode === 1
            ? "right_edge"
            : "bottom_edge";
        startScreenBonkPhysics(variant);
      } else if (trick === "backflip") {
        // 60fps Parabolic Jump Arc + 360° Acrobatic Flip + Soft Cushion Landing!
        startBackflipPhysics();
      } else if (trick === "hide_and_seek") {
        // 60fps Screen-Edge Hide-and-Seek Spline Sequence!
        startHideAndSeekPhysics();
      } else if (trick === "greeting_wave") {
        setIsWaving(true);
        setExpression("happy");
        spawnParticles(4, "sparkle");
        actionTimerRef.current = setTimeout(() => {
          setIsWaving(false);
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 1850);
      } else if (trick === "sleeping" || trick === "sleepy") {
        // Cozy idle nap with drowsy nod transition -> deep rhythmic sleep -> groggy stretch wake-up
        setActivity("idle_drowsy");
        setExpression("drowsy");

        const n0 = setTimeout(() => {
          setActivity("sleeping");
          setExpression("sleepy");
        }, 1200);

        const n1 = setTimeout(() => {
          setActivity("stretch");
          setExpression("yawn");
          spawnParticles(4, "sparkle");
        }, 6800);

        const n2 = setTimeout(() => {
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 8100);

        hideSequenceTimersRef.current = [n0, n1, n2];
      } else if (trick === "idle_drowsy") {
        setExpression("drowsy");
        actionTimerRef.current = setTimeout(() => {
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 2300);
      } else if (trick === "cursor_track") {
        setIsTrackingCursor(true);
        setExpression("curious");
        actionTimerRef.current = setTimeout(() => {
          setIsTrackingCursor(false);
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 2400);
      } else if (trick === "idle_yawn" || trick === "stretch") {
        setExpression("yawn");
        actionTimerRef.current = setTimeout(() => {
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 2000);
      } else if (trick === "idle_spin") {
        setExpression("excited");
        setIsAntennaPulsing(true);
        spawnParticles(5, "star", ["#38bdf8", "#fbbf24", "#e879f9"]);
        actionTimerRef.current = setTimeout(() => {
          setIsAntennaPulsing(false);
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 1700);
      } else if (trick === "idle_antenna_pulse") {
        setIsAntennaPulsing(true);
        setExpression("analytical");
        spawnParticles(3, "sparkle", ["#38bdf8", "#67e8f9", "#a855f7"]);
        actionTimerRef.current = setTimeout(() => {
          setIsAntennaPulsing(false);
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 1650);
      } else if (trick === "looking_around") {
        setExpression("curious");
        actionTimerRef.current = setTimeout(() => {
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 2200);
      } else if (trick === "angry_tantrum") {
        setIsAngry(true);
        setIsTrembling(true);
        setExpression("angry");
        spawnParticles(4, "sparkle", ["#f43f5e", "#fb7185", "#fda4af"]);
        actionTimerRef.current = setTimeout(() => {
          setIsTrembling(false);
          setIsAngry(false);
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 2600);
      } else if (trick === "stare_curious") {
        setExpression(Math.random() > 0.35 ? "curious" : "wink");
        actionTimerRef.current = setTimeout(() => {
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 1900);
      } else if (trick === "wiggle") {
        setExpression("happy");
        spawnParticles(3, "heart");
        actionTimerRef.current = setTimeout(() => {
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 1450);
      } else if (trick === "tickle") {
        setExpression("loving");
        spawnParticles(6, "heart");
        actionTimerRef.current = setTimeout(() => {
          setActivity("idle");
          setExpression(isHoveredRef.current ? "happy" : "normal");
          scheduleNextRef.current();
        }, 1150);
      }
    },
    [
      clearHideTimers,
      launchPropPhysics,
      recordTrickHistory,
      spawnParticles,
      startBackflipPhysics,
      startHideAndSeekPhysics,
      startMousePlayPhysics,
      startRoamPatrolPhysics,
      startScreenBonkPhysics,
      startStarRingHopPhysics,
      stopPhysicsLoop,
    ]
  );

  // Continuous Event-Driven Non-Repeating Scheduler (with 5-trick anti-repeat history & 1.8s-3.2s organic pauses)
  const scheduleNextRandomAction = useCallback(() => {
    if (
      isOpenRef.current ||
      isWorkingRef.current ||
      isDeepSleepingRef.current ||
      isWakingUpRef.current
    ) {
      return;
    }
    if (randomTimerRef.current) clearTimeout(randomTimerRef.current);

    // Organic 1.8s to 3.2s 60fps hover breathing pause between tricks
    const organicPauseMs = Math.floor(1800 + Math.random() * 1400);

    randomTimerRef.current = setTimeout(() => {
      if (
        isOpenRef.current ||
        isWorkingRef.current ||
        isDeepSleepingRef.current ||
        isWakingUpRef.current
      ) {
        return;
      }

      const curAct = activityRef.current;
      if (isHoveredRef.current || curAct !== "idle") {
        scheduleNextRef.current();
        return;
      }

      const nextTrick = pickNextNonRepeatingActivity(
        recentHistoryRef.current,
        activityBagRef
      );
      executeTrick(nextTrick);
    }, organicPauseMs);
  }, [executeTrick]);

  scheduleNextRef.current = scheduleNextRandomAction;

  // Initial Welcome / Pop-Up Entry on Mount
  useEffect(() => {
    if (hasInitialGreetedRef.current) return;
    hasInitialGreetedRef.current = true;

    const entryTimer = setTimeout(() => {
      setIsEntryComplete(true);
      setIsWaving(true);
      setExpression("happy");
      spawnParticles(5, "star");
      setTimeout(() => {
        setIsWaving(false);
        setExpression("normal");
      }, 2100);
    }, 450);

    return () => clearTimeout(entryTimer);
  }, [spawnParticles]);

  // Wakes up the mascot with a groggy stretch & yawn sequence if sleeping, or a cheerful hop
  const wakeUp = useCallback(() => {
    if (isWakingUpRef.current) return;
    const wasAsleep =
      isDeepSleepingRef.current ||
      activityRef.current === "sleeping" ||
      activityRef.current === "sleepy" ||
      activityRef.current === "idle_drowsy";

    isDeepSleepingRef.current = false;
    dismissGreeting();
    clearHideTimers();
    stopPhysicsLoop(true);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    if (randomTimerRef.current) clearTimeout(randomTimerRef.current);

    setIsAngry(false);
    setIsTrembling(false);
    setIsTrackingCursor(false);
    setIsAntennaPulsing(false);
    setHideStage("none");
    setIsBonkFxActive(false);
    setBonkState((prev) => (prev.active ? { ...prev, active: false } : prev));
    setBallState((prev) => (prev.active ? { ...prev, active: false } : prev));
    setToyPropState((prev) =>
      prev.active ? { ...prev, active: false, toyType: "none" } : prev
    );
    setCursorPlay((prev) =>
      prev.active ? { ...prev, active: false } : prev
    );

    if (wasAsleep) {
      isWakingUpRef.current = true;
      // Stage 1: Groggy half-open eye flutter
      setActivity("idle_drowsy");
      setExpression("drowsy");

      // Stage 2: Big cute upward stretch & yawn
      const w1 = setTimeout(() => {
        setActivity("stretch");
        setExpression("yawn");
      }, 340);

      // Stage 3: Wide-awake sparkle hop
      const w2 = setTimeout(() => {
        setActivity("idle");
        setExpression("excited");
        spawnParticles(5, "sparkle");
      }, 1150);

      // Stage 4: Settle into attentive tracking
      const w3 = setTimeout(() => {
        isWakingUpRef.current = false;
        setExpression(isHoveredRef.current ? "happy" : "normal");
        scheduleNextRef.current();
      }, 1680);

      hideSequenceTimersRef.current = [w1, w2, w3];
      return;
    }

    setActivity("idle");
    setExpression("excited");
    spawnParticles(5, "sparkle");
    setTimeout(() => {
      setExpression(isHoveredRef.current ? "happy" : "normal");
      scheduleNextRef.current();
    }, 650);
  }, [clearHideTimers, dismissGreeting, spawnParticles, stopPhysicsLoop]);

  // 45-second complete cursor/keyboard inactivity deep-sleep detector
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetDeepSleepTimer = () => {
      if (isDeepSleepingRef.current) {
        wakeUp();
      }
      if (deepSleepTimerRef.current) clearTimeout(deepSleepTimerRef.current);

      deepSleepTimerRef.current = setTimeout(() => {
        if (isOpenRef.current) return;
        isDeepSleepingRef.current = true;
        if (randomTimerRef.current) clearTimeout(randomTimerRef.current);
        if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
        clearHideTimers();
        stopPhysicsLoop(true);
        setRoamOffset({ x: 0, y: 0 });
        setIsAngry(false);
        setIsTrembling(false);
        setHideStage("none");

        // Drift into drowsy nod first, then deep continuous sleep
        setActivity("idle_drowsy");
        setExpression("drowsy");
        const d1 = setTimeout(() => {
          if (!isDeepSleepingRef.current || isOpenRef.current) return;
          setActivity("sleeping");
          setExpression("sleepy");
        }, 1800);
        hideSequenceTimersRef.current = [d1];
      }, 45000);
    };

    resetDeepSleepTimer();

    window.addEventListener("pointermove", resetDeepSleepTimer, {
      passive: true,
    });
    window.addEventListener("pointerdown", resetDeepSleepTimer, {
      passive: true,
    });
    window.addEventListener("keydown", resetDeepSleepTimer, { passive: true });
    window.addEventListener("wheel", resetDeepSleepTimer, { passive: true });

    return () => {
      if (deepSleepTimerRef.current) clearTimeout(deepSleepTimerRef.current);
      window.removeEventListener("pointermove", resetDeepSleepTimer);
      window.removeEventListener("pointerdown", resetDeepSleepTimer);
      window.removeEventListener("keydown", resetDeepSleepTimer);
      window.removeEventListener("wheel", resetDeepSleepTimer);
    };
  }, [clearHideTimers, stopPhysicsLoop, wakeUp]);

  // User poke / tickle interaction (wakes up if in a micro-nap)
  const poke = useCallback(() => {
    dismissGreeting();
    clearHideTimers();
    stopPhysicsLoop(true);
    setIsAngry(false);
    setIsTrembling(false);
    setIsTrackingCursor(false);
    setIsAntennaPulsing(false);
    setHideStage("none");

    const curAct = activityRef.current;
    if (
      curAct === "sleeping" ||
      curAct === "sleepy" ||
      curAct === "idle_drowsy"
    ) {
      wakeUp();
      return;
    }
    executeTrick("tickle");
  }, [
    clearHideTimers,
    dismissGreeting,
    executeTrick,
    stopPhysicsLoop,
    wakeUp,
  ]);

  // When chat opens or closes, reset props and position cleanly
  useEffect(() => {
    if (isOpen) {
      clearHideTimers();
      stopPhysicsLoop(true);
      setRoamOffset({ x: 0, y: 0 });
      setActivity("idle");
      setExpression("happy");
      setIsBonkFxActive(false);
      setBonkState((prev) => ({ ...prev, active: false }));
      setIsWaving(false);
      setIsAngry(false);
      setIsTrembling(false);
      setIsTrackingCursor(false);
      setIsAntennaPulsing(false);
      setHideStage("none");
      setBallState((prev) => ({ ...prev, active: false }));
      setToyPropState((prev) => ({ ...prev, active: false, toyType: "none" }));
      setCursorPlay((prev) => ({ ...prev, active: false }));
      if (randomTimerRef.current) clearTimeout(randomTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    } else {
      scheduleNextRandomAction();
    }
  }, [isOpen, clearHideTimers, stopPhysicsLoop, scheduleNextRandomAction]);

  // When user starts actively working on any page or switches pages, dock at side and watch attentively;
  // when user becomes idle (after 10s of no work), immediately resume autonomous playful activities!
  useEffect(() => {
    if (isOpen) return;

    if (isUserActivelyWorking) {
      if (randomTimerRef.current) clearTimeout(randomTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      clearHideTimers();
      stopPhysicsLoop(true);
      setRoamOffset({ x: 0, y: 0 });
      setActivity("idle");
      setIsBonkFxActive(false);
      setBonkState((prev) => (prev.active ? { ...prev, active: false } : prev));
      setIsAngry(false);
      setIsTrembling(false);
      setHideStage("none");
      setBallState((prev) => (prev.active ? { ...prev, active: false } : prev));
      setToyPropState((prev) =>
        prev.active ? { ...prev, active: false, toyType: "none" } : prev
      );
      setCursorPlay((prev) =>
        prev.active ? { ...prev, active: false } : prev
      );
    } else {
      // User has been idle for 10 seconds -> kick off playful idle activities!
      scheduleNextRandomAction();
    }
  }, [
    isUserActivelyWorking,
    isOpen,
    clearHideTimers,
    stopPhysicsLoop,
    scheduleNextRandomAction,
  ]);

  // Handle hover interactions: wake if in micro-nap, face user with happy alertness
  useEffect(() => {
    if (isOpen) return;

    if (isHovered) {
      const curAct = activityRef.current;
      if (
        curAct === "sleeping" ||
        curAct === "sleepy" ||
        curAct === "idle_drowsy"
      ) {
        wakeUp();
      } else if (curAct === "angry_tantrum") {
        setIsAngry(false);
        setIsTrembling(false);
        setActivity("idle");
        setExpression("happy");
        spawnParticles(3, "heart");
      } else if (curAct === "idle") {
        setExpression("happy");
      }
    } else {
      if (activityRef.current === "idle" && !isTrackingCursor) {
        setExpression("normal");
        scheduleNextRandomAction();
      }
    }
  }, [
    isHovered,
    isOpen,
    isTrackingCursor,
    scheduleNextRandomAction,
    spawnParticles,
    wakeUp,
  ]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearHideTimers();
      stopPhysicsLoop(false);
      if (randomTimerRef.current) clearTimeout(randomTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    };
  }, [clearHideTimers, stopPhysicsLoop]);

  const resetToOrigin = useCallback(() => {
    clearHideTimers();
    stopPhysicsLoop(true);
    setRoamOffset({ x: 0, y: 0 });
    setActivity("idle");
    setHideStage("none");
    setIsTrackingCursor(false);
    setIsAntennaPulsing(false);
    setIsBonkFxActive(false);
    setBonkState((prev) => ({ ...prev, active: false }));
    setBallState((prev) => ({ ...prev, active: false }));
    setToyPropState((prev) => ({ ...prev, active: false, toyType: "none" }));
    setCursorPlay((prev) => ({ ...prev, active: false }));
    scheduleNextRef.current();
  }, [clearHideTimers, stopPhysicsLoop]);

  const isSleeping = activity === "sleeping" || activity === "sleepy";
  const isDrowsy = activity === "idle_drowsy";

  return {
    activity,
    expression,
    sparkles,
    isBonkFxActive,
    bonkState,
    isWaving,
    showGreetingBubble: false,
    isEntryComplete,
    isAngry,
    isTrembling,
    isTrackingCursor,
    isAntennaPulsing,
    isSleeping,
    isDrowsy,
    hideStage,
    roamOffset,
    ballState,
    toyPropState,
    cursorPlay,
    isPhysicsActive,
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
  };
}


