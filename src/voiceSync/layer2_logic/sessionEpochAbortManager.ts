import { AssistantStage } from "../layer1_data/assistantSessionTypes";

/**
 * Layer 2 Session Epoch & AbortController Quarantine Manager:
 * Ensures that when Sleep or Power is triggered, all in-flight HTTP/tool requests
 * are aborted via AbortSignal and any late non-cancellable tool results are discarded.
 */
export class SessionEpochAbortManager {
  private currentEpochId: number = 1;
  private currentStage: AssistantStage = "standby";
  private sessionAbortController: AbortController = new AbortController();
  private turnAbortController: AbortController = new AbortController();

  public syncState(epochId: number, stage: AssistantStage): void {
    if (epochId !== this.currentEpochId) {
      this.currentEpochId = epochId;
      try {
        this.sessionAbortController.abort("session_epoch_advanced");
      } catch {}
      try {
        this.turnAbortController.abort("session_epoch_advanced");
      } catch {}
      this.sessionAbortController = new AbortController();
      this.turnAbortController = new AbortController();
    }
    this.currentStage = stage;
  }

  public advanceEpochAndAbortAll(reason: string = "session_terminated"): number {
    this.currentEpochId += 1;
    this.currentStage = "standby";
    try {
      this.sessionAbortController.abort(reason);
    } catch {}
    try {
      this.turnAbortController.abort(reason);
    } catch {}
    this.sessionAbortController = new AbortController();
    this.turnAbortController = new AbortController();
    return this.currentEpochId;
  }

  public abortCurrentTurnOnly(reason: string = "barge_in_interruption"): AbortSignal {
    try {
      this.turnAbortController.abort(reason);
    } catch {}
    this.turnAbortController = new AbortController();
    return this.turnAbortController.signal;
  }

  public getEpochId(): number {
    return this.currentEpochId;
  }

  public getStage(): AssistantStage {
    return this.currentStage;
  }

  public getTurnAbortSignal(): AbortSignal {
    return this.turnAbortController.signal;
  }

  public getSessionAbortSignal(): AbortSignal {
    return this.sessionAbortController.signal;
  }

  /**
   * Returns true ONLY if the captured epoch matches the active session epoch
   * and the session has not been terminated to standby.
   */
  public isEpochActive(capturedEpochId: number, allowInStandby: boolean = false): boolean {
    if (capturedEpochId !== this.currentEpochId) {
      return false;
    }
    if (!allowInStandby && this.currentStage === "standby") {
      return false;
    }
    return true;
  }

  /**
   * Wraps any asynchronous tool or HTTP callback so late completions after
   * Sleep / Power disconnect are quarantined and never mutate UI or wake the session.
   */
  public runIfEpochActive<T>(
    capturedEpochId: number,
    callback: () => T,
    options?: { allowInStandby?: boolean; onQuarantined?: () => void }
  ): T | undefined {
    if (!this.isEpochActive(capturedEpochId, options?.allowInStandby ?? false)) {
      console.warn(
        `[SessionEpochAbortManager] Quarantined late callback from stale epoch ${capturedEpochId} (current=${this.currentEpochId}, stage=${this.currentStage}).`
      );
      options?.onQuarantined?.();
      return undefined;
    }
    return callback();
  }
}

export const globalSessionEpochManager = new SessionEpochAbortManager();
