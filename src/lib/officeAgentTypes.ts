/**
 * src/lib/officeAgentTypes.ts
 * Unified types for MAHR Virtual Office Agents, real-time AI states, and task lifecycle.
 */

export type AgentStatus = 
  | 'idle'        // At rest or wandering
  | 'thinking'    // Real AI inference in progress
  | 'working'     // Executing local task / writing code
  | 'talking'     // Conversing with MAHR or user
  | 'done';       // Task completed successfully

export interface AgentTask {
  id: string;
  title: string;          // e.g. "Researching quantum computing"
  assignedBy: string;     // "mahr" | "user"
  startedAt: string;      // ISO timestamp
  completedAt?: string;
  result?: string;        // Short summary output
  status: 'pending' | 'running' | 'done' | 'failed';
}

export interface OfficeMember {
  id: string;
  name: string;           // "Jim", "Dwight", "Pam", "Ryan", etc.
  role: string;           // "Frontend Architect", "Strict Code Auditor", etc.
  status: AgentStatus;
  position?: { x: number; y: number };
  deskId?: number;
  currentTask?: AgentTask;
  thoughtBubble?: string;  // Text shown in the floating cloud
  toolBubble?: string;     // "🧠 Processing...", "🔍 Searching...", "💻 Coding..."
  avatar?: string;
  action?: string;
}

export interface OfficeStateSnapshot {
  members: OfficeMember[];
  lastActivity: string;
  activeSession: boolean;
}
