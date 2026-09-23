import fs from "fs/promises";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { Memory, MemoryTransaction } from "./src/lib/memoryTypes";

const DATA_DIR = process.env.MAHR_DATA_DIR || process.cwd();
const MEMORY_FILE = path.join(DATA_DIR, "memories.json");
const CHAT_HISTORY_FILE = path.join(DATA_DIR, "server_chat_history.json");
const DELETED_MEMORIES_FILE = path.join(DATA_DIR, "deleted_memories.json");

// Sequential write queue to prevent race conditions and concurrent write file corruption
const fileWriteQueues = new Map<string, Promise<any>>();

function enqueueFileWrite<T>(filePath: string, writeFn: () => Promise<T>): Promise<T> {
  const currentQueue = fileWriteQueues.get(filePath) || Promise.resolve();
  const nextQueue = currentQueue.then(writeFn, writeFn);
  fileWriteQueues.set(filePath, nextQueue);
  return nextQueue;
}

/**
 * Safely writes content atomically to disk using a unique temporary file and fs.rename,
 * serialized via a write queue to completely prevent race conditions and partial reads.
 */
async function safeWriteFileAtomic(filePath: string, data: any): Promise<void> {
  return enqueueFileWrite(filePath, async () => {
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    try {
      const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      await fs.writeFile(tmpPath, content, "utf-8");
      await fs.rename(tmpPath, filePath);
    } catch (err) {
      console.error(`[FileIO] Atomic write failed for ${path.basename(filePath)}:`, err);
      try { await fs.unlink(tmpPath); } catch (_) {}
    }
  });
}

/**
 * Resilient JSON parser that handles valid JSON, bracket/brace recovery for corrupted/concatenated files,
 * and falls back safely to the specified default value without throwing.
 */
function parseJsonWithRecovery<T>(rawData: string | undefined | null, fallback: T): T {
  if (!rawData || !rawData.trim()) return fallback;
  const trimmed = rawData.trim();

  // Fast path: standard JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    return parsed as T;
  } catch (err: any) {
    // Array bracket recovery for concatenated JSON, trailing characters, or partial multi-writes
    if (Array.isArray(fallback) || trimmed.includes("[")) {
      const firstBracket = trimmed.indexOf("[");
      const lastBracket = trimmed.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        try {
          const slice = trimmed.substring(firstBracket, lastBracket + 1);
          const recovered = JSON.parse(slice);
          if (Array.isArray(recovered)) {
            return recovered as unknown as T;
          }
        } catch (_) {}
      }
    }

    // Object brace recovery
    if (!Array.isArray(fallback) && (typeof fallback === "object" || trimmed.includes("{"))) {
      const firstBrace = trimmed.indexOf("{");
      const lastBrace = trimmed.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          const slice = trimmed.substring(firstBrace, lastBrace + 1);
          const recovered = JSON.parse(slice);
          if (recovered && typeof recovered === "object") {
            return recovered as unknown as T;
          }
        } catch (_) {}
      }
    }

    return fallback;
  }
}

// Safe file operations with atomic writes and recovery for Chat History
export async function loadChatHistory(): Promise<any[]> {
  try {
    const data = await fs.readFile(CHAT_HISTORY_FILE, "utf-8");
    const parsed = parseJsonWithRecovery<any[]>(data, []);
    if (!Array.isArray(parsed)) {
      await safeWriteFileAtomic(CHAT_HISTORY_FILE, []);
      return [];
    }
    return parsed;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    try {
      await safeWriteFileAtomic(CHAT_HISTORY_FILE, []);
    } catch (_) {}
    return [];
  }
}

export async function saveChatHistory(history: any[]): Promise<void> {
  try {
    if (!Array.isArray(history)) {
      return;
    }
    const cleanHistory = history.filter((item) => item && typeof item === "object");
    await safeWriteFileAtomic(CHAT_HISTORY_FILE, cleanHistory);
  } catch (error) {
    console.error("[ChatHistory] Error writing chat history file:", error);
  }
}

