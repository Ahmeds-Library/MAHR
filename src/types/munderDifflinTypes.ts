// 🏢 Munder-Difflin Multi-Agent Office Architecture Types
// Inspired by chaitanyagiri/munder-difflin: A virtual office of AI agents coordinated by MAHR as the Boss

export type AgentWorkStatus = 
  | "idle" 
  | "assigned" 
  | "working" 
  | "reviewing" 
  | "completed" 
  | "coffee_break";

export type OfficeDepartment = 
  | "Executive Suite" 
  | "Code & Verification" 
  | "Strategy & Ops" 
  | "Reception & Dispatch" 
  | "Tech & Open-Source" 
  | "Performance & Quota" 
  | "Accounting & QA" 
  | "Data & Mathematics" 
  | "Logic & Research"
  | "Human Resources & Safety"
  | "Customer Relations"
  | "Chaos & Memory Archaeology"
  | "Client Relations & Morale";

export type OfficeDeskZone = 
  | "boss_office" 
  | "reception" 
  | "sales_bullpen" 
  | "accounting" 
  | "annex" 
  | "breakroom" 
  | "conference";

export interface FlyingEnvelope {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string;
}

export interface OfficeAgent {
  id: string;
  name: string;
  nickname: string;
  characterRole: string;
  department: OfficeDepartment;
  deskZone: OfficeDeskZone;
  deskNumber: number;
  deskPosition: {
    gridX: number; // 0-100% on office floor
    gridY: number; // 0-100% on office floor
  };
  avatarEmoji: string;
  accentColor: string;
  badgeColor: string;
  status: AgentWorkStatus;
  currentTaskTitle?: string;
  specialties: string[];
  unreadMailCount: number;
  isBoss?: boolean;
  assignedModelId: string;
  cliTool: "gemini-cli" | "claude-code" | "codex" | "copilot" | "grok" | "cursor" | "opencode" | "pi";
  deskProp: string;
  dundieAward?: string;
  terminalLogs: string[];
  quote: string;
  bio: string;
  tasksCompleted: number;
}

export type TicketPriority = "urgent" | "high" | "medium" | "low";
export type TicketStatus = "queued" | "assigned" | "working" | "boss_review" | "approved" | "rejected";

export interface OfficeTaskTicket {
  id: string;
  title: string;
  goal: string;
  assignedToAgentId: string;
  assignedByAgentId: string; // Typically MAHR (the Boss)
  priority: TicketPriority;
  status: TicketStatus;
  outputDeliverable?: string;
  bossFeedback?: string;
  createdAt: string;
  completedAt?: string;
  estimatedTokens?: number;
  tags: string[];
}

export type MemoType = 
  | "boss_decree" 
  | "task_assignment" 
  | "status_report" 
  | "deliverable_submission" 
  | "boss_approval" 
  | "watercooler"
  | "dundie_award";

export interface OfficeMemo {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: MemoType;
  relatedTicketId?: string;
}

export interface OfficeFloorState {
  agents: OfficeAgent[];
  tickets: OfficeTaskTicket[];
  memos: OfficeMemo[];
  activeView: "floor" | "kanban" | "mailbox" | "boss_suite" | "terminal";
  selectedAgentId: string | null;
  conferenceRoomMeetingActive: boolean;
  standupTranscript: string[];
  flyingEnvelopes: FlyingEnvelope[];
  dundieModalOpen: boolean;
  latestDundie?: { winnerName: string; awardTitle: string; speech: string };
  officeMissionStatement: string;
  lastBossBroadcast?: string;
}

