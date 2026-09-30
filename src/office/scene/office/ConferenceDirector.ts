import type { Character } from './Character.ts';
import type { Agent } from '../../store/store.ts';

export interface ConferenceSpot {
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';
  role: 'leader' | 'copresenter' | 'table' | 'chair';
}

// 100% walkable certified tiles in the Boardroom around whiteboard and conference table
export const BOARDROOM_CONFERENCE_SPOTS: ConferenceSpot[] = [
  { x: 10, y: 3, facing: 'down', role: 'leader' },      // MAHR / Boss at Whiteboard
  { x: 9, y: 3, facing: 'right', role: 'copresenter' },  // Pam / Visual Specs
  { x: 11, y: 7, facing: 'up', role: 'table' },         // Jim / Frontend Architect
  { x: 12, y: 7, facing: 'up', role: 'table' },         // Dwight / Code Auditor
  { x: 14, y: 7, facing: 'up', role: 'table' },         // Ryan / Fullstack Temp
  { x: 15, y: 7, facing: 'up', role: 'table' },         // Stanley / QA Specialist
  { x: 9, y: 5, facing: 'right', role: 'chair' },        // West Conference Chair
  { x: 17, y: 5, facing: 'left', role: 'chair' },        // East Conference Chair
  { x: 9, y: 4, facing: 'right', role: 'chair' },        // West Upper Chair
  { x: 16, y: 7, facing: 'up', role: 'table' }          // South Table Far Right
];

export const NOTICE_BOARD_PIN_STAND = { x: 9, y: 11 };

export interface ConferenceMember {
  phase: 'walking' | 'meeting' | 'pinning' | 'dismissed';
  spot: ConferenceSpot;
  timer: number;
}

export interface RuntimeLike {
  character: Character;
  charName: string;
  conf?: ConferenceMember;
  brk?: any;
  err?: any;
  run?: any;
}

export interface ConferenceDirectorOptions {
  runtimes: Map<string, RuntimeLike>;
  getAgents: () => Agent[];
  updateAgent: (id: string, patch: Partial<Agent>) => void;
  onPinToNoticeBoard?: (task: { id: string; title: string; assignee?: string }) => void;
  onConferenceStatus?: (status: string, stage: 'calling' | 'briefing' | 'pinning' | 'dismissed') => void;
  releaseBreak: (rt: RuntimeLike) => void;
  releaseErrand: (rt: RuntimeLike) => void;
  releaseRun: (rt: RuntimeLike) => void;
}

export class ConferenceDirector {
  private runtimes: Map<string, RuntimeLike>;
  private getAgents: () => Agent[];
  private updateAgent: (id: string, patch: Partial<Agent>) => void;
  private onPinToNoticeBoard?: (task: { id: string; title: string; assignee?: string }) => void;
  private onConferenceStatus?: (status: string, stage: 'calling' | 'briefing' | 'pinning' | 'dismissed') => void;
  private releaseBreak: (rt: RuntimeLike) => void;
  private releaseErrand: (rt: RuntimeLike) => void;
  private releaseRun: (rt: RuntimeLike) => void;

  private isConferenceActive = false;
  private currentStage: 'idle' | 'walking' | 'briefing' | 'pinning' | 'dismissed' = 'idle';
  private sessionTimer = 0;
  private activeTaskTitle = 'Sprint Deliverables Review';
  private designatedAssignee?: Agent;
  private scheduledTimeouts: any[] = [];

  constructor(options: ConferenceDirectorOptions) {
    this.runtimes = options.runtimes;
    this.getAgents = options.getAgents;
    this.updateAgent = options.updateAgent;
    this.onPinToNoticeBoard = options.onPinToNoticeBoard;
    this.onConferenceStatus = options.onConferenceStatus;
    this.releaseBreak = options.releaseBreak;
    this.releaseErrand = options.releaseErrand;
    this.releaseRun = options.releaseRun;
  }

  public isActive(): boolean {
    return this.isConferenceActive;
  }

  public getStage(): string {
    return this.currentStage;
  }

  private findRuntime(agent: Agent): RuntimeLike | undefined {
    return (
      this.runtimes.get(agent.id) ||
      this.runtimes.get(agent.id.replace('-', '_')) ||
      this.runtimes.get(agent.id.replace('_', '-')) ||
      Array.from(this.runtimes.values()).find((r) => r.charName === agent.character)
    );
  }

