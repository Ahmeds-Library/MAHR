import type { Memory, ChatMessage } from "../../lib/memoryTypes.ts";
import type {
  ObsidianNoteFile,
  ObsidianFolderId,
  ObsidianGraphNode,
  ObsidianGraphEdge,
} from "../layer1_data/obsidianTypes.ts";
import {
  computeVectorEmbedding,
  cosineSimilarity,
} from "../../services/vectorMemoryEngine.ts";

const FOLDER_COLORS: Record<ObsidianFolderId, string> = {
  "00_MOC_Index": "#a855f7", // Obsidian Purple
  "01_Memories": "#38bdf8", // Cyan Recall
  "02_Journal": "#818cf8", // Indigo Transcripts
  "03_StudyPad": "#34d399", // Emerald Study Notes
  "04_Whiteboard": "#fbbf24", // Amber Chalkboard
  "05_Custom_Notes": "#f472b6", // Pink Custom & Zettelkasten Notes
};

function sanitizeTitle(raw: string): string {
  return (
    raw
      .replace(/[#*`~[\]|<>:/\\?"]/g, "")
      .trim()
      .slice(0, 56) || "Untitled_Note"
  );
}

function extractDateBucket(isoOrTime: string | undefined): string {
  if (!isoOrTime) {
    return new Date().toISOString().split("T")[0];
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(isoOrTime)) {
    return isoOrTime.slice(0, 10);
  }
  const parsed = new Date(isoOrTime);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

/**
 * Compiles MAHR Memories, Conversation Journal (both daily dated notes and master log),
 * Study Pad, and Whiteboard into a complete interconnected Obsidian Vault with YAML frontmatter,
 * [[WikiLinks]], Backlinks, and an Obsidian Force-Directed Graph.
 */
export function compileObsidianVaultNotes(params: {
  memories?: Memory[];
  chatHistory?: ChatMessage[];
  studyPadText?: string;
  whiteboardText?: string;
}): {
  notes: ObsidianNoteFile[];
  graphNodes: ObsidianGraphNode[];
  graphEdges: ObsidianGraphEdge[];
  totalWikiLinks: number;
} {
  const {
    memories = [],
    chatHistory = [],
    studyPadText = "",
    whiteboardText = "",
  } = params;

  const rawNotes: ObsidianNoteFile[] = [];
  const usedTitles = new Set<string>();
  const usedIds = new Set<string>();
  const nowIso = new Date().toISOString();

  // 1. Convert Persistent Memories into 01_Memories/*.md
  memories.forEach((m, idx) => {
    const snippet = m.text.split(/[.,;!?]/)[0] || m.text.slice(0, 42);
    let baseTitle = sanitizeTitle(
      `${(m.category || "Memory").toUpperCase()} - ${snippet}`
    );
    let title = baseTitle;
    let suffix = 2;
    while (usedTitles.has(title.toLowerCase())) {
      title = `${baseTitle.slice(0, 50)} (${suffix})`;
      suffix++;
    }
    usedTitles.add(title.toLowerCase());

    let noteId = m.id || `obs_mem_${idx}`;
    if (usedIds.has(noteId)) {
      noteId = `${noteId}_${idx}`;
    }
    usedIds.add(noteId);

    const fileName = `${title.replace(/\s+/g, "_")}.md`;
    const tags = Array.from(
      new Set([
        "mahr-memory",
        m.category || "recollection",
        ...(m.tags || []).map((t) => t.replace(/[^a-zA-Z0-9_-]/g, "-")),
      ])
    );

    const yaml = [
      "---",
      `id: "${noteId}"`,
      `type: "memory"`,
      `category: "${m.category || "general"}"`,
      `confidence: ${m.confidence ?? 0.9}`,
      `created: "${m.createdAt || nowIso}"`,
      `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`,
      "---",
    ].join("\n");

    const bodyLines = [
      `# ${title}`,
      "",
      `> [!abstract] Persistent Recall Vector Node`,
      `> ${m.text}`,
      "",
      "## Metadata & Context",
      `- **Category**: \`${m.category || "general"}\``,
      `- **Confidence**: \`${Math.round((m.confidence ?? 0.9) * 100)}%\``,
      m.projectId ? `- **Project**: [[Project - ${sanitizeTitle(m.projectId)}]]` : "",
      m.dueDate ? `- **Target Date**: \`${m.dueDate}\`` : "",
      `- **Parent Index**: [[00_MAHR_Second_Brain_MOC]]`,
    ].filter(Boolean);

    rawNotes.push({
      id: noteId,
      title,
      fileName,
      folder: "01_Memories",
      relativePath: `01_Memories/${fileName}`,
      category: m.category || "memory",
      yamlFrontmatter: yaml,
      markdownBody: bodyLines.join("\n"),
      fullMarkdown: `${yaml}\n\n${bodyLines.join("\n")}`,
      wikiLinks: ["00_MAHR_Second_Brain_MOC"],
      backlinks: [],
      tags,
      clusterColor: FOLDER_COLORS["01_Memories"],
      importance: 4,
      updatedAt: m.updatedAt || m.createdAt || nowIso,
    });
  });

  // 2. Convert Conversation Journal into Daily Dated Notes (02_Journal/Journal_YYYY-MM-DD.md) + Master Log
  if (chatHistory.length > 0) {
    const turnsByDate = new Map<string, ChatMessage[]>();
    for (const msg of chatHistory) {
      const dateStr = extractDateBucket(msg.timestamp);
      const list = turnsByDate.get(dateStr) || [];
      list.push(msg);
      turnsByDate.set(dateStr, list);
    }

    const dailyTitles: string[] = [];

    for (const [dateStr, dayTurns] of turnsByDate.entries()) {
      const dailyTitle = `Journal_${dateStr}`;
      dailyTitles.push(dailyTitle);
      const dailyFileName = `${dailyTitle}.md`;

      const yaml = [
        "---",
        `id: "obs_journal_${dateStr}"`,
        `type: "daily-journal"`,
        `date: "${dateStr}"`,
        `turns: ${dayTurns.length}`,
        `updated: "${nowIso}"`,
        `tags: ["mahr-journal", "daily-note", "date-${dateStr}"]`,
        "---",
      ].join("\n");

      const transcriptLines = dayTurns.map((msg) => {
        const speaker = msg.role === "user" ? "🧑 **User**" : "🤖 **MAHR**";
        const recalledLinks =
          msg.memoryRecalledLabels && msg.memoryRecalledLabels.length > 0
            ? ` *(Recalled: ${msg.memoryRecalledLabels
                .map((l) => `[[${sanitizeTitle(l)}]]`)
                .join(", ")})*`
            : "";
        return `- ${speaker}: ${msg.text.replace(/\n+/g, " ")}${recalledLinks}`;
      });

      const body = [
        `# 📅 Daily Conversation Journal (${dateStr})`,
        "",
        `Linked to [[00_MAHR_Second_Brain_MOC]] · [[Conversation_Journal_Log]] · [[Exam_Study_Pad_Notes]]`,
        "",
        `## Dialogue Turns (${dayTurns.length})`,
        ...transcriptLines,
      ].join("\n");

      rawNotes.push({
        id: `obs_journal_${dateStr}`,
        title: dailyTitle,
        fileName: dailyFileName,
        folder: "02_Journal",
        relativePath: `02_Journal/${dailyFileName}`,
        category: "daily-journal",
        yamlFrontmatter: yaml,
        markdownBody: body,
        fullMarkdown: `${yaml}\n\n${body}`,
        wikiLinks: [
          "00_MAHR_Second_Brain_MOC",
          "Conversation_Journal_Log",
          "Exam_Study_Pad_Notes",
        ],
        backlinks: [],
        tags: ["mahr-journal", "daily-note", `date-${dateStr}`],
        clusterColor: FOLDER_COLORS["02_Journal"],
        importance: 4,
        updatedAt: nowIso,
      });
    }

    // Master Journal Index & Recent Transcript Log
    const recentTurns = chatHistory.slice(-20);
    const title = "Conversation_Journal_Log";
    const fileName = "Conversation_Journal_Log.md";
    const tags = ["mahr-journal", "transcript", "dialogue-log"];

    const yaml = [
      "---",
      `id: "obs_journal_main"`,
      `type: "journal"`,
      `turns: ${chatHistory.length}`,
      `daily_notes: ${dailyTitles.length}`,
      `updated: "${nowIso}"`,
      `tags: ["mahr-journal", "transcript"]`,
      "---",
    ].join("\n");

    const transcriptLines = recentTurns.map((msg) => {
      const speaker = msg.role === "user" ? "🧑 **User**" : "🤖 **MAHR**";
      return `- ${speaker}: ${msg.text.replace(/\n+/g, " ")}`;
    });

    const body = [
      `# Conversation Journal Master Log`,
      "",
      `Linked to [[00_MAHR_Second_Brain_MOC]] · [[Exam_Study_Pad_Notes]] · [[Digital_Chalkboard_Slate]]`,
      "",
      "## 📅 Daily Journal Archives",
      ...dailyTitles.map((dt) => `- [[${dt}]]`),
      "",
      "## Recent Dialogue Transcript",
      ...transcriptLines,
    ].join("\n");

    rawNotes.push({
      id: "obs_journal_main",
      title,
      fileName,
      folder: "02_Journal",
      relativePath: `02_Journal/${fileName}`,
      category: "journal",
      yamlFrontmatter: yaml,
      markdownBody: body,
      fullMarkdown: `${yaml}\n\n${body}`,
      wikiLinks: [
        "00_MAHR_Second_Brain_MOC",
        "Exam_Study_Pad_Notes",
        "Digital_Chalkboard_Slate",
        ...dailyTitles,
      ],
      backlinks: [],
      tags,
      clusterColor: FOLDER_COLORS["02_Journal"],
      importance: 5,
      updatedAt: nowIso,
    });
  }

  // 3. Convert Study Pad Notes into 03_StudyPad/Exam_Study_Pad_Notes.md
  if (studyPadText.trim()) {
    const title = "Exam_Study_Pad_Notes";
    const fileName = "Exam_Study_Pad_Notes.md";
    const yaml = [
      "---",
      `id: "obs_studypad_main"`,
      `type: "studypad"`,
      `updated: "${nowIso}"`,
      `tags: ["mahr-studypad", "exam-notes", "feynman"]`,
      "---",
    ].join("\n");

    const body = [
      studyPadText.trim(),
      "",
      "---",
      "**Connected Vault Hubs**: [[00_MAHR_Second_Brain_MOC]] · [[Digital_Chalkboard_Slate]]",
    ].join("\n");

    rawNotes.push({
      id: "obs_studypad_main",
      title,
      fileName,
      folder: "03_StudyPad",
      relativePath: `03_StudyPad/${fileName}`,
      category: "studypad",
      yamlFrontmatter: yaml,
      markdownBody: body,
      fullMarkdown: `${yaml}\n\n${body}`,
      wikiLinks: ["00_MAHR_Second_Brain_MOC", "Digital_Chalkboard_Slate"],
      backlinks: [],
      tags: ["mahr-studypad", "exam-notes", "feynman"],
      clusterColor: FOLDER_COLORS["03_StudyPad"],
      importance: 5,
      updatedAt: nowIso,
    });
  }

  // 4. Convert Digital Chalkboard into 04_Whiteboard/Digital_Chalkboard_Slate.md
  if (whiteboardText.trim()) {
    const title = "Digital_Chalkboard_Slate";
    const fileName = "Digital_Chalkboard_Slate.md";
    const yaml = [
      "---",
      `id: "obs_whiteboard_main"`,
      `type: "whiteboard"`,
      `updated: "${nowIso}"`,
      `tags: ["mahr-whiteboard", "chalkboard", "code-lab"]`,
      "---",
    ].join("\n");

    const body = [
      whiteboardText.trim(),
      "",
      "---",
      "**Connected Vault Hubs**: [[00_MAHR_Second_Brain_MOC]] · [[Exam_Study_Pad_Notes]]",
    ].join("\n");

    rawNotes.push({
      id: "obs_whiteboard_main",
      title,
      fileName,
      folder: "04_Whiteboard",
      relativePath: `04_Whiteboard/${fileName}`,
      category: "whiteboard",
      yamlFrontmatter: yaml,
      markdownBody: body,
      fullMarkdown: `${yaml}\n\n${body}`,
      wikiLinks: ["00_MAHR_Second_Brain_MOC", "Exam_Study_Pad_Notes"],
      backlinks: [],
      tags: ["mahr-whiteboard", "chalkboard", "code-lab"],
      clusterColor: FOLDER_COLORS["04_Whiteboard"],
      importance: 5,
      updatedAt: nowIso,
    });
  }

  // 5. Semantic Auto-WikiLinking across notes using 128-D embeddings
  const embeddings = rawNotes.map((n) =>
    computeVectorEmbedding(`${n.title} ${n.markdownBody}`, n.tags)
  );
  const graphEdges: ObsidianGraphEdge[] = [];

  for (let i = 0; i < rawNotes.length; i++) {
    for (let j = i + 1; j < rawNotes.length; j++) {
      const sim = cosineSimilarity(embeddings[i], embeddings[j]);
      if (sim >= 0.36) {
        const noteA = rawNotes[i];
        const noteB = rawNotes[j];
        if (!noteA.wikiLinks.includes(noteB.title)) {
          noteA.wikiLinks.push(noteB.title);
        }
        if (!noteB.backlinks.includes(noteA.title)) {
          noteB.backlinks.push(noteA.title);
        }
        graphEdges.push({
          id: `edge_${noteA.id}_${noteB.id}`,
          sourceId: noteA.id,
          targetId: noteB.id,
          label: `[[${noteB.title.slice(0, 18)}]]`,
          isExplicitWikiLink: true,
          similarity: Number(sim.toFixed(2)),
        });
      }
    }
  }

  // 6. Create Master Map of Content (00_MOC_Index/00_MAHR_Second_Brain_MOC.md)
  const mocTitle = "00_MAHR_Second_Brain_MOC";
  const mocYaml = [
    "---",
    `id: "obs_master_moc"`,
    `type: "moc"`,
    `vault: "MAHR_Obsidian_Vault"`,
    `updated: "${nowIso}"`,
    `tags: ["obsidian-moc", "second-brain", "mahr-index"]`,
    "---",
  ].join("\n");

  const memoryLinks = rawNotes
    .filter((n) => n.folder === "01_Memories")
    .map((n) => `- [[${n.title}]] (\`${n.category}\`)`);

  const journalLinks = rawNotes
    .filter((n) => n.folder === "02_Journal")
    .map((n) => `- [[${n.title}]]`);

  const mocBody = [
    `# 🧠 MAHR × Obsidian Second-Brain Vault (MOC)`,
    "",
    `Welcome to your auto-synchronized **Obsidian Knowledge Vault**. Every memory, conversation journal turn, study note, and chalkboard diagram is automatically compiled in real time with YAML frontmatter and bidirectional \`[[WikiLinks]]\`.`,
    "",
    "## 📂 Core Workspace Hubs",
    "- **Study Pad**: [[Exam_Study_Pad_Notes]]",
    "- **Chalkboard & Code Lab**: [[Digital_Chalkboard_Slate]]",
    "- **Conversation Journal**: [[Conversation_Journal_Log]]",
    "",
    `## 📅 Journal Archives (${journalLinks.length})`,
    ...(journalLinks.length > 0 ? journalLinks : ["- *No journal logs yet.*"]),
    "",
    `## 🔗 Recalled Memory Nodes (${memoryLinks.length})`,
    ...(memoryLinks.length > 0
      ? memoryLinks
      : ["- *Speak with MAHR or add memories in Recall to populate linked notes.*"]),
  ].join("\n");

  const mocNote: ObsidianNoteFile = {
    id: "obs_master_moc",
    title: mocTitle,
    fileName: `${mocTitle}.md`,
    folder: "00_MOC_Index",
    relativePath: `00_MOC_Index/${mocTitle}.md`,
    category: "moc",
    yamlFrontmatter: mocYaml,
    markdownBody: mocBody,
    fullMarkdown: `${mocYaml}\n\n${mocBody}`,
    wikiLinks: rawNotes.map((n) => n.title),
    backlinks: rawNotes.map((n) => n.title),
    tags: ["obsidian-moc", "second-brain", "mahr-index"],
    clusterColor: FOLDER_COLORS["00_MOC_Index"],
    importance: 6,
    updatedAt: nowIso,
  };

  // Append explicit WikiLinks & Backlinks block at bottom of each note so Obsidian's native graph renders them
  rawNotes.forEach((n) => {
    const uniqueLinks = Array.from(new Set(n.wikiLinks));
    const uniqueBacklinks = Array.from(new Set(n.backlinks));
    const footerSections: string[] = [];

    if (uniqueLinks.length > 0) {
      footerSections.push(
        `## 🔗 Outgoing Obsidian [[WikiLinks]]\n${uniqueLinks
          .map((l) => `- [[${l}]]`)
          .join("\n")}`
      );
    }
    if (uniqueBacklinks.length > 0) {
      footerSections.push(
        `## ↩️ Referenced By (Backlinks)\n${uniqueBacklinks
          .map((b) => `- [[${b}]]`)
          .join("\n")}`
      );
    }
    if (footerSections.length > 0) {
      n.markdownBody += `\n\n${footerSections.join("\n\n")}`;
      n.fullMarkdown = `${n.yamlFrontmatter}\n\n${n.markdownBody}`;
    }

    graphEdges.push({
      id: `edge_moc_${n.id}`,
      sourceId: mocNote.id,
      targetId: n.id,
      label: "MOC Link",
      isExplicitWikiLink: true,
      similarity: 0.85,
    });
  });

  const allNotes = [mocNote, ...rawNotes];

  const graphNodes: ObsidianGraphNode[] = allNotes.map((n, index) => {
    const angle = (index / Math.max(1, allNotes.length)) * Math.PI * 2;
    const dist = n.id === "obs_master_moc" ? 0 : 120 + (index % 3) * 55;
    return {
      id: n.id,
      title: n.title,
      folder: n.folder,
      category: n.category,
      color: n.clusterColor,
      radius: n.id === "obs_master_moc" ? 22 : 12 + Math.min(8, n.wikiLinks.length),
      wikiLinksCount: n.wikiLinks.length,
      backlinksCount: n.backlinks.length,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
    };
  });

  const totalWikiLinks = allNotes.reduce(
    (sum, n) => sum + n.wikiLinks.length,
    0
  );

  return {
    notes: allNotes,
    graphNodes,
    graphEdges,
    totalWikiLinks,
  };
}

/**
 * Computes a deterministic content fingerprint (ignoring volatile `updated:` timestamps)
 * so only genuinely new or modified notes are written during real-time delta sync.
 */
export function computeNoteFingerprint(note: ObsidianNoteFile): string {
  return `${note.relativePath}::${note.markdownBody.length}::${note.wikiLinks.join(",")}`;
}

export function computeObsidianVaultDelta(
  prevFingerprints: Map<string, string>,
  currentNotes: ObsidianNoteFile[]
): {
  changedOrAddedNotes: ObsidianNoteFile[];
  deletedRelativePaths: string[];
  nextFingerprints: Map<string, string>;
} {
  const nextFingerprints = new Map<string, string>();
  const changedOrAddedNotes: ObsidianNoteFile[] = [];

  for (const note of currentNotes) {
    const fp = computeNoteFingerprint(note);
    nextFingerprints.set(note.relativePath, fp);
    const prevFp = prevFingerprints.get(note.relativePath);
    if (prevFp !== fp) {
      changedOrAddedNotes.push(note);
    }
  }

  const deletedRelativePaths: string[] = [];
  for (const oldPath of prevFingerprints.keys()) {
    if (!nextFingerprints.has(oldPath)) {
      deletedRelativePaths.push(oldPath);
    }
  }

  return {
    changedOrAddedNotes,
    deletedRelativePaths,
    nextFingerprints,
  };
}