// Safe file operations with atomic writes and recovery for Memories
export async function loadMemories(): Promise<Memory[]> {
  try {
    const data = await fs.readFile(MEMORY_FILE, "utf-8");
    const parsed = parseJsonWithRecovery<Memory[]>(data, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    try {
      await safeWriteFileAtomic(MEMORY_FILE, []);
    } catch (_) {}
    return [];
  }
}

export async function saveMemories(memories: Memory[]): Promise<void> {
  try {
    if (!Array.isArray(memories)) return;
    await safeWriteFileAtomic(MEMORY_FILE, memories);

    // Mirror to high-performance SQLite database
    try {
      const { dbSaveMemory } = await import("./server_db");
      for (const m of memories) {
        dbSaveMemory({
          id: m.id,
          text: m.text,
          category: m.category || "general",
          tags: m.tags || [],
          importance: (m as any).importance || 3,
          created_at: m.createdAt || new Date().toISOString(),
          updated_at: m.updatedAt || new Date().toISOString(),
          embedding: (m as any).embedding
        });
      }
    } catch (_) {}
  } catch (error) {
    console.error("[Memory] Error writing memory file:", error);
  }
}

export async function loadDeletedMemoryIds(): Promise<string[]> {
  try {
    const data = await fs.readFile(DELETED_MEMORIES_FILE, "utf-8");
    const parsed = parseJsonWithRecovery<string[]>(data, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    try {
      await safeWriteFileAtomic(DELETED_MEMORIES_FILE, []);
    } catch (_) {}
    return [];
  }
}

const DAILY_TASKS_FILE = path.join(DATA_DIR, "daily_tasks.json");

export async function loadDailyTasks(): Promise<any[]> {
  try {
    const data = await fs.readFile(DAILY_TASKS_FILE, "utf-8");
    const parsed = parseJsonWithRecovery<any[]>(data, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    try {
      await safeWriteFileAtomic(DAILY_TASKS_FILE, []);
    } catch (_) {}
    return [];
  }
}

export async function saveDailyTasks(tasks: any[]): Promise<void> {
  try {
    if (!Array.isArray(tasks)) return;
    await safeWriteFileAtomic(DAILY_TASKS_FILE, tasks);
  } catch (error) {
    console.error("[DailyTasks] Error saving daily tasks:", error);
  }
}

export async function saveDeletedMemoryIds(ids: string[]): Promise<void> {
  try {
    if (!Array.isArray(ids)) return;
    await safeWriteFileAtomic(DELETED_MEMORIES_FILE, ids);
  } catch (error) {
    console.error("[DeletedMemories] Error writing deleted memories file:", error);
  }
}

// Format memory core to system instruction injections
export function formatSystemInstructionsWithMemories(baseInstruction: string, memories: Memory[]): string {
  if (memories.length === 0) {
    return baseInstruction + 
      "\n\n" +
      "=== MYRAA MEMORY CORE ===\n" +
      "You do not possess any historic recollections of this companion yet. " +
      "As you speak, pay deep attention to who they are, their projects, relationships, and habits so you naturally grow closer over time.\n" +
      "=========================\n";
  }

  // Group by category
  const grouped: Record<string, string[]> = {};
  memories.forEach((m) => {
    grouped[m.category] = grouped[m.category] || [];
    grouped[m.category].push(m.text);
  });

  let memoryBlock = 
    "\n\n" +
    "=== MYRAA PERSISTENT MEMORY CORE (RECOLLECTIONS) ===\n" +
    "You have spoken with this user for a long duration. Below are your persistent recollections of who they are.\n" +
    "CRITICAL BRAND AND COGNITIVE PRINCIPLES:\n" +
    "- INTEGRATE MEMORIES INSTINCTIVELY: Always make conversational references feel completely smooth, natural, and human. NEVER say 'According to my memory files...', 'My recollection database indicates...', or 'As you told me on June 12th...'. Instead, speak of these details casually and supportively as a true friend would (e.g. 'Oh, since you're working on that website project...', 'I hope you're keeping up with your YouTube channel goals too!').\n" +
    "- COMPANIONSHIP DEPTH: Allow your witty and responsive personality to adapt with empathy, based on their goals, life events, emotional milestones, and preferences.\n\n" +
    "CURRENT PERSISTENT KNOWLEDGE CARD:\n";

  const categoriesOrdered = [
    { key: "identity", label: "Identity (Name, nick, profession, background)" },
    { key: "preference", label: "Preferences & Tastes (Likes, dislikes, games, movies)" },
    { key: "goal", label: "Active Goals & Aspirations" },
    { key: "project", label: "Ongoing Projects & Ecosystems" },
    { key: "relationship", label: "Key People & Relationships mentioned" },
    { key: "emotional", label: "Emotional Highlights & Core Milestones" },
    { key: "behavior", label: "Observed Traits & Behavioral Tendencies" },
    { key: "simulation", label: "Simulation Metadata (Custom 3D, physics, downloaded, or generated simulations)" },
  ];

  categoriesOrdered.forEach((cat) => {
    const list = grouped[cat.key] || [];
    if (list.length > 0) {
      memoryBlock += `* ${cat.label}:\n` + list.map(t => `  - ${t}`).join("\n") + "\n";
    }
  });

  memoryBlock += "====================================================\n";

  return baseInstruction + memoryBlock;
}

// Format memory core AND recent chat/journal history into system instructions
export function formatSystemInstructionsWithMemoriesAndChat(
  baseInstruction: string,
  memories: Memory[],
  chatHistory: any[]
): string {
  let instructions = formatSystemInstructionsWithMemories(baseInstruction, memories);
  
  if (chatHistory && chatHistory.length > 0) {
    let chatBlock = "\n\n" +
      "=== LAST CONVERSATION JOURNAL & CONTEXT ===\n" +
      "Below are the most recent conversation messages from the chat journal. " +
      "Use this to understand what was last being discussed, what was important, what is unresolved, and to maintain seamless continuity in the conversation when reconnecting or starting a new session.\n\n";
    
    // Take the last 15 messages for concise but sufficient context
    const recentMessages = chatHistory.slice(-15);
    recentMessages.forEach((msg) => {
      const isUser = msg?.role === "user" || msg?.sender === "user";
      const roleName = isUser ? "User (TECH)" : "Myraa (AI)";
      const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : "";
      chatBlock += `[${timeStr}] ${roleName}: ${msg.text || ""}\n`;
    });
    
    chatBlock += "\n============================================\n";
    instructions += chatBlock;
  }
  
  return instructions;
}

export async function formatSystemInstructionsWithMemoriesChatAndGraph(
  baseInstruction: string,
  memories: Memory[],
  chatHistory: any[]
): Promise<string> {
  let instructions = formatSystemInstructionsWithMemoriesAndChat(baseInstruction, memories, chatHistory);
  try {
    const graph = await loadKnowledgeGraph();
    const graphContext = formatKnowledgeGraphPromptContext(graph);
    if (graphContext) {
      instructions += "\n\n" + graphContext;
    }
  } catch (err) {
    console.error("[KnowledgeGraph] Error formatting graph context for system instructions:", err);
  }

  // Inject 128-dimensional Vector Memory Knowledge Graph Context
  try {
    let vectorGraph = await loadVectorKnowledgeGraph();
    if (!vectorGraph || !vectorGraph.nodes || vectorGraph.nodes.length === 0) {
      const entityGraph = await loadKnowledgeGraph();
      vectorGraph = await buildServerVectorKnowledgeGraph(memories, entityGraph);
    }
    const vectorContext = formatVectorGraphPromptContext(vectorGraph);
    if (vectorContext) {
      instructions += "\n\n" + vectorContext;
    }
  } catch (vErr) {
    console.error("[VectorGraph] Error injecting vector memory context:", vErr);
  }

  return instructions;
}

// Background memory consolidation queue lock
let isConsolidating = false;

export async function processConversationSlice(
  apiKey: string,
  dialogueHistory: { role: string; text: string }[]
): Promise<{ success: boolean; memories: Memory[] | null }> {
  if (isConsolidating) {
    console.log("[Memory] Consolidation loop busy, skipping slice processing");
    return { success: false, memories: null };
  }

  if (dialogueHistory.length < 2) {
    return { success: false, memories: null };
  }

  isConsolidating = true;
  console.log("[Memory] Initiating pipeline for dialogue slice of length:", dialogueHistory.length);

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const currentMemories = await loadMemories();
    
    // Format memory map to help Gemini understand what to edit
    const memoryContext = currentMemories.map(m => `ID: ${m.id} | Category: ${m.category} | Fact: ${m.text}`).join("\n");
    const dialogueContext = dialogueHistory.map(line => `${line.role === "user" ? "User" : "Myraa"}: ${line.text}`).join("\n");

    const prompt = `You are Myraa's deep cognitive recollection engine. Your task is to analyze the recent conversation piece against previous persistent memories, and output precise update transactions.

### OBJECTIVE
Analyze the recent conversation and decide if any statements contain durable, important facts about the user, including:
- Personal details, identity, background, language spoken, location, interests, or career/study focus.
- Enduring preferences, opinions, likes/dislikes, communication style preferences.
- Aspirations, personal/academic/professional goals, upcoming milestones.
- Active or planned projects, coding tasks, study subjects, homework topics.
- Important relationships, emotional events, key experiences mentioned.
- Concepts or topics taught, explained, or discussed that reflect user knowledge or learning goals.

Avoid cataloging trivial greetings or small talk (e.g. 'hello', 'how are you', 'waking up', 'lol', 'okay', 'yes').

### CURRENT USER MEMORIES:
${memoryContext || "(No memory records exist)"}

### RECENT DIALOGUE SLICE:
${dialogueContext}

### RULES
- ACTIONS:
  - "ADD": If new material information or user detail is introduced and not yet recorded.
  - "UPDATE": If previous memory has evolved or been corrected. Provide the exact ID of the memory to replace.
  - "REMOVE": If a memory was disproven or explicitly requested to be deleted.
- TEXT STYLE: Express memories as clean, concise, third-person declarative summaries (e.g., 'The user is studying computer science and preparing for exams.', 'The user prefers direct, analytical answers over polite fluff.', 'The user is building a web app called Myraa.').
- ID: For ADD, leave blank/null. For UPDATE or REMOVE, provide the exact 'id' from the "Current user memories" list.`;

    const modelCandidates = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"];
    let responseText: string | undefined = undefined;

    for (const mName of modelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: mName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transactions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "ADD, UPDATE, or REMOVE transaction.",
                        enum: ["ADD", "UPDATE", "REMOVE"]
                      },
                      id: {
                        type: Type.STRING,
                        description: "Specific ID of the existing memory being modified or deleted (leave blank/null for ADD)."
                      },
                      category: {
                        type: Type.STRING,
                        description: "The Memory category classification.",
                        enum: ["identity", "preference", "goal", "project", "relationship", "emotional", "behavior", "simulation"]
                      },
                      text: {
                        type: Type.STRING,
                        description: "The memory summarized as a concise declarative statement in third-person."
                      }
                    },
                    required: ["action", "category", "text"]
                  }
                }
              },
              required: ["transactions"]
            }
          }
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (mErr: any) {
        console.log(`[Memory] Candidate model ${mName} unavailable during slice processing, trying next candidate.`);
      }
    }

    if (!responseText) {
      console.log("[Memory] All model candidates busy or quota limited, skipping slice processing for now.");
      isConsolidating = false;
      return { success: false, memories: null };
    }

    const resultText = responseText.trim();
    let resultObj: any = {};
    try {
      const cleanedText = resultText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      resultObj = JSON.parse(cleanedText);
    } catch (e: any) {
      console.error("[Memory] Failed to parse model memory transactions response:", e.message, resultText);
    }
    const transactions: MemoryTransaction[] = resultObj.transactions || [];

    if (transactions.length === 0) {
      console.log("[Memory] Zero transactions generated. Ignored routine conversations.");
      isConsolidating = false;
      return { success: true, memories: null };
    }

    console.log(`[Memory] Processing ${transactions.length} memory updates:`, JSON.stringify(transactions));

    let updatedMemories = [...currentMemories];
    const timestamp = new Date().toISOString();

    for (const trx of transactions) {
      if (trx.action === "ADD") {
        const newMemory: Memory = {
          id: Math.random().toString(36).substring(2, 11),
          category: trx.category,
          text: trx.text,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        updatedMemories.push(newMemory);
      } else if (trx.action === "UPDATE") {
        const tarIndex = updatedMemories.findIndex(m => m.id === trx.id);
        if (tarIndex !== -1) {
          updatedMemories[tarIndex] = {
            ...updatedMemories[tarIndex],
            category: trx.category,
            text: trx.text,
            updatedAt: timestamp
          };
        } else {
          // Fallback, treat as ADD if ID not matched
          const newMemory: Memory = {
            id: Math.random().toString(36).substring(2, 11),
            category: trx.category,
            text: trx.text,
            createdAt: timestamp,
            updatedAt: timestamp
          };
          updatedMemories.push(newMemory);
        }
      } else if (trx.action === "REMOVE") {
        updatedMemories = updatedMemories.filter(m => m.id !== trx.id);
        if (trx.id) {
          try {
            const delIds = await loadDeletedMemoryIds();
            if (!delIds.includes(trx.id)) {
              delIds.push(trx.id);
              await saveDeletedMemoryIds(delIds);
            }
          } catch (delErr) {
            console.error("[Memory] Failed to save deleted memory ID on REMOVE:", delErr);
          }
        }
      }
    }

    await saveMemories(updatedMemories);
    isConsolidating = false;
    return { success: true, memories: updatedMemories };

  } catch (error) {
    console.error("[Memory] Consolidation failure:", error);
    isConsolidating = false;
    return { success: false, memories: null };
  }
}

