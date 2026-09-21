import { useState, useEffect } from "react";
import { Memory, MemoryCategory } from "../lib/memoryTypes";
import { DailyTask, SubAgent, PRESET_SUBAGENTS } from "../lib/subagentTypes";
import { dbGet, dbSet, getSkillsFromDB } from "../lib/db";

export function useDailyTasksAndMemories(isStorageInitialized: boolean) {
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [deletedMemoryIds, setDeletedMemoryIds] = useState<string[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>("gemini-3.1-flash-lite");
  const [activeSubAgent, setActiveSubAgent] = useState<SubAgent>(PRESET_SUBAGENTS[0]);
  const [skills, setSkills] = useState<any[]>([]);
  const [activeSkill, setActiveSkill] = useState<any | null>(null);

  // Load initial tasks & skills from DB
  useEffect(() => {
    if (!isStorageInitialized) return;

    const loadData = async () => {
      try {
        const savedTasks = await dbGet("myraa_daily_tasks");
        if (savedTasks && Array.isArray(savedTasks)) {
          setDailyTasks(savedTasks);
        } else {
          const today = new Date().toISOString().split("T")[0];
          setDailyTasks([
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
          ]);
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
      await dbSet("myraa_daily_tasks", updated);
    }
  };

  const handleCreateDailyTask = async (
    title: string,
    priority: "low" | "medium" | "high",
    timeBlock: string = "Morning Focus"
  ) => {
    if (!title.trim()) return;
    const newTask: DailyTask = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      priority,
      timeBlock,
      category: "study",
      date: new Date().toISOString().split("T")[0],
      reminder: true,
      createdAt: new Date().toISOString(),
    };
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
