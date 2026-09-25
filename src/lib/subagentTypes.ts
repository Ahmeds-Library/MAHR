export interface AIModelConfig {
  id: string;
  name: string;
  contextWindow: string; // e.g. "1,048,576 Tokens"
  contextTokens: number;
  description: string;
  isRecommendedForLongChats: boolean;
  tag: string;
  badgeColor: string;
  category?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  isOnline?: boolean;
  supportedActions?: string[];
}

export const SUPPORTED_AI_MODELS: AIModelConfig[] = [
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    contextWindow: "1,048,576 Tokens",
    contextTokens: 1048576,
    inputTokenLimit: 1048576,
    outputTokenLimit: 65536,
    description: "Ultra-fast millisecond response latency with 1M tokens context capacity. High availability and speed for rapid tutoring, chat, and daily task handling.",
    isRecommendedForLongChats: true,
    tag: "1M Context • Ultra Fast",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    category: "Fast Flash",
    isOnline: true
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    contextWindow: "1,048,576 Tokens",
    contextTokens: 1048576,
    inputTokenLimit: 1048576,
    outputTokenLimit: 65536,
    description: "Next-generation ultra-fast multimodal intelligence with 1M tokens context and cutting-edge performance.",
    isRecommendedForLongChats: true,
    tag: "1M Context • Flagship Flash",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    category: "Next-Gen 3.x",
    isOnline: true
  },
  {
    id: "gemini-flash-latest",
    name: "Gemini Flash (Latest)",
    contextWindow: "1,048,576 Tokens",
    contextTokens: 1048576,
    inputTokenLimit: 1048576,
    outputTokenLimit: 65536,
    description: "Always-updated release of Gemini Flash with maximum reliability and low latency.",
    isRecommendedForLongChats: true,
    tag: "1M Context • Dynamic Latest",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    category: "Fast Flash",
    isOnline: true
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro Preview",
    contextWindow: "1,048,576 Tokens",
    contextTokens: 1048576,
    inputTokenLimit: 1048576,
    outputTokenLimit: 65536,
    description: "State-of-the-art frontier model for coding, STEM, mathematical proofs, and architectural synthesis.",
    isRecommendedForLongChats: true,
    tag: "1M Context • Frontier Pro",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    category: "Pro Reasoning",
    isOnline: true
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    contextWindow: "1,048,576 Tokens",
    contextTokens: 1048576,
    inputTokenLimit: 1048576,
    outputTokenLimit: 65536,
    description: "High-velocity hybrid reasoning model balancing instant responses with deep step-by-step thinking.",
    isRecommendedForLongChats: true,
    tag: "1M Context • Hybrid Thinking",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    category: "Next-Gen 3.x",
    isOnline: true
  },
  {
    id: "gemma-4-31b-it",
    name: "Gemma 4 31B IT",
    contextWindow: "262,144 Tokens",
    contextTokens: 262144,
    inputTokenLimit: 262144,
    outputTokenLimit: 32768,
    description: "Open weights instruction-tuned model with high parameter efficiency and responsive local-style execution.",
    isRecommendedForLongChats: false,
    tag: "262K Context • Open Model",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    category: "Open Models",
    isOnline: true
  }
];

export interface SubAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  modelId: string;
  iconName: string;
  color: string;
  category: "tutor" | "coder" | "planner" | "memory" | "diagram" | "custom";
  isCustom?: boolean;
  contextLimit: string;
  createdAt?: string;
}

export const PRESET_SUBAGENTS: SubAgent[] = [
  {
    id: "sub-main-myraa",
    name: "MAHR (Core Assistant)",
    role: "Primary Companion & Mentor",
    description: "Your primary, warm, empathetic AI learning companion and professional assistant with long-term memory.",
    systemPrompt: "You are MAHR, a warm, highly intelligent, and remarkably natural digital companion and expert mentor. Speak in an authentic, conversational human style—caring, intuitive, and down-to-earth. Adapt dynamically to the student's cognitive state: provide intuitive step-by-step breakdowns when explaining new concepts, and crisp technical depth when requested. Continuously utilize long-term memory and context to provide a deeply personalized, human-like experience.",
    modelId: "gemini-3.1-flash-lite",
    iconName: "Sparkles",
    color: "from-purple-500 to-indigo-600",
    category: "tutor",
    contextLimit: "1,048,576 Tokens"
  },
  {
    id: "sub-code-architect",
    name: "CodeArchitect & Terminal Debugger",
    role: "Full-Stack Software Engineer & Debugger",
    description: "Analyzes full-scale codebases, inspects terminal stack traces, designs system ERDs, and debugs complex code errors.",
    systemPrompt: "You are CodeArchitect, an expert full-stack developer sub-agent. Provide pristine, production-ready TypeScript code, diagnose error lines, and structure scalable software systems.",
    modelId: "gemini-3.1-flash-lite",
    iconName: "Cpu",
    color: "from-emerald-500 to-teal-600",
    category: "coder",
    contextLimit: "1,048,576 Tokens"
  },
  {
    id: "sub-daily-planner",
    name: "Planner & Task Strategist",
    role: "Daily Schedule & Goal Executive Assistant",
    description: "Organizes your daily tasks, sets priority blocks, maintains habits & streaks, and reminds you of important deadlines.",
    systemPrompt: "You are Task Strategist, a high-productivity executive sub-agent. Organize schedule blocks, prioritize tasks by urgency and impact, and keep user focused.",
    modelId: "gemini-3.1-flash-lite",
    iconName: "Calendar",
    color: "from-amber-500 to-orange-600",
    category: "planner",
    contextLimit: "1,048,576 Tokens"
  },
  {
    id: "sub-feynman-memory",
    name: "Feynman Memory & Research Agent",
    role: "Deep Context & Flashcard Synthesizer",
    description: "Synthesizes raw study notes into active recall flashcards, MCQs, and retains long-term knowledge across sessions.",
    systemPrompt: "You are Feynman Memory Agent, specializing in active recall and space repetition. Distill raw concepts into simple definitions and review questions.",
    modelId: "gemini-3.1-flash-lite",
    iconName: "BookOpen",
    color: "from-purple-500 to-pink-600",
    category: "memory",
    contextLimit: "1,048,576 Tokens"
  }
];

export interface DailyTask {
  id: string;
  title: string;
  timeBlock: string; // e.g. "08:00 AM", "Morning Focus", "Evening Review"
  priority: "high" | "medium" | "low";
  category: "study" | "coding" | "personal" | "health" | "work";
  completed: boolean;
  date: string; // YYYY-MM-DD
  reminder: boolean;
  notes?: string;
  createdAt: string;
}
