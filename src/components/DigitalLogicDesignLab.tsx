import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Cpu, 
  Plus, 
  Minus,
  Sparkles,
  Trash2, 
  Info,
  CheckCircle,
  Clock,
  Eye,
  Activity,
  Maximize2,
  Sliders,
  Tv,
  Zap,
  Check,
  Search,
  Copy,
  FolderOpen,
  X,
  Volume2,
  VolumeX,
  Loader2,
  ArrowRight
} from "lucide-react";
import { generateDldCircuitWithGemini } from "../services/simulationService";
import { speakViaWebSocket, stopAllWebSocketSpeech } from "../lib/audio";

export interface DigitalLogicDesignLabProps {
  initialPrompt?: string;
  onAskMahr?: (question: string) => void;
  onAskMyraa?: (question: string) => void;
  onClose?: () => void;
  className?: string;
}

// DLD gate definition interface
export interface LogicNode {
  id: string;
  type: "input" | "gate" | "output" | "clock" | "seven_seg";
  name: string;
  gateType?: "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR" | "MUX" | "CLOCK" | "SEVEN_SEG" | "DFF" | "TFF" | "JKFF";
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  inputs: string[]; // IDs of preceding nodes serving as incoming connections
  value?: boolean; // Evaluated simulation state
  isToggledOn?: boolean; // Only for inputs
  clockFreq?: number; // clock frequency in Hz (0.5, 1, 2, 5)
  maxInputs?: number; // custom setting for number of inputs (2, 3, 4)
  ledColor?: string; // custom led bulb hex/classes
  isPushButton?: boolean; // is active high push button on hold
  prevClockValue?: boolean; // edge triggering
}

// Built-in educational templates
interface Template {
  id: string;
  name: string;
  description: string;
  booleanExpression: string;
  nodes: LogicNode[];
  truthTableHeaders: string[];
  truthTableRows: { inputs: boolean[]; outputs: boolean[] }[];
}

const DLD_TEMPLATES: Record<string, Template> = {
  half_adder: {
    id: "half_adder",
    name: "📐 Half Adder Circuit",
    description: "Computes the arithmetic binary addition of two inputs. Generates a physical Sum (XOR) and a Carry-Out mathematical overflow (AND).",
    booleanExpression: "Sum = A ⊕ B, Carry = A • B",
    nodes: [
      { id: "A", type: "input", name: "Input A", x: 15, y: 30, inputs: [], isToggledOn: false, value: false },
      { id: "B", type: "input", name: "Input B", x: 15, y: 70, inputs: [], isToggledOn: true, value: true },
      { id: "XOR1", type: "gate", name: "S_XOR", gateType: "XOR", x: 50, y: 35, inputs: ["A", "B"], value: false },
      { id: "AND1", type: "gate", name: "C_AND", gateType: "AND", x: 50, y: 65, inputs: ["A", "B"], value: false },
      { id: "SUM", type: "output", name: "Sum (S)", x: 85, y: 35, inputs: ["XOR1"], value: false },
      { id: "CARRY", type: "output", name: "Carry (C)", x: 85, y: 65, inputs: ["AND1"], value: false },
    ],
    truthTableHeaders: ["A", "B", "Sum", "Carry"],
    truthTableRows: [
      { inputs: [false, false], outputs: [false, false] },
      { inputs: [false, true], outputs: [true, false] },
      { inputs: [true, false], outputs: [true, false] },
      { inputs: [true, true], outputs: [false, true] },
    ]
  },
  full_adder: {
    id: "full_adder",
    name: "🚀 Full Adder Core",
    description: "Adds three input bits (A, B, and Carry-In), vital for designing cascaded multi-bit arithmetic logical unit integer operators (ALU).",
    booleanExpression: "Sum = A ⊕ B ⊕ Cin, Cout = (A • B) + (Cin • (A ⊕ B))",
    nodes: [
      { id: "A", type: "input", name: "Input A", x: 12, y: 22, inputs: [], isToggledOn: true, value: true },
      { id: "B", type: "input", name: "Input B", x: 12, y: 50, inputs: [], isToggledOn: false, value: false },
      { id: "Cin", type: "input", name: "Carry-In (Cin)", x: 12, y: 78, inputs: [], isToggledOn: true, value: true },
      
      { id: "XOR1", type: "gate", name: "XOR1", gateType: "XOR", x: 38, y: 32, inputs: ["A", "B"], value: false },
      { id: "XOR2", type: "gate", name: "XOR2", gateType: "XOR", x: 65, y: 38, inputs: ["XOR1", "Cin"], value: false },
      
      { id: "AND1", type: "gate", name: "AND1", gateType: "AND", x: 38, y: 65, inputs: ["A", "B"], value: false },
      { id: "AND2", type: "gate", name: "AND2", gateType: "AND", x: 55, y: 82, inputs: ["XOR1", "Cin"], value: false },
      { id: "OR1", type: "gate", name: "OR1", gateType: "OR", x: 74, y: 72, inputs: ["AND1", "AND2"], value: false },
      
      { id: "SUM", type: "output", name: "Sum (S)", x: 88, y: 38, inputs: ["XOR2"], value: false },
      { id: "Cout", type: "output", name: "Carry-Out (Cout)", x: 88, y: 72, inputs: ["OR1"], value: false },
    ],
    truthTableHeaders: ["A", "B", "Cin", "Sum", "Cout"],
    truthTableRows: [
      { inputs: [false, false, false], outputs: [false, false] },
      { inputs: [false, false, true], outputs: [true, false] },
      { inputs: [false, true, false], outputs: [true, false] },
      { inputs: [false, true, true], outputs: [false, true] },
      { inputs: [true, false, false], outputs: [true, false] },
      { inputs: [true, false, true], outputs: [false, true] },
      { inputs: [true, true, false], outputs: [false, true] },
      { inputs: [true, true, true], outputs: [true, true] },
    ]
  },
  mux_2to1: {
    id: "mux_2to1",
    name: "⚡ 2-to-1 Multiplexer",
    description: "Directs analog data selection. Forwards either Input I0 or I1 to output Y based on select control state S.",
    booleanExpression: "Y = (I0 • S') + (I1 • S)",
    nodes: [
      { id: "I0", type: "input", name: "Data 0 (I0)", x: 15, y: 20, inputs: [], isToggledOn: true, value: true },
      { id: "I1", type: "input", name: "Data 1 (I1)", x: 15, y: 50, inputs: [], isToggledOn: false, value: false },
      { id: "S", type: "input", name: "Selector (S)", x: 15, y: 80, inputs: [], isToggledOn: true, value: true },
      
      { id: "NOT1", type: "gate", name: "NOT_S", gateType: "NOT", x: 38, y: 80, inputs: ["S"], value: false },
      { id: "AND1", type: "gate", name: "AND_I0", gateType: "AND", x: 55, y: 28, inputs: ["I0", "NOT1"], value: false },
      { id: "AND2", type: "gate", name: "AND_I1", gateType: "AND", x: 55, y: 56, inputs: ["I1", "S"], value: false },
      { id: "OR1", type: "gate", name: "OR_Out", gateType: "OR", x: 76, y: 42, inputs: ["AND1", "AND2"], value: false },
      
      { id: "Y", type: "output", name: "Output Y", x: 90, y: 42, inputs: ["OR1"], value: false },
    ],
    truthTableHeaders: ["I0", "I1", "S", "Out Y"],
    truthTableRows: [
      { inputs: [false, false, false], outputs: [false] },
      { inputs: [false, false, true], outputs: [false] },
      { inputs: [false, true, false], outputs: [false] },
      { inputs: [false, true, true], outputs: [true] },
      { inputs: [true, false, false], outputs: [true] },
      { inputs: [true, false, true], outputs: [false] },
      { inputs: [true, true, false], outputs: [true] },
      { inputs: [true, true, true], outputs: [true] },
    ]
  },
  sr_latch: {
    id: "sr_latch",
    name: "💾 Sequential SR Latch memory",
    description: "A fundamental static bi-stable memory storage element using cross-coupled NOR feedback connections to trap and store single-bit values of state.",
    booleanExpression: "Q = (R + Q_BAR)', Q_BAR = (S + Q)'",
    nodes: [
      { id: "R", type: "input", name: "Reset (R)", x: 15, y: 25, inputs: [], isToggledOn: false, value: false },
      { id: "S", type: "input", name: "Set (S)", x: 15, y: 75, inputs: [], isToggledOn: false, value: false },
      
      { id: "NOR1", type: "gate", name: "NOR_R", gateType: "NOR", x: 52, y: 35, inputs: ["R", "NOR2"], value: false },
      { id: "NOR2", type: "gate", name: "NOR_S", gateType: "NOR", x: 52, y: 65, inputs: ["S", "NOR1"], value: true },
      
      { id: "Q", type: "output", name: "State Q", x: 85, y: 35, inputs: ["NOR1"], value: false },
      { id: "Q_BAR", type: "output", name: "State Q' (Not Q)", x: 85, y: 65, inputs: ["NOR2"], value: true },
    ],
    truthTableHeaders: ["S", "R", "Q", "Q_BAR"],
    truthTableRows: [
      { inputs: [false, false], outputs: [undefined, undefined] }, // Hold condition
      { inputs: [false, true], outputs: [false, true] }, // Reset state
      { inputs: [true, false], outputs: [true, false] }, // Set state
      { inputs: [true, true], outputs: [false, false] }, // Invalid condition!
    ]
  },
  majority_detector: {
    id: "majority_detector",
    name: "📊 3-Input Majority Voter",
    description: "Evaluates voting parity. Output LED turns ON (1) only when a majority (at least 2 or 3) of inputs are turned ON (1).",
    booleanExpression: "Y = AB + BC + AC",
    nodes: [
      { id: "A", type: "input", name: "Vote A", x: 15, y: 20, inputs: [], isToggledOn: true, value: true },
      { id: "B", type: "input", name: "Vote B", x: 15, y: 50, inputs: [], isToggledOn: true, value: true },
      { id: "C", type: "input", name: "Vote C", x: 15, y: 80, inputs: [], isToggledOn: false, value: false },
      
      { id: "AND_AB", type: "gate", name: "AND_AB", gateType: "AND", x: 50, y: 25, inputs: ["A", "B"], value: false },
      { id: "AND_BC", type: "gate", name: "AND_BC", gateType: "AND", x: 50, y: 50, inputs: ["B", "C"], value: false },
      { id: "AND_AC", type: "gate", name: "AND_AC", gateType: "AND", x: 50, y: 75, inputs: ["A", "C"], value: false },
      
      { id: "OR_Sum", type: "gate", name: "OR_Sum", gateType: "OR", x: 74, y: 50, inputs: ["AND_AB", "AND_BC", "AND_AC"], value: false },
      { id: "Y", type: "output", name: "Majority Output", x: 90, y: 50, inputs: ["OR_Sum"], value: false },
    ],
    truthTableHeaders: ["A", "B", "C", "Majority"],
    truthTableRows: [
      { inputs: [false, false, false], outputs: [false] },
      { inputs: [false, false, true], outputs: [false] },
      { inputs: [false, true, false], outputs: [false] },
      { inputs: [false, true, true], outputs: [true] },
      { inputs: [true, false, false], outputs: [false] },
      { inputs: [true, false, true], outputs: [true] },
      { inputs: [true, true, false], outputs: [true] },
      { inputs: [true, true, true], outputs: [true] },
    ]
  }
};

