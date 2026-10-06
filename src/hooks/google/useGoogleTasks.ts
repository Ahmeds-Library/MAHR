import { useState, useEffect, useCallback, useRef } from "react";
import { DailyTask } from "../../lib/subagentTypes";
import { GoogleTaskList, GoogleTaskItem } from "../../services/google/googleWorkspaceTypes";
import {
  listTaskLists,
  listUserTasks,
  createUserTask,
  updateUserTask,
  deleteUserTask,
  clearCompletedTasks,
  createTaskList as apiCreateTaskList,
  googleTaskToDailyTask,
} from "../../services/google/googleTasksClient";
import { useGoogleWorkspace } from "./useGoogleWorkspace";
import { getLocalTodayDateString } from "../../lib/taskSchema";

export interface GoogleTasksState {
  tasks: DailyTask[];
  taskLists: GoogleTaskList[];
  activeListId: string;
  isGoogleConnected: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  userEmail: string | null;
  userName: string | null;
  lastSyncedAt: string | null;
  addTask: (taskData: Omit<DailyTask, "id" | "createdAt">) => Promise<DailyTask>;
  toggleTask: (id: string) => Promise<void>;
  updateTask: (task: DailyTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  refresh: () => Promise<void>;
  switchTaskList: (listId: string) => Promise<void>;
  createTaskList: (title: string) => Promise<GoogleTaskList | null>;
  connectGoogle: () => Promise<string | null>;
}

/**
 * 100% Pure Google Tasks Hook (Layer 2: Business Logic & State)
 * No local offline mock creation — every CRUD operation communicates
 * directly with Google Tasks API to guarantee 100% real-time cloud sync.
 */
export function useGoogleTasks(): GoogleTasksState {
  const { user, token, isAuthenticated, signIn } = useGoogleWorkspace();

  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([
    { id: "@default", title: "My Tasks" }
  ]);
  const [activeListId, setActiveListId] = useState<string>("@default");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const lastLoadedSessionRef = useRef<string | null>(null);

  /**
   * Load tasks directly from Google Tasks API
   */
  const loadTasks = useCallback(
    async (accessToken: string | null, listId: string = "@default") => {
      if (!accessToken) {
        setTasks([]);
        setIsLoading(false);
        setIsSyncing(false);
        return;
      }

      const todayStr = getLocalTodayDateString();
      setIsSyncing(true);
      setError(null);

      try {
        // 1. Fetch available Google Task lists
        try {
          const lists = await listTaskLists(accessToken);
          if (lists && lists.length > 0) {
            setTaskLists(lists);
          }
        } catch (listErr: any) {
          console.warn("[useGoogleTasks] Task lists fetch note:", listErr);
        }

        // 2. Fetch tasks for selected list directly from Google Tasks API
        const googleItems: GoogleTaskItem[] = await listUserTasks(accessToken, listId, 100, true);
        const convertedTasks: DailyTask[] = googleItems.map((item) =>
          googleTaskToDailyTask(item, todayStr)
        );

        setTasks(convertedTasks);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (apiErr: any) {
        console.error("[useGoogleTasks] Direct Google Tasks API sync failed:", apiErr);
        setError(apiErr?.message || "Could not sync with Google Tasks.");
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Watch authentication state: when user logs in with Google,
   * load live Google tasks; when logged out, clear tasks.
   */
  useEffect(() => {
    const currentUid = user?.uid || null;
    const currentToken = token || null;
    const sessionKey = `${currentUid || "unauth"}_${currentToken ? "active" : "none"}_${activeListId}`;

    if (sessionKey !== lastLoadedSessionRef.current) {
      lastLoadedSessionRef.current = sessionKey;

      if (currentUid && currentToken) {
        setIsLoading(true);
        loadTasks(currentToken, activeListId);
      } else {
        setTasks([]);
        setIsLoading(false);
      }
    }
  }, [user, token, activeListId, loadTasks]);

  /**
   * Create a new task directly on Google Tasks API (POST)
   */
  const addTask = useCallback(
    async (taskData: Omit<DailyTask, "id" | "createdAt">): Promise<DailyTask> => {
      if (!token) {
        setError("Please connect your Google Account to create tasks.");
        throw new Error("Authentication required for Google Tasks.");
      }

      const todayStr = getLocalTodayDateString();
      const tempId = `temp_${Date.now()}`;
      const optimisticTask: DailyTask = {
        ...taskData,
        id: tempId,
        createdAt: new Date().toISOString(),
      };

      // Optimistic preview
      setTasks((prev) => [optimisticTask, ...prev]);

      try {
        const createdGoogleItem = await createUserTask(
          token,
          optimisticTask.title,
          optimisticTask.notes,
          optimisticTask.date ? new Date(optimisticTask.date).toISOString() : undefined,
          activeListId
        );

        const realTask = googleTaskToDailyTask(createdGoogleItem, todayStr);
        const finalizedTask: DailyTask = {
          ...realTask,
          priority: optimisticTask.priority,
          category: optimisticTask.category,
          timeBlock: optimisticTask.timeBlock,
        };

        setTasks((prev) => prev.map((t) => (t.id === tempId ? finalizedTask : t)));
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        return finalizedTask;
      } catch (err: any) {
        console.error("[useGoogleTasks] Create task on Google Tasks API failed:", err);
        // Rollback optimistic item
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        setError("Failed to create task on Google Tasks. Please check your connection.");
        throw err;
      }
    },
    [token, activeListId]
  );

  /**
   * Toggle task completion status directly on Google Tasks API (PATCH)
   */
  const toggleTask = useCallback(
    async (id: string) => {
      if (!token) {
        setError("Please connect your Google Account to update tasks.");
        return;
      }

      const target = tasks.find((t) => t.id === id);
      if (!target) return;

      const nextCompleted = !target.completed;
      const nextStatus = nextCompleted ? "completed" : "needsAction";

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
      );

      try {
        await updateUserTask(token, id, { status: nextStatus }, activeListId);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err: any) {
        console.error("[useGoogleTasks] Toggle Google Task failed:", err);
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: !nextCompleted } : t))
        );
        setError("Failed to sync task status with Google Tasks.");
      }
    },
    [tasks, token, activeListId]
  );

