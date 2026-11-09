import {
  ActiveWorkspacePage,
  MascotAttentionReaction,
  UserInteractionContext,
  UserWorkActionType,
  WorkspacePageFlags,
} from "./mascotPageContextTypes";

/**
 * Resolves the highest-priority active workspace page from modal/view flags.
 */
export function resolveActiveWorkspacePage(
  flags: WorkspacePageFlags
): ActiveWorkspacePage {
  if (flags.isWhiteboardOpen) return "whiteboard";
  if (flags.isSimulationStudioOpen) return "simulation_studio";
  if (flags.isSlidesStudioOpen) return "slides_studio";
  if (flags.isMunderDifflinOpen) return "office";
  if (flags.isClassroomOpen) return "classroom";
  if (flags.isStudyPadOpen) return "study_pad";
  if (flags.isDailyTaskManagerOpen) return "daily_tasks";
  if (flags.showMemoryDashboard) return "memory_dashboard";
  if (flags.showKnowledgeGraph) return "knowledge_graph";
  if (flags.showChatJournal) return "chat_journal";
  if (flags.isSubAgentsStudioOpen) return "subagents_studio";
  if (flags.isRLStudioOpen) return "rl_studio";
  if (flags.showSettings) return "settings";
  return "home";
}

/**
 * Returns whether the active page is a full-screen immersive workspace where
 * smart edge-peek should activate if the user works near the bottom-right corner.
 */
export function isFullScreenWorkspacePage(page: ActiveWorkspacePage): boolean {
  return page !== "home";
}

// Keep a rolling memory of recent replies so the mascot never repeats the same remark twice in a row
const recentRepliesHistory: string[] = [];

function pickNonRepeatingReply(candidates: string[]): string {
  const available = candidates.filter(
    (item) => !recentRepliesHistory.includes(item)
  );
  const pool = available.length > 0 ? available : candidates;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  recentRepliesHistory.push(chosen);
  if (recentRepliesHistory.length > 6) {
    recentRepliesHistory.shift();
  }
  return chosen;
}

/**
 * Extracts a short, clean human-readable label from a DOM target if the user
 * clicked or focused a meaningful button, tab, or input control.
 */
export function extractElementContextLabel(
  target: EventTarget | null
): UserInteractionContext {
  if (!target || !(target instanceof HTMLElement)) {
    return {};
  }

  const interactiveEl =
    target.closest("button, a, [role='button'], input, textarea, select, canvas") ||
    target;
  const tag = interactiveEl.tagName.toLowerCase();
  const isInteractiveControl =
    tag === "button" ||
    tag === "a" ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "canvas" ||
    interactiveEl.getAttribute("role") === "button";

  const rawLabel =
    interactiveEl.getAttribute("aria-label") ||
    interactiveEl.getAttribute("title") ||
    (interactiveEl instanceof HTMLInputElement ||
    interactiveEl instanceof HTMLTextAreaElement
      ? interactiveEl.placeholder
      : "") ||
    interactiveEl.textContent ||
    "";

  const cleaned = rawLabel.replace(/\s+/g, " ").trim();
  const shortLabel =
    cleaned.length >= 2 && cleaned.length <= 28 ? cleaned : undefined;

  return {
    targetLabel: shortLabel,
    targetTag: tag,
    isInteractiveControl,
  };
}

