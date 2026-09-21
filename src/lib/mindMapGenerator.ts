import { DrawCommand } from "./diagramLayout";

export interface MindMapNode {
  id: string;
  title: string;
  details?: string[];
  color?: string;
  children?: MindMapNode[];
}

export interface MindMapResult {
  title: string;
  drawings: DrawCommand[];
  markdownSummary: string;
  nodeCount: number;
  diagramType?: "mindmap" | "workflow" | "relationship";
}

const COLOR_PALETTE = ["cyan", "gold", "mint", "rose", "purple"];

/**
 * Truncates text cleanly for canvas node labels.
 */
function formatNodeLabel(text: string, maxLen: number = 22): string {
  const clean = text.replace(/[*_~`#\-]/g, "").trim();
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen - 2) + "..";
}

/**
 * Strips common voice conversational filler prefixes and speech artifacts.
 */
export function cleanSpokenTranscript(transcript: string): string {
  let cleaned = transcript.trim();
  // Remove opening conversational prefixes
  cleaned = cleaned.replace(
    /^(hey\s+myraa|hi\s+myraa|hello\s+myraa|myraa\s*,?|please\s+|can\s+you\s+(please\s+)?|could\s+you\s+(please\s+)?|i\s+want\s+you\s+to\s+|map\s+this\s+out\s*:?|map\s+out\s+(the\s+|this\s+)?|draw\s+a\s+mind\s+map\s+(of|for)?|create\s+a\s+mind\s+map\s+(of|for)?|visualize\s+(the\s+)?(workflow|relationships?)\s+(of|for|between)?|voice\s+to\s+mind\s*map\s*:?)+/i,
    ""
  ).trim();

  // Strip conversational fillers
  cleaned = cleaned.replace(/\b(um|uh|you\s+know|like\s+basically|basically|so\s+basically)\b/gi, "").trim();
  return cleaned.length > 3 ? cleaned : transcript.trim();
}

/**
 * Client-side parser that converts highlighted text or notes into a structured MindMap tree.
 */
export function parseTextToMindMap(text: string): MindMapNode {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      id: "root",
      title: "Mind Map Concept",
      color: "purple",
      children: [],
    };
  }

  // Determine Central Title
  let mainTitle = "Core Concept";
  let contentLines = lines;

  // Check if first line looks like a title or header
  if (lines[0].startsWith("#") || lines[0].includes(":") || lines[0].length < 40) {
    mainTitle = lines[0].replace(/^#+\s*/, "").replace(/[:\*_]/g, "").trim();
    contentLines = lines.slice(1);
  } else {
    // If text is a paragraph, extract first sentence or main clause
    const firstSentence = lines[0].split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length < 45) {
      mainTitle = firstSentence.trim();
    }
  }

  const rootNode: MindMapNode = {
    id: "root",
    title: mainTitle,
    color: "purple",
    children: [],
  };

  if (contentLines.length === 0) {
    // Generate default exploratory branches from single text/topic
    const words = mainTitle.split(/\s+/);
    rootNode.children = [
      { id: "b1", title: "Key Components", color: "cyan" },
      { id: "b2", title: "Core Mechanism", color: "gold" },
      { id: "b3", title: "Practical Application", color: "mint" },
      { id: "b4", title: "Summary & Notes", color: "rose" },
    ];
    return rootNode;
  }

  // Group lines into branches
  let currentBranch: MindMapNode | null = null;
  const branches: MindMapNode[] = [];

  contentLines.forEach((line, idx) => {
    // Check if line is a bullet item or sub-heading
    const isBullet = /^[\-\*\•\d+\.]/.test(line);
    const cleanText = line.replace(/^[\-\*\•\d+\.]+\s*/, "").trim();

    if (!cleanText) return;

    if (!isBullet && (line.endsWith(":") || line.startsWith("#") || branches.length === 0)) {
      // New main branch topic
      const topicName = cleanText.replace(/[:#]/g, "").trim();
      currentBranch = {
        id: `branch_${idx}`,
        title: topicName,
        color: COLOR_PALETTE[branches.length % COLOR_PALETTE.length],
        children: [],
      };
      branches.push(currentBranch);
    } else {
      // It's a detail item or bullet
      if (!currentBranch) {
        currentBranch = {
          id: `branch_${idx}`,
          title: cleanText.length > 30 ? cleanText.substring(0, 28) + ".." : cleanText,
          color: COLOR_PALETTE[branches.length % COLOR_PALETTE.length],
          children: [],
        };
        branches.push(currentBranch);
      } else {
        // Handle definition "Key: Value" or sub-bullet
        if (cleanText.includes(":") && !cleanText.endsWith(":")) {
          const [key, val] = cleanText.split(":");
          currentBranch.children?.push({
            id: `sub_${idx}`,
            title: key.trim(),
            details: [val.trim()],
            color: currentBranch.color,
          });
        } else {
          currentBranch.children?.push({
            id: `sub_${idx}`,
            title: cleanText,
            color: currentBranch.color,
          });
        }
      }
    }
  });

  // Limit branches for optical layout quality (max 8)
  rootNode.children = branches.slice(0, 8);
  return rootNode;
}

/**
 * Converts a structured MindMapNode tree into drawing commands for the Chalkboard canvas (0..100 coord space).
 */
export function generateMindMapDrawCommands(root: MindMapNode): MindMapResult {
  const drawings: DrawCommand[] = [];
  let totalNodeCount = 1;

  const centerTitle = formatNodeLabel(root.title, 24);
  const centralColor = root.color || "purple";

  // 1. Render Central Node (Center of Canvas: 50, 50)
  const cx = 50;
  const cy = 50;
  const cWidth = 24;
  const cHeight = 12;

  drawings.push({
    type: "roundrect",
    x1: cx - cWidth / 2,
    y1: cy - cHeight / 2,
    x2: cx + cWidth / 2,
    y2: cy + cHeight / 2,
    color: centralColor,
    thickness: 2,
  });

  drawings.push({
    type: "text",
    x1: cx,
    y1: cy,
    text: `💡 ${centerTitle.toUpperCase()}`,
    color: centralColor,
  });

  const branches = root.children || [];
  const numBranches = branches.length;

  if (numBranches > 0) {
    const radiusX = 32;
    const radiusY = 30;

    branches.forEach((branch, idx) => {
      totalNodeCount++;
      // Evenly distribute radial angles starting from top (-pi/2)
      const angle = (2 * Math.PI * idx) / numBranches - Math.PI / 2;

      // Calculate Branch Node Center (0..100)
      let bx = Math.round(cx + radiusX * Math.cos(angle));
      let by = Math.round(cy + radiusY * Math.sin(angle));

      // Clamp to stay within canvas bounds
      bx = Math.max(12, Math.min(88, bx));
      by = Math.max(12, Math.min(88, by));

      const branchColor = branch.color || COLOR_PALETTE[idx % COLOR_PALETTE.length];
      const branchLabel = formatNodeLabel(branch.title, 20);

      // Connecting Arrow from Central Node to Branch
      drawings.push({
        type: "arrow",
        x1: cx,
        y1: cy,
        x2: bx,
        y2: by,
        color: "white",
        thickness: 1,
      });

      // Branch Shape (RoundRect or Oval)
      const bW = 18;
      const bH = 8;
      drawings.push({
        type: "roundrect",
        x1: bx - bW / 2,
        y1: by - bH / 2,
        x2: bx + bW / 2,
        y2: by + bH / 2,
        color: branchColor,
        thickness: 2,
      });

      // Branch Label
      drawings.push({
        type: "text",
        x1: bx,
        y1: by,
        text: branchLabel,
        color: branchColor,
      });

      // Render Sub-children (Level 2 Nodes)
      const subChildren = branch.children || [];
      const numSub = Math.min(subChildren.length, 3); // Max 3 sub-nodes per branch

      if (numSub > 0) {
        const subRadius = 14;
        const spreadAngle = 0.45; // Spread angle in radians

        subChildren.slice(0, numSub).forEach((sub, sIdx) => {
          totalNodeCount++;
          // Offset angle relative to branch angle
          const subAngle = angle + (sIdx - (numSub - 1) / 2) * spreadAngle;

          let sx = Math.round(bx + subRadius * Math.cos(subAngle));
          let sy = Math.round(by + subRadius * Math.sin(subAngle));

          sx = Math.max(8, Math.min(92, sx));
          sy = Math.max(8, Math.min(92, sy));

          const subLabel = formatNodeLabel(sub.title, 16);

          // Line connecting Branch to Sub-node
          drawings.push({
            type: "line",
            x1: bx,
            y1: by,
            x2: sx,
            y2: sy,
            color: branchColor,
            thickness: 1,
          });

          // Sub-node Circle shape
          drawings.push({
            type: "circle",
            x1: sx,
            y1: sy,
            x2: sx + 3,
            y2: sy + 3,
            color: branchColor,
            thickness: 1,
          });

          // Sub-node Text
          drawings.push({
            type: "text",
            x1: sx,
            y1: sy + 4,
            text: subLabel,
            color: "white",
          });
        });
      }
    });
  }

  // Construct Markdown Outline Summary for Whiteboard text view
  let markdownSummary = `### 💡 Core Concept: ${root.title}\n\n`;
  if (branches.length > 0) {
    branches.forEach((b, i) => {
      markdownSummary += `#### ${i + 1}. ${b.title}\n`;
      if (b.children && b.children.length > 0) {
        b.children.forEach((sub) => {
          markdownSummary += `  - **${sub.title}**`;
          if (sub.details && sub.details.length > 0) {
            markdownSummary += `: ${sub.details.join(", ")}`;
          }
          markdownSummary += `\n`;
        });
      }
      markdownSummary += `\n`;
    });
  } else {
    markdownSummary += `*Single node mind map created for: "${root.title}"*\n`;
  }

  return {
    title: root.title,
    drawings,
    markdownSummary,
    nodeCount: totalNodeCount,
  };
}

/**
 * Attempts to analyze text using AI for rich concept extraction, falling back to client parser on error/offline.
 */
export async function generateAIMindMapFromText(
  text: string,
  modelId: string = "gemini-3.8-flash"
): Promise<MindMapResult> {
  const cleanInput = text.trim();
  if (!cleanInput) {
    const fallbackRoot = parseTextToMindMap("Mind Map");
    return generateMindMapDrawCommands(fallbackRoot);
  }

  try {
    const res = await fetch("/api/chat/subagent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Extract a structured mind map concept hierarchy from the following highlighted text.
Return ONLY a valid JSON object matching this TypeScript interface:
{
  "title": "Central Topic Name (max 5 words)",
  "branches": [
    {
      "title": "Branch Topic 1",
      "children": [
        { "title": "Sub-concept A" },
        { "title": "Sub-concept B" }
      ]
    }
  ]
}

Highlighted text:
"""
${cleanInput}
"""`,
        modelId,
        subAgentSystemPrompt:
          "You are an expert concept visualizer. Output strictly valid JSON without markdown code blocks, containing a central title and 3 to 6 logical branches with concise labels.",
        userContext: "Creating visual mind map diagram for Study Pad notes.",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const replyText = data.text || "";
      // Extract JSON block if returned inside markdown quotes
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.title) {
          const rootNode: MindMapNode = {
            id: "root_ai",
            title: parsed.title,
            color: "purple",
            children: (parsed.branches || []).map((b: any, idx: number) => ({
              id: `b_ai_${idx}`,
              title: b.title || `Concept ${idx + 1}`,
              color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
              children: (b.children || []).map((c: any, cIdx: number) => ({
                id: `c_ai_${idx}_${cIdx}`,
                title: typeof c === "string" ? c : c.title || "",
              })),
            })),
          };
          return generateMindMapDrawCommands(rootNode);
        }
      }
    }
  } catch (err) {
    console.warn("AI Mind Map parsing fallback to instant client parser:", err);
  }

  // Fallback to client-side parser
  const clientRoot = parseTextToMindMap(cleanInput);
  return generateMindMapDrawCommands(clientRoot);
}

export interface WorkflowStep {
  title: string;
  description?: string;
  type?: "step" | "decision" | "storage" | "output";
  connectsToNext?: boolean;
  branchNote?: string;
}

/**
 * Converts sequential workflow steps into visually clear flowchart/mind-map draw commands on the chalkboard.
 */
export function generateWorkflowDrawCommands(
  title: string,
  steps: WorkflowStep[],
  notesSummary?: string
): MindMapResult {
  const drawings: DrawCommand[] = [];
  const count = Math.max(1, steps.length);

  // 1. Header Title at Top Center
  drawings.push({
    type: "roundrect",
    x1: 25,
    y1: 6,
    x2: 75,
    y2: 15,
    color: "purple",
    thickness: 2,
  });
  drawings.push({
    type: "text",
    x1: 50,
    y1: 10.5,
    text: `⚡ WORKFLOW: ${formatNodeLabel(title, 30).toUpperCase()}`,
    color: "purple",
  });

  // Calculate coordinates for sequential steps
  // If <= 4 steps: single row from left to right (y ~ 45)
  // If > 4 steps: 2 rows (snake/zigzag)
  const isSingleRow = count <= 4;
  const colors = ["cyan", "mint", "gold", "rose", "purple", "cyan"];

  if (isSingleRow) {
    const spacing = 76 / count;
    steps.forEach((step, idx) => {
      const cx = 15 + idx * spacing + spacing / 2;
      const cy = 48;
      const w = Math.min(spacing * 0.78, 18);
      const h = 14;
      const color = colors[idx % colors.length];

      // Step Box
      const isDecision = step.type === "decision";
      drawings.push({
        type: isDecision ? "diamond" : "roundrect",
        x1: cx - w / 2,
        y1: cy - h / 2,
        x2: cx + w / 2,
        y2: cy + h / 2,
        color,
        thickness: 2,
      });

      // Step Number Badge
      drawings.push({
        type: "circle",
        x1: cx - w / 2 + 2,
        y1: cy - h / 2 + 2,
        x2: cx - w / 2 + 5,
        y2: cy - h / 2 + 5,
        color,
        thickness: 1,
      });

      // Step Label
      drawings.push({
        type: "text",
        x1: cx,
        y1: cy - 1.5,
        text: `Step ${idx + 1}`,
        color: "white",
      });
      drawings.push({
        type: "text",
        x1: cx,
        y1: cy + 2.5,
        text: formatNodeLabel(step.title, 16),
        color,
      });

      // Connecting Arrow to next step
      if (idx < steps.length - 1) {
        const nextCx = 15 + (idx + 1) * spacing + spacing / 2;
        const nextW = Math.min(spacing * 0.78, 18);
        drawings.push({
          type: "arrow",
          x1: cx + w / 2,
          y1: cy,
          x2: nextCx - nextW / 2,
          y2: cy,
          color: "white",
          thickness: 2,
        });

        if (step.branchNote) {
          drawings.push({
            type: "text",
            x1: (cx + w / 2 + nextCx - nextW / 2) / 2,
            y1: cy - 4,
            text: formatNodeLabel(step.branchNote, 12),
            color: "gold",
          });
        }
      }
    });
  } else {
    // 2 Rows Zigzag (Row 1: Left to Right, Row 2: Right to Left)
    const row1Count = Math.ceil(count / 2);
    const row2Count = count - row1Count;

    // Row 1
    const spacing1 = 76 / row1Count;
    for (let idx = 0; idx < row1Count; idx++) {
      const step = steps[idx];
      const cx = 15 + idx * spacing1 + spacing1 / 2;
      const cy = 34;
      const w = Math.min(spacing1 * 0.75, 17);
      const h = 13;
      const color = colors[idx % colors.length];

      drawings.push({
        type: step.type === "decision" ? "diamond" : "roundrect",
        x1: cx - w / 2,
        y1: cy - h / 2,
        x2: cx + w / 2,
        y2: cy + h / 2,
        color,
        thickness: 2,
      });

      drawings.push({
        type: "text",
        x1: cx,
        y1: cy - 1.5,
        text: `Step ${idx + 1}`,
        color: "white",
      });
      drawings.push({
        type: "text",
        x1: cx,
        y1: cy + 2.5,
        text: formatNodeLabel(step.title, 14),
        color,
      });

      // Arrow to next in Row 1
      if (idx < row1Count - 1) {
        const nextCx = 15 + (idx + 1) * spacing1 + spacing1 / 2;
        const nextW = Math.min(spacing1 * 0.75, 17);
        drawings.push({
          type: "arrow",
          x1: cx + w / 2,
          y1: cy,
          x2: nextCx - nextW / 2,
          y2: cy,
          color: "white",
          thickness: 2,
        });
      } else if (row2Count > 0) {
        // Arrow connecting Row 1 end down to Row 2 start
        drawings.push({
          type: "arrow",
          x1: cx,
          y1: cy + h / 2,
          x2: cx,
          y2: 66 - 6.5,
          color: "white",
          thickness: 2,
        });
      }
    }

    // Row 2 (Right to Left)
    const spacing2 = 76 / Math.max(1, row2Count);
    for (let j = 0; j < row2Count; j++) {
      const idx = row1Count + j;
      const step = steps[idx];
      // Right to left position
      const cx = 85 - (j * spacing2 + spacing2 / 2);
      const cy = 66;
      const w = Math.min(spacing2 * 0.75, 17);
      const h = 13;
      const color = colors[idx % colors.length];

      drawings.push({
        type: step.type === "decision" ? "diamond" : "roundrect",
        x1: cx - w / 2,
        y1: cy - h / 2,
        x2: cx + w / 2,
        y2: cy + h / 2,
        color,
        thickness: 2,
      });

      drawings.push({
        type: "text",
        x1: cx,
        y1: cy - 1.5,
        text: `Step ${idx + 1}`,
        color: "white",
      });
      drawings.push({
        type: "text",
        x1: cx,
        y1: cy + 2.5,
        text: formatNodeLabel(step.title, 14),
        color,
      });

      // Arrow to next in Row 2 (moving leftward)
      if (j < row2Count - 1) {
        const nextCx = 85 - ((j + 1) * spacing2 + spacing2 / 2);
        const nextW = Math.min(spacing2 * 0.75, 17);
        drawings.push({
          type: "arrow",
          x1: cx - w / 2,
          y1: cy,
          x2: nextCx + nextW / 2,
          y2: cy,
          color: "white",
          thickness: 2,
        });
      }
    }
  }

  // Markdown summary
  let markdown = `# ⚡ Workflow: ${title}\n\n`;
  if (notesSummary) {
    markdown += `${notesSummary}\n\n---\n\n`;
  }
  markdown += `### 🔄 Step-by-Step Flow Execution:\n`;
  steps.forEach((s, i) => {
    markdown += `**Step ${i + 1}: ${s.title}**\n`;
    if (s.description) markdown += `> ${s.description}\n`;
    if (s.branchNote) markdown += `*Condition/Trigger:* \`${s.branchNote}\`\n`;
    markdown += `\n`;
  });

  return {
    title,
    drawings,
    markdownSummary: markdown,
    nodeCount: count + 1,
    diagramType: "workflow",
  };
}

/**
 * Enhanced Voice-to-Mindmap engine that translates spoken transcripts of complex
 * relationships or workflows into rich interactive chalkboard diagrams.
 */
export async function generateVoiceToMindMap(
  spokenText: string,
  modelId: string = "gemini-3.8-flash"
): Promise<MindMapResult> {
  const cleaned = cleanSpokenTranscript(spokenText);
  const lower = cleaned.toLowerCase();

  const isWorkflow =
    lower.includes("flow") ||
    lower.includes("workflow") ||
    lower.includes("pipeline") ||
    lower.includes("step") ||
    lower.includes("process") ||
    lower.includes("first") ||
    lower.includes("then") ||
    lower.includes("procedure");

  try {
    const prompt = isWorkflow
      ? `The user is describing a process, sequence of events, or workflow verbally:
"${cleaned}"

Extract this workflow into a clear step-by-step pipeline.
Output ONLY a valid JSON object matching this schema:
{
  "title": "Clear Workflow Title (max 5 words)",
  "summary": "1-2 sentence high-level summary of what this workflow accomplishes.",
  "steps": [
    {
      "title": "Concise Step Name (max 3 words)",
      "description": "What happens in this step",
      "type": "step"
    }
  ]
}`
      : `The user is describing complex relationships, concepts, or system architecture verbally:
"${cleaned}"

Extract this into a structured mind map concept hierarchy.
Output ONLY a valid JSON object matching this schema:
{
  "title": "Central Topic Name (max 5 words)",
  "summary": "1-2 sentence overview of the relationship network.",
  "branches": [
    {
      "title": "Branch Topic",
      "children": [
        { "title": "Sub-concept or connected entity" }
      ]
    }
  ]
}`;

    const res = await fetch("/api/chat/subagent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        modelId,
        subAgentSystemPrompt:
          "You are MAHR's Voice-to-Mindmap architecture engine. Convert verbal user descriptions of workflows and complex relationships into clean, structured JSON diagram data. Output strictly valid JSON without preamble.",
        userContext: "Voice-to-Mindmap conversion during live tutoring session.",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const replyText = data.text || "";
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (isWorkflow && parsed.steps && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          return generateWorkflowDrawCommands(
            parsed.title || "Spoken Workflow",
            parsed.steps,
            parsed.summary
          );
        } else if (parsed && parsed.title) {
          const rootNode: MindMapNode = {
            id: "voice_root",
            title: parsed.title,
            color: "purple",
            children: (parsed.branches || []).map((b: any, idx: number) => ({
              id: `vb_${idx}`,
              title: b.title || `Branch ${idx + 1}`,
              color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
              children: (b.children || []).map((c: any, cIdx: number) => ({
                id: `vc_${idx}_${cIdx}`,
                title: typeof c === "string" ? c : c.title || "",
              })),
            })),
          };
          const result = generateMindMapDrawCommands(rootNode);
          if (parsed.summary) {
            result.markdownSummary = `> 🎙️ *Spoken Overview:* ${parsed.summary}\n\n` + result.markdownSummary;
          }
          result.diagramType = "mindmap";
          return result;
        }
      }
    }
  } catch (err) {
    console.warn("[VoiceToMindMap] AI generation fallback to client parser:", err);
  }

  // Client-side fallback for spoken words
  if (isWorkflow) {
    // Break into steps by sentence or transitional words
    const stepPhrases = cleaned
      .split(/(?:\. |\b(?:then|next|after that|finally|first|second|third|step \d+)\b)/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 4);

    const fallbackSteps: WorkflowStep[] = (stepPhrases.length > 0 ? stepPhrases : [cleaned])
      .slice(0, 6)
      .map((phrase, i) => ({
        title: phrase.length > 20 ? phrase.substring(0, 18) + ".." : phrase,
        description: phrase,
        type: "step",
      }));

    return generateWorkflowDrawCommands("Workflow Diagram", fallbackSteps);
  }

  // Default to standard mind map
  const fallbackRoot = parseTextToMindMap(cleaned);
  return generateMindMapDrawCommands(fallbackRoot);
}

/**
 * Interactively expands a specific mind map node by querying the AI/vector memory engine.
 * Generates structured sub-branches that can be seamlessly merged into any existing mind map tree.
 */
export async function expandMindMapNodeWithAI(
  nodeTitle: string,
  contextTopic: string = "",
  modelId: string = "gemini-3.8-flash"
): Promise<{ title: string; children: Array<{ title: string; details?: string[] }> }> {
  try {
    const prompt = `You are MAHR's deep mind-map concept expansion engine.
The user wants to deeply expand the concept: "${nodeTitle}" in the context of "${contextTopic || nodeTitle}".

Generate 3 to 4 insightful, technically rigorous sub-branches or connected sub-concepts for "${nodeTitle}".
Output strictly valid JSON with no conversational text or markdown codeblocks outside the JSON:
{
  "title": "${nodeTitle}",
  "children": [
    {
      "title": "Sub-concept title (max 4 words)",
      "details": ["Key takeaway or formula", "Practical implementation detail"]
    }
  ]
}`;

    const res = await fetch("/api/chat/subagent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        modelId,
        subAgentSystemPrompt:
          "You are MAHR's concept expansion subagent. Provide highly accurate sub-branches for concept trees. Return strictly JSON.",
        userContext: "Dynamic mind map expansion during study session.",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const replyText = data.text || "";
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && Array.isArray(parsed.children) && parsed.children.length > 0) {
          return {
            title: nodeTitle,
            children: parsed.children.map((c: any) => ({
              title: typeof c === "string" ? c : c.title || "Expanded Node",
              details: Array.isArray(c.details) ? c.details : []
            }))
          };
        }
      }
    }
  } catch (err) {
    console.warn("[expandMindMapNodeWithAI] AI fetch failed, using smart heuristic:", err);
  }

  // Fallback heuristic expansion
  return {
    title: nodeTitle,
    children: [
      { title: `${nodeTitle} Principles`, details: ["Fundamental axioms and underlying laws", "Core operational parameters"] },
      { title: `${nodeTitle} Implementation`, details: ["Applied workflow and step-by-step logic", "Architecture considerations"] },
      { title: `${nodeTitle} Edge Cases`, details: ["Failure modes and mitigation strategies", "Safety and verification boundaries"] }
    ]
  };
}

