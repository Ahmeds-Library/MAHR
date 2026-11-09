import { ChatActionMode, SlashCommandItem } from "../types";

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    command: "/whiteboard",
    label: "Write on Chalkboard",
    description: "Open the classroom chalkboard and write formulas, notes, or proofs",
    category: "workspace",
    mode: "whiteboard",
    placeholder: "/whiteboard Explain Maxwell's equations with step-by-step derivation",
  },
  {
    command: "/code",
    label: "Live Code & Debug",
    description: "Generate clean, executable code and sync it to the Chalkboard",
    category: "workspace",
    mode: "code",
    placeholder: "/code Write a TypeScript binary search tree with traversal methods",
  },
  {
    command: "/slides",
    label: "Build Presentation Deck",
    description: "Research and launch an animated presentation in Slides Studio",
    category: "workspace",
    mode: "slides",
    placeholder: "/slides Quantum Computing & Cryptography in 2026",
  },
  {
    command: "/remember",
    label: "Save to Vector Memory",
    description: "Index a personal fact, exam deadline, or project into 128-D Vector Memory",
    category: "memory",
    mode: "memory",
    placeholder: "/remember My Operating Systems exam is next Monday",
  },
  {
    command: "/task",
    label: "Add Daily Task",
    description: "Create a prioritized task in your Daily Task Manager & Google Tasks",
    category: "workspace",
    placeholder: "/task Complete Linear Algebra problem set by 6 PM",
  },
  {
    command: "/mindmap",
    label: "Generate Mind Map",
    description: "Open the interactive Mind Map canvas for any topic",
    category: "diagram",
    placeholder: "/mindmap Neural Network Architectures & Transformers",
  },
  {
    command: "/flowchart",
    label: "Draw Flowchart",
    description: "Open the Flowchart diagramming studio on the whiteboard",
    category: "diagram",
    placeholder: "/flowchart OAuth 2.0 Authentication Flow",
  },
  {
    command: "/simulate",
    label: "Interactive 3D/Physics Sim",
    description: "Launch the interactive Simulation Engine on the chalkboard",
    category: "workspace",
    placeholder: "/simulate Pendulum harmonic motion with damping",
  },
  {
    command: "/screen",
    label: "Analyze Active Screen",
    description: "Inspect your live shared screen, code editor, or diagrams",
    category: "system",
    placeholder: "/screen Check my code and explain any bugs on screen",
  },
  {
    command: "/clear",
    label: "Clear Chalkboard Slate",
    description: "Wipe the active chalkboard drawings and reset the slate",
    category: "system",
    placeholder: "/clear",
  },
];

export interface ParsedTypedInstruction {
  cleanedPrompt: string;
  effectiveMode: ChatActionMode;
  immediateActions: Array<{ type: string; args?: any; badgeLabel: string }>;
  shouldSyncReplyToChalkboard: boolean;
  isExplicitMemorySave: boolean;
  isPresentationRequest: boolean;
  presentationTopic?: string;
}

/**
 * Layer 1 Service: Parses typed user input, `/slash` commands, Action Mode pills,
 * and natural language instructions (English, Urdu, and Roman Urdu) into concrete
 * MAHR workspace actions and specialized system directives.
 */