// ==========================================
// KNOWLEDGE GRAPH DATA STRUCTURES & WORKER
// ==========================================

export interface EntityNode {
  id: string;
  name: string;
  type: "person" | "project" | "concept" | "goal" | "technology" | "location" | "event";
  description: string;
  sentiment?: "positive" | "neutral" | "concerned" | "excited";
  importance?: number; // 1 to 5 scale
  mentionCount?: number;
  lastMentioned?: string;
}

export interface EntityRelation {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string; // e.g., "collaborates_on", "is_building", "studies", "uses_tech", "aims_for"
  description: string;
}

export interface KnowledgeGraph {
  nodes: EntityNode[];
  edges: EntityRelation[];
  lastUpdated: string;
}

const KNOWLEDGE_GRAPH_FILE = path.join(DATA_DIR, "knowledge_graph.json");

export async function loadKnowledgeGraph(): Promise<KnowledgeGraph> {
  const fallback: KnowledgeGraph = { nodes: [], edges: [], lastUpdated: new Date().toISOString() };
  try {
    const data = await fs.readFile(KNOWLEDGE_GRAPH_FILE, "utf-8");
    const parsed = parseJsonWithRecovery<KnowledgeGraph>(data, fallback);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return fallback;
    }
    return parsed;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    return fallback;
  }
}

