export interface VoiceCommand {
  id: string;
  phrase: string;
  keywords: string[];
  category: "atmosphere" | "navigation" | "voice" | "tools" | "study";
  description: string;
  example: string;
  badgeText?: string;
}

export const VOICE_COMMANDS_LIST: VoiceCommand[] = [
  // 1. Atmosphere & Theme Color
  {
    id: "theme_crimson",
    phrase: "MAHR, change atmosphere to crimson",
    keywords: ["crimson", "red theme", "atmosphere", "color"],
    category: "atmosphere",
    description: "Shifts holographic backdrop and glowing visualizers to Crimson Pulse (#f43f5e).",
    example: "MAHR, change atmosphere of your core to crimson",
    badgeText: "Theme Shift"
  },
  {
    id: "theme_emerald",
    phrase: "MAHR, switch theme to emerald",
    keywords: ["emerald", "green theme", "horizon", "color"],
    category: "atmosphere",
    description: "Switches background canvas to calming Emerald Horizon (#34d399).",
    example: "MAHR, set theme color to emerald please",
    badgeText: "Theme Shift"
  },
  {
    id: "theme_celestial",
    phrase: "MAHR, set background to celestial cyber",
    keywords: ["celestial", "blue theme", "cyan", "sky"],
    category: "atmosphere",
    description: "Morphs core backdrop into high-contrast Celestial Cyber (#38bdf8).",
    example: "MAHR, change backdrop to celestial cyber",
    badgeText: "Theme Shift"
  },
  {
    id: "theme_gold",
    phrase: "MAHR, activate solar gold theme",
    keywords: ["gold", "amber", "solar", "yellow"],
    category: "atmosphere",
    description: "Transforms visual canvas to energetic Solar Gold (#fbbf24).",
    example: "MAHR, activate solar gold theme",
    badgeText: "Theme Shift"
  },

  // 2. Voice & Wake Control
  {
    id: "wake_word",
    phrase: "MAHR / Wake up",
    keywords: ["mahr", "mahir", "wake up", "hello"],
    category: "voice",
    description: "Triggers background microphone listener to connect MAHR when asleep or idle.",
    example: "Hey MAHR, wake up!",
    badgeText: "Wake-Word"
  },
  {
    id: "voice_sleep",
    phrase: "Disconnect MAHR / Go to sleep",
    keywords: ["disconnect", "sleep", "stop", "pause"],
    category: "voice",
    description: "Gracefully disconnects active voice stream and puts MAHR into low-power standby.",
    example: "MAHR, go to sleep for now",
    badgeText: "Session"
  },
  {
    id: "toggle_interrupt",
    phrase: "Allow interruptions / Turn off interruptions",
    keywords: ["interrupt", "allow interruption", "barge in"],
    category: "voice",
    description: "Toggles whether background voice input can interrupt MAHR while speaking.",
    example: "MAHR, allow interruptions",
    badgeText: "Sensitivity"
  },
  {
    id: "noise_gate",
    phrase: "Set noise gate to quiet room / noisy room",
    keywords: ["noise gate", "sensitivity", "filter static"],
    category: "voice",
    description: "Adjusts input microphone noise threshold to filter out static, fans, or room hums.",
    example: "Set noise gate to quiet room",
    badgeText: "Filter"
  },

  // 3. Navigation & Classroom
  {
    id: "voice_to_mindmap",
    phrase: "Voice to Mind Map / Map out relationships on chalkboard",
    keywords: [
      "voice to mind map",
      "voice to mindmap",
      "voice mind map",
      "map this out",
      "map out the",
      "map out this",
      "mind map of",
      "mind map for",
      "mindmap of",
      "mindmap for",
      "draw a mind map",
      "sketch a mind map",
      "create a mind map",
      "visualize relationships",
      "visualize workflow",
      "visualize the workflow",
      "workflow diagram",
      "relationship diagram"
    ],
    category: "study",
    description: "Converts spoken workflow, process, or entity relationships automatically into an interactive Mind Map on the Chalkboard.",
    example: "MAHR, map out the workflow for order fulfillment",
    badgeText: "Voice Mindmap"
  },
  {
    id: "convert_mind_map",
    phrase: "Convert notes to mind map",
    keywords: ["mind map", "mindmap", "concept map", "convert to mind map", "visual diagram"],
    category: "study",
    description: "Transforms highlighted Study Pad text or notes into an interactive visual Mind Map on the Whiteboard.",
    example: "MAHR, convert my notes into a mind map",
    badgeText: "Mind Map"
  },
  {
    id: "open_chalkboard",
    phrase: "Open interactive chalkboard",
    keywords: ["chalkboard", "whiteboard", "draw", "sketch"],
    category: "navigation",
    description: "Opens the real-time digital whiteboard for collaborative math and diagrams.",
    example: "MAHR, open interactive chalkboard",
    badgeText: "Whiteboard"
  },
  {
    id: "open_slides_studio",
    phrase: "Open Presentation Slides",
    keywords: ["presentation", "ppt", "slides", "slide deck", "make presentation", "create ppt", "google slides"],
    category: "study",
    description: "Opens the presentation and Google Slides studio right on the Classroom Whiteboard.",
    example: "MAHR, make a presentation or open slides",
    badgeText: "Slides Studio"
  },
  {
    id: "open_memory",
    phrase: "Open memory dashboard",
    keywords: ["memory", "history", "dashboard", "lessons"],
    category: "navigation",
    description: "Displays past study memories, learned concepts, and topic mastery logs.",
    example: "Show my memory dashboard",
    badgeText: "Memory"
  },
  {
    id: "open_journal",
    phrase: "Show chat journal",
    keywords: ["chat journal", "conversation logs", "transcript"],
    category: "navigation",
    description: "Launches the full conversation transcript and study journal modal.",
    example: "Open chat journal to see past notes",
    badgeText: "Journal"
  },

  // 4. Tools & Labs
  {
    id: "open_logic_lab",
    phrase: "Launch digital logic lab",
    keywords: ["logic lab", "circuits", "gates", "digital logic"],
    category: "tools",
    description: "Launches the 3D Digital Logic Design Lab for interactive circuit building.",
    example: "Open digital logic lab",
    badgeText: "Lab Tool"
  },
  {
    id: "open_sim_engine",
    phrase: "Run physics simulation",
    keywords: ["physics", "simulation", "adaptive engine"],
    category: "tools",
    description: "Launches the Adaptive Physics & Math Simulation Engine.",
    example: "Run physics simulation engine",
    badgeText: "Simulation"
  },
  {
    id: "open_ask_mahr",
    phrase: "Ask MAHR modal / Quick AI query",
    keywords: ["ask mahr", "ask myraa", "quick search", "ai query"],
    category: "tools",
    description: "Opens floating Ask MAHR fast AI assistant window for quick text questions.",
    example: "Ask MAHR about quantum physics",
    badgeText: "AI Assistant"
  },

  // 5. Study & Persona
  {
    id: "generate_schedule",
    phrase: "Auto generate daily study plan",
    keywords: ["generate tasks", "study plan", "schedule", "tasks"],
    category: "study",
    description: "Invokes AI task planner to build an optimized time-blocked daily schedule.",
    example: "MAHR, auto generate my study schedule for today",
    badgeText: "AI Planner"
  },
  {
    id: "persona_anime",
    phrase: "Switch persona to anime companion",
    keywords: ["anime", "playful", "cute", "heroine"],
    category: "study",
    description: "Changes MAHR's personality to a sweet, playful anime heroine.",
    example: "Switch persona to anime companion",
    badgeText: "Persona"
  },
  {
    id: "persona_human",
    phrase: "Switch persona to real human mentor",
    keywords: ["human", "mentor", "tutor", "partner"],
    category: "study",
    description: "Restores standard empathetic human academic mentor style.",
    example: "Switch persona to real human mentor",
    badgeText: "Persona"
  }
];

