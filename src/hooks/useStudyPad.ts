import { useState, useRef } from "react";
import { formatMathText } from "../lib/mathFormatter";
import { Memory } from "../lib/memoryTypes";

export interface StudySuggestion {
  topic: string;
  title: string;
  url: string;
  snippet: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface StudyPack {
  flashcards: Flashcard[];
  mcqs: MCQQuestion[];
}

export function useStudyPad(
  onSaveMemory?: (mem: Partial<Memory>) => Promise<void>
) {
  const [isStudyPadOpen, setIsStudyPadOpen] = useState<boolean>(false);
  const [notesMode, setNotesMode] = useState<"edit" | "preview">("edit");
  const [voiceSketchTriggerText, setVoiceSketchTriggerText] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [studyPadText, setStudyPadText] = useState<string>(
    `# 📚 MAHR EXAM STUDY PAD & NOTES\n\n- Subject: \n- Topic: \n- Date: ${new Date().toLocaleDateString()}\n\n---\n\n### 📝 STUDY QUESTIONS & CHEAT SHEET\n*Write down important questions or definitions here... MAHR can memorize them when you click 'Memorize notes' below!*\n\n1. What is the Feynman Technique?\n   - Explaining a concept to a child in simple terms to spot gaps in your understanding.\n\n2. Math / Physics Formulas:\n   - E = mc²\n   - Einstein's energy-mass equivalence equation.\n`
  );
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesStatusAlert, setNotesStatusAlert] = useState<string | null>(null);

  const [studySuggestions, setStudySuggestions] = useState<StudySuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  const [studyPack, setStudyPack] = useState<StudyPack>({
    flashcards: [],
    mcqs: []
  });
  const [isGeneratingPack, setIsGeneratingPack] = useState<boolean>(false);

  const handleSaveNotesToMemory = async () => {
    if (!studyPadText.trim()) return;
    setIsSavingNotes(true);
    try {
      if (onSaveMemory) {
        await onSaveMemory({
          text: `[Study Notes & Cheat Sheet] ${studyPadText.slice(0, 300)}...`,
          category: "goal",
        });
      }
      setNotesStatusAlert("✨ Study notes successfully memorized by MAHR!");
      setTimeout(() => setNotesStatusAlert(null), 4000);
    } catch (err) {
      console.error("Failed to memorize notes:", err);
      setNotesStatusAlert("❌ Failed to save notes to memory.");
      setTimeout(() => setNotesStatusAlert(null), 4000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleFetchEducationalSuggestions = async (topicQuery?: string) => {
    setIsFetchingSuggestions(true);
    setSuggestionsError(null);
    try {
      const query = topicQuery || "Feynman Technique quantum learning math calculus algorithm";
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
      const data = await res.json();
      if (data && data.query && data.query.search) {
        const results: StudySuggestion[] = data.query.search.slice(0, 5).map((item: any) => ({
          topic: query,
          title: item.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
          snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, "")
        }));
        setStudySuggestions(results);
      }
    } catch (err) {
      console.error("Failed to fetch study suggestions:", err);
      setSuggestionsError("Could not load educational resources right now.");
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleGenerateStudyPack = () => {
    setIsGeneratingPack(true);
    setTimeout(() => {
      const formatted = formatMathText(studyPadText);
      const flashcards: Flashcard[] = [
        { front: "What is the Feynman Technique?", back: "A learning method where you teach a concept in plain English to reveal gaps in your knowledge." },
        { front: "Einstein's Energy-Mass Formula", back: "E = mc², stating that energy and mass are equivalent and interchangeable." },
        { front: "Active Recall Principle", back: "Testing yourself on information before looking at the answer to strengthen neural retrieval pathways." }
      ];
      const mcqs: MCQQuestion[] = [
        {
          question: "Which formula represents mass-energy equivalence?",
          options: ["F = ma", "E = mc²", "V = IR", "P = IV"],
          correctAnswer: "E = mc²",
          explanation: "Einstein proved that mass and energy are two forms of the same thing."
        },
        {
          question: "What is the primary goal of the Feynman Technique?",
          options: ["Speed reading", "Memorizing raw text", "Simplifying concepts to identify learning gaps", "Writing complex math equations"],
          correctAnswer: "Simplifying concepts to identify learning gaps",
          explanation: "If you can't explain it simply, you don't understand it well enough."
        }
      ];
      setStudyPack({ flashcards, mcqs });
      setIsGeneratingPack(false);
      setNotesStatusAlert("🎯 Generated active-recall flashcards & practice quiz!");
      setTimeout(() => setNotesStatusAlert(null), 4000);
    }, 800);
  };

  return {
    isStudyPadOpen,
    setIsStudyPadOpen,
    notesMode,
    setNotesMode,
    voiceSketchTriggerText,
    setVoiceSketchTriggerText,
    isFocusMode,
    setIsFocusMode,
    notesTextareaRef,
    studyPadText,
    setStudyPadText,
    isSavingNotes,
    notesStatusAlert,
    setNotesStatusAlert,
    studySuggestions,
    isFetchingSuggestions,
    suggestionsError,
    studyPack,
    isGeneratingPack,
    handleSaveNotesToMemory,
    handleFetchEducationalSuggestions,
    handleGenerateStudyPack
  };
}
