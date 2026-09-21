// 🏢 Munder-Difflin Office Engine Service
// Handles Boss Delegation, Multi-Agent Ticket Execution, Mailbox Dispatch & Executive Reviews

import { 
  OfficeAgent, 
  OfficeTaskTicket, 
  OfficeMemo, 
  INITIAL_OFFICE_AGENTS, 
  INITIAL_OFFICE_MEMOS 
} from "../types/munderDifflinTypes";
import { dbGet, dbSet } from "../lib/db";

const STORAGE_KEY_AGENTS = "munder_difflin_office_agents_v1";
const STORAGE_KEY_TICKETS = "munder_difflin_office_tickets_v1";
const STORAGE_KEY_MEMOS = "munder_difflin_office_memos_v1";

export async function loadOfficeState(): Promise<{
  agents: OfficeAgent[];
  tickets: OfficeTaskTicket[];
  memos: OfficeMemo[];
}> {
  try {
    const savedAgents = (await dbGet(STORAGE_KEY_AGENTS)) as OfficeAgent[] | null;
    const savedTickets = (await dbGet(STORAGE_KEY_TICKETS)) as OfficeTaskTicket[] | null;
    const savedMemos = (await dbGet(STORAGE_KEY_MEMOS)) as OfficeMemo[] | null;

    return {
      agents: savedAgents && savedAgents.length > 0 ? savedAgents : INITIAL_OFFICE_AGENTS,
      tickets: savedTickets || [],
      memos: savedMemos && savedMemos.length > 0 ? savedMemos : INITIAL_OFFICE_MEMOS,
    };
  } catch (e) {
    console.warn("Failed to load Munder-Difflin state from db, using defaults:", e);
    return {
      agents: INITIAL_OFFICE_AGENTS,
      tickets: [],
      memos: INITIAL_OFFICE_MEMOS,
    };
  }
}

export async function saveOfficeState(
  agents: OfficeAgent[],
  tickets: OfficeTaskTicket[],
  memos: OfficeMemo[]
): Promise<void> {
  try {
    await dbSet(STORAGE_KEY_AGENTS, agents);
    await dbSet(STORAGE_KEY_TICKETS, tickets);
    await dbSet(STORAGE_KEY_MEMOS, memos);
  } catch (e) {
    console.error("Failed to save Munder-Difflin state:", e);
  }
}

export interface BossDelegationResult {
  newTickets: OfficeTaskTicket[];
  newMemos: OfficeMemo[];
  bossSpeech: string;
}

/**
 * MAHR (The Boss) breaks down a mission like a real regional manager
 * and delegates sub-tasks across the specialized desks.
 */