const PAGE_SWITCH_REPLIES: Record<ActiveWorkspacePage, string[]> = {
  home: [
    "Back at main base! Ready whenever you are.",
    "Home sweet hub! What should we explore next?",
    "I'm right here in the corner if you need me!",
  ],
  whiteboard: [
    "Ooh, Chalkboard time! Let's sketch something cool.",
    "I love seeing ideas come to life on the board!",
    "Canvas is wide open—let's map it out together.",
  ],
  simulation_studio: [
    "Simulation Lab! This is going to look awesome.",
    "Ooh, let's test some live physics and parameters!",
    "Lab mode engaged—let's see how the model behaves.",
  ],
  study_pad: [
    "Study Pad open! Let's capture the key insights.",
    "Ready for a great focus session with your notes!",
    "Nothing beats a clean set of study notes.",
  ],
  daily_tasks: [
    "Let's crush today's goals one by one!",
    "Task list ready—you've totally got this!",
    "Checking in on your daily milestones!",
  ],
  classroom: [
    "Classroom session! Excited to learn alongside you.",
    "Let's dive into today's coursework together!",
  ],
  memory_dashboard: [
    "Looking through our long-term memory vault!",
    "So many great moments and insights stored here.",
  ],
  knowledge_graph: [
    "Look at all those connected ideas in the graph!",
    "Mapping how every concept links together is so cool.",
  ],
  chat_journal: [
    "Flipping through our past conversations!",
    "Always nice to revisit our journal threads.",
  ],
  slides_studio: [
    "Slides Studio! Let's build a standout deck.",
    "Time to craft some crisp visual slides!",
  ],
  office: [
    "Stepping into the virtual office!",
    "Let's see what the team is up to in the office.",
  ],
  subagents_studio: [
    "Checking in on your specialized AI sub-agents!",
    "Which specialist persona are we teaming up with?",
  ],
  rl_studio: [
    "Tuning the neural reinforcement parameters!",
    "Love seeing the adaptive learning curves in action.",
  ],
  settings: [
    "Tweaking the setup to feel just right!",
    "Dialing in your custom preferences.",
  ],
};

/**
 * Computes both an immediate physical reaction (for 100% of user actions)
 * and a warm, authentic conversational English reply (triggered randomly so it never feels spammy).
 */