export function matchVoiceCommand(text: string): VoiceCommand | null {
  const lower = text.toLowerCase().trim();
  if (!lower) return null;
  for (const cmd of VOICE_COMMANDS_LIST) {
    if (cmd.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return cmd;
    }
  }
  return null;
}

/**
 * Checks if the spoken text represents a request or verbal description of complex relationships or workflows
 * that should automatically generate a Mind Map on the digital chalkboard.
 */
export function isVoiceToMindMapTrigger(text: string): {
  isMatch: boolean;
  topic: string;
  isWorkflow: boolean;
} {
  const lower = text.toLowerCase().trim();
  if (!lower || lower.length < 5) return { isMatch: false, topic: "", isWorkflow: false };

  // Explicit Mind Map / Workflow requests
  const explicitMindMapKeywords = [
    "mind map",
    "mindmap",
    "concept map",
    "map this out",
    "map out",
    "voice to mind map",
    "voice to mindmap",
    "voice mind map",
    "draw a mind map",
    "sketch a mind map",
    "create a mind map",
    "generate a mind map",
    "make a mind map",
    "visualize the relationship",
    "visualize relationships",
    "visualize the workflow",
    "visualize workflow",
    "workflow diagram",
    "relationship diagram"
  ];

  for (const kw of explicitMindMapKeywords) {
    if (lower.includes(kw)) {
      // Extract subject/topic if possible
      let topic = text;
      const idx = lower.indexOf(kw);
      if (idx !== -1) {
        const after = text.slice(idx + kw.length).replace(/^(of|for|about|between|on|showing|depicting|:|\s)+/i, "").trim();
        if (after.length > 2) {
          topic = after;
        }
      }
      const isWorkflow = lower.includes("flow") || lower.includes("work") || lower.includes("process") || lower.includes("step");
      return { isMatch: true, topic: topic || text, isWorkflow };
    }
  }

  // Complex relationship and workflow descriptions during speech:
  // e.g. "The workflow starts with user registration which triggers email verification, then leads to database storage and sends a welcome notification"
  // or "In this system architecture, client connects to API gateway, which routes to auth service and payment service..."
  const workflowKeywords = [
    "workflow",
    "process flow",
    "pipeline",
    "step by step",
    "lifecycle",
    "architecture of",
    "system architecture"
  ];
  const relationshipConnectors = [
    "connects to",
    "connected to",
    "leads to",
    "branches into",
    "depends on",
    "triggers",
    "passes data to",
    "routes to",
    "interacts with",
    "relationship between"
  ];

  const hasWorkflowTerm = workflowKeywords.some((w) => lower.includes(w));
  const connectorCount = relationshipConnectors.filter((c) => lower.includes(c)).length;

  // If text mentions workflow concepts or multiple relationship connectors with descriptive length
  if ((hasWorkflowTerm && (connectorCount >= 1 || lower.includes("step") || lower.includes("first"))) || connectorCount >= 2) {
    return {
      isMatch: true,
      topic: text,
      isWorkflow: hasWorkflowTerm || lower.includes("step") || lower.includes("flow")
    };
  }

  return { isMatch: false, topic: "", isWorkflow: false };
}