  /**
   * Update task details (title, notes, due date) directly on Google Tasks API (PATCH)
   */
  const updateTask = useCallback(
    async (updatedTask: DailyTask) => {
      if (!token) {
        setError("Please connect your Google Account to update tasks.");
        return;
      }

      const prevTask = tasks.find((t) => t.id === updatedTask.id);

      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));

      try {
        await updateUserTask(
          token,
          updatedTask.id,
          {
            title: updatedTask.title,
            notes: updatedTask.notes,
            status: updatedTask.completed ? "completed" : "needsAction",
            due: updatedTask.date ? new Date(updatedTask.date).toISOString() : undefined,
          },
          activeListId
        );
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err: any) {
        console.error("[useGoogleTasks] Update Google Task failed:", err);
        if (prevTask) {
          setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? prevTask : t)));
        }
        setError("Failed to update task on Google Tasks.");
      }
    },
    [tasks, token, activeListId]
  );

  /**
   * Delete task directly from Google Tasks API (DELETE)
   */
  const deleteTask = useCallback(
    async (id: string) => {
      if (!token) {
        setError("Please connect your Google Account to delete tasks.");
        return;
      }

      const removedTask = tasks.find((t) => t.id === id);

      // Optimistic delete
      setTasks((prev) => prev.filter((t) => t.id !== id));

      try {
        await deleteUserTask(token, id, activeListId);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err: any) {
        console.error("[useGoogleTasks] Delete Google Task failed:", err);
        if (removedTask) {
          setTasks((prev) => [removedTask, ...prev]);
        }
        setError("Failed to delete task from Google Tasks.");
      }
    },
    [tasks, token, activeListId]
  );

  /**
   * Clear all completed tasks directly on Google Tasks API (POST /lists/{id}/clear)
   */
  const clearCompleted = useCallback(async () => {
    if (!token) return;

    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => !t.completed));

    try {
      await clearCompletedTasks(token, activeListId);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      console.error("[useGoogleTasks] Clear completed Google Tasks failed:", err);
      setTasks(previousTasks);
      setError("Failed to clear completed tasks in Google Tasks.");
    }
  }, [tasks, token, activeListId]);

  /**
   * Manual refresh to fetch latest state directly from Google Tasks API
   */
  const refresh = useCallback(async () => {
    if (token) {
      await loadTasks(token, activeListId);
    }
  }, [token, activeListId, loadTasks]);

  /**
   * Switch active Google Tasks list
   */
  const switchTaskList = useCallback(
    async (listId: string) => {
      setActiveListId(listId);
      if (token) {
        await loadTasks(token, listId);
      }
    },
    [token, loadTasks]
  );

  /**
   * Create a new task list directly on Google Tasks API
   */
  const createTaskList = useCallback(
    async (title: string): Promise<GoogleTaskList | null> => {
      if (!token) {
        setError("Please connect your Google Account to create task lists.");
        return null;
      }

      try {
        setIsSyncing(true);
        const newList = await apiCreateTaskList(token, title);
        setTaskLists((prev) => [...prev, newList]);
        setActiveListId(newList.id);
        await loadTasks(token, newList.id);
        return newList;
      } catch (err: any) {
        console.error("[useGoogleTasks] Create list failed:", err);
        setError("Failed to create list on Google Tasks.");
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [token, loadTasks]
  );

  return {
    tasks,
    taskLists,
    activeListId,
    isGoogleConnected: Boolean(isAuthenticated && token),
    isLoading,
    isSyncing,
    error,
    userEmail: user?.email || null,
    userName: user?.displayName || user?.email?.split("@")[0] || null,
    lastSyncedAt,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    clearCompleted,
    refresh,
    switchTaskList,
    createTaskList,
    connectGoogle: signIn,
  };
}
