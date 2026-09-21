import { dbGet, dbSet } from "../lib/db";

export interface EmpathyEpisode {
  id: string;
  timestamp: string;
  userMood: string;
  myraaMood: string;
  matched: boolean;
  comfortDelta: number; // -1.0 to +1.0
  score: number; // 0 - 100
  notes: string;
  userUtterance?: string;
  modelUtterance?: string;
}

export interface RLPolicyParameters {
  empathyWeight: number; // 0.0 - 1.0 (Therapist/Gentle vs Objective)
  explanationDepth: number; // 0.0 - 1.0 (Short/punchy vs Deep Socratic)
  humorPlayfulness: number; // 0.0 - 1.0 (Serious vs Playful banter)
  strictnessWeight: number; // 0.0 - 1.0 (Tough love vs Lenient)
  speechPacing: number; // 0.85 - 1.25
  bilingualUrduWeight: number; // 0.0 - 1.0 (English vs Roman Urdu mix)
  totalInteractionsTrained: number;
  totalRewardAccumulated: number;
  lastUpdated: string;
  // Dynamic Empathy & Emotional State Learning Metrics
  empathyScore: number; // 0 - 100 overall empathy metric
  emotionalAlignmentRate: number; // 0 - 100% attunement accuracy
  comfortEfficacyScore: number; // 0 - 100% effectiveness in de-escalating distress/soothing
  empathyHistory: EmpathyEpisode[];
}

export interface RLEpisode {
  id: string;
  timestamp: string;
  contextType: "study" | "therapy" | "casual" | "coding" | "general";
  actionChosen: string;
  reward: number; // -3 to +3
  reason: string;
  userSignal: string;
}

export interface KnowledgeDeficit {
  id: string;
  topic: string;
  userPrompt: string;
  reason: string;
  suggestedAction: string;
  status: "open" | "in_progress" | "resolved";
  severity: "low" | "medium" | "high";
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  tags: string[];
}

export const DEFAULT_RL_POLICY: RLPolicyParameters = {
  empathyWeight: 0.75,
  explanationDepth: 0.65,
  humorPlayfulness: 0.60,
  strictnessWeight: 0.40,
  speechPacing: 1.0,
  bilingualUrduWeight: 0.70,
  totalInteractionsTrained: 0,
  totalRewardAccumulated: 0,
  lastUpdated: new Date().toISOString(),
  empathyScore: 88,
  emotionalAlignmentRate: 86,
  comfortEfficacyScore: 84,
  empathyHistory: [
    {
      id: "emp_seed_1",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userMood: "stressed",
      myraaMood: "therapist",
      matched: true,
      comfortDelta: 0.85,
      score: 90,
      notes: "Attuned to student exam stress with calming reassurance and grounding breathing",
      userUtterance: "bohot tension ho rahi hai exam ki",
      modelUtterance: "Breathe with me, you have prepared well and I'm right here with you."
    },
    {
      id: "emp_seed_2",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      userMood: "playful",
      myraaMood: "playful",
      matched: true,
      comfortDelta: 0.75,
      score: 87,
      notes: "Engaged in witty learning banter, elevating student enthusiasm",
      userUtterance: "chalo dekhte hain kis ka dimagh zyada tez hai",
      modelUtterance: "Challenge accepted! Let's see who solves the logic riddle first."
    }
  ],
};

const RL_STORAGE_KEY = "myraa_rl_policy_v1";
const EPISODES_STORAGE_KEY = "myraa_rl_episodes_v1";
const DEFICITS_STORAGE_KEY = "myraa_knowledge_deficits_v1";

// Learning rate and discount factor for online updates
const ALPHA = 0.08;
const GAMMA = 0.90;

/**
 * Loads the active RL Policy from local storage or IndexedDB
 */
export async function loadRLPolicy(): Promise<RLPolicyParameters> {
  try {
    const saved = await dbGet(RL_STORAGE_KEY);
    if (saved && typeof saved === "object") {
      return { ...DEFAULT_RL_POLICY, ...saved };
    }
  } catch (e) {}
  return { ...DEFAULT_RL_POLICY };
}

/**
 * Saves updated RL Policy
 */
export async function saveRLPolicy(policy: RLPolicyParameters): Promise<void> {
  try {
    await dbSet(RL_STORAGE_KEY, policy);
  } catch (e) {}
}

