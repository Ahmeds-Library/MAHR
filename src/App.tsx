import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MyraaAudioSession, LiveState, setGlobalAudioSession } from "@lib/audio";
import { MahrCoreVisualizer, MahrEmotion, MyraaCoreVisualizer, MyraaEmotion } from "@components/MahrCoreVisualizer";
import { 
  Power, 
  Volume2, 
  Info, 
  Sparkles, 
  Globe, 
  ExternalLink,
  Maximize2, 
  MessageSquare,
  MessageSquareOff, 
  Compass, 
  CircleAlert,
  MicOff,
  Mic,
  X,
  Brain,
  Monitor,
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  Sliders,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Award,
  PenTool,
  Check,
  Cpu,
  Bold,
  List,
  Eye,
  Edit,
  Bot,
  Calendar,
  Menu,
  Sparkles as SparklesIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Memory, MemoryCategory, ChatMessage } from "@lib/memoryTypes";
import { MemoryDashboard } from "@components/MemoryDashboard";
import { KnowledgeGraphDashboard } from "@components/KnowledgeGraphDashboard";
import { ChatJournal } from "@components/ChatJournal";
import { Chalkboard } from "@components/Chalkboard";
import { MahrCollaborationSuite } from "@components/MahrCollaborationSuite";
import { StudyPadPanel } from "@components/StudyPadPanel";
import { UniversalSimulationStudio } from "@components/simulation/UniversalSimulationStudio";
import { ProactiveTaskReminderToast } from "@components/ProactiveTaskReminderToast";
import { MagnifierOverlay } from "@components/MagnifierOverlay";
import { FloatingScreenShareHub } from "@components/FloatingScreenShareHub";
import { ScreenShareMagnifierModal } from "@components/ScreenShareMagnifierModal";
import { generateAIMindMapFromText, generateVoiceToMindMap, cleanSpokenTranscript } from "@lib/mindMapGenerator";
import { layoutVisualDiagram } from "@lib/diagramLayout";
import { useStudyPad } from "@hooks/useStudyPad";
import { useWakeWordEngine } from "@hooks/useWakeWordEngine";
import { useDailyTasksAndMemories } from "@hooks/useDailyTasksAndMemories";
import { useAudioSessionManager } from "@hooks/useAudioSessionManager";
import { useAskMahr } from "@hooks/useAskMahr";
import { detectEmotionFromText, evaluateVoiceAnswerScore } from "@/services/speechToneEngine";
import { speakUtterance, stopAllSpeech, triggerProactivePause, isCurrentlyInProactivePause, setGlobalSpeechMood } from "@/services/speechSynthesisService";
import { 
  buildVectorKnowledgeGraph, 
  queryVectorMemory, 
  findSemanticallySimilarMemory, 
  formatVectorGroundingPrompt 
} from "@/services/vectorMemoryEngine";
import { SkillsManager } from "@components/SkillsManager";
import { ModelSwitcherModal } from "@components/ModelSwitcherModal";
import { SubAgentsStudio } from "@components/SubAgentsStudio";
import { DailyTaskManager } from "@components/DailyTaskManager";
import { HeaderNav } from "@components/HeaderNav";
import { DesktopAndRemoteModal } from "@components/desktop/DesktopAndRemoteModal";
import { useDesktopApp } from "@hooks/useDesktopApp";
import { registerGlobalSummonListener } from "@/services/platformAdapter";
import { MAHROfficeModal } from "@office/MAHROfficeModal";
import { GlobalAlerts } from "@components/GlobalAlerts";
import { VoiceDialogueToast } from "@components/VoiceDialogueToast";
import { FooterVisualizer } from "@components/FooterVisualizer";
import { AskMahrModal, AskMahrModal as AskMyraaModal } from "@components/AskMahrModal";
import { KeyboardShortcutsModal } from "@components/KeyboardShortcutsModal";
import { SettingsModal } from "@components/settings/SettingsModal";
import { SystemSettingsState, saveSettingToDB, loadSettingsFromDB, runSettingsDiagnosticCycle } from "@/services/settingsService";
import { VoiceCommand, matchVoiceCommand, detectVoiceAction } from "@/services/voiceCommandService";
import { getThemeConfig, getVisualizerBarStyle } from "@/services/themeService";
import { analyzeSpeechColorPsychology, PsychologyProfile, PSYCHOLOGY_PROFILES } from "@/services/colorPsychologyEngine";
import { HumanMoodStudio } from "@components/HumanMoodStudio";
import { GranularMeshGradientBackground } from "@components/GranularMeshGradientBackground";
import { HumanMoodType, HUMAN_MOOD_CONFIGS, detectHumanMoodFromDialogue } from "@/services/humanEmotionEngine";
import { classifyMemoryFromText } from "@/services/memoryClassifierService";
import { 
  loadRLPolicy, 
  saveRLPolicy, 
  RLPolicyParameters, 
  DEFAULT_RL_POLICY, 
  evaluateTurnReward, 
  updateRLPolicy, 
  loadKnowledgeDeficits, 
  saveKnowledgeDeficits, 
  KnowledgeDeficit, 
  detectKnowledgeDeficit,
  detectQueryComplexity 
} from "@/services/reinforcementLearningEngine";
import { ReinforcementLearningStudio } from "@components/ReinforcementLearningStudio";
import { initActivityTracker, recordUserActivity, checkProactiveReminder } from "@/services/proactiveReminderEngine";
import { 
  SUPPORTED_AI_MODELS, 
  PRESET_SUBAGENTS, 
  SubAgent, 
  DailyTask, 
  AIModelConfig 
} from "@lib/subagentTypes";
import { getSkillsFromDB, dbGet, dbSet, dbRemove } from "@lib/db";
import { formatMathText } from "@lib/mathFormatter";
import confetti from "canvas-confetti";

const studyTabVariants = {
  initial: { opacity: 0, x: 15 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -15, transition: { duration: 0.2, ease: "easeIn" } }
};

function pruneChatHistory(history: ChatMessage[], maxCount: number, retentionMinutes: number): ChatMessage[] {
  let pruned = [...history];

  if (retentionMinutes > 0) {
    const now = Date.now();
    const cutoff = now - retentionMinutes * 60 * 1000;
    pruned = pruned.filter(msg => {
      const msgTime = new Date(msg.timestamp).getTime();
      return msgTime >= cutoff;
    });
  }

  if (maxCount > 0 && pruned.length > maxCount) {
    pruned = pruned.slice(pruned.length - maxCount);
  }

  return pruned;
}

