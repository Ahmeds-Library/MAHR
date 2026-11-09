import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MascotActivity } from "../useMascotPlayEngine";
import { DronePerspectiveState, DronePoseAngle } from "./droneVectorTypes";
import {
  createBlinkRandomizer,
  BlinkRandomizerController,
} from "./blinkRandomizer";
import {
  DroneGsapProxy,
  runDroneActivityChoreography,
} from "./droneActivityChoreographer";

interface UseDronePerspectiveOptions {
  gaze?: {
    x: number;
    y: number;
    eyeX?: number;
    eyeY?: number;
    blinkProgress?: number;
  };
  activity?: MascotActivity;
  isHovered?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  audioVolume?: number;
  velocityTilt?: number;
  forcePose?: DronePoseAngle;
}

function mapPoseToAngles(pose: DronePoseAngle): {
  yaw: number;
  pitch: number;
  roll: number;
} {
  switch (pose) {
    case "front":
      return { yaw: 0, pitch: 0, roll: 0 };
    case "three_quarter_left":
      return { yaw: -38, pitch: 0, roll: -5 };
    case "three_quarter_right":
      return { yaw: 38, pitch: 0, roll: 5 };
    case "side_left":
      return { yaw: -86, pitch: 0, roll: 0 };
    case "side_right":
      return { yaw: 86, pitch: 0, roll: 0 };
    case "three_quarter_back_left":
      return { yaw: -135, pitch: 0, roll: 0 };
    case "three_quarter_back_right":
      return { yaw: 135, pitch: 0, roll: 0 };
    case "back":
      return { yaw: 180, pitch: 0, roll: 0 };
    case "top_down":
      return { yaw: 0, pitch: 30, roll: 0 };
    case "bottom_up":
      return { yaw: 0, pitch: -30, roll: 0 };
    case "dynamic_tilt":
      return { yaw: -14, pitch: -6, roll: -18 };
    default:
      return { yaw: 0, pitch: 0, roll: 0 };
  }
}

function resolveSemanticPose(
  yaw: number,
  pitch: number,
  roll: number
): DronePoseAngle {
  if (Math.abs(roll) >= 12) return "dynamic_tilt";
  if (pitch >= 20) return "top_down";
  if (pitch <= -20) return "bottom_up";
  if (Math.abs(yaw) > 155) return "back";
  if (yaw <= -110) return "three_quarter_back_left";
  if (yaw >= 110) return "three_quarter_back_right";
  if (yaw <= -68) return "side_left";
  if (yaw >= 68) return "side_right";
  if (yaw <= -20) return "three_quarter_left";
  if (yaw >= 20) return "three_quarter_right";
  return "front";
}

/**
 * Layer 2: 60fps Damped Spring-Physics, Thruster Flame & Holographic Eye Optics Controller
 * Coordinates 3D spherical orientation, autonomous eye micro-saccades, iris rotation,
 * pupil dilation, nozzle gimbal vectoring, and 60fps plasma/afterburner flame phase.
 */
