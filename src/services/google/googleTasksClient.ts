import { GoogleTaskItem, GoogleTaskList } from "./googleWorkspaceTypes";
import { DailyTask } from "../../lib/subagentTypes";
import { getLocalTodayDateString } from "../../lib/taskSchema";

/**
 * Industrial Google Tasks API Client (Layer 1: Data & API Client Layer)
 * Communicates directly with https://tasks.googleapis.com/tasks/v1
 * Supports full CRUD operations, list management, and format normalization.
 */

const GOOGLE_TASKS_BASE_URL = "https://tasks.googleapis.com/tasks/v1";

/**
 * List all task lists for authenticated user (e.g. My Tasks, Work, Personal)
 */
export async function listTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
  if (!accessToken) {
    throw new Error("Google Tasks requires authentication.");
  }

  const res = await fetch(`${GOOGLE_TASKS_BASE_URL}/users/@me/lists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Google Task lists (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title || "Default List",
    updated: item.updated,
  }));
}

/**
 * Create a new task list in Google Tasks
 */
export async function createTaskList(accessToken: string, title: string): Promise<GoogleTaskList> {
  if (!accessToken) {
    throw new Error("Google Tasks requires authentication.");
  }

  const res = await fetch(`${GOOGLE_TASKS_BASE_URL}/users/@me/lists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: title.trim() || "New List",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create Google Task list (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    updated: data.updated,
  };
}

/**
 * Fetch tasks from a specific task list (default: '@default')
 * Supports both signatures: listUserTasks(token, maxResults) and listUserTasks(token, listId, maxResults)
 */
export async function listUserTasks(
  accessToken: string,
  listIdOrMaxResults: string | number = "@default",
  maxResultsParam: number = 50,
  showCompleted: boolean = true
): Promise<GoogleTaskItem[]> {
  if (!accessToken) {
    throw new Error("Google Tasks requires user authentication.");
  }

  const listId = typeof listIdOrMaxResults === "string" ? listIdOrMaxResults : "@default";
  const maxResults = typeof listIdOrMaxResults === "number" ? listIdOrMaxResults : maxResultsParam;

  const encodedListId = encodeURIComponent(listId || "@default");
  const url = `${GOOGLE_TASKS_BASE_URL}/lists/${encodedListId}/tasks?maxResults=${maxResults}&showCompleted=${showCompleted}&showHidden=${showCompleted}`;

  const listRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!listRes.ok) {
    const errorText = await listRes.text();
    throw new Error(`Google Tasks request failed (${listRes.status}): ${errorText}`);
  }

  const data = await listRes.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title || "Untitled Task",
    notes: item.notes || "",
    due: item.due,
    status: (item.status === "completed" ? "completed" : "needsAction") as "completed" | "needsAction",
    updated: item.updated,
  }));
}

/**
 * Create a new task in Google Tasks
 */
export async function createUserTask(
  accessToken: string,
  title: string,
  notes?: string,
  due?: string,
  listId: string = "@default"
): Promise<GoogleTaskItem> {
  if (!accessToken) {
    throw new Error("Google Tasks creation requires user authentication.");
  }

  const encodedListId = encodeURIComponent(listId || "@default");
  const payload: any = {
    title: title.trim() || "New Task",
    notes: notes || "Created by MAHR AI Personal Assistant",
  };

  // Google Tasks API expects RFC 3339 timestamp (e.g. 2026-10-02T00:00:00.000Z)
  if (due) {
    try {
      const dateObj = new Date(due);
      if (!isNaN(dateObj.getTime())) {
        payload.due = dateObj.toISOString();
      }
    } catch {
      // Ignore invalid date format
    }
  }

  const res = await fetch(`${GOOGLE_TASKS_BASE_URL}/lists/${encodedListId}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create task (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    due: data.due,
    status: data.status,
    updated: data.updated,
  };
}

/**
 * Update an existing task in Google Tasks (PATCH)
 * Handles toggle complete/incomplete, title update, notes, or due date.
 */
export async function updateUserTask(
  accessToken: string,
  taskId: string,
  updates: Partial<{
    title: string;
    notes: string;
    status: "needsAction" | "completed";
    due?: string;
  }>,
  listId: string = "@default"
): Promise<GoogleTaskItem> {
  if (!accessToken) {
    throw new Error("Google Tasks update requires user authentication.");
  }

  const encodedListId = encodeURIComponent(listId || "@default");
  const encodedTaskId = encodeURIComponent(taskId);

  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.due !== undefined) {
    if (updates.due) {
      try {
        const d = new Date(updates.due);
        if (!isNaN(d.getTime())) payload.due = d.toISOString();
      } catch {
        // Skip invalid date
      }
    } else {
      payload.due = null;
    }
  }

  const res = await fetch(`${GOOGLE_TASKS_BASE_URL}/lists/${encodedListId}/tasks/${encodedTaskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update task (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    due: data.due,
    status: data.status,
    updated: data.updated,
  };
}

/**
 * Delete a task from Google Tasks (DELETE)
 */
export async function deleteUserTask(
  accessToken: string,
  taskId: string,
  listId: string = "@default"
): Promise<void> {
  if (!accessToken) {
    throw new Error("Google Tasks deletion requires user authentication.");
  }

  const encodedListId = encodeURIComponent(listId || "@default");
  const encodedTaskId = encodeURIComponent(taskId);

  const res = await fetch(`${GOOGLE_TASKS_BASE_URL}/lists/${encodedListId}/tasks/${encodedTaskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const errorText = await res.text();
    throw new Error(`Failed to delete Google task (${res.status}): ${errorText}`);
  }
}

/**
 * Clear all completed tasks from a list
 */
export async function clearCompletedTasks(
  accessToken: string,
  listId: string = "@default"
): Promise<void> {
  if (!accessToken) {
    throw new Error("Google Tasks operation requires user authentication.");
  }

  const encodedListId = encodeURIComponent(listId || "@default");
  const res = await fetch(`${GOOGLE_TASKS_BASE_URL}/lists/${encodedListId}/clear`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to clear completed tasks (${res.status}): ${errorText}`);
  }
}

/**
 * Normalizes a GoogleTaskItem into MAHR's standard DailyTask schema.
 */
export function googleTaskToDailyTask(item: GoogleTaskItem, fallbackDate?: string): DailyTask {
  const today = fallbackDate || getLocalTodayDateString();
  const completed = item.status === "completed";

  let date = today;
  if (item.due) {
    try {
      date = item.due.split("T")[0];
    } catch {
      date = today;
    }
  }

  // Parse priority if user put [High] or [Urgent] in notes or title
  let priority: DailyTask["priority"] = "medium";
  const contentLower = `${item.title} ${item.notes || ""}`.toLowerCase();
  if (contentLower.includes("[high]") || contentLower.includes("[urgent]") || contentLower.includes("!high")) {
    priority = "high";
  } else if (contentLower.includes("[low]") || contentLower.includes("!low")) {
    priority = "low";
  }

  // Parse category or default to Google Task / Study
  let category = "Google Task";
  if (item.title.startsWith("[")) {
    const closeBracket = item.title.indexOf("]");
    if (closeBracket > 1) {
      category = item.title.substring(1, closeBracket);
    }
  }

  return {
    id: item.id,
    title: item.title,
    text: item.title,
    timeBlock: "Scheduled Task",
    priority,
    category,
    completed,
    date,
    reminder: true,
    notes: item.notes || "",
    createdAt: item.updated || new Date().toISOString(),
  };
}
