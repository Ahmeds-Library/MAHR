export interface ConditionRule {
  id: string;
  prefix?: "If" | "and" | "or" | string;
  sourceLabel?: string;
  property: string;
  operator?: string;
  value: string;
  propertyOptions?: string[];
  valueOptions?: { name: string; tag?: string }[];
  dotColor?: string;
}

export interface StepNodeKind {
  label: string;
  hue: string;
}

export interface StepNode {
  id: string;
  row: number;
  x: number; // 0–1 center of the node
  w: number;
  kind?: StepNodeKind;
  hue?: string;
  title?: string;
  caption?: string;
  iconName?: string;
  condition?: boolean; // Renders condition chip rows instead of static title
  conditionRules?: ConditionRule[];
  actionType?: "trigger" | "condition" | "action" | "api" | "notify" | "db" | "ai" | "finish";
  status?: "idle" | "running" | "success" | "skipped" | "error";
  statusMessage?: string;
  customData?: Record<string, any>;
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: string;
  branch?: "true" | "false" | "default";
  animated?: boolean;
}

export interface FlowchartPreset {
  id: string;
  name: string;
  category: "Agent Workflows" | "Computer Science" | "Engineering & Math" | "Business & Logic" | "Science & Bio";
  description: string;
  iconName?: string;
  nodes: StepNode[];
  edges: FlowchartEdge[];
}
