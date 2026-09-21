import { useEffect, useRef, useState, useCallback } from "react";
import { DailyTask } from "../lib/subagentTypes";
import { MyraaEmotion } from "../components/MyraaCoreVisualizer";

interface UseProactiveTaskRemindersOptions {
  dailyTasks: DailyTask[];
  speakNotification: (msg: string | { ur: string; en: string }, overrideEmotion?: MyraaEmotion) => void;
  isAudioConnected: boolean;
  inactivityThresholdMs?: number; // e.g. 45000ms (45 seconds) default
  cooldownMs?: number; // e.g. 120000ms (2 minutes) between reminders
  isEnabled?: boolean;
}

export function useProactiveTaskReminders({
  dailyTasks,
  speakNotification,
  isAudioConnected,
  inactivityThresholdMs = 45000,
  cooldownMs = 120000,
  isEnabled = true,
}: UseProactiveTaskRemindersOptions) {
  const [activeReminder, setActiveReminder] = useState<DailyTask | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const lastRemindedTaskIdRef = useRef<string | null>(null);
  const lastReminderTimeRef = useRef<number>(0);

  // Track user activity (mouse, key, click, scroll)
  useEffect(() => {
    const handleUserActivity = () => {
      setLastActivityTime(Date.now());
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
    };
  }, []);

  // Periodic check for inactivity and pending tasks
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime;
      const timeSinceLastReminder = now - lastReminderTimeRef.current;

      // Only remind if inactive, cooldown passed
      if (timeSinceLastActivity >= inactivityThresholdMs && timeSinceLastReminder >= cooldownMs) {
        // Find uncompleted tasks
        const pendingTasks = dailyTasks.filter((t) => !t.completed);
        if (pendingTasks.length === 0) return;

        // Prioritize high priority or first available non-repeated task
        const highPriorityTask = pendingTasks.find((t) => t.priority === "high" && t.id !== lastRemindedTaskIdRef.current);
        const nextTask = highPriorityTask || pendingTasks.find((t) => t.id !== lastRemindedTaskIdRef.current) || pendingTasks[0];

        if (nextTask) {
          lastRemindedTaskIdRef.current = nextTask.id;
          lastReminderTimeRef.current = now;
          setActiveReminder(nextTask);

          const reminderSpeech = `Hey! Just a gentle reminder, your upcoming task is: ${nextTask.title}. Let me know if you want to work on this together!`;
          speakNotification(reminderSpeech, "happy");

          // Dismiss toast alert after 8 seconds
          setTimeout(() => {
            setActiveReminder(null);
          }, 8000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dailyTasks, lastActivityTime, inactivityThresholdMs, cooldownMs, isEnabled, speakNotification]);

  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  return {
    activeReminder,
    dismissReminder,
    lastActivityTime,
  };
}