/**
 * Unified Voice Intent Classifier that merges sleep, wake-word, focus mode,
 * mind map, and shortcut command identification into a single consolidated call.
 */
export interface VoiceActionResult {
  type: "voice_to_mindmap" | "sleep" | "wake" | "focus_mode" | "voice_command" | "sketch" | "none";
  command?: VoiceCommand;
  topic?: string;
  isWorkflow?: boolean;
  isFocusDeactivate?: boolean;
  rawText: string;
}

export function detectVoiceAction(
  transcript: string,
  activeAgentFirstName: string = "mahr"
): VoiceActionResult {
  if (!transcript || !transcript.trim()) {
    return { type: "none", rawText: "" };
  }

  const lower = transcript.toLowerCase().trim();
  const agentNameLower = activeAgentFirstName.toLowerCase().trim();

  // 1. Check Voice-to-Mindmap (high priority for verbal concept/workflow mapping)
  const mindMapCheck = isVoiceToMindMapTrigger(transcript);
  if (mindMapCheck.isMatch) {
    return {
      type: "voice_to_mindmap",
      topic: mindMapCheck.topic,
      isWorkflow: mindMapCheck.isWorkflow,
      rawText: transcript
    };
  }

  // 2. Check Sleep / Standby
  const isSleep =
    lower.includes("sleep") ||
    lower.includes("so jao") ||
    lower.includes("sojao") ||
    lower.includes("go to sleep") ||
    lower.includes("night mahr") ||
    lower.includes("night myraa") ||
    lower.includes("standby") ||
    lower.includes("disconnect") ||
    lower.includes("shut down") ||
    lower.includes("turn off") ||
    lower.includes("chup ho jao") ||
    lower.includes("khuda hafiz") ||
    lower.includes("alvida") ||
    lower.includes("oyasumi");

  if (isSleep) {
    return { type: "sleep", rawText: transcript };
  }

  // 3. Check Wake Word
  const isWakeWord =
    lower.includes("mahr") ||
    lower.includes("mahir") ||
    lower.includes("mehar") ||
    lower.includes("myraa") ||
    lower.includes("maira") ||
    lower.includes("mira") ||
    lower.includes(agentNameLower) ||
    lower.includes("wake up") ||
    lower.includes("uth jao") ||
    lower.includes("uth ja") ||
    lower.includes("jago") ||
    lower.includes("jaag jao") ||
    lower.includes("hey mahr") ||
    lower.includes("hello mahr") ||
    lower.includes("hey myraa") ||
    lower.includes("hello myraa");

  if (isWakeWord) {
    return { type: "wake", rawText: transcript };
  }

  // 4. Focus Mode Voice Detector
  if (
    lower.includes("focus mode") ||
    lower.includes("hide distractions") ||
    lower.includes("hide the sidebar") ||
    lower.includes("center the visualizer")
  ) {
    const isDeactivate =
      lower.includes("off") ||
      lower.includes("deactivate") ||
      lower.includes("exit") ||
      lower.includes("stop") ||
      lower.includes("disable");
    return {
      type: "focus_mode",
      isFocusDeactivate: isDeactivate,
      rawText: transcript
    };
  }

  // 5. Match explicit registered voice command
  const matchedCmd = matchVoiceCommand(transcript);
  if (matchedCmd) {
    return {
      type: "voice_command",
      command: matchedCmd,
      rawText: transcript
    };
  }

  // 6. General Whiteboard / Sketch detection
  if (
    lower.includes("flowchart") ||
    lower.includes("flow chart") ||
    lower.includes("diagram") ||
    lower.includes("whiteboard") ||
    lower.includes("chalkboard") ||
    lower.includes("draw") ||
    lower.includes("sketch")
  ) {
    return {
      type: "sketch",
      topic: transcript,
      rawText: transcript
    };
  }

  return { type: "none", rawText: transcript };
}