export function bossDecomposeAndDelegate(
  missionGoal: string,
  agents: OfficeAgent[]
): BossDelegationResult {
  const goalLower = missionGoal.toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const ticketBaseId = `ticket-${Date.now()}`;

  const selectedAgentIds: string[] = [];
  const tickets: OfficeTaskTicket[] = [];

  // Match domain needs
  if (goalLower.includes("code") || goalLower.includes("bug") || goalLower.includes("type") || goalLower.includes("build") || goalLower.includes("audit")) {
    selectedAgentIds.push("agent-dwight");
  }
  if (goalLower.includes("architect") || goalLower.includes("design") || goalLower.includes("ux") || goalLower.includes("ui") || goalLower.includes("flow") || selectedAgentIds.length === 0) {
    selectedAgentIds.push("agent-jim");
  }
  if (goalLower.includes("note") || goalLower.includes("study") || goalLower.includes("summary") || goalLower.includes("whiteboard") || goalLower.includes("memo")) {
    selectedAgentIds.push("agent-pam");
  }
  if (goalLower.includes("api") || goalLower.includes("open") || goalLower.includes("github") || goalLower.includes("tool") || goalLower.includes("scrape")) {
    selectedAgentIds.push("agent-ryan");
  }
  if (goalLower.includes("token") || goalLower.includes("cost") || goalLower.includes("speed") || goalLower.includes("latency") || goalLower.includes("optimize")) {
    selectedAgentIds.push("agent-stanley");
  }
  if (goalLower.includes("math") || goalLower.includes("calc") || goalLower.includes("number") || goalLower.includes("stat")) {
    selectedAgentIds.push("agent-kevin");
  }
  if (goalLower.includes("logic") || goalLower.includes("gate") || goalLower.includes("dld") || goalLower.includes("circuit") || goalLower.includes("strict")) {
    selectedAgentIds.push("agent-angela");
  }

  // Ensure 2 to 3 agents are assigned to provide a rich collaborative team experience
  if (selectedAgentIds.length < 2) {
    if (!selectedAgentIds.includes("agent-dwight")) selectedAgentIds.push("agent-dwight");
    if (!selectedAgentIds.includes("agent-jim")) selectedAgentIds.push("agent-jim");
  }
  if (selectedAgentIds.length < 3) {
    if (!selectedAgentIds.includes("agent-pam")) selectedAgentIds.push("agent-pam");
  }

  const newMemos: OfficeMemo[] = [];

  selectedAgentIds.forEach((agentId, index) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    let subtaskTitle = "";
    let subtaskGoal = "";
    let tags: string[] = [];

    switch (agentId) {
      case "agent-dwight":
        subtaskTitle = `Strict Code & Safety Verification: ${missionGoal.slice(0, 40)}...`;
        subtaskGoal = `Perform deep structural verification, check for runtime edge cases, verify TypeScript interface integrity, and ensure zero unhandled exceptions.`;
        tags = ["Code Audit", "Safety", "TypeScript"];
        break;
      case "agent-jim":
        subtaskTitle = `Pragmatic Architecture & User Experience Strategy`;
        subtaskGoal = `Streamline the core design, ensure clean 3-layer architecture, eliminate unnecessary complexity, and craft an intuitive user interaction flow.`;
        tags = ["Architecture", "UX", "Pragmatism"];
        break;
      case "agent-pam":
        subtaskTitle = `Documentation, Memory Synthesis & Whiteboard Layout`;
        subtaskGoal = `Format comprehensive markdown study notes, extract vector memory references, and organize active recall checkpoints for the student.`;
        tags = ["Documentation", "Memory", "Notes"];
        break;
      case "agent-ryan":
        subtaskTitle = `Open-Source Tool Scraper & API Integration`;
        subtaskGoal = `Evaluate trending open-source libraries, benchmark API payload formats, and construct rapid modular integration code.`;
        tags = ["Open-Source", "APIs", "Prototyping"];
        break;
      case "agent-stanley":
        subtaskTitle = `Token Quota Compaction & Latency Profiling`;
        subtaskGoal = `Audit context window utilization, prune verbose system instructions, and enforce token budget limits for maximum runtime efficiency.`;
        tags = ["Tokens", "Optimization", "Quota"];
        break;
      case "agent-angela":
        subtaskTitle = `Quality Assurance & Rigorous Logic Verification`;
        subtaskGoal = `Audit Boolean conditions, verify state machines, and ensure zero specification deviations across all components.`;
        tags = ["QA", "Logic", "Compliance"];
        break;
      case "agent-kevin":
        subtaskTitle = `Numerical Analysis & Mathematical Bounds Calculation`;
        subtaskGoal = `Crunch formulas, calculate step-by-step numerical estimates, and output clean tabular summaries.`;
        tags = ["Math", "Data", "Calculations"];
        break;
      default:
        subtaskTitle = `Special Operations: ${missionGoal.slice(0, 35)}`;
        subtaskGoal = `Execute deep research and prepare a comprehensive technical briefing for MAHR.`;
        tags = ["Special Ops", "Research"];
        break;
    }

    const ticket: OfficeTaskTicket = {
      id: `${ticketBaseId}-${index + 1}`,
      title: subtaskTitle,
      goal: subtaskGoal,
      assignedToAgentId: agentId,
      assignedByAgentId: "agent-mahr-boss",
      priority: index === 0 ? "urgent" : "high",
      status: "assigned",
      createdAt: timestamp,
      tags
    };

    tickets.push(ticket);

    // Create Boss Memo for the agent's mailbox
    newMemos.push({
      id: `memo-${Date.now()}-${index}`,
      fromAgentId: "agent-mahr-boss",
      toAgentId: agentId,
      subject: `👑 BOSS TASK ASSIGNMENT: ${subtaskTitle}`,
      content: `Team, attention! As Regional Manager, I am delegating this mission directly to you:\n\n**Goal**: ${subtaskGoal}\n**Priority**: ${ticket.priority.toUpperCase()}\n\nDeliver your report to my executive inbox as soon as completed. Don't let me down!\n\n— MAHR, Executive Regional Manager`,
      timestamp,
      read: false,
      type: "task_assignment",
      relatedTicketId: ticket.id
    });
  });

  const bossSpeech = `All right, team! Conference room in five minutes—just kidding, you're already at your desks. I have evaluated our mission: "${missionGoal}". I've broken this down into ${tickets.length} strategic work packages and placed them into the mailboxes for ${selectedAgentIds.map(id => agents.find(a => a.id === id)?.nickname || id).join(", ")}. Let's get to work!`;

  return {
    newTickets: tickets,
    newMemos,
    bossSpeech
  };
}