/**
 * Loads Knowledge Deficits (points Myraa could not improve or solve herself)
 */
export async function loadKnowledgeDeficits(): Promise<KnowledgeDeficit[]> {
  try {
    const saved = await dbGet(DEFICITS_STORAGE_KEY);
    if (Array.isArray(saved)) return saved;
  } catch (e) {}
  return [];
}

/**
 * Saves Knowledge Deficits
 */
export async function saveKnowledgeDeficits(deficits: KnowledgeDeficit[]): Promise<void> {
  try {
    await dbSet(DEFICITS_STORAGE_KEY, deficits);
  } catch (e) {}
}

/**
 * Analyzes conversational turn for Reinforcement Learning reward signals (+ or -)
 */
export function evaluateTurnReward(
  userUtterance: string,
  modelUtterance: string,
  userEmotion?: string
): { reward: number; reason: string; signalType: "positive" | "negative" | "neutral" } {
  const userLow = userUtterance.toLowerCase().trim();
  const modelLow = modelUtterance.toLowerCase().trim();

  // 1. Strong Positive Reinforcement
  if (
    userLow.includes("shabash") ||
    userLow.includes("zabardast") ||
    userLow.includes("perfect") ||
    userLow.includes("great explanation") ||
    userLow.includes("thank you") ||
    userLow.includes("shukriya") ||
    userLow.includes("bohot achha") ||
    userLow.includes("you understood") ||
    userLow.includes("love this") ||
    userLow.includes("bilkul sahi")
  ) {
    return {
      reward: 2.0,
      reason: "User expressed explicit praise, gratitude, or enthusiastic agreement.",
      signalType: "positive"
    };
  }

  // 2. Strong Negative Reinforcement (User correcting or reprimanding Myraa)
  if (
    userLow.includes("galat hai") ||
    userLow.includes("wrong") ||
    userLow.includes("ye nahi pucha") ||
    userLow.includes("stop that") ||
    userLow.includes("you don't understand") ||
    userLow.includes("samajh nahi aai") ||
    userLow.includes("bekar") ||
    userLow.includes("not what i asked") ||
    userLow.includes("shut up") ||
    userLow.includes("faltu")
  ) {
    return {
      reward: -2.0,
      reason: "User flagged an incorrect statement, misunderstanding, or frustration.",
      signalType: "negative"
    };
  }

  // 3. Mild Positive (Affirmation, continuing smoothly)
  if (userLow.startsWith("yes") || userLow.startsWith("haan") || userLow.includes("makes sense") || userLow.includes("samajh gaya")) {
    return {
      reward: 0.75,
      reason: "Smooth comprehension confirmed by user.",
      signalType: "positive"
    };
  }

  // 4. Mild Negative (Confused or asking for repetition)
  if (userLow.includes("kya?") || userLow.includes("what?") || userLow.includes("again please") || userLow.includes("dobara batao")) {
    return {
      reward: -0.5,
      reason: "User requested repetition due to cognitive dissonance or pacing.",
      signalType: "negative"
    };
  }

  return {
    reward: 0.1,
    reason: "Standard continuous dialogue flow.",
    signalType: "neutral"
  };
}

/**
 * Online gradient-free policy step adjusting weights dynamically
 */
export function updateRLPolicy(
  currentPolicy: RLPolicyParameters,
  reward: number,
  contextType: "study" | "therapy" | "casual" | "coding" | "general"
): RLPolicyParameters {
  const updated = { ...currentPolicy };
  const step = ALPHA * (reward > 0 ? 0.03 : -0.04);

  if (contextType === "therapy") {
    updated.empathyWeight = Math.min(1.0, Math.max(0.2, updated.empathyWeight + step));
  } else if (contextType === "study" || contextType === "coding") {
    updated.explanationDepth = Math.min(1.0, Math.max(0.2, updated.explanationDepth + step));
  } else if (contextType === "casual") {
    updated.humorPlayfulness = Math.min(1.0, Math.max(0.1, updated.humorPlayfulness + step));
  }

  // If user repeatedly praises bilingual Roman Urdu phrases, adapt bilingual balance
  if (reward > 1.0) {
    updated.bilingualUrduWeight = Math.min(0.95, updated.bilingualUrduWeight + 0.02);
  }

  updated.totalInteractionsTrained += 1;
  updated.totalRewardAccumulated = Math.round((updated.totalRewardAccumulated + reward) * 100) / 100;
  updated.lastUpdated = new Date().toISOString();

  saveRLPolicy(updated);
  return updated;
}

