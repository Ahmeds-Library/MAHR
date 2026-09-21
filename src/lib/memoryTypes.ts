export interface Memory {
  id: string;
  category: "identity" | "preference" | "goal" | "project" | "relationship" | "emotional" | "behavior" | "simulation";
  text: string;
  createdAt: string;
  updatedAt: string;
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
}

