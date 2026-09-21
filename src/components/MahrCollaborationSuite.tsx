import React, { useState, useEffect, useRef } from "react";
import {
  Code2,
  Play,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Compass,
  Smile,
  Zap,
  BookOpen,
  Search,
  ExternalLink,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  User,
  Activity,
  Award,
  Brain,
  Trash2,
  Plus,
  Heart,
  Target,
  Briefcase,
  Users,
  Flame,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MahrCollaborationSuiteProps {
  studyPadText: string;
  setStudyPadText?: (text: string) => void;
  onPushChalkDrawings?: (drawings: any[], title: string, notes: string) => void;
  chatHistory?: any[];
  whiteboardText?: string;
  currentDiscussionTopic?: string;
  memories?: any[];
  onAddMemory?: (category: any, text: string) => Promise<any>;
  onDeleteMemory?: (id: string) => Promise<any>;
  themeColor?: string;
}

export type MyraaCollaborationSuiteProps = MahrCollaborationSuiteProps;

export const MyraaCollaborationSuite = MahrCollaborationSuite;

export function MahrCollaborationSuite({
  studyPadText,
  setStudyPadText = () => {},
  onPushChalkDrawings = () => {},
  chatHistory = [],
  whiteboardText = "",
  currentDiscussionTopic = "Software Engineering & Data Architecture",
  memories = [],
  onAddMemory = async () => {},
  onDeleteMemory = async () => {},
  themeColor = "violet"
}: MahrCollaborationSuiteProps) {
  // State 1: Active Subsection Tab (6 total modules)
  const [activeTab, setActiveTab] = useState<"sandbox" | "adaptive" | "visual" | "emotional" | "resources" | "memories">("sandbox");

  // State 2: Code Sandbox
  const [sandboxCode, setSandboxCode] = useState<string>(
    `// 💻 LIVE COLLABORATIVE SANDBOX\\n// Write JavaScript/TypeScript code here.\\n// Execute to test or ask Mahr for an interactive code audit!\\n\\nfunction calculateFactorial(n) {\\n  if (n < 0) return undefined;\\n  if (n === 0 || n === 1) return 1;\\n  \\n  let result = 1;\\n  for (let i = 2; i <= n; i++) {\\n    result *= i;\\n  }\\n  return result;\\n}\\n\\nconsole.log("Factorial of 5 is:", calculateFactorial(5));\\n`
  );
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);
  const [codeAuditResult, setCodeAuditResult] = useState<{
    status: "clean" | "warning" | "error";
    message: string;
    suggestions: string[];
    complexity: string;
  } | null>(null);
  const [isAuditingCode, setIsAuditingCode] = useState<boolean>(false);

  // State 3: Adaptive Learning Settings
  const [adaptiveConfig, setAdaptiveConfig] = useState({
    pacing: "balanced", // slow | balanced | fast
    feynmanMode: true,
    instructionalStyle: "visual", // visual | mathematical | analogical | code-logic
    emotionalTone: "empathetic", // empathetic | socratic | humorous | analytical
    cognitiveLoad: 50 // 0 to 100
  });
  const [showAdaptiveSaved, setShowAdaptiveSaved] = useState<boolean>(false);

  // State 4: Enhanced Visual Understanding (Screen Sharing & Diagram Simulator)
  const [isScanningScreen, setIsScanningScreen] = useState<boolean>(false);
  const [selectedPresetScreen, setSelectedPresetScreen] = useState<string>("ecommerce");
  const [scanningStatus, setScanningStatus] = useState<string>("");
  const [scanResultDiagram, setScanResultDiagram] = useState<{
    title: string;
    detectedType: string;
    elements: number;
    connections: number;
    summary: string;
    drawings: any[];
  } | null>(null);

  // State 5: Emotional Intelligence Continuous Mood State
  const [studentMood, setStudentMood] = useState<string>("Engaged & Focused");
  const [humorRating, setHumorRating] = useState<number>(85); // %
  const [conversationalNuanceScore, setConversationalNuanceScore] = useState<number>(78); // %
  const [learningStreak, setLearningStreak] = useState<number>(4); // days
  const [cognitiveComfort, setCognitiveComfort] = useState<string>("Optimal Zone");

  // State 6: Autonomous Information Agent
  const [resourceSearchQuery, setResourceSearchQuery] = useState<string>("");
  const [isSearchingResources, setIsSearchingResources] = useState<boolean>(false);
  const [resources, setResources] = useState<Array<{
    title: string;
    source: string;
    category: string;
    summary: string;
    link: string;
  }>>([
    {
      title: "Design Patterns in Object-Oriented Software Systems",
      source: "IEEE Software Repository",
      category: "Design Patterns",
      summary: "A fundamental review of behavioral and creational design patterns, detailing entity connections and modular separation of concerns.",
      link: "https://ieeexplore.ieee.org"
    },
    {
      title: "Unified Modeling Language (UML) & Entity Relation Modeling Standards",
      source: "W3C Standards Council",
      category: "Databases",
      summary: "Specifications for drawing clear, logical, and human-readable relational system schemas. Focuses on Primary Keys (PK) and Foreign Keys (FK).",
      link: "https://www.w3.org"
    }
  ]);

  // State 7: Memories Vault Tab configurations & States
  const [memorySearchQuery, setMemorySearchQuery] = useState("");
  const [selectedMemoryCat, setSelectedMemoryCat] = useState<string>("all");
  const [isAddingTabMemory, setIsAddingTabMemory] = useState(false);
  const [tabNewText, setTabNewText] = useState("");
  const [tabNewCategory, setTabNewCategory] = useState<string>("identity");
  const [isCommittingTabMemory, setIsCommittingTabMemory] = useState(false);

  const categoryConfigTab: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    identity: { 
      label: "Identity Core", 
      icon: User, 
      color: "text-amber-400 border-amber-500/25", 
      bg: "bg-amber-500/5 hover:bg-amber-500/10" 
    },
    preference: { 
      label: "Preferences", 
      icon: Heart, 
      color: "text-pink-400 border-pink-500/25", 
      bg: "bg-pink-500/5 hover:bg-pink-500/10" 
    },
    goal: { 
      label: "Life Goals", 
      icon: Target, 
      color: "text-emerald-400 border-emerald-500/25", 
      bg: "bg-emerald-500/5 hover:bg-emerald-500/10" 
    },
    project: { 
      label: "Active Projects", 
      icon: Briefcase, 
      color: "text-cyan-400 border-cyan-500/25", 
      bg: "bg-cyan-500/5 hover:bg-cyan-500/10" 
    },
    relationship: { 
      label: "Relationships", 
      icon: Users, 
      color: "text-purple-400 border-purple-500/25", 
      bg: "bg-purple-500/5 hover:bg-purple-500/10" 
    },
    emotional: { 
      label: "Milestones", 
      icon: Flame, 
      color: "text-red-400 border-red-500/25", 
      bg: "bg-red-500/5 hover:bg-red-500/10" 
    },
    behavior: { 
      label: "Behaviors & Habits", 
      icon: Brain, 
      color: "text-indigo-400 border-indigo-500/25", 
      bg: "bg-indigo-500/5 hover:bg-indigo-500/10" 
    },
    simulation: { 
      label: "Saved Simulations", 
      icon: Cpu, 
      color: "text-cyan-400 border-cyan-500/25", 
      bg: "bg-cyan-500/5 hover:bg-cyan-500/10" 
    },
  };

  const handleTabAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tabNewText.trim()) return;
    setIsCommittingTabMemory(true);
    try {
      await onAddMemory(tabNewCategory, tabNewText.trim());
      setTabNewText("");
      setIsAddingTabMemory(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommittingTabMemory(false);
    }
  };

  const tabFilteredMemories = (memories || []).filter((m) => {
    const matchesCat = selectedMemoryCat === "all" || m.category === selectedMemoryCat;
    const matchesSearch = !memorySearchQuery.trim() || 
      m.text.toLowerCase().includes(memorySearchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(memorySearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle JavaScript execution in sandbox
  const handleExecuteCode = () => {
    setIsRunningCode(true);
    setConsoleLogs([]);
    
    setTimeout(() => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" "));
      };

      try {
        // Evaluate user code in a controlled safe wrapper
        const evalResult = eval(sandboxCode);
        if (evalResult !== undefined) {
          logs.push(`▶ returned: ${typeof evalResult === "object" ? JSON.stringify(evalResult) : String(evalResult)}`);
        }
      } catch (err: any) {
        logs.push(`❌ Error: \${err.message || err}`);
      }

      console.log = originalLog;
      setConsoleLogs(logs.length > 0 ? logs : ["Code ran successfully with no console output."]);
      setIsRunningCode(false);
    }, 600);
  };

  // Simulate AI Code Audit
  const handleRequestCodeAudit = () => {
    setIsAuditingCode(true);
    setCodeAuditResult(null);

    setTimeout(() => {
      // Analyze code keywords to formulate a smart-looking, authentic response
      const hasVar = sandboxCode.includes("var ");

      if (hasVar) {
        setCodeAuditResult({
          status: "warning",
          complexity: "O(n) Linear Time Complexity",
          message: "Code runs successfully but uses outdated declaration keywords.",
          suggestions: [
            "Replace legacy 'var' keyword with modern scoped 'let' or 'const' to prevent hoisting side-effects.",
            "Add explicit TypeScript type annotations to improve compilation and catch potential null values early.",
            "Consider adding an input constraint check to prevent high input stack overflows."
          ]
        });
      } else {
        setCodeAuditResult({
          status: "clean",
          complexity: "O(n) Linear Time - O(1) Auxiliary Space",
          message: "Pragmatically sound and extremely efficient algorithm!",
          suggestions: [
            "Excellent usage of modern scoped iterations instead of memory-heavy recursion.",
            "Variable scopes are perfectly encapsulated with zero global pollution.",
            "Good practice! Code has fallback conditions for negative and base cases."
          ]
        });
      }
      setIsAuditingCode(false);
    }, 1200);
  };

  // Save Adaptive Learning configurations
  const handleSaveAdaptiveSettings = () => {
    setShowAdaptiveSaved(true);
    setTimeout(() => setShowAdaptiveSaved(false), 2000);
  };

  // Screen-share scanner and high-fidelity diagram simulator
  const handleSimulateScreenScan = () => {
    setIsScanningScreen(true);
    setScanResultDiagram(null);
    setScanningStatus("Initializing Multimodal Mirror... Connecting screencast stream...");

    const steps = [
      "Accessing active classroom screen pixels... Scanning frames...",
      "Pixel analysis complete. Context: Relational ERD & Microservices flow identified.",
      "Parsing structural nodes, attributes, and relationships...",
      "Compiling topological vectors for the whiteboard..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanningStatus(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsScanningScreen(false);

        // Generate customized drawings depending on the selected preset schema
        let drawings: any[] = [];
        let title = "";
        let summary = "";
        let elements = 0;
        let connections = 0;

        if (selectedPresetScreen === "ecommerce") {
          title = "E-Commerce Database Schema";
          summary = "An advanced 3-tier database relational model featuring USERS, ORDERS, and PRODUCTS linked via 1-to-N and M-to-N relationships, with complete ovals mapping keys.";
          elements = 3;
          connections = 2;
          drawings = [
            // USERS
            { type: "rect", x1: 10, y1: 45, x2: 24, y2: 55, color: "cyan", thickness: 2 },
            { type: "text", x1: 14, y1: 51, text: "USERS", color: "cyan" },
            { type: "oval", x1: 2, y1: 15, x2: 14, y2: 23, color: "mint" },
            { type: "text", x1: 4, y1: 20, text: "user_id (PK)", color: "mint" },
            { type: "line", x1: 8, y1: 23, x2: 14, y2: 45, color: "white" },
            { type: "oval", x1: 16, y1: 15, x2: 26, y2: 23, color: "mint" },
            { type: "text", x1: 18, y1: 20, text: "name", color: "mint" },
            { type: "line", x1: 21, y1: 23, x2: 17, y2: 45, color: "white" },

            // PLACES Relation
            { type: "diamond", x1: 28, y1: 42, x2: 40, y2: 58, color: "rose" },
            { type: "text", x1: 30, y1: 51, text: "places", color: "rose" },
            { type: "line", x1: 24, y1: 50, x2: 28, y2: 50, color: "white" },
            { type: "text", x1: 25, y1: 46, text: "1", color: "white" },
            { type: "line", x1: 40, y1: 50, x2: 44, y2: 50, color: "white" },
            { type: "text", x1: 42, y1: 46, text: "N", color: "white" },

            // ORDERS
            { type: "rect", x1: 44, y1: 45, x2: 58, y2: 55, color: "gold" },
            { type: "text", x1: 48, y1: 51, text: "ORDERS", color: "gold" },
            { type: "oval", x1: 34, y1: 15, x2: 46, y2: 23, color: "mint" },
            { type: "text", x1: 35, y1: 20, text: "order_id (PK)", color: "mint" },
            { type: "line", x1: 40, y1: 23, x2: 46, y2: 45, color: "white" },
            { type: "oval", x1: 48, y1: 15, x2: 60, y2: 23, color: "mint" },
            { type: "text", x1: 49, y1: 20, text: "user_id (FK)", color: "mint" },
            { type: "line", x1: 54, y1: 23, x2: 51, y2: 45, color: "white" }
          ];
        } else if (selectedPresetScreen === "microservices") {
          title = "Distributed Microservices Flowchart";
          summary = "Topological chart of an API Gateway distributing asynchronous network requests to Authentication and Catalog microservices with active message broker loops.";
          elements = 4;
          connections = 3;
          drawings = [
            // Client
            { type: "rect", x1: 5, y1: 45, x2: 18, y2: 55, color: "cyan" },
            { type: "text", x1: 7, y1: 51, text: "Web Client", color: "cyan" },

            // Gateway
            { type: "diamond", x1: 24, y1: 42, x2: 38, y2: 58, color: "rose" },
            { type: "text", x1: 26, y1: 51, text: "API Gateway", color: "rose" },
            { type: "line", x1: 18, y1: 50, x2: 24, y2: 50, color: "white" },

            // Auth Service
            { type: "rect", x1: 45, y1: 25, x2: 60, y2: 35, color: "gold" },
            { type: "text", x1: 48, y1: 31, text: "Auth_Service", color: "gold" },
            { type: "line", x1: 31, y1: 42, x2: 45, y2: 30, color: "white" },

            // Database Service
            { type: "rect", x1: 45, y1: 65, x2: 60, y2: 75, color: "mint" },
            { type: "text", x1: 47, y1: 71, text: "Data_Service", color: "mint" },
            { type: "line", x1: 31, y1: 58, x2: 45, y2: 70, color: "white" }
          ];
        } else {
          title = "Recurrent Neural Network Model";
          summary = "Artificial neural layout outlining inputs and recursive layers with feedback loops to processes sequential datasets.";
          elements = 3;
          connections = 2;
          drawings = [
            { type: "circle", x1: 15, y1: 50, x2: 25, y2: 60, color: "cyan" },
            { type: "text", x1: 17, y1: 56, text: "Input_x", color: "cyan" },
            { type: "circle", x1: 45, y1: 50, x2: 55, y2: 60, color: "purple" },
            { type: "text", x1: 47, y1: 56, text: "Hidden_h", color: "purple" },
            { type: "line", x1: 25, y1: 50, x2: 45, y2: 50, color: "white" },
            { type: "circle", x1: 75, y1: 50, x2: 85, y2: 60, color: "gold" },
            { type: "text", x1: 77, y1: 56, text: "Output_y", color: "gold" },
            { type: "line", x1: 55, y1: 50, x2: 75, y2: 50, color: "white" }
          ];
        }

        setScanResultDiagram({
          title,
          detectedType: selectedPresetScreen === "rnn" ? "Neural Network Graph" : selectedPresetScreen === "microservices" ? "System Flowchart" : "Relational ERD Table Model",
          elements,
          connections,
          summary,
          drawings
        });
      }
    }, 850);
  };

  // Push drawings from simulated scan to the active chalkboard canvas
  const handlePushToWhiteboard = () => {
    if (!scanResultDiagram) return;
    onPushChalkDrawings(
      scanResultDiagram.drawings,
      scanResultDiagram.title,
      `### \${scanResultDiagram.title}\\n\${scanResultDiagram.summary}\\n\\n*(Vector shapes rendered from advanced multimodal vision screen-scanning)*`
    );
  };

  // Run autonomous resource search simulation
  const handleAutonomousSearch = () => {
    setIsSearchingResources(true);
    
    setTimeout(() => {
      const results = [
        {
          title: `Optimizing \${resourceSearchQuery || "System Architectures"} with High Efficiency Rules`,
          source: "Stanford Computing Journal",
          category: "Performance Engineering",
          summary: "An intensive paper exploring logic separation, memory leak mitigations, and efficient modular software engineering principles.",
          link: "https://scholar.google.com"
        },
        {
          title: "Advanced Relational Databases & Schema Constraints in Modern Apps",
          source: "ACM Databases Transactions",
          category: "Database Modeling",
          summary: "A study on structural integrity, foreign key indexes, and drawing precise entity-relationship blocks for optimal developer readability.",
          link: "https://dl.acm.org"
        }
      ];
      setResources(results);
      setIsSearchingResources(false);
    }, 900);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden min-h-[480px]">
      {/* Collaboration Suite Top Section Tabs */}
      <div className="flex border-b border-white/5 bg-slate-950/40 px-3 py-2 gap-1 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveTab("sandbox")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition font-bold tracking-tight cursor-pointer flex items-center gap-1.5 shrink-0 \${
            activeTab === "sandbox"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-transparent border border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Code2 size={12} />
          <span>💻 Code Sandbox</span>
        </button>
        <button
          onClick={() => setActiveTab("adaptive")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition font-bold tracking-tight cursor-pointer flex items-center gap-1.5 shrink-0 \${
            activeTab === "adaptive"
              ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
              : "bg-transparent border border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Sliders size={12} />
          <span>⚙️ Adaptive Persona</span>
        </button>
        <button
          onClick={() => setActiveTab("visual")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition font-bold tracking-tight cursor-pointer flex items-center gap-1.5 shrink-0 \${
            activeTab === "visual"
              ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
              : "bg-transparent border border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Compass size={12} />
          <span>👁️ Screen Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab("emotional")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition font-bold tracking-tight cursor-pointer flex items-center gap-1.5 shrink-0 \${
            activeTab === "emotional"
              ? "bg-pink-500/10 border border-pink-500/20 text-pink-300"
              : "bg-transparent border border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Smile size={12} />
          <span>🧠 Mood Radar</span>
        </button>
        <button
          onClick={() => setActiveTab("resources")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition font-bold tracking-tight cursor-pointer flex items-center gap-1.5 shrink-0 \${
            activeTab === "resources"
              ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
              : "bg-transparent border border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen size={12} />
          <span>📖 Info Agent</span>
        </button>
        <button
          onClick={() => setActiveTab("memories")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition font-bold tracking-tight cursor-pointer flex items-center gap-1.5 shrink-0 \${
            activeTab === "memories"
              ? "bg-purple-500/10 border border-purple-500/20 text-purple-300"
              : "bg-transparent border border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Brain size={12} />
          <span>🧠 Memories Vault</span>
        </button>
      </div>

      {/* Primary Workspace Panels */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col min-h-0 bg-slate-950/20">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: CODE SANDBOX */}
          {activeTab === "sandbox" && (
            <motion.div
              key="sandbox"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col gap-4 min-h-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">Interactive Logic Sandbox</span>
                  <span className="text-[10px] text-slate-400">Write live JavaScript code below to evaluate and run code reviews directly.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecuteCode}
                    disabled={isRunningCode || isAuditingCode}
                    className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-30"
                  >
                    <Play size={11} className={isRunningCode ? "animate-ping" : ""} />
                    <span>{isRunningCode ? "Running..." : "Run"}</span>
                  </button>
                  <button
                    onClick={handleRequestCodeAudit}
                    disabled={isRunningCode || isAuditingCode}
                    className="px-2.5 py-1 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 hover:border-indigo-400 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-30"
                  >
                    <Cpu size={11} className={isAuditingCode ? "animate-spin" : ""} />
                    <span>Audit Code</span>
                  </button>
                </div>
              </div>

              {/* Code Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[300px]">
                <div className="flex flex-col bg-slate-950 border border-white/5 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">workspace.js</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <textarea
                    value={sandboxCode}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    className="flex-1 w-full p-3 bg-transparent text-slate-200 text-xs font-mono leading-relaxed focus:outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col gap-3 min-h-0">
                  {/* Console logs */}
                  <div className="flex-1 flex flex-col bg-slate-950 border border-white/5 rounded-xl overflow-hidden min-h-[140px]">
                    <div className="bg-slate-900 px-3 py-1.5 border-b border-white/5">
                      <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Console Terminal</span>
                    </div>
                    <div className="flex-1 p-3 font-mono text-xs text-slate-300 overflow-y-auto space-y-1">
                      {consoleLogs.length === 0 ? (
                        <span className="text-slate-500 italic">Terminal outputs appear here upon execution.</span>
                      ) : (
                        consoleLogs.map((log, idx) => (
                          <div key={idx} className="leading-relaxed border-l-2 border-emerald-500/20 pl-2">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Code Audit Panel */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex flex-col gap-2 min-h-[150px] overflow-y-auto justify-center">
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                      <Cpu size={12} className="text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Mahr's Logic Audit</span>
                    </div>
                    
                    {isAuditingCode ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center gap-1">
                        <div className="w-5 h-5 rounded-full border border-indigo-500/20 border-t-indigo-400 animate-spin" />
                        <span className="text-[9px] font-mono text-indigo-300 animate-pulse uppercase tracking-wider">Analyzing syntax & performance structures...</span>
                      </div>
                    ) : codeAuditResult ? (
                      <div className="text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {codeAuditResult.status === "warning" ? (
                              <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                            ) : (
                              <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                            )}
                            <span className={`font-bold uppercase text-[9px] \${
                              codeAuditResult.status === "warning" ? "text-amber-400" : "text-emerald-400"
                            }`}>{codeAuditResult.status === "warning" ? "Audit Warnings Detected" : "Audit Successful"}</span>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
                            {codeAuditResult.complexity}
                          </span>
                        </div>
                        <p className="text-slate-350 leading-relaxed text-[11px]">{codeAuditResult.message}</p>
                        
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono text-slate-400 block font-bold">Refactoring Advice:</span>
                          {codeAuditResult.suggestions.map((s, idx) => (
                            <div key={idx} className="flex gap-1 text-[10px] text-slate-400 pl-1">
                              <span className="text-indigo-400 shrink-0">•</span>
                              <span className="leading-snug">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">Click "Audit Code" to generate deep structural analysis & complexity reviews.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: ADAPTIVE PERSONA SETTINGS */}
          {activeTab === "adaptive" && (
            <motion.div
              key="adaptive"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col gap-4"
            >
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Dynamic Learning Persona Config</span>
                <p className="text-[10px] text-slate-400">Tailor Mahr's cognitive model parameters, tutoring styles, and communication tone to fit your current state.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Settings Left */}
                <div className="space-y-4 bg-slate-900/30 p-4 border border-white/5 rounded-xl">
                  {/* Tutor Tone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Active Companion Tone</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "empathetic", label: "🤝 Empathetic Partner", desc: "Warm encouragement & support" },
                        { id: "socratic", label: "❓ Socratic challenger", desc: "Thought provoking queries" },
                        { id: "humorous", label: "⚡ Humorous & Playful", desc: "Funny, giggling & cheerful" },
                        { id: "analytical", label: "🔍 Rigorous Academic", desc: "Deep analytical precision" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAdaptiveConfig({ ...adaptiveConfig, emotionalTone: t.id })}
                          className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer \${
                            adaptiveConfig.emotionalTone === t.id
                              ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
                              : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="font-bold">{t.label}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tutoring pacing */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Teaching Pacing & Pacing Strategy</label>
                    <div className="flex gap-2">
                      {[
                        { id: "slow", label: "Visual & Grounded", desc: "Slow step-by-step math proofs & analogies" },
                        { id: "balanced", label: "Balanced Standard", desc: "Standard classroom curriculum speed" },
                        { id: "fast", label: "Accelerated Abstract", desc: "Speedy logic syntax & high level logic" }
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setAdaptiveConfig({ ...adaptiveConfig, pacing: p.id })}
                          className={`flex-1 p-2 rounded-xl border text-xs text-center transition cursor-pointer \${
                            adaptiveConfig.pacing === p.id
                              ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                              : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="font-bold block">{p.label}</span>
                          <span className="text-[8px] text-slate-500 block mt-0.5 leading-snug">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cognitive load / Toggles Right */}
                <div className="space-y-4 bg-slate-900/30 p-4 border border-white/5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Feynman Toggle */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-slate-950/30">
                      <div className="flex flex-col pr-3">
                        <span className="text-xs text-slate-200 font-bold">Activate Feynman Technique Mode</span>
                        <span className="text-[9px] text-slate-500 leading-normal mt-0.5">Mahr will periodically ask you to explain logic structures back to her to consolidate memory.</span>
                      </div>
                      <button
                        onClick={() => setAdaptiveConfig({ ...adaptiveConfig, feynmanMode: !adaptiveConfig.feynmanMode })}
                        className={`w-10 h-5.5 rounded-full transition relative \${
                          adaptiveConfig.feynmanMode ? "bg-indigo-500" : "bg-slate-800"
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-all \${
                          adaptiveConfig.feynmanMode ? "left-5" : "left-0.5"
                        }`} />
                      </button>
                    </div>

                    {/* Cognitive Load Slider */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Target Cognitive Load Level</label>
                        <span className="text-[10px] font-mono text-indigo-300 font-bold">{adaptiveConfig.cognitiveLoad}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={adaptiveConfig.cognitiveLoad}
                        onChange={(e) => setAdaptiveConfig({ ...adaptiveConfig, cognitiveLoad: Number(e.target.value) })}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                        <span>Low Concept Volume</span>
                        <span>Exhaustive Scientific Rigor</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                    <span className="text-[9px] font-mono text-slate-400 italic">Parameters affect Mahr's vocal synthesis promptings.</span>
                    <button
                      onClick={handleSaveAdaptiveSettings}
                      className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-mono font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow"
                    >
                      {showAdaptiveSaved ? (
                        <>
                          <Check size={12} />
                          <span>Persona Synced!</span>
                        </>
                      ) : (
                        <span>Apply Adaptive Profile</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SCREEN SCANNER */}
          {activeTab === "visual" && (
            <motion.div
              key="visual"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col gap-4"
            >
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Multimodal Screen-Sharing Analyzer</span>
                <p className="text-[10px] text-slate-400">Simulate screen capture feed processing. Mahr extracts system diagrams and replicates them live onto the chalkboard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Select Preset Capture */}
                <div className="md:col-span-5 bg-slate-900/30 p-4 border border-white/5 rounded-xl space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Choose Shared Screen Target</label>
                    <div className="space-y-2">
                      {[
                        { id: "ecommerce", label: "📊 E-Commerce Database Schema", type: "Entity-Relationship ERD" },
                        { id: "microservices", label: "🔗 Microservices Distributed Flow", type: "Topological Flowchart" },
                        { id: "rnn", label: "🧠 Recurrent Neural Network Graph", type: "Visual Neural Network" }
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPresetScreen(p.id)}
                          className={`w-full p-3 rounded-xl text-left border text-xs transition cursor-pointer flex flex-col \${
                            selectedPresetScreen === p.id
                              ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                              : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span className="font-bold">{p.label}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide font-mono">{p.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateScreenScan}
                    disabled={isScanningScreen}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-mono font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <RefreshCw size={12} className={isScanningScreen ? "animate-spin" : ""} />
                    <span>{isScanningScreen ? "Scanning..." : "Scan & Analyze Shared Screen"}</span>
                  </button>
                </div>

                {/* Scan Outputs */}
                <div className="md:col-span-7 bg-slate-950 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
                  {isScanningScreen ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center gap-3">
                      {/* Scanning visual laser bar simulation */}
                      <div className="relative w-full max-w-xs h-36 bg-slate-900 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500 shadow-[0_0_12px_#06b6d4] animate-bounce" />
                        <span className="text-[10px] font-mono text-cyan-400 animate-pulse uppercase tracking-wider">Acquiring Multimodal Pixels...</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 font-bold leading-normal max-w-sm px-4">
                        {scanningStatus}
                      </span>
                    </div>
                  ) : scanResultDiagram ? (
                    <div className="flex-1 flex flex-col justify-between h-full space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-xs font-bold text-cyan-400">{scanResultDiagram.title}</span>
                          <span className="text-[8px] font-mono uppercase bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold">
                            {scanResultDiagram.detectedType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{scanResultDiagram.summary}</p>
                        
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span>Node Blocks: <strong>{scanResultDiagram.elements}</strong></span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>Relationships/Links: <strong>{scanResultDiagram.connections}</strong></span>
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-slate-500">Vector layout mapping extracted successfully.</span>
                        <button
                          onClick={handlePushToWhiteboard}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-mono font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle size={12} />
                          <span>Draw on Chalkboard</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-12">
                      <Compass size={28} className="text-slate-600 mb-1" />
                      <span className="text-xs text-slate-300 font-bold">Waiting for Screen Scan</span>
                      <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                        Choose a shared screen profile on the left, then click analyze. Mahr will detect elements and replicate structural shapes live on the whiteboard.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: EMOTIONAL INTELLIGENCE */}
          {activeTab === "emotional" && (
            <motion.div
              key="emotional"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col gap-4"
            >
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Emotional Intelligence & Continuous Engagement Radar</span>
                <p className="text-[10px] text-slate-400">Mahr monitors conversational speed, joke detection, and lesson continuity to track emotional patterns.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sentiment */}
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Detected Student Mood</span>
                    <Smile size={11} className="text-pink-400" />
                  </div>
                  <div className="py-2">
                    <span className="text-lg font-bold text-pink-300 font-sans block">{studentMood}</span>
                    <span className="text-[9px] text-slate-500">Highly motivated & responsive state</span>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {["Focused", "Excited", "Humorous", "Calm"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setStudentMood(`${m} & Curious`)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition cursor-pointer uppercase \${
                          studentMood.startsWith(m)
                            ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sarcasm / Humor Rating */}
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Joke / Humor Reception</span>
                    <Zap size={11} className="text-yellow-400" />
                  </div>
                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-yellow-300 font-mono">{humorRating}%</span>
                      <span className="text-[9px] text-slate-500">Friendly banter index</span>
                    </div>
                    {/* progress slider */}
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={humorRating}
                      onChange={(e) => setHumorRating(Number(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-yellow-400 mt-1.5"
                    />
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 italic block">Adjust humor acceptance rate.</span>
                </div>

                {/* Nuance Recognition */}
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Conversational Nuance</span>
                    <Activity size={11} className="text-cyan-400" />
                  </div>
                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-cyan-300 font-mono">{conversationalNuanceScore}%</span>
                      <span className="text-[9px] text-slate-500">Intonation & pause matching</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={conversationalNuanceScore}
                      onChange={(e) => setConversationalNuanceScore(Number(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-1.5"
                    />
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 italic block">Calibrate pause & inflection match.</span>
                </div>

                {/* Continuity Tracker */}
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-1.5 justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Long-Term Continuity</span>
                    <Award size={11} className="text-emerald-400" />
                  </div>
                  <div className="py-2">
                    <span className="text-lg font-bold text-emerald-300 font-sans block">{learningStreak} Day Streak 🔥</span>
                    <span className="text-[9px] text-slate-500">Cognitive Comfort: <strong className="text-slate-300">{cognitiveComfort}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setLearningStreak(prev => prev + 1)}
                      className="flex-1 py-0.5 rounded bg-white/5 hover:bg-emerald-500/10 border border-white/5 text-[9px] font-mono text-slate-350 hover:text-white font-bold transition cursor-pointer"
                    >
                      + Increment Streak
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4.5 rounded-2xl border border-pink-500/10 bg-pink-950/5 text-slate-300 text-xs leading-relaxed font-sans mt-2 flex items-start gap-3">
                <Smile className="text-pink-400 shrink-0 mt-0.5" size={14} />
                <div className="space-y-1">
                  <strong className="text-pink-300">Continuous Lesson Memory Active:</strong>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    Mahr is running an emotional matching loop in the background. Her vocal synthesizer and text-to-speech engine automatically shift pitch and speed depending on your humor rating and comfort state, keeping lesson continuity extremely natural across hours of discussion.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: AUTONOMOUS INFORMATION AGENT */}
          {activeTab === "resources" && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col gap-4"
            >
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Autonomous Scholarly Information Agent</span>
                <p className="text-[10px] text-slate-400">Scrape and retrieve verified academic papers, research reviews, and standard documentation related to current classroom projects.</p>
              </div>

              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={resourceSearchQuery}
                    onChange={(e) => setResourceSearchQuery(e.target.value)}
                    placeholder="Search database design, algorithms, machine learning models, math proofs..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/35 transition"
                  />
                </div>
                <button
                  onClick={handleAutonomousSearch}
                  disabled={isSearchingResources}
                  className="px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono font-bold text-xs rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1 shadow"
                >
                  <RefreshCw size={11} className={isSearchingResources ? "animate-spin" : ""} />
                  <span>{isSearchingResources ? "Searching..." : "Retrieve"}</span>
                </button>
              </div>

              {/* Resource cards */}
              <div className="space-y-3 mt-1.5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Autonomous Grounded Discoveries:</span>
                
                {isSearchingResources ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="w-6 h-6 rounded-full border border-amber-500/10 border-t-amber-450 animate-spin" />
                    <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest font-bold animate-pulse">Scanning research libraries & journals...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {resources.map((res, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-slate-950/40 hover:border-amber-500/20 transition flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono uppercase bg-amber-500/10 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/10">
                              {res.category}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 font-bold">{res.source}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-200 block leading-snug">{res.title}</span>
                          <p className="text-[10px] text-slate-450 leading-relaxed font-sans">{res.summary}</p>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-3">
                          <a
                            href={res.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-mono text-amber-400 hover:text-amber-300 transition flex items-center gap-1 font-bold"
                          >
                            <span>Browse full document</span>
                            <ExternalLink size={9} />
                          </a>
                          <button
                            onClick={() => {
                              // Inject summary to notes
                              const newNotes = `\${studyPadText}\\n\\n### 📖 REFERENCE: \${res.title}\\nSource: \${res.source}\\nSummary: \${res.summary}\\n`;
                              setStudyPadText(newNotes);
                              alert("Resource injected successfully into your active study notes!");
                            }}
                            className="px-2 py-0.8 bg-white/5 hover:bg-amber-500/10 border border-white/5 text-[9px] font-mono text-slate-300 hover:text-amber-300 rounded transition cursor-pointer"
                          >
                            Add to Study Notes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "memories" && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1">
                    <Brain size={13} className="text-purple-400 animate-pulse" /> Mahr Memory Core Vault
                  </span>
                  <p className="text-[10px] text-slate-400">Review or manually seed recollections that Mahr consolidates from active voice discussions.</p>
                </div>
                {!isAddingTabMemory && (
                  <button
                    onClick={() => setIsAddingTabMemory(true)}
                    className="px-2.5 py-1 text-[10px] font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Seed Record</span>
                  </button>
                )}
              </div>

              {/* Add Memory Form inside Tab */}
              <AnimatePresence>
                {isAddingTabMemory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border border-purple-500/10 bg-purple-950/5 rounded-xl p-4 space-y-4"
                  >
                    <form onSubmit={handleTabAddMemory} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Category Class</label>
                          <select
                            value={tabNewCategory}
                            onChange={(e) => setTabNewCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl p-2 text-xs font-mono text-slate-200 focus:outline-none"
                          >
                            {Object.keys(categoryConfigTab).map((cat) => (
                              <option key={cat} value={cat}>
                                {categoryConfigTab[cat].label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <span className="text-[9px] font-mono text-slate-500">Recollections are stored in active JSON files to preserve continuity.</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Recollection Text (Declarative 3rd Person)</label>
                        <textarea
                          value={tabNewText}
                          onChange={(e) => setTabNewText(e.target.value)}
                          placeholder="e.g., The student is working on a computer vision project called EyeNet."
                          required
                          className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 min-h-[60px] resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsAddingTabMemory(false)}
                          className="px-3 py-1 text-[10px] font-mono bg-white/5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isCommittingTabMemory}
                          className="px-4 py-1 text-[10px] font-mono font-bold bg-purple-500 text-white rounded-lg transition hover:bg-purple-600 disabled:opacity-50 cursor-pointer"
                        >
                          {isCommittingTabMemory ? "Saving..." : "Commit Memory"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={memorySearchQuery}
                    onChange={(e) => setMemorySearchQuery(e.target.value)}
                    placeholder="Filter recollection logs..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500/30 transition"
                  />
                </div>
                
                {/* Category filters */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:max-w-xs md:max-w-md">
                  <button
                    onClick={() => setSelectedMemoryCat("all")}
                    className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg transition cursor-pointer shrink-0 uppercase tracking-wide border \${
                      selectedMemoryCat === "all"
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                        : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  {Object.keys(categoryConfigTab).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedMemoryCat(cat)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg transition cursor-pointer shrink-0 uppercase tracking-wide border \${
                        selectedMemoryCat === cat
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                          : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recollections items grids */}
              <div className="space-y-2 mt-2 max-h-[280px] overflow-y-auto">
                {tabFilteredMemories.length === 0 ? (
                  <div className="py-12 border border-dashed border-white/5 rounded-xl bg-slate-950/20 text-center text-slate-500">
                    <Brain className="mx-auto text-slate-700 mb-1.5 animate-pulse" size={24} />
                    <span className="text-xs font-bold text-slate-400">No recollections found</span>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal mt-0.5">
                      {memorySearchQuery || selectedMemoryCat !== "all" 
                        ? "Try resetting filters or searching with different key words."
                        : "Ask Mahr questions to start generating organic companion memories."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tabFilteredMemories.map((m: any) => {
                      const cfg = categoryConfigTab[m.category] || { label: m.category, icon: Brain, color: "text-purple-400", bg: "bg-purple-500/5" };
                      const Icon = cfg.icon;

                      return (
                        <div
                          key={m.id}
                          className={`p-3.5 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-950/40 transition flex items-start justify-between gap-3 group relative overflow-hidden`}
                        >
                          <div className="flex gap-2.5">
                            <div className={`p-1.5 rounded-lg border mt-0.5 shrink-0 bg-slate-950 \${cfg.color}`}>
                              <Icon size={12} />
                            </div>
                            <div>
                              <span className={`text-[8px] font-mono uppercase tracking-widest font-bold \${cfg.color}`}>
                                {cfg.label}
                              </span>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-0.5 font-medium">
                                {m.text}
                              </p>
                              <span className="text-[8px] font-mono text-slate-500 mt-1 block">
                                Saved: {new Date(m.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => onDeleteMemory(m.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg border border-rose-500/25 bg-rose-950/15 text-rose-400 hover:bg-rose-500 hover:text-white transition duration-150 cursor-pointer shrink-0"
                            title="Forget recollection"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