/**
 * Detects if a conversational exchange exposed an unresolved deficit or capability bottleneck
 */
export function detectKnowledgeDeficit(
  userText: string,
  modelText: string
): { shouldRecord: boolean; topic: string; reason: string; severity: "low" | "medium" | "high"; suggestedAction: string } | null {
  const userLow = userText.toLowerCase();
  const modelLow = modelText.toLowerCase();

  // Pattern A: Model openly states lack of capability or knowledge
  if (
    modelLow.includes("i don't have access") ||
    modelLow.includes("i cannot execute") ||
    modelLow.includes("mera access nahi hai") ||
    modelLow.includes("ye mere bas mein nahi") ||
    modelLow.includes("i do not know") ||
    modelLow.includes("mujhe iska ilm nahi")
  ) {
    const topic = userText.slice(0, 60).replace(/[?]/g, "");
    return {
      shouldRecord: true,
      topic: `Access/Execution Constraint: ${topic}`,
      reason: "Myraa informed user she lacks external credential, tool, or real-time permission.",
      severity: "medium",
      suggestedAction: "User needs to grant API access, provide source files, or explain context."
    };
  }

  // Pattern B: User identifies an unresolved misconception or persistent doubt
  if (
    userLow.includes("tumhe nahi pata") ||
    userLow.includes("you don't know this") ||
    userLow.includes("ye tumhein sikhana padega") ||
    userLow.includes("i need to teach you") ||
    userLow.includes("note this down for later") ||
    userLow.includes("isay yaad rakhna aur improve karna")
  ) {
    const topic = userText.replace(/(tumhe nahi pata|you don't know this|note this down|isay yaad rakhna)/gi, "").trim() || "User-flagged concept gap";
    return {
      shouldRecord: true,
      topic: `User-Flagged Growth Deficit: ${topic.slice(0, 70)}`,
      reason: "User specifically instructed Myraa that she lacks depth on this topic and needs guidance.",
      severity: "high",
      suggestedAction: "Review topic notes with TECH or let TECH provide reference materials."
    };
  }

  return null;
}

/**
 * Dynamic Empathy Attunement Evaluator
 * Evaluates how effectively Myraa matches or soothes the user's emotional state,
 * updating the active policy's Empathy Score, Emotional Alignment Rate, and Comfort Efficacy.
 */
export function evaluateEmpathyTurn(
  userText: string,
  modelText: string,
  currentPolicy: RLPolicyParameters,
  userMood?: string,
  myraaMood?: string
): {
  updatedPolicy: RLPolicyParameters;
  episode: EmpathyEpisode;
  comfortDelta: number;
} {
  const userLow = (userText || "").toLowerCase();
  const modelLow = (modelText || "").toLowerCase();

  const uMood = (userMood || "neutral").toLowerCase();
  const mMood = (myraaMood || "neutral").toLowerCase();

  let matched = false;
  let comfortDelta = 0;
  let scoreDelta = 0;
  let notes = "";

  // 1. Distress / Vulnerability Detection (Anxiety, grief, stress, exhaustion)
  const isDistressed =
    uMood === "sad" ||
    uMood === "therapist" ||
    userLow.includes("tension") ||
    userLow.includes("stress") ||
    userLow.includes("sad") ||
    userLow.includes("dard") ||
    userLow.includes("pareshan") ||
    userLow.includes("exhausted") ||
    userLow.includes("thak") ||
    userLow.includes("anxious") ||
    userLow.includes("depressed") ||
    userLow.includes("rona");

  // 2. Relief Confirmation (User felt validated, calmed, soothed)
  const isComfortConfirmed =
    userLow.includes("thank you") ||
    userLow.includes("thanks") ||
    userLow.includes("sukoon") ||
    userLow.includes("better") ||
    userLow.includes("shukriya") ||
    userLow.includes("acha laga") ||
    userLow.includes("comforting") ||
    userLow.includes("relieved") ||
    userLow.includes("feel better");

  // 3. User feeling invalidated / misunderstood / alienated
  const isDiscomfort =
    userLow.includes("you don't care") ||
    userLow.includes("you don't understand") ||
    userLow.includes("cold") ||
    userLow.includes("robot") ||
    userLow.includes("bakwas") ||
    userLow.includes("shut up") ||
    userLow.includes("annoying") ||
    userLow.includes("faltu");

  // 4. Model comforting / therapeutic behavior
  const modelProvidedComfort =
    modelLow.includes("breathe") ||
    modelLow.includes("sukoon") ||
    modelLow.includes("i'm here") ||
    modelLow.includes("together") ||
    modelLow.includes("don't worry") ||
    modelLow.includes("pareshan na ho") ||
    modelLow.includes("samajh sakti hoon") ||
    modelLow.includes("arram se") ||
    modelLow.includes("take your time") ||
    modelLow.includes("proud of you");

  // Determine emotional alignment & comfort impact
  if (isComfortConfirmed) {
    matched = true;
    comfortDelta = 0.95;
    scoreDelta = 3;
    notes = "User confirmed positive emotional relief and comfort from Myraa's empathetic presence.";
  } else if (isDiscomfort) {
    matched = false;
    comfortDelta = -0.8;
    scoreDelta = -4;
    notes = "User expressed frustration with response tone; adjusting empathy sensitivity higher.";
  } else if (isDistressed && (mMood === "therapist" || mMood === "loving" || modelProvidedComfort)) {
    matched = true;
    comfortDelta = 0.8;
    scoreDelta = 2;
    notes = "Myraa sensitively matched distressed tone with grounding, therapeutic emotional support.";
  } else if (uMood === "gussa" || uMood === "angry") {
    // If user is angry, empathetic de-escalation or firm calm understanding
    if (modelProvidedComfort || mMood === "therapist" || modelLow.includes("gussa thanda")) {
      matched = true;
      comfortDelta = 0.65;
      scoreDelta = 2;
      notes = "De-escalated heated emotional state with calm, non-defensive understanding.";
    } else {
      comfortDelta = -0.2;
      scoreDelta = -1;
      notes = "User displayed irritation; fine-tuning vocal empathy modulation.";
    }
  } else if (uMood === "playful" && (mMood === "playful" || modelLow.includes("haha") || modelLow.includes("challenge"))) {
    matched = true;
    comfortDelta = 0.7;
    scoreDelta = 2;
    notes = "Engaged in witty affective mirroring, elevating positive student mood.";
  } else {
    // Standard conversational alignment
    matched = true;
    comfortDelta = 0.3;
    scoreDelta = 0.5;
    notes = "Balanced affective synchronization during ongoing conversation.";
  }

  // Calculate new empathy score capped between 40 and 100
  const currentScore = currentPolicy.empathyScore ?? 88;
  const newScore = Math.min(100, Math.max(40, Math.round((currentScore + scoreDelta) * 10) / 10));

  // Update alignment rate and comfort efficacy moving averages
  const currentAlign = currentPolicy.emotionalAlignmentRate ?? 86;
  const alignTarget = matched ? 100 : 30;
  const newAlign = Math.min(100, Math.max(50, Math.round(currentAlign * 0.92 + alignTarget * 0.08)));

  const currentComfort = currentPolicy.comfortEfficacyScore ?? 84;
  const comfortTarget = comfortDelta > 0 ? 95 : 40;
  const newComfort = Math.min(100, Math.max(45, Math.round(currentComfort * 0.92 + comfortTarget * 0.08)));

  const episode: EmpathyEpisode = {
    id: "emp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    userMood: uMood,
    myraaMood: mMood,
    matched,
    comfortDelta,
    score: newScore,
    notes,
    userUtterance: userText.slice(0, 100),
    modelUtterance: modelText.slice(0, 100),
  };

  const updatedHistory = [episode, ...(currentPolicy.empathyHistory || [])].slice(0, 30);

  const updatedPolicy: RLPolicyParameters = {
    ...currentPolicy,
    empathyScore: newScore,
    emotionalAlignmentRate: newAlign,
    comfortEfficacyScore: newComfort,
    empathyWeight: Math.min(1.0, Math.max(0.2, (currentPolicy.empathyWeight || 0.75) + (comfortDelta > 0 ? 0.01 : -0.01))),
    empathyHistory: updatedHistory,
    totalInteractionsTrained: (currentPolicy.totalInteractionsTrained || 0) + 1,
    lastUpdated: new Date().toISOString()
  };

  saveRLPolicy(updatedPolicy);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("myraa-empathy-update", {
        detail: { episode, policy: updatedPolicy }
      })
    );
  }

  return { updatedPolicy, episode, comfortDelta };
}