export function parseTypedInstruction(
  rawInput: string,
  activeMode: ChatActionMode = "auto"
): ParsedTypedInstruction {
  const trimmed = (rawInput || "").trim();
  let effectiveMode: ChatActionMode = activeMode;
  let cleanedPrompt = trimmed;
  const immediateActions: Array<{ type: string; args?: any; badgeLabel: string }> = [];
  let shouldSyncReplyToChalkboard = activeMode === "whiteboard" || activeMode === "code";
  let isExplicitMemorySave = activeMode === "memory";
  let isPresentationRequest = activeMode === "slides";
  let presentationTopic: string | undefined;

  // 1. Parse explicit /slash commands at the start of input
  if (trimmed.startsWith("/")) {
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const rest = trimmed.slice(parts[0].length).trim();

    switch (cmd) {
      case "/whiteboard":
      case "/chalkboard":
      case "/board":
        effectiveMode = "whiteboard";
        shouldSyncReplyToChalkboard = true;
        cleanedPrompt = rest || "Write a clear visual summary of our current topic on the chalkboard.";
        immediateActions.push({
          type: "open_chalkboard",
          badgeLabel: "Opened Classroom Chalkboard",
        });
        break;

      case "/code":
        effectiveMode = "code";
        shouldSyncReplyToChalkboard = true;
        cleanedPrompt =
          rest || "Write a clean, well-commented code implementation for our current topic.";
        immediateActions.push({
          type: "open_chalkboard",
          badgeLabel: "Synced Code to Chalkboard",
        });
        break;

      case "/slides":
      case "/ppt":
      case "/deck":
        effectiveMode = "slides";
        isPresentationRequest = true;
        presentationTopic = rest || "Strategic Technical Presentation";
        cleanedPrompt = rest || "Create a presentation deck";
        break;

      case "/remember":
      case "/memory":
        effectiveMode = "memory";
        isExplicitMemorySave = true;
        cleanedPrompt = rest || trimmed;
        break;

      case "/task":
      case "/todo":
        if (rest) {
          immediateActions.push({
            type: "add_daily_task",
            args: { title: rest, priority: "high", category: "study" },
            badgeLabel: `Added Task: ${rest.slice(0, 28)}`,
          });
        }
        cleanedPrompt = rest
          ? `I just added a daily task: "${rest}". Confirm it briefly and suggest the best first step.`
          : "Show me how to organize my study tasks for today.";
        break;

      case "/mindmap":
        immediateActions.push({
          type: "open_mindmap",
          args: { topic: rest || "Core Concept Architecture" },
          badgeLabel: "Opened Mind Map Canvas",
        });
        cleanedPrompt = rest
          ? `Create a structured mind map breakdown for: ${rest}`
          : "Create a structured mind map for our current study topic.";
        break;

      case "/flowchart":
        immediateActions.push({
          type: "open_flowchart",
          args: { topic: rest || "System Architecture Flow" },
          badgeLabel: "Opened Flowchart Studio",
        });
        cleanedPrompt = rest
          ? `Design a step-by-step flowchart process for: ${rest}`
          : "Design a step-by-step flowchart for our current topic.";
        break;

      case "/simulate":
      case "/sim":
        immediateActions.push({
          type: "open_sim_engine",
          args: { topic: rest },
          badgeLabel: "Launched Simulation Studio",
        });
        cleanedPrompt = rest
          ? `Launch and explain the interactive simulation for: ${rest}`
          : "Explain the interactive simulation on the chalkboard.";
        break;

      case "/clear":
        immediateActions.push({
          type: "clear_chalkboard",
          badgeLabel: "Cleared Chalkboard Slate",
        });
        cleanedPrompt = rest || "I have cleared the chalkboard slate. Ready for the next concept!";
        break;

      case "/screen":
        cleanedPrompt =
          rest || "Analyze my active shared screen in detail, including any visible code, errors, or diagrams.";
        break;

      default:
        break;
    }
  }

  // 2. Natural Language Intent Detection (English + Urdu + Roman Urdu) when not already matched
  const lower = cleanedPrompt.toLowerCase();

  // Check for Slides / Presentation intent
  if (!isPresentationRequest) {
    const pptPattern =
      /(?:make|create|generate|prepare|build|banao|bana do|banaye|chahiye)\s+(?:a\s+|an\s+)?(?:presentation|ppt|slides|deck|slide deck|google slides)(?:\s+(?:on|about|pe|par|for)\s+(.*))?/i;
    const reversePptPattern =
      /(?:presentation|ppt|slides|slide deck|google slides)\s+(?:banao|bana do|banaye|make|create|generate|chahiye)(?:\s+(?:on|about|pe|par|for)\s+(.*))?/i;
    const topicPptPattern = /(?:presentation|ppt|slides|google slides)\s+(?:on|about|pe|par|for)\s+(.*)/i;

    const pptMatch =
      cleanedPrompt.match(pptPattern) ||
      cleanedPrompt.match(reversePptPattern) ||
      cleanedPrompt.match(topicPptPattern);

    if (pptMatch || effectiveMode === "slides") {
      isPresentationRequest = true;
      let extractedTopic = (pptMatch?.[1] || "").trim().replace(/[?.!]+$/, "");
      if (!extractedTopic || extractedTopic.length < 2) {
        extractedTopic = cleanedPrompt
          .replace(
            /(?:make|create|generate|prepare|build|banao|bana do|banaye|chahiye|presentation|ppt|slides|slide deck|google slides|a|an|on|about|pe|par|for|please|plz|saath|internet|se|images|le|lo|kuch|khud|bana)/gi,
            ""
          )
          .trim()
          .replace(/[?.!]+$/, "");
      }
      presentationTopic = extractedTopic || "Strategic Presentation";
    }
  }

  // Check for Natural Language Chalkboard / Whiteboard / Code writing intent
  const chalkboardNaturalPattern =
    /\b(?:on\s+(?:the\s+)?(?:whiteboard|chalkboard|board|slate)|(?:whiteboard|chalkboard|board|slate)\s+(?:pe|par|pr|mein|me)|(?:write|draw|sketch|likho|likh\s+do|samjhao)\s+.*(?:whiteboard|chalkboard|board|slate))\b/i;

  if (!shouldSyncReplyToChalkboard && chalkboardNaturalPattern.test(lower)) {
    shouldSyncReplyToChalkboard = true;
    if (!immediateActions.some((a) => a.type === "open_chalkboard")) {
      immediateActions.push({
        type: "open_chalkboard",
        badgeLabel: "Synced to Classroom Chalkboard",
      });
    }
  }

  // Check for Natural Language Task Addition intent (e.g. "add daily task: Review physics" or "add task ...")
  const taskMatch = cleanedPrompt.match(
    /^(?:📋\s*)?(?:add\s+(?:a\s+)?(?:daily\s+)?task|create\s+task|task\s+add\s+karo|todo\s+add)\s*[:,-]?\s+(.+)$/i
  );
  if (taskMatch && !immediateActions.some((a) => a.type === "add_daily_task")) {
    const taskTitle = taskMatch[1].trim();
    if (taskTitle.length >= 2) {
      immediateActions.push({
        type: "add_daily_task",
        args: { title: taskTitle, priority: "medium", category: "study" },
        badgeLabel: `Added Task: ${taskTitle.slice(0, 28)}`,
      });
    }
  }

  // Check for Mind Map natural intent
  if (
    /\b(?:mind\s*map|concept\s*map)\b/i.test(lower) &&
    /\b(?:open|make|create|draw|generate|banao|show)\b/i.test(lower) &&
    !immediateActions.some((a) => a.type === "open_mindmap")
  ) {
    immediateActions.push({
      type: "open_mindmap",
      args: { topic: cleanedPrompt },
      badgeLabel: "Opened Mind Map Canvas",
    });
  }

  // Check for Flowchart natural intent
  if (
    /\b(?:flowchart|flow\s+diagram)\b/i.test(lower) &&
    /\b(?:open|make|create|draw|generate|banao|show)\b/i.test(lower) &&
    !immediateActions.some((a) => a.type === "open_flowchart")
  ) {
    immediateActions.push({
      type: "open_flowchart",
      args: { topic: cleanedPrompt },
      badgeLabel: "Opened Flowchart Studio",
    });
  }

  // Augment prompt with mode-specific guidance so MAHR responds appropriately
  let modeAugmentedPrompt = cleanedPrompt;
  if (effectiveMode === "whiteboard") {
    modeAugmentedPrompt = `[INSTRUCTION MODE: CLASSROOM CHALKBOARD] Write a well-structured markdown explanation with clear formulas, step-by-step derivations, or diagrams ready for the Classroom Chalkboard:\n${cleanedPrompt}`;
  } else if (effectiveMode === "code") {
    modeAugmentedPrompt = `[INSTRUCTION MODE: INTERACTIVE CODE & DEBUG] Provide production-grade, well-commented code inside a markdown code block along with a concise technical walkthrough:\n${cleanedPrompt}`;
  } else if (effectiveMode === "memory") {
    modeAugmentedPrompt = `[INSTRUCTION MODE: VECTOR MEMORY COMMIT] Acknowledge and confirm storing or recalling this personal fact/context in 128-D Vector Memory:\n${cleanedPrompt}`;
  }

  return {
    cleanedPrompt: modeAugmentedPrompt,
    effectiveMode,
    immediateActions,
    shouldSyncReplyToChalkboard,
    isExplicitMemorySave,
    isPresentationRequest,
    presentationTopic,
  };
}

/**
 * Extracts code blocks or structured markdown content from MAHR's reply
 * so it can be sent to the Digital Chalkboard cleanly.
 */
export function formatReplyForChalkboard(userPrompt: string, replyText: string): string {
  if (!replyText || !replyText.trim()) return "";
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `# 🧠 MAHR Live Chalkboard Session (${timestamp})\n**Prompt:** *${userPrompt.replace(
    /^\[INSTRUCTION MODE:[^\]]+\]\s*/i,
    ""
  )}*\n\n---\n\n${replyText}`;
}