  public startConference(taskTitle?: string, assigneeHint?: string): boolean {
    if (this.isConferenceActive) {
      console.log('[ConferenceDirector] Standup already in session');
      return false;
    }

    const currentAgents = this.getAgents();
    if (!currentAgents || currentAgents.length === 0) return false;

    this.isConferenceActive = true;
    this.currentStage = 'walking';
    this.sessionTimer = 0;
    this.clearAllTimeouts();

    this.activeTaskTitle = taskTitle || 'Autonomous Sprint Briefing';

    const godAgent = currentAgents.find((a) => a.isGod) || currentAgents[0];
    const others = currentAgents.filter((a) => a.id !== godAgent.id);
    const ordered = [godAgent, ...others];

    // Pick designated assignee
    if (assigneeHint) {
      this.designatedAssignee = currentAgents.find(
        (a) =>
          a.name.toLowerCase().includes(assigneeHint.toLowerCase()) ||
          a.id.toLowerCase().includes(assigneeHint.toLowerCase()) ||
          (a.character && a.character.toLowerCase().includes(assigneeHint.toLowerCase()))
      );
    }
    if (!this.designatedAssignee) {
      this.designatedAssignee = others[0] || godAgent;
    }

    this.onConferenceStatus?.(
      `📢 ${godAgent.name} called all-hands standup: "${this.activeTaskTitle}"`,
      'calling'
    );

    // Stagger departure so agents exit desks and enter boardroom doorway cleanly
    ordered.forEach((agent, idx) => {
      const rt = this.findRuntime(agent);
      if (!rt) return;

      this.releaseBreak(rt);
      this.releaseErrand(rt);
      this.releaseRun(rt);

      const spot = BOARDROOM_CONFERENCE_SPOTS[idx % BOARDROOM_CONFERENCE_SPOTS.length];
      rt.conf = {
        phase: 'walking',
        spot,
        timer: 0
      };

      // Set optimistic store state for agent station
      this.updateAgent(agent.id, {
        currentStation: 'board',
        status: 'thinking',
        action: agent.isGod
          ? `leading standup: "${this.activeTaskTitle.slice(0, 26)}"`
          : 'heading to boardroom standup'
      });

      const departureDelay = idx * 280;
      const t = setTimeout(() => {
        if (!this.isConferenceActive || !rt.conf) return;

        const walkThought = agent.isGod
          ? `📢 Calling team standup: "${this.activeTaskTitle.slice(0, 20)}..."`
          : 'Heading to Boardroom 💼';
        rt.character.showThought(walkThought);

        rt.character.walkToAndThen({ x: spot.x, y: spot.y }, () => {
          if (!this.isConferenceActive || !rt.conf) return;
          rt.conf.phase = 'meeting';
          rt.character.faceDirection(spot.facing);
          rt.character.setIdle();

          if (agent.isGod) {
            rt.character.showThought(`Briefing: "${this.activeTaskTitle.slice(0, 28)}" 💡`);
          } else if (this.designatedAssignee && agent.id === this.designatedAssignee.id) {
            rt.character.showThought('Listening to briefing — ready to take mission 📋');
          } else {
            const roleQuips: Record<string, string> = {
              pam: 'Whiteboard & diagrams aligned 🎨',
              jim: 'Frontend architecture ready 🚀',
              dwight: 'Auditing code & security rules 🛡️',
              ryan: 'Data pipes & APIs ready ⚡',
              stanley: 'Test coverage verified ☕'
            };
            const quip = (agent.character && roleQuips[agent.character.toLowerCase()]) || 'Sprint aligned 👍';
            rt.character.showThought(quip);
          }
        });
      }, departureDelay);

      this.scheduledTimeouts.push(t);
    });

    // Advance to Briefing phase after arrival window (~11s)
    const briefingTimer = setTimeout(() => {
      this.triggerBriefingPhase(godAgent, ordered);
    }, 11500);
    this.scheduledTimeouts.push(briefingTimer);

    // Fail-safe watchdog: dismiss after 32s if not already finished
    const watchdogTimer = setTimeout(() => {
      if (this.isConferenceActive) {
        this.dismissConference();
      }
    }, 32000);
    this.scheduledTimeouts.push(watchdogTimer);

    return true;
  }