export default function App() {
  const [state, setState] = useState<LiveState>("disconnected");

  // Multi-directional celebratory confetti burst helper
  const triggerConfetti = () => {
    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4"]
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.75 },
        colors: ["#10b981", "#6366f1", "#06b6d4"]
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.75 },
        colors: ["#10b981", "#6366f1", "#06b6d4"]
      });
    }, 350);
  };

  // Sound filtration and auto-interruption settings
  const [autoInterrupt, setAutoInterrupt] = useState<boolean>(false);
  const [noiseGate, setNoiseGate] = useState<number>(0.005);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showChatJournal, setShowChatJournal] = useState<boolean>(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState<boolean>(false);
  const [chatMaxMessages, setChatMaxMessages] = useState<number>(30);
  const [chatRetentionTime, setChatRetentionTime] = useState<number>(60);
  const [isStorageInitialized, setIsStorageInitialized] = useState<boolean>(false);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState<boolean>(true);
  const [wakeWordRipple, setWakeWordRipple] = useState<number>(0);
  const [sleepRipple, setSleepRipple] = useState<number>(0);
  const [voiceConfidence, setVoiceConfidence] = useState<number>(75);
  const lastConfidenceUpdateRef = useRef<number>(0);
  const wakeWordRecognitionRef = useRef<any>(null);
  const wakeWordRestartTimeoutRef = useRef<any>(null);

  const chatMaxMessagesRef = useRef<number>(30);
  const chatRetentionTimeRef = useRef<number>(60);

  useEffect(() => {
    chatMaxMessagesRef.current = chatMaxMessages;
    if (isStorageInitialized) {
      dbSet("myraa_chat_max_messages", chatMaxMessages);
    }
  }, [chatMaxMessages, isStorageInitialized]);

  useEffect(() => {
    chatRetentionTimeRef.current = chatRetentionTime;
    if (isStorageInitialized) {
      dbSet("myraa_chat_retention_time", chatRetentionTime);
    }
  }, [chatRetentionTime, isStorageInitialized]);

  // Myraa recollections database core state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [deletedMemoryIds, setDeletedMemoryIds] = useState<string[]>([]);
  const [isMemoryLoaded, setIsMemoryLoaded] = useState<boolean>(false);
  const deletedMemoryIdsRef = useRef<string[]>([]);
  const [showMemoryDashboard, setShowMemoryDashboard] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [offlineDeletedQueue, setOfflineDeletedQueue] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDesktopRemoteModalOpen, setIsDesktopRemoteModalOpen] = useState<boolean>(false);
  const { isBrowser } = useDesktopApp();

  // Global Summon Hotkey Listener (Ctrl+Shift+M / Alt+M / Electron)
  useEffect(() => {
    const unsub = registerGlobalSummonListener(() => {
      setIsDesktopRemoteModalOpen((prev) => !prev);
    });
    return unsub;
  }, []);

  // Reinforcement Learning & Continuous Self-Reflection States
  const [isRLStudioOpen, setIsRLStudioOpen] = useState<boolean>(false);
  const [rlPolicy, setRlPolicy] = useState<RLPolicyParameters>(DEFAULT_RL_POLICY);
  const [knowledgeDeficits, setKnowledgeDeficits] = useState<KnowledgeDeficit[]>([]);

  // Project-wide refs for vector search and prompt grounding
  const memoriesRef = useRef<Memory[]>(memories);
  useEffect(() => {
    memoriesRef.current = memories;
  }, [memories]);

  const rlPolicyRef = useRef<RLPolicyParameters>(rlPolicy);
  useEffect(() => {
    rlPolicyRef.current = rlPolicy;
  }, [rlPolicy]);

  const knowledgeDeficitsRef = useRef<KnowledgeDeficit[]>(knowledgeDeficits);
  useEffect(() => {
    knowledgeDeficitsRef.current = knowledgeDeficits;
  }, [knowledgeDeficits]);

  const studyPadTextRef = useRef<string>("");
  const whiteboardTextRef = useRef<string>("");

  // Intelligent fact extraction helper for long-term memory with Vector Database Semantic Similarity check
  const extractAndStoreUserMemories = useCallback((userText: string) => {
    if (!userText || userText.trim().length < 6) return;

    const classified = classifyMemoryFromText(userText);
    if (!classified) return;

    setMemories((prev) => {
      const currentList = prev || [];

      // 1. Vector Database Semantic Similarity Check (Cosine Similarity >= 0.82)
      const semanticMatch = findSemanticallySimilarMemory(classified.extractedFact, currentList, 0.82);

      if (semanticMatch) {
        // High semantic similarity: reinforce existing memory instead of creating redundant duplicates
        const updatedList = [...currentList];
        const existing = updatedList[semanticMatch.index];
        const mergedTags = Array.from(new Set([...(existing.tags || []), ...(classified.tags || [])]));

        updatedList[semanticMatch.index] = {
          ...existing,
          confidence: Math.min(1.0, Number(((existing.confidence || 0.8) + 0.1).toFixed(2))),
          tags: mergedTags,
          projectId: classified.projectId || existing.projectId,
          dueDate: classified.dueDate || existing.dueDate,
          updatedAt: new Date().toISOString(),
        };

        dbSet("myraa_persistent_memories", updatedList);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("myraa-memory-reinforced", {
              detail: {
                memory: updatedList[semanticMatch.index],
                similarity: semanticMatch.similarity,
                newFact: classified.extractedFact
              }
            })
          );
        }

        return updatedList;
      }

      // Check for exact substring match as secondary guard
      if (currentList.some((m) => m.text.toLowerCase().includes(userText.toLowerCase().slice(0, 25)))) {
        return currentList;
      }

      // 2. Distinct novel fact: create new memory node and store in vector database
      const newMemory: Memory = {
        id: "mem_" + Math.random().toString(36).substring(2, 11),
        category: classified.category,
        text: classified.extractedFact,
        projectId: classified.projectId,
        dueDate: classified.dueDate,
        tags: classified.tags,
        confidence: classified.confidence,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newMemory, ...currentList];
      dbSet("myraa_persistent_memories", updated);

      // Async push to server memory API
      try {
        fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMemory)
        }).catch(() => {});
      } catch (e) {}

      return updated;
    });
  }, []);

  // Pulls related memories from the vector database and checks query complexity
  const pullRelatedMemoriesAndInformResponse = useCallback((userQuery: string) => {
    if (!userQuery || userQuery.trim().length < 4) return;

    try {
      // 1. Analyze query complexity with Reinforcement Learning Engine
      const complexity = detectQueryComplexity(userQuery, rlPolicyRef.current);

      // 2. Build whole-project vector knowledge graph representation
      const activeMemories = (memoriesRef.current || []).filter(
        (m) => m && m.id && !deletedMemoryIdsRef.current.includes(m.id)
      );

      const projectGraph = buildVectorKnowledgeGraph(
        activeMemories,
        [],
        [],
        0.32,
        {
          studyPadText: studyPadTextRef.current,
          whiteboardText: whiteboardTextRef.current,
          knowledgeDeficits: knowledgeDeficitsRef.current,
        }
      );

      // 3. Query vector database for top matching memories and project artifacts
      const queryResult = queryVectorMemory(userQuery, projectGraph, 5);
      const relevantMatches = (queryResult.topMatches || []).filter((m) => m.similarity >= 0.30);

      // 4. If query is complex, activate proactive pause with natural vocal filler ('hmm', 'let me see')
      if (complexity.isComplex) {
        triggerProactivePause({
          queryText: userQuery,
          complexityAssessment: complexity,
          vocalizeFiller: true,
        });
        setCharacterState("thinking");
      }

      // 5. When related memories exist, ground the Gemini Live session context before response
      if (relevantMatches.length > 0 && sessionRef.current) {
        const groundingBlock = formatVectorGroundingPrompt(relevantMatches);
        sessionRef.current.sendTextMessage(groundingBlock);
      }
    } catch (err) {
      console.warn("[App] Non-fatal error during vector memory pull:", err);
    }
  }, []);

  const chatHistoryRef = useRef<ChatMessage[]>(chatHistory);
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  // Syncs the unified chatHistory reference
  const syncStateToSession = useCallback((customHistory?: ChatMessage[]) => {
    const historyToSync = customHistory || chatHistoryRef.current;
    if (!historyToSync || historyToSync.length === 0) return;
    chatHistoryRef.current = historyToSync;
  }, []);

  const appendToChatHistory = useCallback((
    role: "user" | "model", 
    text: string, 
    meta?: {
      actionExecuted?: string;
      groundingSources?: any[];
      searchQueries?: string[];
      mediaItems?: any[];
      isStreaming?: boolean;
    }
  ) => {
    if (!text || !text.trim()) return;

    // Automatically extract facts if user is speaking or sending message
    if (role === "user") {
      extractAndStoreUserMemories(text);
      pullRelatedMemoriesAndInformResponse(text);

      // Reinforcement learning feedback evaluation on user's response to Mahr
      const history = chatHistoryRef.current || [];
      const lastModelMsg = [...history].reverse().find((m) => m.role === "model");
      if (lastModelMsg && lastModelMsg.text.trim()) {
        const evalRes = evaluateTurnReward(text, lastModelMsg.text);
        if (evalRes.reward !== 0) {
          setRlPolicy((prev) => updateRLPolicy(prev, evalRes.reward, "general"));
        }
      }
    } else if (role === "model") {
      // Model answered - check if model revealed a deficit or inability
      const history = chatHistoryRef.current || [];
      const lastUserMsg = [...history].reverse().find((m) => m.role === "user");
      if (lastUserMsg && lastUserMsg.text.trim()) {
        const deficitCheck = detectKnowledgeDeficit(lastUserMsg.text, text);
        if (deficitCheck?.shouldRecord) {
          const newDef: KnowledgeDeficit = {
            id: "def_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            topic: deficitCheck.topic,
            userPrompt: lastUserMsg.text,
            reason: deficitCheck.reason,
            suggestedAction: deficitCheck.suggestedAction,
            status: "open",
            severity: deficitCheck.severity,
            createdAt: new Date().toISOString(),
            tags: ["autonomous-learning", "reinforcement"]
          };
          setKnowledgeDeficits((prev) => {
            if (prev.some((d) => d.topic.toLowerCase() === newDef.topic.toLowerCase())) return prev;
            const updated = [newDef, ...prev];
            saveKnowledgeDeficits(updated);
            return updated;
          });
        }
      }
    }

    setChatHistory((prev) => {
      const updated = prev.map((msg) => ({ ...msg }));
      const lastMsg = updated[updated.length - 1];
      const now = Date.now();
      const lastMsgTime = lastMsg?.timestamp ? new Date(lastMsg.timestamp).getTime() : 0;
      const isRecentStreamChunk = lastMsg && lastMsg.role === role && (now - lastMsgTime < 2500 || meta?.isStreaming);

      if (isRecentStreamChunk && lastMsg) {
        if (text.startsWith(lastMsg.text)) {
          lastMsg.text = text;
        } else if (!lastMsg.text.endsWith(" ") && !text.startsWith(" ") && !text.startsWith(",") && !text.startsWith(".")) {
          lastMsg.text += " " + text;
        } else {
          lastMsg.text += text;
        }
        lastMsg.timestamp = new Date().toISOString();
        if (meta?.actionExecuted) lastMsg.actionExecuted = meta.actionExecuted;
        if (meta?.groundingSources) lastMsg.groundingSources = meta.groundingSources;
        if (meta?.searchQueries) lastMsg.searchQueries = meta.searchQueries;
        if (meta?.mediaItems) lastMsg.mediaItems = meta.mediaItems;
      } else {
        updated.push({
          id: "msg_" + Math.random().toString(36).substring(2, 11),
          role: role,
          text: text,
          timestamp: new Date().toISOString(),
          actionExecuted: meta?.actionExecuted,
          groundingSources: meta?.groundingSources,
          searchQueries: meta?.searchQueries,
          mediaItems: meta?.mediaItems,
        });
      }
      const pruned = pruneChatHistory(updated, chatMaxMessagesRef.current, chatRetentionTimeRef.current);
      
      // Real-time continuous JSON save
      dbSet("myraa_chat_history", pruned);
      try {
        localStorage.setItem("myraa_chat_history_backup", JSON.stringify(pruned));
        localStorage.setItem("myraa_live_transcript_last", JSON.stringify({
          role,
          text,
          timestamp: new Date().toISOString(),
          retentionMinutes: chatRetentionTimeRef.current
        }));
      } catch (e) {}

      if (role === "user") {
        syncStateToSession(pruned);
      }

      return pruned;
    });
  }, [extractAndStoreUserMemories, syncStateToSession]);

  const insertActionToChatHistory = useCallback((text: string) => {
    if (!text || !text.trim()) return;
    setChatHistory((prev) => {
      const updated = [...prev];
      updated.push({
        id: "msg_" + Math.random().toString(36).substring(2, 11),
        role: "model",
        text: text,
        timestamp: new Date().toISOString(),
      });
      const pruned = pruneChatHistory(updated, chatMaxMessagesRef.current, chatRetentionTimeRef.current);
      dbSet("myraa_chat_history", pruned);
      try {
        localStorage.setItem("myraa_chat_history_backup", JSON.stringify(pruned));
      } catch (e) {}
      return pruned;
    });
  }, []);

  // Holographic Screen Zoom & Guided Focus Ruler states
  const [isMagnifierOpen, setIsMagnifierOpen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.5);
  const [isRulerEnabled, setIsRulerEnabled] = useState<boolean>(true);
  const [magnifierRulerY, setMagnifierRulerY] = useState<number>(50);

  // Interactive Student Notepad / Study Pad states
  const [isStudyPadOpen, setIsStudyPadOpen] = useState<boolean>(false);
  const [notesMode, setNotesMode] = useState<"edit" | "preview">("edit");
  const [voiceSketchTriggerText, setVoiceSketchTriggerText] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [studyPadText, setStudyPadText] = useState<string>(
    `# 📚 MAHR EXAM STUDY PAD & NOTES\n\n- Subject: \n- Topic: \n- Date: ${new Date().toLocaleDateString()}\n\n---\n\n### 📝 STUDY QUESTIONS & CHEAT SHEET\n*Write down important questions or definitions here... MAHR can memorize them when you click 'Memorize notes' below!*\n\n1. What is the Feynman Technique?\n   - Explaining a concept to a child in simple terms to spot gaps in your understanding.\n\n2. Math / Physics Formulas:\n   - E = mc²\n   - Einstein's energy-mass equivalence equation.\n`
  );
  useEffect(() => {
    studyPadTextRef.current = studyPadText;
  }, [studyPadText]);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesStatusAlert, setNotesStatusAlert] = useState<string | null>(null);

  // Predictive Study Suggestions states (Wikipedia and Educational resources)
  const [studySuggestions, setStudySuggestions] = useState<Array<{
    topic: string;
    title: string;
    url: string;
    snippet: string;
  }>>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Generated Flashcards, MCQs, and Material states
  const [studyPack, setStudyPack] = useState<{
    flashcards: { front: string; back: string }[];
    mcqs: { question: string; options: string[]; correctAnswer: string; explanation: string }[];
    materials: { title: string; summary: string; keyTakeaways: string[] }[];
  } | null>(null);
  const [isGeneratingPack, setIsGeneratingPack] = useState<boolean>(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: string }>({});
  const [revealedExplanations, setRevealedExplanations] = useState<{ [qIndex: number]: boolean }>({});
  const [studyActiveTab, setStudyActiveTab] = useState<"notes" | "collab" | "flashcards" | "quiz" | "materials">("notes");

  // Web Speech API Voice synthesis and recognition states for Flashcards
  const [isSpeakingCard, setIsSpeakingCard] = useState<boolean>(false);
  const [isListeningSpeech, setIsListeningSpeech] = useState<boolean>(false);
  const [spokenAnswerTranscript, setSpokenAnswerTranscript] = useState<string>("");
  const [voiceMatchScore, setVoiceMatchScore] = useState<number | null>(null);
  const [voiceMatchFeedback, setVoiceMatchFeedback] = useState<string | null>(null);

  // High-Context Model Switcher & Token Capacity States
  const [isModelSwitcherOpen, setIsModelSwitcherOpen] = useState<boolean>(false);
  const [activeModelId, setActiveModelId] = useState<string>("gemini-3.1-flash-lite");
  const lastSleepTriggerTimeRef = useRef<number>(0);

  // Sub-Agents Orchestrator & Studio States
  const [isSubAgentsStudioOpen, setIsSubAgentsStudioOpen] = useState<boolean>(false);
  const [isMunderDifflinOpen, setIsMunderDifflinOpen] = useState<boolean>(false);
  const [isSlidesStudioOpen, setIsSlidesStudioOpen] = useState<boolean>(false);
  const [slidesStudioTopic, setSlidesStudioTopic] = useState<string>("Autonomous AI Agents in 2026");
  const [activeSubAgent, setActiveSubAgent] = useState<SubAgent>(PRESET_SUBAGENTS[0]);
  const [customSubAgents, setCustomSubAgents] = useState<SubAgent[]>([]);

  // Daily Tasks & Schedule Manager States
  const [isDailyTaskManagerOpen, setIsDailyTaskManagerOpen] = useState<boolean>(false);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);

  // Ask Myraa Text Assistant States
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState<boolean>(false);

  // Load Model, SubAgents, and Daily Tasks on initialization
  useEffect(() => {
    (async () => {
      // 1. Load active model & custom subagents safely from IndexedDB
      try {
        const savedModel = (await dbGet("myraa_active_model")) as string;
        if (savedModel) setActiveModelId(savedModel);

        const savedSubAgents = (await dbGet("myraa_custom_subagents")) as SubAgent[];
        if (savedSubAgents && Array.isArray(savedSubAgents)) {
          const filtered = savedSubAgents.filter(a => a.id !== "sub-dr-newton" && !a.name?.toLowerCase().includes("newton"));
          setCustomSubAgents(filtered);
          if (filtered.length !== savedSubAgents.length) {
            dbSet("myraa_custom_subagents", filtered);
          }
        }

        const savedActiveSubAgent = (await dbGet("myraa_active_subagent")) as SubAgent;
        if (
          savedActiveSubAgent &&
          savedActiveSubAgent.id !== "sub-dr-newton" &&
          !savedActiveSubAgent.name?.toLowerCase().includes("newton")
        ) {
          setActiveSubAgent(savedActiveSubAgent);
        } else {
          setActiveSubAgent(PRESET_SUBAGENTS[0]);
          dbSet("myraa_active_subagent", PRESET_SUBAGENTS[0]);
        }
      } catch (err) {
        console.warn("Local model/subagent persistence check:", err);
      }

      // 2. Load daily tasks from local IndexedDB cache first, then sync with backend
      try {
        const localTasks = await dbGet("myraa_daily_tasks");
        if (localTasks && Array.isArray(localTasks) && localTasks.length > 0) {
          setDailyTasks(localTasks);
        }

        const res = await fetch("/api/daily-tasks");
        if (res.ok) {
          const data = await res.json();
          if (data.tasks && Array.isArray(data.tasks)) {
            setDailyTasks(data.tasks);
            dbSet("myraa_daily_tasks", data.tasks);
          }
        }
      } catch {
        // Backend still spinning up or offline; offline local IndexedDB cache is already in place
        console.info("Daily tasks loaded from local offline store.");
      }
    })();
  }, []);

  const handleSelectModel = (modelId: string) => {
    setActiveModelId(modelId);
    dbSet("myraa_active_model", modelId);
  };

  const handleSelectSubAgent = (agent: SubAgent) => {
    setActiveSubAgent(agent);
    if (agent.modelId) {
      setActiveModelId(agent.modelId);
      dbSet("myraa_active_model", agent.modelId);
    }
    dbSet("myraa_active_subagent", agent);

    // 1. Fully re-initialize conversation history memory buffers
    const initMessage: ChatMessage = {
      id: "persona-init-" + Date.now(),
      role: "model",
      text: `✨ Active Persona Switched: ${agent.name} (${agent.role}). System prompts & conversation memory re-initialized.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setChatHistory([initMessage]);
    dbSet("myraa_chat_history", [initMessage]);
    fetch("/api/chat/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatHistory: [initMessage] })
    }).catch((e) => console.warn("Failed syncing chat history on subagent switch:", e));

    // 2. Clear & reset Ask Myraa text assistant message history buffer
    if (resetAskMyraaMessages) {
      resetAskMyraaMessages(agent);
    }

    // 3. Re-initialize live session websocket with personality-specific system prompt & parameters
    if (sessionRef.current && stateRef.current !== "disconnected") {
      setNotesStatusAlert(`✨ Transitioning voice persona to ${agent.name}...`);
      sessionRef.current.disconnect();
      setTimeout(async () => {
        if (sessionRef.current) {
          userClickedDisconnectRef.current = false;
          await sessionRef.current.connect(agentMode, studyPadText + " " + whiteboardText, agent);
          setIsMicDenied(sessionRef.current?.isMicDenied || false);
          setNotesStatusAlert(`✨ Activated Persona: ${agent.name}! System prompt & knowledge updated.`);
          setTimeout(() => setNotesStatusAlert(null), 3500);
        }
      }, 350);
    } else {
      setNotesStatusAlert(`✨ Selected Persona: ${agent.name}. System prompt & knowledge active.`);
      setTimeout(() => setNotesStatusAlert(null), 3500);
    }
  };

  const handleCreateCustomSubAgent = (agentData: Omit<SubAgent, "id">) => {
    const newAgent: SubAgent = {
      ...agentData,
      id: "custom-agent-" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    const updated = [...customSubAgents, newAgent];
    setCustomSubAgents(updated);
    dbSet("myraa_custom_subagents", updated);
    handleSelectSubAgent(newAgent);
  };

  const handleDeleteCustomSubAgent = (id: string) => {
    const updated = customSubAgents.filter(a => a.id !== id);
    setCustomSubAgents(updated);
    dbSet("myraa_custom_subagents", updated);
    if (activeSubAgent.id === id) {
      handleSelectSubAgent(PRESET_SUBAGENTS[0]);
    }
  };

  const handleAddDailyTask = async (taskData: Omit<DailyTask, "id" | "createdAt">) => {
    const newTask: DailyTask = {
      ...taskData,
      id: "task-" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    const updated = [newTask, ...dailyTasks];
    setDailyTasks(updated);
    dbSet("myraa_daily_tasks", updated);
    try {
      await fetch("/api/daily-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updated })
      });
    } catch {
      // Saved offline to IndexedDB
    }
  };

  const handleToggleDailyTask = async (id: string) => {
    const updated = dailyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setDailyTasks(updated);
    dbSet("myraa_daily_tasks", updated);
    try {
      await fetch("/api/daily-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updated })
      });
    } catch {
      // Saved offline to IndexedDB
    }
  };

  const handleDeleteDailyTask = async (id: string) => {
    const updated = dailyTasks.filter(t => t.id !== id);
    setDailyTasks(updated);
    dbSet("myraa_daily_tasks", updated);
    try {
      await fetch("/api/daily-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updated })
      });
    } catch {
      // Saved offline to IndexedDB
    }
  };

  const handleAutoGenerateDailyTasks = async () => {
    try {
      const res = await fetch("/api/daily-tasks/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          setDailyTasks(data.tasks);
          dbSet("myraa_daily_tasks", data.tasks);
          triggerConfetti();
        }
      }
    } catch {
      // Fallback
    }
  };

  // Stop speech synthesis and listening on card shift
  useEffect(() => {
    stopAllSpeech();
    setIsSpeakingCard(false);
    setIsListeningSpeech(false);
    setSpokenAnswerTranscript("");
    setVoiceMatchScore(null);
    setVoiceMatchFeedback(null);
  }, [activeCardIndex]);

  // Clean up speech on page unload
  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  const speakNotification = (msg: string | { ur?: string; en?: string }, overrideEmotion?: MyraaEmotion) => {
    const textToSpeak = typeof msg === "string" ? msg : (msg.en || msg.ur || "");
    if (!textToSpeak) return;

    speakUtterance({
      text: textToSpeak,
      overrideEmotion,
      activeEmotion,
      mood: currentHumanMood,
      speechRate,
      speechPitch,
    });
  };

  const handleSpeakCard = (textToSpeak?: string, overrideEmotion?: MyraaEmotion) => {
    if (isSpeakingCard) {
      stopAllSpeech();
      setIsSpeakingCard(false);
      return;
    }

    const text = textToSpeak || (isCardFlipped 
      ? `Answer is: ${studyPack?.flashcards[activeCardIndex]?.back}`
      : `Question: ${studyPack?.flashcards[activeCardIndex]?.front}`);

    if (!text) return;

    speakUtterance({
      text,
      overrideEmotion,
      activeEmotion,
      mood: currentHumanMood,
      speechRate: 1.0,
      speechPitch: 1.0,
      onStart: () => setIsSpeakingCard(true),
      onEnd: () => setIsSpeakingCard(false),
      onError: () => setIsSpeakingCard(false),
    });
  };

  const evaluateVoiceAnswer = (spokenText: string, correctAnswer: string) => {
    const { scorePercent, feedback } = evaluateVoiceAnswerScore(spokenText, correctAnswer);
    setVoiceMatchScore(scorePercent);
    setVoiceMatchFeedback(feedback);
    if (scorePercent >= 75) {
      triggerConfetti();
    }
  };

  const handleVoiceAnswerGuess = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setNotesStatusAlert("⚠️ Speech Recognition is not supported in this browser.");
      setTimeout(() => setNotesStatusAlert(null), 3500);
      return;
    }

    if (isListeningSpeech) {
      setIsListeningSpeech(false);
      return;
    }

    setSpokenAnswerTranscript("");
    setVoiceMatchScore(null);
    setVoiceMatchFeedback(null);

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListeningSpeech(true);
      stopAllSpeech();
      setIsSpeakingCard(false);
    };

    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      setIsListeningSpeech(false);
      if (e.error === "not-allowed") {
        setNotesStatusAlert("🎙️ Microphone permissions are blocked. Allow mic in browser settings.");
      } else {
        setNotesStatusAlert(`⚠️ Microphone Capture error: ${e.error}`);
      }
      setTimeout(() => setNotesStatusAlert(null), 4000);
    };

    rec.onend = () => {
      setIsListeningSpeech(false);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setSpokenAnswerTranscript(transcript);
        const correctBack = studyPack?.flashcards[activeCardIndex]?.back || "";
        evaluateVoiceAnswer(transcript, correctBack);
      }
    };

    rec.start();
  };

  // Interactive Whiteboard / Digital Chalkboard states
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);
  const [isSimulationStudioOpen, setIsSimulationStudioOpen] = useState<boolean>(false);
  const [isHumanMoodStudioOpen, setIsHumanMoodStudioOpen] = useState<boolean>(false);
  const [currentHumanMood, setCurrentHumanMood] = useState<HumanMoodType>("neutral");
  useEffect(() => {
    setGlobalSpeechMood(currentHumanMood);
  }, [currentHumanMood]);
  const [moodShiftReason, setMoodShiftReason] = useState<string | null>(null);
  const [simulationPrompt, setSimulationPrompt] = useState<string>("Human lungs breathing with asthma");
  const [whiteboardText, setWhiteboardText] = useState<string>(
    `# 🎓 MAHR's Digital Classroom Whiteboard\n\nWelcome! This is our interactive visual slate where I will write equations, proofs, coding examples, or diagrams in real time while we speak.\n\n### 💡 CURRENT CLASSROOM TOPICS\n- Click **CHALKBOARD** tab to scribble, draw, or practice math problems with your mouse/touch!\n- Ask me: *"Explain the quadratic formula on the whiteboard"*\n- Or: *"Draw the molecular structure of water on the slate"* and watch me sketch / write!`
  );
  useEffect(() => {
    whiteboardTextRef.current = whiteboardText;
  }, [whiteboardText]);
  const [whiteboardDiagramType, setWhiteboardDiagramType] = useState<string>("notes");
  const [whiteboardStatusAlert, setWhiteboardStatusAlert] = useState<string | null>(null);
  const [whiteboardActiveMode, setWhiteboardActiveMode] = useState<"text" | "canvas" | "split">("split");
  const [whiteboardDrawings, setWhiteboardDrawings] = useState<any[]>([]);
  const [whiteboardClearCounter, setWhiteboardClearCounter] = useState<number>(0);
  const [whiteboardCustomModelData, setWhiteboardCustomModelData] = useState<any | null>(null);

  // Debounced auto-save for structured whiteboard drawings to IndexedDB
  useEffect(() => {
    if (!isStorageInitialized) return;
    const saveTimer = setTimeout(() => {
      dbSet("myraa_whiteboard_drawings", whiteboardDrawings);
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [whiteboardDrawings, isStorageInitialized]);

  // Real-time Screen Sharing states
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isScreenSharingPaused, setIsScreenSharingPaused] = useState<boolean>(false);
  const [screenVisionMode, setScreenVisionMode] = useState<boolean>(true);

  // References to preserve state across intervals
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenIntervalRef = useRef<any>(null);

  const isPausedRef = useRef<boolean>(false);
  const screenVisionRef = useRef<boolean>(true);
  const stateRef = useRef<LiveState>("disconnected");

  // Sync state changes with refs to totally prevent stale closures in callbacks
  useEffect(() => {
    isPausedRef.current = isScreenSharingPaused;
  }, [isScreenSharingPaused]);

  useEffect(() => {
    screenVisionRef.current = screenVisionMode;
  }, [screenVisionMode]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getScreenSnapshot = useCallback((): string | null => {
    try {
      const video = screenVideoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return null;
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(1280, video.videoWidth);
      canvas.height = Math.round((canvas.width * video.videoHeight) / video.videoWidth);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch (err) {
      console.error("[getScreenSnapshot Error]:", err);
      return null;
    }
  }, []);

  const handleExecuteActionFromChat = useCallback((action: string, args: any) => {
    console.log("[Chat Tool Action Executed]:", action, args);
    switch (action) {
      case "open_chalkboard":
        setIsWhiteboardOpen(true);
        break;
      case "change_theme":
        if (args?.theme) setThemeColor(args.theme);
        break;
      case "add_daily_task":
        if (args?.title) {
          handleAddDailyTask({
            title: args.title,
            timeBlock: args.timeBlock || args.deadline || "Today",
            priority: args.priority || "medium",
            category: (args.category?.toLowerCase() as any) || "study",
            completed: false,
            date: new Date().toISOString().split("T")[0],
            reminder: true,
          });
        }
        break;
      case "open_memory":
        setShowMemoryDashboard(true);
        break;
      case "open_sim_engine":
        setIsWhiteboardOpen(true);
        setWhiteboardActiveMode("split");
        break;
      case "open_slides_studio":
        if (args?.topic) setSlidesStudioTopic(args.topic);
        setWhiteboardDiagramType("slides");
        setWhiteboardActiveMode("canvas");
        setIsWhiteboardOpen(true);
        setWhiteboardStatusAlert(`📊 Deep Researching & Generating Slides for "${args?.topic || "Presentation"}" with Web & AI Visuals...`);
        setTimeout(() => setWhiteboardStatusAlert(null), 5000);
        break;
      case "open_mindmap":
        if (args?.topic) setSlidesStudioTopic(args.topic);
        setWhiteboardDiagramType("mindmap");
        setWhiteboardActiveMode("canvas");
        setIsWhiteboardOpen(true);
        break;
      case "open_flowchart":
        setWhiteboardDiagramType("flowchart");
        setWhiteboardActiveMode("canvas");
        setIsWhiteboardOpen(true);
        break;
      case "open_dld":
        setWhiteboardDiagramType("dld");
        setWhiteboardActiveMode("canvas");
        setIsWhiteboardOpen(true);
        break;
      case "clear_chalkboard":
        setWhiteboardClearCounter((prev) => prev + 1);
        setWhiteboardDrawings([]);
        break;
      case "close_whiteboard":
        setIsWhiteboardOpen(false);
        break;
      default:
        break;
    }
  }, [handleAddDailyTask]);

  const {
    isAskMahrOpen,
    setIsAskMahrOpen,
    isAskMyraaOpen,
    setIsAskMyraaOpen,
    askMahrInput,
    setAskMahrInput,
    askMyraaInput,
    setAskMyraaInput,
    askMahrLoading,
    setAskMahrLoading,
    askMyraaLoading,
    setAskMyraaLoading,
    askMahrMessages,
    askMyraaMessages,
    pendingImages,
    setPendingImages,
    includeScreenSnapshot,
    setIncludeScreenSnapshot,
    isAutoSpeakEnabled,
    setIsAutoSpeakEnabled,
    handleAskMahrSubmit,
    handleAskMyraaSubmit,
    resetAskMahrMessages,
    resetAskMyraaMessages,
  } = useAskMahr({
    activeModelId,
    activeSubAgent,
    studyPadText,
    whiteboardText,
    setActiveModelId,
    setNotesStatusAlert,
    getScreenSnapshot,
    onExecuteAction: handleExecuteActionFromChat,
    isScreenSharing,
    onAppendToChatHistory: (role, text, meta) => appendToChatHistory(role, text, meta),
    onSendToRealtimeSession: (text: string) => {
      if (sessionRef.current) {
        sessionRef.current.sendTextMessage(text);
      }
    },
    isRealtimeSessionActive: state !== "disconnected",
  });

  // Sync settings with the active audio session
  useEffect(() => {
    if (sessionRef.current) {
      sessionRef.current.autoInterrupt = autoInterrupt;
    }
  }, [autoInterrupt]);

  useEffect(() => {
    if (sessionRef.current) {
      sessionRef.current.noiseGateThreshold = noiseGate;
    }
  }, [noiseGate]);

  // Autosave study scratchpad notes to local browser chest
  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_study_notes", studyPadText);
    }
  }, [studyPadText, isStorageInitialized]);

  // Clean up streaming intervals on unmount
  useEffect(() => {
    return () => {
      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
      }
    };
  }, []);

  const captureFrameAndSend = () => {
    const video = screenVideoRef.current;
    if (!video || isPausedRef.current || !screenVisionRef.current) {
      return;
    }

    if (stateRef.current === "disconnected") {
      return;
    }

    try {
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      if (!screenCanvasRef.current) {
        screenCanvasRef.current = document.createElement("canvas");
      }
      const canvas = screenCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Restrict maximum resolution size to keep payload light for Gemini Live
      const maxDim = 960;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(video, 0, 0, width, height);

      // Highly compressed JPEG standard is optimized and preserves details perfectly
      const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
      const base64 = dataUrl.split(",")[1];

      if (sessionRef.current) {
        sessionRef.current.sendVideoFrame(base64);
      }
    } catch (err) {
      console.error("[Screen Capture] Failed drawing frame to canvas:", err);
    }
  };

  const startScreenSharing = async () => {
    setErrorText(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 5 }
        },
        audio: false
      });

      screenStreamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(e => console.error("Video play warning:", e));
      screenVideoRef.current = video;

      setIsScreenSharing(true);
      setIsScreenSharingPaused(false);

      // Stop handling when native stop sharing bar button ends
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };

      // Set up frame capture interval (one frame every 2 seconds is highly robust, preventing overload)
      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
      }
      screenIntervalRef.current = setInterval(() => {
        captureFrameAndSend();
      }, 2000);

      // Promptly capture first frame immediately
      setTimeout(() => {
        captureFrameAndSend();
      }, 500);

    } catch (e: any) {
      console.error("Screen sharing permission declined or missing API:", e);
      if (e.name !== "NotAllowedError") {
        setErrorText(`Could not capture screen: ${e.message || e}`);
      }
    }
  };

  const stopScreenSharing = () => {
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      screenStreamRef.current = null;
    }

    if (screenVideoRef.current) {
      screenVideoRef.current.pause();
      screenVideoRef.current = null;
    }

    setIsScreenSharing(false);
    setIsScreenSharingPaused(false);
  };

  const pauseScreenSharing = () => {
    setIsScreenSharingPaused(true);
  };

  const resumeScreenSharing = () => {
    setIsScreenSharingPaused(false);
    // Refresh first frame immediately
    setTimeout(() => {
      captureFrameAndSend();
    }, 100);
  };

  const switchScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
    }
    await startScreenSharing();
  };

  const [activeEmotion, setActiveEmotion] = useState<MyraaEmotion>("idle");
  const [themeColor, setThemeColor] = useState<string>("violet");
  const [psychologyProfile, setPsychologyProfile] = useState<PsychologyProfile>(PSYCHOLOGY_PROFILES.tranquil_obsidian);
  const [agentMode, setAgentMode] = useState<"human" | "anime">("human");
  const [voiceModel, setVoiceModel] = useState<"Warm" | "Analytical" | "Playful">("Warm");
  const [autoShiftBackground, setAutoShiftBackground] = useState<boolean>(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(true);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [proactiveRemindersEnabled, setProactiveRemindersEnabled] = useState<boolean>(true);
  const [proactiveIdleTimeoutMins, setProactiveIdleTimeoutMins] = useState<number>(3);
  const [activeProactiveTask, setActiveProactiveTask] = useState<DailyTask | null>(null);
  const [userCaption, setUserCaption] = useState<string>("");
  const [characterState, setCharacterState] = useState<"idle" | "thinking" | "talking">("idle");

  // Sync mic, voice, theme, and proactive reminder settings to IndexedDB on modification
  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_auto_interrupt", autoInterrupt);
    }
  }, [autoInterrupt, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_proactive_reminders", proactiveRemindersEnabled);
      dbSet("myraa_proactive_timeout_mins", proactiveIdleTimeoutMins);
    }
  }, [proactiveRemindersEnabled, proactiveIdleTimeoutMins, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_noise_gate", noiseGate);
    }
  }, [noiseGate, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_voice_model", voiceModel);
    }
  }, [voiceModel, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_auto_shift_bg", autoShiftBackground);
    }
  }, [autoShiftBackground, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_theme_color", themeColor);
    }
  }, [themeColor, isStorageInitialized]);

  const currentSystemSettings: SystemSettingsState = {
    autoInterrupt,
    isWakeWordEnabled,
    noiseGate,
    agentMode,
    voiceModel,
    autoShiftBackground,
    chatMaxMessages,
    chatRetentionTime,
    themeColor,
    soundEffectsEnabled,
    speechRate,
    speechPitch,
    proactiveRemindersEnabled,
    proactiveIdleTimeoutMins,
  };

  const handleUpdateSystemSetting = <K extends keyof SystemSettingsState>(key: K, value: SystemSettingsState[K]) => {
    console.log(`[Myraa Settings Trace] Updating setting '${String(key)}' ->`, value);
    switch (key) {
      case "autoInterrupt":
        setAutoInterrupt(value as boolean);
        break;
      case "isWakeWordEnabled":
        setIsWakeWordEnabled(value as boolean);
        break;
      case "noiseGate":
        setNoiseGate(value as number);
        break;
      case "agentMode":
        setAgentMode(value as "human" | "anime");
        break;
      case "voiceModel":
        setVoiceModel(value as "Warm" | "Analytical" | "Playful");
        break;
      case "autoShiftBackground":
        setAutoShiftBackground(value as boolean);
        break;
      case "chatMaxMessages":
        setChatMaxMessages(value as number);
        break;
      case "chatRetentionTime":
        setChatRetentionTime(value as number);
        break;
      case "themeColor":
        setThemeColor(value as string);
        setAutoShiftBackground(false);
        saveSettingToDB("autoShiftBackground", false);
        break;
      case "soundEffectsEnabled":
        setSoundEffectsEnabled(value as boolean);
        break;
      case "speechRate":
        setSpeechRate(value as number);
        break;
      case "speechPitch":
        setSpeechPitch(value as number);
        break;
      case "proactiveRemindersEnabled":
        setProactiveRemindersEnabled(value as boolean);
        break;
      case "proactiveIdleTimeoutMins":
        setProactiveIdleTimeoutMins(value as number);
        break;
      default:
        break;
    }
    saveSettingToDB(key, value)
      .then(() => console.log(`[Myraa Settings Trace] Successfully saved '${String(key)}' to DB.`))
      .catch((err) => console.error(`[Myraa Settings Trace] Failed to save '${String(key)}' to DB:`, err));
  };

  const handlePutToSleep = useCallback(() => {
    lastSleepTriggerTimeRef.current = Date.now();
    setSleepRipple(Date.now());
    const agentName = activeSubAgent?.name?.split(" ")[0] || "MAHR";
    const sleepGreeting = agentMode === "anime"
      ? { ur: `Oyasumi nasai! ${agentName} standby mode main hai.`, en: `Oyasumi nasai! ${agentName} is entering sleep standby mode.` }
      : { ur: `Ji zaroor! ${agentName} standby mode par hai, jab zaroorat ho 'Hey ${agentName}' ya awaken boliyega.`, en: `${agentName} is entering low-power sleep standby mode. Say 'Hey ${agentName}' whenever you need me!` };
    
    // Explicitly abort background wake-word speech recognition if active
    if (wakeWordRecognitionRef.current) {
      try { wakeWordRecognitionRef.current.abort(); } catch (e) {}
      try { wakeWordRecognitionRef.current.stop(); } catch (e) {}
      wakeWordRecognitionRef.current = null;
    }

    userClickedDisconnectRef.current = true;
    if (sessionRef.current && stateRef.current !== "disconnected") {
      sessionRef.current.disconnect();
    }

    speakNotification(sleepGreeting);
    setNotesStatusAlert(`🌙 ${agentName} entered Sleep Standby Mode.`);
    
    // Ensure background wake listener is re-initialized for subsequent wake up calls
    if (wakeWordRestartTimeoutRef.current) clearTimeout(wakeWordRestartTimeoutRef.current);
    wakeWordRestartTimeoutRef.current = setTimeout(() => {
      // Re-trigger state effect or restart recognition if still disconnected
      if (stateRef.current === "disconnected" && isWakeWordEnabled) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition && !wakeWordRecognitionRef.current) {
          try {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = navigator.language || "en-US";
            rec.onend = () => { wakeWordRecognitionRef.current = null; };
            wakeWordRecognitionRef.current = rec;
          } catch (e) {}
        }
      }
    }, 1200);

    setTimeout(() => setNotesStatusAlert(null), 3500);
  }, [agentMode, activeSubAgent, speakNotification, isWakeWordEnabled]);

  const handleExecuteVoiceShortcut = (cmd: VoiceCommand) => {
    switch (cmd.id) {
      case "theme_crimson":
        setThemeColor("crimson");
        setAutoShiftBackground(false);
        saveSettingToDB("autoShiftBackground", false);
        saveSettingToDB("themeColor", "crimson");
        break;
      case "theme_emerald":
        setThemeColor("emerald");
        setAutoShiftBackground(false);
        saveSettingToDB("autoShiftBackground", false);
        saveSettingToDB("themeColor", "emerald");
        break;
      case "theme_celestial":
        setThemeColor("celestial");
        setAutoShiftBackground(false);
        saveSettingToDB("autoShiftBackground", false);
        saveSettingToDB("themeColor", "celestial");
        break;
      case "theme_gold":
        setThemeColor("gold");
        setAutoShiftBackground(false);
        saveSettingToDB("autoShiftBackground", false);
        saveSettingToDB("themeColor", "gold");
        break;
      case "wake_word":
        setIsWakeWordEnabled(true);
        saveSettingToDB("isWakeWordEnabled", true);
        break;
      case "voice_sleep":
        handlePutToSleep();
        break;
      case "toggle_interrupt":
        setAutoInterrupt((prev) => {
          saveSettingToDB("autoInterrupt", !prev);
          return !prev;
        });
        break;
      case "noise_gate":
        setNoiseGate(0.005);
        saveSettingToDB("noiseGate", 0.005);
        break;
      case "open_chalkboard":
        setIsWhiteboardOpen(true);
        break;
      case "open_browser":
        setIsStudyPadOpen(true);
        break;
      case "open_memory":
        setShowMemoryDashboard(true);
        break;
      case "open_journal":
        setShowChatJournal(true);
        break;
      case "open_logic_lab":
        setIsStudyPadOpen(true);
        break;
      case "open_sim_engine":
        setIsSubAgentsStudioOpen(true);
        break;
      case "open_slides_studio":
        setWhiteboardDiagramType("slides");
        setWhiteboardActiveMode("split");
        setIsWhiteboardOpen(true);
        break;
      case "open_ask_myraa":
        setIsAskMyraaOpen(true);
        break;
      case "generate_schedule":
        handleAutoGenerateDailyTasks();
        break;
      case "convert_mind_map":
        handleConvertToMindMap();
        break;
      case "voice_to_mindmap":
        handleVoiceToMindMap(userCaption || studyPadText || "System Workflow", { isWorkflow: true, autoSpeakFeedback: true });
        break;
      case "persona_anime":
        setAgentMode("anime");
        saveSettingToDB("agentMode", "anime");
        break;
      case "persona_human":
        setAgentMode("human");
        saveSettingToDB("agentMode", "human");
        break;
      default:
        break;
    }
  };


  const [modelCaption, setModelCaption] = useState<string>("");
  const [activeSkill, setActiveSkill] = useState<any | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isMicDenied, setIsMicDenied] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleToggleMute = useCallback(() => {
    if (sessionRef.current) {
      const mutedState = sessionRef.current.toggleMute();
      setIsMuted(mutedState);
    } else {
      setIsMuted((prev) => !prev);
    }
  }, []);

  const closeAllPanels = () => {
    setShowMemoryDashboard(false);
    setShowKnowledgeGraph(false);
    setShowChatJournal(false);
    setIsStudyPadOpen(false);
    setIsWhiteboardOpen(false);
    setShowSettings(false);
    setIsModelSwitcherOpen(false);
    setIsSubAgentsStudioOpen(false);
    setIsMunderDifflinOpen(false);
    setIsSlidesStudioOpen(false);
    setIsDailyTaskManagerOpen(false);
    setShowKeyboardShortcuts(false);
    setIsHumanMoodStudioOpen(false);
    setIsRLStudioOpen(false);
  };

  const sessionRef = useRef<MyraaAudioSession | null>(null);
  const visualizerRef = useRef<HTMLDivElement | null>(null);
  const userClickedDisconnectRef = useRef<boolean>(true);
  const reconnectAttemptsRef = useRef<number>(0);

  // Load settings and data from IndexedDB on startup (migrating from localStorage if needed)
  useEffect(() => {
    const initializeStorage = async () => {
      // 1. Study Notes
      try {
        let notesVal = await dbGet("myraa_study_notes");
        if (!notesVal) {
          const oldVal = localStorage.getItem("myraa_study_notes");
          if (oldVal) {
            notesVal = oldVal;
            await dbSet("myraa_study_notes", oldVal);
          }
        }
        if (notesVal) setStudyPadText(notesVal);
      } catch (err) {
        console.error("Failed to load study notes from DB:", err);
      }

      // 2. Study Pack
      try {
        let packVal = await dbGet("myraa_study_pack");
        if (!packVal) {
          const oldVal = localStorage.getItem("myraa_study_pack");
          if (oldVal) {
            try {
              packVal = JSON.parse(oldVal);
              await dbSet("myraa_study_pack", packVal);
            } catch {}
          }
        }
        if (packVal) setStudyPack(packVal);
      } catch (err) {
        console.error("Failed to load study pack from DB:", err);
      }

      // 3. Whiteboard Text
      try {
        let wbVal = await dbGet("myraa_whiteboard_text");
        if (!wbVal) {
          const oldVal = localStorage.getItem("myraa_whiteboard_text");
          if (oldVal) {
            wbVal = oldVal;
            await dbSet("myraa_whiteboard_text", oldVal);
          }
        }
        if (wbVal) setWhiteboardText(wbVal);
      } catch (err) {
        console.error("Failed to load whiteboard text from DB:", err);
      }

      // 3b. Whiteboard Drawings (IndexedDB Auto-Save Persistence)
      try {
        let wbDrawings = await dbGet("myraa_whiteboard_drawings");
        if (wbDrawings && Array.isArray(wbDrawings)) {
          setWhiteboardDrawings(wbDrawings);
        }
      } catch (err) {
        console.error("Failed to load whiteboard drawings from DB:", err);
      }

      // 4. Agent Mode
      try {
        let modeVal = await dbGet("myraa_agent_mode");
        if (!modeVal) {
          const oldVal = localStorage.getItem("myraa_agent_mode");
          if (oldVal === "anime" || oldVal === "human") {
            modeVal = oldVal;
            await dbSet("myraa_agent_mode", oldVal);
          }
        }
        if (modeVal === "anime" || modeVal === "human") {
          setAgentMode(modeVal);
        }
      } catch (err) {
        console.error("Failed to load agent mode from DB:", err);
      }

      // 4b. Study Suggestions
      try {
        let sugVal = await dbGet("myraa_study_suggestions");
        if (!sugVal) {
          const oldVal = localStorage.getItem("myraa_study_suggestions");
          if (oldVal) {
            try {
              sugVal = JSON.parse(oldVal);
              await dbSet("myraa_study_suggestions", sugVal);
            } catch {}
          }
        }
        if (sugVal && Array.isArray(sugVal)) {
          setStudySuggestions(sugVal);
        }
      } catch (err) {
        console.error("Failed to load study suggestions from DB:", err);
      }

      // 5. Chat Journal History & Settings
      try {
        const maxMsgs = await dbGet("myraa_chat_max_messages");
        if (typeof maxMsgs === "number") {
          setChatMaxMessages(maxMsgs);
          chatMaxMessagesRef.current = maxMsgs;
        }

        const retTime = await dbGet("myraa_chat_retention_time");
        if (typeof retTime === "number") {
          setChatRetentionTime(retTime);
          chatRetentionTimeRef.current = retTime;
        }

        let history = await dbGet("myraa_chat_history");
        if (!Array.isArray(history) || history.length === 0) {
          try {
            const backupStr = localStorage.getItem("myraa_chat_history_backup");
            if (backupStr) {
              const parsed = JSON.parse(backupStr);
              if (Array.isArray(parsed)) history = parsed;
            }
          } catch (e) {}
        }

        if (Array.isArray(history)) {
          const pruned = pruneChatHistory(history, maxMsgs || 30, retTime || 60);
          setChatHistory(pruned);
          await dbSet("myraa_chat_history", pruned);
          try {
            localStorage.setItem("myraa_chat_history_backup", JSON.stringify(pruned));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Failed to load chat journal from DB:", err);
      }

      // 6. Additional Mic, Voice, and Theme settings
      try {
        const loadedSettings = await loadSettingsFromDB();
        setAutoInterrupt(loadedSettings.autoInterrupt);
        setIsWakeWordEnabled(loadedSettings.isWakeWordEnabled);
        setNoiseGate(loadedSettings.noiseGate);
        setAgentMode(loadedSettings.agentMode);
        setVoiceModel(loadedSettings.voiceModel);
        setAutoShiftBackground(loadedSettings.autoShiftBackground);
        setChatMaxMessages(loadedSettings.chatMaxMessages);
        setChatRetentionTime(loadedSettings.chatRetentionTime);
        setThemeColor(loadedSettings.themeColor);
        setSoundEffectsEnabled(loadedSettings.soundEffectsEnabled);
        setSpeechRate(loadedSettings.speechRate);
        setSpeechPitch(loadedSettings.speechPitch);
        setProactiveRemindersEnabled(loadedSettings.proactiveRemindersEnabled);
        setProactiveIdleTimeoutMins(loadedSettings.proactiveIdleTimeoutMins);
      } catch (err) {
        console.error("Failed to load additional settings from DB:", err);
      }

      // 6. RL Policy & Knowledge Deficits
      try {
        const loadedPolicy = await loadRLPolicy();
        setRlPolicy(loadedPolicy);
        const loadedDeficits = await loadKnowledgeDeficits();
        setKnowledgeDeficits(loadedDeficits);
      } catch (err) {
        console.error("Failed to load RL Policy or Knowledge Deficits:", err);
      }

      // Initialize global activity tracker for proactive idle reminders
      initActivityTracker();

      // Mark storage initialized
      setIsStorageInitialized(true);
    };

    initializeStorage();
    (window as any).runMyraaSettingsDiagnostic = runSettingsDiagnosticCycle;
  }, []);

  // Sync isWakeWordEnabled with Database
  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_wake_word_enabled", isWakeWordEnabled);
    }
  }, [isWakeWordEnabled, isStorageInitialized]);

  // Real-Time Background Retention Auto-Cleaner (Purges entries expired based on setup timer)
  useEffect(() => {
    if (!isStorageInitialized) return;

    const intervalId = setInterval(() => {
      const retMins = chatRetentionTimeRef.current;
      if (retMins <= 0) return; // 0 = Unlimited retention

      setChatHistory((prev) => {
        if (!prev || prev.length === 0) return prev;
        const pruned = pruneChatHistory(prev, chatMaxMessagesRef.current, retMins);
        if (pruned.length !== prev.length) {
          console.log(`[Auto-Retention Cleaner] Automatically deleted ${prev.length - pruned.length} expired messages (Lifespan: ${retMins}m).`);
          dbSet("myraa_chat_history", pruned);
          try {
            localStorage.setItem("myraa_chat_history_backup", JSON.stringify(pruned));
          } catch (e) {}
          return pruned;
        }
        return prev;
      });
    }, 10000); // Ticks every 10 seconds in real time

    return () => clearInterval(intervalId);
  }, [isStorageInitialized]);

  // Proactive Idle Task Reminder loop (Spoken voice reminders when user is idle)
  useEffect(() => {
    if (!isStorageInitialized || !proactiveRemindersEnabled) return;

    const intervalId = setInterval(() => {
      const reminder = checkProactiveReminder(dailyTasks, {
        enabled: proactiveRemindersEnabled,
        idleTimeoutMins: proactiveIdleTimeoutMins,
        cooldownMins: 5,
        agentMode: agentMode
      });

      if (reminder) {
        console.log("[Proactive Task Reminder Engine] Triggering voice reminder for upcoming task:", reminder.taskTitle);
        const matchingTask = dailyTasks.find((t) => t.title === reminder.taskTitle);
        setActiveProactiveTask(
          matchingTask || {
            id: "reminder-" + Date.now(),
            title: reminder.taskTitle,
            timeBlock: "Afternoon",
            priority: "medium",
            category: "study",
            completed: false,
            date: new Date().toISOString().split("T")[0],
            reminder: true,
            createdAt: new Date().toISOString()
          }
        );
        speakNotification(reminder.speechText, reminder.emotion as MyraaEmotion);
        setNotesStatusAlert(`🔔 Proactive Task Reminder: "${reminder.taskTitle}"`);
        insertActionToChatHistory(`🔔 [Proactive Task Reminder] ${reminder.speechText}`);
        setTimeout(() => setNotesStatusAlert(null), 6000);
      }
    }, 10000); // Check idle duration every 10 seconds

    return () => clearInterval(intervalId);
  }, [isStorageInitialized, proactiveRemindersEnabled, proactiveIdleTimeoutMins, dailyTasks, agentMode]);

  // Sync deleted memory IDs ref
  useEffect(() => {
    deletedMemoryIdsRef.current = deletedMemoryIds;
  }, [deletedMemoryIds]);

  // Sync client-side recollections with backend on startup
  useEffect(() => {
    const syncMemoriesOnStartup = async () => {
      let localMemories: Memory[] = [];
      let localDeletedIds: string[] = [];
      try {
        const stored = await dbGet("myraa_persistent_memories");
        if (Array.isArray(stored) && stored.length > 0) {
          localMemories = stored;
          setMemories(stored);
        }
      } catch (e) {
        console.error("Failed to load local memories:", e);
      }

      try {
        const storedDel = await dbGet("myraa_deleted_memories");
        if (Array.isArray(storedDel) && storedDel.length > 0) {
          localDeletedIds = storedDel;
          setDeletedMemoryIds(storedDel);
        }
      } catch (e) {
        console.error("Failed to load local deleted memory IDs:", e);
      }

      try {
        const resp = await fetch("/api/memories/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memories: localMemories, deletedIds: localDeletedIds })
        });
        const syncedData = await resp.json();
        if (syncedData && Array.isArray(syncedData.memories)) {
          setMemories(syncedData.memories);
          await dbSet("myraa_persistent_memories", syncedData.memories);
        }
        if (syncedData && Array.isArray(syncedData.deletedIds)) {
          setDeletedMemoryIds(syncedData.deletedIds);
          await dbSet("myraa_deleted_memories", syncedData.deletedIds);
        }
      } catch (err) {
        console.error("Startup memory sync failure:", err);
      } finally {
        setIsMemoryLoaded(true);
      }
    };

    syncMemoriesOnStartup();
  }, []);

  // Save memories to IndexedDB whenever the memories state updates
  useEffect(() => {
    if (isStorageInitialized && isMemoryLoaded && memories) {
      dbSet("myraa_persistent_memories", memories);
    }
  }, [memories, isStorageInitialized, isMemoryLoaded]);

  // Save deleted memory IDs to IndexedDB whenever the state updates
  useEffect(() => {
    if (isStorageInitialized && isMemoryLoaded && deletedMemoryIds) {
      dbSet("myraa_deleted_memories", deletedMemoryIds);
    }
  }, [deletedMemoryIds, isStorageInitialized, isMemoryLoaded]);

  // Track the browser's online/offline connection state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      console.log("[Network] Connection restored: ONLINE");
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log("[Network] Connection lost: OFFLINE");
      setIsOnline(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Global Keyboard Shortcuts Hotkeys Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditing =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable);

      // 1. ESCAPE KEY -> Closes any open modal / overlay
      if (e.key === "Escape") {
        if (showKeyboardShortcuts) { setShowKeyboardShortcuts(false); return; }
        if (showSettings) { setShowSettings(false); return; }
        if (isAskMyraaOpen) { setIsAskMyraaOpen(false); return; }
        if (isWhiteboardOpen) { setIsWhiteboardOpen(false); return; }
        if (isStudyPadOpen) { setIsStudyPadOpen(false); return; }
        if (showChatJournal) { setShowChatJournal(false); return; }
        if (showMemoryDashboard) { setShowMemoryDashboard(false); return; }
        if (isDailyTaskManagerOpen) { setIsDailyTaskManagerOpen(false); return; }
        if (isMunderDifflinOpen) { setIsMunderDifflinOpen(false); return; }
        if (isSubAgentsStudioOpen) { setIsSubAgentsStudioOpen(false); return; }
        if (isModelSwitcherOpen) { setIsModelSwitcherOpen(false); return; }
        if (isMobileMenuOpen) { setIsMobileMenuOpen(false); return; }
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 2. Ctrl + Space or Alt + Space -> Toggle Myraa Voice Connection
      if ((isCtrlOrCmd && e.code === "Space") || (e.altKey && e.code === "Space")) {
        e.preventDefault();
        handleToggleConnection();
        return;
      }

      // 3. Ctrl + K -> Toggle Ask Myraa AI Modal
      if (isCtrlOrCmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsAskMyraaOpen((prev) => !prev);
        return;
      }

      // 4. Ctrl + , -> Toggle System & Voice Settings
      if (isCtrlOrCmd && e.key === ",") {
        e.preventDefault();
        setShowSettings((prev) => !prev);
        return;
      }

      // 5. Ctrl + / or Shift + ? (when not editing) -> Toggle Hotkeys Cheat Sheet
      if ((isCtrlOrCmd && e.key === "/") || (!isEditing && e.key === "?")) {
        e.preventDefault();
        setShowKeyboardShortcuts((prev) => !prev);
        return;
      }

      // Do not process letter-based workspace shortcuts if user is typing in input or textarea
      if (isEditing) return;

      // 6. Ctrl + Shift + W or Alt + W -> Whiteboard
      if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "w") || (e.altKey && e.key.toLowerCase() === "w")) {
        e.preventDefault();
        setIsWhiteboardOpen((prev) => !prev);
        return;
      }

      // 7. Ctrl + Shift + N or Alt + N -> Study Pad
      if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "n") || (e.altKey && e.key.toLowerCase() === "n")) {
        e.preventDefault();
        setIsStudyPadOpen((prev) => !prev);
        return;
      }

      // 8. Ctrl + Shift + J or Alt + J -> Chat Journal
      if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "j") || (e.altKey && e.key.toLowerCase() === "j")) {
        e.preventDefault();
        setShowChatJournal((prev) => !prev);
        return;
      }

      // 9. Ctrl + Shift + R or Alt + R -> Memory Recalls
      if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "r") || (e.altKey && e.key.toLowerCase() === "r")) {
        e.preventDefault();
        setShowMemoryDashboard((prev) => !prev);
        return;
      }

      // 10. Ctrl + Shift + D or Alt + D -> Daily Tasks
      if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "d") || (e.altKey && e.key.toLowerCase() === "d")) {
        e.preventDefault();
        setIsDailyTaskManagerOpen((prev) => !prev);
        return;
      }

      // 11. Ctrl + Shift + A or Alt + A -> Sub-Agents Studio
      if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "a") || (e.altKey && e.key.toLowerCase() === "a")) {
        e.preventDefault();
        setIsSubAgentsStudioOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showKeyboardShortcuts, showSettings, isAskMyraaOpen, isWhiteboardOpen, isStudyPadOpen,
    showChatJournal, showMemoryDashboard, isDailyTaskManagerOpen, isSubAgentsStudioOpen,
    isModelSwitcherOpen, isMobileMenuOpen, state
  ]);

  // Load offline deletion queue from IndexedDB on startup
  useEffect(() => {
    const loadOfflineQueue = async () => {
      if (isStorageInitialized) {
        try {
          const storedQueue = await dbGet("myraa_offline_deleted_queue");
          if (Array.isArray(storedQueue)) {
            console.log("[Offline Queue] Loaded pending offline memory deletions:", storedQueue);
            setOfflineDeletedQueue(storedQueue);
          }
        } catch (e) {
          console.error("[Offline Queue] Failed to load offline deletion queue:", e);
        }
      }
    };
    loadOfflineQueue();
  }, [isStorageInitialized]);

  // Persist offline deletion queue whenever it changes
  useEffect(() => {
    if (isStorageInitialized) {
      dbSet("myraa_offline_deleted_queue", offlineDeletedQueue);
    }
  }, [offlineDeletedQueue, isStorageInitialized]);

  // Background synchronization and batch reconciliation task for offline deletions
  useEffect(() => {
    if (!isOnline || offlineDeletedQueue.length === 0 || isSyncing) return;

    const reconcileOfflineDeletions = async () => {
      setIsSyncing(true);
      const queueToProcess = [...offlineDeletedQueue];
      console.log(`[Sync Task] Connection returned online. Reconciling ${queueToProcess.length} pending memory deletions with the server...`);

      try {
        const currentMemories = memories;
        const currentDeletedIds = Array.from(new Set([...deletedMemoryIds, ...queueToProcess]));

        const resp = await fetch("/api/memories/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memories: currentMemories, deletedIds: currentDeletedIds })
        });

        if (resp.ok) {
          const syncedData = await resp.json();
          console.log("[Sync Task] Batch reconciliation completed successfully!", syncedData);

          if (syncedData && Array.isArray(syncedData.memories)) {
            setMemories(syncedData.memories);
          }
          if (syncedData && Array.isArray(syncedData.deletedIds)) {
            setDeletedMemoryIds(syncedData.deletedIds);
          }

          // Filter out the successfully processed IDs from our queue
          setOfflineDeletedQueue((prev) => prev.filter((id) => !queueToProcess.includes(id)));
        } else {
          console.warn("[Sync Task] Server returned unsuccessful status during reconciliation:", resp.status);
        }
      } catch (err) {
        console.error("[Sync Task] Failed to complete background memory reconciliation:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    reconcileOfflineDeletions();
  }, [isOnline, offlineDeletedQueue, memories, deletedMemoryIds, isSyncing]);

  // Sync chat history to backend whenever it changes
  useEffect(() => {
    if (chatHistory) {
      fetch("/api/chat/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory })
      }).catch((e) => console.warn("Could not sync chat history to server:", e));
    }
  }, [chatHistory]);

  const handleClearChatHistory = async () => {
    try {
      setChatHistory([]);
      await dbSet("myraa_chat_history", []);
      setNotesStatusAlert("✨ Conversation journal cleared.");
      setTimeout(() => setNotesStatusAlert(null), 3000);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  };

  const handleClearOldest = async () => {
    try {
      setChatHistory((prev) => {
        if (prev.length === 0) return prev;
        
        // First run standard retention prune
        let pruned = pruneChatHistory(prev, chatMaxMessages, chatRetentionTime);
        
        // If already pruned (no entries violated criteria), manually evict oldest 20% or at least 1 message
        if (pruned.length === prev.length) {
          const countToRemove = Math.max(1, Math.min(5, Math.ceil(pruned.length * 0.2)));
          pruned = pruned.slice(countToRemove);
        }
        
        dbSet("myraa_chat_history", pruned);
        return pruned;
      });
      setNotesStatusAlert("✨ Pruned/cleared oldest conversation messages.");
      setTimeout(() => setNotesStatusAlert(null), 3000);
    } catch (err) {
      console.error("Failed to clear oldest chat history:", err);
    }
  };

  const handleAddManualMemory = async (category: MemoryCategory, text: string) => {
    try {
      const resp = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, text })
      });
      const saved = await resp.json();
      if (saved && saved.id) {
        setMemories((prev) => [...prev, saved]);
      }
    } catch (err) {
      console.error("Manual database recollect upload error:", err);
    }
  };

  const handleSaveSimulationMetadata = async (name: string, modelType: string, scriptText: string, description: string) => {
    try {
      const resp = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          category: "simulation", 
          text: description,
          simulationMetadata: {
            name,
            modelType,
            customModelData: {
              code: scriptText
            },
            scripts: [scriptText],
            assets: []
          }
        })
      });
      const saved = await resp.json();
      if (saved && saved.id) {
        setMemories((prev) => [...prev, saved]);
      }
    } catch (err) {
      console.error("Simulation database save failure:", err);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string) => {
    const textarea = notesTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setStudyPadText(newText);
    dbSet("myraa_study_notes", newText);
    
    // Put focus back and restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const parseNotesInlineStyles = (raw: string) => {
    // Basic inline bold formatter (e.g. **important**)
    const parts = raw.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="text-white font-bold bg-white/5 px-1 py-0.5 rounded border border-white/5">
            {formatMathText(part)}
          </strong>
        );
      }
      // basic inline code formatter (e.g. `formula`)
      const codeParts = part.split(/`([^`]+)`/g);
      return codeParts.map((sub, sidx) => {
        if (sidx % 2 === 1) {
          return (
            <code key={sidx} className="font-mono text-[11px] text-amber-300 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-500/15">
              {formatMathText(sub)}
            </code>
          );
        }
        
        // Find single $...$ for inline math formatting
        const mathParts = sub.split(/\$([^$]+)\$/g);
        return mathParts.map((mSub, midx) => {
          if (midx % 2 === 1) {
            return (
              <span key={midx} className="font-mono text-emerald-300 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/10 italic">
                {formatMathText(mSub)}
              </span>
            );
          }
          return formatMathText(mSub);
        });
      });
    });
  };

  const renderStudyNotesPreview = (notesText: string) => {
    if (!notesText) {
      return <p className="text-slate-500 italic text-xs">No study notes recorded yet. Write some in Edit mode!</p>;
    }
    const lines = notesText.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headings
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-base font-bold font-sans text-emerald-400 mt-4 border-b border-white/5 pb-1 tracking-tight">
            {formatMathText(trimmed.replace("# ", ""))}
          </h2>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-sm font-bold font-sans text-purple-400 mt-3 tracking-tight">
            {formatMathText(trimmed.replace("## ", ""))}
          </h3>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-xs font-semibold tracking-wider font-mono text-slate-300 mt-2 uppercase">
            {formatMathText(trimmed.replace("### ", ""))}
          </h4>
        );
      }

      // Block code/equations block
      if (trimmed.startsWith("$$") || trimmed.endsWith("$$")) {
        return (
          <div key={idx} className="my-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/15 text-center font-mono text-emerald-300 text-xs overflow-x-auto shadow-inner leading-relaxed">
            {formatMathText(trimmed.replace(/\$\$/g, ""))}
          </div>
        );
      }

      // Code blocks
      if (trimmed.startsWith("```")) {
        return null; // hide raw codeblock tags in preview
      }

      // Bullet points
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemText = line.replace(/^\s*[-*]\s+/, "");
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-350 leading-relaxed font-sans mb-1 pl-0.5 decoration-emerald-400">
            {parseNotesInlineStyles(itemText)}
          </li>
        );
      }

      // Numbered lists
      if (/^\s*\d+\.\s+/.test(line)) {
        const itemText = line.replace(/^\s*\d+\.\s+/, "");
        const num = line.match(/^\s*(\d+)\.\s+/)?.[1] || "1";
        return (
          <div key={idx} className="flex gap-2 items-start text-xs leading-relaxed text-slate-350 mb-1 font-sans pl-1.5">
            <span className="font-mono text-emerald-400 font-bold shrink-0">{num}.</span>
            <span className="flex-1">{parseNotesInlineStyles(itemText)}</span>
          </div>
        );
      }

      // Empty line
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }

      // Plain paragraph
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed font-sans mb-1.5 pl-0.5">
          {parseNotesInlineStyles(line)}
        </p>
      );
    });
  };

  const handleDeleteMemory = async (id: string) => {
    // 1. Perform optimistic UI updates immediately
    setMemories((prev) => prev.filter(m => m.id !== id));
    setDeletedMemoryIds((prev) => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });

    // 2. If browser is offline, instantly queue the delete action for background sync
    if (!isOnline) {
      console.log(`[Offline] Queueing memory deletion request for ID: ${id}`);
      setOfflineDeletedQueue((prev) => {
        if (!prev.includes(id)) {
          return [...prev, id];
        }
        return prev;
      });
      return;
    }

    // 3. Otherwise, try to execute the live server deletion request
    try {
      const resp = await fetch(`/api/memories/${id}`, {
        method: "DELETE"
      });
      
      const resObj = await resp.json();
      if (!resObj || !resObj.success) {
        // If server failed, put it in the offline queue to retry on next sync
        console.warn(`[Sync Warning] Deletion failed on server for ID: ${id}, queueing...`);
        setOfflineDeletedQueue((prev) => {
          if (!prev.includes(id)) {
            return [...prev, id];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Manual memory delete execution failed, queueing for background retry:", err);
      setOfflineDeletedQueue((prev) => {
        if (!prev.includes(id)) {
          return [...prev, id];
        }
        return prev;
      });
    }
  };

  const handleMemorizeStudyNotes = async () => {
    if (!studyPadText.trim()) return;
    setIsSavingNotes(true);
    setNotesStatusAlert("🧠 Teaching MAHR these study notes...");
    try {
      const resp = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          category: "project", 
          text: `[Study Guide / Exam Pad Summary] ${studyPadText.trim()}`
        })
      });
      const saved = await resp.json();
      if (saved && saved.id) {
        setMemories((prev) => [...prev, saved]);
        setNotesStatusAlert("✨ Core Synced! MAHR has memorized this study guide.");
        setTimeout(() => setNotesStatusAlert(null), 4000);
      } else {
        setNotesStatusAlert("⚠️ Connection busy, please try again.");
        setTimeout(() => setNotesStatusAlert(null), 3000);
      }
    } catch (err) {
      console.error("Failed to sync study notes to AI memory:", err);
      setNotesStatusAlert("⚠️ Sync failure. Please try again.");
      setTimeout(() => setNotesStatusAlert(null), 3000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleFetchSuggestions = async (overrideText?: string) => {
    const textToSubmit = overrideText || studyPadText;
    if (!textToSubmit || !textToSubmit.trim()) return;

    setIsFetchingSuggestions(true);
    setSuggestionsError(null);
    try {
      const response = await fetch("/api/study/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: textToSubmit })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data && data.suggestions) {
        setStudySuggestions(data.suggestions);
        dbSet("myraa_study_suggestions", data.suggestions);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("Failed to fetch search suggestions:", err);
      setSuggestionsError(err.message || "Failed to retrieve educational resources.");
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleGenerateStudyPack = async (overrideText?: string) => {
    const textToSubmit = overrideText || studyPadText;
    if (!textToSubmit || !textToSubmit.trim()) {
      setNotesStatusAlert("⚠️ Please write some notes first so I can analyze them!");
      setTimeout(() => setNotesStatusAlert(null), 3500);
      return { success: false, countFlashcards: 0, countMcqs: 0 };
    }

    setIsGeneratingPack(true);
    setNotesStatusAlert("⚡ Contacting MAHR core to compile flashcards & quizzes...");

    try {
      const response = await fetch("/api/study/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: textToSubmit })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data && data.flashcards) {
        setStudyPack(data);
        dbSet("myraa_study_pack", data);
        
        // Trigger the predictive Google Search grounded suggestions in background
        handleFetchSuggestions(textToSubmit);

        // Reset interactive selectors index
        setActiveCardIndex(0);
        setIsCardFlipped(false);
        setFlippedIndices([]);
        setSelectedAnswers({});
        setRevealedExplanations({});
        // Switch tab to let them see the reward
        setStudyActiveTab("flashcards");
        setNotesStatusAlert("🎉 Dynamic Study Pack Loaded! Go test yourself!");
        setTimeout(() => setNotesStatusAlert(null), 4000);
        return { success: true, countFlashcards: data.flashcards.length, countMcqs: data.mcqs.length };
      } else {
        throw new Error("Invalid output layout from AI server.");
      }
    } catch (err: any) {
      console.error("Failed compiling study pack:", err);
      setNotesStatusAlert(`❌ Could not compile study pack: ${err.message || err}`);
      setTimeout(() => setNotesStatusAlert(null), 4000);
      throw err;
    } finally {
      setIsGeneratingPack(false);
    }
  };

  const generateAndVisualizeMindMap = async ({
    text,
    source = "notes",
    isWorkflow = false,
    autoSpeakFeedback = false,
  }: {
    text?: string;
    source?: "notes" | "voice" | "manual";
    isWorkflow?: boolean;
    autoSpeakFeedback?: boolean;
  }) => {
    const rawText = (text && text.trim()) ? text : studyPadText;
    if (!rawText || !rawText.trim()) {
      setNotesStatusAlert("⚠️ Please speak or write concepts/notes to generate a mind map.");
      setTimeout(() => setNotesStatusAlert(null), 3500);
      return;
    }

    const cleaned = cleanSpokenTranscript(rawText);
    const alertMsg = source === "voice"
      ? "🧠 Voice-to-Mindmap: Analyzing verbal relationships & workflow on chalkboard..."
      : "🧠 Converting highlighted notes into an interactive Mind Map on Whiteboard...";
    setNotesStatusAlert(alertMsg);
    setWhiteboardStatusAlert(alertMsg);

    if (autoSpeakFeedback) {
      speakNotification("Mapping out the relationships and workflow on your digital chalkboard...");
    }

    try {
      const result = await generateVoiceToMindMap(cleaned, activeModelId);
      const structuredDrawings = layoutVisualDiagram(result.drawings);

      const dType = result.diagramType === "workflow" ? "Workflow Mind Map" : "Interactive Mind Map";
      setWhiteboardDiagramType(dType);
      setWhiteboardDrawings(structuredDrawings);
      setWhiteboardCustomModelData(null);

      // Prepend to Whiteboard Text as Markdown
      setWhiteboardText((prevText) => {
        const sourceBadge = source === "voice" ? "Spoken Voice Session" : "Study Pad Notes";
        const header = `# 🧠 ${result.title}\n\n*Generated via Voice-to-Mindmap (${sourceBadge})*\n\n${result.markdownSummary}\n\n---\n\n`;
        const updated = header + prevText;
        dbSet("myraa_whiteboard_text", updated);
        return updated;
      });

      setWhiteboardActiveMode("split");
      setIsWhiteboardOpen(true);
      const successNotice = `✨ Voice-to-Mindmap visualized "${result.title}" with ${result.nodeCount} nodes on the chalkboard!`;
      setWhiteboardStatusAlert(successNotice);
      setTimeout(() => setWhiteboardStatusAlert(null), 4500);
      setNotesStatusAlert(successNotice);
      setTimeout(() => setNotesStatusAlert(null), 3500);

      // Append diagram render to persistent chat journal
      insertActionToChatHistory(
        `🧠 **[VOICE-TO-MINDMAP: ${result.title.toUpperCase()}]** (${dType})\n\n${result.markdownSummary}\n\n*(Vector diagram with ${result.drawings.length} nodes visualized live on the chalkboard)*`
      );
    } catch (e: any) {
      console.error("Failed to generate Mind Map:", e);
      setNotesStatusAlert("⚠️ Unable to construct mind map. Please try again.");
      setTimeout(() => setNotesStatusAlert(null), 3500);
    }
  };

  const handleConvertToMindMap = (selectedText?: string) => {
    return generateAndVisualizeMindMap({ text: selectedText, source: "notes" });
  };

  const handleVoiceToMindMap = (
    spokenText: string,
    options?: { isWorkflow?: boolean; autoSpeakFeedback?: boolean }
  ) => {
    return generateAndVisualizeMindMap({
      text: spokenText,
      source: "voice",
      isWorkflow: options?.isWorkflow,
      autoSpeakFeedback: options?.autoSpeakFeedback ?? true,
    });
  };

  // Initialize the audio session handlers once on mount
  useEffect(() => {
    sessionRef.current = new MyraaAudioSession({
      onStateChange: (newState) => {
        setState(newState);
        setIsMicDenied(sessionRef.current?.isMicDenied || false);
        if (newState === "disconnected") {
          // Reset captions on disconnect
          setUserCaption("");
          setModelCaption("");
          setActiveEmotion("idle");
          setCharacterState("idle");
        } else if (newState === "listening") {
          // Return to receptive resting state
          setActiveEmotion("idle");
          setCharacterState("idle");
        } else if (newState === "speaking") {
          setCharacterState("talking");
        }
      },
      onTranscription: (role, text) => {
        if (role === "user") {
          setUserCaption(text);
          // Auto-clear the other caption when user starts talking
          setModelCaption("");
          setCharacterState("thinking");

          appendToChatHistory("user", text);

          // Unified voice intent classifier
          const action = detectVoiceAction(text, activeSubAgent?.name?.split(" ")[0] || "MAHR");

          if (action.type === "voice_to_mindmap") {
            handleVoiceToMindMap(action.topic || text, {
              isWorkflow: action.isWorkflow,
              autoSpeakFeedback: true,
            });
          } else if (action.type === "sleep") {
            handlePutToSleep();
            return;
          } else if (action.type === "focus_mode") {
            if (action.isFocusDeactivate) {
              setIsFocusMode(false);
              setWhiteboardStatusAlert("✨ Focus Mode Deactivated. Full dashboard restored.");
              setTimeout(() => setWhiteboardStatusAlert(null), 3000);
            } else {
              setIsFocusMode(true);
              setIsStudyPadOpen(false);
              setIsWhiteboardOpen(false);
              setWhiteboardStatusAlert("🧘 Focus Mode Activated. Distractions cleared.");
              setTimeout(() => setWhiteboardStatusAlert(null), 3500);
            }
          } else if (action.type === "voice_command" && action.command) {
            handleExecuteVoiceShortcut(action.command);
          } else if (action.type === "sketch") {
            setIsWhiteboardOpen(true);
            setVoiceSketchTriggerText(text);
          }
        } else if (role === "model") {
          setAskMahrLoading(false);
          setModelCaption((prev) => {
            const next = prev + text;
            const newEmotion = detectEmotionFromText(next);
            setActiveEmotion(newEmotion);
            return next;
          });
          // Clear user caption when model replies
          setUserCaption("");

          appendToChatHistory("model", text);
        }
      },
      onToolCall: (name, args, callback) => {
        console.log(`[App] Tool call triggered: ${name}`, args);
        
        if (name === "ingestToVectorGraph") {
          // Direct ingestion into high-dimensional vector memory graph + Go microservice
          const concept = String(args.concept || "Concept");
          const notes = String(args.notes || "");
          const cluster = String(args.cluster || "Academic Study");

          fetch("/api/vector-memory/ingest-artifacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studyNotes: [{ title: concept, content: notes, tags: [cluster] }],
            }),
          })
            .then(async () => {
              // Also sync with Go backend
              await fetch("/api/go/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: `[Vector Knowledge] ${concept}: ${notes.slice(0, 100)}` }),
              }).catch(() => {});
              callback({ result: `Successfully embedded "${concept}" into MAHR's 128-dimensional vector knowledge graph and Go backend.` });
            })
            .catch((err) => {
              callback({ error: `Vector ingestion failed: ${err.message}` });
            });
        } else if (name === "runRLPolicyStep") {
          // Autonomous reinforcement learning adaptation step
          const { empathyWeight, explanationDepth, humorPlayfulness, strictnessWeight, reason } = args;
          loadRLPolicy()
            .then((policy) => {
              if (empathyWeight !== undefined) policy.empathyWeight = Math.max(0, Math.min(1, Number(empathyWeight)));
              if (explanationDepth !== undefined) policy.explanationDepth = Math.max(0, Math.min(1, Number(explanationDepth)));
              if (humorPlayfulness !== undefined) policy.humorPlayfulness = Math.max(0, Math.min(1, Number(humorPlayfulness)));
              if (strictnessWeight !== undefined) policy.strictnessWeight = Math.max(0, Math.min(1, Number(strictnessWeight)));
              saveRLPolicy(policy);
              setWhiteboardStatusAlert(`🧠 MAHR RL Policy Optimized: ${reason || "Adaptive tuning applied"}`);
              setTimeout(() => setWhiteboardStatusAlert(null), 3500);
              callback({ result: `RL Policy fine-tuned. New state: Empathy ${policy.empathyWeight.toFixed(2)}, Depth ${policy.explanationDepth.toFixed(2)}, Humor ${policy.humorPlayfulness.toFixed(2)}, Strictness ${policy.strictnessWeight.toFixed(2)}.` });
            })
            .catch((err) => {
              callback({ error: `RL adaptation error: ${err.message}` });
            });
        } else if (name === "queryGolangVectorService") {
          // Query Go backend vector service
          const query = String(args.query || "");
          const topK = Number(args.topK || 5);
          fetch("/api/vector-memory/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, topK }),
          })
            .then((r) => r.json())
            .then((res) => {
              callback({ result: res });
            })
            .catch((err) => {
              callback({ error: `Go vector query failed: ${err.message}` });
            });
        } else if (name === "generateStudyMaterials") {
          setIsStudyPadOpen(true);
          const override = args.notesContentOverride;
          handleGenerateStudyPack(override)
            .then((res) => {
              callback({ 
                result: `Successfully analyzed notes and compiled ${res?.countFlashcards || 0} flashcards and ${res?.countMcqs || 0} MCQs inside the Study Pad drawer. Let TECH know!` 
              });
            })
            .catch((err) => {
              callback({ error: `Could not generate study materials: ${err.message}` });
            });
        } else if (name === "updateWhiteboard") {
          setIsWhiteboardOpen(true);
          const boardTitle = args.title || "MAHR's Blackboard Lesson";
          const boardNotes = args.notes || "";
          const dType = args.diagramType || "notes";
          const dClear = !!args.clearBoard;
          const drawings = args.drawings || [];
          const customModel = args.customModelData || null;

          if (dClear) {
            setWhiteboardClearCounter((c) => c + 1);
          }

          setWhiteboardText((prevText) => {
            let updatedValue = "";
            if (dClear) {
              updatedValue = `# 🎓 ${boardTitle}\n\n${boardNotes}`;
            } else {
              updatedValue = `# 🎓 ${boardTitle}\n\n${boardNotes}\n\n---\n\n${prevText}`;
            }
            dbSet("myraa_whiteboard_text", updatedValue);
            return updatedValue;
          });
          setWhiteboardDiagramType(dType);
          setWhiteboardDrawings(drawings);
          setWhiteboardCustomModelData(customModel);

          if (drawings.length > 0 || customModel) {
            setWhiteboardActiveMode("split");
          }
          
          setWhiteboardStatusAlert(
            customModel 
              ? `✨ MAHR generated a custom 3D model on: "${boardTitle}"`
              : drawings.length > 0 
                ? `🎨 MAHR sketched a live diagram & notes on: "${boardTitle}"`
                : `✏️ MAHR added textbook notes on: "${boardTitle}"`
          );
          setTimeout(() => setWhiteboardStatusAlert(null), 4000);

          // Append blackboard update to persistent chat history/journal
          const infoText = customModel 
            ? `🎨 **[3D MODEL GENERATED: ${boardTitle}]**\n\n${boardNotes}\n\n*(An interactive 3D model was loaded live on the chalkboard)*`
            : drawings.length > 0 
              ? `🎨 **[DIAGRAM SKETCHED: ${boardTitle}]**\n\n${boardNotes}\n\n*(A live blackboard drawing with ${drawings.length} shapes was plotted)*`
              : `✏️ **[WHITEBOARD LESSON: ${boardTitle}]**\n\n${boardNotes}`;
          insertActionToChatHistory(infoText);

          callback({ result: `Successfully updated virtual blackboard with title "${boardTitle}" and active 3D / drawing assets. It is now fully visible to TECH. Explain this or guide TECH verbally now.` });
        } else if (name === "renderVisualDiagram") {
          setIsWhiteboardOpen(true);
          const boardTitle = args.title || "MAHR's Diagram Lesson";
          const boardNotes = args.notes || "";
          const dType = args.diagramType || "diagram";
          const dClear = args.clearBoard !== undefined ? !!args.clearBoard : true;
          const drawings = args.drawings || [];

          if (dClear) {
            setWhiteboardClearCounter((c) => c + 1);
          }

          setWhiteboardText((prevText) => {
            let updatedValue = "";
            if (dClear) {
              updatedValue = `# 📊 ${boardTitle}\n\n${boardNotes}`;
            } else {
              updatedValue = `# 📊 ${boardTitle}\n\n${boardNotes}\n\n---\n\n${prevText}`;
            }
            dbSet("myraa_whiteboard_text", updatedValue);
            return updatedValue;
          });
          setWhiteboardDiagramType(dType);
          const structuredDrawings = layoutVisualDiagram(drawings);
          setWhiteboardDrawings(structuredDrawings);
          setWhiteboardCustomModelData(null);

          if (drawings.length > 0) {
            setWhiteboardActiveMode("split");
          } else {
            setWhiteboardActiveMode("text");
          }

          setWhiteboardStatusAlert(`📊 MAHR rendered a live ${dType || "diagram"} on: "${boardTitle}"`);
          setTimeout(() => setWhiteboardStatusAlert(null), 4000);

          // Append diagram render to persistent chat history/journal
          insertActionToChatHistory(`📊 **[DIAGRAM RENDERED: ${boardTitle}]** (${dType.toUpperCase()})\n\n${boardNotes}\n\n*(A custom diagram with ${drawings.length} vector shapes has been rendered live on the chalkboard)*`);

          callback({ result: `Successfully rendered visual diagram "${boardTitle}" with ${drawings.length} shapes on the chalkboard. It is now fully visible to TECH. Please explain the diagram verbally!` });
        } else if (name === "render3DSimulation" || name === "open3DSimulation") {
          const simPrompt = args.prompt || args.title || "Human lungs breathing with asthma";
          setSimulationPrompt(simPrompt);
          setIsSimulationStudioOpen(true);
          insertActionToChatHistory(`🪐 **[3D SIMULATION INITIALIZED: ${simPrompt}]**\n\n*(Real-time WebGL 3D Simulation Engine initialized on viewport)*`);
          callback({ result: `Successfully launched real-time 3D Simulation Engine for "${simPrompt}". The interactive 3D WebGL laboratory is active and streaming on TECH's screen. Guide them and explain the dynamic physics/biology verbally now!` });
        } else if (name === "open_slides_studio" || name === "createPresentation" || name === "generateSlides") {
          const topic = args.topic || args.title || "Interactive Presentation";
          setSlidesStudioTopic(topic);
          setWhiteboardDiagramType("slides");
          setWhiteboardActiveMode("split");
          setIsWhiteboardOpen(true);
          setWhiteboardStatusAlert(`📊 MAHR opened Presentation Studio for: "${topic}" on Whiteboard`);
          setTimeout(() => setWhiteboardStatusAlert(null), 4000);
          insertActionToChatHistory(`📊 **[PRESENTATION STUDIO OPENED: ${topic}]**\n*(Google Slides Studio opened on Classroom Whiteboard)*`);
          callback({ result: `Successfully opened Presentation & Slides Studio on Classroom Whiteboard for "${topic}". It is now visible to TECH.` });
        } else if (name === "setHumanMood") {
          const mood = (args.mood?.toLowerCase() || "neutral") as HumanMoodType;
          const reason = args.reason || "";
          const requestedTheme = args.themeColor?.toLowerCase();
          
          setCurrentHumanMood(mood);
          if (reason) setMoodShiftReason(reason);

          const moodCfg = HUMAN_MOOD_CONFIGS[mood];
          const targetTheme = requestedTheme || moodCfg?.themeId;
          const validColors = ["violet", "crimson", "emerald", "celestial", "gold", "rose", "charcoal"];
          if (targetTheme && validColors.includes(targetTheme)) {
            setThemeColor(targetTheme);
          }

          insertActionToChatHistory(`🎭 **[MOOD SHIFT: ${moodCfg?.label || mood.toUpperCase()}]**\n*Reason:* ${reason || "Contextual human sentiment"}\n*Aura:* ${moodCfg?.tagline || "Responsive"}`);

          callback({ result: `MAHR's active human mood shifted to ${mood} (${moodCfg?.urduLabel || ""}). Atmospheric aura set to ${targetTheme}. Continue the conversation embodying this dynamic emotional disposition!` });
        } else if (name === "recordKnowledgeDeficit") {
          const topic = args.topic || "Self-Reflection Deficit";
          const reason = args.reason || "Encountered limitation or needed TECH's guidance";
          const suggestedAction = args.suggestedAction || "Review together with TECH";
          const severity = (args.severity || "medium") as "low" | "medium" | "high";

          const newDef: KnowledgeDeficit = {
            id: "def_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            topic,
            userPrompt: "Live voice session exchange",
            reason,
            suggestedAction,
            status: "open",
            severity,
            createdAt: new Date().toISOString(),
            tags: ["autonomous-reflection", "growth-journal"]
          };

          setKnowledgeDeficits((prev) => {
            const updated = [newDef, ...prev];
            saveKnowledgeDeficits(updated);
            return updated;
          });

          insertActionToChatHistory(`📝 **[KNOWLEDGE DEFICIT SAVED: ${topic}]**\n*Why:* ${reason}\n*Action for TECH:* ${suggestedAction}\n*(Noted down in MAHR's Self-Improvement & Deficits Journal)*`);

          callback({ result: `Successfully saved knowledge deficit on '${topic}' to MAHR's Growth Journal. It is now safely stored for mutual review and learning!` });
        } else if (name === "changeBackground") {
          const colorName = args.color?.toLowerCase();
          const validColors = ["violet", "crimson", "emerald", "celestial", "gold", "rose", "charcoal"];
          
          if (colorName && validColors.includes(colorName)) {
            setThemeColor(colorName);
            setAutoShiftBackground(false);
            saveSettingToDB("autoShiftBackground", false);
            saveSettingToDB("themeColor", colorName);
            callback({ result: `Successfully shifted aesthetic atmosphere to ${colorName}.` });
          } else {
            callback({ error: `Unsupported color '${colorName}'. Supported themes are: ${validColors.join(", ")}` });
          }
        } else {
          callback({ error: `Tool ${name} is not implemented.` });
        }
      },
      onError: (err) => {
        setErrorText(err);
      },
      onMemorySync: (updatedMemories) => {
        console.log("[App] WebSocket memories sync triggered:", updatedMemories);
        if (Array.isArray(updatedMemories)) {
          const filtered = updatedMemories.filter(m => m && m.id && !deletedMemoryIdsRef.current.includes(m.id));
          setMemories(filtered);
        }
      }
    });

    // Seed local user sound filtering options on initialization
    if (sessionRef.current) {
      setGlobalAudioSession(sessionRef.current);
      sessionRef.current.autoInterrupt = autoInterrupt;
      sessionRef.current.noiseGateThreshold = noiseGate;
    }

    return () => {
      setGlobalAudioSession(null);
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  const handleToggleConnection = async () => {
    setErrorText(null);
    if (!sessionRef.current) return;

    if (state === "disconnected") {
      userClickedDisconnectRef.current = false;
      await sessionRef.current.connect(agentMode, studyPadText + " " + whiteboardText, activeSubAgent);
      setIsMicDenied(sessionRef.current?.isMicDenied || false);
    } else {
      handlePutToSleep();
      setIsMicDenied(false);
    }
  };

  // Automatic smart reconnection loop on unexpected drops
  useEffect(() => {
    if (state === "disconnected") {
      if (!userClickedDisconnectRef.current && reconnectAttemptsRef.current < 3) {
        reconnectAttemptsRef.current += 1;
        setErrorText(`Network link lost. Retrying connection automatically (${reconnectAttemptsRef.current}/3)...`);
        const timer = setTimeout(async () => {
          if (sessionRef.current && stateRef.current === "disconnected") {
            try {
              await sessionRef.current.connect(agentMode, studyPadText + " " + whiteboardText, activeSubAgent);
              setErrorText(null);
            } catch (err) {
              console.error("Auto-reconnection failed:", err);
            }
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else if (state === "listening" || state === "speaking") {
      reconnectAttemptsRef.current = 0;
    }
  }, [state, agentMode, studyPadText, whiteboardText, activeSubAgent]);

  // Real-time Background Wake Word Listener ("MAHR" / "Mahr" / "Wake up")
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition || !isWakeWordEnabled) {
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.abort();
        } catch (e) {}
        wakeWordRecognitionRef.current = null;
      }
      return;
    }

    let isStoppedPurposefully = false;

    const startWakeWordRecognition = () => {
      if (state !== "disconnected" || !isWakeWordEnabled) return;
      if (wakeWordRecognitionRef.current) return;

      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true; // Enabled instant real-time interim recognition
        rec.lang = navigator.language || "en-US";

        rec.onstart = () => {
          console.log("[MAHR WakeWord] Active & Listening in background...");
        };

        rec.onresult = (event: any) => {
          // Guard: Ignore microphone input if sleep was triggered less than 4.5s ago to avoid self-wake feedback
          if (Date.now() - lastSleepTriggerTimeRef.current < 4500) {
            return;
          }

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript;
            if (!transcript) continue;

            const lower = transcript.toLowerCase().trim();
            console.log("[MAHR WakeWord Live Transcript]:", lower);

            const action = detectVoiceAction(transcript, activeSubAgent?.name?.split(" ")[0] || "MAHR");

            if (action.type === "voice_to_mindmap") {
              handleVoiceToMindMap(action.topic || transcript, {
                isWorkflow: action.isWorkflow,
                autoSpeakFeedback: true,
              });
              return;
            } else if (action.type === "sleep") {
              console.log("[MAHR SleepWord] Sleep command detected! Executing handlePutToSleep...");
              handlePutToSleep();
              return;
            } else if (action.type === "voice_command" && action.command) {
              handleExecuteVoiceShortcut(action.command);
            }

            if (action.type === "wake") {
              const agentName = activeSubAgent?.name?.split(" ")[0] || "MAHR";
              console.log(`[MAHR WakeWord] Match detected! Waking up ${agentName}...`);
              setWakeWordRipple(Date.now());
              
              // Stop background speech recognizer cleanly to free mic track
              isStoppedPurposefully = true;
              try { rec.stop(); } catch (e) {}
              try { rec.abort(); } catch (e) {}
              wakeWordRecognitionRef.current = null;

              // Voice confirmation greeting
              const wakeUpGreeting = agentMode === "anime"
                ? {
                    ur: `Ohayou! ${agentName} jag chuki hai, let's learn together! Yaay!`,
                    en: `Ohayou! ${agentName} is awake now, let's learn together! Yay!`
                  }
                : {
                    ur: `Ji haan! ${agentName} active ho chuki hai, aayen study shuru karte hain.`,
                    en: `Yes! ${agentName} is awake and active, let's start studying.`
                  };
              
              speakNotification(wakeUpGreeting);
              setNotesStatusAlert(`🎙️ Wake word detected! Waking up ${agentName}...`);
              
              // Connect to live interactive session once mic track is released
              setTimeout(async () => {
                if (sessionRef.current && stateRef.current === "disconnected") {
                  userClickedDisconnectRef.current = false;
                  try {
                    await sessionRef.current.connect(agentMode, studyPadText + " " + whiteboardText, activeSubAgent);
                    setIsMicDenied(sessionRef.current?.isMicDenied || false);
                    setNotesStatusAlert(null);
                  } catch (connErr) {
                    console.error("[MAHR WakeWord Connect Error]:", connErr);
                  }
                }
              }, 500);

              break; // break loop on match
            }
          }
        };

        rec.onerror = (e: any) => {
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            console.warn("[MAHR WakeWord] Microphone permission denied.");
            setIsMicDenied(true);
          } else {
            console.warn("[MAHR WakeWord] Non-fatal status:", e.error);
          }
        };

        rec.onend = () => {
          wakeWordRecognitionRef.current = null;
          if (!isStoppedPurposefully && isWakeWordEnabled && stateRef.current === "disconnected") {
            if (wakeWordRestartTimeoutRef.current) clearTimeout(wakeWordRestartTimeoutRef.current);
            wakeWordRestartTimeoutRef.current = setTimeout(() => {
              startWakeWordRecognition();
            }, 300);
          }
        };

        wakeWordRecognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.error("Failed to start background wake word recognition:", err);
      }
    };

    if (state === "disconnected" && isWakeWordEnabled) {
      startWakeWordRecognition();
    } else {
      if (wakeWordRecognitionRef.current) {
        isStoppedPurposefully = true;
        try {
          wakeWordRecognitionRef.current.abort();
        } catch (e) {}
        wakeWordRecognitionRef.current = null;
      }
    }

    return () => {
      isStoppedPurposefully = true;
      if (wakeWordRestartTimeoutRef.current) clearTimeout(wakeWordRestartTimeoutRef.current);
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.abort();
        } catch (e) {}
        wakeWordRecognitionRef.current = null;
      }
    };
  }, [state, isWakeWordEnabled]);

  // Real-time Audio Input and Output Waveform Visualizer Loop
  useEffect(() => {
    let animationId: number;

    const updateVisualizer = () => {
      const container = visualizerRef.current;
      if (!container) {
        animationId = requestAnimationFrame(updateVisualizer);
        return;
      }

      const bars = container.children;
      if (!bars || bars.length === 0) {
        animationId = requestAnimationFrame(updateVisualizer);
        return;
      }

      const session = sessionRef.current;
      // When speaking, animate with Myraa's voice (outputAnalyser).
      // When listening, animate with TECH's voice (inputAnalyser).
      const currentAnalyser = state === "speaking" 
        ? session?.outputAnalyser 
        : (state === "listening" ? session?.inputAnalyser : null);

      if (currentAnalyser && state !== "disconnected") {
        const bufferLength = currentAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        currentAnalyser.getByteFrequencyData(dataArray);

        if (state === "listening") {
          let sum = 0;
          let activeCount = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
            if (dataArray[i] > 10) activeCount++;
          }
          const average = sum / bufferLength;

          let score = 50;
          if (average < 2) {
            score = 65; // Quiet room / waiting for voice input
          } else {
            // Signal-to-noise ratio in conversational voice frequency range (index 2% to 18%)
            let voiceSum = 0;
            const voiceStartBin = Math.floor(bufferLength * 0.02);
            const voiceEndBin = Math.floor(bufferLength * 0.18);
            const voiceBinCount = voiceEndBin - voiceStartBin;
            for (let i = voiceStartBin; i < voiceEndBin; i++) {
              voiceSum += dataArray[i];
            }
            const voiceAverage = voiceSum / (voiceBinCount || 1);

            if (voiceAverage > 40) {
              if (voiceAverage > 185) {
                // Too loud / clipping static
                score = Math.max(30, 100 - (voiceAverage - 185));
              } else {
                // Clear conversational speech zone
                score = 82 + Math.floor(((voiceAverage - 40) / 145) * 16);
              }
            } else {
              // Whisper or ambient breathing
              score = 30 + Math.floor((voiceAverage / 40) * 25);
            }
          }

          score = Math.max(15, Math.min(100, score));

          const now = Date.now();
          if (now - lastConfidenceUpdateRef.current > 120) {
            setVoiceConfidence(score);
            lastConfidenceUpdateRef.current = now;
          }
        }

        // Map the frequency bins to the rendered bars
        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i] as HTMLDivElement;
          
          // Focus primarily on human voice frequencies (lower-middle spectrum)
          const index = Math.floor((i / bars.length) * (bufferLength * 0.4));
          const val = dataArray[index] || 0;
          
          // Calculate high-fidelity height (max 32px) with subtle ambient flutter
          const factor = val / 255;
          const calculatedHeight = Math.max(3, factor * 28 + Math.sin(Date.now() * 0.015 + i) * 1.5);

          bar.style.height = `${calculatedHeight}px`;

          // Apply gorgeous state-specific styles dynamically pulling glow from themeColor
          const barStyle = getVisualizerBarStyle(themeColor, state);
          bar.className = barStyle.className;
          bar.style.backgroundColor = barStyle.style.backgroundColor;
          bar.style.boxShadow = barStyle.style.boxShadow;
        }
      } else {
        // Fallback or ambient connection transition states
        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i] as HTMLDivElement;
          let heightFactor = 0.15;
          
          if (state === "connecting") {
            heightFactor = 0.2 + Math.sin(Date.now() * 0.025 + i * 0.5) * 0.2;
          } else {
            // Disconnected gentle sleeping mode
            heightFactor = 0.1 + Math.sin(Date.now() * 0.005 + i * 0.3) * 0.03;
          }

          const calculatedHeight = Math.max(3, 28 * heightFactor);
          bar.style.height = `${calculatedHeight}px`;
          
          const barStyle = getVisualizerBarStyle(themeColor, state);
          bar.className = barStyle.className;
          bar.style.backgroundColor = barStyle.style.backgroundColor;
          bar.style.boxShadow = barStyle.style.boxShadow;
        }
      }

      animationId = requestAnimationFrame(updateVisualizer);
    };

    animationId = requestAnimationFrame(updateVisualizer);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, themeColor]);

  // Dynamically analyze user and model conversation text to detect which skill is active
  useEffect(() => {
    const combinedText = (userCaption + " " + modelCaption).trim().toLowerCase();
    if (!combinedText) {
      // Keep previous skill if we are speaking/listening, otherwise reset slowly
      if (state === "disconnected") {
        setActiveSkill(null);
      }
      return;
    }

    const analyze = async () => {
      // Load active skills
      let enabledSkills: any[] = [];
      try {
        const saved = await getSkillsFromDB();
        if (saved) {
          enabledSkills = saved.filter((s: any) => s.enabled);
        }
      } catch (err) {
        console.error("Error reading skills in analyzer:", err);
      }

      if (enabledSkills.length === 0) {
        setActiveSkill(null);
        return;
      }

      let bestSkill: any = null;
      let bestScore = 0;

      enabledSkills.forEach((skill) => {
        let score = 0;
        const skillNameLower = skill.name.toLowerCase();
        const descLower = skill.description.toLowerCase();
        const instLower = skill.instructions.toLowerCase();

        // Priority 1: Direct name matching or category keywords
        if (skillNameLower.includes("python") && (combinedText.includes("python") || combinedText.includes("code") || combinedText.includes("def ") || combinedText.includes("import ") || combinedText.includes("script"))) {
          score += 15;
        }
        if (skillNameLower.includes("math") && (combinedText.includes("math") || combinedText.includes("equation") || combinedText.includes("solve") || combinedText.includes("calculate") || combinedText.includes("formula") || combinedText.includes("integral") || combinedText.includes("derivative") || combinedText.includes("physics"))) {
          score += 15;
        }
        if ((skillNameLower.includes("wellness") || skillNameLower.includes("breath")) && (combinedText.includes("breath") || combinedText.includes("calm") || combinedText.includes("stress") || combinedText.includes("relax") || combinedText.includes("inhale") || combinedText.includes("exhale") || combinedText.includes("anxiety"))) {
          score += 15;
        }
        if (skillNameLower.includes("socratic") && (combinedText.includes("why") || combinedText.includes("how") || combinedText.includes("think") || combinedText.includes("question") || combinedText.includes("deduce"))) {
          score += 8;
        }

        // Priority 2: General text keyword matching
        // Break instructions & description into separate words
        const words = `${skillNameLower} ${descLower} ${instLower}`.split(/[\s,.:;?()'"\-\[\]]+/);
        const uniqueKeywords = Array.from(new Set(words)).filter(w => w.length > 3 && !["with", "your", "this", "that", "from", "have", "will", "should", "about", "expert", "specialist"].includes(w));

        uniqueKeywords.forEach((kw) => {
          if (combinedText.includes(kw)) {
            score += 2;
          }
        });

        if (score > bestScore) {
          bestScore = score;
          bestSkill = skill;
        }
      });

      if (bestScore >= 2) {
        setActiveSkill(bestSkill);
      } else if (bestSkill) {
        setActiveSkill(bestSkill);
      } else if (enabledSkills.length > 0) {
        setActiveSkill((prev) => prev || enabledSkills[0]);
      }
    };
    analyze();
  }, [userCaption, modelCaption, state]);

  // Automatically shift background color and human mood based on speech sentiment psychology during active conversation
  useEffect(() => {
    if (!autoShiftBackground) return;
    // Guard: only analyze and auto-shift if there is active dialogue or emotional shift
    if (!userCaption && !modelCaption && (!activeEmotion || (activeEmotion as string) === "neutral" || activeEmotion === "idle")) {
      return;
    }

    const detectedMoodResult = detectHumanMoodFromDialogue(userCaption, modelCaption, currentHumanMood);
    if (detectedMoodResult && detectedMoodResult.mood !== currentHumanMood) {
      setCurrentHumanMood(detectedMoodResult.mood);
      setMoodShiftReason(detectedMoodResult.reason);
      const moodCfg = HUMAN_MOOD_CONFIGS[detectedMoodResult.mood];
      if (moodCfg && moodCfg.themeId && moodCfg.themeId !== themeColor) {
        setThemeColor(moodCfg.themeId);
      }
    } else {
      const profile = analyzeSpeechColorPsychology(userCaption, modelCaption, activeEmotion);
      setPsychologyProfile(profile);

      if (profile.themeId && profile.themeId !== themeColor) {
        setThemeColor(profile.themeId);
      }
    }
  }, [userCaption, modelCaption, activeEmotion, autoShiftBackground, currentHumanMood, themeColor]);

  const activeThemeConfig = getThemeConfig(themeColor);

  // Maps theme colors to CSS ambient light spots
  const getAmbientStyles = () => {
    return activeThemeConfig.bgGradient;
  };

  const getThemeTextGlow = () => {
    return activeThemeConfig.textGlow;
  };

  const getOrbRingColor = () => {
    switch (state) {
      case "listening": return "border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)] bg-indigo-500/10";
      case "speaking": return "border-purple-500/70 shadow-[0_0_40px_rgba(168,85,247,0.4)] bg-purple-500/10";
      case "connecting": return "border-amber-500/50 animate-pulse bg-amber-500/10";
      case "disconnected":
      default:
        return "border-white/10 hover:border-indigo-500/30 bg-white/5";
    }
  };

  return (
    <div
      id="mahr-holographic-desktop"
      className="relative w-full h-screen overflow-hidden bg-[#020205] text-white theme-transition flex flex-col justify-between p-6 sm:p-10 select-none"
    >
      {/* Immersive Granular SVG Mesh Gradient Atmosphere Layer mapped to HumanMoodType */}
      <GranularMeshGradientBackground 
        currentMood={currentHumanMood}
        fallbackGradient={
          autoShiftBackground && psychologyProfile
            ? psychologyProfile.bgGradientCss
            : activeThemeConfig.ambientGradient
        }
      />

      {/* Dynamic Multi-Color Holographic Ambient Glow Blobs */}
      <div
        className={`absolute ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[0].position : "top-[-10%] left-[-5%]"} ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[0].size : "w-[600px] h-[600px]"} rounded-full ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[0].blur : "blur-[130px]"} pointer-events-none transition-all duration-700 ease-in-out z-0`}
        style={{
          backgroundColor: autoShiftBackground && psychologyProfile ? psychologyProfile.primaryHex : activeThemeConfig.hex,
          opacity: autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[0].opacity : 0.35
        }}
      />
      <div
        className={`absolute ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[1].position : "bottom-[-10%] right-[-5%]"} ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[1].size : "w-[680px] h-[680px]"} rounded-full ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[1].blur : "blur-[160px]"} pointer-events-none transition-all duration-700 ease-in-out z-0`}
        style={{
          backgroundColor: autoShiftBackground && psychologyProfile ? psychologyProfile.secondaryHex : activeThemeConfig.secondaryHex,
          opacity: autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[1].opacity : 0.30
        }}
      />
      <div
        className={`absolute ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[2].position : "top-[25%] right-[10%]"} ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[2].size : "w-[400px] h-[400px]"} rounded-full ${autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[2].blur : "blur-[110px]"} pointer-events-none transition-all duration-700 ease-in-out z-0`}
        style={{
          backgroundColor: autoShiftBackground && psychologyProfile ? psychologyProfile.tertiaryHex : activeThemeConfig.tertiaryHex,
          opacity: autoShiftBackground && psychologyProfile ? psychologyProfile.ambientBlobs[2].opacity : 0.22
        }}
      />

      {/* Decorative grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      {/* FULL VIEWPORT HOLOGRAPHIC STAGE: MAHR materializes across the entire screen */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <MahrCoreVisualizer
          session={sessionRef.current}
          state={state}
          themeColor={themeColor}
          activeEmotion={activeEmotion}
          characterState={characterState}
          wakeWordTriggered={wakeWordRipple}
          sleepTriggered={sleepRipple}
          isMicDenied={isMicDenied}
          isWakeWordEnabled={isWakeWordEnabled}
          projectorIntensity={psychologyProfile?.projectorIntensity || 1.0}
          valenceScore={psychologyProfile?.valenceScore || 0.0}
          beamPulseSpeed={psychologyProfile?.beamPulseSpeed || 1.8}
          laserGridOpacity={psychologyProfile?.laserGridOpacity || 0.25}
          onManualSleepRequested={handlePutToSleep}
          onManualWakeRequested={() => {
            setWakeWordRipple(Date.now());
            const agentName = activeSubAgent?.name?.split(" ")[0] || "MAHR";
            const wakeUpGreeting = agentMode === "anime"
              ? {
                  ur: `Ohayou! ${agentName} active hai, let's learn together! Yaay!`,
                  en: `Ohayou! ${agentName} is awake now, let's learn together! Yay!`
                }
              : {
                  ur: `Ji haan! ${agentName} active ho chuki hai, aayen study shuru karte hain.`,
                  en: `Yes! ${agentName} is awake and active, let's start studying.`
                };
            speakNotification(wakeUpGreeting);
            setNotesStatusAlert(`✨ Awaken ${agentName}...`);

            if (sessionRef.current && stateRef.current === "disconnected") {
              userClickedDisconnectRef.current = false;
              sessionRef.current.connect(agentMode, studyPadText + " " + whiteboardText, activeSubAgent).then(() => {
                setIsMicDenied(sessionRef.current?.isMicDenied || false);
                setTimeout(() => setNotesStatusAlert(null), 3000);
              });
            }
          }}
        />
      </div>

      {/* Sleek Focus Mode Pill Indicator */}
      {isFocusMode && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => {
              setIsFocusMode(false);
              setWhiteboardStatusAlert("✨ Full dashboard restored.");
              setTimeout(() => setWhiteboardStatusAlert(null), 3000);
            }}
            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/18 border border-purple-500/40 rounded-full text-[10px] font-mono font-bold text-purple-300 flex items-center gap-1.5 transition duration-200 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:scale-[1.02] cursor-pointer"
          >
            <SparklesIcon size={12} className="text-purple-400 animate-spin" />
            <span>FOCUS MODE ON (CLICK TO EXIT)</span>
          </motion.button>
        </div>
      )}

      {/* HEADER SECTION - Modular Glass Nav */}
      {!isFocusMode && (
        <HeaderNav
          onOpenDesktopRemoteModal={() => setIsDesktopRemoteModalOpen(true)}
          psychologyProfile={psychologyProfile}
          autoShiftBackground={autoShiftBackground}
          themeColor={themeColor}
          onSelectThemeColor={(c) => handleUpdateSystemSetting("themeColor", c)}
          onToggleAutoShift={() => handleUpdateSystemSetting("autoShiftBackground", !autoShiftBackground)}
          currentHumanMood={currentHumanMood}
          onToggleHumanMoodStudio={() => {
            const next = !isHumanMoodStudioOpen;
            closeAllPanels();
            setIsHumanMoodStudioOpen(next);
          }}
          activeModelId={activeModelId}
          activeSubAgent={activeSubAgent}
          dailyTasks={dailyTasks}
          offlineDeletedQueueLength={offlineDeletedQueue.length}
          showMemoryDashboard={showMemoryDashboard}
          showKnowledgeGraph={showKnowledgeGraph}
          showChatJournal={showChatJournal}
          isStudyPadOpen={isStudyPadOpen}
          isWhiteboardOpen={isWhiteboardOpen}
          isSimulationStudioOpen={isSimulationStudioOpen}
          showSettings={showSettings}
          showShortcuts={showKeyboardShortcuts}
          isScreenSharing={isScreenSharing}
          isScreenSharingPaused={isScreenSharingPaused}
          isModelSwitcherOpen={isModelSwitcherOpen}
          isSubAgentsStudioOpen={isSubAgentsStudioOpen}
          isMunderDifflinOpen={isMunderDifflinOpen}
          isSlidesStudioOpen={isWhiteboardOpen && whiteboardDiagramType === "slides"}
          isDailyTaskManagerOpen={isDailyTaskManagerOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onToggleModelSwitcher={() => {
            const next = !isModelSwitcherOpen;
            closeAllPanels();
            setIsModelSwitcherOpen(next);
          }}
          onToggleSubAgents={() => {
            const next = !isSubAgentsStudioOpen;
            closeAllPanels();
            setIsSubAgentsStudioOpen(next);
          }}
          onToggleMunderDifflin={() => {
            const next = !isMunderDifflinOpen;
            closeAllPanels();
            setIsMunderDifflinOpen(next);
          }}
          onToggleSlidesStudio={() => {
            closeAllPanels();
            setWhiteboardDiagramType("slides");
            setWhiteboardActiveMode("split");
            setIsWhiteboardOpen(true);
          }}
          onToggleDailyTasks={() => {
            const next = !isDailyTaskManagerOpen;
            closeAllPanels();
            setIsDailyTaskManagerOpen(next);
          }}
          onToggleMemory={() => {
            const next = !showMemoryDashboard;
            closeAllPanels();
            setShowMemoryDashboard(next);
          }}
          onToggleKnowledgeGraph={() => {
            const next = !showKnowledgeGraph;
            closeAllPanels();
            setShowKnowledgeGraph(next);
          }}
          onToggleJournal={() => {
            const next = !showChatJournal;
            closeAllPanels();
            setShowChatJournal(next);
          }}
          onToggleStudyPad={() => {
            const next = !isStudyPadOpen;
            closeAllPanels();
            setIsStudyPadOpen(next);
          }}
          onToggleWhiteboard={() => {
            const next = !isWhiteboardOpen;
            closeAllPanels();
            setIsWhiteboardOpen(next);
          }}
          onToggleSimulationStudio={() => {
            const next = !isSimulationStudioOpen;
            closeAllPanels();
            setIsSimulationStudioOpen(next);
          }}
          onToggleSettings={() => {
            const next = !showSettings;
            closeAllPanels();
            setShowSettings(next);
          }}
          onToggleShortcuts={() => {
            const next = !showKeyboardShortcuts;
            closeAllPanels();
            setShowKeyboardShortcuts(next);
          }}
          onToggleScreenSharing={() => {
            if (isScreenSharing) stopScreenSharing(); else startScreenSharing();
          }}
          chatHistory={chatHistory}
          studyPadText={studyPadText}
          whiteboardText={whiteboardText}
          isRLStudioOpen={isRLStudioOpen}
          onToggleRLStudio={() => {
            const next = !isRLStudioOpen;
            closeAllPanels();
            setIsRLStudioOpen(next);
          }}
          deficitsCount={knowledgeDeficits.filter((d) => d.status !== "resolved").length}
        />
      )}
      {/* CORE AVATAR AND VISUALS */}

      {/* CORE AVATAR AND VISUALS */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-between py-6 pointer-events-none">
        {/* Invisible spatial spacer to maintain layout balance without any obstructing text */}
        <div className="h-10 sm:h-20" />

        {/* System Settings & Command Map Modal */}
        <div className="pointer-events-auto">
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            settings={currentSystemSettings}
            onUpdateSetting={handleUpdateSystemSetting}
            onExecuteCommand={handleExecuteVoiceShortcut}
            onResetAllSettings={() => {
              setAutoInterrupt(false);
              setIsWakeWordEnabled(true);
              setNoiseGate(0.005);
              setAgentMode("human");
              setVoiceModel("Warm");
              setAutoShiftBackground(true);
              setChatMaxMessages(50);
              setChatRetentionTime(60);
              setThemeColor("violet");
              setSoundEffectsEnabled(true);
              setSpeechRate(1.0);
              setSpeechPitch(1.0);
            }}
            speakNotification={(txt) => speakNotification(txt)}
            onStatusAlert={(msg) => {
              setNotesStatusAlert(msg);
              setTimeout(() => setNotesStatusAlert(null), 3500);
            }}
          />
        </div>
      </main>

      {/* Voice & Dialogue Floating Toast Notification Popup */}
      <VoiceDialogueToast
        modelCaption={modelCaption}
        userCaption={userCaption}
        activeSkill={activeSkill}
        state={state}
        onDismiss={() => {
          setModelCaption("");
          setUserCaption("");
        }}
      />

      {/* Global Alerts Floating Toasts */}
      <GlobalAlerts
        errorText={errorText}
        isMicDenied={isMicDenied}
        connectionState={state}
        onDismissError={() => setErrorText(null)}
      />

      {/* FOOTER INTERFACE WITH DYNAMIC THEME VISUALIZER AND CONTROLS */}
      {!isFocusMode && !showSettings && !showMemoryDashboard && (
        <FooterVisualizer
          session={sessionRef.current}
          state={state}
          themeColor={themeColor}
          voiceConfidence={voiceConfidence}
          isMuted={isMuted}
          isFocusMode={isFocusMode}
          activeSubAgentName={activeSubAgent.name}
          onToggleConnect={handleToggleConnection}
          onToggleMute={handleToggleMute}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          onOpenWhiteboard={() => {
            closeAllPanels();
            setIsWhiteboardOpen(true);
          }}
          onOpenStudyPad={() => {
            closeAllPanels();
            setIsStudyPadOpen(true);
          }}
          onOpenTasks={() => {
            closeAllPanels();
            setIsDailyTaskManagerOpen(true);
          }}
          onOpenRecalls={() => {
            closeAllPanels();
            setShowMemoryDashboard(true);
          }}
        />
      )}

      {/* Dynamic Floating Glassmorphic Screen Sharing Control Hub */}
      <FloatingScreenShareHub
        isScreenSharing={isScreenSharing}
        isScreenSharingPaused={isScreenSharingPaused}
        screenVisionMode={screenVisionMode}
        setScreenVisionMode={setScreenVisionMode}
        onStop={stopScreenSharing}
        onPause={pauseScreenSharing}
        onResume={resumeScreenSharing}
        onSwitch={switchScreenShare}
        onOpenMagnifier={() => setIsMagnifierOpen(true)}
        screenStream={screenStreamRef.current}
      />

      {/* Recollections sliding core panel */}
      <MemoryDashboard
        isOpen={showMemoryDashboard}
        onClose={() => setShowMemoryDashboard(false)}
        memories={memories.filter((m) => m && m.id && !deletedMemoryIds.includes(m.id))}
        onAddMemory={handleAddManualMemory}
        onDeleteMemory={handleDeleteMemory}
        themeColor={themeColor}
      />

      {/* Knowledge Graph Dashboard (Vector Memory Exploration View) */}
      <KnowledgeGraphDashboard
        isOpen={showKnowledgeGraph}
        onClose={() => setShowKnowledgeGraph(false)}
        themeColor={themeColor}
        memories={memories.filter((m) => m && m.id && !deletedMemoryIds.includes(m.id))}
      />

      {/* Conversation Journal sliding core panel */}
      <ChatJournal
        isOpen={showChatJournal}
        onClose={() => setShowChatJournal(false)}
        chatHistory={chatHistory}
        onClearHistory={handleClearChatHistory}
        themeColor={themeColor}
        chatMaxMessages={chatMaxMessages}
        chatRetentionTime={chatRetentionTime}
        onClearOldest={handleClearOldest}
      />

      {/* Classroom Whiteboard Suite */}
      <Chalkboard
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        text={whiteboardText}
        onTextChange={(newText) => {
          setWhiteboardText(newText);
          dbSet("myraa_whiteboard_text", newText);
        }}
        diagramType={whiteboardDiagramType}
        statusAlert={whiteboardStatusAlert}
        activeMode={whiteboardActiveMode}
        setActiveMode={setWhiteboardActiveMode}
        themeColor={themeColor}
        drawings={whiteboardDrawings}
        onUpdateDrawings={(cleaned) => {
          setWhiteboardDrawings(cleaned);
          dbSet("myraa_whiteboard_drawings", cleaned);
        }}
        clearCounter={whiteboardClearCounter}
        customModelData={whiteboardCustomModelData}
        memories={memories.filter((m) => m && m.id && !deletedMemoryIds.includes(m.id))}
        onTriggerSaveSimulation={handleSaveSimulationMetadata}
        voiceSketchTriggerText={voiceSketchTriggerText}
        onClearVoiceSketchTrigger={() => setVoiceSketchTriggerText(null)}
        onVoiceToMindMap={(topic) => handleVoiceToMindMap(topic, { autoSpeakFeedback: true })}
        onAskMahr={(question) => {
          setIsAskMahrOpen(true);
          if (question) {
            handleAskMahrSubmit(undefined, question);
          }
        }}
        onAskMyraa={(question) => {
          setIsAskMahrOpen(true);
          if (question) {
            handleAskMahrSubmit(undefined, question);
          }
        }}
        initialSlidesTopic={slidesStudioTopic}
      />

      {/* Interactive Screen Share Magnifier & Reading Focus Ruler */}
      <ScreenShareMagnifierModal
        isOpen={isMagnifierOpen && isScreenSharing}
        onClose={() => setIsMagnifierOpen(false)}
        screenStream={screenStreamRef.current}
        zoomScale={zoomScale}
        setZoomScale={setZoomScale}
        isRulerEnabled={isRulerEnabled}
        setIsRulerEnabled={setIsRulerEnabled}
        magnifierRulerY={magnifierRulerY}
        setMagnifierRulerY={setMagnifierRulerY}
      />

      {/* Interactive Exam Pad / Study Notes Drawer */}
      <StudyPadPanel
        isOpen={isStudyPadOpen}
        onClose={() => setIsStudyPadOpen(false)}
        studyPadText={studyPadText}
        setStudyPadText={setStudyPadText}
        notesMode={notesMode}
        setNotesMode={setNotesMode}
        notesStatusAlert={notesStatusAlert}
        isSavingNotes={isSavingNotes}
        onSaveNotesToMemory={handleMemorizeStudyNotes}
        onGenerateStudyPack={handleGenerateStudyPack}
        isGeneratingPack={isGeneratingPack}
        studyPack={studyPack || { flashcards: [], mcqs: [] }}
        studySuggestions={studySuggestions}
        isFetchingSuggestions={isFetchingSuggestions}
        onFetchSuggestions={handleFetchSuggestions}
        notesTextareaRef={notesTextareaRef}
        chatHistory={chatHistory}
        whiteboardText={whiteboardText}
        onConvertToMindMap={handleConvertToMindMap}
      />

















                          




      {/* Universal AI Simulation Engine Studio (2D Liquid State & 3D WebGL) */}
      <UniversalSimulationStudio
        isOpen={isSimulationStudioOpen}
        onClose={() => setIsSimulationStudioOpen(false)}
        initialPrompt={simulationPrompt}
        onAskMyraa={(question) => {
          setIsSimulationStudioOpen(false);
          setIsAskMyraaOpen(true);
        }}
      />

      {/* Human Mood & Emotion Psychology Studio Modal */}
      <HumanMoodStudio
        isOpen={isHumanMoodStudioOpen}
        onClose={() => setIsHumanMoodStudioOpen(false)}
        currentMood={currentHumanMood}
        onSelectMood={(mood, triggerVoiceSample) => {
          setCurrentHumanMood(mood);
          const moodCfg = HUMAN_MOOD_CONFIGS[mood];
          if (moodCfg?.themeId) {
            setThemeColor(moodCfg.themeId);
          }
          if (triggerVoiceSample && moodCfg) {
            const phrase = moodCfg.samplePhrases[0]?.english || moodCfg.samplePhrases[0]?.romanUrdu || moodCfg.description;
            speakNotification(phrase, moodCfg.emotionEquivalent);
          }
        }}
        onSpeakSamplePhrase={(text, mood) => {
          const moodCfg = HUMAN_MOOD_CONFIGS[mood];
          speakNotification(text, moodCfg?.emotionEquivalent || "idle");
        }}
        moodShiftReason={moodShiftReason}
        autoShiftBackground={autoShiftBackground}
        onToggleAutoShift={() => handleUpdateSystemSetting("autoShiftBackground", !autoShiftBackground)}
      />

      {/* Reinforcement Learning & Self-Improvement Growth Lab Modal */}
      <ReinforcementLearningStudio
        isOpen={isRLStudioOpen}
        onClose={() => setIsRLStudioOpen(false)}
        policy={rlPolicy}
        onUpdatePolicy={(newPolicy) => {
          setRlPolicy(newPolicy);
          saveRLPolicy(newPolicy);
        }}
        deficits={knowledgeDeficits}
        onUpdateDeficits={(updated) => {
          setKnowledgeDeficits(updated);
          saveKnowledgeDeficits(updated);
        }}
        onResolveDeficit={(id, notes) => {
          setKnowledgeDeficits((prev) => {
            const updated = prev.map((d) =>
              d.id === id ? { ...d, status: "resolved" as const, resolvedAt: new Date().toISOString(), resolutionNotes: notes } : d
            );
            saveKnowledgeDeficits(updated);
            return updated;
          });
        }}
        onDeleteDeficit={(id) => {
          setKnowledgeDeficits((prev) => {
            const updated = prev.filter((d) => d.id !== id);
            saveKnowledgeDeficits(updated);
            return updated;
          });
        }}
        themeColor={themeColor}
      />

      {/* Model Switcher Modal */}
      <ModelSwitcherModal
        isOpen={isModelSwitcherOpen}
        onClose={() => setIsModelSwitcherOpen(false)}
        activeModelId={activeModelId}
        onSelectModel={handleSelectModel}
        themeColor={themeColor}
        chatHistory={chatHistory}
        studyPadText={studyPadText}
        whiteboardText={whiteboardText}
      />

      {/* Sub-Agents Studio & Orchestrator Modal */}
      <SubAgentsStudio
        isOpen={isSubAgentsStudioOpen}
        onClose={() => setIsSubAgentsStudioOpen(false)}
        activeSubAgentId={activeSubAgent.id}
        onSelectSubAgent={handleSelectSubAgent}
        customSubAgents={customSubAgents}
        onCreateSubAgent={handleCreateCustomSubAgent}
        onDeleteCustomSubAgent={handleDeleteCustomSubAgent}
        themeColor={themeColor}
      />

      {/* 🏢 MAHR Office — Multi-Agent Virtual Office Floor Modal */}
      <MAHROfficeModal
        isOpen={isMunderDifflinOpen}
        onClose={() => setIsMunderDifflinOpen(false)}
        isBrowser={isBrowser}
        activeModelId={activeModelId}
        onSelectModel={handleSelectModel}
        onUpdateWhiteboardText={(text) => setWhiteboardText(text)}
        onUpdateStudyPadText={(text) => setStudyPadText(text)}
        onNotifyUser={(msg) => setWhiteboardStatusAlert(`🏢 ${msg}`)}
      />

      {/* Daily Task & Memory Tracker Modal */}
      <DailyTaskManager
        isOpen={isDailyTaskManagerOpen}
        onClose={() => setIsDailyTaskManagerOpen(false)}
        tasks={dailyTasks}
        onAddTask={handleAddDailyTask}
        onToggleTask={handleToggleDailyTask}
        onDeleteTask={handleDeleteDailyTask}
        onAutoGenerateTasks={handleAutoGenerateDailyTasks}
        themeColor={themeColor}
      />

      {/* Floating 'Ask MAHR' Button - Hidden when Whiteboard or Simulation Studio is open */}
      {!isWhiteboardOpen && !isSimulationStudioOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 md:right-8 z-[110]">
          <motion.button
            onClick={() => setIsAskMyraaOpen(!isAskMyraaOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-950/90 hover:bg-slate-900 border border-purple-500/40 hover:border-purple-500 text-purple-300 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 font-mono text-xs font-bold tracking-wider cursor-pointer group transition-all"
            style={{ boxShadow: `0 10px 30px -5px rgba(157, 122, 255, 0.3)` }}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Sparkles size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <span className="hidden sm:inline">Ask MAHR</span>
            <span className="sm:hidden">Ask</span>
            <span className={`w-2 h-2 rounded-full ${isAskMyraaOpen ? "bg-emerald-400" : "bg-purple-400 animate-pulse"}`} />
          </motion.button>
        </div>
      )}

      {/* Ask MAHR Interactive Text Console Modal */}
      {(() => {
        const syncedAskMyraaMessages = chatHistory && chatHistory.length > 0
          ? chatHistory.map((item) => {
              let formattedTime = "";
              if (item.timestamp) {
                if (item.timestamp.includes("T")) {
                  formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                } else {
                  formattedTime = item.timestamp;
                }
              } else {
                formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              }
              return {
                id: item.id,
                sender: (item.role === "user" ? "user" : "mahr") as "user" | "mahr",
                text: item.text,
                timestamp: formattedTime,
                actionExecuted: item.actionExecuted,
                groundingSources: item.groundingSources,
                searchQueries: item.searchQueries,
                mediaItems: item.mediaItems
              };
            })
          : [];

        return (
          <AskMahrModal
            isOpen={isAskMyraaOpen}
            onClose={() => setIsAskMyraaOpen(false)}
            messages={syncedAskMyraaMessages}
            input={askMyraaInput}
            onInputChange={setAskMyraaInput}
            onSubmit={handleAskMyraaSubmit}
            isLoading={askMyraaLoading}
            activeSubAgentName={activeSubAgent.name}
            activeModelId={activeModelId}
            themeColor={themeColor}
            isScreenSharing={isScreenSharing}
            isRealtimeConnected={state !== "disconnected"}
            includeScreenSnapshot={includeScreenSnapshot}
            onToggleScreenSnapshot={setIncludeScreenSnapshot}
            isAutoSpeakEnabled={isAutoSpeakEnabled}
            onToggleAutoSpeak={setIsAutoSpeakEnabled}
            pendingImages={pendingImages}
            onAddPendingImage={(base64) => setPendingImages((prev) => [...prev, base64])}
            onRemovePendingImage={(idx) => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
          />
        );
      })()}

      {/* Keyboard Shortcuts Hotkeys Modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        onToggleSession={handleToggleConnection}
        isSessionActive={state !== "disconnected"}
        onToggleAskMyraa={() => setIsAskMyraaOpen(!isAskMyraaOpen)}
        onToggleWhiteboard={() => { closeAllPanels(); setIsWhiteboardOpen(!isWhiteboardOpen); }}
        onToggleStudyPad={() => { closeAllPanels(); setIsStudyPadOpen(!isStudyPadOpen); }}
        onToggleJournal={() => { closeAllPanels(); setShowChatJournal(!showChatJournal); }}
        onToggleMemory={() => { closeAllPanels(); setShowMemoryDashboard(!showMemoryDashboard); }}
        onToggleDailyTasks={() => { closeAllPanels(); setIsDailyTaskManagerOpen(!isDailyTaskManagerOpen); }}
        onToggleSubAgents={() => { closeAllPanels(); setIsSubAgentsStudioOpen(!isSubAgentsStudioOpen); }}
        onToggleSettings={() => { closeAllPanels(); setShowSettings(!showSettings); }}
        onToggleModelSwitcher={() => { closeAllPanels(); setIsModelSwitcherOpen(!isModelSwitcherOpen); }}
        themeColor={themeColor}
      />

      {/* Proactive Task Reminder Floating Toast */}
      <ProactiveTaskReminderToast
        task={activeProactiveTask}
        onDismiss={() => setActiveProactiveTask(null)}
        onCompleteTask={handleToggleDailyTask}
        themeColor={themeColor}
      />

      {/* Cross-Platform Native Desktop & Remote Web Connect Modal */}
      <DesktopAndRemoteModal
        isOpen={isDesktopRemoteModalOpen}
        onClose={() => setIsDesktopRemoteModalOpen(false)}
        activeModelName={activeModelId}
        isLiveActive={state !== "disconnected"}
      />
    </div>
  );
}
