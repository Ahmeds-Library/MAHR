import { useRef, useState, useCallback, useEffect } from "react";
import {
  TossablePropKind,
  MascotSimMode,
  MascotBodyPhysics,
  PropPhysicsEntity,
  PhysicsVector2D,
  ReturnFlightArcState,
  TrickSplineState,
  getViewportPlayBounds,
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  evalQuadraticBezier,
  evalQuadraticBezierTangent,
  createReturnFlightArc,
  evalLandingCushionBounce,
} from "./mascotPhysicsTypes";
import {
  MascotActivity,
  EyeExpression,
  HideStage,
  BallPlayState,
  ToyPropState,
  BonkState,
  CursorPlayState,
  pickPlaygroundRoamOffset,
} from "./mascotPlayTypes";

interface UseMascotPhysicsLoopParams {
  isOpen: boolean;
  setRoamOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setBallState: React.Dispatch<React.SetStateAction<BallPlayState>>;
  setToyPropState: React.Dispatch<React.SetStateAction<ToyPropState>>;
  setCursorPlay: React.Dispatch<React.SetStateAction<CursorPlayState>>;
  setBonkState: React.Dispatch<React.SetStateAction<BonkState>>;
  setIsBonkFxActive: React.Dispatch<React.SetStateAction<boolean>>;
  setHideStage: React.Dispatch<React.SetStateAction<HideStage>>;
  setIsTrackingCursor: React.Dispatch<React.SetStateAction<boolean>>;
  setActivity: React.Dispatch<React.SetStateAction<MascotActivity>>;
  setExpression: React.Dispatch<React.SetStateAction<EyeExpression>>;
  spawnParticles: (
    count?: number,
    type?: "star" | "heart" | "sparkle",
    customColors?: string[]
  ) => void;
  isHoveredRef: React.MutableRefObject<boolean>;
  activityRef: React.MutableRefObject<MascotActivity>;
  onTrickSettled?: () => void;
}

/**
 * Layer 2 Unified 60fps Physics, Spline & Return-Flight Simulation Engine
 * Drives:
 * 1. Continuous 60fps Lissajous ambient hover breathing at dock
 * 2. Full-screen 60fps prop physics (plasma ball, butterfly, cyber-cube) & pursuit steering
 * 3. 60fps spline trajectories for star_ring_hop, mouse_play, hide_and_seek, backflip, screen_bonk
 * 4. Professional 3-Stage Return-to-Dock Flight (Quadratic Bezier arc + braking flare + soft landing cushion bounce)
 */
