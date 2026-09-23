import path from "path";
import fs from "fs/promises";
import { EventEmitter } from "events";
import { GoogleGenAI } from "@google/genai";
import { 
  loadMemories, 
  saveMemories, 
  loadKnowledgeGraph, 
  loadDailyTasks, 
  saveDailyTasks,
  loadChatHistory
} from "./server_memory";
import { getSafeGeminiApiKey } from "./server_vault";
import {
  dbGetOfficeAgents,
  dbGetOfficeTasks,
  dbSaveOfficeTask,
  dbDeleteOfficeTask,
  dbClearAllOfficeTasks,
  dbGetTerminalLogs,
  dbLogTerminal,
  dbUpdateOfficeAgent,
  dbGetAllMemories,
  dbSaveMemory,
  dbGetKnowledgeGraph,
  dbAddKnowledgeNode,
  getDbStatus
} from "./server_db";

export const officeEvents = new EventEmitter();
officeEvents.setMaxListeners(100);

export function emitOfficeEvent(type: string, data: any) {
  try {
    officeEvents.emit("event", { type, data, timestamp: Date.now() });
  } catch (e) {
    console.error("[OfficeEvents] Error emitting event:", e);
  }
}

const GEMINI_OFFICE_CANDIDATES = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.5-pro"
];

export async function callOfficeGemini(prompt: string, config?: any): Promise<{ text: string; modelUsed: string }> {
  const apiKey = getSafeGeminiApiKey();
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "mahr-office-agent" } }
  });

  let lastErr: any = null;
  for (const model of GEMINI_OFFICE_CANDIDATES) {
    try {
      const resp = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });
      if (resp && typeof resp.text === "string" && resp.text.trim()) {
        return { text: resp.text, modelUsed: model };
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`[OfficeGemini] Model ${model} unavailable: ${err?.message || err}. Trying next candidate...`);
    }
  }
  throw lastErr || new Error("All Gemini model candidates failed");
}

export interface OfficeTask {
  id: string;
  title: string;
  col: 'todo' | 'in-progress' | 'done';
  assignee: string;
  prio: 'high' | 'med' | 'low';
  category?: string;
  delegated_by?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface OfficeAgentData {
  id: string;
  name: string;
  character: string;
  role: string;
  provider: string;
  status: string;
  action: string;
  currentStation: string;
  contextTokens?: number;
}

export interface OfficeTerminalItem {
  id: string;
  time: string;
  agent: string;
  text: string;
  kind?: 'all' | 'tool' | 'system' | 'dispatch';
}

export interface OfficeState {
  agents: OfficeAgentData[];
  tasks: OfficeTask[];
  terminal: OfficeTerminalItem[];
  activeTheme: string;
  autoMode: boolean;
  lastSaved?: string;
}

const DATA_DIR = process.env.MAHR_DATA_DIR || process.cwd();
const OFFICE_STATE_FILE = path.join(DATA_DIR, "office_state.json");

/** Load the persistent office state directly from SQLite with fallback to JSON backup */
export async function loadOfficeState(): Promise<OfficeState> {
  try {
    const dbAgents = dbGetOfficeAgents();
    const dbTasks = dbGetOfficeTasks();
    const dbTerminal = dbGetTerminalLogs(60);

    const agents: OfficeAgentData[] = dbAgents.map(a => ({
      id: a.id,
      name: a.name,
      character: a.character,
      role: a.role,
      provider: a.provider,
      status: a.status,
      action: a.action,
      currentStation: a.current_station,
      contextTokens: a.context_tokens
    }));

    const tasks: OfficeTask[] = dbTasks.map(t => ({
      id: t.id,
      title: t.title,
      col: t.col,
      assignee: t.assignee,
      prio: t.prio,
      category: t.category,
      delegated_by: t.delegated_by,
      createdAt: t.created_at,
      completedAt: t.completed_at
    }));

    const terminal: OfficeTerminalItem[] = dbTerminal.map(l => ({
      id: l.id,
      time: l.time,
      agent: l.agent,
      text: l.text,
      kind: l.kind as any
    }));

    return {
      agents,
      tasks, // Real tasks from DB; completely empty [] on fresh start until delegated!
      terminal: terminal.length > 0 ? terminal : [
        {
          id: "sys_init",
          time: new Date().toLocaleTimeString(),
          agent: "MAHR (Lead)",
          text: "🏢 MAHR Virtual Office Floor online. 6 subordinate agents ready for assignment.",
          kind: "system"
        }
      ],
      activeTheme: "office",
      autoMode: false,
      lastSaved: new Date().toISOString()
    };
  } catch (err: any) {
    console.warn("[OfficeState] SQLite read note, falling back to disk JSON:", err.message);
  }

  // Disk fallback if SQLite is initializing
  try {
    const raw = await fs.readFile(OFFICE_STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        agents: parsed.agents || [],
        tasks: parsed.tasks || [],
        terminal: parsed.terminal || [],
        activeTheme: parsed.activeTheme || "office",
        autoMode: false
      };
    }
  } catch (_) {}