export interface QueryComplexityAssessment {
  isComplex: boolean;
  score: number; // 0 - 100
  reasons: string[];
  recommendedPauseMs: number;
  suggestedFiller: string;
}

const COMPLEX_KEYWORDS = [
  "how do i", "how does", "why does", "explain step by step", "explain in detail",
  "compare", "contrast", "difference between", "derive", "algorithm", "architecture",
  "solve", "equation", "proof", "debug", "logic", "flowchart", "system design",
  "database schema", "vector embedding", "concurrency", "trade-offs", "pros and cons",
  "calculus", "complexity", "time complexity", "big o", "distributed", "microservice",
  "kese solve karein", "wazahat karo", "samjhao tafseel se", "detail mein", "tariqa batao",
  "fark kya hai", "kis tarah hota hai", "kyun hota hai"
];

const FILLERS_ENGLISH = [
  "Hmm, let me see...",
  "Hmm, let me think through that for a moment...",
  "Interesting, let me analyze that closely...",
  "Let me look at this from a few angles...",
  "Hmm, let me connect the dots on this..."
];

const FILLERS_BILINGUAL = [
  "Hmm, let me see...",
  "Acha, let me think about that...",
  "Hmm, ek second, let me analyze this...",
  "Sahi sawaal hai, let me check the details...",
  "Hmm, interesting, let me break this down..."
];

