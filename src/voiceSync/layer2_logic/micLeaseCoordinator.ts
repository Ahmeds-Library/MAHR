import { MicLeaseOwner } from "../layer1_data/assistantSessionTypes";

export interface WakeRecognizerHandle {
  stop: () => void;
  abort: () => void;
  isEnded: () => boolean;
  waitForEnd: (timeoutMs: number) => Promise<boolean>;
}

export interface MicHandoffResult {
  released: boolean;
  owner: MicLeaseOwner;
  diagnostic?: string;
}

/**
 * Layer 2 Deterministic Microphone Lease Coordinator
 * Guarantees that browser SpeechRecognition (`wake_recognizer`) and Web Audio
 * 16kHz PCM `getUserMedia` (`live_pcm_vad`) NEVER run simultaneously.
 */
export class MicLeaseCoordinator {
  private currentOwner: MicLeaseOwner = "none";
  private activeWakeHandle: WakeRecognizerHandle | null = null;
  private onLeaseChange?: (owner: MicLeaseOwner) => void;

  constructor(onLeaseChange?: (owner: MicLeaseOwner) => void) {
    this.onLeaseChange = onLeaseChange;
  }

  public getOwner(): MicLeaseOwner {
    return this.currentOwner;
  }

  public setLeaseOwner(owner: MicLeaseOwner): void {
    this.currentOwner = owner;
    this.onLeaseChange?.(owner);
  }

  public registerWakeRecognizer(handle: WakeRecognizerHandle | null): void {
    this.activeWakeHandle = handle;
    if (handle) {
      this.setLeaseOwner("wake_recognizer");
    } else if (this.currentOwner === "wake_recognizer") {
      this.setLeaseOwner("none");
    }
  }

  /**
   * Fail-Safe Lease Handoff:
   * Releases the background `SpeechRecognition` instance and waits for explicit
   * `onend` confirmation (250ms initial wait + up to 2 bounded 150ms retries).
   * If `SpeechRecognition` still fails to confirm release, returns `{ released: false }`
   * so `getUserMedia` is NEVER opened concurrently.
   */
  public async releaseWakeRecognizerWithFailSafe(): Promise<MicHandoffResult> {
    if (!this.activeWakeHandle || this.activeWakeHandle.isEnded()) {
      this.activeWakeHandle = null;
      this.setLeaseOwner("none");
      return { released: true, owner: "none" };
    }

    this.setLeaseOwner("releasing_wake");
    const handle = this.activeWakeHandle;

    // Attempt 1: Graceful stop + abort (250ms window)
    try {
      handle.stop();
    } catch {}
    try {
      handle.abort();
    } catch {}

    let ended = await handle.waitForEnd(250);
    if (ended || handle.isEnded()) {
      this.activeWakeHandle = null;
      this.setLeaseOwner("none");
      return { released: true, owner: "none" };
    }

    // Bounded Retries (2x 150ms)
    for (let retry = 1; retry <= 2; retry++) {
      try {
        handle.abort();
      } catch {}
      ended = await handle.waitForEnd(150);
      if (ended || handle.isEnded()) {
        this.activeWakeHandle = null;
        this.setLeaseOwner("none");
        return { released: true, owner: "none" };
      }
    }

    // Fail-safe triggered: Do NOT start getUserMedia while wake recognizer is still holding mic
    return {
      released: false,
      owner: "wake_recognizer",
      diagnostic:
        "Microphone busy releasing background wake listener. Please tap the Mic button to retry.",
    };
  }
}