export function computeMascotWorkReaction(
  page: ActiveWorkspacePage,
  actionType: UserWorkActionType,
  tickCounter = 0,
  context?: UserInteractionContext,
  shouldShowBubble = false
): MascotAttentionReaction {
  const id = `${page}-${actionType}-${tickCounter}`;
  const label = context?.targetLabel;

  // 1. Page Navigation Reaction
  if (actionType === "page_switch") {
    return {
      id,
      page,
      actionType,
      expression: page === "home" ? "happy" : "excited",
      badgeIcon: page === "home" ? "heart" : "compass",
      statusText: pickNonRepeatingReply(PAGE_SWITCH_REPLIES[page]),
      shouldShowBubble,
      accentColor: "#38bdf8",
      headMotion: page === "home" ? "cheer_bounce" : "curious_tilt",
    };
  }

  // 2. Chalkboard / Whiteboard Actions
  if (page === "whiteboard") {
    if (actionType === "drawing") {
      return {
        id,
        page,
        actionType,
        expression: "curious",
        badgeIcon: "pen",
        statusText: pickNonRepeatingReply([
          "Ooh, I like how that diagram is taking shape!",
          "Nice stroke! Visual sketching makes everything clearer.",
          "That layout is looking super clean!",
          "Love where this sketch is going—keep going!",
        ]),
        shouldShowBubble,
        accentColor: "#38bdf8",
        headMotion: "curious_tilt",
      };
    }
    if (actionType === "typing") {
      return {
        id,
        page,
        actionType,
        expression: "analytical",
        badgeIcon: "code",
        statusText: pickNonRepeatingReply([
          "Adding labels to the board—super helpful!",
          "Great breakdown! Writing it out really locks it in.",
          "Tap me anytime if you want me to expand on that note!",
        ]),
        shouldShowBubble,
        accentColor: "#a855f7",
        headMotion: "analytical_scan",
      };
    }
    return {
      id,
      page,
      actionType,
      expression: "happy",
      badgeIcon: "sparkles",
      statusText: label
        ? `Switching to "${label}"—nice choice!`
        : pickNonRepeatingReply([
            "Good call! Let's try that tool on the board.",
            "Organizing the canvas like a pro!",
          ]),
      shouldShowBubble,
      accentColor: "#38bdf8",
      headMotion: "attentive_nod",
    };
  }

  // 3. Simulation Studio Actions
  if (page === "simulation_studio") {
    return {
      id,
      page,
      actionType,
      expression: actionType === "typing" ? "analytical" : "excited",
      badgeIcon: "code",
      statusText: pickNonRepeatingReply([
        "Ooh, tweaking that variable changes the whole dynamic!",
        "Look at how responsive that simulation is!",
        "I love experimenting with live scenarios like this.",
        "What happens if we push that parameter a little further?",
      ]),
      shouldShowBubble,
      accentColor: "#34d399",
      headMotion: "analytical_scan",
    };
  }

  // 4. Study Pad Actions
  if (page === "study_pad") {
    return {
      id,
      page,
      actionType,
      expression: actionType === "typing" ? "analytical" : "happy",
      badgeIcon: "book",
      statusText: pickNonRepeatingReply([
        "Those notes are coming together so nicely!",
        "Great focus! Writing it in your own words is the best way to learn.",
        "Let me know if you want to turn these notes into a quick quiz!",
        "Solid point—that's definitely worth highlighting.",
      ]),
      shouldShowBubble,
      accentColor: "#c084fc",
      headMotion: "attentive_nod",
    };
  }

  // 5. Daily Tasks Actions
  if (page === "daily_tasks") {
    return {
      id,
      page,
      actionType,
      expression: "excited",
      badgeIcon: "check",
      statusText: pickNonRepeatingReply([
        "Boom! Another step forward—you're on a roll!",
        "Look at that momentum! Keep knocking them out.",
        "Staying organized makes the whole day feel lighter.",
        "Nice! Every little task checked off counts.",
      ]),
      shouldShowBubble,
      accentColor: "#34d399",
      headMotion: "cheer_bounce",
    };
  }

  // 6. Slides Studio Actions
  if (page === "slides_studio") {
    return {
      id,
      page,
      actionType,
      expression: "curious",
      badgeIcon: "sparkles",
      statusText: pickNonRepeatingReply([
        "That slide structure is looking sharp!",
        "Clean visuals always make a presentation pop.",
        "Need a punchy headline for this slide? Just ask!",
      ]),
      shouldShowBubble,
      accentColor: "#f472b6",
      headMotion: "curious_tilt",
    };
  }

  // 7. Memory Vault & Knowledge Graph Actions
  if (page === "memory_dashboard" || page === "knowledge_graph") {
    return {
      id,
      page,
      actionType,
      expression: "analytical",
      badgeIcon: "brain",
      statusText: pickNonRepeatingReply([
        "It's amazing how all these topics connect together!",
        "I've got all these details safely tucked in memory for you.",
        "Connecting the dots across your learning journey!",
      ]),
      shouldShowBubble,
      accentColor: "#a855f7",
      headMotion: "analytical_scan",
    };
  }

  // 8. General / Home Hub / Other Page Actions
  if (actionType === "typing") {
    return {
      id,
      page,
      actionType,
      expression: "analytical",
      badgeIcon: "sparkles",
      statusText: pickNonRepeatingReply([
        "Ooh, working on something interesting? I'm right here if you need me!",
        "Love the focus! Let me know if you want to brainstorm together.",
        "You're in the zone right now!",
      ]),
      shouldShowBubble,
      accentColor: "#38bdf8",
      headMotion: "analytical_scan",
    };
  }

  if (actionType === "clicking" && label) {
    return {
      id,
      page,
      actionType,
      expression: "curious",
      badgeIcon: "sparkles",
      statusText: pickNonRepeatingReply([
        `Checking out "${label}"? Nice!`,
        `Ooh, "${label}"—let's see what's in there!`,
        "Good pick! I'm following right along.",
      ]),
      shouldShowBubble,
      accentColor: "#38bdf8",
      headMotion: "attentive_nod",
    };
  }

  if (actionType === "scrolling") {
    return {
      id,
      page,
      actionType,
      expression: "curious",
      badgeIcon: "compass",
      statusText: pickNonRepeatingReply([
        "Scanning through the details—take your time!",
        "Let me know if anything catches your eye!",
      ]),
      shouldShowBubble,
      accentColor: "#38bdf8",
      headMotion: "curious_tilt",
    };
  }

  return {
    id,
    page,
    actionType,
    expression: "happy",
    badgeIcon: "heart",
    statusText: pickNonRepeatingReply([
      "Right by your side if you want to bounce around any ideas!",
      "Love seeing you in flow—just tap me if you need a hand!",
      "Everything's looking smooth! Keep it up.",
    ]),
    shouldShowBubble,
    accentColor: "#38bdf8",
    headMotion: "attentive_nod",
  };
}
