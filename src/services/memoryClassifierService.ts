import { MemoryCategory } from "../lib/memoryTypes";

export interface ClassifiedMemoryResult {
  category: MemoryCategory;
  extractedFact: string;
  projectId?: string;
  dueDate?: string;
  tags: string[];
  confidence: number;
}

/**
 * Parses and computes real dates for relative expressions like 'tomorrow', 'next Monday', 'in 3 days'
 */
function parseRelativeDate(phrase: string): string | undefined {
  const now = new Date();
  const lower = phrase.toLowerCase().trim();

  if (lower.includes("tomorrow") || lower.includes("kal tak") || lower.includes("kal submission")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return `${d.toISOString().split("T")[0]} (Tomorrow)`;
  }

  if (lower.includes("today") || lower.includes("aaj tak") || lower.includes("tonight")) {
    return `${now.toISOString().split("T")[0]} (Today)`;
  }

  const daysMatch = lower.match(/(?:in|after)\s+(\d+)\s+days?/i) || lower.match(/(\d+)\s+din\s+baad/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    if (!isNaN(days) && days > 0 && days < 365) {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return `${d.toISOString().split("T")[0]} (In ${days} days)`;
    }
  }

  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const urduWeekdays: Record<string, number> = {
    "itwar": 0,
    "peer": 1,
    "mangal": 2,
    "budh": 3,
    "jumeraat": 4,
    "juma": 5,
    "jumma": 5,
    "hafta": 6
  };

  for (let i = 0; i < weekdays.length; i++) {
    const day = weekdays[i];
    if (lower.includes(`next ${day}`) || lower.includes(`by ${day}`) || lower.includes(`this ${day}`) || lower.includes(`on ${day}`)) {
      const currentDay = now.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      const target = new Date(now);
      target.setDate(target.getDate() + diff);
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      return `${target.toISOString().split("T")[0]} (${dayName})`;
    }
  }

  for (const [urduDay, dayIndex] of Object.entries(urduWeekdays)) {
    if (lower.includes(`${urduDay} tak`) || lower.includes(`${urduDay} ko`)) {
      const currentDay = now.getDay();
      let diff = dayIndex - currentDay;
      if (diff <= 0) diff += 7;
      const target = new Date(now);
      target.setDate(target.getDate() + diff);
      const englishDay = weekdays[dayIndex];
      const dayName = englishDay.charAt(0).toUpperCase() + englishDay.slice(1);
      return `${target.toISOString().split("T")[0]} (${dayName})`;
    }
  }

  // Explicit ISO or Month Day pattern
  const explicitIso = lower.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (explicitIso) return explicitIso[1];

  const monthNames = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
  const dateRegex = new RegExp(`\\b(${monthNames}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?)\\b`, "i");
  const monthMatch = lower.match(dateRegex);
  if (monthMatch) {
    try {
      const parsed = new Date(monthMatch[1]);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
    } catch (e) {}
    return monthMatch[1];
  }

  return undefined;
}

/**
 * Intelligent Classifier for Memories with Project IDs and Due Date recognition
 */
