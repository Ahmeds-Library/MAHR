/**
 * MAHR AI Personal Assistant Voice Command Dispatcher
 * Parses natural language spoken inputs into structured system intents.
 */

export type AssistantIntentType =
  | "OPEN_WHITEBOARD"
  | "OPEN_TASKS"
  | "OPEN_MEMORY"
  | "OPEN_SIMULATION"
  | "OPEN_OFFICE"
  | "OPEN_SLIDES"
  | "OPEN_SETTINGS"
  | "OPEN_ROUTINES"
  | "OPEN_ASK_MAHR"
  | "OPEN_CLASSROOM"
  | "TOGGLE_FOCUS_MODE"
  | "TOGGLE_MUTE"
  | "SLEEP"
  | "WAKE"
  | "SET_THEME"
  | "UNKNOWN";

export interface AssistantDispatchResult {
  intent: AssistantIntentType;
  confidence: number;
  spokenFeedback?: string;
  payload?: any;
}

export function parseAssistantVoiceIntent(transcript: string): AssistantDispatchResult {
  const text = transcript.toLowerCase().trim();

  // Whiteboard / Chalkboard
  if (
    text.includes("chalkboard") ||
    text.includes("whiteboard") ||
    text.includes("board kholo") ||
    text.includes("draw") ||
    text.includes("diagram")
  ) {
    return {
      intent: "OPEN_WHITEBOARD",
      confidence: 0.95,
      spokenFeedback: "Opening Chalkboard Lab for live collaboration and diagrams.",
    };
  }

  // Daily Tasks
  if (
    text.includes("task") ||
    text.includes("to-do") ||
    text.includes("todo") ||
    text.includes("tasks dikhao") ||
    text.includes("remind me") ||
    text.includes("routine")
  ) {
    return {
      intent: "OPEN_TASKS",
      confidence: 0.92,
      spokenFeedback: "Displaying your daily tasks and active priorities.",
    };
  }

  // Memory Graph / Recollections
  if (
    text.includes("memory") ||
    text.includes("recall") ||
    text.includes("yaad") ||
    text.includes("knowledge graph") ||
    text.includes("what did i tell you")
  ) {
    return {
      intent: "OPEN_MEMORY",
      confidence: 0.9,
      spokenFeedback: "Accessing your personal vector memory graph.",
    };
  }

  // Simulation Studio
  if (
    text.includes("simulate") ||
    text.includes("simulation") ||
    text.includes("physics") ||
    text.includes("3d lab") ||
    text.includes("liquid state")
  ) {
    return {
      intent: "OPEN_SIMULATION",
      confidence: 0.92,
      spokenFeedback: "Launching the Universal Physics & Simulation Studio.",
    };
  }

  // Autonomous Office
  if (
    text.includes("office") ||
    text.includes("munder") ||
    text.includes("agents floor") ||
    text.includes("coworkers")
  ) {
    return {
      intent: "OPEN_OFFICE",
      confidence: 0.93,
      spokenFeedback: "Opening MAHR Autonomous Multi-Agent Office Floor.",
    };
  }

  // Presentation Slides
  if (
    text.includes("slide") ||
    text.includes("presentation") ||
    text.includes("deck") ||
    text.includes("pitch")
  ) {
    return {
      intent: "OPEN_SLIDES",
      confidence: 0.9,
      spokenFeedback: "Opening Presentation Slides Studio.",
    };
  }

  // Classroom
  if (
    text.includes("classroom") ||
    text.includes("assignment") ||
    text.includes("homework") ||
    text.includes("course")
  ) {
    return {
      intent: "OPEN_CLASSROOM",
      confidence: 0.91,
      spokenFeedback: "Opening Google Classroom & Homework Tutor.",
    };
  }

  // Focus Mode
  if (
    text.includes("focus mode") ||
    text.includes("do not disturb") ||
    text.includes("quiet mode") ||
    text.includes("focus shuru")
  ) {
    return {
      intent: "TOGGLE_FOCUS_MODE",
      confidence: 0.94,
      spokenFeedback: "Toggling deep focus mode.",
    };
  }

  // Settings
  if (
    text.includes("setting") ||
    text.includes("preferences") ||
    text.includes("configuration")
  ) {
    return {
      intent: "OPEN_SETTINGS",
      confidence: 0.9,
      spokenFeedback: "Opening System Settings.",
    };
  }

  // Routines
  if (
    text.includes("quick routines") ||
    text.includes("mahr routine") ||
    text.includes("daily routine") ||
    text.includes("morning routine") ||
    text.includes("good morning mahr")
  ) {
    return {
      intent: "OPEN_ROUTINES",
      confidence: 0.92,
      spokenFeedback: "Opening Mahr Smart Routines.",
    };
  }

  // Sleep
  if (
    text.includes("so jao") ||
    text.includes("go to sleep") ||
    text.includes("take a nap") ||
    text.includes("rest now")
  ) {
    return {
      intent: "SLEEP",
      confidence: 0.95,
      spokenFeedback: "Entering standby sleep mode. Wake me anytime with 'Hey Mahr'.",
    };
  }

  // Wake / Hey Mahr
  if (
    text.includes("hey mahr") ||
    text.includes("wake up") ||
    text.includes("sunoo") ||
    text.includes("hello mahr")
  ) {
    return {
      intent: "WAKE",
      confidence: 0.96,
      spokenFeedback: "I am awake and listening. How can I help you?",
    };
  }

  return {
    intent: "UNKNOWN",
    confidence: 0.2,
  };
}