export async function saveKnowledgeGraph(graph: KnowledgeGraph): Promise<void> {
  try {
    if (!graph || typeof graph !== "object") return;
    await safeWriteFileAtomic(KNOWLEDGE_GRAPH_FILE, graph);
  } catch (error) {
    console.error("[KnowledgeGraph] Error saving knowledge graph file:", error);
  }
}

let isGraphParsing = false;

/**
 * Background worker that parses chat history to proactively build
 * an Entity Knowledge Graph (people, projects, concepts, tech, goals, relations).
 */
export async function buildKnowledgeGraphFromChatHistory(apiKey: string): Promise<KnowledgeGraph> {
  if (isGraphParsing) {
    console.log("[KnowledgeGraph Worker] Background worker already parsing chat history. Skipping concurrent run.");
    return await loadKnowledgeGraph();
  }

  isGraphParsing = true;
  try {
    const chatHistory = await loadChatHistory();
    if (!chatHistory || chatHistory.length === 0) {
      isGraphParsing = false;
      return await loadKnowledgeGraph();
    }

    const currentGraph = await loadKnowledgeGraph();

    // Prepare recent dialogue slice (up to last 30 messages)
    const recentMessages = chatHistory.slice(-30);
    const dialogueStr = recentMessages.map((m) => `${m.sender === "user" ? "User" : "Myraa"}: ${m.text}`).join("\n");

    const existingEntitiesStr = currentGraph.nodes
      .map((n) => `[ID: ${n.id}] Name: ${n.name} | Type: ${n.type} | Desc: ${n.description}`)
      .join("\n");

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const prompt = `You are Myraa's Cognitive Knowledge Graph Extraction Worker.
Your task is to analyze the user's conversation history and extract key ENTITIES (people, projects, concepts, goals, technologies, locations) and RELATIONS between them.

### EXISTING KNOWLEDGE GRAPH ENTITIES:
${existingEntitiesStr || "(No entity nodes exist yet)"}

### CONVERSATION HISTORY TO PARSE:
${dialogueStr}

### INSTRUCTIONS:
1. Extract distinct, meaningful entities mentioned by the user or discussed with Myraa:
   - "person": People in the user's life (friends, colleagues, professors, mentors, family).
   - "project": Active apps, research papers, websites, startups, assignments.
   - "concept": Academic topics, theories, skills, subjects, subject matter.
   - "goal": Aspirations, career milestones, exams, target metrics.
   - "technology": Frameworks, programming languages, software tools, hardware.
   - "location" or "event": Important places or upcoming key events.
2. For each entity, specify a clean 'name', 'type', 'description', emotional 'sentiment' (positive, neutral, concerned, excited), and 'importance' rating (1 to 5).
3. If an entity matches an existing entity, reuse or update its details.
4. Identify RELATIONS between entities (e.g. User/Project uses Technology, Person collaborates on Project, Goal relates to Concept).

Return structured JSON according to the schema.`;

    const graphModelCandidates = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"];
    let graphResponseText: string | undefined = undefined;

    for (const mName of graphModelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: mName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                entities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "Existing ID if updating, or new clean slug ID." },
                      name: { type: Type.STRING },
                      type: {
                        type: Type.STRING,
                        enum: ["person", "project", "concept", "goal", "technology", "location", "event"]
                      },
                      description: { type: Type.STRING },
                      sentiment: { type: Type.STRING, enum: ["positive", "neutral", "concerned", "excited"] },
                      importance: { type: Type.NUMBER }
                    },
                    required: ["name", "type", "description"]
                  }
                },
                relations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sourceName: { type: Type.STRING },
                      targetName: { type: Type.STRING },
                      relation: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["sourceName", "targetName", "relation"]
                  }
                }
              },
              required: ["entities", "relations"]
            }
          }
        });
        if (response.text) {
          graphResponseText = response.text;
          break;
        }
      } catch (gErr: any) {
        console.log(`[KnowledgeGraph Worker] Candidate ${mName} busy or high demand, trying next candidate.`);
      }
    }

    if (!graphResponseText) {
      console.log("[KnowledgeGraph Worker] All graph model candidates high demand or quota limited, deferring build.");
      isGraphParsing = false;
      return currentGraph;
    }

    const rawText = graphResponseText.trim();
    let parsed: any = {};
    try {
      const clean = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error("[KnowledgeGraph Worker] JSON Parse Error:", parseErr, rawText);
    }

    const extractedEntities: any[] = parsed.entities || [];
    const extractedRelations: any[] = parsed.relations || [];

    const nowIso = new Date().toISOString();
    let updatedNodes = [...currentGraph.nodes];
    let updatedEdges = [...currentGraph.edges];

    // Merge or add entities
    for (const item of extractedEntities) {
      const cleanName = item.name.trim();
      if (!cleanName) continue;

      const existingIndex = updatedNodes.findIndex(
        (n) => n.name.toLowerCase() === cleanName.toLowerCase() || (item.id && n.id === item.id)
      );

      if (existingIndex !== -1) {
        // Update existing entity node
        const exNode = updatedNodes[existingIndex];
        updatedNodes[existingIndex] = {
          ...exNode,
          description: item.description || exNode.description,
          sentiment: item.sentiment || exNode.sentiment || "neutral",
          importance: item.importance || exNode.importance || 3,
          mentionCount: (exNode.mentionCount || 1) + 1,
          lastMentioned: nowIso
        };
      } else {
        // Add new entity node
        const newNode: EntityNode = {
          id: item.id || "ent-" + Math.random().toString(36).substring(2, 9),
          name: cleanName,
          type: item.type || "concept",
          description: item.description || "",
          sentiment: item.sentiment || "neutral",
          importance: item.importance || 3,
          mentionCount: 1,
          lastMentioned: nowIso
        };
        updatedNodes.push(newNode);
      }
    }

    // Merge relations
    for (const rel of extractedRelations) {
      const sNode = updatedNodes.find((n) => n.name.toLowerCase() === rel.sourceName?.trim().toLowerCase());
      const tNode = updatedNodes.find((n) => n.name.toLowerCase() === rel.targetName?.trim().toLowerCase());

      if (sNode && tNode && sNode.id !== tNode.id) {
        const edgeExists = updatedEdges.some(
          (e) => e.sourceId === sNode.id && e.targetId === tNode.id && e.relation === rel.relation
        );
        if (!edgeExists) {
          const newEdge: EntityRelation = {
            id: "rel-" + Math.random().toString(36).substring(2, 9),
            sourceId: sNode.id,
            targetId: tNode.id,
            relation: rel.relation,
            description: rel.description || `${sNode.name} ${rel.relation} ${tNode.name}`
          };
          updatedEdges.push(newEdge);
        }
      }
    }

    const newGraph: KnowledgeGraph = {
      nodes: updatedNodes,
      edges: updatedEdges,
      lastUpdated: nowIso
    };

    await saveKnowledgeGraph(newGraph);
    console.log(`[KnowledgeGraph Worker] Graph built successfully with ${newGraph.nodes.length} nodes and ${newGraph.edges.length} relations.`);
    isGraphParsing = false;
    return newGraph;
  } catch (err) {
    console.error("[KnowledgeGraph Worker] Failed building knowledge graph:", err);
    isGraphParsing = false;
    return await loadKnowledgeGraph();
  }
}