export function useMascotPhysicsLoop({
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
  onTrickSettled,
}: UseMascotPhysicsLoopParams) {
  const [isPhysicsActive, setIsPhysicsActive] = useState(true);
  const [velocityTilt, setVelocityTilt] = useState(0);
  const [landingScale, setLandingScale] = useState(1);

  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const ambientClockRef = useRef<number>(0);
  const onTrickSettledRef = useRef(onTrickSettled);
  onTrickSettledRef.current = onTrickSettled;

  const mascotBodyRef = useRef<MascotBodyPhysics>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tiltDeg: 0,
    scale: 1,
  });

  const returnArcRef = useRef<ReturnFlightArcState>(
    createReturnFlightArc(0, 0)
  );

  const trickSplineRef = useRef<TrickSplineState>({
    elapsedSec: 0,
    durationSec: 2.0,
    targetX: -140,
    targetY: -80,
    bonkVariant: "front_glass",
    emittedMilestones: {},
  });

  const propEntityRef = useRef<PropPhysicsEntity>({
    active: false,
    kind: "plasma_ball",
    x: 0,
    y: -50,
    vx: 0,
    vy: 0,
    gravity: 760,
    restitution: 0.82,
    airDrag: 0.992,
    rotation: 0,
    angularVelocity: 180,
    scale: 1,
    bounceCount: 0,
    comboCount: 0,
    lastBoopAt: 0,
    elapsedSec: 0,
    maxDurationSec: 4.8,
  });

  const roamWaypointsRef = useRef<PhysicsVector2D[]>([]);
  const simModeRef = useRef<MascotSimMode>("ambient_hover");
  const hitTriggerCounterRef = useRef<number>(1);

  /**
   * Transitions smoothly from any arena coordinate into the 3-stage curved Return-to-Dock flight.
   */
  const beginReturnHomeArc = useCallback(() => {
    const mascot = mascotBodyRef.current;
    returnArcRef.current = createReturnFlightArc(mascot.x, mascot.y);
    simModeRef.current = "return_home";
  }, []);

  const stopPhysicsLoop = useCallback(
    (resetHome = true) => {
      propEntityRef.current.active = false;
      simModeRef.current = "ambient_hover";
      setVelocityTilt(0);
      setLandingScale(1);

      if (resetHome) {
        mascotBodyRef.current = {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          tiltDeg: 0,
          scale: 1,
        };
        setRoamOffset({ x: 0, y: 0 });
      }
    },
    [setRoamOffset]
  );

  const stepSimulation = useCallback(
    (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      const rawDt = (timestamp - lastFrameTimeRef.current) / 1000;
      const dt = Math.min(0.034, Math.max(0.004, rawDt));
      lastFrameTimeRef.current = timestamp;
      ambientClockRef.current += dt;

      const bounds = getViewportPlayBounds();
      const mascot = mascotBodyRef.current;
      const prop = propEntityRef.current;
      const mode = simModeRef.current;

      if (mode === "ambient_hover") {
        // Continuous 60fps Lissajous Figure-8 Hover Breathing at the Dock
        const curAct = activityRef.current;
        const isNap =
          curAct === "sleeping" ||
          curAct === "sleepy" ||
          curAct === "idle_drowsy";
        const speedMul = isNap ? 0.55 : 1.0;
        const t = ambientClockRef.current * speedMul;

        // Smooth organic figure-8 Lissajous hover curve
        const targetX = isNap
          ? Math.sin(t * 1.1) * 2.2
          : Math.sin(t * 1.45) * 4.4 + Math.cos(t * 0.65) * 1.4;
        const targetY = isNap
          ? 4.5 + Math.sin(t * 1.6) * 2.4
          : curAct === "idle_yawn" || curAct === "stretch"
          ? -10 + Math.sin(t * 2.2) * 2.5
          : Math.sin(t * 2.9) * 3.6 + Math.cos(t * 1.2) * 1.2;

        // Smooth 60fps exponential damping toward ambient hover curve
        const blend = Math.min(1, dt * 10);
        mascot.x += (targetX - mascot.x) * blend;
        mascot.y += (targetY - mascot.y) * blend;
        mascot.vx = 0;
        mascot.vy = 0;

        const hoverTilt = isNap
          ? Math.sin(t * 1.1) * 1.5
          : Math.cos(t * 1.45) * 2.1;
        mascot.tiltDeg += (hoverTilt - mascot.tiltDeg) * blend;
        mascot.scale += (1 - mascot.scale) * blend;

        setRoamOffset({
          x: Number(mascot.x.toFixed(2)),
          y: Number(mascot.y.toFixed(2)),
        });
        setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
        setLandingScale(Number(mascot.scale.toFixed(3)));
      } else if (mode === "prop_chase" && prop.active) {
        prop.elapsedSec += dt;

        // 1. Update Prop Physics by Kind
        let wallHit: "none" | "left" | "right" | "bottom" | "top" = "none";

        if (prop.kind === "plasma_ball") {
          prop.vy += prop.gravity * dt;
          prop.vx *= Math.pow(prop.airDrag, dt * 60);
          prop.x += prop.vx * dt;
          prop.y += prop.vy * dt;
          prop.rotation += prop.vx * 0.45 * dt;

          // 4-Wall Viewport Ricochets
          if (prop.x <= bounds.minX) {
            prop.x = bounds.minX;
            prop.vx = Math.abs(prop.vx) * prop.restitution;
            prop.bounceCount += 1;
            wallHit = "left";
          } else if (prop.x >= bounds.maxX) {
            prop.x = bounds.maxX;
            prop.vx = -Math.abs(prop.vx) * prop.restitution;
            prop.bounceCount += 1;
            wallHit = "right";
          }

          if (prop.y <= bounds.minY) {
            prop.y = bounds.minY;
            prop.vy = Math.abs(prop.vy) * prop.restitution;
            prop.bounceCount += 1;
            wallHit = "top";
          } else if (prop.y >= bounds.maxY) {
            prop.y = bounds.maxY;
            prop.vy = -Math.max(340, Math.abs(prop.vy) * prop.restitution);
            prop.bounceCount += 1;
            wallHit = "bottom";
          }
        } else if (prop.kind === "butterfly") {
          // Buoyant sinusoidal flutter + gentle wandering across full screen
          const flutterWave = Math.sin(prop.elapsedSec * 7.5) * 260;
          prop.vy += (flutterWave - prop.vy * 2.4) * dt;
          prop.vx *= Math.pow(0.985, dt * 60);

          prop.x += prop.vx * dt;
          prop.y += prop.vy * dt;
          prop.rotation = Math.max(-28, Math.min(28, prop.vx * 0.06));

          if (prop.x <= bounds.minX + 24) {
            prop.x = bounds.minX + 24;
            prop.vx = Math.abs(prop.vx) + 180;
          } else if (prop.x >= bounds.maxX - 16) {
            prop.x = bounds.maxX - 16;
            prop.vx = -Math.abs(prop.vx) - 180;
          }

          if (prop.y <= bounds.minY + 24) {
            prop.y = bounds.minY + 24;
            prop.vy = Math.abs(prop.vy) + 120;
          } else if (prop.y >= bounds.maxY - 24) {
            prop.y = bounds.maxY - 24;
            prop.vy = -Math.abs(prop.vy) - 160;
          }
        } else if (prop.kind === "cyber_cube") {
          // Low-gravity isometric tumbling cube
          prop.vy += prop.gravity * dt;
          prop.vx *= Math.pow(prop.airDrag, dt * 60);
          prop.x += prop.vx * dt;
          prop.y += prop.vy * dt;
          prop.rotation = (prop.rotation + prop.angularVelocity * dt) % 360;

          if (prop.x <= bounds.minX) {
            prop.x = bounds.minX;
            prop.vx = Math.abs(prop.vx) * 0.86;
            prop.angularVelocity = -prop.angularVelocity;
          } else if (prop.x >= bounds.maxX) {
            prop.x = bounds.maxX;
            prop.vx = -Math.abs(prop.vx) * 0.86;
            prop.angularVelocity = -prop.angularVelocity;
          }

          if (prop.y <= bounds.minY) {
            prop.y = bounds.minY;
            prop.vy = Math.abs(prop.vy) * 0.84;
          } else if (prop.y >= bounds.maxY) {
            prop.y = bounds.maxY;
            prop.vy = -Math.max(320, Math.abs(prop.vy) * 0.85);
          }
        }

        // 2. Mascot Continuous Pursuit Steering toward Prop
        const targetX = Math.max(
          bounds.minX + 18,
          Math.min(bounds.maxX, prop.x)
        );
        const targetY = Math.max(
          bounds.minY + 24,
          Math.min(bounds.maxY, prop.y + 26)
        );

        const dxToTarget = targetX - mascot.x;
        const dyToTarget = targetY - mascot.y;

        const springK = 14.5;
        const damping = 5.4;
        const ax = dxToTarget * springK - mascot.vx * damping;
        const ay = dyToTarget * springK - mascot.vy * damping;

        mascot.vx += ax * dt;
        mascot.vy += ay * dt;

        const speed = Math.hypot(mascot.vx, mascot.vy);
        const maxSpeed = 980;
        if (speed > maxSpeed) {
          mascot.vx = (mascot.vx / speed) * maxSpeed;
          mascot.vy = (mascot.vy / speed) * maxSpeed;
        }

        mascot.x = Math.max(
          bounds.minX,
          Math.min(bounds.maxX, mascot.x + mascot.vx * dt)
        );
        mascot.y = Math.max(
          bounds.minY,
          Math.min(bounds.maxY, mascot.y + mascot.vy * dt)
        );

        const targetTilt = Math.max(-22, Math.min(22, mascot.vx * 0.032));
        mascot.tiltDeg += (targetTilt - mascot.tiltDeg) * Math.min(1, dt * 14);
        mascot.scale += (1 - mascot.scale) * Math.min(1, dt * 10);

        // 3. Check Mascot <-> Prop Headbutt / Boop Proximity Interaction
        const distToProp = Math.hypot(prop.x - mascot.x, prop.y - mascot.y);
        const now = performance.now();
        let didBoop = false;

        if (distToProp < 54 && now - prop.lastBoopAt > 360) {
          prop.lastBoopAt = now;
          prop.comboCount += 1;
          prop.bounceCount += 1;
          hitTriggerCounterRef.current += 1;
          didBoop = true;

          mascot.vy -= 145;
          mascot.scale = 1.07;

          if (prop.kind === "plasma_ball") {
            const kickDir =
              prop.x < bounds.minX * 0.65
                ? 1
                : prop.x > -140
                ? -1
                : Math.random() > 0.5
                ? 1
                : -1;
            prop.vy = -Math.max(
              420,
              Math.min(680, Math.abs(prop.vy) * 0.9 + 340)
            );
            prop.vx =
              kickDir * (220 + Math.random() * 240) + mascot.vx * 0.25;
            setExpression(prop.comboCount % 2 === 0 ? "happy" : "excited");
            spawnParticles(4, "star", ["#38bdf8", "#fbbf24", "#c084fc"]);
          } else if (prop.kind === "butterfly") {
            const nextSpot = pickPlaygroundRoamOffset();
            const dartAngle = Math.atan2(
              nextSpot.y - prop.y,
              nextSpot.x - prop.x
            );
            prop.vx = Math.cos(dartAngle) * (340 + Math.random() * 160);
            prop.vy = Math.sin(dartAngle) * 260 - 120;
            prop.scale = 1.22;
            setExpression("happy");
            spawnParticles(4, "heart", ["#f472b6", "#e879f9", "#38bdf8"]);
          } else if (prop.kind === "cyber_cube") {
            prop.vy = -Math.max(390, Math.abs(prop.vy) * 0.85 + 290);
            prop.vx += (Math.random() - 0.5) * 320;
            prop.angularVelocity =
              (Math.random() > 0.5 ? 1 : -1) * (280 + Math.random() * 180);
            prop.scale = 1.2;
            setExpression("excited");
            spawnParticles(5, "sparkle", ["#34d399", "#38bdf8", "#fbbf24"]);
          }
        } else {
          prop.scale += (1 - prop.scale) * Math.min(1, dt * 8);
        }

        const relX = Number((prop.x - mascot.x).toFixed(1));
        const relY = Number((prop.y - mascot.y).toFixed(1));

        setRoamOffset({
          x: Number(mascot.x.toFixed(2)),
          y: Number(mascot.y.toFixed(2)),
        });
        setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
        setLandingScale(Number(mascot.scale.toFixed(3)));

        if (prop.kind === "plasma_ball") {
          setBallState((prev) => ({
            active: true,
            ballX: Math.round(relX),
            ballY: Math.round(relY),
            bounceCount: prop.bounceCount,
            hitTrigger: didBoop
              ? hitTriggerCounterRef.current
              : prev.hitTrigger,
            wallBounce:
              wallHit !== "none"
                ? wallHit
                : didBoop
                ? "none"
                : prev.wallBounce,
            comboCount: prop.comboCount,
          }));
        } else {
          setToyPropState({
            active: true,
            toyType: prop.kind,
            x: Math.round(relX),
            y: Math.round(relY),
            rotation: Math.round(prop.rotation),
            scale: Number(prop.scale.toFixed(2)),
            phase:
              prop.elapsedSec > prop.maxDurationSec - 0.45
                ? "collect"
                : didBoop || now - prop.lastBoopAt < 260
                ? "boop"
                : "play",
            step: prop.comboCount,
          });
        }

        // 5. Transition to Professional Curved Return-to-Dock Arc when Session Completes
        if (prop.elapsedSec >= prop.maxDurationSec) {
          prop.active = false;
          setBallState((prev) =>
            prev.active ? { ...prev, active: false, wallBounce: "none" } : prev
          );
          setToyPropState((prev) =>
            prev.active ? { ...prev, active: false, toyType: "none" } : prev
          );
          setExpression("wink");
          beginReturnHomeArc();
        }
      } else if (mode === "patrol") {
        // Full-screen smooth 60fps steering patrol through waypoints
        const target = roamWaypointsRef.current[0] || { x: 0, y: 0 };
        const dx = target.x - mascot.x;
        const dy = target.y - mascot.y;
        const dist = Math.hypot(dx, dy);

        const springK = 9.5;
        const damping = 4.8;
        mascot.vx += (dx * springK - mascot.vx * damping) * dt;
        mascot.vy += (dy * springK - mascot.vy * damping) * dt;

        mascot.x += mascot.vx * dt;
        mascot.y += mascot.vy * dt;

        const targetTilt = Math.max(-18, Math.min(18, mascot.vx * 0.03));
        mascot.tiltDeg += (targetTilt - mascot.tiltDeg) * Math.min(1, dt * 12);

        setRoamOffset({
          x: Number(mascot.x.toFixed(2)),
          y: Number(mascot.y.toFixed(2)),
        });
        setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
        setLandingScale(1);

        if (dist < 22) {
          roamWaypointsRef.current.shift();
          if (roamWaypointsRef.current.length === 0) {
            beginReturnHomeArc();
          } else {
            setExpression("happy");
            spawnParticles(3, "sparkle");
          }
        }
      } else if (mode === "star_ring_hop") {
        // 60fps Parabolic 3-Ring Sonic Aerial Hop Trajectory
        const spline = trickSplineRef.current;
        spline.elapsedSec += dt;
        const t = spline.elapsedSec;

        if (t < 0.56) {
          // Hop 1: Launch from dock to Ring 1 (-85, -52)
          const p = easeOutCubic(t / 0.56);
          mascot.x = -85 * p;
          mascot.y = -52 * p - Math.sin(p * Math.PI) * 28;
          mascot.tiltDeg = -14 * Math.sin(p * Math.PI);
          setToyPropState({
            active: true,
            toyType: "star_rings",
            x: Math.round(-28 * (1 - p)),
            y: Math.round(-22 * (1 - p)),
            rotation: -12,
            scale: 1,
            phase: "spawn",
            step: 1,
          });
        } else if (t < 1.18) {
          // Hop 2: Parabolic arc from Ring 1 (-85, -52) to Ring 2 Apex (-165, -104)
          if (!spline.emittedMilestones.ring1) {
            spline.emittedMilestones.ring1 = true;
            setExpression("happy");
            spawnParticles(4, "star", ["#fbbf24", "#38bdf8"]);
          }
          const p = easeInOutCubic((t - 0.56) / 0.62);
          mascot.x = -85 + (-165 - -85) * p;
          mascot.y = -52 + (-104 - -52) * p - Math.sin(p * Math.PI) * 34;
          mascot.tiltDeg = -16 * (1 - p) + 8 * p;
          setToyPropState({
            active: true,
            toyType: "star_rings",
            x: Math.round(-24 * (1 - p)),
            y: Math.round(-18 * (1 - p)),
            rotation: 8,
            scale: 1.12,
            phase: "boop",
            step: 2,
          });
        } else if (t < 1.78) {
          // Hop 3: Dive arc from Ring 2 (-165, -104) through Ring 3 (-225, -48)
          if (!spline.emittedMilestones.ring2) {
            spline.emittedMilestones.ring2 = true;
            setExpression("excited");
            spawnParticles(6, "star", ["#fbbf24", "#38bdf8", "#f472b6"]);
          }
          const p = easeInOutCubic((t - 1.18) / 0.6);
          mascot.x = -165 + (-225 - -165) * p;
          mascot.y = -104 + (-48 - -104) * p - Math.sin(p * Math.PI) * 26;
          mascot.tiltDeg = -12 * Math.sin(p * Math.PI);
          setToyPropState({
            active: true,
            toyType: "star_rings",
            x: Math.round(14 * p),
            y: Math.round(-18 * (1 - p)),
            rotation: -8,
            scale: 1.16,
            phase: "boop",
            step: 3,
          });
        } else {
          // Victory ring collect & transition into professional curved return flight
          setToyPropState((prev) =>
            prev.active ? { ...prev, active: false, toyType: "none" } : prev
          );
          setExpression("wink");
          beginReturnHomeArc();
        }

        setRoamOffset({
          x: Number(mascot.x.toFixed(2)),
          y: Number(mascot.y.toFixed(2)),
        });
        setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
        setLandingScale(1);
      } else if (mode === "mouse_play") {
        // 60fps Cursor Stalk Crouch -> Parabolic Pounce Arc -> Boop -> Curved Return
        const spline = trickSplineRef.current;
        spline.elapsedSec += dt;
        const t = spline.elapsedSec;
        const tx = spline.targetX;
        const ty = spline.targetY;

        if (t < 0.68) {
          // Phase 1: Playful stalking crouch & wiggle wind-up
          const p = easeOutCubic(t / 0.68);
          const wiggle = Math.sin(t * 28) * 3.5 * p;
          mascot.x = tx * 0.16 * p + wiggle;
          mascot.y = 7 * p;
          mascot.tiltDeg = wiggle * 2.2;
          mascot.scale = 1 - 0.05 * p;

          setCursorPlay({
            active: true,
            targetX: Math.round(tx - mascot.x),
            targetY: Math.round(ty - mascot.y),
            phase: "stalking",
          });
        } else if (t < 1.36) {
          // Phase 2: High-speed 60fps parabolic pounce arc onto the cursor target
          if (!spline.emittedMilestones.pounce) {
            spline.emittedMilestones.pounce = true;
            setExpression("excited");
          }
          const p = easeInOutCubic((t - 0.68) / 0.68);
          const startX = tx * 0.16;
          const startY = 7;
          const arcLift = Math.sin(p * Math.PI) * 56;
          mascot.x = startX + (tx - startX) * p;
          mascot.y = startY + (ty - startY) * p - arcLift;
          mascot.tiltDeg = Math.max(
            -20,
            Math.min(20, (tx - startX) * 0.08 * Math.sin(p * Math.PI))
          );
          mascot.scale = 1 + 0.08 * Math.sin(p * Math.PI);

          setCursorPlay({
            active: true,
            targetX: Math.round(tx - mascot.x),
            targetY: Math.round(ty - mascot.y - 10),
            phase: "pouncing",
          });
        } else if (t < 1.88) {
          // Phase 3: Joyful Boop catch & double hop in place
          if (!spline.emittedMilestones.boop) {
            spline.emittedMilestones.boop = true;
            setExpression("happy");
            spawnParticles(5, "heart", ["#38bdf8", "#f472b6", "#fbbf24"]);
          }
          const p = clamp01((t - 1.36) / 0.52);
          const hop = Math.abs(Math.sin(p * Math.PI * 2)) * 16;
          mascot.x = tx;
          mascot.y = ty - hop;
          mascot.tiltDeg = Math.sin(p * Math.PI * 2) * 8;
          mascot.scale = 1 + 0.05 * Math.sin(p * Math.PI);

          setCursorPlay({
            active: true,
            targetX: 0,
            targetY: -8,
            phase: "boop",
          });
        } else {
          // Phase 4: Clean up cursor indicator and initiate curved return-to-dock arc
          setCursorPlay((prev) =>
            prev.active ? { ...prev, active: false } : prev
          );
          setIsTrackingCursor(false);
          setExpression("wink");
          beginReturnHomeArc();
        }

        setRoamOffset({
          x: Number(mascot.x.toFixed(2)),
          y: Number(mascot.y.toFixed(2)),
        });
        setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
        setLandingScale(Number(mascot.scale.toFixed(3)));
      } else if (mode === "hide_and_seek") {
        // 60fps Smooth Hide-and-Seek Spline Sequence
        const spline = trickSplineRef.current;
        spline.elapsedSec += dt;
        const t = spline.elapsedSec;

        if (t < 0.75) {
          // Phase 1: Tuck smoothly behind the bottom-right screen edge (36, 40)
          const p = easeInOutCubic(t / 0.75);
          mascot.x = 36 * p;
          mascot.y = 40 * p;
          mascot.tiltDeg = 14 * p;
        } else if (t < 1.55) {
          // Phase 2: Peek out curiously from right screen edge (22, 10)
          if (!spline.emittedMilestones.peek1) {
            spline.emittedMilestones.peek1 = true;
            setHideStage("peeking");
            setExpression("curious");
          }
          const p = easeInOutCubic((t - 0.75) / 0.8);
          mascot.x = 36 + (22 - 36) * p;
          mascot.y = 40 + (10 - 40) * p;
          mascot.tiltDeg = -12 * p;
        } else if (t < 2.35) {
          // Phase 3: Swift curved dash to bottom edge (-88, 26)
          if (!spline.emittedMilestones.peek2) {
            spline.emittedMilestones.peek2 = true;
            setExpression("wink");
          }
          const p = easeInOutCubic((t - 1.55) / 0.8);
          mascot.x = 22 + (-88 - 22) * p;
          mascot.y = 10 + (26 - 10) * p + Math.sin(p * Math.PI) * 14;
          mascot.tiltDeg = -15 * Math.sin(p * Math.PI);
        } else if (t < 3.0) {
          // Phase 4: Pop-up surprise jump (-48, -36) with stars!
          if (!spline.emittedMilestones.reveal) {
            spline.emittedMilestones.reveal = true;
            setHideStage("revealed");
            setExpression("excited");
            spawnParticles(5, "star");
          }
          const p = easeOutCubic((t - 2.35) / 0.65);
          mascot.x = -88 + (-48 - -88) * p;
          mascot.y = 26 + (-36 - 26) * p - Math.sin(p * Math.PI) * 22;
          mascot.tiltDeg = 8 * Math.sin(p * Math.PI);
        } else {
          setHideStage("none");
          beginReturnHomeArc();
        }

        setRoamOffset({
          x: Number(mascot.x.toFixed(2)),
          y: Number(mascot.y.toFixed(2)),
        });
        setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
        setLandingScale(1);
      } else if (mode === "backflip") {
        // 60fps Parabolic Jump Arc + 360° Acrobatic Flip + Soft Cushion Landing
        const spline = trickSplineRef.current;
        spline.elapsedSec += dt;
        const t = spline.elapsedSec;

        if (t < 0.88) {
          const p = clamp01(t / 0.88);
          // Smooth parabolic jump arc
          const jumpArc = Math.sin(p * Math.PI);
          mascot.x = -46 * Math.sin(p * Math.PI);
          mascot.y = -78 * jumpArc;
          // Full -360 degree backflip rotation at 60fps
          mascot.tiltDeg = -360 * easeInOutCubic(p);
          mascot.scale = 1 + 0.1 * jumpArc;

          setRoamOffset({
            x: Number(mascot.x.toFixed(2)),
            y: Number(mascot.y.toFixed(2)),
          });
          setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
          setLandingScale(Number(mascot.scale.toFixed(3)));
        } else {
          // Transition directly into the soft landing cushion bounce at (0, 0)
          mascot.x = 0;
          mascot.y = 0;
          mascot.tiltDeg = 0;
          setExpression("happy");
          returnArcRef.current = {
            startX: 0,
            startY: 0,
            controlX: 0,
            controlY: -20,
            elapsedSec: 0,
            flightDurationSec: 0.01,
            cushionDurationSec: 0.32,
            phase: "landing_cushion",
            flightDirX: 1,
          };
          simModeRef.current = "return_home";
        }
      } else if (mode === "screen_bonk") {
        // 60fps High-Speed Glass/Boundary Dash -> Impact Squash -> Elastic Recoil -> Curved Return
        const spline = trickSplineRef.current;
        spline.elapsedSec += dt;
        const t = spline.elapsedSec;
        const variant = spline.bonkVariant;

        const impactPos =
          variant === "right_edge"
            ? { x: 24, y: -32 }
            : variant === "bottom_edge"
            ? { x: -48, y: 20 }
            : { x: -28, y: -22 };

        const recoilPos =
          variant === "right_edge"
            ? { x: -56, y: -14 }
            : variant === "bottom_edge"
            ? { x: -40, y: -44 }
            : { x: -16, y: 10 };

        if (t < 0.24) {
          // High-speed dash into glass/boundary
          const p = easeOutCubic(t / 0.24);
          mascot.x = impactPos.x * p;
          mascot.y = impactPos.y * p;
          mascot.tiltDeg = variant === "right_edge" ? 16 * p : -12 * p;
          mascot.scale = 1 + (variant === "front_glass" ? 0.22 * p : 0.08 * p);
        } else if (t < 0.72) {
          // Glass bonk impact hold + squash against the glass
          if (!spline.emittedMilestones.bonkHit) {
            spline.emittedMilestones.bonkHit = true;
            setIsBonkFxActive(true);
            setBonkState({
              active: true,
              impactX: variant === "right_edge" ? 26 : 0,
              impactY:
                variant === "bottom_edge"
                  ? 24
                  : variant === "right_edge"
                  ? -6
                  : 0,
              variant,
              label:
                variant === "front_glass"
                  ? "BONK!"
                  : variant === "right_edge"
                  ? "WALL BONK!"
                  : "FLOOR BONK!",
            });
            setExpression("bonked");
            spawnParticles(6, "star", ["#fbbf24", "#38bdf8", "#f472b6"]);
          }
          const p = clamp01((t - 0.24) / 0.48);
          // Subtle glass vibration decay
          const shake = Math.sin(p * Math.PI * 6) * 2.5 * (1 - p);
          mascot.x = impactPos.x + shake;
          mascot.y = impactPos.y + (variant === "front_glass" ? 4 * p : 0);
          mascot.tiltDeg = shake * 2.5;
          mascot.scale = variant === "front_glass" ? 1.22 - 0.06 * p : 1.08;
        } else if (t < 1.32) {
          // Elastic recoil arc with dizzy eyes
          if (!spline.emittedMilestones.dizzy) {
            spline.emittedMilestones.dizzy = true;
            setExpression("dizzy");
          }
          const p = easeOutCubic((t - 0.72) / 0.6);
          mascot.x = impactPos.x + (recoilPos.x - impactPos.x) * p;
          mascot.y =
            impactPos.y +
            (recoilPos.y - impactPos.y) * p -
            Math.sin(p * Math.PI) * 18;
          mascot.tiltDeg = Math.sin(p * Math.PI * 2) * 12 * (1 - p * 0.5);
          mascot.scale = 1.16 - 0.16 * p;
        } else {
          setIsBonkFxActive(false);
          setBonkState((prev) =>
            prev.active ? { ...prev, active: false } : prev
          );
          beginReturnHomeArc();
        }

        setRoamOffset({
          x: Number(mascot.x.toFixed(2)),
          y: Number(mascot.y.toFixed(2)),
        });
        setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
        setLandingScale(Number(mascot.scale.toFixed(3)));
      } else if (mode === "return_home") {
        // ============================================================================
        // PROFESSIONAL 3-STAGE RETURN-TO-DOCK CHOREOGRAPHY
        // 1. Curved Quadratic Bezier Flight Arc (P0 -> Elevated Apex P1 -> Dock P2(0,0))
        // 2. Aerodynamic Braking Flare (Reverse pitch tilt during final approach)
        // 3. Soft Landing Cushion Bounce (Damped vertical dip & squash/stretch settle)
        // ============================================================================
        const arc = returnArcRef.current;
        arc.elapsedSec += dt;

        if (arc.phase === "arc_flight") {
          const rawProgress = clamp01(arc.elapsedSec / arc.flightDurationSec);
          const easedT = easeInOutCubic(rawProgress);

          const p0 = { x: arc.startX, y: arc.startY };
          const p1 = { x: arc.controlX, y: arc.controlY };
          const p2 = { x: 0, y: 0 };

          const pos = evalQuadraticBezier(p0, p1, p2, easedT);
          const tangent = evalQuadraticBezierTangent(p0, p1, p2, easedT);

          mascot.x = pos.x;
          mascot.y = pos.y;

          // Stage 2: Aerodynamic Banking + Braking Flare
          // Forward banking during initial cruise (0..0.64), then reverse pitch braking flare (0.64..0.96)
          let targetTilt = 0;
          if (rawProgress < 0.64) {
            const cruiseTilt = Math.max(-18, Math.min(18, tangent.x * 0.025));
            targetTilt = cruiseTilt;
          } else {
            // Braking flare: pitch backward opposite to travel direction to shed momentum gracefully
            const flareWindow = (rawProgress - 0.64) / 0.36;
            const flarePulse = Math.sin(flareWindow * Math.PI);
            targetTilt = -arc.flightDirX * 13.5 * flarePulse;
          }

          mascot.tiltDeg +=
            (targetTilt - mascot.tiltDeg) * Math.min(1, dt * 16);
          mascot.scale = 1 + 0.03 * Math.sin(rawProgress * Math.PI);

          setRoamOffset({
            x: Number(mascot.x.toFixed(2)),
            y: Number(mascot.y.toFixed(2)),
          });
          setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
          setLandingScale(Number(mascot.scale.toFixed(3)));

          if (rawProgress >= 1) {
            arc.phase = "landing_cushion";
            arc.elapsedSec = 0;
          }
        } else {
          // Stage 3: Soft Landing Cushion Bounce at Dock (0, 0)
          const cushionProgress = clamp01(
            arc.elapsedSec / arc.cushionDurationSec
          );
          const cushion = evalLandingCushionBounce(cushionProgress);

          mascot.x = 0;
          mascot.y = cushion.offsetY;
          mascot.tiltDeg = cushion.tiltDeg;
          mascot.scale = cushion.scale;

          setRoamOffset({
            x: 0,
            y: Number(mascot.y.toFixed(2)),
          });
          setVelocityTilt(Number(mascot.tiltDeg.toFixed(2)));
          setLandingScale(Number(mascot.scale.toFixed(3)));

          if (cushionProgress >= 1) {
            mascot.x = 0;
            mascot.y = 0;
            mascot.vx = 0;
            mascot.vy = 0;
            mascot.tiltDeg = 0;
            mascot.scale = 1;
            ambientClockRef.current = 0;
            simModeRef.current = "ambient_hover";
            setRoamOffset({ x: 0, y: 0 });
            setVelocityTilt(0);
            setLandingScale(1);
            setActivity("idle");
            setExpression(isHoveredRef.current ? "happy" : "normal");
            onTrickSettledRef.current?.();
          }
        }
      }

      if (!isOpen) {
        rafIdRef.current = requestAnimationFrame(stepSimulation);
      } else {
        rafIdRef.current = null;
      }
    },
    [
      activityRef,
      beginReturnHomeArc,
      isHoveredRef,
      isOpen,
      setActivity,
      setBallState,
      setBonkState,
      setCursorPlay,
      setExpression,
      setHideStage,
      setIsBonkFxActive,
      setIsTrackingCursor,
      setRoamOffset,
      setToyPropState,
      spawnParticles,
    ]
  );

  const ensureLoopRunning = useCallback(() => {
    setIsPhysicsActive(true);
    lastFrameTimeRef.current = performance.now();
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(stepSimulation);
    }
  }, [stepSimulation]);

  // Keep the 60fps loop continuously running whenever the chat window is closed
  useEffect(() => {
    if (!isOpen) {
      ensureLoopRunning();
    } else if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isOpen, ensureLoopRunning]);

  /**
   * Launches a toybox prop with real 2D velocity (either from user click-and-drag flick
   * or autonomous full-screen play) and starts immediate mascot chase & boop physics.
   */
  const launchPropPhysics = useCallback(
    (
      kind: TossablePropKind,
      vx: number,
      vy: number,
      durationSec = 4.6
    ) => {
      const mascot = mascotBodyRef.current;
      const startX = mascot.x;
      const startY = mascot.y - 34;

      propEntityRef.current = {
        active: true,
        kind,
        x: startX,
        y: startY,
        vx,
        vy,
        gravity:
          kind === "plasma_ball"
            ? 790
            : kind === "cyber_cube"
            ? 490
            : 0,
        restitution: kind === "plasma_ball" ? 0.84 : 0.82,
        airDrag: kind === "butterfly" ? 0.985 : 0.993,
        rotation: 0,
        angularVelocity: kind === "cyber_cube" ? 260 : 180,
        scale: 1,
        bounceCount: 1,
        comboCount: 1,
        lastBoopAt: performance.now() - 120,
        elapsedSec: 0,
        maxDurationSec: durationSec,
      };

      if (kind === "plasma_ball") {
        setActivity("ball_play");
        setExpression("excited");
        setToyPropState((prev) =>
          prev.active ? { ...prev, active: false, toyType: "none" } : prev
        );
        setBallState({
          active: true,
          ballX: 0,
          ballY: -34,
          bounceCount: 1,
          hitTrigger: hitTriggerCounterRef.current,
          wallBounce: "none",
          comboCount: 1,
        });
      } else {
        setActivity(
          kind === "butterfly" ? "butterfly_chase" : "cyber_cube_juggle"
        );
        setExpression(kind === "butterfly" ? "curious" : "analytical");
        setBallState((prev) => (prev.active ? { ...prev, active: false } : prev));
        setToyPropState({
          active: true,
          toyType: kind,
          x: 0,
          y: -34,
          rotation: 0,
          scale: 1,
          phase: "spawn",
          step: 1,
        });
      }

      simModeRef.current = "prop_chase";
      ensureLoopRunning();
    },
    [
      ensureLoopRunning,
      setActivity,
      setBallState,
      setExpression,
      setToyPropState,
    ]
  );

  /**
   * Starts a smooth 60fps steering patrol across full-screen playground waypoints.
   */
  const startRoamPatrolPhysics = useCallback(() => {
    propEntityRef.current.active = false;
    roamWaypointsRef.current = [
      pickPlaygroundRoamOffset(),
      pickPlaygroundRoamOffset(),
    ];
    simModeRef.current = "patrol";
    setActivity("roam");
    setExpression("curious");
    ensureLoopRunning();
  }, [ensureLoopRunning, setActivity, setExpression]);

  /**
   * Starts a 60fps 3-ring parabolic hop spline trajectory.
   */
  const startStarRingHopPhysics = useCallback(() => {
    propEntityRef.current.active = false;
    trickSplineRef.current = {
      elapsedSec: 0,
      durationSec: 1.8,
      targetX: -225,
      targetY: -48,
      bonkVariant: "front_glass",
      emittedMilestones: {},
    };
    setActivity("star_ring_hop");
    setExpression("excited");
    simModeRef.current = "star_ring_hop";
    ensureLoopRunning();
  }, [ensureLoopRunning, setActivity, setExpression]);

  /**
   * Starts a 60fps cursor stalk crouch, parabolic pounce arc, and boop sequence.
   */
  const startMousePlayPhysics = useCallback(
    (targetX: number, targetY: number) => {
      propEntityRef.current.active = false;
      trickSplineRef.current = {
        elapsedSec: 0,
        durationSec: 1.9,
        targetX,
        targetY,
        bonkVariant: "front_glass",
        emittedMilestones: {},
      };
      setActivity("mouse_play");
      setIsTrackingCursor(true);
      setExpression("curious");
      simModeRef.current = "mouse_play";
      ensureLoopRunning();
    },
    [ensureLoopRunning, setActivity, setExpression, setIsTrackingCursor]
  );

  /**
   * Starts a 60fps screen-edge hide-and-seek spline sequence.
   */
  const startHideAndSeekPhysics = useCallback(() => {
    propEntityRef.current.active = false;
    trickSplineRef.current = {
      elapsedSec: 0,
      durationSec: 3.0,
      targetX: 0,
      targetY: 0,
      bonkVariant: "front_glass",
      emittedMilestones: {},
    };
    setActivity("hide_and_seek");
    setHideStage("hiding");
    setExpression("wink");
    simModeRef.current = "hide_and_seek";
    ensureLoopRunning();
  }, [ensureLoopRunning, setActivity, setExpression, setHideStage]);

  /**
   * Starts a 60fps parabolic jump arc + 360-degree acrobatic backflip + soft landing cushion.
   */
  const startBackflipPhysics = useCallback(() => {
    propEntityRef.current.active = false;
    trickSplineRef.current = {
      elapsedSec: 0,
      durationSec: 0.88,
      targetX: 0,
      targetY: 0,
      bonkVariant: "front_glass",
      emittedMilestones: {},
    };
    setActivity("backflip");
    setExpression("excited");
    spawnParticles(6, "star", ["#38bdf8", "#fbbf24", "#c084fc"]);
    simModeRef.current = "backflip";
    ensureLoopRunning();
  }, [ensureLoopRunning, setActivity, setExpression, spawnParticles]);

  /**
   * Starts a 60fps directional glass/boundary bonk dash, squash, and recoil sequence.
   */
  const startScreenBonkPhysics = useCallback(
    (variant: "front_glass" | "right_edge" | "bottom_edge") => {
      propEntityRef.current.active = false;
      trickSplineRef.current = {
        elapsedSec: 0,
        durationSec: 1.32,
        targetX: 0,
        targetY: 0,
        bonkVariant: variant,
        emittedMilestones: {},
      };
      setActivity("screen_bonk");
      setExpression("excited");
      simModeRef.current = "screen_bonk";
      ensureLoopRunning();
    },
    [ensureLoopRunning, setActivity, setExpression]
  );

  return {
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
    beginReturnHomeArc,
    stopPhysicsLoop,
  };
}

