import { MyraaEmotion } from "../components/MyraaCoreVisualizer";

export function detectEmotionFromText(text: string): MyraaEmotion {
  const lower = text.toLowerCase();
  if (lower.includes("gussa") || lower.includes("angry") || lower.includes("furious") || lower.includes("shut up") || lower.includes("jhoot") || lower.includes("lies")) return "gussa";
  if (lower.includes("naraz") || lower.includes("khafa") || lower.includes("rooth") || lower.includes("sulking") || lower.includes("pout")) return "naraz";
  if (lower.includes("therapist") || lower.includes("breathe") || lower.includes("sukoon") || lower.includes("healing") || lower.includes("counsel")) return "therapist";
  if (lower.includes("love you") || lower.includes("loving") || lower.includes("pyar") || lower.includes("affection") || lower.includes("sweetie")) return "loving";
  if (lower.includes("mantiq") || lower.includes("philosoph") || lower.includes("architect") || lower.includes("deep logic")) return "analytical";
  if (lower.includes("haha") || lower.includes("lol") || lower.includes("funny") || lower.includes("joke") || lower.includes("hehe") || lower.includes("wink") || lower.includes("mazaq")) return "playful";
  if (lower.includes("happy") || lower.includes("harmony") || lower.includes("glad") || lower.includes("joy") || lower.includes("wonderful") || lower.includes("love") || lower.includes("smile")) return "happy";
  if (lower.includes("wow") || lower.includes("awesome") || lower.includes("excited") || lower.includes("amazing") || lower.includes("yay") || lower.includes("incredible") || lower.includes("hype")) return "excited";
  if (lower.includes("really?") || lower.includes("curious") || lower.includes("interest") || lower.includes("tell me more") || lower.includes("why") || lower.includes("how") || lower.includes("wonder")) return "curious";
  if (lower.includes("think") || lower.includes("calculat") || lower.includes("analyz") || lower.includes("hmmm") || lower.includes("process") || lower.includes("let me see") || lower.includes("conclude")) return "thinking";
  if (lower.includes("proud") || lower.includes("achieved") || lower.includes("expert") || lower.includes("skill") || lower.includes("confidence") || lower.includes("succeed") || lower.includes("fakhr")) return "proud";
  if (lower.includes("sad") || lower.includes("sorry") || lower.includes("unfortunate") || lower.includes("grief") || lower.includes("bad") || lower.includes("regret") || lower.includes("alas") || lower.includes("cry") || lower.includes("udaas")) return "sad";
  if (lower.includes("shock") || lower.includes("surprise") || lower.includes("gasp") || lower.includes("unexpected") || lower.includes("seriously") || lower.includes("oh my")) return "surprised";
  if (lower.includes("blush") || lower.includes("shy") || lower.includes("embarrass") || lower.includes("nervous") || lower.includes("oops") || lower.includes("sorry about")) return "embarrassed";
  if (lower.includes("what?") || lower.includes("confus") || lower.includes("puzzled") || lower.includes("dont know") || lower.includes("not sure") || lower.includes("wait")) return "confused";
  return "idle";
}

export function getEmotionToneSettings(emotion: MyraaEmotion = "idle"): { pitch: number; rate: number } {
  switch (emotion) {
    case "gussa":
      return { pitch: 1.15, rate: 1.15 };
    case "naraz":
      return { pitch: 1.05, rate: 0.95 };
    case "therapist":
      return { pitch: 0.95, rate: 0.9 };
    case "loving":
      return { pitch: 1.1, rate: 0.95 };
    case "analytical":
      return { pitch: 1.0, rate: 0.98 };
    case "excited":
      return { pitch: 1.4, rate: 1.25 };
    case "happy":
      return { pitch: 1.25, rate: 1.1 };
    case "playful":
      return { pitch: 1.3, rate: 1.15 };
    case "surprised":
      return { pitch: 1.45, rate: 1.2 };
    case "curious":
      return { pitch: 1.2, rate: 1.05 };
    case "thinking":
      return { pitch: 0.88, rate: 0.88 };
    case "confused":
      return { pitch: 0.92, rate: 0.9 };
    case "sad":
      return { pitch: 0.8, rate: 0.82 };
    case "proud":
      return { pitch: 1.15, rate: 1.05 };
    case "embarrassed":
      return { pitch: 1.1, rate: 0.9 };
    case "idle":
    default:
      return { pitch: 1.0, rate: 1.0 };
  }
}

export function evaluateVoiceAnswerScore(spokenText: string, correctAnswer: string): {
  scorePercent: number;
  feedback: string;
} {
  if (!spokenText || !correctAnswer) {
    return { scorePercent: 0, feedback: "No spoken audio or target answer provided." };
  }

  const sanitize = (t: string) =>
    t
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\n]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const spokenWords = sanitize(spokenText);
  const correctWords = sanitize(correctAnswer);

  if (correctWords.length === 0) {
    return { scorePercent: 100, feedback: "Perfect! The target answer is empty." };
  }

  const stopwords = new Set(["the", "and", "for", "are", "but", "not", "you", "this", "that", "with", "from", "they", "your"]);
  const targetKeywords = correctWords.filter((w) => !stopwords.has(w));
  if (targetKeywords.length === 0) {
    targetKeywords.push(...correctWords);
  }

  const matchedWords = targetKeywords.filter((w) => spokenWords.some((sw) => sw.includes(w) || w.includes(sw)));

  const scorePercent = Math.min(100, Math.round((matchedWords.length / targetKeywords.length) * 100));

  let feedback = "";
  if (scorePercent >= 75) {
    feedback = "🌟 Outstanding recall! Hit all core keywords flawlessly.";
  } else if (scorePercent >= 40) {
    feedback = "👍 Nice try! Identified some essential elements. Keep reviewing.";
  } else {
    feedback = "🧐 Needs work! Compare your spoken thoughts to the card detail.";
  }

  return { scorePercent, feedback };
}