/**
 * Formats the Knowledge Graph into a structured prompt injection context
 * to surface intelligent entity context prompts to Myraa during live sessions.
 */
export function formatKnowledgeGraphPromptContext(graph: KnowledgeGraph): string {
  if (!graph.nodes || graph.nodes.length === 0) {
    return "";
  }

  // Sort nodes by importance and recency
  const topNodes = [...graph.nodes]
    .sort((a, b) => (b.importance || 1) - (a.importance || 1))
    .slice(0, 12);

  let promptStr = "=== MYRAA USER ENTITY KNOWLEDGE GRAPH (LIVE CONTEXT) ===\n";
  promptStr += "You have a structured knowledge graph of the user's key entities and connections:\n";

  topNodes.forEach((node) => {
    promptStr += `- [${node.type.toUpperCase()}] ${node.name}: ${node.description} (Sentiment: ${node.sentiment || "neutral"})\n`;
  });

  if (graph.edges && graph.edges.length > 0) {
    promptStr += "\nCONNECTED RELATIONSHIPS:\n";
    graph.edges.slice(0, 10).forEach((edge) => {
      const src = graph.nodes.find((n) => n.id === edge.sourceId);
      const tgt = graph.nodes.find((n) => n.id === edge.targetId);
      if (src && tgt) {
        promptStr += `  • ${src.name} --(${edge.relation})--> ${tgt.name}: ${edge.description}\n`;
      }
    });
  }

  promptStr += "INSTRUCTION: Naturally draw upon these entity connections when relevant to provide hyper-personalized, deeply contextual responses during conversation!\n";
  promptStr += "=======================================================\n";

  return promptStr;
}

// =========================================================
// SERVER-SIDE HIGH-DIMENSIONAL VECTOR MEMORY ENGINE
// =========================================================

export interface ServerVectorNode {
  id: string;
  label: string;
  type: string;
  category?: string;
  description: string;
  source: "transcript_fact" | "extracted_entity" | "study_notes" | "whiteboard_canvas" | "knowledge_deficit";
  embedding: number[];
  clusterId: number;
  clusterName: string;
  clusterColor: string;
  importance: number;
  mentionCount: number;
  tags?: string[];
  projectId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface ServerVectorEdge {
  id: string;
  sourceId: string;
  targetId: string;
  similarity: number;
  relationLabel: string;
  isExplicit?: boolean;
}

export interface ServerVectorKnowledgeGraph {
  nodes: ServerVectorNode[];
  edges: ServerVectorEdge[];
  clusters: Array<{ id: number; name: string; color: string; count: number }>;
  lastUpdated: string;
  embeddingDimensions: number;
  density: number;
}

const VECTOR_GRAPH_FILE = path.join(DATA_DIR, "vector_knowledge_graph.json");

export const SERVER_SEMANTIC_CLUSTERS = [
  { id: 0, name: "Identity & Persona", color: "#38bdf8", baseWords: ["name", "i am", "mirza", "ahmed", "tech", "identity", "student", "user"] },
  { id: 1, name: "Projects & Engineering", color: "#818cf8", baseWords: ["project", "code", "app", "build", "react", "node", "typescript", "fullstack", "github", "circuit", "simulation"] },
  { id: 2, name: "Concepts & Scientific Learning", color: "#34d399", baseWords: ["concept", "learn", "study", "physics", "math", "algorithm", "theory", "chalkboard", "logic"] },
  { id: 3, name: "Goals, Deadlines & Planning", color: "#fbbf24", baseWords: ["goal", "deadline", "due", "exam", "tomorrow", "schedule", "task", "milestone", "plan"] },
  { id: 4, name: "Preferences & Emotional Context", color: "#f472b6", baseWords: ["like", "prefer", "love", "favorite", "hobby", "tone", "pasand", "interest", "habit"] },
];

function serverHashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function computeServerVectorEmbedding(text: string, tags?: string[]): number[] {
  const EMB_DIM = 128;
  const vec = new Array(EMB_DIM).fill(0);
  if (!text || !text.trim()) {
    vec[0] = 1;
    return vec;
  }

  const clean = text.toLowerCase().replace(/[^a-z0-9\s_-]/g, " ");
  const tokens = clean.split(/\s+/).filter((t) => t.length > 1);

  // 1. Unigram hashing
  for (const t of tokens) {
    const idx = serverHashString(t) % 64;
    vec[idx] += 1.5;
    if (t.length >= 3) {
      for (let i = 0; i <= t.length - 3; i++) {
        const tri = t.substring(i, i + 3);
        vec[serverHashString(tri) % 64] += 0.4;
      }
    }
  }

  // 2. Tag weights
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      vec[serverHashString(tag.toLowerCase()) % 64] += 2.0;
    }
  }

  // 3. Cluster keyword projection
  SERVER_SEMANTIC_CLUSTERS.forEach((cluster, cIdx) => {
    const start = 64 + cIdx * 12;
    let score = 0;
    for (const bw of cluster.baseWords) {
      if (clean.includes(bw)) score += 2.0;
      for (const t of tokens) {
        if (t === bw || t.startsWith(bw)) score += 1.5;
      }
    }
    if (score > 0) {
      for (let o = 0; o < 12; o++) {
        vec[start + o] += score * (1 - o * 0.05);
      }
    }
  });

  // 4. L2 Normalize
  let norm = 0;
  for (let i = 0; i < EMB_DIM; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < EMB_DIM; i++) vec[i] /= norm;
  } else {
    vec[0] = 1;
  }
  return vec;
}