export function classifyMemoryFromText(userText: string): ClassifiedMemoryResult | null {
  if (!userText || userText.trim().length < 6) return null;
  const lower = userText.toLowerCase().trim();

  let category: MemoryCategory | null = null;
  let extractedFact = "";
  let confidence = 0.85;

  // 1. Identify Primary Category
  if (
    lower.includes("my name is") || 
    lower.includes("i am ") || 
    lower.includes("call me") || 
    lower.includes("mera naam") || 
    lower.includes("mujhe ") && (lower.includes("kehte") || lower.includes("bolte"))
  ) {
    category = "identity";
    extractedFact = `User identity/name: "${userText.trim()}"`;
    confidence = 0.95;
  } else if (
    lower.includes("i like") || 
    lower.includes("i prefer") || 
    lower.includes("i love") || 
    lower.includes("pasand") || 
    lower.includes("my favorite") ||
    lower.includes("i hate") ||
    lower.includes("mujhe achha lagta")
  ) {
    category = "preference";
    extractedFact = `User preference note: "${userText.trim()}"`;
    confidence = 0.90;
  } else if (
    lower.includes("my goal") || 
    lower.includes("i am studying") || 
    lower.includes("exam") || 
    lower.includes("test on") || 
    lower.includes("i need to learn") || 
    lower.includes("tayari") ||
    lower.includes("target") ||
    lower.includes("maqsad")
  ) {
    category = "goal";
    extractedFact = `User study goal/topic: "${userText.trim()}"`;
    confidence = 0.92;
  } else if (
    lower.includes("project") || 
    lower.includes("building") || 
    lower.includes("app") || 
    lower.includes("assignment") || 
    lower.includes("code") ||
    lower.includes("working on") ||
    lower.includes("repository") ||
    lower.includes("repo") ||
    lower.includes("startup")
  ) {
    category = "project";
    extractedFact = `User active project/work: "${userText.trim()}"`;
    confidence = 0.94;
  } else if (
    lower.includes("friend") ||
    lower.includes("colleague") ||
    lower.includes("dost") ||
    lower.includes("brother") ||
    lower.includes("sister") ||
    lower.includes("boss") ||
    lower.includes("teacher") ||
    lower.includes("ustaad")
  ) {
    category = "relationship";
    extractedFact = `Social/Relationship context: "${userText.trim()}"`;
    confidence = 0.88;
  } else if (
    lower.includes("routine") ||
    lower.includes("every day") ||
    lower.includes("har roz") ||
    lower.includes("habit") ||
    lower.includes("subah") ||
    lower.includes("raat ko")
  ) {
    category = "behavior";
    extractedFact = `Habit & Behavior pattern: "${userText.trim()}"`;
    confidence = 0.86;
  }

  // If not matched directly by keywords, check for explicit project or due-date markers
  const explicitProjectCode = userText.match(/\b((?:PRJ|PROJ|PROJECT)-[A-Z0-9_-]+)\b/i);
  const hasDueWord = lower.includes("due") || lower.includes("deadline") || lower.includes("submit") || lower.includes("tak finish");

  if (!category && (explicitProjectCode || hasDueWord)) {
    category = explicitProjectCode ? "project" : "goal";
    extractedFact = `Task/Project memory: "${userText.trim()}"`;
    confidence = 0.80;
  }

  if (!category) return null;

  // 2. Extract Project ID / Project Identifier
  let projectId: string | undefined = undefined;
  if (explicitProjectCode) {
    projectId = explicitProjectCode[1].toUpperCase();
  } else {
    // Check for "project <Name>" or "working on <Name>"
    const projectNamedMatch = 
      userText.match(/(?:project|app|startup|repo|assignment)\s+(?:named|called|titled)?\s*["']?([A-Za-z0-9_-]{2,20})["']?/i) ||
      userText.match(/working on\s+["']?([A-Za-z0-9_-]{2,20})["']?/i);
    
    if (projectNamedMatch && !["a", "an", "the", "my", "this", "some", "our"].includes(projectNamedMatch[1].toLowerCase())) {
      const cleanName = projectNamedMatch[1].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (cleanName.length >= 2) {
        projectId = `PRJ-${cleanName}`;
      }
    }
  }

  // 3. Extract Due Date / Deadlines
  let dueDate: string | undefined = undefined;
  if (
    lower.includes("due") || 
    lower.includes("deadline") || 
    lower.includes("by ") || 
    lower.includes("before ") || 
    lower.includes("tak ") || 
    lower.includes("submission") ||
    lower.includes("exam on") ||
    lower.includes("test on") ||
    lower.includes("finish by")
  ) {
    dueDate = parseRelativeDate(userText);
  }

  // 4. Generate Semantic Tags
  const tags: string[] = [`category:${category}`];
  if (projectId) {
    tags.push(`project:${projectId}`);
  }
  if (dueDate) {
    tags.push(`due:${dueDate.split(" ")[0]}`);
  }
  if (lower.includes("urgent") || lower.includes("important") || lower.includes("jaldi") || lower.includes("asap")) {
    tags.push("priority:high");
  }
  if (lower.includes("exam") || lower.includes("quiz") || lower.includes("test")) {
    tags.push("type:exam");
  }

  return {
    category,
    extractedFact,
    projectId,
    dueDate,
    tags,
    confidence
  };
}
