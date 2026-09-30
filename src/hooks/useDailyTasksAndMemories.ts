import { useState, useEffect, useMemo } from "react";
import { Memory, MemoryCategory } from "../lib/memoryTypes";
import { DailyTask, SubAgent, PRESET_SUBAGENTS } from "../lib/subagentTypes";
import { dbGet, dbSet, getSkillsFromDB } from "../lib/db";
import { 
  loadDailyTasksFromStorage, 
  saveDailyTasksToStorage, 
  normalizeDailyTask, 
  getLocalTodayDateString 
} from "../lib/taskSchema";

export function useDailyTasksAndMemories(isStorageInitialized: boolean) {
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [deletedMemoryIds, setDeletedMemoryIds] = useState<string[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>("gemini-3.1-flash-lite");
  const [activeSubAgent, setActiveSubAgent] = useState<SubAgent>(PRESET_SUBAGENTS[0]);
  const [skills, setSkills] = useState<any[]>([]);
  const [activeSkill, setActiveSkill] = useState<any | null>(null);

  const todayStr = useMemo(() => getLocalTodayDateString(), []);

  // Filter tasks for current date (including active rollover tasks)
  const todayDailyTasks = useMemo(() => {
    return dailyTasks.filter(
      (t) => t.date === todayStr || (!t.completed && (!t.date || t.date <= todayStr))
    );
  }, [dailyTasks, todayStr]);

  const todayTasksCount = todayDailyTasks.length;

  // Load initial tasks & skills from DB
  useEffect(() => {
    if (!isStorageInitialized) return;

    const loadData = async () => {
      try {
        const savedTasks = await loadDailyTasksFromStorage();
        if (savedTasks && savedTasks.length > 0) {
          setDailyTasks(savedTasks);
        } else {
          const today = getLocalTodayDateString();
          const defaultTasks: DailyTask[] = [
            {
              id: "1",
              title: "Review Feynman Technique Study Pad Notes",
              completed: false,
              priority: "high",
              timeBlock: "08:00 AM",
              category: "study",
              date: today,
              reminder: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              title: "Practice Digital Logic Circuit Simulation",
              completed: false,
              priority: "medium",
              timeBlock: "02:00 PM",
              category: "coding",
              date: today,
              reminder: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: "3",
              title: "Solve Active Recall Flashcards & Quiz",
              completed: false,
              priority: "low",
              timeBlock: "07:00 PM",
              category: "study",
              date: today,
              reminder: false,
              createdAt: new Date().toISOString(),
            },
          ];
          setDailyTasks(defaultTasks);
          await saveDailyTasksToStorage(defaultTasks);
        }

        const loadedSkills = await getSkillsFromDB();
        setSkills(loadedSkills || []);
      } catch (err) {
        console.error("[useDailyTasksAndMemories] Error loading initial tasks/skills:", err);
      }
    };

    loadData();
  }, [isStorageInitialized]);

  // Sync daily tasks to DB on modification
  const saveDailyTasksToDB = async (updated: DailyTask[]) => {
    setDailyTasks(updated);
    if (isStorageInitialized) {
      await saveDailyTasksToStorage(updated);
    }
  };

  const handleCreateDailyTask = async (
    title: string,
    priority: "low" | "medium" | "high",
    timeBlock: string = "Morning Focus"
  ) => {
    if (!title.trim()) return;
    const today = getLocalTodayDateString();
    const newTask = normalizeDailyTask({
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      priority,
      timeBlock,
      category: "study",
      date: today,
      reminder: true,
      createdAt: new Date().toISOString(),
    }, today);
    const updated = [newTask, ...dailyTasks];
    await saveDailyTasksToDB(updated);
  };

  const handleToggleDailyTask = async (id: string) => {
    const updated = dailyTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    await saveDailyTasksToDB(updated);
  };

  const handleDeleteDailyTask = async (id: string) => {
    const updated = dailyTasks.filter((t) => t.id !== id);
    await saveDailyTasksToDB(updated);
  };

  const handleSaveMemory = async (newMem: Partial<Memory>) => {
    const now = new Date().toISOString();
    const mem: Memory = {
      id: Date.now().toString(),
      text: newMem.text || "",
      category: (newMem.category as MemoryCategory) || "goal",
      createdAt: now,
      updatedAt: now,
    };
    const updated = [mem, ...memories];
    setMemories(updated);
    if (isStorageInitialized) {
      await dbSet("myraa_memories", updated);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    setDeletedMemoryIds([...deletedMemoryIds, id]);
    if (isStorageInitialized) {
      await dbSet("myraa_memories", updated);
    }
  };

  return {
    dailyTasks,
    setDailyTasks,
    todayDailyTasks,
    todayTasksCount,
    handleCreateDailyTask,
    handleToggleDailyTask,
    handleDeleteDailyTask,
    memories,
    setMemories,
    handleSaveMemory,
    handleDeleteMemory,
    deletedMemoryIds,
    activeModelId,
    setActiveModelId,
    activeSubAgent,
    setActiveSubAgent,
    skills,
    activeSkill,
    setActiveSkill,
  };
}
