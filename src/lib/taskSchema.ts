import { DailyTask } from "./subagentTypes";
import { dbGet, dbSet } from "./db";

export const DAILY_TASKS_STORAGE_KEY = "myraa_daily_tasks";

/**
 * Returns today's date string in ISO YYYY-MM-DD format based on local time.
 */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes any raw task object from IndexedDB, WebSocket, Virtual Office, or REST API
 * into the strict DailyTask schema expected by DailyTaskManager and App.tsx.
 */
export function normalizeDailyTask(raw: any, fallbackDate?: string): DailyTask {
  const today = fallbackDate || getLocalTodayDateString();
  if (!raw || typeof raw !== "object") {
    return {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: "Untitled Task",
      text: "Untitled Task",
      timeBlock: "Morning Focus",
      priority: "medium",
      category: "study",
      completed: false,
      date: today,
      reminder: true,
      notes: "",
      createdAt: new Date().toISOString()
    };
  }

  const id = String(raw.id || raw._id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  // Resilient title extraction across all formats (title, text, task, name, description)
  const title = (
    raw.title ||
    raw.text ||
    raw.task ||
    raw.name ||
    raw.description ||
    "Untitled Task"
  ).trim();

  // Determine completion state across kanban/backend/local formats
  const completed = Boolean(
    raw.completed === true ||
    raw.col === "done" ||
    raw.status === "completed" ||
    raw.status === "done"
  );

  // Determine priority
  let priority: DailyTask["priority"] = "medium";
  const rawPrio = String(raw.priority || raw.prio || "").toLowerCase();
  if (rawPrio === "high" || rawPrio === "urgent") priority = "high";
  else if (rawPrio === "low") priority = "low";
  else priority = "medium";

  // Determine category
  let category = raw.category || "study";
  if (!raw.category && title.startsWith("[")) {
    category = "Office Task";
  }

  // Determine timeBlock
  let timeBlock = raw.timeBlock;
  if (!timeBlock) {
    if (category === "Office Task") {
      timeBlock = "Office Sprint";
    } else {
      timeBlock = "Morning Focus";
    }
  }

  // Determine schedule date:
  // If task is not completed and either has no date OR has an older past date,
  // roll it over to today so it seamlessly appears in today's active schedule!
  let date = raw.date;
  if (!date) {
    date = today;
  } else if (!completed && date < today) {
    date = today;
  }

  return {
    id,
    title,
    text: title,
    timeBlock,
    priority,
    category,
    completed,
    date,
    reminder: raw.reminder !== undefined ? Boolean(raw.reminder) : true,
    notes: raw.notes || raw.desc || "",
    createdAt: raw.createdAt || new Date().toISOString()
  };
}

/**
 * Normalizes any array or payload object (e.g. { tasks: [...] }) into a clean DailyTask[].
 */
export function normalizeDailyTaskList(rawInput: any, fallbackDate?: string): DailyTask[] {
  const today = fallbackDate || getLocalTodayDateString();
  let list: any[] = [];

  if (Array.isArray(rawInput)) {
    list = rawInput;
  } else if (rawInput && typeof rawInput === "object" && Array.isArray(rawInput.tasks)) {
    list = rawInput.tasks;
  } else if (rawInput && typeof rawInput === "object" && Array.isArray(rawInput.data)) {
    list = rawInput.data;
  }

  return list.map((item) => normalizeDailyTask(item, today));
}

/**
 * Loads tasks from IndexedDB with schema normalization and fallback parsing.
 */
export async function loadDailyTasksFromStorage(): Promise<DailyTask[]> {
  try {
    const raw = await dbGet(DAILY_TASKS_STORAGE_KEY);
    if (!raw) return [];
    return normalizeDailyTaskList(raw);
  } catch (err) {
    console.warn("[TaskSchema] Failed to read daily tasks from IndexedDB:", err);
    return [];
  }
}

/**
 * Saves normalized tasks to IndexedDB.
 */
export async function saveDailyTasksToStorage(tasks: DailyTask[]): Promise<void> {
  try {
    const normalized = normalizeDailyTaskList(tasks);
    await dbSet(DAILY_TASKS_STORAGE_KEY, normalized);
  } catch (err) {
    console.warn("[TaskSchema] Failed to write daily tasks to IndexedDB:", err);
  }
}