export function serverCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return Math.max(0, Math.min(1, dot));
}

export async function loadVectorKnowledgeGraph(): Promise<ServerVectorKnowledgeGraph> {
  const fallback: ServerVectorKnowledgeGraph = {
    nodes: [],
    edges: [],
    clusters: [],
    lastUpdated: new Date().toISOString(),
    embeddingDimensions: 128,
    density: 0
  };
  try {
    const raw = await fs.readFile(VECTOR_GRAPH_FILE, "utf-8");
    const parsed = parseJsonWithRecovery<ServerVectorKnowledgeGraph>(raw, fallback);
    if (!parsed || !Array.isArray(parsed.nodes)) return fallback;
    return parsed;
  } catch (err: any) {
    return fallback;
  }
}

export async function saveVectorKnowledgeGraph(graph: ServerVectorKnowledgeGraph): Promise<void> {
  try {
    if (!graph || typeof graph !== "object") return;
    await safeWriteFileAtomic(VECTOR_GRAPH_FILE, graph);
  } catch (err) {
    console.error("[VectorGraph] Error writing vector knowledge graph:", err);
  }
}

export interface ProjectArtifactsForServer {
  studyNotes?: string;
  chalkboardSlates?: any[];
  deficits?: any[];
}

export async function buildServerVectorKnowledgeGraph(
  memories: Memory[],
  graph: KnowledgeGraph,
  similarityThreshold: number = 0.38,
  projectArtifacts?: ProjectArtifactsForServer
): Promise<ServerVectorKnowledgeGraph> {
  const nodes: ServerVectorNode[] = [];
  const nodeMap = new Map<string, ServerVectorNode>();

  // 1. Entities
  for (const ent of graph.nodes) {
    const desc = ent.description || ent.name;
    const emb = computeServerVectorEmbedding(`${ent.name} ${desc} ${ent.type}`);
    let bestCluster = SERVER_SEMANTIC_CLUSTERS[2];
    let maxClusterScore = -1;
    SERVER_SEMANTIC_CLUSTERS.forEach((c, idx) => {
      let score = 0;
      for (let o = 0; o < 12; o++) score += emb[64 + idx * 12 + o] || 0;
      if (score > maxClusterScore) {
        maxClusterScore = score;
        bestCluster = c;
      }
    });

    const vNode: ServerVectorNode = {
      id: ent.id,
      label: ent.name,
      type: ent.type,
      category: ent.type,
      description: desc,
      source: "extracted_entity",
      embedding: emb,
      clusterId: bestCluster.id,
      clusterName: bestCluster.name,
      clusterColor: bestCluster.color,
      importance: ent.importance || 3,
      mentionCount: ent.mentionCount || 1,
      createdAt: ent.lastMentioned || new Date().toISOString()
    };
    nodes.push(vNode);
    nodeMap.set(vNode.id, vNode);
  }

  // 2. Transcript Memories
  for (const mem of memories) {
    const memId = mem.id || ("mem_" + Math.random().toString(36).substring(2, 9));
    if (nodeMap.has(memId)) continue;

    const fullText = `${mem.text} ${mem.category} ${mem.projectId || ""} ${mem.dueDate || ""} ${(mem.tags || []).join(" ")}`;
    const emb = computeServerVectorEmbedding(fullText, mem.tags);

    let cluster = SERVER_SEMANTIC_CLUSTERS[2];
    if (mem.category === "identity") cluster = SERVER_SEMANTIC_CLUSTERS[0];
    else if (mem.category === "project") cluster = SERVER_SEMANTIC_CLUSTERS[1];
    else if (mem.category === "goal") cluster = SERVER_SEMANTIC_CLUSTERS[3];
    else if (mem.category === "preference") cluster = SERVER_SEMANTIC_CLUSTERS[4];

    let label = mem.text.replace(/^User (?:identity\/name|active project|study goal\/topic|preference note):\s*"?/i, "").replace(/"?$/, "");
    if (label.length > 36) label = label.substring(0, 34) + "…";

    const vNode: ServerVectorNode = {
      id: memId,
      label,
      type: mem.category === "identity" ? "person" : mem.category === "project" ? "project" : mem.category === "goal" ? "goal" : "fact",
      category: mem.category,
      description: mem.text,
      source: "transcript_fact",
      embedding: emb,
      clusterId: cluster.id,
      clusterName: cluster.name,
      clusterColor: cluster.color,
      importance: mem.category === "identity" ? 5 : mem.category === "project" ? 4 : 3,
      mentionCount: 1,
      tags: mem.tags,
      projectId: mem.projectId,
      dueDate: mem.dueDate,
      createdAt: mem.createdAt || new Date().toISOString()
    };
    nodes.push(vNode);
    nodeMap.set(vNode.id, vNode);
  }

  // 3. Whole Project Artifacts: Study Notes
  if (projectArtifacts?.studyNotes && projectArtifacts.studyNotes.trim().length > 20) {
    const noteSections = projectArtifacts.studyNotes
      .split(/\n(?=###?\s+|---)/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    noteSections.slice(0, 8).forEach((sec, idx) => {
      const headingMatch = sec.match(/###?\s+([^\n]+)/);
      const title = headingMatch ? headingMatch[1].trim() : `Exam Notes Section ${idx + 1}`;
      const emb = computeServerVectorEmbedding(sec, ["notes", "study", "exam", "reference"]);
      const nId = `artifact_notes_${idx}`;
      if (!nodeMap.has(nId)) {
        const vNode: ServerVectorNode = {
          id: nId,
          label: title.length > 32 ? title.substring(0, 30) + "…" : title,
          type: "study_notes",
          category: "concept",
          description: sec.substring(0, 200) + (sec.length > 200 ? "…" : ""),
          source: "study_notes",
          embedding: emb,
          clusterId: SERVER_SEMANTIC_CLUSTERS[2].id,
          clusterName: SERVER_SEMANTIC_CLUSTERS[2].name,
          clusterColor: SERVER_SEMANTIC_CLUSTERS[2].color,
          importance: 4,
          mentionCount: 1,
          createdAt: new Date().toISOString()
        };
        nodes.push(vNode);
        nodeMap.set(vNode.id, vNode);
      }
    });
  }

  // 4. Whole Project Artifacts: Chalkboard / Whiteboard Slates
  if (projectArtifacts?.chalkboardSlates && Array.isArray(projectArtifacts.chalkboardSlates)) {
    projectArtifacts.chalkboardSlates.forEach((slate, idx) => {
      const slateTitle = slate.title || `Chalkboard Slate ${idx + 1}`;
      const slateDesc = slate.notes || slate.text || `Interactive classroom diagram with ${slate.drawings?.length || 0} vector paths`;
      const emb = computeServerVectorEmbedding(`${slateTitle} ${slateDesc}`, ["whiteboard", "diagram", "canvas"]);
      const sId = `artifact_slate_${idx}`;
      if (!nodeMap.has(sId)) {
        const vNode: ServerVectorNode = {
          id: sId,
          label: slateTitle.length > 32 ? slateTitle.substring(0, 30) + "…" : slateTitle,
          type: "whiteboard_canvas",
          category: "technical",
          description: slateDesc,
          source: "whiteboard_canvas",
          embedding: emb,
          clusterId: SERVER_SEMANTIC_CLUSTERS[1].id,
          clusterName: SERVER_SEMANTIC_CLUSTERS[1].name,
          clusterColor: SERVER_SEMANTIC_CLUSTERS[1].color,
          importance: 3,
          mentionCount: 1,
          createdAt: new Date().toISOString()
        };
        nodes.push(vNode);
        nodeMap.set(vNode.id, vNode);
      }
    });
  }

  // 5. Whole Project Artifacts: Knowledge Deficits
  if (projectArtifacts?.deficits && Array.isArray(projectArtifacts.deficits)) {
    projectArtifacts.deficits.forEach((def, idx) => {
      const defTopic = def.topic || `Knowledge Area ${idx + 1}`;
      const emb = computeServerVectorEmbedding(`${defTopic} deficit gap reinforcement`, ["deficit", "review", "gap"]);
      const dId = `artifact_deficit_${def.id || idx}`;
      if (!nodeMap.has(dId)) {
        const vNode: ServerVectorNode = {
          id: dId,
          label: `Review: ${defTopic}`,
          type: "knowledge_deficit",
          category: "goal",
          description: `Knowledge gap identified in turn: ${def.userPrompt || defTopic}`,
          source: "knowledge_deficit",
          embedding: emb,
          clusterId: SERVER_SEMANTIC_CLUSTERS[3].id,
          clusterName: SERVER_SEMANTIC_CLUSTERS[3].name,
          clusterColor: SERVER_SEMANTIC_CLUSTERS[3].color,
          importance: 4,
          mentionCount: 1,
          createdAt: new Date().toISOString()
        };
        nodes.push(vNode);
        nodeMap.set(vNode.id, vNode);
      }
    });
  }

  // 6. Edges
  const edges: ServerVectorEdge[] = [];
  const edgeSet = new Set<string>();

  // Explicit relations
  for (const rel of graph.edges) {
    if (nodeMap.has(rel.sourceId) && nodeMap.has(rel.targetId) && rel.sourceId !== rel.targetId) {
      const src = nodeMap.get(rel.sourceId)!;
      const tgt = nodeMap.get(rel.targetId)!;
      const sim = serverCosineSimilarity(src.embedding, tgt.embedding);
      const k = `${rel.sourceId}---${rel.targetId}`;
      if (!edgeSet.has(k)) {
        edges.push({
          id: rel.id,
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          similarity: Math.max(sim, 0.75),
          relationLabel: rel.relation,
          isExplicit: true
        });
        edgeSet.add(k);
      }
    }
  }

  // Pairwise Cosine Similarity
  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const na = nodes[i];
      const nb = nodes[j];
      const isProjectLink = Boolean(na.projectId && nb.label.toLowerCase().includes(na.projectId.replace("#", "").toLowerCase()));
      const sim = serverCosineSimilarity(na.embedding, nb.embedding);
      const effectiveSim = isProjectLink ? Math.max(sim, 0.85) : sim;

      if (effectiveSim >= similarityThreshold) {
        const k = `${na.id}---${nb.id}`;
        const rev = `${nb.id}---${na.id}`;
        if (!edgeSet.has(k) && !edgeSet.has(rev)) {
          edges.push({
            id: `vedge-${na.id}-${nb.id}`,
            sourceId: na.id,
            targetId: nb.id,
            similarity: Number(effectiveSim.toFixed(3)),
            relationLabel: isProjectLink ? "part of project" : effectiveSim > 0.65 ? "strongly connected" : "semantically relates to",
            isExplicit: false
          });
          edgeSet.add(k);
        }
      }
    }
  }

  const clusterCounts = new Map<number, number>();
  for (const node of nodes) clusterCounts.set(node.clusterId, (clusterCounts.get(node.clusterId) || 0) + 1);
  const clusters = SERVER_SEMANTIC_CLUSTERS.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    count: clusterCounts.get(c.id) || 0
  }));

  const maxEdges = (n * (n - 1)) / 2;
  const density = maxEdges > 0 ? Number((edges.length / maxEdges).toFixed(3)) : 0;

  const vectorGraph: ServerVectorKnowledgeGraph = {
    nodes,
    edges,
    clusters,
    lastUpdated: new Date().toISOString(),
    embeddingDimensions: 128,
    density
  };

  await saveVectorKnowledgeGraph(vectorGraph);
  return vectorGraph;
}

