import { ToolSafetyTier } from "./assistantSessionTypes";

export interface ToolPolicyDefinition {
  toolName: string;
  tier: ToolSafetyTier;
  displayLabel: string;
  description: string;
}

/**
 * Explicit Default-Deny Registry for Assistant Tool Invocations.
 * - Tier 1: Safe In-App Workspace & Lesson View tools (Auto-Allowed)
 * - Tier 2: Mutating Data / External Vault / System Updater tools (Require Explicit User Confirmation)
 * - Tier 3: Any unlisted tool or path-traversal payload (Hard-Denied)
 */
export const ASSISTANT_TOOL_POLICY_REGISTRY: Record<string, ToolPolicyDefinition> = {
  // Tier 1: Safe Read / Workspace UI Tools
  updateWhiteboard: {
    toolName: "updateWhiteboard",
    tier: "tier1_auto_allow",
    displayLabel: "Chalkboard Lesson",
    description: "Updates the in-app classroom chalkboard with lesson notes or 3D models.",
  },
  renderVisualDiagram: {
    toolName: "renderVisualDiagram",
    tier: "tier1_auto_allow",
    displayLabel: "Visual Diagram",
    description: "Renders structured vector flowcharts or diagrams on the classroom chalkboard.",
  },
  render3DSimulation: {
    toolName: "render3DSimulation",
    tier: "tier1_auto_allow",
    displayLabel: "3D WebGL Lab",
    description: "Opens the in-app interactive 3D WebGL simulation studio.",
  },
  open3DSimulation: {
    toolName: "open3DSimulation",
    tier: "tier1_auto_allow",
    displayLabel: "3D WebGL Lab",
    description: "Opens the in-app interactive 3D WebGL simulation studio.",
  },
  open_slides_studio: {
    toolName: "open_slides_studio",
    tier: "tier1_auto_allow",
    displayLabel: "Slides Studio",
    description: "Generates and opens an educational presentation deck in Presenton Studio.",
  },
  createPresentation: {
    toolName: "createPresentation",
    tier: "tier1_auto_allow",
    displayLabel: "Slides Studio",
    description: "Generates and opens an educational presentation deck in Presenton Studio.",
  },
  generateSlides: {
    toolName: "generateSlides",
    tier: "tier1_auto_allow",
    displayLabel: "Slides Studio",
    description: "Generates and opens an educational presentation deck in Presenton Studio.",
  },
  generateStudyMaterials: {
    toolName: "generateStudyMaterials",
    tier: "tier1_auto_allow",
    displayLabel: "Study Flashcards & Quiz",
    description: "Compiles study flashcards and practice MCQs from the student's study pad notes.",
  },
  ingestToVectorGraph: {
    toolName: "ingestToVectorGraph",
    tier: "tier1_auto_allow",
    displayLabel: "Memory Graph Indexing",
    description: "Indexes a study concept into the in-app 128-D vector knowledge graph.",
  },
  queryGolangVectorService: {
    toolName: "queryGolangVectorService",
    tier: "tier1_auto_allow",
    displayLabel: "Vector Recall",
    description: "Queries matching study notes from the in-app vector memory graph.",
  },
  runRLPolicyStep: {
    toolName: "runRLPolicyStep",
    tier: "tier1_auto_allow",
    displayLabel: "Adaptive Tutor Tuning",
    description: "Adjusts conversational tutoring empathy, depth, and pacing weights.",
  },
  setHumanMood: {
    toolName: "setHumanMood",
    tier: "tier1_auto_allow",
    displayLabel: "Persona Mood Shift",
    description: "Updates MAHR's conversational mood and UI theme accent.",
  },
  changeBackground: {
    toolName: "changeBackground",
    tier: "tier1_auto_allow",
    displayLabel: "Theme Atmosphere",
    description: "Switches the in-app visual color theme.",
  },
  recordKnowledgeDeficit: {
    toolName: "recordKnowledgeDeficit",
    tier: "tier1_auto_allow",
    displayLabel: "Growth Journal Note",
    description: "Records a study topic for review in the learning journal.",
  },

  // Tier 2: Mutating / Deletion / External Vault or System Actions (Require User Approval)
  deleteMemory: {
    toolName: "deleteMemory",
    tier: "tier2_require_approval",
    displayLabel: "Delete Saved Memory",
    description: "Permanently deletes a stored memory node from your knowledge base.",
  },
  clearChatHistory: {
    toolName: "clearChatHistory",
    tier: "tier2_require_approval",
    displayLabel: "Clear Conversation Journal",
    description: "Erases all messages from your conversation journal.",
  },
  deleteTask: {
    toolName: "deleteTask",
    tier: "tier2_require_approval",
    displayLabel: "Delete Daily Task",
    description: "Removes a task from your daily schedule.",
  },
  obsidianVaultWrite: {
    toolName: "obsidianVaultWrite",
    tier: "tier2_require_approval",
    displayLabel: "Write to Obsidian Vault",
    description: "Writes or modifies markdown files in your synced Obsidian vault.",
  },
  runSystemUpdater: {
    toolName: "runSystemUpdater",
    tier: "tier2_require_approval",
    displayLabel: "System Update Action",
    description: "Triggers an application update check or installer package action.",
  },
};

const DANGEROUS_PAYLOAD_PATTERN =
  /(\.\.\/|\.\.\\|\/etc\/|\/proc\/|\/root\/|codesign\.key|codesign\.pfx|\.env\b|rm\s+-rf|chmod\s+777)/i;

export interface ToolSafetyEvaluation {
  tier: ToolSafetyTier;
  allowedImmediate: boolean;
  requiresApproval: boolean;
  displayLabel: string;
  reason: string;
}

/**
 * Pure Layer 1 Security Evaluator:
 * Enforces Default-Deny for unknown tools and blocks path traversal / credential access payloads.
 */
export function evaluateToolSafety(
  toolName: string,
  args: Record<string, any> = {}
): ToolSafetyEvaluation {
  const cleanName = String(toolName || "").trim();
  const serializedArgs = JSON.stringify(args || {});

  if (DANGEROUS_PAYLOAD_PATTERN.test(serializedArgs)) {
    return {
      tier: "tier3_hard_deny",
      allowedImmediate: false,
      requiresApproval: false,
      displayLabel: cleanName || "Blocked Tool",
      reason: "Blocked by workspace sandbox: path traversal or restricted resource pattern detected.",
    };
  }

  const policy = ASSISTANT_TOOL_POLICY_REGISTRY[cleanName];
  if (!policy) {
    return {
      tier: "tier3_hard_deny",
      allowedImmediate: false,
      requiresApproval: false,
      displayLabel: cleanName || "Unregistered Tool",
      reason: `Blocked by default-deny policy: tool "${cleanName}" is not in the approved registry.`,
    };
  }

  if (policy.tier === "tier2_require_approval") {
    return {
      tier: "tier2_require_approval",
      allowedImmediate: false,
      requiresApproval: true,
      displayLabel: policy.displayLabel,
      reason: policy.description,
    };
  }

  return {
    tier: "tier1_auto_allow",
    allowedImmediate: true,
    requiresApproval: false,
    displayLabel: policy.displayLabel,
    reason: policy.description,
  };
}
