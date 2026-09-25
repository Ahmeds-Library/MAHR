/**
 * Layer 3: Whiteboard Voice Intent & Natural Language Engine
 * Parses natural language commands for the Whiteboard and its Sub-Studios.
 * Integrates directly with MAHR Cognitive Tutor Persona.
 */

export type WhiteboardVoiceActionType =
  | "switch_studio"
  | "sketch_diagram"
  | "generate_slides"
  | "present_slides"
  | "clear_canvas"
  | "toggle_split"
  | "change_color"
  | "change_tool"
  | "undo"
  | "redo"
  | "ask_tutor"
  | "unknown";

export interface WhiteboardVoiceAction {
  type: WhiteboardVoiceActionType;
  targetStudio?: "chalkboard" | "slides" | "mindmap" | "flowchart" | "3d-simulation" | "dld";
  diagramTopic?: string;
  presetId?: string;
  tool?: "pen" | "smartpen" | "line" | "arrow" | "eraser" | "pan";
  color?: string;
  spokenFeedback: string;
}

export function parseWhiteboardVoiceCommand(transcript: string): WhiteboardVoiceAction {
  const text = transcript.toLowerCase().trim();

  // 1. Presentation Mode / Fullscreen Slides
  if (
    text.includes("present slide") ||
    text.includes("start slideshow") ||
    text.includes("start presentation") ||
    text.includes("fullscreen slide") ||
    text === "present" ||
    text === "play slides"
  ) {
    return {
      type: "present_slides",
      spokenFeedback: "Launching fullscreen presentation stage."
    };
  }

  // 2. Slides & Presentation Intent
  if (
    text.includes("slide") ||
    text.includes("presentation") ||
    text.includes("deck") ||
    text.includes("ppt") ||
    text.includes("powerpoint") ||
    text.includes("google slide")
  ) {
    const topic = text
      .replace(
        /(?:make|create|generate|prepare|build|open|show|start|a|an|the|presentation|slides|slide deck|google slides|ppt|powerpoint|on|about|for|please|plz)/gi,
        ""
      )
      .trim();
    return {
      type: "generate_slides",
      targetStudio: "slides",
      diagramTopic: topic || "Modern Computing & AI",
      spokenFeedback: `Opening Slides Studio to research and build your presentation on ${
        topic || "your topic"
      }.`
    };
  }

  // 3. Mind Map Intent
  if (
    text.includes("mind map") ||
    text.includes("mindmap") ||
    text.includes("concept map") ||
    text.includes("knowledge tree") ||
    text.includes("brainstorm")
  ) {
    const topic = text
      .replace(
        /(?:open|show|create|generate|switch to|draw|a|an|the|mind map|mindmap|concept map|knowledge tree|brainstorm|on|about|for|please|plz)/gi,
        ""
      )
      .trim();
    return {
      type: "switch_studio",
      targetStudio: "mindmap",
      diagramTopic: topic || undefined,
      spokenFeedback: `Switching to Interactive Mind Map Studio${topic ? ` for ${topic}` : ""}.`
    };
  }

  // 4. Flowchart & Architecture Intent
  if (
    text.includes("flowchart") ||
    text.includes("flow chart") ||
    text.includes("workflow") ||
    text.includes("architecture diagram") ||
    text.includes("state machine") ||
    text.includes("algorithm chart")
  ) {
    let presetId = "order-fraud-trigger";
    if (text.includes("agent") || text.includes("ai loop") || text.includes("subagent")) {
      presetId = "ai-agent-loop";
    } else if (text.includes("sort") || text.includes("search") || text.includes("bubble")) {
      presetId = "bubble-sort-flowchart";
    } else if (text.includes("auth") || text.includes("login") || text.includes("token")) {
      presetId = "user-auth-flow";
    }
    return {
      type: "switch_studio",
      targetStudio: "flowchart",
      presetId,
      spokenFeedback: `Switching to System Architecture Flowchart Studio.`
    };
  }

  // 5. Digital Logic Design (DLD) Intent
  if (
    text.includes("logic gate") ||
    text.includes("dld") ||
    text.includes("digital logic") ||
    text.includes("circuit") ||
    text.includes("flip flop") ||
    text.includes("adder") ||
    text.includes("truth table")
  ) {
    return {
      type: "switch_studio",
      targetStudio: "dld",
      spokenFeedback: `Launching Digital Logic Design Lab.`
    };
  }

  // 6. 3D WebGL / Physics Simulation Intent
  if (
    text.includes("simulation") ||
    text.includes("physics") ||
    text.includes("3d") ||
    text.includes("webgl") ||
    text.includes("liquid") ||
    text.includes("fluid")
  ) {
    return {
      type: "switch_studio",
      targetStudio: "3d-simulation",
      spokenFeedback: `Opening Universal 3D Physics Simulation Studio.`
    };
  }

  // 7. Return to 2D Slate / Chalkboard
  if (
    text.includes("chalkboard") ||
    text.includes("slate") ||
    text.includes("drawing") ||
    text.includes("board") ||
    text.includes("sketch board") ||
    text.includes("back to slate") ||
    text.includes("exit slides") ||
    text.includes("close slides")
  ) {
    return {
      type: "switch_studio",
      targetStudio: "chalkboard",
      spokenFeedback: `Returning to 2D Classroom Chalkboard.`
    };
  }

  // 8. Clear Canvas
  if (
    text.includes("clear canvas") ||
    text.includes("clear board") ||
    text.includes("wipe slate") ||
    text.includes("erase all") ||
    text.includes("clean board") ||
    text.includes("clean slate") ||
    text === "clear"
  ) {
    return {
      type: "clear_canvas",
      spokenFeedback: `Clearing the chalkboard slate.`
    };
  }

  // 9. Undo & Redo
  if (text.includes("undo") || text.includes("revert")) {
    return {
      type: "undo",
      spokenFeedback: `Undo last drawing stroke.`
    };
  }
  if (text.includes("redo")) {
    return {
      type: "redo",
      spokenFeedback: `Redo stroke.`
    };
  }

  // 10. Color Changes
  if (text.includes("color") || text.includes("chalk")) {
    if (text.includes("cyan") || text.includes("blue")) {
      return { type: "change_color", color: "#06b6d4", spokenFeedback: "Switched to Glowing Neon Cyan chalk." };
    }
    if (text.includes("gold") || text.includes("yellow") || text.includes("amber")) {
      return { type: "change_color", color: "#f59e0b", spokenFeedback: "Switched to Neon Gold chalk." };
    }
    if (text.includes("rose") || text.includes("red") || text.includes("pink")) {
      return { type: "change_color", color: "#f43f5e", spokenFeedback: "Switched to Neon Rose chalk." };
    }
    if (text.includes("mint") || text.includes("green")) {
      return { type: "change_color", color: "#10b981", spokenFeedback: "Switched to Neon Mint chalk." };
    }
    if (text.includes("purple") || text.includes("violet")) {
      return { type: "change_color", color: "#a855f7", spokenFeedback: "Switched to Neon Purple chalk." };
    }
    if (text.includes("white")) {
      return { type: "change_color", color: "#f8fafc", spokenFeedback: "Switched to White chalk." };
    }
  }

  // 11. Tool Changes
  if (text.includes("pen") && !text.includes("smart")) {
    return { type: "change_tool", tool: "pen", spokenFeedback: "Activated Drawing Pen." };
  }
  if (text.includes("smart pen") || text.includes("smartpen")) {
    return { type: "change_tool", tool: "smartpen", spokenFeedback: "Activated AI Smart Pen with auto shape recognition." };
  }
  if (text.includes("eraser")) {
    return { type: "change_tool", tool: "eraser", spokenFeedback: "Activated Eraser." };
  }
  if (text.includes("arrow")) {
    return { type: "change_tool", tool: "arrow", spokenFeedback: "Activated Arrow connector tool." };
  }
  if (text.includes("line")) {
    return { type: "change_tool", tool: "line", spokenFeedback: "Activated Line tool." };
  }
  if (text.includes("pan") || text.includes("hand")) {
    return { type: "change_tool", tool: "pan", spokenFeedback: "Activated Pan and Canvas Navigation." };
  }

  // 12. Toggle Split View / Notes
  if (
    text.includes("split view") ||
    text.includes("show notes") ||
    text.includes("hide notes") ||
    text.includes("toggle notes") ||
    text.includes("lecture notes")
  ) {
    return {
      type: "toggle_split",
      spokenFeedback: `Adjusting classroom workspace layout.`
    };
  }

  // 13. Diagram Sketching Commands on 2D Board
  if (
    text.includes("draw") ||
    text.includes("sketch") ||
    text.includes("diagram")
  ) {
    const topic = text.replace(/(?:draw|sketch|diagram|a|an|the|please|plz)/gi, "").trim();
    return {
      type: "sketch_diagram",
      targetStudio: "chalkboard",
      diagramTopic: topic,
      spokenFeedback: `Sketching ${topic || "technical diagram"} on the chalkboard.`
    };
  }

  // 14. Educational & Conceptual Inquiries (Tutor persona)
  if (
    text.startsWith("explain") ||
    text.startsWith("what is") ||
    text.startsWith("how does") ||
    text.startsWith("teach me") ||
    text.startsWith("tell me about") ||
    text.startsWith("solve") ||
    text.includes("feynman")
  ) {
    return {
      type: "ask_tutor",
      diagramTopic: transcript,
      spokenFeedback: `Analyzing "${transcript}" through our interactive learning pipeline.`
    };
  }

  return {
    type: "unknown",
    spokenFeedback: `I heard: "${transcript}". You can command me to create slides, switch to mind maps, draw circuits, or explain concepts.`
  };
}