export default function DigitalLogicDesignLab({
  initialPrompt,
  onAskMahr,
  onAskMyraa,
  onClose,
  className = ""
}: DigitalLogicDesignLabProps = {}) {
  const askTutorHandler = onAskMahr || onAskMyraa;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("half_adder");
  const [nodes, setNodes] = useState<LogicNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isVerifiedDismissed, setIsVerifiedDismissed] = useState<boolean>(false);
  const [rightPanelTab, setRightPanelTab] = useState<"table" | "equations" | "inspector">("table");
  const [showDynamicTable, setShowDynamicTable] = useState<boolean>(false);
  const [signalHistory, setSignalHistory] = useState<number[]>([]);

  useEffect(() => {
    setIsVerifiedDismissed(false);
  }, [selectedTemplateId]);

  const [aiPromptVal, setAiPromptVal] = useState<string>("");
  const [aiTeachingBlock, setAiTeachingBlock] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [suggestedExperiments, setSuggestedExperiments] = useState<string[]>([]);
  const [customBooleanExpr, setCustomBooleanExpr] = useState<string>("");

  const speakExplanation = (text: string) => {
    if (isSpeaking) {
      stopAllWebSocketSpeech();
      setIsSpeaking(false);
      return;
    }
    stopAllWebSocketSpeech();
    setIsSpeaking(true);
    speakViaWebSocket(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  useEffect(() => {
    return () => {
      stopAllWebSocketSpeech();
    };
  }, []);

  const handleAiBuild = async (customPrompt?: string) => {
    const promptToUse = (typeof customPrompt === "string" ? customPrompt : aiPromptVal).trim();
    if (!promptToUse || isAiGenerating) return;

    setIsAiGenerating(true);
    setSelectedTemplateId("none"); // Prevents the template useEffect from overwriting

    // 1. First attempt Gemini API generation for real-time pedagogical circuit design
    try {
      const res = await generateDldCircuitWithGemini(promptToUse, "gemini-flash-latest");
      if (res && res.status === "success" && res.data && res.data.nodes && res.data.nodes.length > 0) {
        const gen = res.data;
        const mappedNodes: LogicNode[] = gen.nodes.map((n: any) => ({
          id: n.id || `node_${Math.random().toString(36).substring(2, 6)}`,
          type: n.type || "gate",
          name: n.name || n.id,
          gateType: n.gateType,
          x: typeof n.x === "number" ? Math.max(8, Math.min(92, n.x)) : 50,
          y: typeof n.y === "number" ? Math.max(10, Math.min(90, n.y)) : 50,
          inputs: Array.isArray(n.inputs) ? n.inputs : [],
          isToggledOn: !!n.isToggledOn,
          value: !!n.isToggledOn,
          maxInputs: n.maxInputs || (n.gateType === "NOT" ? 1 : 2),
          clockFreq: n.clockFreq || 1,
          ledColor: "#10b981"
        }));

        setNodes(mappedNodes);
        setAiTeachingBlock(gen.educationalExplanation || gen.description || `Synthesized custom digital logic circuit for: ${promptToUse}`);
        setSuggestedExperiments(gen.suggestedExperiments || [
          "Toggle input switches to verify circuit logic outputs",
          "Observe truth table signals propagating through interconnected gates"
        ]);
        if (gen.booleanExpression) {
          setCustomBooleanExpr(gen.booleanExpression);
        }
        setIsAiGenerating(false);
        return;
      }
    } catch (e: any) {
      console.log("[DLD AI Gen] Switching to local synthesizer:", e?.message || e);
    }

    const lower = promptToUse.toLowerCase();

    if (lower.includes("full adder") || lower.includes("fulladder")) {
      const initialNodes: LogicNode[] = [
        { id: "A", type: "input", name: "Input A", x: 15, y: 15, inputs: [], isToggledOn: true, value: true },
        { id: "B", type: "input", name: "Input B", x: 15, y: 40, inputs: [], isToggledOn: false, value: false },
        { id: "CIn", type: "input", name: "Carry In", x: 15, y: 65, inputs: [], isToggledOn: true, value: true },
        { id: "XOR1", type: "gate", name: "XOR_1", gateType: "XOR" as any, x: 45, y: 20, inputs: ["A", "B"], value: false, maxInputs: 2 },
        { id: "SUM_XOR", type: "gate", name: "Sum Output", gateType: "XOR" as any, x: 72, y: 25, inputs: ["XOR1", "CIn"], value: false, maxInputs: 2 },
        { id: "AND1", type: "gate", name: "AND_1", gateType: "AND" as any, x: 45, y: 50, inputs: ["A", "B"], value: false, maxInputs: 2 },
        { id: "AND2", type: "gate", name: "AND_2", gateType: "AND" as any, x: 45, y: 75, inputs: ["XOR1", "CIn"], value: false, maxInputs: 2 },
        { id: "CARRY_OR", type: "gate", name: "Carry Out", gateType: "OR" as any, x: 72, y: 65, inputs: ["AND1", "AND2"], value: false, maxInputs: 2 },
        { id: "LED_S", type: "output", name: "Sum Result", x: 92, y: 25, inputs: ["SUM_XOR"], value: false },
        { id: "LED_C", type: "output", name: "Carry Result", x: 92, y: 65, inputs: ["CARRY_OR"], value: false },
      ];
      setNodes(initialNodes);
      setCustomBooleanExpr("Sum = A ⊕ B ⊕ Cin, Cout = (A·B) + (Cin·(A⊕B))");
      setAiTeachingBlock("I have successfully synthesized a complete binary Full Adder circuit representation! 1-bit binary columns combine Input A, Input B, and the propagated Carry In (CIn) using cascaded XOR logic for Sum (S), plus double-gate AND pairings integrated to OR for the Carry Out (COut) signal.");
      setSuggestedExperiments([
        "Set A=1, B=1, CIn=0 -> Sum LED is 0, Carry LED lights up (Binary 10)",
        "Set A=1, B=1, CIn=1 -> Both Sum and Carry LEDs light up (Binary 11 = decimal 3)"
      ]);
    } else if (lower.includes("half adder") || lower.includes("halfadder")) {
      const initialNodes: LogicNode[] = [
        { id: "A", type: "input", name: "Input A", x: 15, y: 30, inputs: [], isToggledOn: true, value: true },
        { id: "B", type: "input", name: "Input B", x: 15, y: 65, inputs: [], isToggledOn: false, value: false },
        { id: "XOR1", type: "gate", name: "XOR_Sum", gateType: "XOR" as any, x: 50, y: 35, inputs: ["A", "B"], value: false, maxInputs: 2 },
        { id: "AND1", type: "gate", name: "AND_Carry", gateType: "AND" as any, x: 50, y: 65, inputs: ["A", "B"], value: false, maxInputs: 2 },
        { id: "LED_S", type: "output", name: "Sum LED", x: 88, y: 35, inputs: ["XOR1"], value: false },
        { id: "LED_C", type: "output", name: "Carry LED", x: 88, y: 65, inputs: ["AND1"], value: false },
      ];
      setNodes(initialNodes);
      setCustomBooleanExpr("Sum = A ⊕ B, Carry = A · B");
      setAiTeachingBlock("I have automatically built a binary Half Adder circuit! It processes two input switches (A and B). The XOR gate produces the Sum digit, while the AND gate produces the logical Carry-out when both bits are set to HIGH.");
      setSuggestedExperiments([
        "Toggle A=1, B=0 -> Sum=1, Carry=0",
        "Toggle both A=1, B=1 -> Sum=0, Carry=1"
      ]);
    } else if (lower.includes("sr latch") || lower.includes("sr") || lower.includes("latch")) {
      const initialNodes: LogicNode[] = [
        { id: "S", type: "input", name: "Set Switch S", x: 15, y: 25, inputs: [], isToggledOn: false, value: false },
        { id: "R", type: "input", name: "Reset Switch R", x: 15, y: 75, inputs: [], isToggledOn: true, value: true },
        { id: "NOR1", type: "gate", name: "NOR_Set", gateType: "NOR" as any, x: 50, y: 35, inputs: ["S", "NOR2"], value: false, maxInputs: 2 },
        { id: "NOR2", type: "gate", name: "NOR_Reset", gateType: "NOR" as any, x: 50, y: 65, inputs: ["R", "NOR1"], value: false, maxInputs: 2 },
        { id: "Q_LED", type: "output", name: "Q LED Out", x: 88, y: 35, inputs: ["NOR1"], value: false },
        { id: "QBAR_LED", type: "output", name: "Q' LED Out", x: 88, y: 65, inputs: ["NOR2"], value: false }
      ];
      setNodes(initialNodes);
      setCustomBooleanExpr("Q = (R + Q')', Q' = (S + Q)' [Cross-Coupled Feedback]");
      setAiTeachingBlock("I have generated a cross-coupled SR Latch using standard NOR gates! This is an asynchronous memory cell. Activating Set (S) stores a HIGH state at Q. Activating Reset (R) clears Q. Feedback wiring allows it to retain state when both lines are pulled LOW!");
      setSuggestedExperiments([
        "Flip Set S=1, R=0 -> Q turns ON",
        "Turn S=0, R=0 -> Notice Q stays ON (Memory Hold state!)",
        "Flip Reset R=1 -> Q turns OFF immediately"
      ]);
    } else if (lower.includes("jkff") || lower.includes("jk flip flop") || lower.includes("jk flip-flop")) {
      const initialNodes: LogicNode[] = [
        { id: "J", type: "input", name: "J (Set Options)", x: 15, y: 20, inputs: [], isToggledOn: true, value: true },
        { id: "CLK", type: "clock", name: "Clock OSC", x: 15, y: 50, inputs: [], value: false, clockFreq: 1 },
        { id: "K", type: "input", name: "K (Reset Options)", x: 15, y: 80, inputs: [], isToggledOn: true, value: true },
        { id: "JKFF1", type: "gate", name: "JK_FlipFlop", gateType: "JKFF" as any, x: 55, y: 50, inputs: ["J", "CLK", "K"], value: false, maxInputs: 3 },
        { id: "Q_LED", type: "output", name: "Output Q", x: 88, y: 50, inputs: ["JKFF1"], value: false }
      ];
      setNodes(initialNodes);
      setCustomBooleanExpr("Q(next) = J·Q' + K'·Q [Toggle Mode when J=K=1]");
      setAiTeachingBlock("I have created an advanced 3-terminal JK Flip-Flop testbench. When both J and K are HIGH, it enters Toggle Mode, inverting the Q status at each rising edge pulse of the clock generator!");
      setSuggestedExperiments([
        "Watch Q toggle on each clock cycle when J=1 and K=1",
        "Turn K=0 to lock the flip-flop into Set mode on the next clock pulse"
      ]);
    } else if (lower.includes("dff") || lower.includes("d flip flop") || lower.includes("d flip-flop")) {
      const initialNodes: LogicNode[] = [
        { id: "D", type: "input", name: "Data Line D", x: 15, y: 30, inputs: [], isToggledOn: true, value: true },
        { id: "CLK", type: "clock", name: "System CLK (1Hz)", x: 15, y: 70, inputs: [], value: false, clockFreq: 1 },
        { id: "DFF1", type: "gate", name: "D_FlipFlop", gateType: "DFF" as any, x: 55, y: 50, inputs: ["D", "CLK"], value: false, maxInputs: 2 },
        { id: "Q_LED", type: "output", name: "Q LED pin", x: 88, y: 50, inputs: ["DFF1"], value: false }
      ];
      setNodes(initialNodes);
      setCustomBooleanExpr("Q(next) = D [Synchronous Edge-Triggered]");
      setAiTeachingBlock("I have constructed a standard edge-triggered Data (D) Flip-Flop! Perfect for synchronous design learning. Try toggling the input Switch and notice that the output LED only updates exactly on the rising edge of the 1Hz Clock Oscillator!");
      setSuggestedExperiments([
        "Change Data D=1 -> Notice Q waits until the clock tick to update",
        "Change Data D=0 -> Notice Q maintains previous state until clock pulses again"
      ]);
    } else if (lower.includes("tff") || lower.includes("t flip flop") || lower.includes("t flip-flop")) {
      const initialNodes: LogicNode[] = [
        { id: "T", type: "input", name: "Toggle T", x: 15, y: 30, inputs: [], isToggledOn: true, value: true },
        { id: "CLK", type: "clock", name: "CLK Source", x: 15, y: 70, inputs: [], value: false, clockFreq: 1 },
        { id: "TFF1", type: "gate", name: "T_FlipFlop", gateType: "TFF" as any, x: 55, y: 50, inputs: ["T", "CLK"], value: false, maxInputs: 2 },
        { id: "Q_LED", type: "output", name: "Q LED Out", x: 88, y: 50, inputs: ["TFF1"], value: false }
      ];
      setNodes(initialNodes);
      setCustomBooleanExpr("Q(next) = T ⊕ Q [Toggle when T=1]");
      setAiTeachingBlock("T-Flip Flop toggle divider loaded successfully. Toggle (T) input represents enable frequency division. When T is HIGH, output value changes state on each clock tick, providing a divide-by-2 counter.");
      setSuggestedExperiments([
        "Keep T=1 and watch LED flash at half the speed of the clock oscillator",
        "Set T=0 to halt state transitions and freeze output state"
      ]);
    } else if (lower.includes("subtractor")) {
      const initialNodes: LogicNode[] = [
        { id: "A", type: "input", name: "Minuend A", x: 15, y: 30, inputs: [], isToggledOn: true, value: true },
        { id: "B", type: "input", name: "Subtrahend B", x: 15, y: 65, inputs: [], isToggledOn: false, value: false },
        { id: "NOT1", type: "gate", name: "NOT_Gate", gateType: "NOT" as any, x: 38, y: 65, inputs: ["A"], value: false, maxInputs: 1 },
        { id: "AND1", type: "gate", name: "AND_Borrow", gateType: "AND" as any, x: 56, y: 65, inputs: ["NOT1", "B"], value: false, maxInputs: 2 },
        { id: "XOR1", type: "gate", name: "XOR_Diff", gateType: "XOR" as any, x: 56, y: 35, inputs: ["A", "B"], value: false, maxInputs: 2 },
        { id: "LED_D", type: "output", name: "Difference LED", x: 88, y: 35, inputs: ["XOR1"], value: false },
        { id: "LED_B", type: "output", name: "Borrow LED", x: 88, y: 65, inputs: ["AND1"], value: false },
      ];
      setNodes(initialNodes);
      setCustomBooleanExpr("Diff = A ⊕ B, Borrow = A' · B");
      setAiTeachingBlock("Binary Half Subtractor built successfully! Difference (D) is calculated using XOR of A and B; Borrow represents A' * B, meaning we borrow 1 from the adjacent stage when subtractor is larger than basic value.");
      setSuggestedExperiments([
        "Set A=0, B=1 -> Both Difference and Borrow light up (0 - 1 = 1 with Borrow 1)",
        "Set A=1, B=0 -> Difference lights up, Borrow is 0 (1 - 0 = 1)"
      ]);
    } else {
      // Dynamic cascading parser!
      const recognized: string[] = [];
      const keywords = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR", "MUX"];
      keywords.forEach(kw => {
        if (lower.includes(kw.toLowerCase())) {
          recognized.push(kw);
        }
      });

      if (recognized.length > 0) {
        // We compile a cascading layout based on recognized gate keywords!
        const initialNodes: LogicNode[] = [];
        // Place inputs
        initialNodes.push({ id: "In1", type: "input", name: "Input A", x: 12, y: 25, inputs: [], isToggledOn: true, value: true });
        initialNodes.push({ id: "In2", type: "input", name: "Input B", x: 12, y: 55, inputs: [], isToggledOn: false, value: false });
        initialNodes.push({ id: "In3", type: "input", name: "Input C", x: 12, y: 80, inputs: [], isToggledOn: true, value: true });

        // Place cascade gates
        recognized.forEach((gate, idx) => {
          const gId = `G_${gate}_${idx}`;
          const prvId = idx === 0 ? "In1" : `G_${recognized[idx - 1]}_${idx - 1}`;
          const secondaryIn = idx === 0 ? "In2" : (idx === 1 ? "In3" : "In2");
          const mInps = gate === "NOT" ? 1 : 2;

          initialNodes.push({
            id: gId,
            type: "gate",
            name: `${gate}_Stage${idx + 1}`,
            gateType: gate as any,
            x: 35 + idx * 18,
            y: 35 + (idx % 2) * 20,
            inputs: mInps === 1 ? [prvId] : [prvId, secondaryIn],
            value: false,
            maxInputs: mInps
          });
        });

        // Place Output LED
        const finalGateId = `G_${recognized[recognized.length - 1]}_${recognized.length - 1}`;
        initialNodes.push({
          id: "LED_OUT",
          type: "output",
          name: "Cascaded Result Output",
          x: 90,
          y: 50,
          inputs: [finalGateId],
          value: false
        });

        setNodes(initialNodes);
        setCustomBooleanExpr(`F = ${recognized.join(" ➔ ")}`);
        setAiTeachingBlock(`I analyzed your prompt and auto-designed a multi-stage custom cascading logic circuit containing: ${recognized.join(" ➔ ")}. Toggles and wire channels are fully operational. Flip the switches to trace how states propagate through each gate!`);
      } else {
        // Default simple teaching OR fallback AND gate loop
        const initialNodes: LogicNode[] = [
          { id: "A", type: "input", name: "Teacher Input A", x: 15, y: 30, inputs: [], isToggledOn: true, value: true },
          { id: "B", type: "input", name: "Teacher Input B", x: 15, y: 65, inputs: [], isToggledOn: true, value: true },
          { id: "AND1", type: "gate", name: "AND_Gate", gateType: "AND" as any, x: 50, y: 48, inputs: ["A", "B"], value: false, maxInputs: 2 },
          { id: "LED1", type: "output", name: "LED Probe Light", x: 88, y: 48, inputs: ["AND1"], value: false },
        ];
        setNodes(initialNodes);
        setCustomBooleanExpr("Output = A · B");
        setAiTeachingBlock(`Custom order parsed. I loaded a benchmark AND demonstration circuit. When you ask me for specific logic modules (like 'Full Adder', 'SR Latch', 'D Flip-Flop', 'Half Subtractor', or 'NAND gate connected to OR gate'), I will auto-generate and cascade those configurations instantly!`);
      }
    }

    setIsAiGenerating(false);
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setAiPromptVal(initialPrompt);
      handleAiBuild(initialPrompt);
    }
  }, [initialPrompt]);
  
  // Zooming & panning states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Wire layout choices: "orthogonal" (like CircuitVerse) or "bezier"
  const [wireStyle, setWireStyle] = useState<"orthogonal" | "bezier">("orthogonal");

  // Dragging states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // Interactive wiring states
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const [customCounter, setCustomCounter] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Wire animation pulse triggers
  const [wirePulsePhase, setWirePulsePhase] = useState(0);

  // High-precision clock master timer (vibrates at 200ms cycles)
  const [masterTime, setMasterTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  // Search filter for component sidebar explorer
  const [searchQuery, setSearchQuery] = useState("");

  // Clipboard copy buffer for Ctrl+C duplicates
  const [copiedNode, setCopiedNode] = useState<LogicNode | null>(null);

  // Load template nodes
  useEffect(() => {
    const template = DLD_TEMPLATES[selectedTemplateId];
    if (template) {
      const clonedNodes = JSON.parse(JSON.stringify(template.nodes)) as LogicNode[];
      // Fill missing property defaults for safety
      const prepared = clonedNodes.map(n => ({
        ...n,
        clockFreq: n.clockFreq || 1,
        maxInputs: n.maxInputs || (n.gateType === "NOT" ? 1 : n.gateType === "MUX" ? 3 : n.type === "seven_seg" ? 4 : 2),
        ledColor: n.ledColor || "#10b981"
      }));
      setNodes(prepared);
      setSelectedNodeId(null);
      setConnectingFromId(null);
    }
  }, [selectedTemplateId]);

  // Master Clock trigger sequence
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setMasterTime(prev => (prev + 1) % 120);
      setNodes(prev => {
        return evaluateCircuit(prev);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Mouse wheel zoom handler centered around pointer position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.08;
      const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
      const boundedZoom = Math.min(Math.max(nextZoom, 0.45), 2.2);

      const rect = el.getBoundingClientRect();
      const mX = e.clientX - rect.left;
      const mY = e.clientY - rect.top;

      // Coordinate matching math
      const workX = (mX - pan.x) / zoom;
      const workY = (mY - pan.y) / zoom;

      setZoom(boundedZoom);
      setPan({
        x: mX - workX * boundedZoom,
        y: mY - workY * boundedZoom
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, pan]);

  // Dedicated evaluator for passive parallel validations
  const evaluateCircuitForTest = (nodesList: LogicNode[], tempInputs: boolean[]): LogicNode[] => {
    const evaluated = nodesList.map(n => ({ ...n }));
    const maxIterations = 8;

    const getNodeVal = (id: string): boolean => {
      const node = evaluated.find(n => n.id === id);
      return node ? !!node.value : false;
    };

    const computeValue = (gate: LogicNode): boolean => {
      if (gate.type === "clock") {
        return true; 
      }

      const inputsSelected = gate.inputs.map(id => getNodeVal(id));
      if (gate.type === "gate" && inputsSelected.length === 0) return false;

      switch (gate.gateType) {
        case "AND":
          return inputsSelected.every(v => v);
        case "OR":
          return inputsSelected.some(v => v);
        case "NOT":
          return inputsSelected.length > 0 ? !inputsSelected[0] : true;
        case "NAND":
          return !inputsSelected.every(v => v);
        case "NOR":
          return !inputsSelected.some(v => v);
        case "XOR":
          return inputsSelected.reduce((acc, curr) => acc !== curr, false);
        case "XNOR":
          return inputsSelected.reduce((acc, curr) => acc === curr, true);
        case "MUX": {
          const i0 = inputsSelected[0] || false;
          const i1 = inputsSelected[1] || false;
          const s = inputsSelected[2] || false;
          return s ? i1 : i0;
        }
        default:
          return false;
      }
    };

    // Override toggle states
    const inpNodes = evaluated.filter(n => n.type === "input");
    tempInputs.forEach((val, idx) => {
      if (inpNodes[idx]) {
        inpNodes[idx].value = val;
        inpNodes[idx].isToggledOn = val;
      }
    });

    for (let pass = 0; pass < maxIterations; pass++) {
      let isStable = true;
      for (let i = 0; i < evaluated.length; i++) {
        const node = evaluated[i];
        if (node.type === "input") {
          node.value = !!node.isToggledOn;
        } else if (node.type === "gate") {
          const newVal = computeValue(node);
          if (node.value !== newVal) {
            node.value = newVal;
            isStable = false;
          }
        } else if (node.type === "output") {
          const incoming = node.inputs.length > 0 ? getNodeVal(node.inputs[0]) : false;
          if (node.value !== incoming) {
            node.value = incoming;
            isStable = false;
          }
        }
      }
      if (isStable) break;
    }
    return evaluated;
  };

  const checkCircuitCorrectness = (nodesList: LogicNode[]): boolean => {
    const template = DLD_TEMPLATES[selectedTemplateId];
    if (!template) return false;

    try {
      for (const row of template.truthTableRows) {
        const evaluated = evaluateCircuitForTest(nodesList, row.inputs);
        const boardOutputs = evaluated.filter(n => n.type === "output" || n.type === "seven_seg");
        
        if (boardOutputs.length < row.outputs.length) return false;

        const rowMatches = row.outputs.every((expectedValue, outIdx) => {
          const outNode = boardOutputs[outIdx];
          if (!outNode) return false;
          if (expectedValue === undefined) return true;
          return !!outNode.value === expectedValue;
        });

        if (!rowMatches) return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  // Evaluate logic system states with iteration
  const evaluateCircuit = (nodesList: LogicNode[]): LogicNode[] => {
    const evaluated = nodesList.map(n => ({ ...n }));
    const maxIterations = 8;

    const getNodeVal = (id: string): boolean => {
      const node = evaluated.find(n => n.id === id);
      return node ? !!node.value : false;
    };

    const computeValue = (gate: LogicNode): boolean => {
      if (gate.type === "clock") {
        // Evaluate frequency ticks based on masterTime cycles
        const freq = gate.clockFreq || 1;
        // freq settings: 0.5Hz, 1Hz, 2Hz, 5Hz
        const periodTicks = Math.round(10 / freq); // e.g. for 1Hz -> 10 ticks (2s cycle @ 200ms)
        const halfPeriod = periodTicks / 2;
        return (masterTime % periodTicks) < halfPeriod;
      }

      const inputsSelected = gate.inputs.map(id => getNodeVal(id));
      if (gate.type === "gate" && inputsSelected.length === 0) return false;

      switch (gate.gateType) {
        case "AND":
          return inputsSelected.every(v => v);
        case "OR":
          return inputsSelected.some(v => v);
        case "NOT":
          return inputsSelected.length > 0 ? !inputsSelected[0] : true;
        case "NAND":
          return !inputsSelected.every(v => v);
        case "NOR":
          return !inputsSelected.some(v => v);
        case "XOR":
          return inputsSelected.reduce((acc, curr) => acc !== curr, false);
        case "XNOR":
          return inputsSelected.reduce((acc, curr) => acc === curr, true);
        case "MUX": {
          // MUX: expects [I0, I1, S]
          const i0 = inputsSelected[0] || false;
          const i1 = inputsSelected[1] || false;
          const s = inputsSelected[2] || false;
          return s ? i1 : i0;
        }
        default:
          return false;
      }
    };

    for (let pass = 0; pass < maxIterations; pass++) {
      let isMemoryStable = true;
      
      for (let i = 0; i < evaluated.length; i++) {
        const node = evaluated[i];
        
        if (node.type === "input") {
          node.value = !!node.isToggledOn;
        } else if (node.type === "clock") {
          node.value = computeValue(node);
        } else if (node.type === "gate" && (node.gateType === "DFF" || node.gateType === "TFF" || node.gateType === "JKFF")) {
          const clkNodeId = node.inputs[0];
          const clkVal = clkNodeId ? getNodeVal(clkNodeId) : false;
          const prevClkVal = !!node.prevClockValue;
          let qVal = node.value !== undefined ? !!node.value : false;
          
          if (clkVal && !prevClkVal) {
            if (node.gateType === "DFF") {
              const dNodeId = node.inputs[1];
              qVal = dNodeId ? getNodeVal(dNodeId) : false;
            } else if (node.gateType === "TFF") {
              const tNodeId = node.inputs[1];
              const tVal = tNodeId ? getNodeVal(tNodeId) : false;
              if (tVal) {
                qVal = !qVal;
              }
            } else if (node.gateType === "JKFF") {
              const jNodeId = node.inputs[1];
              const kNodeId = node.inputs[2];
              const jVal = jNodeId ? getNodeVal(jNodeId) : false;
              const kVal = kNodeId ? getNodeVal(kNodeId) : false;
              if (jVal && !kVal) {
                qVal = true;
              } else if (!jVal && kVal) {
                qVal = false;
              } else if (jVal && kVal) {
                qVal = !qVal;
              }
            }
          }
          node.prevClockValue = clkVal;
          if (node.value !== qVal) {
            node.value = qVal;
            isMemoryStable = false;
          }
        } else if (node.type === "gate") {
          const newVal = computeValue(node);
          if (node.value !== newVal) {
            node.value = newVal;
            isMemoryStable = false;
          }
        } else if (node.type === "output") {
          const incomingVal = node.inputs.length > 0 ? getNodeVal(node.inputs[0]) : false;
          if (node.value !== incomingVal) {
            node.value = incomingVal;
            isMemoryStable = false;
          }
        } else if (node.type === "seven_seg") {
          // 7-segment display aggregates up to 4 input values as a nibble
          const bit0 = node.inputs[0] ? getNodeVal(node.inputs[0]) : false;
          const bit1 = node.inputs[1] ? getNodeVal(node.inputs[1]) : false;
          const bit2 = node.inputs[2] ? getNodeVal(node.inputs[2]) : false;
          const bit3 = node.inputs[3] ? getNodeVal(node.inputs[3]) : false;
          
          let val = 0;
          if (bit0) val += 1;
          if (bit1) val += 2;
          if (bit2) val += 4;
          if (bit3) val += 8;
          node.value = val > 0; // value stores high logic trigger, actual decoding processed during render
        }
      }
      
      if (isMemoryStable) break;
    }

    return evaluated;
  };

  // Generate a dynamic truth table for custom layouts or modified layouts
  const customTruthTable = useMemo(() => {
    const inputNodes = nodes.filter(n => n.type === "input");
    const outputNodes = nodes.filter(n => n.type === "output");

    if (inputNodes.length === 0 || outputNodes.length === 0) {
      return null;
    }

    // Sort by id or name so position doesn't randomly shuffle columns
    const sortedInputs = [...inputNodes].sort((a, b) => a.id.localeCompare(b.id));
    const sortedOutputs = [...outputNodes].sort((a, b) => a.id.localeCompare(b.id));

    // Cap at 4 inputs to keep UI clean and performance pristine (2^4 = 16 combinations)
    const activeInputs = sortedInputs.slice(0, 4);
    const numInputs = activeInputs.length;
    const numRows = Math.pow(2, numInputs);

    const headers = [
      ...activeInputs.map(n => n.name.replace("Input ", "").replace("Switch ", "").trim()),
      ...sortedOutputs.map(n => n.name.replace("LED ", "").replace("Output ", "").trim())
    ];

    const rows = [];
    const currentBoardInputValues = activeInputs.map(n => !!n.value);

    for (let i = 0; i < numRows; i++) {
      const rowInputs: boolean[] = [];
      for (let j = numInputs - 1; j >= 0; j--) {
        rowInputs.push(((i >> j) & 1) === 1);
      }

      // Evaluate the circuit for this row's inputs
      const evaluated = evaluateCircuitForTest(nodes, rowInputs);

      // Extract outputs
      const rowOutputs = sortedOutputs.map(outNode => {
        const found = evaluated.find(n => n.id === outNode.id);
        return found ? !!found.value : false;
      });

      // Check if this row is currently active on board
      const isCurrent = rowInputs.every((val, idx) => val === currentBoardInputValues[idx]);

      rows.push({
        inputs: rowInputs,
        outputs: rowOutputs,
        isCurrent
      });
    }

    return {
      headers,
      rows,
      inputs: activeInputs,
      outputs: sortedOutputs
    };
  }, [nodes]);

  const derivations = useMemo(() => {
    if (!customTruthTable) return null;

    const { inputs, outputs, rows } = customTruthTable;
    
    return outputs.map((outNode, outIdx) => {
      // Find rows where this output is true
      const trueRows = rows.filter(r => r.outputs[outIdx]);

      // SOP Canonical terms
      const sopTerms = trueRows.map(r => {
        return r.inputs.map((val, inIdx) => {
          const inName = inputs[inIdx].name.replace("Input ", "").replace("Switch ", "").trim();
          return val ? inName : `${inName}'`;
        }).join("•");
      });

      const sopExpression = sopTerms.length > 0 
        ? sopTerms.join(" + ") 
        : "0";

      // Simple heuristic for algebraic derivation or description
      let derivationSteps: string[] = [];
      let simplifiedExpression = sopExpression;

      if (sopExpression === "0") {
        derivationSteps.push("Output is inactive (always 0) for all input configurations.");
      } else if (sopTerms.length === rows.length) {
        simplifiedExpression = "1";
        derivationSteps.push("Output is active (always 1) for all input configurations.");
      } else {
        derivationSteps.push(`1. Minterm extraction: Identify rows where output is High (1).`);
        derivationSteps.push(`2. Form canonical Sum-of-Products (SOP):`);
        derivationSteps.push(`   Y = ${sopExpression}`);
        
        // Let's add basic algebraic simplifications
        if (sopTerms.length === 2 && inputs.length === 2) {
          const term1 = sopTerms[0];
          const term2 = sopTerms[1];
          // e.g. A'•B + A•B' => A ⊕ B
          const isXor = (term1.includes("'") && !term2.includes("'")) || (!term1.includes("'") && term2.includes("'"));
          if (isXor) {
            simplifiedExpression = `${inputs[0].name.replace("Input ", "").trim()} ⊕ ${inputs[1].name.replace("Input ", "").trim()}`;
            derivationSteps.push(`3. Apply XOR Parity identity rule (A'•B + A•B' = A ⊕ B):`);
            derivationSteps.push(`   Result: Y = ${simplifiedExpression}`);
          }
        } else if (sopTerms.length === 3 && inputs.length === 2) {
          // e.g. A'•B + A•B' + A•B => A + B
          simplifiedExpression = `${inputs[0].name.replace("Input ", "").trim()} + ${inputs[1].name.replace("Input ", "").trim()}`;
          derivationSteps.push(`3. Group adjacent minterms using Idempotent & Distributive laws:`);
          derivationSteps.push(`   A'•B + A•B' + A•B = B•(A' + A) + A•B' = B + A•B' = A + B`);
          derivationSteps.push(`   Result: Y = ${simplifiedExpression}`);
        } else if (sopTerms.length === 1 && inputs.length === 2) {
          derivationSteps.push(`3. Singular minterm represents base gate AND expression:`);
          derivationSteps.push(`   Result: Y = ${simplifiedExpression}`);
        } else {
          derivationSteps.push(`3. Apply consensus and adjacency theorem matching to simplify terms.`);
          derivationSteps.push(`   Simplification outcome aligns to Boolean logic rules.`);
        }
      }

      return {
        outputName: outNode.name.replace("LED ", "").replace("Output ", "").trim(),
        sop: sopExpression,
        simplified: simplifiedExpression,
        steps: derivationSteps
      };
    });
  }, [customTruthTable]);

  const renderKMap = (outIdx: number) => {
    if (!customTruthTable) return null;
    const { inputs, rows } = customTruthTable;

    if (inputs.length === 2) {
      const in0 = inputs[0].name.replace("Input ", "").replace("Switch ", "").trim();
      const in1 = inputs[1].name.replace("Input ", "").replace("Switch ", "").trim();

      const getVal = (a: boolean, b: boolean) => {
        const idx = (a ? 2 : 0) + (b ? 1 : 0);
        return rows[idx]?.outputs[outIdx] ? "1" : "0";
      };

      return (
        <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5 space-y-2 mt-2">
          <div className="flex justify-between items-center text-[8.5px] font-mono text-cyan-400 font-bold uppercase">
            <span>🗺️ Karnaugh Map ({in0} \\ {in1})</span>
            <span className="text-[7.5px] text-slate-500">2-Variable Grid</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] max-w-[150px] mx-auto py-1">
            <div className="text-slate-500 text-[8px] flex items-center justify-center font-bold">{in0} \\ {in1}</div>
            <div className="text-slate-300 font-bold bg-slate-900/60 py-0.5 rounded border border-white/5">{in1}&apos; (0)</div>
            <div className="text-slate-300 font-bold bg-slate-900/60 py-0.5 rounded border border-white/5">{in1} (1)</div>

            <div className="text-slate-300 font-bold bg-slate-900/60 flex items-center justify-center rounded border border-white/5">{in0}&apos; (0)</div>
            <div className={`p-1.5 rounded font-extrabold ${getVal(false, false) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]" : "bg-slate-900 text-slate-600"}`}>
              {getVal(false, false)}
            </div>
            <div className={`p-1.5 rounded font-extrabold ${getVal(false, true) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]" : "bg-slate-900 text-slate-600"}`}>
              {getVal(false, true)}
            </div>

            <div className="text-slate-300 font-bold bg-slate-900/60 flex items-center justify-center rounded border border-white/5">{in0} (1)</div>
            <div className={`p-1.5 rounded font-extrabold ${getVal(true, false) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]" : "bg-slate-900 text-slate-600"}`}>
              {getVal(true, false)}
            </div>
            <div className={`p-1.5 rounded font-extrabold ${getVal(true, true) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]" : "bg-slate-900 text-slate-600"}`}>
              {getVal(true, true)}
            </div>
          </div>
        </div>
      );
    }

    if (inputs.length === 3) {
      const in0 = inputs[0].name.replace("Input ", "").replace("Switch ", "").trim();
      const in1 = inputs[1].name.replace("Input ", "").replace("Switch ", "").trim();
      const in2 = inputs[2].name.replace("Input ", "").replace("Switch ", "").trim();

      const getVal3 = (a: boolean, b: boolean, c: boolean) => {
        const idx = (a ? 4 : 0) + (b ? 2 : 0) + (c ? 1 : 0);
        return rows[idx]?.outputs[outIdx] ? "1" : "0";
      };

      return (
        <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5 space-y-2 mt-2">
          <div className="flex justify-between items-center text-[8.5px] font-mono text-cyan-400 font-bold uppercase">
            <span>🗺️ Karnaugh Map ({in0} \\ {in1}{in2})</span>
            <span className="text-[7.5px] text-slate-500">3-Variable Gray Grid</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px] max-w-[280px] mx-auto py-1">
            <div className="text-slate-500 text-[7.5px] flex items-center justify-center font-bold leading-tight">{in0} \\ {in1}{in2}</div>
            <div className="text-slate-300 text-[7.5px] font-bold bg-slate-900/60 py-0.5 rounded border border-white/5">00</div>
            <div className="text-slate-300 text-[7.5px] font-bold bg-slate-900/60 py-0.5 rounded border border-white/5">01</div>
            <div className="text-slate-300 text-[7.5px] font-bold bg-slate-900/60 py-0.5 rounded border border-white/5">11</div>
            <div className="text-slate-300 text-[7.5px] font-bold bg-slate-900/60 py-0.5 rounded border border-white/5">10</div>

            <div className="text-slate-300 font-bold bg-slate-900/60 flex items-center justify-center rounded border border-white/5 text-[8.5px]">{in0}&apos; (0)</div>
            <div className={`p-1.5 rounded font-extrabold ${getVal3(false, false, false) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-600"}`}>
              {getVal3(false, false, false)}
            </div>
            <div className={`p-1.5 rounded font-extrabold ${getVal3(false, false, true) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-600"}`}>
              {getVal3(false, false, true)}
            </div>
            <div className={`p-1.5 rounded font-extrabold ${getVal3(false, true, true) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-600"}`}>
              {getVal3(false, true, true)}
            </div>
            <div className={`p-1.5 rounded font-extrabold ${getVal3(false, true, false) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-600"}`}>
              {getVal3(false, true, false)}
            </div>

            <div className="text-slate-300 font-bold bg-slate-900/60 flex items-center justify-center rounded border border-white/5 text-[8.5px]">{in0} (1)</div>
            <div className={`p-1.5 rounded font-extrabold ${getVal3(true, false, false) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-600"}`}>
              {getVal3(true, false, false)}
            </div>
            <div className={`p-1.5 rounded font-extrabold ${getVal3(true, false, true) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-600"}`}>
              {getVal3(true, false, true)}
            </div>
            <div className={`p-1.5 rounded font-extrabold ${getVal3(true, true, true) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-600"}`}>
              {getVal3(true, true, true)}
            </div>
            <div className={`p-1.5 rounded font-extrabold ${getVal3(true, true, false) === "1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-600"}`}>
              {getVal3(true, true, false)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-[9px] text-slate-500 italic text-center p-2.5 bg-slate-950/40 rounded border border-white/5 leading-relaxed font-sans">
        Karnaugh map visualizer automatically activates when you have exactly <strong className="text-cyan-400 font-mono">2 or 3 inputs</strong> and at least one output LED wired.
      </div>
    );
  };

  const calculatedNodes = evaluateCircuit(nodes);
  const isCircuitVerified = checkCircuitCorrectness(nodes);

  // Initialize and reset signal history when active selection changes
  useEffect(() => {
    if (selectedNodeId) {
      const node = calculatedNodes.find(n => n.id === selectedNodeId);
      const val = node?.value ? 1 : 0;
      setSignalHistory([val]);
    } else {
      setSignalHistory([]);
    }
  }, [selectedNodeId]);

  // Appends signal value over clock timer iterations
  useEffect(() => {
    if (selectedNodeId) {
      const node = calculatedNodes.find(n => n.id === selectedNodeId);
      const val = node?.value ? 1 : 0;
      setSignalHistory(prev => {
        const next = [...prev, val];
        if (next.length > 30) next.shift();
        return next;
      });
    }
  }, [masterTime]);

  // Toggle switch value manually
  const handleToggleInput = (id: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id && n.type === "input") {
        return { ...n, isToggledOn: !n.isToggledOn };
      }
      return n;
    }));
  };

  // Pulse animation thread
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setWirePulsePhase(prev => (prev + 0.12) % (Math.PI * 4));
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Snapped coordinates calculation
  const setNodePosition = (id: string, xPct: number, yPct: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x: xPct, y: yPct } : n));
  };

  // Canvas drawing wire connection paths
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = containerRef.current?.offsetWidth || 600;
    const height = containerRef.current?.offsetHeight || 420;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Apply zoom and pan translate / scale transformations!
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Extended grid backdrop background lines for endless panning bounds
    ctx.strokeStyle = "rgba(6, 182, 212, 0.05)";
    ctx.lineWidth = 0.85 / zoom;
    const startCell = -2500;
    const endCell = 3500;
    const cellSize = 16;
    for (let x = startCell; x < endCell; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, startCell);
      ctx.lineTo(x, endCell);
      ctx.stroke();
    }
    for (let y = startCell; y < endCell; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(startCell, y);
      ctx.lineTo(endCell, y);
      ctx.stroke();
    }

    // Render persistent logical wires
    calculatedNodes.forEach(node => {
      if (!node.inputs || node.inputs.length === 0) return;

      node.inputs.forEach((inputID) => {
        const sourceNode = calculatedNodes.find(s => s.id === inputID);
        if (!sourceNode) return;

        const xStart = (sourceNode.x / 100) * width;
        const yStart = (sourceNode.y / 100) * height;
        const xEnd = (node.x / 100) * width;
        const yEnd = (node.y / 100) * height;

        const isSignalHigh = !!sourceNode.value;

        ctx.shadowBlur = isSignalHigh ? 6 : 0;
        ctx.shadowColor = isSignalHigh ? "#10b981" : "#ef4444";
        ctx.strokeStyle = isSignalHigh ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.4)";
        ctx.lineWidth = isSignalHigh ? 2.5 : 1.75;

        const midX = xStart + (xEnd - xStart) * 0.5;

        ctx.beginPath();
        if (wireStyle === "bezier") {
          ctx.moveTo(xStart, yStart);
          const xc1 = xStart + (xEnd - xStart) * 0.5;
          const yc1 = yStart;
          const xc2 = xStart + (xEnd - xStart) * 0.5;
          const yc2 = yEnd;
          ctx.bezierCurveTo(xc1, yc1, xc2, yc2, xEnd, yEnd);
        } else {
          // Manhattan (Orthogonal) routing
          ctx.moveTo(xStart, yStart);
          ctx.lineTo(midX, yStart);
          ctx.lineTo(midX, yEnd);
          ctx.lineTo(xEnd, yEnd);
        }
        ctx.stroke();

        // Scrolling high current pulse electrons
        if (isSignalHigh) {
          ctx.beginPath();
          const tFactor = (wirePulsePhase * 2.5) % 100;
          const pct = tFactor / 100;
          
          let px = xStart, py = yStart;
          
          if (wireStyle === "bezier") {
            const xc1 = xStart + (xEnd - xStart) * 0.5;
            const yc1 = yStart;
            const xc2 = xStart + (xEnd - xStart) * 0.5;
            const yc2 = yEnd;
            px = (1 - pct) * (1 - pct) * (1 - pct) * xStart + 
                 3 * (1 - pct) * (1 - pct) * pct * xc1 + 
                 3 * (1 - pct) * pct * pct * xc2 + 
                 pct * pct * pct * xEnd;
                         
            py = (1 - pct) * (1 - pct) * (1 - pct) * yStart + 
                 3 * (1 - pct) * (1 - pct) * pct * yc1 + 
                 3 * (1 - pct) * pct * pct * yc2 + 
                 pct * pct * pct * yEnd;
          } else {
            // Orthogonal path segments
            if (pct < 0.33) {
              const t = pct / 0.33;
              px = xStart + (midX - xStart) * t;
              py = yStart;
            } else if (pct < 0.66) {
              const t = (pct - 0.33) / 0.33;
              px = midX;
              py = yStart + (yEnd - yStart) * t;
            } else {
              const t = (pct - 0.66) / 0.34;
              px = midX + (xEnd - midX) * t;
              py = yEnd;
            }
          }

          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#10b981";
          ctx.fill();
        }
      });
    });

    // Draw temporary manual wiring guideline inside transformed space
    if (connectingFromId && mousePos) {
      const sourceNode = calculatedNodes.find(s => s.id === connectingFromId);
      if (sourceNode) {
        const xStart = (sourceNode.x / 100) * width;
        const yStart = (sourceNode.y / 100) * height;
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        if (wireStyle === "bezier") {
          ctx.bezierCurveTo(
            xStart + (mousePos.x - xStart) * 0.5, yStart,
            xStart + (mousePos.x - xStart) * 0.5, mousePos.y,
            mousePos.x, mousePos.y
          );
        } else {
          const midX = xStart + (mousePos.x - xStart) * 0.5;
          ctx.lineTo(midX, yStart);
          ctx.lineTo(midX, mousePos.y);
          ctx.lineTo(mousePos.x, mousePos.y);
        }
        ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([5, 3]);
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#f59e0b";
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }, [calculatedNodes, wirePulsePhase, connectingFromId, mousePos, wireStyle, zoom, pan]);

  // Selected gate metadata
  const activeGate = selectedNodeId ? calculatedNodes.find(n => n.id === selectedNodeId) : null;

  // Add Components
  const addSeqFlipFlop = (type: "DFF" | "TFF" | "JKFF") => {
    const id = `FF_${customCounter}`;
    setCustomCounter(prev => prev + 1);
    const newNode: LogicNode = {
      id,
      type: "gate",
      name: `${type}_${id}`,
      gateType: type,
      x: 35 + (customCounter % 5) * 8,
      y: 35 + (customCounter % 4) * 10,
      inputs: [],
      value: false,
      maxInputs: type === "JKFF" ? 3 : 2
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const addPushButton = () => {
    const id = `Push_${customCounter}`;
    setCustomCounter(prev => prev + 1);
    const newNode: LogicNode = {
      id,
      type: "input",
      name: `Push_${id}`,
      x: 12,
      y: 30 + (customCounter % 5) * 10,
      inputs: [],
      isToggledOn: false,
      isPushButton: true,
      value: false
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const addCustomGate = (type: "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR" | "MUX" | "DFF" | "TFF" | "JKFF") => {
    const id = `G${customCounter}`;
    setCustomCounter(prev => prev + 1);
    const maxInputs = type === "NOT" ? 1 : type === "JKFF" ? 3 : 2;
    const newNode: LogicNode = {
      id,
      type: "gate",
      name: `${type}_${id}`,
      gateType: type as any,
      x: 35 + (customCounter % 5) * 8,
      y: 35 + (customCounter % 4) * 10,
      inputs: [],
      value: false,
      maxInputs
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const addCustomInput = () => {
    const id = `In_${customCounter}`;
    setCustomCounter(prev => prev + 1);
    const newNode: LogicNode = {
      id,
      type: "input",
      name: `Sw_${id}`,
      x: 12,
      y: 30 + (customCounter % 5) * 10,
      inputs: [],
      isToggledOn: false,
      value: false
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const addClockInput = () => {
    const id = `Clock_${customCounter}`;
    setCustomCounter(prev => prev + 1);
    const newNode: LogicNode = {
      id,
      type: "clock",
      name: `Clock_${id}`,
      x: 12,
      y: 30 + (customCounter % 5) * 10,
      inputs: [],
      value: false
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const addCustomOutput = () => {
    const id = `Out_Y${customCounter}`;
    setCustomCounter(prev => prev + 1);
    const newNode: LogicNode = {
      id,
      type: "output",
      name: `Led_${id}`,
      x: 85,
      y: 35 + (customCounter % 4) * 10,
      inputs: [],
      value: false
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const addSevenSegOutput = () => {
    const id = `Seg_${customCounter}`;
    setCustomCounter(prev => prev + 1);
    const newNode: LogicNode = {
      id,
      type: "seven_seg",
      name: `Seg_${id}`,
      x: 82,
      y: 40,
      inputs: [],
      value: false
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  // Manage wire linkages
  const connectNodes = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    // Check loopback restrictions
    let isLoop = false;
    const checkTrace = (currentId: string) => {
      const parent = nodes.find(n => n.id === currentId);
      if (!parent) return;
      if (parent.inputs.includes(toId)) {
        isLoop = true;
        return;
      }
      parent.inputs.forEach(pId => checkTrace(pId));
    };
    checkTrace(fromId);
    if (isLoop) {
      alert("⚠️ Loop feedback warning: sequential feedback loop detected. SR memory locks are active!");
    }

    setNodes(prev => prev.map(node => {
      if (node.id === toId) {
        if (node.inputs.includes(fromId)) return node;
        
        // Output and normal logic gate limitation caps
        const inputLimit = node.gateType === "NOT" ? 1 : node.gateType === "MUX" ? 3 : node.type === "seven_seg" ? 4 : 8;
        if (node.inputs.length >= inputLimit) {
          alert(`⚠️ Input threshold exceeded! This element supports up to ${inputLimit} inputs max.`);
          return node;
        }

        return {
          ...node,
          inputs: [...node.inputs, fromId]
        };
      }
      return node;
    }));
  };

  const removeInputConnection = (targetNodeId: string, sourceInputId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === targetNodeId) {
        return {
          ...n,
          inputs: n.inputs.filter(inp => inp !== sourceInputId)
        };
      }
      return n;
    }));
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev
      .filter(n => n.id !== id)
      .map(n => ({
        ...n,
        inputs: n.inputs.filter(inp => inp !== id)
      }))
    );
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (connectingFromId === id) setConnectingFromId(null);
  };

  // Duplicate Selected Node logic (Cloning support like CircuitVerse)
  const duplicateSelectedNode = (nodeToClone: LogicNode) => {
    const id = `C_${customCounter}_${Math.random().toString(36).substring(2, 5)}`;
    setCustomCounter(prev => prev + 1);

    const clone: LogicNode = {
      ...JSON.parse(JSON.stringify(nodeToClone)),
      id,
      name: `${nodeToClone.gateType || "Clone"}_${id}`,
      x: Math.min(nodeToClone.x + 5, 95),
      y: Math.min(nodeToClone.y + 5, 95),
      inputs: [] // Reset wires on duplicated gate
    };

    setNodes(prev => [...prev, clone]);
    setSelectedNodeId(id);
  };

  // Listen to keyboard Backspace, Delete, Ctrl+C, Ctrl+V commands
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      // Delete commands
      if (selectedNodeId && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        deleteNode(selectedNodeId);
      }

      // Copy & Paste commands
      if (selectedNodeId) {
        const targetNode = nodes.find(n => n.id === selectedNodeId);
        if (targetNode) {
          if ((e.ctrlKey || e.metaKey) && e.key === "c") {
            e.preventDefault();
            setCopiedNode(targetNode);
          }
        }
      }

      if (copiedNode && (e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        duplicateSelectedNode(copiedNode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, nodes, copiedNode]);

  // Drag and drop event translators for Sidebar components
  const handleDragStart = (e: React.DragEvent, type: string, subType?: string) => {
    e.dataTransfer.setData("application/dld-type", type);
    if (subType) {
      e.dataTransfer.setData("application/dld-subtype", subType);
    }
  };

  const handleDropComponent = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const workspaceX = (rawX - pan.x) / zoom;
    const workspaceY = (rawY - pan.y) / zoom;

    const type = e.dataTransfer.getData("application/dld-type");
    const subType = e.dataTransfer.getData("application/dld-subtype");

    if (!type) return;

    // Grid snapping logic
    const snapDist = 12;
    const xSnap = Math.round(workspaceX / snapDist) * snapDist;
    const ySnap = Math.round(workspaceY / snapDist) * snapDist;

    const pctX = Math.min(Math.max((xSnap / rect.width) * 100, -100), 250);
    const pctY = Math.min(Math.max((ySnap / rect.height) * 100, -100), 250);

    const id = `C_${customCounter}_${Math.random().toString(36).substring(2, 5)}`;
    setCustomCounter(prev => prev + 1);

    let newNode: LogicNode;
    if (type === "gate" && (subType === "DFF" || subType === "TFF" || subType === "JKFF")) {
      newNode = {
        id,
        type: "gate",
        name: `${subType}_${id}`,
        gateType: subType as any,
        x: pctX,
        y: pctY,
        inputs: [],
        value: false,
        maxInputs: subType === "JKFF" ? 3 : 2,
        ledColor: "#10b981"
      };
    } else if (type === "gate") {
      newNode = {
        id,
        type: "gate",
        name: `${subType}_${id}`,
        gateType: subType as any,
        x: pctX,
        y: pctY,
        inputs: [],
        value: false,
        maxInputs: subType === "NOT" ? 1 : 2,
        ledColor: "#10b981"
      };
    } else if (type === "input") {
      const isPush = subType === "push";
      newNode = {
        id,
        type: "input",
        name: isPush ? `Push_${id}` : `Sw_${id}`,
        x: pctX,
        y: pctY,
        inputs: [],
        isToggledOn: false,
        isPushButton: isPush,
        value: false,
        ledColor: isPush ? "#ef4444" : "#10b981"
      };
    } else if (type === "clock") {
      newNode = {
        id,
        type: "clock",
        name: `Clock_${id}`,
        x: pctX,
        y: pctY,
        inputs: [],
        value: false,
        clockFreq: 1,
        ledColor: "#10b981"
      };
    } else if (type === "output") {
      newNode = {
        id,
        type: "output",
        name: `Led_${id}`,
        x: pctX,
        y: pctY,
        inputs: [],
        value: false,
        ledColor: "#10b981"
      };
    } else if (type === "seven_seg") {
      newNode = {
        id,
        type: "seven_seg",
        name: `Seg_${id}`,
        x: pctX,
        y: pctY,
        inputs: [],
        value: false,
        ledColor: "#10b981"
      };
    } else {
      return;
    }

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleClearSandbox = () => {
    setNodes([]);
    setSelectedNodeId(null);
    setConnectingFromId(null);
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    // If clicking on background (e.g. self-container or canvas backdrop)
    const targetEl = e.target as HTMLElement;
    const isTargetBackground = targetEl === containerRef.current || targetEl.tagName === "CANVAS" || targetEl.classList.contains("grid-backdrop");
    if (isTargetBackground) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  // Mouse drag handles snap coordinates onto 10px spacing grid offsets
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const workspaceX = (rawX - pan.x) / zoom;
    const workspaceY = (rawY - pan.y) / zoom;

    if (draggedNodeId) {
      // Snapping offsets inside sandbox grid values
      const snapDist = 12;
      const xSnap = Math.round(workspaceX / snapDist) * snapDist;
      const ySnap = Math.round(workspaceY / snapDist) * snapDist;

      const pctX = Math.min(Math.max((xSnap / rect.width) * 100, -200), 300);
      const pctY = Math.min(Math.max((ySnap / rect.height) * 100, -200), 300);
      setNodePosition(draggedNodeId, pctX, pctY);
    }

    if (connectingFromId) {
      setMousePos({ x: workspaceX, y: workspaceY });
    }
  };

  const handleContainerMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  // Initiate custom interactive wire terminal clicks
  const handleTerminalClick = (e: React.MouseEvent, nodeId: string, pinType: "in" | "out") => {
    e.stopPropagation();
    if (pinType === "out") {
      setConnectingFromId(nodeId);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        setMousePos({
          x: (rawX - pan.x) / zoom,
          y: (rawY - pan.y) / zoom
        });
      }
    } else {
      if (connectingFromId) {
        connectNodes(connectingFromId, nodeId);
        setConnectingFromId(null);
        setMousePos(null);
      }
    }
  };

  // Decoders logic mapping for hexadecimal 7 Segment glowing displays
  const getSevenSegGlows = (node: LogicNode) => {
    const getNodeVal = (id: string): boolean => {
      const n = calculatedNodes.find(item => item.id === id);
      return n ? !!n.value : false;
    };

    const b0 = node.inputs[0] ? getNodeVal(node.inputs[0]) : false;
    const b1 = node.inputs[1] ? getNodeVal(node.inputs[1]) : false;
    const b2 = node.inputs[2] ? getNodeVal(node.inputs[2]) : false;
    const b3 = node.inputs[3] ? getNodeVal(node.inputs[3]) : false;

    let hex = 0;
    if (b0) hex += 1;
    if (b1) hex += 2;
    if (b2) hex += 4;
    if (b3) hex += 8;

    // segment mapping for segments a-g
    const mapping: Record<number, Record<string, boolean>> = {
      0: { a: true, b: true, c: true, d: true, e: true, f: true, g: false },
      1: { a: false, b: true, c: true, d: false, e: false, f: false, g: false },
      2: { a: true, b: true, c: false, d: true, e: true, f: false, g: true },
      3: { a: true, b: true, c: true, d: true, e: false, f: false, g: true },
      4: { a: false, b: true, c: true, d: false, e: false, f: true, g: true },
      5: { a: true, b: false, c: true, d: true, e: false, f: true, g: true },
      6: { a: true, b: false, c: true, d: true, e: true, f: true, g: true },
      7: { a: true, b: true, c: true, d: false, e: false, f: false, g: false },
      8: { a: true, b: true, c: true, d: true, e: true, f: true, g: true },
      9: { a: true, b: true, c: true, d: true, e: false, f: true, g: true },
      10: { a: true, b: true, c: true, d: false, e: true, f: true, g: true }, // A
      11: { a: false, b: false, c: true, d: true, e: true, f: true, g: true }, // b
      12: { a: true, b: false, c: false, d: true, e: true, f: true, g: false }, // C
      13: { a: false, b: true, c: true, d: true, e: true, f: false, g: true }, // d
      14: { a: true, b: false, c: false, d: true, e: true, f: true, g: true }, // E
      15: { a: true, b: false, c: false, d: false, e: true, f: true, g: true }  // F
    };

    return { val: hex.toString(16).toUpperCase(), segs: mapping[hex] || mapping[0] };
  };

  const filteredGates = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR", "MUX", "DFF", "TFF", "JKFF"].filter(g =>
    g.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredGenerators = [
    { name: "Toggle Switch", type: "input", action: addCustomInput, color: "text-emerald-400" },
    { name: "Push Button", type: "input", subtype: "push", action: addPushButton, color: "text-rose-455" },
    { name: "1Hz Clock", type: "clock", action: addClockInput, color: "text-amber-400" },
    { name: "LED Probe", type: "output", action: addCustomOutput, color: "text-rose-400" },
    { name: "7-Seg Panel", type: "seven_seg", action: addSevenSegOutput, color: "text-purple-400" }
  ].filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeTemplate = DLD_TEMPLATES[selectedTemplateId];

  return (
    <div id="dld_simulator_lab_root" className="w-full h-full flex flex-col xl:flex-row bg-slate-950 border border-white/10 rounded-xl overflow-hidden font-sans text-slate-100 pointer-events-auto shadow-2xl relative select-none">
      
      {/* LEFT SECTION: HIGH-FIDELITY TOOLBAR ITEMS */}
      <div id="dld_left_panel" className="w-full xl:w-76 border-b xl:border-b-0 xl:border-r border-white/10 bg-slate-900/60 p-4 shrink-0 flex flex-col justify-between overflow-y-auto max-h-[80vh] xl:max-h-none scrollbar-thin">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/10">
            <Cpu className="text-cyan-400 w-5 h-5 animate-pulse" />
            <div>
              <h3 className="text-xs font-bold tracking-wider font-mono text-cyan-300 uppercase">CircuitVerse Simulator</h3>
              <p className="text-[10px] text-slate-400">Drag items or click to add on canvas</p>
            </div>
          </div>

          {/* Preset Circuits selectors */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold font-mono text-purple-400 uppercase tracking-widest block">Preset Lab Lessons</span>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.values(DLD_TEMPLATES).map((temp) => (
                <button
                  key={temp.id}
                  onClick={() => setSelectedTemplateId(temp.id)}
                  className={`w-full text-left px-3 py-2 text-[11px] font-mono rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    selectedTemplateId === temp.id
                      ? "bg-slate-800/80 border-cyan-500/80 text-white shadow-md shadow-cyan-950/60 font-semibold"
                      : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:border-slate-800"
                  }`}
                >
                  <span className="truncate">{temp.name}</span>
                  {selectedTemplateId === temp.id && <span className="text-[8px] px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/20 rounded animate-pulse">ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Custom MAHR AI Logic Design Order & Classroom Teacher */}
          <div className="space-y-2 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold font-mono text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={11} className="text-purple-400" />
                Ask MAHR to Auto-Build
              </span>
              {isAiGenerating && (
                <span className="text-[8px] font-mono text-purple-300 flex items-center gap-1 animate-pulse">
                  <Loader2 size={9} className="animate-spin text-purple-400" /> Synthesizing...
                </span>
              )}
            </div>
            <div className="space-y-1.5 bg-slate-950/40 p-2 rounded-lg border border-purple-500/20 shadow-inner">
              <textarea
                value={aiPromptVal}
                onChange={(e) => setAiPromptVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAiBuild();
                  }
                }}
                placeholder="e.g. 'Build a 4-bit Ripple Adder', 'SR Latch', 'JK Flip-Flop counter', '2:1 MUX'..."
                className="w-full h-12 bg-slate-950 text-[10px] font-mono text-slate-200 placeholder-slate-600 p-1.5 border border-white/10 rounded-md focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 outline-none resize-none leading-relaxed transition-all"
              />
              <button
                onClick={() => handleAiBuild()}
                disabled={isAiGenerating || !aiPromptVal.trim()}
                className="w-full py-1.5 text-[9px] font-mono tracking-widest uppercase font-bold bg-gradient-to-r from-purple-600/60 to-indigo-600/60 hover:from-purple-600/80 hover:to-indigo-600/80 border border-purple-400/30 disabled:opacity-50 text-purple-100 rounded cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 size={10} className="animate-spin text-purple-300" />
                    <span>Synthesizing Circuit...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={10} className="text-purple-300" />
                    <span>AI Generate & Teach</span>
                  </>
                )}
              </button>
              
              {aiTeachingBlock && (
                <div className="pt-2 border-t border-purple-500/20 text-[9.5px] text-purple-200 leading-normal relative space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 uppercase text-[8px] tracking-wider flex items-center gap-1">
                      🎓 Professor MAHR's Analysis:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speakExplanation(aiTeachingBlock)}
                        className="px-1.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/20 text-[8px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                        title={isSpeaking ? "Mute explanation" : "Hear voice explanation"}
                      >
                        {isSpeaking ? <VolumeX size={9} className="text-amber-400" /> : <Volume2 size={9} />}
                        <span>{isSpeaking ? "Mute" : "Listen"}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setAiTeachingBlock(null);
                          if (isSpeaking) {
                            stopAllWebSocketSpeech();
                            setIsSpeaking(false);
                          }
                        }} 
                        className="text-[9px] text-slate-500 hover:text-white px-1"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="bg-purple-950/20 p-2 rounded-md border border-purple-500/20 whitespace-pre-line text-[9.5px] leading-relaxed max-h-[140px] overflow-y-auto scrollbar-thin text-purple-100/90">
                    {aiTeachingBlock}
                  </div>

                  {suggestedExperiments.length > 0 && (
                    <div className="pt-1.5 border-t border-purple-500/10 space-y-1">
                      <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                        🧪 Suggested Experiments:
                      </span>
                      <ul className="space-y-1">
                        {suggestedExperiments.map((exp, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[8.5px] text-slate-300 leading-tight">
                            <span className="text-emerald-400 font-mono shrink-0">▸</span>
                            <span>{exp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {askTutorHandler && (
                    <button
                      onClick={() => askTutorHandler(`Explain how the digital logic circuit for "${aiPromptVal || 'this circuit'}" operates step by step.`)}
                      className="w-full mt-1 py-1 px-2 rounded bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[8.5px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>💬 Ask MAHR to Deep-Dive on Whiteboard</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Custom Circuit Addition Blocks with dynamic local Search Box */}
          <div className="space-y-2 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold font-mono text-emerald-400 uppercase tracking-widest block">Add Components</span>
              <span className="text-[8px] text-slate-500">Draggable cards</span>
            </div>

            {/* Component Search Box */}
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gates, LEDs, switches..."
                className="w-full bg-slate-950/80 text-[10px] font-mono text-slate-200 placeholder-slate-600 border border-white/10 rounded-lg pl-7 pr-2.5 py-1.5 outline-none focus:border-cyan-500 focus:text-white transition-colors"
              />
            </div>
            
            <div className="space-y-2 pt-1 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
              {filteredGates.length > 0 && (
                <>
                  <span className="text-[8px] font-mono text-slate-500 uppercase block">Logic Gates</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {filteredGates.map(g => (
                      <div
                        key={g}
                        draggable
                        onDragStart={(e) => handleDragStart(e, "gate", g)}
                        onClick={() => addCustomGate(g as any)}
                        className="px-2 py-1.5 hover:scale-[1.02] active:scale-95 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-[10px] font-mono text-cyan-400 flex items-center justify-center gap-1 cursor-grab select-none transition-all shadow-sm"
                        title="Drag onto sandbox grid, or tap to spawn"
                      >
                        <Plus size={10} className="shrink-0" /> {g}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {filteredGenerators.length > 0 && (
                <>
                  <span className="text-[8px] font-mono text-slate-500 uppercase block pt-1.5">I/O & Generators</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {filteredGenerators.map(elem => (
                      <div
                        key={elem.name}
                        draggable
                        onDragStart={(e) => handleDragStart(e, elem.type, elem.subtype || elem.name)}
                        onClick={elem.action}
                        className={`px-2 py-1.5 hover:scale-[1.02] active:scale-95 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-[10px] font-mono ${elem.color} flex items-center justify-center gap-1 cursor-grab select-none transition-all shadow-sm`}
                        title="Drag onto sandbox grid, or tap to spawn"
                      >
                        <Plus size={10} className="shrink-0" /> {elem.name}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {filteredGates.length === 0 && filteredGenerators.length === 0 && (
                <div className="text-center py-4 text-[9px] text-slate-600 font-mono">
                  No components match query
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Component Properties & Diagnostics Controller overlay */}
        <div className="pt-4 border-t border-white/5 bg-slate-950/30 p-2.5 rounded-lg space-y-2 text-[10px] font-mono mt-4">
          <span className="text-purple-400 font-bold uppercase tracking-wider block flex items-center justify-between">
            <span>⚙️ Hardware Properties</span>
            {activeGate && <span className="bg-slate-900 px-1 py-0.5 rounded text-[8px] text-cyan-300">Selected</span>}
          </span>
          {activeGate ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Device ID: <strong className="text-slate-100">{activeGate.id}</strong></span>
                <button 
                  onClick={() => deleteNode(activeGate.id)}
                  className="p-1 hover:bg-rose-950 hover:text-rose-400 rounded text-slate-500 transition-colors cursor-pointer"
                  title="Remove component (Delete/Backspace)"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Node Custom Name Label */}
              <div className="space-y-1">
                <span className="text-slate-500 block text-[8px]">Device Label Name:</span>
                <input
                  type="text"
                  value={activeGate.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes(prev => prev.map(n => n.id === activeGate.id ? { ...n, name: val } : n));
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-200 focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Gate input port customization */}
              {activeGate.type === "gate" && activeGate.gateType !== "NOT" && activeGate.gateType !== "MUX" && (
                <div className="space-y-1">
                  <span className="text-slate-500 block text-[8px]">Device Inputs Count:</span>
                  <div className="flex gap-1.5">
                    {([2, 3, 4] as const).map(inputsOption => (
                      <button
                        key={inputsOption}
                        onClick={() => {
                          setNodes(prev => prev.map(n => {
                            if (n.id === activeGate.id) {
                              return {
                                ...n,
                                maxInputs: inputsOption,
                                inputs: n.inputs.slice(0, inputsOption)
                              };
                            }
                            return n;
                          }));
                        }}
                        className={`flex-1 py-0.5 text-center text-[9px] rounded border ${
                          (activeGate.maxInputs || 2) === inputsOption
                            ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold"
                            : "bg-slate-900 border-white/5 text-slate-400"
                        }`}
                      >
                        {inputsOption} In
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clock Speed Adjuster */}
              {activeGate.type === "clock" && (
                <div className="space-y-1">
                  <span className="text-slate-500 block text-[8px]">Interval Oscillations (Hz):</span>
                  <div className="grid grid-cols-4 gap-1">
                    {([0.5, 1, 2, 5] as const).map(freqOption => (
                      <button
                        key={freqOption}
                        onClick={() => {
                          setNodes(prev => prev.map(n => n.id === activeGate.id ? { ...n, clockFreq: freqOption } : n));
                        }}
                        className={`py-0.5 text-center text-[8.5px] rounded border ${
                          (activeGate.clockFreq || 1) === freqOption
                            ? "bg-amber-950/80 border-amber-500 text-amber-300 font-bold"
                            : "bg-slate-900 border-white/5 text-slate-400"
                        }`}
                      >
                        {freqOption}Hz
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LED color customization */}
              {activeGate.type === "output" && (
                <div className="space-y-1">
                  <span className="text-slate-500 block text-[8px]">LED Glow Tone Color:</span>
                  <div className="flex gap-1.5 items-center justify-between bg-slate-900 p-1.5 rounded border border-white/5">
                    <div className="flex gap-1">
                      {([
                        { code: "#10b981", label: "Green" },
                        { code: "#22d3ee", label: "Cyan" },
                        { code: "#ef4444", label: "Red" },
                        { code: "#f59e0b", label: "Amber" },
                        { code: "#a855f7", label: "Purple" }
                      ] as const).map(col => (
                        <button
                          key={col.code}
                          onClick={() => {
                            setNodes(prev => prev.map(n => n.id === activeGate.id ? { ...n, ledColor: col.code } : n));
                          }}
                          style={{ backgroundColor: col.code }}
                          className={`w-4 h-4 rounded-full border transition-all ${
                            (activeGate.ledColor || "#10b981") === col.code
                              ? "border-white ring-1 ring-cyan-500 scale-110"
                              : "border-transparent opacity-80 hover:opacity-100"
                          }`}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Wire manager lists */}
              {activeGate.inputs.length > 0 ? (
                <div className="space-y-1 text-[9px] border-t border-white/5 pt-1.5">
                  <span className="text-slate-500 block">Wired inputs:</span>
                  <div className="space-y-1.5">
                    {activeGate.inputs.map((inpId, i) => (
                      <div key={inpId} className="flex justify-between items-center bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">
                        <span className="text-slate-400 font-mono">Terminal {i} ← feed {inpId}</span>
                        <button
                          onClick={() => removeInputConnection(activeGate.id, inpId)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          ✕ Unlink
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-[9px] text-slate-500 block">No logical inputs wired yet.</span>
              )}
            </div>
          ) : (
            <div className="text-slate-500 space-y-1">
              <span className="font-semibold text-slate-400">💡 CAD HOTKEYS CHEATS:</span>
              <p className="text-[8.5px] leading-relaxed">
                • Select elements & hit <strong className="text-cyan-400">Backspace / Del</strong> to remove them.<br/>
                • Press <strong className="text-cyan-400">Ctrl + C</strong> then <strong className="text-cyan-400">Ctrl + V</strong> on components to instantly duplicate them!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CENTER SECTION: INTERACTIVE SANDBOX CANVAS */}
      <div id="dld_center_canvas" className="flex-1 relative min-h-[350px] bg-slate-950 overflow-hidden flex flex-col justify-between">
        
        {/* Core informational top line */}
        <div className="px-5 py-2.5 border-b border-white/5 bg-slate-900/40 select-none flex flex-wrap justify-between items-center gap-2 relative z-20">
          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                title="Exit Digital Logic Lab"
              >
                <X size={12} />
                <span className="font-mono text-[9px]">Back</span>
              </button>
            )}
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">{activeTemplate?.name || "📐 Customized Logic Workspace"}</h4>
              <span className="text-[9.5px] font-mono text-slate-400 block max-w-sm lg:max-w-md truncate">{activeTemplate?.description || "Build custom arithmetic gates registers, memory dividers, clocks & counters"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-2.5 py-1 rounded bg-slate-950 border border-white/10 hover:border-slate-800 hover:bg-slate-900 text-slate-200 hover:text-white text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isRunning ? <Pause size={10} className="text-amber-400" /> : <Play size={10} className="text-emerald-400" />}
              {isRunning ? "Stop Clocks" : "Run Clocks"}
            </button>
            <span className="px-2 py-0.5 bg-slate-800 text-[9px] font-mono text-cyan-400 border border-white/10 rounded uppercase font-semibold">
              {customBooleanExpr || activeTemplate?.booleanExpression || "Interactive Sandbox Mode"}
            </span>
            <button 
              onClick={handleClearSandbox}
              className="px-2 py-1 hover:bg-slate-800 border border-white/5 rounded text-[10px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={9} /> Reset Board
            </button>
          </div>
        </div>

        {/* Quick AI Synthesis & Benchmark Presets Bar */}
        <div className="px-5 py-1.5 bg-slate-950/80 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none relative z-10">
          <span className="text-[8.5px] font-mono uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1 shrink-0">
            <Sparkles size={10} /> Quick AI Synthesis:
          </span>
          {[
            { label: "Full Adder", prompt: "Build a Full Adder with XOR, AND, and OR gates" },
            { label: "4-bit Ripple Adder", prompt: "Build a 4-bit Ripple Carry Adder network" },
            { label: "SR Latch", prompt: "Build a cross-coupled NOR SR Latch memory cell" },
            { label: "JK Flip-Flop", prompt: "Build a synchronous JK Flip-Flop with 1Hz clock" },
            { label: "2:1 Multiplexer", prompt: "Build a 2-to-1 Multiplexer (MUX) with select line" },
            { label: "Half Subtractor", prompt: "Build a Half Subtractor with Difference and Borrow" },
            { label: "NAND to OR Gate", prompt: "Build a NAND gate connected to an OR gate" }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setAiPromptVal(preset.prompt);
                handleAiBuild(preset.prompt);
              }}
              disabled={isAiGenerating}
              className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-purple-950/60 border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-purple-200 text-[8.5px] font-mono transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Sleek Floating verification toast popup (replaces full-width top banner) */}
        {isCircuitVerified && activeTemplate && !isVerifiedDismissed && (
          <div className="absolute bottom-4 right-4 z-40 max-w-sm bg-emerald-950/95 border border-emerald-500/40 backdrop-blur-xl rounded-2xl p-4 shadow-[0_10px_45px_rgba(16,185,129,0.3)] flex items-start gap-3 pointer-events-auto select-none animate-fade-in text-slate-100">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle size={18} className="text-emerald-400 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-wider">Circuit Validated!</h5>
              <p className="text-[10px] text-emerald-200/90 font-sans mt-0.5 leading-relaxed">
                Congratulations! Your circuit matches the exact truth table requirements for <strong className="text-white font-mono">{activeTemplate.name}</strong>.
              </p>
            </div>
            <button 
              onClick={() => setIsVerifiedDismissed(true)}
              className="p-1 hover:bg-white/10 text-emerald-400 hover:text-white rounded-lg transition duration-150 cursor-pointer shrink-0"
              title="Dismiss Notification"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Central interactive grid station (accepts drag drops) */}
        <div 
          ref={containerRef} 
          className="flex-1 relative w-full h-full min-h-[250px] overflow-hidden bg-[#05080f]"
          onMouseDown={handleContainerMouseDown}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropComponent}
        >
          {/* Backing canvas for wires and scrolling signals */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Endless backdrop panning indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/80 border border-white/5 py-1 px-2 rounded font-mono text-[8px] text-slate-400 select-none z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
            <span>X: {(Number(pan?.x) || 0).toFixed(0)} Y: {(Number(pan?.y) || 0).toFixed(0)} (Drag grid background to Pan / Scroll wheel to Zoom)</span>
          </div>

          {/* Floating Zoom/Pan HUD Floating Control Pad */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 border border-white/10 p-1 rounded-lg backdrop-blur shadow-lg z-30">
            <button 
              onClick={() => {
                const newZoom = Math.max((Number(zoom) || 1.0) - 0.15, 0.45);
                setZoom(newZoom);
              }}
              className="p-1 px-1.5 text-slate-450 hover:text-cyan-400 bg-slate-800 rounded hover:bg-slate-700 transition"
              title="Zoom Out (Scroll Down)"
            >
              <Minus size={10} />
            </button>
            <span className="text-[8.5px] font-mono text-cyan-400 font-bold px-1 select-none w-10 text-center">
              {((Number(zoom) || 1.0) * 100).toFixed(0)}%
            </span>
            <button 
              onClick={() => {
                const newZoom = Math.min((Number(zoom) || 1.0) + 0.15, 2.2);
                setZoom(newZoom);
              }}
              className="p-1 px-1.5 text-slate-450 hover:text-cyan-400 bg-slate-800 rounded hover:bg-slate-700 transition"
              title="Zoom In (Scroll Up)"
            >
              <Plus size={10} />
            </button>
            <button 
              onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
              className="p-1 text-slate-455 hover:text-cyan-400 bg-slate-800 rounded hover:bg-slate-700 transition flex items-center gap-0.5 text-[8.5px] px-1.5"
              title="Recenter and Fit Workspace"
            >
              <Maximize2 size={9} /> Reset
            </button>
            
            <div className="h-4 w-[1px] bg-white/10 mx-0.5" />
            
            <button
              onClick={() => setWireStyle(w => w === "orthogonal" ? "bezier" : "orthogonal")}
              className={`p-1 flex items-center gap-1 text-[8.5px] px-2 rounded font-bold transition ${
                wireStyle === "orthogonal"
                  ? "bg-cyan-950/80 border border-cyan-500/30 text-cyan-300"
                  : "bg-purple-950/80 border border-purple-500/30 text-purple-300"
              }`}
              title="Toggle Wire Routing Pathing Engine"
            >
              <Sparkles size={9} /> {wireStyle === "orthogonal" ? "Manhattan Style" : "Bezier Curves"}
            </button>
          </div>

          {/* Zoom and pan vector transformation layer */}
          <div 
            className="absolute inset-0 select-none overflow-visible pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0"
            }}
          >
            {/* Extended Grid Backdrop pattern */}
            <div className="absolute inset-0 grid-backdrop pointer-events-none" style={{ width: "3500px", height: "3500px" }} />

            {/* Floating translucent custom-designed microchip gate nodes */}
            {calculatedNodes.map((node) => {
              const isHigh = !!node.value;
              const customLedColor = node.ledColor || "#10b981";

              const inputLimit = node.maxInputs || (node.gateType === "NOT" ? 1 : node.gateType === "MUX" ? 3 : node.type === "seven_seg" ? 4 : 2);

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  onMouseDown={(e) => {
                    // Capture clicks inside buttons so they don't drag nodes instead
                    const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
                    if (targetTag === "button" || targetTag === "input") return;
                    setDraggedNodeId(node.id);
                  }}
                  className={`absolute p-2.5 rounded-xl border text-center select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center min-w-[95px] pointer-events-auto transition-all duration-150 ${
                    selectedNodeId === node.id
                      ? "bg-slate-900 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.45)] z-30"
                      : node.type === "input"
                      ? "bg-slate-950/90 border-emerald-500/35 hover:border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.05)] z-10"
                      : node.type === "clock"
                      ? "bg-slate-950/90 border-amber-500/35 hover:border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.05)] z-10"
                      : node.type === "output"
                      ? `bg-slate-950/90 hover:border-[${customLedColor}] shadow-[2px_2px_12px_rgba(0,0,0,0.4)] z-10`
                      : node.type === "seven_seg"
                      ? "bg-slate-950/95 border-purple-500/40 hover:border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.08)] z-10 w-28 py-3"
                      : "bg-slate-950/90 border-slate-700/50 hover:border-slate-500 hover:bg-slate-900 z-10"
                  }`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: "translate(-50%, -50%)",
                    borderColor: (selectedNodeId !== node.id && node.type === "output") ? `${customLedColor}3c` : undefined
                  }}
                >
                  
                  {/* WIRING CONNECTIONS: Clickable Target Ports based on maximum inputs settings */}
                  
                  {/* Left side: INPUT pins (Target of connections) */}
                  {node.type !== "input" && node.type !== "clock" && (
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20">
                      <div 
                        onClick={(e) => handleTerminalClick(e, node.id, "in")}
                        className={`w-3.5 h-3.5 rounded-full border-2 cursor-crosshair transition-all duration-150 flex items-center justify-center ${
                          connectingFromId && connectingFromId !== node.id
                            ? "bg-cyan-500 border-cyan-300 animate-pulse scale-125 shadow-[0_0_8px_#22d3ee]"
                            : node.inputs.length >= inputLimit
                            ? "bg-slate-800 border-slate-600 cursor-not-allowed"
                            : "bg-slate-950 border-cyan-600 hover:bg-cyan-600 hover:scale-110"
                        }`}
                        title={`Pin target (${node.inputs.length}/${inputLimit} links connected)`}
                      />
                    </div>
                  )}

                  {/* Right side: OUTPUT pins (Emitter of connections) */}
                  {node.type !== "output" && node.type !== "seven_seg" && (
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20">
                      <div 
                        onClick={(e) => handleTerminalClick(e, node.id, "out")}
                        className={`w-3.5 h-3.5 rounded-full border-2 cursor-crosshair transition-all duration-150 flex items-center justify-center ${
                          connectingFromId === node.id 
                            ? "bg-amber-400 border-amber-200 scale-125 shadow-[0_0_8px_#fbbf24]"
                            : isHigh 
                            ? "bg-emerald-500 border-emerald-300 hover:bg-emerald-400 hover:scale-110"
                            : "bg-slate-950 border-amber-600 hover:bg-amber-500 hover:scale-110"
                        }`}
                        title="Pin source (click and drag output wire)"
                      />
                    </div>
                  )}

                  {/* Node indicator labels */}
                  <div className="flex items-center gap-1 mb-1 shadow-sm select-none pointer-events-none">
                    <span className="text-[7.5px] font-bold font-mono text-slate-500 uppercase">{node.id}</span>
                    <span className="text-[10px] font-bold font-semibold text-slate-200 truncate max-w-[80px]">{node.name || node.gateType}</span>
                  </div>

                  {/* Sub-section renders based on node properties */}
                  {node.type === "input" ? (
                    <div className="flex flex-col items-center gap-1 w-full relative pointer-events-auto">
                      {node.isPushButton ? (
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isToggledOn: true } : n));
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation();
                            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isToggledOn: false } : n));
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isToggledOn: false } : n));
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isToggledOn: true } : n));
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation();
                            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isToggledOn: false } : n));
                          }}
                          className={`text-[9.5px] font-bold font-mono px-2.5 py-1 rounded cursor-pointer transition-all flex items-center justify-center min-w-[75px] select-none ${
                            node.isToggledOn
                              ? "bg-rose-950/80 text-rose-400 border border-rose-500/50 shadow-[0_0_10px_rgba(239,68,68,0.35)] font-extrabold scale-95"
                              : "bg-slate-950 text-slate-500 border border-white/5 hover:bg-slate-900"
                          }`}
                        >
                          {node.isToggledOn ? "● PRESSED" : "○ HOLD UP"}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleInput(node.id);
                          }}
                          className={`text-[9.5px] font-bold font-mono px-2.5 py-1 rounded cursor-pointer transition-all flex items-center gap-1.5 ${
                            node.isToggledOn
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                              : "bg-slate-950 text-slate-500 border border-white/5"
                          }`}
                        >
                          {node.isToggledOn ? "1 (HIGH)" : "0 (LOW)"}
                        </button>
                      )}
                      <span className="text-[7px] font-mono text-slate-400 truncate max-w-[65px]">
                        {node.isPushButton ? "Push Hold" : "Sw Input"}
                      </span>
                    </div>
                  ) : node.type === "clock" ? (
                    <div className="flex flex-col items-center gap-1 w-full pointer-events-none">
                      <div className="flex items-center gap-1">
                        <Clock size={10} className={isHigh ? "text-amber-400 animate-spin" : "text-slate-500"} />
                        <span className={`text-[9px] font-mono font-bold ${isHigh ? "text-amber-400 font-extrabold" : "text-slate-500"}`}>
                          {isHigh ? "1 (HIGH)" : "0 (LOW)"}
                        </span>
                      </div>
                      <span className="text-[7px] font-mono text-slate-400 truncate max-w-[65px]">{node.clockFreq || 1}Hz Osc</span>
                    </div>
                  ) : node.type === "output" ? (
                    <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                      <div 
                        style={{ 
                          backgroundColor: isHigh ? customLedColor : "#090d16",
                          borderColor: isHigh ? "#ffffff" : "#2d3748",
                          boxShadow: isHigh ? `0 0 20px ${customLedColor}` : "none"
                        }}
                        className="w-6.5 h-6.5 rounded-full border-2 transition-all duration-300 flex items-center justify-center"
                      >
                        <span className={`text-[10px] font-bold font-mono ${isHigh ? "text-slate-950 font-extrabold" : "text-slate-600"}`}>
                          {isHigh ? "1" : "0"}
                        </span>
                      </div>
                      <span className="text-[7.5px] font-mono text-slate-300 truncate max-w-[65px]">{node.name}</span>
                    </div>
                  ) : node.type === "seven_seg" ? (
                    // Vintage Hexadecimal 7-Segment display decoder module
                    <div className="flex flex-col items-center gap-1.5 w-full pointer-events-none mt-1">
                      {(() => {
                        const decoded = getSevenSegGlows(node);
                        return (
                          <div className="flex flex-col items-center gap-1.5 bg-black/90 p-1.5 rounded border border-white/5 shadow-inner">
                            {/* Segment display visualization */}
                            <div className="w-8 h-12 relative flex items-center justify-center bg-slate-950 rounded">
                              {/* Segment SVG visual lines */}
                              <svg viewBox="0 0 40 60" className="w-6 h-10">
                                {/* segment a */}
                                <line x1="8" y1="5" x2="32" y2="5" strokeWidth="2.5" className={decoded.segs.a ? "stroke-red-500 shadow-[0_0_5px_#ef4444]" : "stroke-red-950/20"} strokeLinecap="round" />
                                {/* segment b */}
                                <line x1="34" y1="7" x2="34" y2="25" strokeWidth="2.5" className={decoded.segs.b ? "stroke-red-500 shadow-[0_0_5px_#ef4444]" : "stroke-red-950/20"} strokeLinecap="round" />
                                {/* segment c */}
                                <line x1="34" y1="29" x2="34" y2="47" strokeWidth="2.5" className={decoded.segs.c ? "stroke-red-500 shadow-[0_0_5px_#ef4444]" : "stroke-red-950/20"} strokeLinecap="round" />
                                {/* segment d */}
                                <line x1="8" y1="49" x2="32" y2="49" strokeWidth="2.5" className={decoded.segs.d ? "stroke-red-500 shadow-[0_0_5px_#ef4444]" : "stroke-red-950/20"} strokeLinecap="round" />
                                {/* segment e */}
                                <line x1="6" y1="29" x2="6" y2="47" strokeWidth="2.5" className={decoded.segs.e ? "stroke-red-500 shadow-[0_0_5px_#ef4444]" : "stroke-red-950/20"} strokeLinecap="round" />
                                {/* segment f */}
                                <line x1="6" y1="7" x2="6" y2="25" strokeWidth="2.5" className={decoded.segs.f ? "stroke-red-500 shadow-[0_0_5px_#ef4444]" : "stroke-red-950/20"} strokeLinecap="round" />
                                {/* segment g */}
                                <line x1="8" y1="27" x2="32" y2="27" strokeWidth="2.5" className={decoded.segs.g ? "stroke-red-500 shadow-[0_0_5px_#ef4444]" : "stroke-red-950/20"} strokeLinecap="round" />
                              </svg>
                            </div>
                            
                            {/* Decode text displays */}
                            <div className="text-center">
                              <span className="text-sm font-bold font-mono text-red-500 tracking-wide animate-pulse">{decoded.val}</span>
                              <span className="text-[6.5px] font-mono text-zinc-500 block">{node.inputs.length}/4 wired</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (node.gateType === "DFF" || node.gateType === "TFF" || node.gateType === "JKFF") ? (
                    // ADVANCED EDGE TRIGGERED FLIP FLOP REGISTERS (CircuitVerse Mode)
                    <div className="flex flex-col items-center gap-1 pointer-events-none mt-1">
                      <div className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-900 border ${
                        isHigh ? "text-cyan-400 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.15)] font-extrabold" : "text-slate-400 border-white/5"
                      }`}>
                        {node.gateType}
                      </div>
                      <div className="flex gap-2 text-[7.5px] font-mono text-slate-450 mt-1 uppercase font-semibold">
                        <span>CLK: <span className={node.prevClockValue ? "text-cyan-400 font-bold" : "text-slate-600"}>{node.prevClockValue ? "↑" : "0"}</span></span>
                        <span>Q: <span className={isHigh ? "text-emerald-400 font-bold animate-pulse" : "text-slate-600"}>{isHigh ? "1" : "0"}</span></span>
                      </div>
                      <span className="text-[6.5px] font-mono text-slate-500">
                        Wired: <strong>{node.inputs.length}/{inputLimit}</strong>
                      </span>
                    </div>
                  ) : (
                    // LOGIC GATES
                    <div className="flex flex-col items-center gap-0.5 pointer-events-none">
                      <div className={`text-[10.5px] font-bold font-mono px-2 py-0.5 rounded ${
                        isHigh ? "text-cyan-400 font-extrabold" : "text-slate-400"
                      }`}>
                        {node.gateType}
                      </div>
                      <span className="text-[7.5px] font-mono text-slate-500">
                        Wired: <strong className={node.inputs.length > 0 ? "text-cyan-400" : "text-slate-600"}>{node.inputs.length}/{inputLimit}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom micro bar instructions */}
        <div className="px-5 py-2.5 bg-slate-950/90 border-t border-white/5 text-[9px] font-mono text-slate-400 flex items-center justify-between z-10">
          <span className="flex items-center gap-1 text-cyan-400">
            <Info size={11} /> Wire ports by tapping yellow out pins to green inputs. Drag cards from toolbox onto the grid!
          </span>
          <span className="text-slate-500 font-mono">CAD Hardware Emulator</span>
        </div>
      </div>

      {/* RIGHT PANEL: dynamic truth tables, equations derivations, and system metrics */}
      {(() => {
        const isCustomCircuit = !activeTemplate || nodes.length !== activeTemplate.nodes.length;
        const useDynamicTable = showDynamicTable || isCustomCircuit;
        
        return (
          <div id="dld_right_board" className="w-full xl:w-72 border-t xl:border-t-0 xl:border-l border-white/10 bg-slate-900/30 p-4 shrink-0 flex flex-col justify-between overflow-y-auto max-h-[80vh] xl:max-h-none scrollbar-thin">
            <div className="space-y-4">
              
              {/* Beautiful Sidebar Tabs */}
              <div className="flex border-b border-white/10 p-0.5 bg-slate-950/45 rounded-lg">
                <button
                  onClick={() => setRightPanelTab("table")}
                  className={`flex-1 py-1 px-1.5 text-[9.5px] font-mono font-bold uppercase rounded transition-all cursor-pointer text-center ${
                    rightPanelTab === "table"
                      ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setRightPanelTab("equations")}
                  className={`flex-1 py-1 px-1.5 text-[9.5px] font-mono font-bold uppercase rounded transition-all cursor-pointer text-center ${
                    rightPanelTab === "equations"
                      ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Equations
                </button>
                <button
                  onClick={() => setRightPanelTab("inspector")}
                  className={`flex-1 py-1 px-1.5 text-[9.5px] font-mono font-bold uppercase rounded transition-all cursor-pointer text-center ${
                    rightPanelTab === "inspector"
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Inspect
                </button>
              </div>

              {/* Tab 1: Truth Table Analyzer */}
              {rightPanelTab === "table" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[10px] font-bold font-mono text-cyan-300 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle size={10} className="text-cyan-300" /> Active Truth Table
                    </span>
                    <div className="flex items-center gap-1.5">
                      {activeTemplate && !isCustomCircuit && (
                        <button
                          onClick={() => setShowDynamicTable(!showDynamicTable)}
                          className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold transition-all cursor-pointer"
                        >
                          {showDynamicTable ? "📋 Show Preset" : "⚡ Live Dynamic"}
                        </button>
                      )}
                      <span className="text-[8px] font-mono px-1 bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 rounded uppercase">
                        {useDynamicTable ? "Dynamic" : "Preset"}
                      </span>
                    </div>
                  </div>

                  {useDynamicTable ? (
                    customTruthTable ? (
                      <div className="rounded-lg border border-white/5 bg-slate-950/60 overflow-hidden animate-fade-in">
                        <table className="w-full min-w-full divide-y divide-white/5 text-[9px] font-mono text-center">
                          <thead className="bg-slate-900/95 text-slate-300 text-[8px] font-bold font-mono uppercase">
                            <tr>
                              {customTruthTable.headers.map((hdr, i) => (
                                <th key={i} className="py-1 px-1 truncate max-w-[45px]" title={hdr}>{hdr}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {customTruthTable.rows.map((row, rowIdx) => (
                              <tr 
                                key={rowIdx} 
                                className={`transition-colors ${
                                  row.isCurrent 
                                    ? "bg-cyan-950/60 text-white font-extrabold border-y border-cyan-500/25 shadow-inner" 
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                {row.inputs.map((val, i) => (
                                  <td key={i} className="py-1 px-1">
                                    <span className={row.isCurrent ? (val ? "text-emerald-400 font-extrabold" : "text-rose-400") : ""}>
                                      {val ? "1" : "0"}
                                    </span>
                                  </td>
                                ))}
                                {row.outputs.map((val, i) => (
                                  <td key={i} className="py-1 px-1">
                                    <span className={row.isCurrent ? (val ? "text-cyan-400 font-extrabold animate-pulse" : "text-rose-500 font-extrabold") : ""}>
                                      {val ? "1" : "0"}
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-500 italic bg-slate-950/40 border border-white/5 p-3 rounded-lg leading-relaxed">
                        💡 No inputs or outputs detected on grid. Place and wire toggles and output LEDs to construct a dynamic truth table!
                      </div>
                    )
                  ) : activeTemplate ? (
                    <div className="rounded-lg border border-white/5 bg-slate-950/60 overflow-hidden">
                      <table className="w-full min-w-full divide-y divide-white/5 text-[9.5px] font-mono text-center">
                        <thead className="bg-slate-900/95 text-slate-300 text-[8.5px] font-bold font-mono uppercase">
                          <tr>
                            {activeTemplate.truthTableHeaders.map((hdr, i) => (
                              <th key={i} className="py-1 px-1">{hdr}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {activeTemplate.truthTableRows.map((row, rowIdx) => {
                            const boardInputs = calculatedNodes.filter(n => n.type === "input");
                            const isCurrentlyActiveRow = row.inputs.every((val, valIdx) => {
                              const boardInput = boardInputs[valIdx];
                              return boardInput ? !!boardInput.value === val : false;
                            });

                            return (
                              <tr 
                                key={rowIdx} 
                                className={`transition-colors ${
                                  isCurrentlyActiveRow 
                                    ? "bg-cyan-950/60 text-white font-extrabold shadow-inner border-y border-cyan-500/10" 
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                {row.inputs.map((val, i) => (
                                  <td key={i} className="py-1 px-1">
                                    <span className={isCurrentlyActiveRow ? (val ? "text-emerald-400 font-extrabold" : "text-rose-400") : ""}>
                                      {val ? "1" : "0"}
                                    </span>
                                  </td>
                                ))}
                                {row.outputs.map((val, i) => (
                                  <td key={i} className="py-1 px-1">
                                    {val === undefined ? (
                                      <span className="text-slate-500">Hold</span>
                                    ) : (
                                      <span className={isCurrentlyActiveRow ? (val ? "text-cyan-400 font-bold" : "text-rose-500 font-bold") : ""}>
                                        {val ? "1" : "0"}
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500 italic block mt-3">Custom circuits simulate dynamically. Pre-cached truth tables are loaded for active lesson templates.</span>
                  )}
                </div>
              )}

              {/* Tab 2: Equations & Derivations */}
              {rightPanelTab === "equations" && (
                <div className="space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[10px] font-bold font-mono text-purple-300 uppercase tracking-widest flex items-center gap-1">
                      <Cpu size={10} className="text-purple-300" /> Equations & Derivations
                    </span>
                    <span className="text-[8px] font-mono text-purple-400 px-1 bg-purple-950/50 border border-purple-500/20 rounded uppercase">Analysis</span>
                  </div>

                  {derivations && derivations.length > 0 ? (
                    derivations.map((deriv, idx) => (
                      <div key={idx} className="bg-slate-950/50 border border-white/5 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-bold font-mono text-slate-200">
                            Output: <strong className="text-purple-300">{deriv.outputName}</strong>
                          </span>
                          <span className="text-[7.5px] text-slate-500 font-mono font-bold uppercase">SOP Form</span>
                        </div>

                        {/* Boolean Equation display */}
                        <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-purple-500/10">
                          <div className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Canonical Expression:</div>
                          <div className="text-[10px] font-mono text-purple-350 break-all font-bold">
                            Y = {deriv.sop}
                          </div>
                          {deriv.simplified !== deriv.sop && (
                            <div className="mt-1.5 pt-1.5 border-t border-white/5">
                              <div className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Simplified Algebraic Form:</div>
                              <div className="text-[10.5px] font-mono text-emerald-400 font-bold">
                                Y = {deriv.simplified}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Derivation Steps */}
                        <div className="space-y-1 text-[9px] font-mono text-slate-400 leading-normal">
                          <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold font-mono">Reduction Derivations:</div>
                          <div className="space-y-1 pt-0.5">
                            {deriv.steps.map((step, sIdx) => (
                              <div key={sIdx} className="bg-white/5 p-1 rounded border border-white/5 text-[8.5px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Karnaugh Map Visualizer */}
                        {renderKMap(idx)}
                      </div>
                    ))
                  ) : (
                    <div className="text-[9.5px] text-zinc-500 italic bg-slate-950/40 border border-white/5 p-3 rounded-lg leading-relaxed">
                      💡 No output probes found. Place logic gates connected to LED output probes to compute equations and derivations!
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Inspector / Gate Operations */}
              {rightPanelTab === "inspector" && (
                <div className="space-y-3 animate-fade-in">
                  <span className="text-[9.5px] font-bold font-mono text-amber-400 uppercase tracking-widest block pb-1.5 border-b border-white/5 flex items-center gap-1">
                    <Zap size={10} className="text-amber-400" /> Device Inspector
                  </span>
                  {activeGate ? (
                    <div className="bg-slate-950/40 border border-white/5 rounded-lg p-2.5 space-y-1.5 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        <span>{activeGate.gateType || activeGate.type} ({activeGate.id})</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        {activeGate.gateType === "AND" && "Computes logical multiplication (high ONLY if all wired ports are high)."}
                        {activeGate.gateType === "OR" && "Computes logical addition (high if at least one wired port is high)."}
                        {activeGate.gateType === "NOT" && "Inverts states. Transforms incoming high (1) to low (0) and vice-versa."}
                        {activeGate.gateType === "NAND" && "Inverse AND. Returns Low (0) ONLY if all inputs are High (1)."}
                        {activeGate.gateType === "NOR" && "Inverse OR. Returns High (1) ONLY if all inputs are Low (0)."}
                        {activeGate.gateType === "XOR" && "Computes odd-parity (high when inputs differ in parity)."}
                        {activeGate.gateType === "XNOR" && "Inverse XOR. Returns High if inputs are equal."}
                        {activeGate.gateType === "MUX" && "2-to-1 Multiplexer selection. Chooses between I0 (Input 0) or I1 (Input 1) depending on Selector inputs."}
                        {activeGate.type === "clock" && `Generates square wave clock oscillations pacing at dynamic ${activeGate.clockFreq || 1}Hz frequency.`}
                        {activeGate.type === "input" && "Manual logic switchboards generating local binary stimuli."}
                        {activeGate.type === "output" && "LED light display showing high or low voltage logical state."}
                        {activeGate.type === "seven_seg" && "Monitors up to 4 sequential wire pins, decoding binary into beautiful hex codes on-screen."}
                      </p>
                      <div className="pt-1.5 border-t border-white/5 flex justify-between text-[9px] text-zinc-400">
                        <span>Logic Status:</span>
                        <strong className={activeGate.value ? "text-emerald-400" : "text-rose-400"}>
                          {activeGate.value ? "1 (HIGH)" : "0 (LOW)"}
                        </strong>
                      </div>

                      {/* Real-time Logic Oscilloscope Probe */}
                      <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-[8.5px] font-mono font-bold tracking-wider text-slate-400">
                          <span className="flex items-center gap-1">
                            <Activity size={10} className="text-cyan-400 animate-pulse" /> LIVE LOGIC OSCILLOSCOPE
                          </span>
                          <span className="text-[7.5px] text-cyan-300 bg-cyan-950/40 px-1 py-0.2 rounded border border-cyan-500/10">Active Probe</span>
                        </div>
                        <div className="w-full bg-slate-950/80 rounded border border-white/5 h-[48px] relative overflow-hidden flex items-center justify-center">
                          {signalHistory.length > 0 ? (
                            <svg className="w-full h-full" viewBox="0 0 240 40" preserveAspectRatio="none">
                              {/* Background grid lines */}
                              <line x1="0" y1="20" x2="240" y2="20" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
                              <line x1="60" y1="0" x2="60" y2="40" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
                              <line x1="120" y1="0" x2="120" y2="40" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
                              <line x1="180" y1="0" x2="180" y2="40" stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.5" />
                              
                              {/* Glowing digital wave path */}
                              <path
                                d={(() => {
                                  let pathD = "";
                                  const steps = 30;
                                  const len = signalHistory.length;
                                  signalHistory.forEach((val, idx) => {
                                    const x = (idx / 29) * 240;
                                    const y = val === 1 ? 8 : 32;
                                    if (idx === 0) {
                                      pathD = `M ${x} ${y}`;
                                    } else {
                                      const prevY = signalHistory[idx - 1] === 1 ? 8 : 32;
                                      const prevX = ((idx - 1) / 29) * 240;
                                      pathD += ` L ${x} ${prevY} L ${x} ${y}`;
                                    }
                                  });
                                  return pathD;
                                })()}
                                fill="none"
                                stroke={activeGate.value ? "#10b981" : "#f43f5e"}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-100"
                              />
                            </svg>
                          ) : (
                            <span className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono">Calibrating oscilloscope...</span>
                          )}
                        </div>
                        <div className="flex justify-between text-[7.5px] font-mono text-slate-500">
                          <span>30-Ticks Scroll Window</span>
                          <span>Value: {activeGate.value ? "1" : "0"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500 italic block bg-slate-950/40 p-2.5 rounded-lg border border-white/5">💡 Select any node on the grid to inspect logic routing notes dynamically.</span>
                  )}
                </div>
              )}

            </div>

            {/* Live current statistics */}
            <div className="pt-3 border-t border-white/5 text-[9.5px] font-mono text-slate-500 space-y-1 mt-4">
              <div className="flex justify-between">
                <span>Grid state nodes:</span>
                <span className="text-cyan-400 font-bold">{calculatedNodes.length} devices</span>
              </div>
              <div className="flex justify-between">
                <span>Excited signals (High):</span>
                <span className="text-emerald-400 font-bold">{calculatedNodes.filter(n => n.value).length} paths</span>
              </div>
              <div className="flex justify-between">
                <span>Clock Frequency:</span>
                <span className={isRunning ? "text-amber-400" : "text-slate-500"}>{isRunning ? `Ticks active` : "Paused"}</span>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