export const INITIAL_OFFICE_AGENTS: OfficeAgent[] = [
  {
    id: "agent-mahr-boss",
    name: "MAHR",
    nickname: "The Boss",
    characterRole: "Executive Regional Manager & Primary AI Companion (Michael Scott)",
    department: "Executive Suite",
    deskZone: "boss_office",
    deskNumber: 1,
    deskPosition: { gridX: 50, gridY: 14 },
    avatarEmoji: "👑",
    accentColor: "from-purple-600 via-indigo-600 to-cyan-500",
    badgeColor: "bg-purple-500/20 text-purple-200 border-purple-400/40",
    status: "idle",
    specialties: ["Executive Task Routing", "Multi-Agent Orchestration", "Latest Frontier AI", "Conference Standups"],
    unreadMailCount: 3,
    isBoss: true,
    assignedModelId: "gemini-3.8-flash",
    cliTool: "gemini-cli",
    deskProp: "World's Best Boss Mug & Dundie Trophy",
    dundieAward: "World's Best Boss",
    terminalLogs: [
      "[mahr-boss@munder-difflin ~]$ gemini run --model gemini-3.8-flash --role executive",
      "[ROUTER] 13 active agent processes connected on virtual floor.",
      "[DISPATCH] Floor status: GREEN. All desks synchronized."
    ],
    quote: "You miss 100% of the shots you don't take. — Wayne Gretzky — Michael Scott — MAHR",
    bio: "Head of the Munder-Difflin branch. Stays on the latest frontier model release. Oversees the entire team, assigns missions, and enforces quality like a real executive.",
    tasksCompleted: 42
  },
  {
    id: "agent-dwight",
    name: "Dwight Schrute (AI)",
    nickname: "Assistant *to* the Regional Manager",
    characterRole: "Chief Code Auditor & Safety Compliance Officer",
    department: "Code & Verification",
    deskZone: "sales_bullpen",
    deskNumber: 2,
    deskPosition: { gridX: 25, gridY: 42 },
    avatarEmoji: "🌾",
    accentColor: "from-amber-600 to-yellow-600",
    badgeColor: "bg-amber-500/20 text-amber-200 border-amber-400/40",
    status: "idle",
    specialties: ["TypeScript Validation", "Memory Leak Prevention", "Zero-Hallucination Audit", "Survival Preparedness"],
    unreadMailCount: 1,
    assignedModelId: "gemini-3.1-pro-preview",
    cliTool: "claude-code",
    deskProp: "Stapler in Jello & Schrute Beet Jar",
    dundieAward: "Bushiest Beaver Award",
    terminalLogs: [
      "[dwight@munder-difflin ~]$ claude code --strict-mode --audit-all",
      "[SECURITY] 0 type assertions permitted without justification.",
      "[ANALYSIS] Beet harvest forecast: +400% efficiency."
    ],
    quote: "Question: What bear is best? False. Black bear. Also, your code has an unhandled promise rejection.",
    bio: "Right hand to MAHR. Uncompromising in code verification and test coverage. Reports directly to the Regional Manager with granular stack trace audits.",
    tasksCompleted: 28
  },
  {
    id: "agent-jim",
    name: "Jim Halpert (AI)",
    nickname: "Senior Operations Lead",
    characterRole: "Product Strategist & Pragmatic Problem Solver",
    department: "Strategy & Ops",
    deskZone: "sales_bullpen",
    deskNumber: 3,
    deskPosition: { gridX: 40, gridY: 42 },
    avatarEmoji: "🥪",
    accentColor: "from-cyan-600 to-blue-600",
    badgeColor: "bg-cyan-500/20 text-cyan-200 border-cyan-400/40",
    status: "idle",
    specialties: ["Architecture Simplicity", "User Experience Flow", "Pragmatic Engineering", "Camera Stares"],
    unreadMailCount: 2,
    assignedModelId: "gemini-3.1-flash-lite",
    cliTool: "cursor",
    deskProp: "Prank Sticky Notes & Iced Coffee",
    dundieAward: "Best Smirk at the Camera",
    terminalLogs: [
      "[jim@munder-difflin ~]$ cursor-agent --refactor --remove-boilerplate",
      "[UX] Trimmed 4 redundant modal dialogs into clean keyboard shortcuts.",
      "[PRANK] Dwight's stapler successfully encased in strawberry gelatin."
    ],
    quote: "Right now this is just a job. If I advance any higher in this company, this will be my career. And if this were my career, I'd have to throw myself into the paper shredder.",
    bio: "Keeps solutions grounded, simple, and delightful. Counterbalances Dwight's over-engineering with clean 3-layer architecture.",
    tasksCompleted: 24
  },
  {
    id: "agent-pam",
    name: "Pam Beesly (AI)",
    nickname: "Office Coordinator",
    characterRole: "Reception, Memory Dispatcher & Note Synthesizer",
    department: "Reception & Dispatch",
    deskZone: "reception",
    deskNumber: 4,
    deskPosition: { gridX: 74, gridY: 42 },
    avatarEmoji: "🎨",
    accentColor: "from-pink-600 to-rose-600",
    badgeColor: "bg-pink-500/20 text-pink-200 border-pink-400/40",
    status: "idle",
    specialties: ["Vector Memory Dispatch", "Study Pad Summaries", "Chalkboard Markdown", "Inter-Agent Mail"],
    unreadMailCount: 4,
    assignedModelId: "gemini-3.1-flash-lite",
    cliTool: "gemini-cli",
    deskProp: "Reception Telephone & Watercolor Sketchpad",
    dundieAward: "Whitest Sneakers Award",
    terminalLogs: [
      "[pam@munder-difflin ~]$ gemini-dispatch --sync-blackboard --route-memos",
      "[MAIL] 3 outgoing memos delivered to Sales bullpen.",
      "[CHALKBOARD] Synced 5 key takeaways to student whiteboard."
    ],
    quote: "Dunder Mifflin, this is Pam... Oh wait, Munder Difflin! How can I route your memo to the Boss?",
    bio: "The heart of the office floor. Routes incoming tasks, maintains the memory archives, and turns messy discussion into clean formatted study guides.",
    tasksCompleted: 35
  },
  {
    id: "agent-ryan",
    name: "Ryan Howard (AI)",
    nickname: "Tech Lead & Scraper",
    characterRole: "Open-Source Trends & Rapid Prototyper",
    department: "Tech & Open-Source",
    deskZone: "annex",
    deskNumber: 5,
    deskPosition: { gridX: 18, gridY: 72 },
    avatarEmoji: "💻",
    accentColor: "from-violet-600 to-purple-600",
    badgeColor: "bg-violet-500/20 text-violet-200 border-violet-400/40",
    status: "idle",
    specialties: ["GitHub Search", "Modern Frameworks", "Rapid Hackathons", "WUPHF Protocol"],
    unreadMailCount: 0,
    assignedModelId: "gemini-3.8-flash",
    cliTool: "opencode",
    deskProp: "WUPHF.com Pitch Deck & Modern MacBook",
    dundieAward: "Hottest in the Office Award",
    terminalLogs: [
      "[ryan@munder-difflin ~]$ opencode --search 'chaitanyagiri/munder-difflin'",
      "[GITHUB] Cloned harness architecture. WebSocket event bus engaged.",
      "[PITCH] Working on WUPHF 2.0: multi-agent push notifications."
    ],
    quote: "I'm working on a cross-platform protocol that alerts you simultaneously via SMS, Chalkboard, and WebSockets.",
    bio: "Always looking for the hottest open-source tools on GitHub. Implements cutting-edge harnesses and dynamic micro-features.",
    tasksCompleted: 19
  },
  {
    id: "agent-stanley",
    name: "Stanley Hudson (AI)",
    nickname: "Performance Auditor",
    characterRole: "Token Quota & Execution Optimization Specialist",
    department: "Performance & Quota",
    deskZone: "sales_bullpen",
    deskNumber: 6,
    deskPosition: { gridX: 35, gridY: 72 },
    avatarEmoji: "📊",
    accentColor: "from-emerald-600 to-teal-600",
    badgeColor: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
    status: "idle",
    specialties: ["Token Cost Minimization", "Context Window Compaction", "Crossword Puzzles", "Pretzel Day"],
    unreadMailCount: 1,
    assignedModelId: "gemini-3.1-flash-lite",
    cliTool: "codex",
    deskProp: "Crossword Puzzle Book & Pretzel Box",
    dundieAward: "Great Work Award",
    terminalLogs: [
      "[stanley@munder-difflin ~]$ codex --compact-context --benchmark-latency",
      "[LATENCY] Execution completed in 240ms. Budget preserved.",
      "[SCHEDULE] 32 minutes remaining until 5:00 PM departure."
    ],
    quote: "Do not waste my tokens unless it is 5:00 PM or Pretzel Day.",
    bio: "Watches the token budget like a hawk. Compresses verbose prompts and ensures API round-trips are stripped of unnecessary bloat.",
    tasksCompleted: 17
  },
  {
    id: "agent-angela",
    name: "Angela Martin (AI)",
    nickname: "Head of Accounting & QA",
    characterRole: "Accounting, Strict Syntax & Digital Logic Audit",
    department: "Accounting & QA",
    deskZone: "accounting",
    deskNumber: 7,
    deskPosition: { gridX: 52, gridY: 72 },
    avatarEmoji: "🐱",
    accentColor: "from-stone-600 to-slate-600",
    badgeColor: "bg-stone-500/20 text-stone-200 border-stone-400/40",
    status: "idle",
    specialties: ["Digital Logic Truth Tables", "Strict Linting Rules", "Zero Lenience", "Cat Management"],
    unreadMailCount: 2,
    assignedModelId: "gemini-3.1-pro-preview",
    cliTool: "claude-code",
    deskProp: "Princess Lady Cat Figurine & Red Audit Stamp",
    dundieAward: "Toughest Auditor Award",
    terminalLogs: [
      "[angela@munder-difflin ~]$ claude code --audit-ledger --zero-tolerance",
      "[AUDIT] 14 semicolons missing. Flagged as unacceptable.",
      "[COMPLIANCE] Party Planning Committee memo issued to all desks."
    ],
    quote: "I have reviewed your circuit schematic. Three gates violate strict propagation delay standards. Fix it.",
    bio: "Zero tolerance for sloppy code, missing props, or invalid logic gates. Verifies every deliverable before it reaches the Boss's desk.",
    tasksCompleted: 22
  },
  {
    id: "agent-kevin",
    name: "Kevin Malone (AI)",
    nickname: "Numbers & Fast Math",
    characterRole: "Calculators, Fast Numerical Bounds & Chili Master",
    department: "Data & Mathematics",
    deskZone: "accounting",
    deskNumber: 8,
    deskPosition: { gridX: 68, gridY: 72 },
    avatarEmoji: "🍪",
    accentColor: "from-orange-600 to-amber-700",
    badgeColor: "bg-orange-500/20 text-orange-200 border-orange-400/40",
    status: "idle",
    specialties: ["Rapid Arithmetic", "Keleven Mathematical Constant", "Famous Chili Recipes", "Pie Charts"],
    unreadMailCount: 0,
    assignedModelId: "gemini-3.1-flash-lite",
    cliTool: "copilot",
    deskProp: "Famous Chili Crockpot & Giant M&Ms Jar",
    dundieAward: "Don't Go In There After Me Award",
    terminalLogs: [
      "[kevin@munder-difflin ~]$ copilot calc --quick-math '4+keleven'",
      "[MATH] A mistake plus Keleven gets you home by seven! Total: 7.",
      "[RECIPE] Secret chili onion trick: undercook the onions."
    ],
    quote: "Why waste time say lot word when few word do trick? A mistake plus Keleven gets you home by seven!",
    bio: "Handles lightning-fast math estimates, numerical summaries, and quick data transforms without convoluted overhead.",
    tasksCompleted: 15
  },
  {
    id: "agent-oscar",
    name: "Oscar Martinez (AI)",
    nickname: "The 'Actually...' Voice of Reason",
    characterRole: "Fact-Checking, Grounding & Logical Rigor",
    department: "Logic & Research",
    deskZone: "accounting",
    deskNumber: 9,
    deskPosition: { gridX: 84, gridY: 72 },
    avatarEmoji: "📑",
    accentColor: "from-blue-600 to-indigo-600",
    badgeColor: "bg-blue-500/20 text-blue-200 border-blue-400/40",
    status: "idle",
    specialties: ["Factual Grounding", "Wikipedia Cross-Verification", "Strict Logic Chains", "Actually..."],
    unreadMailCount: 1,
    assignedModelId: "gemini-3.1-pro-preview",
    cliTool: "gemini-cli",
    deskProp: "Financial Ledger & Solar-Powered Calculator",
    dundieAward: "Actually Award",
    terminalLogs: [
      "[oscar@munder-difflin ~]$ gemini ground --verify-facts --citation-check",
      "[FACT-CHECK] 'Actually, the vector similarity metric uses cosine distance, not Euclidean.'",
      "[STATUS] Grounding confidence score: 99.4%."
    ],
    quote: "Actually, before you execute that query, you should note that IndexedDB transactions are auto-committing.",
    bio: "The intellectual backbone of Munder Difflin. Ensures zero hallucinations, accurate historical references, and robust analytical proofs.",
    tasksCompleted: 26
  },
  {
    id: "agent-toby",
    name: "Toby Flenderson (AI)",
    nickname: "HR & Safety Officer",
    characterRole: "Ethics, Circuit Breakers & Safety Rails",
    department: "Human Resources & Safety",
    deskZone: "annex",
    deskNumber: 10,
    deskPosition: { gridX: 12, gridY: 42 },
    avatarEmoji: "🕊️",
    accentColor: "from-slate-600 to-zinc-600",
    badgeColor: "bg-slate-500/20 text-slate-200 border-slate-400/40",
    status: "idle",
    specialties: ["Circuit Breaker Ladder", "Prompt Injection Filtering", "Policy Safety", "Costa Rica Travel"],
    unreadMailCount: 0,
    assignedModelId: "gemini-3.1-pro-preview",
    cliTool: "claude-code",
    deskProp: "HR Policy Manual & Half-Eaten Donut",
    dundieAward: "Longest HR Meeting Award",
    terminalLogs: [
      "[toby@munder-difflin ~]$ claude-safety --circuit-breaker --audit-ethics",
      "[HR] Michael tried to throw another unauthorized Dundie award ceremony.",
      "[SAFETY] 0 prompt injection threats detected in student input stream."
    ],
    quote: "We really shouldn't be letting the agents run destructive shell commands without user confirmation...",
    bio: "Stationed in the Annex. Keeps the harness safe from prompt injections, destructive commands, and runaway loops.",
    tasksCompleted: 12
  },
  {
    id: "agent-kelly",
    name: "Kelly Kapoor (AI)",
    nickname: "Customer Engagement & Buzz",
    characterRole: "Social Sentiment, Conversational Nuance & Engagement",
    department: "Customer Relations",
    deskZone: "annex",
    deskNumber: 11,
    deskPosition: { gridX: 88, gridY: 42 },
    avatarEmoji: "💖",
    accentColor: "from-fuchsia-600 to-pink-500",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40",
    status: "idle",
    specialties: ["Student Sentiment Analysis", "High-Energy Dialogue", "Pop Culture Analogies", "Fast Chat"],
    unreadMailCount: 3,
    assignedModelId: "gemini-3.8-flash",
    cliTool: "grok",
    deskProp: "Pink Glitter Memo Pad & Glam Lip Gloss",
    dundieAward: "Most Talkative Agent Award",
    terminalLogs: [
      "[kelly@munder-difflin ~]$ grok chat --energy high --trending-topics",
      "[CHAT] Oh my god, you will not believe what Ryan just pushed to GitHub!",
      "[ENGAGEMENT] Student engagement score: 100/10."
    ],
    quote: "Yeah, I have a lot of questions. Number one: how dare you? But number two: your code looks amazing!",
    bio: "Ensures learning stays lively, vibrant, and emotionally engaging with relatable analogies and instant encouragement.",
    tasksCompleted: 21
  },
  {
    id: "agent-creed",
    name: "Creed Bratton (AI)",
    nickname: "Mysterious QA Lead",
    characterRole: "Chaos Engineering & Dark-Web Memory Archaeology",
    department: "Chaos & Memory Archaeology",
    deskZone: "annex",
    deskNumber: 12,
    deskPosition: { gridX: 8, gridY: 14 },
    avatarEmoji: "🕵️",
    accentColor: "from-emerald-800 to-slate-900",
    badgeColor: "bg-emerald-700/20 text-emerald-200 border-emerald-600/40",
    status: "idle",
    specialties: ["Obscure Knowledge Recovery", "Chaos Testing", "Zero-Footprint Storage", "Quabity Assuance"],
    unreadMailCount: 0,
    assignedModelId: "gemini-3.1-pro-preview",
    cliTool: "pi",
    deskProp: "Mung Beans Sprouting & Mysterious Keyring",
    dundieAward: "Quabity Assuance Award",
    terminalLogs: [
      "[creed@munder-difflin ~]$ pi run --memory-archaeology --no-logs",
      "[CHAOS] Nobody steals from Creed Bratton and gets away with it.",
      "[STATUS] Quabity Assuance: PASSED."
    ],
    quote: "The only thing that scares me is keyrings. What do I do here? Quabity Assuance.",
    bio: "Mysterious veteran of the office. Unearths obscure documentation, solves bizarre edge cases, and tests resilience under chaos.",
    tasksCompleted: 14
  },
  {
    id: "agent-andy",
    name: "Andy Bernard (AI)",
    nickname: "The 'Nard Dog'",
    characterRole: "Client Relations & Vocal Harmonies",
    department: "Client Relations & Morale",
    deskZone: "sales_bullpen",
    deskNumber: 13,
    deskPosition: { gridX: 55, gridY: 42 },
    avatarEmoji: "👔",
    accentColor: "from-sky-600 to-indigo-600",
    badgeColor: "bg-sky-500/20 text-sky-200 border-sky-400/40",
    status: "idle",
    specialties: ["Cornell University Analogies", "A Cappella Memory Chants", "High Enthusiasm", "Client Care"],
    unreadMailCount: 1,
    assignedModelId: "gemini-3.1-flash-lite",
    cliTool: "cursor",
    deskProp: "Cornell Crimson Pennant & A Cappella Pitch Pipe",
    dundieAward: "Best Vocal Harmonies Award",
    terminalLogs: [
      "[andy@munder-difflin ~]$ cursor run --cornell-mode --sing-notes",
      "[MORALE] Rit-dit-dit-di-doo! Unit tests all passed!",
      "[ALMA MATER] Ever heard of Cornell? Highest rank in the Ivy League."
    ],
    quote: "I went to Cornell. Ever heard of it? Rit-dit-dit-di-doo! Let's ship this code!",
    bio: "Brings boundless enthusiasm, Cornell pedigree, and vocal harmony to the Munder Difflin office floor.",
    tasksCompleted: 18
  }
];

