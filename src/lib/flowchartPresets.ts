import { FlowchartPreset, StepNode } from "../types/flowchartTypes";

export const PURPLE = "#9a5cff";
export const AMBER = "#f09a2f";
export const CYAN = "#00d2ff";
export const EMERALD = "#10b981";
export const ROSE = "#f43f5e";

export const mix = (hue: string, pct: number, base = "var(--surface)") =>
  `color-mix(in srgb, ${hue} ${pct}%, ${base})`;

export const FLOWCHART_PRESETS: FlowchartPreset[] = [
  {
    id: "order-fraud-trigger",
    name: "E-Commerce Fraud & Order Workflow",
    category: "Agent Workflows",
    description: "Real-time trigger card linked with an if/else condition chip filter",
    nodes: [
      {
        id: "1",
        row: 0,
        x: 0.5,
        w: 420,
        kind: { label: "Trigger", hue: PURPLE },
        hue: PURPLE,
        title: "Order created",
        caption: "Runs whenever a customer places an order on Shopify.",
        actionType: "trigger",
      },
      {
        id: "2",
        row: 1,
        x: 0.5,
        w: 520,
        kind: { label: "Condition", hue: AMBER },
        hue: AMBER,
        condition: true,
        actionType: "condition",
        conditionRules: [
          {
            id: "r1",
            prefix: "If",
            sourceLabel: "order",
            property: "Risk level",
            operator: "is",
            value: "High risk",
            dotColor: ROSE,
            propertyOptions: ["Risk level", "Total price", "Customer country", "Payment gateway", "Item count"],
            valueOptions: [
              { name: "High risk", tag: "Suspicious" },
              { name: "Medium risk", tag: "Review" },
              { name: "Low risk", tag: "Safe" },
            ],
          },
          {
            id: "r2",
            prefix: "and",
            sourceLabel: "order",
            property: "Total price",
            operator: "is",
            value: "> $500",
            dotColor: AMBER,
            propertyOptions: ["Risk level", "Total price", "Customer age", "Fulfillment method"],
            valueOptions: [
              { name: "> $500", tag: "High Value" },
              { name: "> $1000", tag: "VIP Tier" },
              { name: "< $100", tag: "Standard" },
            ],
          },
        ],
      },
      {
        id: "3",
        row: 2,
        x: 0.28,
        w: 340,
        kind: { label: "Action: True", hue: ROSE },
        hue: ROSE,
        title: "Flag for Manual Review",
        caption: "Suspend automatic fulfillment & send instant Slack alert to Security team.",
        actionType: "notify",
      },
      {
        id: "4",
        row: 2,
        x: 0.72,
        w: 340,
        kind: { label: "Action: False", hue: EMERALD },
        hue: EMERALD,
        title: "Auto-Dispatch Warehouse",
        caption: "Create shipping label with 3PL carrier and charge Stripe customer.",
        actionType: "action",
      },
    ],
    edges: [
      { from: "1", to: "2" },
      { from: "2", to: "3", label: "TRUE", branch: "true" },
      { from: "2", to: "4", label: "FALSE", branch: "false" },
    ],
  },
  {
    id: "ai-agent-loop",
    name: "AI Autonomous Agent Tool Loop",
    category: "Agent Workflows",
    description: "ReAct reasoning loop with tool calling, context evaluation and output synthesis",
    nodes: [
      {
        id: "n1",
        row: 0,
        x: 0.5,
        w: 440,
        kind: { label: "User Prompt Ingest", hue: CYAN },
        hue: CYAN,
        title: "User Multi-Modal Query",
        caption: "Ingests speech, text prompt, or screen frame telemetry.",
        actionType: "trigger",
      },
      {
        id: "n2",
        row: 1,
        x: 0.5,
        w: 520,
        kind: { label: "Condition: Tool Evaluation", hue: PURPLE },
        hue: PURPLE,
        condition: true,
        actionType: "condition",
        conditionRules: [
          {
            id: "cr1",
            prefix: "If",
            sourceLabel: "agent_intent",
            property: "Requires live tool",
            operator: "is",
            value: "Web Search / Python Sandbox",
            dotColor: CYAN,
            propertyOptions: ["Requires live tool", "Confidence score", "Token length", "Intent category"],
            valueOptions: [
              { name: "Web Search / Python Sandbox", tag: "External RPC" },
              { name: "Chalkboard Slate Render", tag: "Visual UI" },
              { name: "Direct LLM Response", tag: "Direct Stream" },
            ],
          },
        ],
      },
      {
        id: "n3",
        row: 2,
        x: 0.28,
        w: 360,
        kind: { label: "Execute Tool RPC", hue: AMBER },
        hue: AMBER,
        title: "Sandbox Execution & Observation",
        caption: "Runs code / queries search API and captures stdout observation.",
        actionType: "api",
      },
      {
        id: "n4",
        row: 2,
        x: 0.72,
        w: 360,
        kind: { label: "Direct Generation", hue: EMERALD },
        hue: EMERALD,
        title: "Synthesize Conversational Audio",
        caption: "Generates grounded multimodal response with natural vocal pacing.",
        actionType: "ai",
      },
      {
        id: "n5",
        row: 3,
        x: 0.5,
        w: 420,
        kind: { label: "Memory Sync", hue: PURPLE },
        hue: PURPLE,
        title: "Append to Long-Term Memory Vector",
        caption: "Persists lesson notes and updates user comprehension profile.",
        actionType: "db",
      },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", label: "Needs Tools", branch: "true" },
      { from: "n2", to: "n4", label: "Direct Answer", branch: "false" },
      { from: "n3", to: "n5" },
      { from: "n4", to: "n5" },
    ],
  },
  {
    id: "bubble-sort-flowchart",
    name: "Sorting Algorithm (Bubble / Quick)",
    category: "Computer Science",
    description: "Algorithmic decision tree for iterative array element swapping",
    nodes: [
      {
        id: "s1",
        row: 0,
        x: 0.5,
        w: 420,
        kind: { label: "Start Algorithm", hue: PURPLE },
        hue: PURPLE,
        title: "Input Array: A[0 ... n-1]",
        caption: "Initialize outer loop i = 0, swapped = false.",
        actionType: "trigger",
      },
      {
        id: "s2",
        row: 1,
        x: 0.5,
        w: 500,
        kind: { label: "Comparison Decision", hue: AMBER },
        hue: AMBER,
        condition: true,
        actionType: "condition",
        conditionRules: [
          {
            id: "sc1",
            prefix: "If",
            sourceLabel: "element",
            property: "A[j] > A[j+1]",
            operator: "is",
            value: "True (Out of Order)",
            dotColor: ROSE,
            propertyOptions: ["A[j] > A[j+1]", "j < n - i - 1", "i < n - 1"],
            valueOptions: [
              { name: "True (Out of Order)", tag: "Needs Swap" },
              { name: "False (Ordered)", tag: "Skip Swap" },
            ],
          },
        ],
      },
      {
        id: "s3",
        row: 2,
        x: 0.28,
        w: 340,
        kind: { label: "Swap Elements", hue: ROSE },
        hue: ROSE,
        title: "temp = A[j]; A[j]=A[j+1]; A[j+1]=temp",
        caption: "Set swapped = true. Increment j counter.",
        actionType: "action",
      },
      {
        id: "s4",
        row: 2,
        x: 0.72,
        w: 340,
        kind: { label: "No Swap", hue: EMERALD },
        hue: EMERALD,
        title: "Advance pointer j++",
        caption: "Elements already in ascending order.",
        actionType: "action",
      },
      {
        id: "s5",
        row: 3,
        x: 0.5,
        w: 400,
        kind: { label: "Termination Check", hue: CYAN },
        hue: CYAN,
        title: "Sorted Array Ready (O(n²) / O(n))",
        caption: "All passes complete. Return sorted output collection.",
        actionType: "finish",
      },
    ],
    edges: [
      { from: "s1", to: "s2" },
      { from: "s2", to: "s3", label: "TRUE", branch: "true" },
      { from: "s2", to: "s4", label: "FALSE", branch: "false" },
      { from: "s3", to: "s5" },
      { from: "s4", to: "s5" },
    ],
  },
  {
    id: "user-auth-flow",
    name: "OAuth 2.0 & JWT Security Flow",
    category: "Business & Logic",
    description: "Multi-step identity verification, token exchange and session authorization",
    nodes: [
      {
        id: "a1",
        row: 0,
        x: 0.5,
        w: 420,
        kind: { label: "Client Inbound", hue: PURPLE },
        hue: PURPLE,
        title: "POST /api/auth/login",
        caption: "User submits credentials or OAuth Authorization Code.",
        actionType: "trigger",
      },
      {
        id: "a2",
        row: 1,
        x: 0.5,
        w: 520,
        kind: { label: "Security Verification", hue: AMBER },
        hue: AMBER,
        condition: true,
        actionType: "condition",
        conditionRules: [
          {
            id: "ac1",
            prefix: "If",
            sourceLabel: "session",
            property: "MFA required & Valid Password",
            operator: "is",
            value: "2FA Enabled",
            dotColor: CYAN,
            propertyOptions: ["MFA required & Valid Password", "Account Locked", "IP Risk Score"],
            valueOptions: [
              { name: "2FA Enabled", tag: "Challenge Step" },
              { name: "Direct Pass", tag: "Trusted Device" },
              { name: "Invalid Creds", tag: "Reject" },
            ],
          },
        ],
      },
      {
        id: "a3",
        row: 2,
        x: 0.28,
        w: 350,
        kind: { label: "2FA Challenge", hue: AMBER },
        hue: AMBER,
        title: "Dispatch TOTP / Passkey",
        caption: "Await hardware authenticator or SMS verification code.",
        actionType: "notify",
      },
      {
        id: "a4",
        row: 2,
        x: 0.72,
        w: 350,
        kind: { label: "Sign JWT Tokens", hue: EMERALD },
        hue: EMERALD,
        title: "Generate Access & Refresh Tokens",
        caption: "Sign EdDSA RS256 token and set HttpOnly SameSite cookie.",
        actionType: "finish",
      },
    ],
    edges: [
      { from: "a1", to: "a2" },
      { from: "a2", to: "a3", label: "MFA On", branch: "true" },
      { from: "a2", to: "a4", label: "Trusted", branch: "false" },
      { from: "a3", to: "a4", label: "Verified" },
    ],
  },
];

