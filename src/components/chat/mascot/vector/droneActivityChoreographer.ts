import gsap from "gsap";
import { MascotActivity } from "../useMascotPlayEngine";
import { DronePoseAngle } from "./droneVectorTypes";

export interface DroneGsapProxy {
  idleYaw: number;
  idlePitch: number;
  idleRoll: number;
  bounceY: number;
  squashX: number;
  squashY: number;
  blinkProgress: number;
  spinYawOffset: number;
  saccadeX: number;
  saccadeY: number;
  pupilScale: number;
  afterburnerBoost: number;
}

/**
 * Layer 2: GSAP Autonomous Micro-Pose & Expressive Screen-Pet Choreographer
 * Extracted from `useDronePerspectiveController` to enforce clean modular 3-layer separation.
 * Orchestrates 60fps GSAP timelines for prop chases, acrobatics, curious head-tilts,
 * pupil dilation, and afterburner bursts.
 */
export function runDroneActivityChoreography(
  proxy: DroneGsapProxy,
  activity: MascotActivity,
  forcePose?: DronePoseAngle
): () => void {
  let idleLoopCall: gsap.core.Tween | null = null;
  let activeTl: gsap.core.Timeline | null = null;

  const cleanup = () => {
    if (idleLoopCall) idleLoopCall.kill();
    if (activeTl) activeTl.kill();
  };

  if (forcePose) {
    gsap.to(proxy, {
      idleYaw: 0,
      idlePitch: 0,
      idleRoll: 0,
      bounceY: 0,
      squashX: 1,
      squashY: 1,
      spinYawOffset: 0,
      pupilScale: 1,
      afterburnerBoost: 0,
      duration: 0.45,
      ease: "power3.out",
    });
    return cleanup;
  }

  // 1. Ball Play (Rhythmic Header Juggling & High-Thrust Afterburner Leaps)
  if (activity === "ball_play") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: -18,
        idlePitch: -22,
        idleRoll: -10,
        bounceY: 2.5,
        squashX: 1.07,
        squashY: 0.93,
        saccadeX: -1.5,
        saccadeY: -2.4,
        pupilScale: 1.18,
        afterburnerBoost: 0.45,
        duration: 0.28,
        ease: "power2.out",
      })
      .to(proxy, {
        idleYaw: -22,
        idlePitch: -28,
        idleRoll: -14,
        bounceY: -9.5,
        squashX: 0.92,
        squashY: 1.1,
        pupilScale: 1.24,
        afterburnerBoost: 0.95,
        duration: 0.24,
        ease: "back.out(2)",
      })
      .to(proxy, {
        idleYaw: 26,
        idlePitch: -24,
        idleRoll: 12,
        bounceY: 1.5,
        squashX: 1.05,
        squashY: 0.95,
        saccadeX: 2.4,
        saccadeY: -2.2,
        afterburnerBoost: 0.55,
        duration: 0.45,
        ease: "sine.inOut",
      })
      .to(proxy, {
        idleYaw: 28,
        idlePitch: -30,
        idleRoll: 16,
        bounceY: -10.5,
        squashX: 0.91,
        squashY: 1.11,
        afterburnerBoost: 1.0,
        duration: 0.3,
        ease: "back.out(2.2)",
      })
      .fromTo(
        proxy,
        { spinYawOffset: 0 },
        {
          spinYawOffset: 360,
          afterburnerBoost: 0.85,
          duration: 0.85,
          ease: "power2.inOut",
        }
      )
      .to(proxy, {
        idleYaw: 0,
        idlePitch: 0,
        idleRoll: 0,
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        spinYawOffset: 0,
        saccadeX: 0,
        saccadeY: 0,
        pupilScale: 1,
        afterburnerBoost: 0,
        duration: 0.45,
        ease: "elastic.out(1, 0.55)",
      });
    return cleanup;
  }

  // 2. Butterfly Chase (Flutter Tracking -> Playful Afterburner Leap)
  if (activity === "butterfly_chase") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: -28,
        idlePitch: -20,
        idleRoll: -14,
        bounceY: -6,
        squashX: 0.94,
        squashY: 1.07,
        saccadeX: -2.4,
        saccadeY: -2.0,
        pupilScale: 1.25,
        afterburnerBoost: 0.72,
        duration: 0.45,
        ease: "power2.out",
      })
      .to(proxy, {
        idleYaw: 24,
        idlePitch: -26,
        idleRoll: 15,
        bounceY: -11,
        squashX: 0.91,
        squashY: 1.1,
        saccadeX: 2.2,
        saccadeY: -2.4,
        afterburnerBoost: 0.95,
        duration: 0.55,
        ease: "back.out(1.8)",
      })
      .to(proxy, {
        idleYaw: -16,
        idlePitch: -12,
        idleRoll: -10,
        bounceY: -4,
        squashX: 1.04,
        squashY: 0.96,
        afterburnerBoost: 0.45,
        duration: 0.5,
        ease: "sine.inOut",
      })
      .to(proxy, {
        idleYaw: 0,
        idlePitch: 0,
        idleRoll: 0,
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        saccadeX: 0,
        saccadeY: 0,
        pupilScale: 1,
        afterburnerBoost: 0,
        duration: 0.55,
        ease: "elastic.out(1, 0.55)",
      });
    return cleanup;
  }

  // 3. Cyber-Cube Juggle (Isometric Lock-On -> Magnetic Boops)
  if (activity === "cyber_cube_juggle") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: 0,
        idlePitch: -24,
        idleRoll: 0,
        bounceY: 3,
        squashX: 1.06,
        squashY: 0.94,
        saccadeY: -2.4,
        pupilScale: 0.84,
        afterburnerBoost: 0.5,
        duration: 0.35,
        ease: "power2.out",
      })
      .to(proxy, {
        idleYaw: -20,
        idlePitch: -28,
        idleRoll: -12,
        bounceY: -9,
        squashX: 0.92,
        squashY: 1.09,
        pupilScale: 1.18,
        afterburnerBoost: 0.9,
        duration: 0.32,
        ease: "back.out(2)",
      })
      .to(proxy, {
        idleYaw: 22,
        idlePitch: -26,
        idleRoll: 14,
        bounceY: -8,
        squashX: 0.93,
        squashY: 1.08,
        afterburnerBoost: 0.82,
        duration: 0.48,
        ease: "sine.inOut",
      })
      .fromTo(
        proxy,
        { spinYawOffset: 0 },
        {
          spinYawOffset: 360,
          afterburnerBoost: 0.88,
          duration: 0.72,
          ease: "power2.inOut",
        }
      )
      .to(proxy, {
        idleYaw: 0,
        idlePitch: 0,
        idleRoll: 0,
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        spinYawOffset: 0,
        saccadeX: 0,
        saccadeY: 0,
        pupilScale: 1,
        afterburnerBoost: 0,
        duration: 0.45,
        ease: "elastic.out(1, 0.5)",
      });
    return cleanup;
  }

  // 4. Star Ring Hop (Acrobatic Supersonic Ring Dashes)
  if (activity === "star_ring_hop") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: -30,
        idlePitch: -18,
        idleRoll: -18,
        bounceY: -10,
        squashX: 0.92,
        squashY: 1.09,
        pupilScale: 1.2,
        afterburnerBoost: 0.92,
        duration: 0.48,
        ease: "back.out(1.8)",
      })
      .to(proxy, {
        idleYaw: -36,
        idlePitch: -22,
        idleRoll: 16,
        bounceY: -13,
        squashX: 0.9,
        squashY: 1.12,
        afterburnerBoost: 1.0,
        duration: 0.52,
        ease: "back.out(2)",
      })
      .fromTo(
        proxy,
        { spinYawOffset: 0 },
        {
          spinYawOffset: 360,
          afterburnerBoost: 0.85,
          duration: 0.75,
          ease: "power2.inOut",
        }
      )
      .to(proxy, {
        idleYaw: 0,
        idlePitch: 0,
        idleRoll: 0,
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        spinYawOffset: 0,
        pupilScale: 1,
        afterburnerBoost: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.55)",
      });
    return cleanup;
  }

  // 5. Mouse Play / Cursor Pounce (Stalking Wiggle -> Forward Lunge)
  if (activity === "mouse_play") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: -24,
        idlePitch: 10,
        idleRoll: -12,
        bounceY: 4,
        squashX: 1.09,
        squashY: 0.91,
        saccadeX: -2.4,
        saccadeY: -1.4,
        pupilScale: 1.28,
        afterburnerBoost: 0.35,
        duration: 0.25,
        ease: "power2.out",
      })
      .to(proxy, {
        idleRoll: 12,
        idleYaw: -18,
        duration: 0.14,
        yoyo: true,
        repeat: 3,
        ease: "sine.inOut",
      })
      .to(proxy, {
        idleYaw: -32,
        idlePitch: -22,
        idleRoll: -18,
        bounceY: -10,
        squashX: 0.9,
        squashY: 1.12,
        afterburnerBoost: 0.98,
        duration: 0.32,
        ease: "back.out(2)",
      })
      .to(proxy, {
        idleYaw: 14,
        idlePitch: -8,
        idleRoll: 10,
        bounceY: -5,
        squashX: 1.04,
        squashY: 0.96,
        afterburnerBoost: 0.45,
        duration: 0.35,
        ease: "power2.out",
      })
      .to(proxy, {
        idleYaw: 0,
        idlePitch: 0,
        idleRoll: 0,
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        saccadeX: 0,
        saccadeY: 0,
        pupilScale: 1,
        afterburnerBoost: 0,
        duration: 0.55,
        ease: "elastic.out(1, 0.5)",
      });
    return cleanup;
  }

  // 6. Screen Bonk (Dash Forward -> Squash Against Glass -> Dizzy Wobble)
  if (activity === "screen_bonk") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idlePitch: -18,
        bounceY: -6,
        squashX: 0.92,
        squashY: 1.08,
        afterburnerBoost: 0.95,
        duration: 0.2,
        ease: "power2.out",
      })
      .to(proxy, {
        idlePitch: 14,
        idleYaw: -8,
        idleRoll: -14,
        bounceY: 2,
        squashX: 1.24,
        squashY: 0.78,
        pupilScale: 0.78,
        afterburnerBoost: 0.2,
        duration: 0.14,
        ease: "power4.out",
      })
      .to(proxy, {
        idleYaw: 24,
        idleRoll: 18,
        idlePitch: -6,
        squashX: 0.96,
        squashY: 1.04,
        duration: 0.22,
        ease: "sine.inOut",
      })
      .to(proxy, {
        idleYaw: -20,
        idleRoll: -15,
        idlePitch: 6,
        squashX: 1.03,
        squashY: 0.97,
        duration: 0.24,
        ease: "sine.inOut",
      })
      .to(proxy, {
        idleYaw: 0,
        idlePitch: 0,
        idleRoll: 0,
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        pupilScale: 1,
        afterburnerBoost: 0,
        duration: 0.55,
        ease: "elastic.out(1, 0.5)",
      });
    return cleanup;
  }

  // 7. Spin & Backflip Acrobatics
  if (activity === "idle_spin" || activity === "backflip") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        bounceY: activity === "backflip" ? -12 : -6,
        squashX: 0.92,
        squashY: 1.09,
        idlePitch: activity === "backflip" ? -26 : -8,
        idleRoll: activity === "backflip" ? -16 : -6,
        pupilScale: 1.16,
        afterburnerBoost: activity === "backflip" ? 1.0 : 0.75,
        duration: 0.35,
        ease: "power2.out",
      })
      .fromTo(
        proxy,
        { spinYawOffset: 0 },
        {
          spinYawOffset: 360,
          duration: 1.25,
          ease: "power2.inOut",
        },
        0
      )
      .to(
        proxy,
        {
          bounceY: 0,
          squashX: 1,
          squashY: 1,
          idlePitch: 0,
          idleRoll: 0,
          spinYawOffset: 0,
          pupilScale: 1,
          afterburnerBoost: 0,
          duration: 0.48,
          ease: "elastic.out(1, 0.5)",
        },
        1.05
      );
    return cleanup;
  }

  // 8. Happy Hover-Bounce / Tickle / Greeting Wave
  if (
    activity === "wiggle" ||
    activity === "tickle" ||
    activity === "greeting_wave"
  ) {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        bounceY: -6.5,
        squashX: 0.94,
        squashY: 1.07,
        idleRoll: -14,
        idleYaw: -18,
        idlePitch: -5,
        pupilScale: 1.18,
        afterburnerBoost: 0.6,
        duration: 0.26,
        ease: "power2.out",
      })
      .to(proxy, {
        bounceY: 1.5,
        squashX: 1.05,
        squashY: 0.95,
        idleRoll: 14,
        idleYaw: 18,
        idlePitch: 2,
        afterburnerBoost: 0.35,
        duration: 0.26,
        ease: "sine.inOut",
      })
      .to(proxy, {
        bounceY: -4.5,
        squashX: 0.96,
        squashY: 1.04,
        idleRoll: -9,
        idleYaw: -10,
        idlePitch: -4,
        afterburnerBoost: 0.5,
        duration: 0.24,
        ease: "power2.out",
      })
      .to(proxy, {
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        idleRoll: 0,
        idleYaw: 0,
        idlePitch: 0,
        pupilScale: 1,
        afterburnerBoost: 0,
        duration: 0.48,
        ease: "elastic.out(1, 0.5)",
      });
    return cleanup;
  }

  // 9. Signature Curious Head-Tilt Pose
  if (activity === "stare_curious") {
    const tiltDir = Math.random() > 0.5 ? -1 : 1;
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: tiltDir * 22,
        idlePitch: -7,
        idleRoll: tiltDir * 17,
        bounceY: -2.8,
        squashX: 1.02,
        squashY: 0.98,
        saccadeX: tiltDir * 2.2,
        saccadeY: -1.2,
        pupilScale: 1.22,
        duration: 0.5,
        ease: "back.out(1.6)",
      })
      .to(
        proxy,
        {
          idleYaw: -tiltDir * 14,
          idleRoll: -tiltDir * 12,
          saccadeX: -tiltDir * 1.8,
          pupilScale: 0.9,
          duration: 0.65,
          ease: "power2.inOut",
        },
        "+=0.45"
      )
      .to(
        proxy,
        {
          idleYaw: 0,
          idlePitch: 0,
          idleRoll: 0,
          bounceY: 0,
          squashX: 1,
          squashY: 1,
          pupilScale: 1,
          duration: 0.45,
          ease: "power2.out",
        },
        "+=0.25"
      );
    return cleanup;
  }

  // 10. Hide & Seek Corner Peek
  if (activity === "hide_and_seek") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: -36,
        idlePitch: -10,
        idleRoll: -18,
        saccadeX: -2.6,
        pupilScale: 1.15,
        afterburnerBoost: 0.55,
        duration: 0.55,
        ease: "back.out(1.4)",
      })
      .to(
        proxy,
        {
          idleYaw: 28,
          idlePitch: -8,
          idleRoll: 15,
          saccadeX: 2.4,
          duration: 0.7,
          ease: "power2.inOut",
        },
        "+=0.55"
      )
      .to(
        proxy,
        {
          idleYaw: 0,
          idlePitch: -12,
          idleRoll: 0,
          bounceY: -7,
          squashX: 0.94,
          squashY: 1.07,
          afterburnerBoost: 0.8,
          duration: 0.45,
          ease: "back.out(1.8)",
        },
        "+=0.55"
      )
      .to(proxy, {
        idlePitch: 0,
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        pupilScale: 1,
        afterburnerBoost: 0,
        duration: 0.45,
        ease: "power2.out",
      });
    return cleanup;
  }

  // 11. Roam Patrol Flight
  if (activity === "roam") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: -32,
        idlePitch: -8,
        idleRoll: -15,
        bounceY: -5.5,
        squashX: 0.95,
        squashY: 1.05,
        afterburnerBoost: 0.78,
        duration: 0.6,
        ease: "power2.out",
      })
      .to(proxy, {
        idleYaw: 26,
        idlePitch: -6,
        idleRoll: 12,
        bounceY: -3,
        squashX: 1,
        squashY: 1,
        afterburnerBoost: 0.62,
        duration: 0.9,
        ease: "sine.inOut",
      })
      .to(proxy, {
        idleYaw: 0,
        idlePitch: 0,
        idleRoll: 0,
        bounceY: 0,
        afterburnerBoost: 0,
        duration: 0.7,
        ease: "power2.out",
      });
    return cleanup;
  }

  // 12. Scenic Scan (Looking Around)
  if (activity === "looking_around") {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idleYaw: -38,
        idlePitch: -8,
        idleRoll: -8,
        saccadeX: -2.6,
        saccadeY: -1,
        pupilScale: 1.12,
        duration: 0.6,
        ease: "power2.inOut",
      })
      .to(
        proxy,
        {
          idleYaw: 38,
          idlePitch: -10,
          idleRoll: 8,
          saccadeX: 2.6,
          saccadeY: -1.4,
          pupilScale: 0.92,
          duration: 0.85,
          ease: "power2.inOut",
        },
        "+=0.22"
      )
      .to(
        proxy,
        {
          idleYaw: 0,
          idlePitch: 0,
          idleRoll: 0,
          saccadeX: 0,
          saccadeY: 0,
          pupilScale: 1,
          duration: 0.55,
          ease: "power2.out",
        },
        "+=0.2"
      );
    return cleanup;
  }

  // 13. Cozy Micro-Nap Nod / Gentle Stretch
  if (
    activity === "idle_yawn" ||
    activity === "stretch" ||
    activity === "idle_drowsy" ||
    activity === "sleeping" ||
    activity === "sleepy"
  ) {
    activeTl = gsap.timeline();
    activeTl
      .to(proxy, {
        idlePitch:
          activity === "stretch" || activity === "idle_yawn" ? -20 : 14,
        idleRoll: -10,
        idleYaw: -10,
        bounceY:
          activity === "stretch" || activity === "idle_yawn" ? -5 : 2.5,
        squashX: 1.04,
        squashY: 0.96,
        pupilScale: 0.85,
        duration: 0.75,
        ease: "sine.inOut",
      })
      .to(proxy, {
        idlePitch:
          activity === "sleeping" || activity === "sleepy"
            ? 13
            : activity === "idle_drowsy"
            ? 9
            : 0,
        idleRoll:
          activity === "sleeping" || activity === "sleepy"
            ? -8
            : activity === "idle_drowsy"
            ? -4
            : 0,
        idleYaw: 0,
        bounceY: 0,
        squashX: 1,
        squashY: 1,
        pupilScale: 1,
        duration: 0.75,
        ease: "sine.out",
      });
    return cleanup;
  }

  // 14. Default Autonomous Idle Micro-Behavior Loop (Non-Repeating 4-Variant Selector)
  let lastVariant = -1;
  const runAutonomousMicroPose = () => {
    let variant = Math.floor(Math.random() * 4);
    if (variant === lastVariant) {
      variant = (variant + 1) % 4;
    }
    lastVariant = variant;

    activeTl = gsap.timeline({
      onComplete: () => {
        idleLoopCall = gsap.delayedCall(
          1.05 + Math.random() * 1.35,
          runAutonomousMicroPose
        );
      },
    });

    if (variant === 0) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      activeTl
        .to(proxy, {
          idleYaw: dir * (16 + Math.random() * 14),
          idlePitch: -6 - Math.random() * 6,
          idleRoll: dir * (11 + Math.random() * 6),
          bounceY: -2.2,
          pupilScale: 1.12,
          duration: 0.6,
          ease: "back.out(1.4)",
        })
        .to(
          proxy,
          {
            idleYaw: 0,
            idlePitch: 0,
            idleRoll: 0,
            bounceY: 0,
            pupilScale: 1,
            duration: 0.7,
            ease: "power2.inOut",
          },
          "+=0.6"
        );
    } else if (variant === 1) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      activeTl
        .to(proxy, {
          idleYaw: dir * (28 + Math.random() * 14),
          idlePitch: (Math.random() - 0.55) * 12,
          idleRoll: dir * 7,
          pupilScale: 0.92,
          duration: 0.7,
          ease: "power2.out",
        })
        .to(
          proxy,
          {
            idleYaw: 0,
            idlePitch: 0,
            idleRoll: 0,
            pupilScale: 1,
            duration: 0.75,
            ease: "power2.inOut",
          },
          "+=0.7"
        );
    } else if (variant === 2) {
      activeTl
        .to(proxy, {
          bounceY: -4.8,
          squashX: 0.96,
          squashY: 1.05,
          idlePitch: -9,
          pupilScale: 1.14,
          afterburnerBoost: 0.38,
          duration: 0.3,
          ease: "power2.out",
        })
        .to(proxy, {
          bounceY: 0,
          squashX: 1,
          squashY: 1,
          idlePitch: 0,
          pupilScale: 1,
          afterburnerBoost: 0,
          duration: 0.55,
          ease: "elastic.out(1, 0.55)",
        });
    } else {
      const dir = Math.random() > 0.5 ? 1 : -1;
      activeTl
        .to(proxy, {
          idleYaw: dir * 20,
          idlePitch: -4,
          idleRoll: dir * 6,
          duration: 0.45,
          ease: "power2.out",
        })
        .to(proxy, {
          idleYaw: -dir * 18,
          idlePitch: 3,
          idleRoll: -dir * 5,
          duration: 0.55,
          ease: "power2.inOut",
        })
        .to(proxy, {
          idleYaw: 0,
          idlePitch: 0,
          idleRoll: 0,
          duration: 0.5,
          ease: "power2.out",
        });
    }
  };

  idleLoopCall = gsap.delayedCall(0.5, runAutonomousMicroPose);
  return cleanup;
}