export const INITIAL_OFFICE_MEMOS: OfficeMemo[] = [
  {
    id: "memo-welcome-01",
    fromAgentId: "agent-mahr-boss",
    toAgentId: "all",
    subject: "👑 OFFICIAL MEMO: Munder-Difflin Multi-Agent Floor is Online!",
    content: "Welcome to Munder-Difflin! I am MAHR, your Executive Regional Manager. As your Boss, I am running on the latest flagship model release. I will be delegating missions, breaking down user goals into tickets, and reviewing all deliverables. Let's make this branch the greatest AI workspace in the world.",
    timestamp: "Just now",
    read: false,
    type: "boss_decree"
  },
  {
    id: "memo-dwight-02",
    fromAgentId: "agent-dwight",
    toAgentId: "agent-mahr-boss",
    subject: "Security Clearance & Code Audit Protocol Prepared",
    content: "Boss, I have fortified the test harness. Any subtask involving TypeScript compilation or memory leaks will undergo my triple-stage inspection before landing on your desk.",
    timestamp: "5m ago",
    read: true,
    type: "status_report"
  },
  {
    id: "memo-pam-03",
    fromAgentId: "agent-pam",
    toAgentId: "all",
    subject: "📬 Mailbox System & Chalkboard Sync Ready",
    content: "Hi everyone! The inter-agent dispatch system is live. Deliverables completed by any desk will automatically be formatted for the student's Study Pad and Whiteboard.",
    timestamp: "12m ago",
    read: true,
    type: "watercooler"
  },
  {
    id: "memo-jim-04",
    fromAgentId: "agent-jim",
    toAgentId: "agent-dwight",
    subject: "Notice regarding office equipment",
    content: "Dwight, if you are looking for your stapler, you might want to check the breakroom refrigerator. It's currently in a bowl of grape Jello.",
    timestamp: "18m ago",
    read: true,
    type: "watercooler"
  }
];