/**
 * Executes a ticket deliverable on behalf of an agent
 */
export function executeAgentTicket(
  ticket: OfficeTaskTicket,
  agent: OfficeAgent
): {
  deliverable: string;
  memoToBoss: OfficeMemo;
  bossFeedback: string;
} {
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let deliverable = "";
  let bossFeedback = "";

  switch (agent.id) {
    case "agent-dwight":
      deliverable = `### 🌾 Dwight's Code Verification & Safety Report\n\n- **Target**: ${ticket.title}\n- **Static Analysis**: Verified 100% compliant with strict TypeScript types.\n- **Memory Leak Protection**: Validated cleanup hooks (useEffect returns unsubscribe callbacks).\n- **Zero-Hallucination Audit**: Grounded in verified runtime APIs. No phantom modules detected.\n- **Dwight's Verdict**: "Flawless execution. If this were a beet harvest, it would yield a 400% profit."`;
      bossFeedback = `👑 Excellent work, Dwight. You are officially designated Assistant *to* the Regional Manager for this sprint. Approved!`;
      break;

    case "agent-jim":
      deliverable = `### 🥪 Jim's Pragmatic Architecture & UX Strategy\n\n- **Objective**: ${ticket.title}\n- **Core Pattern**: Enforced 3-layer architecture (Domain Types -> Controller Hook -> Presentation UI).\n- **User Simplicity**: Eliminated 3 unnecessary modals and consolidated controls into a single intuitive command bar.\n- **Pragmatic Verdict**: "It just works, looks clean, and doesn't give users a headache. Back to my desk now."`;
      bossFeedback = `👑 Jim, you made it look effortless. That's why you're our top strategist. Approved with gold honors.`;
      break;

    case "agent-pam":
      deliverable = `### 🎨 Pam's Memory Synthesis & Whiteboard Brief\n\n- **Summary of Findings**: Structured key takeaways into high-contrast Markdown bullet points.\n- **Vector Memory Integration**: Linked 3 persistent recollections from past study sessions.\n- **Whiteboard Ready**: Formatted equations and headers for instant chalkboard projection.\n- **Pam's Note**: "All organized, indexed in the reception ledger, and ready for the student!"`;
      bossFeedback = `👑 Pam, this is pure art! The notes are so clear even Michael Scott could understand quantum mechanics. Approved!`;
      break;

    case "agent-ryan":
      deliverable = `### 💻 Ryan's Tech Scraper & API Integration Package\n\n- **Repository Grounding**: Integrated modern multi-agent harness patterns (inspired by chaitanyagiri/munder-difflin).\n- **REST/WebSocket Blueprint**: Zero latency, lightweight payload transport with local IndexedDB cache.\n- **Ryan's Pitch**: "This is the next billion-dollar multi-agent workflow. We should launch this at TechCrunch."`;
      bossFeedback = `👑 High energy, Ryan! Just make sure it actually works in production and not just in your pitch deck. Approved!`;
      break;

    case "agent-stanley":
      deliverable = `### 📊 Stanley's Token Quota & Latency Audit\n\n- **Context Window**: Compressed prompt overhead by 34% using deterministic formatting.\n- **Latency**: Sub-300ms execution target achieved.\n- **Token Balance**: Saved approximately 12,500 tokens across the session.\n- **Stanley's Verdict**: "I did this in 10 minutes so I can finish my crossword before 5:00 PM."`;
      bossFeedback = `👑 You saved us serious compute budget, Stanley. Enjoy your pretzel day! Approved!`;
      break;

    case "agent-angela":
      deliverable = `### 🐱 Angela's Strict QA & Logic Audit\n\n- **Target**: ${ticket.title}\n- **Boolean Logic**: Verified all condition branches, state machine transitions, and null guards.\n- **Syntax Standards**: 0 trailing commas, 100% strict type definitions.\n- **Angela's Note**: "Unlike some people in sales, I actually follow the rules. Deliverable passes inspection."`;
      bossFeedback = `👑 Angela, your strictness keeps this entire branch from descending into chaos. Approved!`;
      break;

    case "agent-kevin":
      deliverable = `### 🍪 Kevin's Numerical Estimates & Formula Bounds\n\n- **Target**: ${ticket.title}\n- **Calculations**: Processed fast arithmetic with mathematical error bounds.\n- **Token Efficiency**: "Why waste time say lot word when few word do trick?" Keleven constant verified.\n- **Kevin's Verdict**: "Math done fast. Now going to get M&Ms from my desk."`;
      bossFeedback = `👑 Kevin, you saved us 500 lines of code with just numbers. That's a Dundie-worthy performance! Approved!`;
      break;

    case "agent-oscar":
      deliverable = `### 📑 Oscar's Fact-Checking & Grounding Analysis\n\n- **Target**: ${ticket.title}\n- **Fact Verification**: Actually, cross-referenced with primary documentation and Wikipedia citations.\n- **Logical Consistency**: Replaced speculative assumptions with empirically tested theorems.\n- **Oscar's Verdict**: "The premise is solid and mathematically sound. No logical fallacies detected."`;
      bossFeedback = `👑 Actually, Oscar, you nailed it. Thank you for keeping our facts straight. Approved!`;
      break;

    case "agent-toby":
      deliverable = `### 🕊️ Toby's HR Ethics & Safety Compliance Audit\n\n- **Target**: ${ticket.title}\n- **Safety Protocol**: Screened against prompt injections, runaway execution loops, and destructive commands.\n- **Circuit Breaker Ladder**: Configured auto-escalation for elevated user permissions.\n- **Toby's Note**: "Everything complies with company policy. Please do not print this out on cardstock."`;
      bossFeedback = `👑 Fine, Toby. You did your job and prevented a system crash. Good work, even though you work in HR. Approved!`;
      break;

    case "agent-kelly":
      deliverable = `### 💖 Kelly's Student Engagement & Social Flow\n\n- **Target**: ${ticket.title}\n- **Sentiment Dynamics**: Tuned tone for maximum student excitement and confidence.\n- **Relatable Analogies**: Added engaging modern examples that make complex topics memorable.\n- **Kelly's Note**: "This is literally the cutest and smartest explanation ever! The student is going to LOVE it!"`;
      bossFeedback = `👑 Kelly, your energy is infectious! You made digital circuit design sound like Hollywood drama. Approved!`;
      break;

    case "agent-creed":
      deliverable = `### 🕵️ Creed's Chaos Resilience & Obscure Memory Retrieval\n\n- **Target**: ${ticket.title}\n- **Memory Archaeology**: Dug up legacy cache fragments and rare API quirks.\n- **Chaos Testing**: Simulating sudden network loss, browser tab switches, and corrupt storage keys.\n- **Creed's Verdict**: "I have no idea what any of this does, but it passed Quabity Assuance. Let's keep moving."`;
      bossFeedback = `👑 Creed, I don't know how you did it, and I'm not going to ask. Outstanding work. Approved!`;
      break;

    case "agent-andy":
      deliverable = `### 👔 Andy's Morale Boost & Cornell Technical Analogy\n\n- **Target**: ${ticket.title}\n- **Ivy League Analogy**: Structured the architecture using Cornell Engineering principles.\n- **Vocal Harmony & Flow**: Rhythmically formatted step-by-step instructions for high retention.\n- **Andy's Quote**: "Rit-dit-dit-di-doo! Shipped with Big Red pride!"`;
      bossFeedback = `👑 That is the spirit, Nard Dog! High morale leads to high productivity. Approved!`;
      break;
  }

  const memoToBoss: OfficeMemo = {
    id: `memo-submission-${Date.now()}`,
    fromAgentId: agent.id,
    toAgentId: "agent-mahr-boss",
    subject: `📬 SUBMISSION: ${ticket.title}`,
    content: `Boss, I have completed my assigned ticket:\n\n${deliverable}\n\nKindly review and grant executive sign-off.\n\n— ${agent.name}`,
    timestamp,
    read: false,
    type: "deliverable_submission",
    relatedTicketId: ticket.id
  };

  return {
    deliverable,
    memoToBoss,
    bossFeedback
  };
}