export function useDronePerspectiveController({
  gaze = { x: 0, y: 0 },
  activity = "idle",
  isHovered = false,
  isSpeaking = false,
  isThinking = false,
  audioVolume = 0,
  velocityTilt = 0,
  forcePose,
}: UseDronePerspectiveOptions): DronePerspectiveState {
  const [state, setState] = useState<DronePerspectiveState>(() => ({
    yaw: 0,
    pitch: 0,
    roll: 0,
    hoverBobY: 0,
    hoverDriftX: 0,
    squashX: 1,
    squashY: 1,
    thrusterIntensity: 0.48,
    activePose: forcePose || "front",
    blinkProgress: 0,
    isBlinking: false,
    eyeGazeX: 0,
    eyeGazeY: 0,
    flamePhase: 0,
    afterburnerIntensity: 0,
    nozzleGimbalDeg: 0,
    irisRotationDeg: 0,
    pupilScale: 1,
  }));

  const gsapProxyRef = useRef<DroneGsapProxy>({
    idleYaw: 0,
    idlePitch: 0,
    idleRoll: 0,
    bounceY: 0,
    squashX: 1,
    squashY: 1,
    blinkProgress: 0,
    spinYawOffset: 0,
    saccadeX: 0,
    saccadeY: 0,
    pupilScale: 1,
    afterburnerBoost: 0,
  });

  const blinkControllerRef = useRef<BlinkRandomizerController | null>(null);

  const physicsRef = useRef({
    yaw: 0,
    pitch: 0,
    roll: 0,
    velYaw: 0,
    velPitch: 0,
    velRoll: 0,
    eyeX: 0,
    eyeY: 0,
    velEyeX: 0,
    velEyeY: 0,
    time: 0,
    flamePhase: 0,
    irisAngle: 0,
  });

  // Live ref for cursor gaze so 60fps updates never tear down the requestAnimationFrame physics loop
  const gazeRef = useRef(gaze);
  gazeRef.current = gaze;

  // 1. Dedicated Blink-Randomizer Utility + Autonomous Eye Micro-Saccades
  useEffect(() => {
    const proxy = gsapProxyRef.current;
    let saccadeDelayedCall: gsap.core.Tween | null = null;
    let saccadeTween: gsap.core.Tween | null = null;

    const blinkRandomizer = createBlinkRandomizer(proxy, {
      activity,
      eyeExpression: "normal",
      isSleeping: activity === "sleeping" || activity === "sleepy",
      isAngry: activity === "angry_tantrum",
      isListening: false,
      isSpeaking,
    });
    blinkControllerRef.current = blinkRandomizer;
    blinkRandomizer.start();

    const triggerEyeSaccade = () => {
      const returnCenter = Math.random() < 0.36;
      const targetX = returnCenter ? 0 : (Math.random() - 0.5) * 4.6;
      const targetY = returnCenter ? 0 : (Math.random() - 0.5) * 3.0;
      const targetPupil = returnCenter
        ? 1.0
        : 0.88 + Math.random() * 0.28;

      saccadeTween = gsap.to(proxy, {
        saccadeX: targetX,
        saccadeY: targetY,
        pupilScale: targetPupil,
        duration: 0.14 + Math.random() * 0.12,
        ease: "power3.out",
        onComplete: () => {
          saccadeDelayedCall = gsap.delayedCall(
            0.75 + Math.random() * 1.45,
            triggerEyeSaccade
          );
        },
      });
    };

    saccadeDelayedCall = gsap.delayedCall(0.8, triggerEyeSaccade);

    return () => {
      blinkRandomizer.stop();
      blinkControllerRef.current = null;
      if (saccadeDelayedCall) saccadeDelayedCall.kill();
      if (saccadeTween) saccadeTween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep Blink-Randomizer context synchronized with live activity & speaking state
  useEffect(() => {
    if (!blinkControllerRef.current) return;
    blinkControllerRef.current.updateContext({
      activity,
      eyeExpression: "normal",
      isSleeping: activity === "sleeping" || activity === "sleepy",
      isAngry: activity === "angry_tantrum",
      isListening: false,
      isSpeaking,
    });
  }, [activity, isSpeaking]);

  // 2. Delegate GSAP Autonomous Micro-Pose & Trick Timelines to Layer 2 Choreographer
  useEffect(() => {
    return runDroneActivityChoreography(
      gsapProxyRef.current,
      activity,
      forcePose
    );
  }, [activity, forcePose]);

  // 3. 60fps Damped Spring Physics, Flame Phase & Iris Optics Ticker
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const phys = physicsRef.current;
      const proxy = gsapProxyRef.current;
      phys.time += dt;
      const t = phys.time;

      const liveGaze = gazeRef.current;
      const isSleepingState =
        activity === "sleeping" || activity === "sleepy";
      const isDrowsyState = activity === "idle_drowsy";

      const clampedX = isSleepingState
        ? 0
        : Math.max(-1, Math.min(1, liveGaze.x));
      const clampedY = isSleepingState
        ? 0
        : Math.max(-1, Math.min(1, liveGaze.y));
      const clampedEyeX = isSleepingState
        ? 0
        : Math.max(-1, Math.min(1, liveGaze.eyeX ?? liveGaze.x));
      const clampedEyeY = isSleepingState
        ? 0
        : Math.max(-1, Math.min(1, liveGaze.eyeY ?? liveGaze.y));

      const cursorMagnitude = Math.min(
        1,
        Math.sqrt(clampedX * clampedX + clampedY * clampedY) * 1.35
      );

      const isChoreographedTrick =
        activity !== "idle" && activity !== "cursor_track";
      const cursorWeight = isChoreographedTrick
        ? cursorMagnitude * 0.28
        : cursorMagnitude * 0.88;

      const cursorYaw = clampedX * 48;
      const cursorPitch = clampedY * 28;
      const cursorRoll = clampedX * 12;

      let targetYaw =
        proxy.idleYaw * (1 - cursorWeight) +
        cursorYaw * (isChoreographedTrick ? 0.3 : 1) +
        proxy.spinYawOffset;
      let targetPitch =
        proxy.idlePitch * (1 - cursorWeight) +
        cursorPitch * (isChoreographedTrick ? 0.3 : 1);
      let targetRoll =
        proxy.idleRoll * (1 - cursorWeight * 0.7) +
        cursorRoll * (isChoreographedTrick ? 0.3 : 1);

      // Rhythmic sleeping head-nodding snooze sway
      if (isSleepingState) {
        const sleepBreath = Math.sin(t * 1.45);
        targetPitch = 15 + sleepBreath * 4.2;
        targetRoll = -9 + Math.cos(t * 0.725) * 3.0;
        targetYaw = Math.sin(t * 0.55) * 6.5;
      } else if (isDrowsyState) {
        targetPitch = 10 + Math.sin(t * 1.9) * 3.2;
        targetRoll = -5 + Math.cos(t * 0.95) * 2.2;
      }

      if (forcePose) {
        const forced = mapPoseToAngles(forcePose);
        targetYaw = forced.yaw;
        targetPitch = forced.pitch;
        targetRoll = forced.roll;
      } else if (activity === "angry_tantrum") {
        targetYaw += Math.sin(t * 18) * 18;
        targetRoll += Math.cos(t * 15) * 12;
      }

      if (targetYaw > 180) targetYaw -= 360;
      if (targetYaw < -180) targetYaw += 360;

      // Smoothly damped 3D head spring physics (softer when sleeping, responsive yet cushioned when awake)
      const stiffness = isSleepingState ? 45 : 92;
      const damping = isSleepingState ? 12.5 : 17.5;

      const accelYaw =
        (targetYaw - phys.yaw) * stiffness - phys.velYaw * damping;
      const accelPitch =
        (targetPitch - phys.pitch) * stiffness - phys.velPitch * damping;
      const accelRoll =
        (targetRoll - phys.roll) * stiffness - phys.velRoll * damping;

      phys.velYaw += accelYaw * dt;
      phys.velPitch += accelPitch * dt;
      phys.velRoll += accelRoll * dt;

      phys.yaw += phys.velYaw * dt;
      phys.pitch += phys.velPitch * dt;
      phys.roll += phys.velRoll * dt;

      // Continuous harmonic hover breathing (deep rhythmic snooze bob when sleeping)
      const bobFreq = isSleepingState
        ? 1.45
        : isDrowsyState
        ? 1.85
        : isSpeaking
        ? 4.8
        : isThinking
        ? 3.5
        : 2.3;
      const harmonicBobY = isSleepingState
        ? 2.8 + Math.sin(t * bobFreq) * 3.1
        : Math.sin(t * bobFreq) * (isHovered ? 2.4 : 1.75) +
          Math.cos(t * bobFreq * 0.5) * 0.55;
      const hoverBobY = harmonicBobY + proxy.bounceY;
      const hoverDriftX = isSleepingState
        ? Math.sin(t * 0.72) * 1.6
        : Math.sin(t * 1.4) * 1.1;

      // Rhythmic chest/hull breathing expansion during sleep
      const sleepSquashDelta = isSleepingState
        ? Math.sin(t * bobFreq) * 0.032
        : isDrowsyState
        ? Math.sin(t * bobFreq) * 0.018
        : 0;
      const effectiveSquashX = proxy.squashX + sleepSquashDelta;
      const effectiveSquashY = proxy.squashY - sleepSquashDelta;

      // Angular & flight kinetic speed for adaptive afterburner & thruster boost
      const angularSpeed =
        (Math.abs(phys.velYaw) +
          Math.abs(phys.velPitch) +
          Math.abs(phys.velRoll)) /
        260;
      const flightTiltSpeed = Math.min(1, Math.abs(velocityTilt) / 14);
      const upwardLiftBoost = Math.max(0, -hoverBobY * 0.065);
      const upwardPitchBoost = Math.max(0, -phys.pitch * 0.009);

      const afterburnerIntensity = isSleepingState
        ? 0
        : Math.min(
            1,
            Math.max(
              proxy.afterburnerBoost,
              flightTiltSpeed * 0.85 +
                angularSpeed * 0.45 +
                Math.max(0, (-proxy.bounceY - 3) * 0.09) +
                (activity === "angry_tantrum" ? 0.85 : 0)
            )
          );

      // Dimmed low-power eco-thrusters during sleep
      const thrusterIntensity = isSleepingState
        ? 0.16 + (Math.sin(t * bobFreq + Math.PI) + 1) * 0.065
        : isDrowsyState
        ? 0.28 + (Math.sin(t * bobFreq) + 1) * 0.08
        : Math.min(
            1,
            0.48 +
              (Math.sin(t * bobFreq * 2 + 0.8) + 1) * 0.14 +
              upwardLiftBoost +
              upwardPitchBoost +
              afterburnerIntensity * 0.32 +
              (isHovered ? 0.18 : 0) +
              (isSpeaking ? audioVolume * 0.45 : 0)
          );

      // Advance 60fps plasma flame phase
      const flameSpeed = isSleepingState
        ? 6.5
        : 14.0 + thrusterIntensity * 12.0 + afterburnerIntensity * 16.0;
      phys.flamePhase = (phys.flamePhase + dt * flameSpeed) % (Math.PI * 200);

      // Advance 60fps holographic iris aperture rotation
      const irisSpeedDeg = isSleepingState
        ? 6
        : isThinking
        ? 95
        : isSpeaking
        ? 52 + audioVolume * 80
        : 22 + afterburnerIntensity * 45;
      phys.irisAngle = (phys.irisAngle + dt * irisSpeedDeg) % 360;

      // Dynamic thruster nozzle gimbal vectoring
      const nozzleGimbalDeg = Math.max(
        -18,
        Math.min(
          18,
          -phys.roll * 0.48 - velocityTilt * 0.55 + Math.sin(t * 3.2) * 1.2
        )
      );

      // Damped eye gaze velocity filter inside visor so eye tracking is silky-smooth and never snaps
      const rawTargetEyeX = Math.max(
        -4.2,
        Math.min(
          4.2,
          clampedEyeX * 3.3 + proxy.saccadeX * (1 - cursorMagnitude * 0.75)
        )
      );
      const rawTargetEyeY = Math.max(
        -3.2,
        Math.min(
          3.2,
          clampedEyeY * 2.5 + proxy.saccadeY * (1 - cursorMagnitude * 0.75)
        )
      );

      const eyeStiff = 180;
      const eyeDamp = 24;
      phys.velEyeX +=
        ((rawTargetEyeX - phys.eyeX) * eyeStiff - phys.velEyeX * eyeDamp) * dt;
      phys.velEyeY +=
        ((rawTargetEyeY - phys.eyeY) * eyeStiff - phys.velEyeY * eyeDamp) * dt;
      phys.eyeX += phys.velEyeX * dt;
      phys.eyeY += phys.velEyeY * dt;

      const pupilScale = Math.max(
        0.74,
        Math.min(
          1.34,
          proxy.pupilScale +
            (isHovered ? 0.08 : 0) +
            (isSpeaking ? audioVolume * 0.18 : 0)
        )
      );

      // Merge autonomous blinkRandomizer with cursor-tracker randomized blinkProgress
      const mergedBlinkProgress = isSleepingState
        ? 0.94
        : Math.max(proxy.blinkProgress, liveGaze.blinkProgress ?? 0);

      const resolvedPose = resolveSemanticPose(phys.yaw, phys.pitch, phys.roll);

      setState({
        yaw: phys.yaw,
        pitch: phys.pitch,
        roll: phys.roll,
        hoverBobY,
        hoverDriftX,
        squashX: effectiveSquashX,
        squashY: effectiveSquashY,
        thrusterIntensity,
        activePose: resolvedPose,
        blinkProgress: mergedBlinkProgress,
        isBlinking: mergedBlinkProgress > 0.65,
        eyeGazeX: phys.eyeX,
        eyeGazeY: phys.eyeY,
        flamePhase: phys.flamePhase,
        afterburnerIntensity,
        nozzleGimbalDeg,
        irisRotationDeg: phys.irisAngle,
        pupilScale,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    activity,
    isHovered,
    isSpeaking,
    isThinking,
    audioVolume,
    velocityTilt,
    forcePose,
  ]);

  return state;
}