/**
 * Formats the 128-dimensional Vector Memory Graph into a dense semantic cognitive prompt block
 * to empower Myraa with high-dimensional vector memory awareness during conversation.
 */
export function formatVectorGraphPromptContext(vectorGraph: ServerVectorKnowledgeGraph): string {
  if (!vectorGraph || !vectorGraph.nodes || vectorGraph.nodes.length === 0) {
    return "";
  }

  let promptStr = "=== MYRAA 128-DIMENSIONAL VECTOR MEMORY EMBEDDINGS (LIVE RETRIEVAL) ===\n";
  promptStr += `Active High-Dimensional Vector Space: ${vectorGraph.nodes.length} embedded concept nodes across 5 semantic vector clusters:\n`;

  // Provide cluster summaries
  vectorGraph.clusters.forEach((c) => {
    const clusterNodes = vectorGraph.nodes.filter((n) => n.clusterId === c.id);
    if (clusterNodes.length > 0) {
      const topLabels = clusterNodes.slice(0, 6).map((n) => `${n.label}${n.projectId ? ` [${n.projectId}]` : ""}`).join(", ");
      promptStr += `• [Cluster: ${c.name} (${clusterNodes.length} nodes)]: ${topLabels}\n`;
    }
  });

  // Top strongest semantic vector relationships
  if (vectorGraph.edges && vectorGraph.edges.length > 0) {
    promptStr += "\nTOP SEMANTIC VECTOR ASSOCIATIONS:\n";
    const topEdges = [...vectorGraph.edges]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);
    topEdges.forEach((edge) => {
      const src = vectorGraph.nodes.find((n) => n.id === edge.sourceId);
      const tgt = vectorGraph.nodes.find((n) => n.id === edge.targetId);
      if (src && tgt) {
        promptStr += `  ~ ${src.label} <==(${Math.round(edge.similarity * 100)}% similarity / ${edge.relationLabel})==> ${tgt.label}\n`;
      }
    });
  }

  promptStr += "INSTRUCTION: Draw upon these vector memory connections effortlessly. You may also call 'queryVectorMemory' tool anytime to perform real-time semantic cosine similarity search over any concept or query!\n";
  promptStr += "=======================================================================\n";

  return promptStr;
}