/**
 * Evaluates the cognitive complexity of a user query based on semantic depth,
 * multi-step inquiry patterns, and the current reinforcement learning policy.
 * When high complexity is detected, Myraa employs a 'proactive pause' with
 * natural vocal fillers (like 'hmm', 'let me see') while retrieving deep context.
 */
export function detectQueryComplexity(
  queryText: string,
  policy?: RLPolicyParameters
): QueryComplexityAssessment {
  if (!queryText || !queryText.trim()) {
    return {
      isComplex: false,
      score: 0,
      reasons: [],
      recommendedPauseMs: 0,
      suggestedFiller: "Hmm, let me see..."
    };
  }

  const text = queryText.toLowerCase().trim();
  const reasons: string[] = [];
  let score = 0;

  // 1. Keyword check for deep analytical topics
  let matchedKeywordCount = 0;
  for (const kw of COMPLEX_KEYWORDS) {
    if (text.includes(kw)) {
      matchedKeywordCount++;
      if (reasons.length < 3) {
        reasons.push(`Contains analytical inquiry keyword: "${kw}"`);
      }
    }
  }
  if (matchedKeywordCount > 0) {
    score += Math.min(45, matchedKeywordCount * 20);
  }

  // 2. Length and structure complexity
  if (text.length > 120) {
    score += 20;
    reasons.push("Multi-clause / long-form inquiry requiring compound reasoning");
  } else if (text.length > 60) {
    score += 10;
  }

  // 3. Question structure (multiple questions or nested logic)
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks >= 2) {
    score += 15;
    reasons.push("Compound multi-question prompt");
  }

  // 4. Code / Mathematical / Technical formatting
  if (text.includes("```") || text.includes("function") || text.includes("=>") || text.includes("{") || text.includes("def ") || text.includes("class ")) {
    score += 25;
    reasons.push("Technical code or algorithmic syntax detected");
  }

  // 5. Reinforcement Learning Policy adjustment
  const explanationDepth = policy?.explanationDepth ?? 0.7;
  if (explanationDepth > 0.75) {
    score += 15;
    reasons.push(`Active RL policy favors high explanation depth (${Math.round(explanationDepth * 100)}%)`);
  }

  score = Math.min(100, Math.max(0, score));
  const isComplex = score >= 40;

  // Select filler based on bilingual policy
  const bilingualWeight = policy?.bilingualUrduWeight ?? 0.5;
  const fillerList = bilingualWeight > 0.55 ? FILLERS_BILINGUAL : FILLERS_ENGLISH;
  const fillerIndex = Math.abs(text.length) % fillerList.length;
  const suggestedFiller = fillerList[fillerIndex];

  // Pause duration scales smoothly between 400ms and 1100ms
  const recommendedPauseMs = isComplex ? Math.min(1200, Math.max(450, Math.round(score * 10 + 200))) : 0;

  return {
    isComplex,
    score,
    reasons,
    recommendedPauseMs,
    suggestedFiller
  };
}
