export type MemoryTier = "episodic" | "semantic" | "procedural";

export interface Memory {
  id: string;
  category:
    | "identity"
    | "preference"
    | "goal"
    | "project"
    | "relationship"
    | "emotional"
    | "behavior"
    | "simulation";
  text: string;
  createdAt: string;
  updatedAt: string;
  tier?: MemoryTier;
  importance?: number; // 0.0 - 1.0 or 0 - 100
  pinned?: boolean;
  accessCount?: number;
  lastAccessedAt?: string;
  linkedNoteIds?: string[];
  projectId?: string;
  dueDate?: string;
  tags?: string[];
  confidence?: number;
  simulationMetadata?: {
    name: string;
    modelType: string;
    customModelData?: any;
    scripts?: string[];
    assets?: string[];
  };
}

export type MemoryCategory = Memory["category"];

export interface MemoryTransaction {
  action: "ADD" | "UPDATE" | "REMOVE";
  id: string;
  category: MemoryCategory;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  attachedImages?: string[];
  actionExecuted?: string;
  groundingSources?: any[];
  searchQueries?: string[];
  mediaItems?: any[];
  memoryRecalledCount?: number;
  memoryRecalledLabels?: string[];
  memorySavedTitle?: string;
  codeSentToChalkboard?: boolean;
  modeUsed?: string;
}