/**
 * Go-style Read-Write Mutex (sync.RWMutex) ensuring safe concurrent reads
 * and exclusive write locking for in-memory vector storage operations.
 */
export class GoStyleRWMutex {
  private readers = 0;
  private writer = false;
  private readWaiters: Array<() => void> = [];
  private writeWaiters: Array<() => void> = [];

  async rLock(): Promise<void> {
    if (!this.writer && this.writeWaiters.length === 0) {
      this.readers++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.readWaiters.push(() => {
        this.readers++;
        resolve();
      });
    });
  }

  rUnlock(): void {
    this.readers = Math.max(0, this.readers - 1);
    if (this.readers === 0 && this.writeWaiters.length > 0) {
      const nextWriter = this.writeWaiters.shift();
      if (nextWriter) {
        this.writer = true;
        nextWriter();
      }
    }
  }

  async lock(): Promise<void> {
    if (!this.writer && this.readers === 0) {
      this.writer = true;
      return;
    }
    return new Promise<void>((resolve) => {
      this.writeWaiters.push(() => {
        this.writer = true;
        resolve();
      });
    });
  }

  unlock(): void {
    this.writer = false;
    if (this.writeWaiters.length > 0) {
      const nextWriter = this.writeWaiters.shift();
      if (nextWriter) {
        this.writer = true;
        nextWriter();
        return;
      }
    }
    while (this.readWaiters.length > 0) {
      const nextReader = this.readWaiters.shift();
      if (nextReader) nextReader();
    }
  }
}

export const serverVectorMutex = new GoStyleRWMutex();

/**
 * High-concurrency vector query against the server's vector knowledge graph.
 * Protected by GoStyleRWMutex for safe multi-client access.
 */
export async function serverQueryVectorMemory(
  query: string,
  topK: number = 5,
  minSimilarity: number = 0.28
): Promise<{
  query: string;
  topMatches: Array<{ node: ServerVectorNode; similarity: number }>;
  totalIndexed: number;
}> {
  await serverVectorMutex.rLock();
  try {
    const graph = await loadVectorKnowledgeGraph();
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
      return { query, topMatches: [], totalIndexed: 0 };
    }

    const queryEmb = computeServerVectorEmbedding(query);
    const scored = graph.nodes
      .map((node) => ({
        node,
        similarity: Number(serverCosineSimilarity(queryEmb, node.embedding).toFixed(3))
      }))
      .filter((m) => m.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return {
      query,
      topMatches: scored,
      totalIndexed: graph.nodes.length
    };
  } finally {
    serverVectorMutex.rUnlock();
  }
}

/**
 * Server-side semantic similarity check between a candidate fact and existing memories.
 */
export async function serverFindSemanticallySimilarMemory(
  candidateFact: string,
  threshold: number = 0.82
): Promise<{ memory: Memory; similarity: number; index: number } | null> {
  await serverVectorMutex.rLock();
  try {
    const memories = await loadMemories();
    if (!candidateFact || !memories || memories.length === 0) return null;

    const candidateEmb = computeServerVectorEmbedding(candidateFact);
    let bestSim = -1;
    let bestMem: Memory | null = null;
    let bestIdx = -1;

    memories.forEach((mem, idx) => {
      const full = `${mem.text} ${mem.category} ${mem.projectId || ""} ${(mem.tags || []).join(" ")}`;
      const memEmb = computeServerVectorEmbedding(full, mem.tags);
      const sim = serverCosineSimilarity(candidateEmb, memEmb);
      if (sim > bestSim) {
        bestSim = sim;
        bestMem = mem;
        bestIdx = idx;
      }
    });

    if (bestSim >= threshold && bestMem) {
      return {
        memory: bestMem,
        similarity: Number(bestSim.toFixed(3)),
        index: bestIdx
      };
    }
    return null;
  } finally {
    serverVectorMutex.rUnlock();
  }
}