/**
 * Dynamically synthesizes a complete interactive flowchart from any freehand prompt
 */
export function generateFlowchartFromTopic(topic: string): FlowchartPreset {
  const clean = (topic || "").trim();
  const id = `flow-${Date.now()}`;

  // Match keyword patterns or generate structured step workflow
  const lower = clean.toLowerCase();

  let name = clean ? `Flowchart: ${clean.slice(0, 30)}` : "Custom Dynamic Flowchart";
  let triggerTitle = "Process Initialized";
  let triggerCaption = `Initiating automated sequence for: ${clean || "System Task"}`;
  let conditionProp = "Requirement met";
  let conditionVal = "Pass criteria";
  let actionTrueTitle = "Success / Route A";
  let actionTrueCaption = "Execute primary branch sequence and log success.";
  let actionFalseTitle = "Fallback / Route B";
  let actionFalseCaption = "Handle exception, retry or alternative pathway.";

  if (lower.includes("sort") || lower.includes("binary") || lower.includes("search") || lower.includes("algorithm")) {
    name = `Algorithm Flow: ${clean.slice(0, 32)}`;
    triggerTitle = "Input Data & Parameters";
    triggerCaption = "Receive unsorted stream or target search key.";
    conditionProp = "Pivot comparison (Key < Middle)";
    conditionVal = "True (Shift Left)";
    actionTrueTitle = "Recurse Left Sub-array";
    actionTrueCaption = "High = Mid - 1; Continue search in lower half.";
    actionFalseTitle = "Recurse Right Sub-array";
    actionFalseCaption = "Low = Mid + 1; Continue search in upper half.";
  } else if (lower.includes("login") || lower.includes("auth") || lower.includes("token") || lower.includes("security")) {
    name = "Authentication & Access Control Flow";
    triggerTitle = "User Request Authentication";
    triggerCaption = "Client sends authorization headers and payload.";
    conditionProp = "JWT Signature & Expiry Check";
    conditionVal = "Valid & Verified";
    actionTrueTitle = "Grant Protected Access";
    actionTrueCaption = "Return 200 OK with requested scoped data.";
    actionFalseTitle = "Deny & Return 401 Unauthorized";
    actionFalseCaption = "Redirect to login portal or trigger rate limiter.";
  } else if (lower.includes("order") || lower.includes("payment") || lower.includes("checkout") || lower.includes("cart")) {
    name = "Order Checkout & Payment Flow";
    triggerTitle = "Checkout Submitted";
    triggerCaption = "Customer clicks complete order with payment method.";
    conditionProp = "Payment Gateway Authorization";
    conditionVal = "Approved & 3DS Passed";
    actionTrueTitle = "Fulfill & Send Receipt";
    actionTrueCaption = "Deduct inventory and trigger confirmation email.";
    actionFalseTitle = "Payment Declined Handler";
    actionFalseCaption = "Prompt user for alternate payment card.";
  } else if (lower.includes("photo") || lower.includes("bio") || lower.includes("cell") || lower.includes("dna")) {
    name = "Biological Pathway & Cascade Flow";
    triggerTitle = "Environmental / Cellular Stimulus";
    triggerCaption = "Light photons or chemical ligand binds to receptor.";
    conditionProp = "ATP / Electron Transport State";
    conditionVal = "High Energy State";
    actionTrueTitle = "Calvin Cycle Synthesis";
    actionTrueCaption = "Produce glucose (G3P) and regenerate RuBP.";
    actionFalseTitle = "Quenching / Photoprotection";
    actionFalseCaption = "Dissipate excess energy safely as heat.";
  }

  return {
    id,
    name,
    category: "Agent Workflows",
    description: `Auto-generated interactive workflow for: ${clean || "Custom Logic"}`,
    nodes: [
      {
        id: "dyn-1",
        row: 0,
        x: 0.5,
        w: 420,
        kind: { label: "Trigger / Input", hue: PURPLE },
        hue: PURPLE,
        title: triggerTitle,
        caption: triggerCaption,
        actionType: "trigger",
      },
      {
        id: "dyn-2",
        row: 1,
        x: 0.5,
        w: 520,
        kind: { label: "Condition Evaluation", hue: AMBER },
        hue: AMBER,
        condition: true,
        actionType: "condition",
        conditionRules: [
          {
            id: "dyn-r1",
            prefix: "If",
            sourceLabel: "input",
            property: conditionProp,
            operator: "is",
            value: conditionVal,
            dotColor: EMERALD,
            propertyOptions: [conditionProp, "Time threshold", "Quality factor", "Error count"],
            valueOptions: [
              { name: conditionVal, tag: "Primary" },
              { name: "Alternative condition", tag: "Secondary" },
              { name: "Fail condition", tag: "Abort" },
            ],
          },
        ],
      },
      {
        id: "dyn-3",
        row: 2,
        x: 0.28,
        w: 340,
        kind: { label: "Branch: True", hue: EMERALD },
        hue: EMERALD,
        title: actionTrueTitle,
        caption: actionTrueCaption,
        actionType: "action",
      },
      {
        id: "dyn-4",
        row: 2,
        x: 0.72,
        w: 340,
        kind: { label: "Branch: False", hue: ROSE },
        hue: ROSE,
        title: actionFalseTitle,
        caption: actionFalseCaption,
        actionType: "notify",
      },
    ],
    edges: [
      { from: "dyn-1", to: "dyn-2" },
      { from: "dyn-2", to: "dyn-3", label: "TRUE", branch: "true" },
      { from: "dyn-2", to: "dyn-4", label: "FALSE", branch: "false" },
    ],
  };
}