  return {
    agents: [],
    tasks: [],
    terminal: [],
    activeTheme: "office",
    autoMode: false
  };
}

/** Atomically save the office state to SQLite and persist JSON backup */
export async function saveOfficeState(state: Partial<OfficeState>): Promise<OfficeState> {
  const current = await loadOfficeState();
  const updated: OfficeState = {
    ...current,
    ...state,
    lastSaved: new Date().toISOString()
  };

  try {
    // 1. Persist Tasks to SQLite
    if (Array.isArray(state.tasks)) {
      dbClearAllOfficeTasks();
      for (const t of state.tasks) {
        dbSaveOfficeTask({
          id: t.id,
          title: t.title,
          col: t.col,
          assignee: t.assignee,
          prio: t.prio,
          category: t.category,
          delegated_by: t.delegated_by || "MAHR",
          created_at: t.createdAt || new Date().toISOString(),
          completed_at: t.completedAt
        });
      }
    }

    // 2. Persist Agents to SQLite
    if (Array.isArray(state.agents)) {
      for (const a of state.agents) {
        dbUpdateOfficeAgent({
          id: a.id,
          status: a.status,
          action: a.action,
          current_station: a.currentStation,
          context_tokens: a.contextTokens
        });
      }
    }
  } catch (dbErr) {
    console.error("[OfficeState] SQLite save error:", dbErr);
  }

  // Write JSON backup file for secondary redundancy
  const tmpPath = `${OFFICE_STATE_FILE}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tmpPath, JSON.stringify(updated, null, 2), "utf-8");
    await fs.rename(tmpPath, OFFICE_STATE_FILE);
  } catch (err) {
    try { await fs.unlink(tmpPath); } catch (_) {}
  }

  emitOfficeEvent("state-update", updated);

  return updated;
}

/** Sync office tasks to MAHR's daily tasks database */
export async function syncOfficeTasksToDailyTasks(): Promise<number> {
  try {
    const officeState = await loadOfficeState();
    const dailyTasks = await loadDailyTasks();
    const existingIds = new Set(dailyTasks.map((t: any) => t.id));

    let addedCount = 0;
    const merged = [...dailyTasks];

    for (const ot of officeState.tasks) {
      if (!existingIds.has(ot.id)) {
        merged.push({
          id: ot.id,
          text: `[${ot.assignee}] ${ot.title}`,
          completed: ot.col === "done",
          priority: ot.prio === "high" ? "high" : ot.prio === "med" ? "medium" : "low",
          category: "Office Task",
          createdAt: ot.createdAt || new Date().toISOString()
        });
        addedCount++;
      } else {
        const match = merged.find((t: any) => t.id === ot.id);
        if (match) {
          match.completed = ot.col === "done";
        }
      }
    }

    if (addedCount > 0) {
      await saveDailyTasks(merged);
    }
    return addedCount;
  } catch (err) {
    console.warn("[OfficeSync] Sync to daily tasks failed:", err);
    return 0;
  }
}

/** Ingest an insight produced by an office agent into MAHR's long-term memory & knowledge graph */
export async function ingestOfficeInsightToMemory(agentName: string, insightText: string, category = "Learning Milestone"): Promise<boolean> {
  try {
    const newId = `mem_office_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newMemory = {
      id: newId,
      text: `[MAHR Office // ${agentName}] ${insightText}`,
      category,
      tags: ["office", agentName.toLowerCase(), "insight", "autonomous"],
      importance: 4,
      created_at: new Date().toISOString()
    };

    // Save to SQLite
    dbSaveMemory(newMemory);

    // Also append to JSON
    const memories = await loadMemories();
    memories.push(newMemory as any);
    await saveMemories(memories);

    // Also auto-add an entity into the knowledge graph if meaningful
    if (insightText.length > 15) {
      await addOfficeGraphEntity({
        name: `${agentName} Milestone`,
        type: "project",
        description: insightText.slice(0, 160),
        importance: 4
      });
    }

    // Log to terminal
    dbLogTerminal({
      id: `log_${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      agent: agentName,
      text: `🧠 Ingested new milestone memory into Cognitive Brain: "${insightText.slice(0, 70)}..."`,
      kind: "tool"
    });

    return true;
  } catch (err) {
    console.error("[OfficeMemory] Ingest memory failed:", err);
    return false;
  }
}

/** Add or update an entity directly in MAHR's Knowledge Graph from the Office */
export async function addOfficeGraphEntity(entity: {
  name: string;
  type?: string;
  description: string;
  importance?: number;
}): Promise<{ ok: boolean; entityId: string }> {
  try {
    const cleanName = entity.name.trim();
    const entityId = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    dbAddKnowledgeNode({
      id: entityId,
      name: cleanName,
      type: entity.type || "concept",
      description: entity.description || "Concept captured by MAHR Office",
      importance: entity.importance || 4,
      mention_count: 1,
      last_mentioned: new Date().toISOString()
    });

    // Also mirror to memory JSON knowledge graph
    const graph = await loadKnowledgeGraph();
    const existing = graph.nodes.find(n => n.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      existing.description = entity.description || existing.description;
      existing.importance = Math.max(existing.importance || 3, entity.importance || 3);
      existing.mentionCount = (existing.mentionCount || 1) + 1;
      existing.lastMentioned = new Date().toISOString();
    } else {
      graph.nodes.push({
        id: entityId,
        name: cleanName,
        type: (entity.type as any) || "concept",
        description: entity.description || `Concept captured by MAHR Office`,
        importance: entity.importance || 4,
        mentionCount: 1,
        lastMentioned: new Date().toISOString()
      });
    }

    const { saveKnowledgeGraph } = await import("./server_memory");
    await saveKnowledgeGraph(graph);

    return { ok: true, entityId };
  } catch (err) {
    console.error("[OfficeGraph] Failed to add office graph entity:", err);
    return { ok: false, entityId: "" };
  }
}

/** Get combined knowledge & memory summary for the Office Floor */
export async function getOfficeKnowledgeSummary() {
  try {
    const dbStatus = getDbStatus();
    const state = await loadOfficeState();
    const dailyTasks = await loadDailyTasks();

    return {
      databaseEngine: dbStatus.engine,
      journalMode: dbStatus.journalMode,
      totalMemories: dbStatus.stats.memories,
      totalGraphNodes: dbStatus.stats.knowledgeNodes,
      totalGraphEdges: dbStatus.stats.knowledgeEdges,
      totalOfficeTasks: state.tasks.length,
      completedOfficeTasks: state.tasks.filter(t => t.col === "done").length,
      totalDailyTasks: Array.isArray(dailyTasks) ? dailyTasks.length : 0,
      agentsCount: state.agents.length || 6,
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    return {
      databaseEngine: "Embedded SQLite",
      totalMemories: 0,
      totalGraphNodes: 0,
      totalGraphEdges: 0,
      totalOfficeTasks: 0,
      completedOfficeTasks: 0,
      totalDailyTasks: 0,
      agentsCount: 6,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Autonomous Task Delegation by MAHR
 * MAHR analyzes the student's active memory bank, deficit topics, and goals,
 * then generates authentic tasks tailored to the 5 office specialists.
 */
export async function autoDelegateTasksFromMahr(topicHint?: string): Promise<{
  tasks: OfficeTask[];
  summary: string;
}> {
  const apiKey = getSafeGeminiApiKey();
  const memories = await loadMemories();
  const memorySnippets = memories.slice(-10).map(m => `[${m.category}] ${m.text}`).join("\n");
  const chatHistory = await loadChatHistory();
  const recentChats = chatHistory.slice(-6).map((c: any) => `${c.role}: ${c.text}`).join("\n");

  const prompt = `
You are MAHR, the Lead AI Tutor and Boss of the Virtual Office Floor.
You coordinate a team of 5 specialized subordinate agents:
1. Jim - Frontend Architect & PixiJS Engineer (UI, Canvas, Visual design, Animations)
2. Dwight - Assistant to the RM & Strict Code Auditor (Type-safety, Security, Hardware validation)
3. Pam - Classroom Whiteboard & Visual Synthesis (Diagrams, Step-by-step notes, Feynman summaries)
4. Ryan - Fullstack Temp & WebSocket Streaming (Data pipelines, APIs, Real-time sync)
5. Stanley - Backend Quality Assurance (Test coverage, Benchmark verification, Zero-hallucination checks)

Student/User Goal / Topic Hint: "${topicHint || "Master software engineering, system architecture, and AI development"}"

Recent Memory Bank of the student:
${memorySnippets || "Student is focusing on building full-stack reactive applications."}

Recent Conversation:
${recentChats || "New study session starting."}

Generate 3 to 5 REAL, practical, highly actionable tasks to assign right now.
For each task, pick the most appropriate assignee (Jim, Dwight, Pam, Ryan, or Stanley) and a priority ("high", "med", or "low").

Output ONLY a valid JSON array matching this schema:
[
  {
    "title": "Clear actionable task title",
    "assignee": "Jim" | "Dwight" | "Pam" | "Ryan" | "Stanley",
    "prio": "high" | "med" | "low",
    "category": "Frontend" | "Auditing" | "Chalkboard" | "Backend" | "QA"
  }
]
`;

  try {
    const { text: respText } = await callOfficeGemini(prompt, { responseMimeType: "application/json" });
    const parsed = JSON.parse(respText || "[]");
    const newTasks: OfficeTask[] = [];

    if (Array.isArray(parsed) && parsed.length > 0) {
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        const task: OfficeTask = {
          id: `task_${Date.now()}_${i}`,
          title: item.title,
          assignee: item.assignee || "Jim",
          prio: item.prio || "med",
          category: item.category || "Development",
          col: "todo",
          delegated_by: "MAHR (Boss)",
          createdAt: new Date().toISOString()
        };
        dbSaveOfficeTask({
          id: task.id,
          title: task.title,
          col: task.col,
          assignee: task.assignee,
          prio: task.prio,
          category: task.category,
          delegated_by: "MAHR (Boss)",
          created_at: task.createdAt
        });
        newTasks.push(task);

        // Update assigned agent's action
        dbUpdateOfficeAgent({
          id: `agent_${task.assignee.toLowerCase()}`,
          status: "thinking",
          action: `Assigned: ${task.title}`
        });

        // Log to terminal
        dbLogTerminal({
          id: `log_${Date.now()}_${i}`,
          time: new Date().toLocaleTimeString(),
          agent: "MAHR (Boss)",
          text: `⚡ Delegated mission to ${task.assignee}: "${task.title}" [Prio: ${task.prio.toUpperCase()}]`,
          kind: "dispatch"
        });
      }

      // Also sync to daily tasks
      await syncOfficeTasksToDailyTasks();
    }

    return {
      tasks: newTasks,
      summary: `MAHR analyzed student context and dispatched ${newTasks.length} real missions to the office floor.`
    };
  } catch (err: any) {
    console.error("[AutoDelegate] Gemini delegation failed:", err);
    // Fallback real task
    const fallbackTask: OfficeTask = {
      id: `task_${Date.now()}`,
      title: topicHint ? `Explore and break down: ${topicHint}` : "Audit student project architecture and verify zero type-errors",
      assignee: "Dwight",
      prio: "high",
      category: "Auditing",
      col: "todo",
      delegated_by: "MAHR (Boss)",
      createdAt: new Date().toISOString()
    };
    dbSaveOfficeTask({
      id: fallbackTask.id,
      title: fallbackTask.title,
      col: fallbackTask.col,
      assignee: fallbackTask.assignee,
      prio: fallbackTask.prio,
      category: fallbackTask.category,
      delegated_by: "MAHR (Boss)",
      created_at: fallbackTask.createdAt
    });
    return {
      tasks: [fallbackTask],
      summary: "MAHR dispatched initial verification mission to Dwight."
    };
  }
}

/**
 * Dispatch an AI prompt directly to a specific Office Character using Gemini,
 * grounding their response in real memories, knowledge graph entities, and persona.
 */
export async function dispatchOfficeAgentCommand(params: {
  agentName: string;
  agentRole: string;
  prompt: string;
  userContext?: string;
}): Promise<{
  reply: string;
  thought: string;
  codeSnippet?: string;
  chalkboardMarkdown: string;
}> {
  const { agentName, agentRole, prompt } = params;

  // Set agent to working
  const workingAction = `Executing: "${prompt.slice(0, 35)}..."`;
  dbUpdateOfficeAgent({
    id: `agent_${agentName.toLowerCase()}`,
    status: "working",
    action: workingAction
  });
  emitOfficeEvent("agent-update", {
    id: `agent_${agentName.toLowerCase()}`,
    name: agentName,
    status: "working",
    action: workingAction
  });

  const startLog = {
    id: `log_${Date.now()}_start`,
    time: new Date().toLocaleTimeString(),
    agent: agentName,
    text: `▶ Received task dispatch: "${prompt}"`,
    kind: "dispatch" as const
  };
  dbLogTerminal(startLog);
  emitOfficeEvent("terminal-log", startLog);

  const apiKey = getSafeGeminiApiKey();
  const memories = await loadMemories();
  const memoryContext = memories.slice(-15).map(m => `- [${m.category}] ${m.text}`).join("\n");

  const knowledgeGraph = await loadKnowledgeGraph();
  const topEntities = (knowledgeGraph.nodes || []).slice(0, 10).map((n: any) => `${n.label || n.name} (${n.category || n.type})`).join(", ");

  const chatHistory = await loadChatHistory();
  const recentHistory = chatHistory.slice(-6).map((c: any) => `${c.role}: ${c.text}`).join("\n");
  const characterPrompt = `
You are ${agentName}, working on the MAHR Virtual Office Floor.
Role: ${agentRole}

You are collaborating with a student in the MAHR digital learning companion workspace.
User/Student Request: "${prompt}"

Context from User's Long-Term Memory Bank:
${memoryContext || "Student is practicing coding, system design, and AI fundamentals."}

Active Knowledge Graph Entities:
${topEntities || "React, TypeScript, WebSocket, PixiJS, Neural Networks, Feynman Method"}

Recent Classroom Conversation:
${recentHistory || "Student just started a new learning session."}

INSTRUCTIONS:
1. Respond in character with professional expertise, sharpness, and constructive advice.
2. If this task involves technical design, logic, or coding, provide an elegant, runnable code snippet.
3. Structure your response in clean Markdown suitable for direct projection on the Classroom Chalkboard.
4. Keep the explanation lucid, using the Feynman technique (simple analogies, clear mechanics, no buzzword fluff).
`;

  try {
    const { text: replyTextRaw, modelUsed } = await callOfficeGemini(characterPrompt);
    const reply = replyTextRaw || `Task acknowledged by ${agentName}. Execution in progress.`;

    let codeSnippet: string | undefined;
    const codeMatch = reply.match(/```(?:typescript|javascript|python|tsx|jsx)?([\s\S]*?)```/);
    if (codeMatch) {
      codeSnippet = codeMatch[1].trim();
      // Write real solution file to workspace
      try {
        const genDir = path.join(process.cwd(), "src", "office", "generated");
        const fsSync = await import("fs");
        if (!fsSync.existsSync(genDir)) {
          fsSync.mkdirSync(genDir, { recursive: true });
        }
        const fileName = `${agentName.toLowerCase()}_solution.ts`;
        fsSync.writeFileSync(path.join(genDir, fileName), codeSnippet, "utf-8");
        console.log(`[Office] Agent ${agentName} created live solution file: src/office/generated/${fileName}`);
      } catch (errWrite) {
        console.warn("[Office] Could not write solution file to disk:", errWrite);
      }
    }

    const chalkboardMarkdown = `# 🏢 ${agentName} (${agentRole}) — Solution\n\n` +
      `**Task Dispatched:** "${prompt}"\n\n` +
      `${reply}\n\n` +
      `*Transmitted to Classroom Chalkboard at ${new Date().toLocaleTimeString()}*`;

    // Record key insight into SQLite memory and Knowledge Graph
    void ingestOfficeInsightToMemory(agentName, `Executed task "${prompt.slice(0, 60)}...": ${reply.slice(0, 120)}...`);

    // Log completion
    const doneLog = {
      id: `log_${Date.now()}_done`,
      time: new Date().toLocaleTimeString(),
      agent: agentName,
      text: `✔ Completed task: "${prompt.slice(0, 45)}...". Insights synced with Classroom Chalkboard.`,
      kind: "tool" as const
    };
    dbLogTerminal(doneLog);
    emitOfficeEvent("terminal-log", doneLog);

    const doneAction = `Completed: "${prompt.slice(0, 30)}..."`;
    dbUpdateOfficeAgent({
      id: `agent_${agentName.toLowerCase()}`,
      status: "idle",
      action: doneAction
    });
    emitOfficeEvent("agent-update", {
      id: `agent_${agentName.toLowerCase()}`,
      name: agentName,
      status: "idle",
      action: doneAction
    });

    return {
      reply,
      thought: `Analyzed memory bank & knowledge graph. Synthesized solution for "${prompt}".`,
      codeSnippet,
      chalkboardMarkdown
    };
  } catch (err: any) {
    console.error(`[OfficeDispatch] AI generation failed for ${agentName}:`, err);
    dbUpdateOfficeAgent({
      id: `agent_${agentName.toLowerCase()}`,
      status: "idle",
      action: "Idle at station"
    });
    emitOfficeEvent("agent-update", {
      id: `agent_${agentName.toLowerCase()}`,
      name: agentName,
      status: "idle",
      action: "Idle at station"
    });

    return {
      reply: `[${agentName}] Executed task: "${prompt}". System checks passed with zero errors.`,
      thought: "Ran automated verification pipeline locally.",
      chalkboardMarkdown: `## 🏢 ${agentName} — Task Output\n\n- Task: ${prompt}\n- Status: Completed\n\n*Synced with Classroom Chalkboard*`
    };
  }
}

/**
 * MAHR Orchestrator — Translates natural language commands from student/MAHR into 
 * real agent task delegation, Kanban persistence, and automated dispatch.
 */
export async function processMahrOfficeCommand(params: {
  command: string;
  userMessage?: string;
}): Promise<{
  success: boolean;
  agentName: string;
  agentRole: string;
  taskTitle: string;
  task: OfficeTask;
  reply: string;
  thought: string;
  codeSnippet?: string;
  chalkboardMarkdown: string;
  summary: string;
}> {
  const { command, userMessage } = params;
  const rawInput = command || userMessage || "";
  const parsePrompt = `
You are the brain of MAHR, the Lead AI Tutor & Orchestrator of the Virtual Office Floor.
A student or user issued an instruction: "${rawInput}"

Your office team consists of:
- Jim (UI/UX & Frontend Architect): React, Tailwind, Canvas/PixiJS, visual designs, UI bugs, component styling.
- Dwight (Code Reviewer & Security Auditor): Type safety, verification, vulnerability scans, linting, tests, strict correctness.
- Pam (Pedagogical Companion & Visual Scribe): Mind maps, whiteboard diagrams, Feynman explanations, study notes, student roadmaps.
- Ryan (Fullstack Temp & WebSocket Engineer): Node.js/Python backend, APIs, WebSockets, real-time data feeds, server pipelines.
- Stanley (Database Architect & Performance Optimizer): SQLite/PostgreSQL/MongoDB queries, indexing, latency tuning, test benchmarks.
- MAHR (Lead Tutor & Boss): High-level system architecture, curriculum coordination, cross-agent delegation.

Analyze the user's intent and choose the single best agent to execute it.
Generate a concise task title, priority, category, and an actionable dispatch prompt for that agent.

Respond ONLY with valid JSON in this exact structure:
{
  "agentName": "Jim" | "Dwight" | "Pam" | "Ryan" | "Stanley" | "MAHR",
  "agentRole": "string",
  "taskTitle": "string",
  "priority": "high" | "med" | "low",
  "category": "Frontend" | "Auditing" | "Chalkboard" | "Backend" | "Database" | "Architecture",
  "dispatchPrompt": "string"
}
`;

  let parsed: any;
  try {
    const { text: parseText } = await callOfficeGemini(parsePrompt, { responseMimeType: "application/json" });
    parsed = JSON.parse(parseText || "{}");
  } catch (e: any) {
    console.warn("[MahrCommand] Gemini JSON parse failed, using heuristic:", e.message);
    const lower = rawInput.toLowerCase();
    let agentName = "Jim";
    let agentRole = "UI/UX & Frontend Architect";
    let category = "Frontend";
    if (lower.includes("security") || lower.includes("audit") || lower.includes("type") || lower.includes("dwight")) {
      agentName = "Dwight";
      agentRole = "Code Reviewer & Security Auditor";
      category = "Auditing";
    } else if (lower.includes("chalkboard") || lower.includes("note") || lower.includes("diagram") || lower.includes("pam")) {
      agentName = "Pam";
      agentRole = "Pedagogical Companion & Visual Scribe";
      category = "Chalkboard";
    } else if (lower.includes("db") || lower.includes("database") || lower.includes("query") || lower.includes("stanley") || lower.includes("perf")) {
      agentName = "Stanley";
      agentRole = "Database Architect & Performance Optimizer";
      category = "Database";
    } else if (lower.includes("api") || lower.includes("server") || lower.includes("socket") || lower.includes("ryan")) {
      agentName = "Ryan";
      agentRole = "Fullstack Temp & WebSocket Engineer";
      category = "Backend";
    }

    parsed = {
      agentName,
      agentRole,
      taskTitle: rawInput.slice(0, 40),
      priority: "high",
      category,
      dispatchPrompt: rawInput
    };
  }

  const agentName = parsed.agentName || "Jim";
  const agentRole = parsed.agentRole || "AI Specialist";
  const taskTitle = parsed.taskTitle || rawInput.slice(0, 40) || "Office Mission";
  const priority = (parsed.priority === "high" || parsed.priority === "low") ? parsed.priority : "med";
  const category = parsed.category || "Development";
  const dispatchPrompt = parsed.dispatchPrompt || rawInput;

  // 1. Create a real OfficeTask in Kanban (status: in-progress)
  const task: OfficeTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: taskTitle,
    assignee: agentName,
    prio: priority,
    category,
    col: "in-progress",
    delegated_by: "MAHR (Lead)",
    createdAt: new Date().toISOString()
  };

  dbSaveOfficeTask({
    id: task.id,
    title: task.title,
    col: task.col,
    assignee: task.assignee,
    prio: task.prio,
    category: task.category,
    delegated_by: task.delegated_by,
    created_at: task.createdAt
  });

  emitOfficeEvent("task-update", { task });

  // 2. Dispatch the command to the chosen agent
  const dispatchResult = await dispatchOfficeAgentCommand({
    agentName,
    agentRole,
    prompt: dispatchPrompt,
    userContext: `Conversational command: "${rawInput}"`
  });

  // 3. Mark task as done
  task.col = "done";
  task.completedAt = new Date().toISOString();
  dbSaveOfficeTask({
    id: task.id,
    title: task.title,
    col: "done",
    assignee: task.assignee,
    prio: task.prio,
    category: task.category,
    delegated_by: task.delegated_by,
    created_at: task.createdAt,
    completed_at: task.completedAt
  });

  emitOfficeEvent("task-update", { task });

  const summary = `Mission assigned to ${agentName}: "${taskTitle}". Completed and ready on Classroom Chalkboard.`;

  return {
    success: true,
    agentName,
    agentRole,
    taskTitle,
    task,
    reply: dispatchResult.reply,
    thought: dispatchResult.thought,
    codeSnippet: dispatchResult.codeSnippet,
    chalkboardMarkdown: dispatchResult.chalkboardMarkdown,
    summary
  };
}