  private triggerBriefingPhase(godAgent: Agent, ordered: Agent[]): void {
    if (!this.isConferenceActive) return;
    this.currentStage = 'briefing';

    const godRt = this.findRuntime(godAgent);
    if (godRt) {
      godRt.character.faceDirection('down');
      godRt.character.showThought(`"Team: Priority mission is ${this.activeTaskTitle}!"`);
    }

    this.onConferenceStatus?.(
      `🗣️ MAHR assigning mission "${this.activeTaskTitle}" to ${this.designatedAssignee?.name || 'team'}`,
      'briefing'
    );

    // After 4 seconds of briefing, assignee accepts mission and walks to Notice Board
    const pinTimer = setTimeout(() => {
      this.triggerPinningPhase(ordered);
    }, 4500);
    this.scheduledTimeouts.push(pinTimer);
  }

  private triggerPinningPhase(ordered: Agent[]): void {
    if (!this.isConferenceActive) return;
    this.currentStage = 'pinning';

    const assignee = this.designatedAssignee || ordered[1] || ordered[0];
    const assigneeRt = this.findRuntime(assignee);

    if (assigneeRt) {
      assigneeRt.conf = {
        phase: 'pinning',
        spot: { x: NOTICE_BOARD_PIN_STAND.x, y: NOTICE_BOARD_PIN_STAND.y, facing: 'up', role: 'table' },
        timer: 0
      };

      assigneeRt.character.showThought(`"I got this! Pinning to Notice Board 📌"`);

      this.onConferenceStatus?.(
        `📌 ${assignee.name} is pinning "${this.activeTaskTitle}" to the Notice Board`,
        'pinning'
      );

      // Walk to notice board stand
      assigneeRt.character.walkToAndThen(NOTICE_BOARD_PIN_STAND, () => {
        assigneeRt.character.faceDirection('up');
        assigneeRt.character.setIdle();
        assigneeRt.character.showThought(`📌 Pinned task: "${this.activeTaskTitle.slice(0, 24)}"!`);

        // Notify floor notice board
        this.onPinToNoticeBoard?.({
          id: `task_${Date.now()}`,
          title: this.activeTaskTitle,
          assignee: assignee.name
        });

        // After pinning, dismiss all agents back to workstations
        const returnTimer = setTimeout(() => {
          this.dismissConference();
        }, 3200);
        this.scheduledTimeouts.push(returnTimer);
      });
    } else {
      // Fallback if assignee not found
      this.dismissConference();
    }
  }

  public dismissConference(): void {
    if (!this.isConferenceActive && this.currentStage === 'idle') return;

    this.isConferenceActive = false;
    this.currentStage = 'dismissed';
    this.clearAllTimeouts();

    const currentAgents = this.getAgents();

    this.onConferenceStatus?.('🚀 Standup adjourned — agents returning to workstations!', 'dismissed');

    currentAgents.forEach((agent, idx) => {
      const rt = this.findRuntime(agent);
      if (!rt) return;

      rt.conf = undefined;
      rt.character.hideThought();

      // Reset station in store to 'desk' and status to 'working'
      this.updateAgent(agent.id, {
        currentStation: 'desk',
        status: 'working',
        action: agent.isGod
          ? 'orchestrating office floor'
          : `working on ${this.activeTaskTitle.slice(0, 26)}`
      });

      // Synchronize with backend API so persistence doesn't revert station
      fetch('/api/office/agent-station', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          character: agent.character,
          currentStation: 'desk',
          action: `working on ${this.activeTaskTitle.slice(0, 26)}`,
          status: 'working'
        })
      }).catch(() => {});

      // Stagger walk back to desk
      const t = setTimeout(() => {
        rt.character.sitAtDesk(true);
      }, 300 + idx * 300);
      this.scheduledTimeouts.push(t);
    });

    const resetStageTimer = setTimeout(() => {
      this.currentStage = 'idle';
    }, 4000);
    this.scheduledTimeouts.push(resetStageTimer);
  }

  public update(dt: number): void {
    if (!this.isConferenceActive) return;
    this.sessionTimer += dt;
  }

  private clearAllTimeouts(): void {
    this.scheduledTimeouts.forEach((t) => clearTimeout(t));
    this.scheduledTimeouts = [];
  }

  public destroy(): void {
    this.clearAllTimeouts();
    this.isConferenceActive = false;
    this.currentStage = 'idle';
  }
}
