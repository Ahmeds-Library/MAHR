import { DailyTask } from "../lib/subagentTypes";

export interface ProactiveReminderConfig {
  enabled: boolean;
  idleTimeoutMins: number; // e.g. 2, 3, 5, 10
  cooldownMins: number;    // min time between spoken reminders (default 5)
  agentMode: "human" | "anime";
}

let lastActivityTime = Date.now();
let lastReminderTime = 0;
let isListenersAttached = false;

/**
 * Record user activity timestamp whenever any interaction occurs.
 */
export function recordUserActivity() {
  lastActivityTime = Date.now();
}

/**
 * Initialize global window listeners for user activity.
 */
export function initActivityTracker() {
  if (isListenersAttached || typeof window === "undefined") return;

  const events = ["mousemove", "keydown", "touchstart", "pointerdown", "scroll", "click"];
  const handleEvent = () => recordUserActivity();

  events.forEach((evt) => {
    window.addEventListener(evt, handleEvent, { passive: true });
  });

  isListenersAttached = true;
}

/**
 * Returns the current idle duration in milliseconds.
 */
export function getIdleDurationMs(): number {
  return Date.now() - lastActivityTime;
}

/**
 * Formats a warm, natural human/anime voice reminder for upcoming pending tasks.
 */
export function generateTaskReminderSpeech(
  pendingTasks: DailyTask[],
  agentMode: "human" | "anime"
): { speechText: string; taskTitle: string; emotion: string } | null {
  if (!pendingTasks || pendingTasks.length === 0) return null;

  // Prioritize high/medium tasks first
  const highPriority = pendingTasks.find((t) => t.priority === "high");
  const targetTask = highPriority || pendingTasks[0];

  const taskTitle = targetTask.title;
  let speechText = "";
  let emotion = "warm";

  if (agentMode === "anime") {
    const animePhrases = [
      `Umm, TECH-san? I noticed it's been a little quiet! Just a gentle reminder that you have '${taskTitle}' on your schedule. Let's do our best together!`,
      `TECH-san, don't forget about '${taskTitle}'! Whenever you're ready, I'm right here to help you finish it!`,
      `Hey TECH-san! Taking a little break? When you get back, '${taskTitle}' is waiting for us on our task list!`
    ];
    speechText = animePhrases[Math.floor(Math.random() * animePhrases.length)];
    emotion = "playful";
  } else {
    const humanPhrases = [
      `Hey TECH, I noticed you've been quiet for a bit! Friendly reminder that you have '${taskTitle}' coming up on your task schedule. Let me know if you want to tackle it together!`,
      `Just checking in, TECH! You still have '${taskTitle}' pending on your daily checklist whenever you're ready to dive in.`,
      `Hey TECH! Taking a quick breather? Don't forget '${taskTitle}' is on our study plan for today. I'm right here if you need any assistance!`
    ];
    speechText = humanPhrases[Math.floor(Math.random() * humanPhrases.length)];
    emotion = "happy";
  }

  return { speechText, taskTitle, emotion };
}

/**
 * Evaluates whether a proactive reminder should be triggered.
 */
export function checkProactiveReminder(
  tasks: DailyTask[],
  config: ProactiveReminderConfig
): { speechText: string; taskTitle: string; emotion: string } | null {
  if (!config.enabled || !tasks || tasks.length === 0) return null;

  const now = Date.now();
  const idleMs = now - lastActivityTime;
  const timeoutMs = config.idleTimeoutMins * 60 * 1000;
  const cooldownMs = (config.cooldownMins || 5) * 60 * 1000;

  // Must exceed idle timeout and pass cooldown check
  if (idleMs >= timeoutMs && now - lastReminderTime >= cooldownMs) {
    const pending = tasks.filter((t) => !t.completed);
    if (pending.length > 0) {
      const reminder = generateTaskReminderSpeech(pending, config.agentMode);
      if (reminder) {
        lastReminderTime = now;
        return reminder;
      }
    }
  }

  return null;
}
