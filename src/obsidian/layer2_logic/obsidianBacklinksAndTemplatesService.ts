import {
  ObsidianNoteFile,
  ObsidianLinkedBacklink,
  ObsidianUnlinkedMention,
  ObsidianNoteTemplate,
  ObsidianFolderId,
} from "../layer1_data/obsidianTypes";

const CUSTOM_NOTES_STORAGE_KEY = "mahr_obsidian_custom_notes_v1";

export const OBSIDIAN_NOTE_TEMPLATES: ObsidianNoteTemplate[] = [
  {
    id: "zettelkasten",
    name: "Zettelkasten Permanent Concept",
    folder: "05_Custom_Notes",
    category: "concept",
    tags: ["zettelkasten", "permanent-note", "mahr-concept"],
    buildMarkdown: (title, dateStr) =>
      [
        `# ${title}`,
        "",
        `> [!tip] Core Atomic Idea (${dateStr})`,
        `> Summarize the concept in your own words (Feynman Technique) so your future self understands it immediately.`,
        "",
        "## 1. Fundamental Mechanism",
        "- Write the primary principle or equation here.",
        "- Explain how it connects to existing mental models.",
        "",
        "## 2. Concrete Example",
        "- Real-world application or code pattern.",
        "",
        "## 🔗 Connected Vault Nodes",
        "- [[00_MAHR_Second_Brain_MOC]]",
        "- [[Exam_Study_Pad_Notes]]",
      ].join("\n"),
  },
  {
    id: "cornell_study",
    name: "Cornell Study & Exam Note",
    folder: "03_StudyPad",
    category: "studypad",
    tags: ["cornell-notes", "exam-prep", "feynman"],
    buildMarkdown: (title, dateStr) =>
      [
        `# ${title}`,
        "",
        `**Date**: \`${dateStr}\` · **Hub**: [[00_MAHR_Second_Brain_MOC]]`,
        "",
        "## 🎯 Cue Questions & Key Prompts",
        "- What is the primary bottleneck or theorem solved by this topic?",
        "- How would I explain this on the [[Digital_Chalkboard_Slate]]?",
        "",
        "## 📝 Detailed Lecture & Study Notes",
        "- Key observation 1",
        "- Key derivation or architecture flow 2",
        "",
        "## 💡 3-Sentence Feynman Summary",
        "Write a crystal-clear synthesis of the above notes here.",
      ].join("\n"),
  },
  {
    id: "architecture_spec",
    name: "Project Architecture Blueprint",
    folder: "05_Custom_Notes",
    category: "project",
    tags: ["architecture", "system-design", "3-layer"],
    buildMarkdown: (title, dateStr) =>
      [
        `# ${title}`,
        "",
        `> [!info] System Blueprint (${dateStr})`,
        `> Linked to [[00_MAHR_Second_Brain_MOC]] · [[Digital_Chalkboard_Slate]]`,
        "",
        "## Layer 1: Data & Storage Schema",
        "- Persistent state models and indexing strategy.",
        "",
        "## Layer 2: Domain & Service Logic",
        "- Core algorithms, vector embeddings, and validation pipelines.",
        "",
        "## Layer 3: Presentation & UX",
        "- Responsive layout and interactive controls.",
      ].join("\n"),
  },
];

export function loadCustomVaultNotes(): Record<string, ObsidianNoteFile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_NOTES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveCustomVaultNotes(
  notesMap: Record<string, ObsidianNoteFile>
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CUSTOM_NOTES_STORAGE_KEY,
      JSON.stringify(notesMap)
    );
  } catch {
    // Ignore quota errors
  }
}

/**
 * Extracts all [[WikiLinks]] from a Markdown string.
 */
export function extractWikiLinksFromMarkdown(markdown: string): string[] {
  const regex = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const clean = match[1].trim();
    if (clean) found.push(clean);
  }
  return Array.from(new Set(found));
}

/**
 * Extracts inline #tags from Markdown content.
 */
export function extractTagsFromMarkdown(markdown: string): string[] {
  const regex = /(?:^|\s)#([a-zA-Z0-9_-]{2,36})/g;
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    found.push(match[1]);
  }
  return Array.from(new Set(found));
}

/**
 * Builds a complete ObsidianNoteFile from a title, folder, markdownBody, and tags.
 */
export function buildCustomObsidianNote(params: {
  id?: string;
  title: string;
  folder: ObsidianFolderId;
  category?: string;
  markdownBody: string;
  tags?: string[];
}): ObsidianNoteFile {
  const cleanTitle =
    params.title.replace(/\.md$/i, "").trim() || "Untitled_Note";
  const fileName = `${cleanTitle.replace(/\s+/g, "_")}.md`;
  const id = params.id || `obs_custom_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const extractedLinks = extractWikiLinksFromMarkdown(params.markdownBody);
  if (!extractedLinks.includes("00_MAHR_Second_Brain_MOC")) {
    extractedLinks.push("00_MAHR_Second_Brain_MOC");
  }

  const inlineTags = extractTagsFromMarkdown(params.markdownBody);
  const allTags = Array.from(
    new Set(["mahr-vault", ...(params.tags || []), ...inlineTags])
  );

  const yamlFrontmatter = [
    "---",
    `id: "${id}"`,
    `type: "${params.category || "custom-note"}"`,
    `folder: "${params.folder}"`,
    `updated: "${nowIso}"`,
    `tags: [${allTags.map((t) => `"${t}"`).join(", ")}]`,
    "---",
  ].join("\n");

  const folderColorMap: Record<ObsidianFolderId, string> = {
    "00_MOC_Index": "#a855f7",
    "01_Memories": "#38bdf8",
    "02_Journal": "#818cf8",
    "03_StudyPad": "#34d399",
    "04_Whiteboard": "#fbbf24",
    "05_Custom_Notes": "#f472b6",
  };

  return {
    id,
    title: cleanTitle,
    fileName,
    folder: params.folder,
    relativePath: `${params.folder}/${fileName}`,
    category: params.category || "custom-note",
    yamlFrontmatter,
    markdownBody: params.markdownBody,
    fullMarkdown: `${yamlFrontmatter}\n\n${params.markdownBody}`,
    wikiLinks: extractedLinks,
    backlinks: [],
    tags: allTags,
    clusterColor: folderColorMap[params.folder] || "#f472b6",
    importance: 5,
    updatedAt: nowIso,
    isCustomOrEdited: true,
  };
}

/**
 * Creates or retrieves today's Daily Note (Daily_Note_YYYY-MM-DD.md).
 */
export function buildTodayDailyNote(): ObsidianNoteFile {
  const todayStr = new Date().toISOString().split("T")[0];
  const title = `Daily_Note_${todayStr}`;
  const body = [
    `# 📅 Daily Second-Brain Note (${todayStr})`,
    "",
    `Linked Hubs: [[00_MAHR_Second_Brain_MOC]] · [[Conversation_Journal_Log]] · [[Exam_Study_Pad_Notes]]`,
    "",
    "## 🌅 Top 3 Learning & Engineering Priorities",
    "- [ ] Review high-importance nodes in Recall Memory Bank",
    "- [ ] Synthesize active concepts on [[Digital_Chalkboard_Slate]]",
    "- [ ] Consolidate new unlinked mentions in the Knowledge Graph",
    "",
    "## 🧠 Key Insights & Breakthroughs Today",
    "- Document key realizations or architecture decisions from your session with MAHR.",
    "",
    "## 🔁 Evening Feynman Reflection",
    "- Which concept from today can I explain in 3 simple sentences?",
  ].join("\n");

  return buildCustomObsidianNote({
    id: `obs_daily_${todayStr}`,
    title,
    folder: "02_Journal",
    category: "daily-note",
    markdownBody: body,
    tags: ["daily-note", `date-${todayStr}`, "mahr-journal"],
  });
}

/**
 * Computes both Linked Backlinks and Unlinked Mentions for the currently selected note.
 */
export function computeBacklinksAndUnlinkedMentions(
  targetNote: ObsidianNoteFile | undefined,
  allNotes: ObsidianNoteFile[]
): {
  linkedBacklinks: ObsidianLinkedBacklink[];
  unlinkedMentions: ObsidianUnlinkedMention[];
} {
  if (!targetNote) {
    return { linkedBacklinks: [], unlinkedMentions: [] };
  }

  const linkedBacklinks: ObsidianLinkedBacklink[] = [];
  const unlinkedMentions: ObsidianUnlinkedMention[] = [];

  const targetTitleLower = targetNote.title.toLowerCase();
  // Also extract a meaningful core phrase from titles like "GOAL - Build AI Assistant" -> "Build AI Assistant"
  const rawParts = targetNote.title.split(" - ");
  const corePhrase = (
    rawParts.length > 1 ? rawParts.slice(1).join(" - ") : targetNote.title
  )
    .replace(/_/g, " ")
    .trim();
  const corePhraseLower = corePhrase.toLowerCase();

  for (const other of allNotes) {
    if (other.id === targetNote.id) continue;

    const hasExplicitLink =
      other.wikiLinks.some((w) => w.toLowerCase() === targetTitleLower) ||
      other.markdownBody.toLowerCase().includes(`[[${targetTitleLower}]]`);

    if (hasExplicitLink) {
      // Extract a clean context snippet around the link or first non-heading line
      const lines = other.markdownBody
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
      const matchingLine =
        lines.find((l) => l.toLowerCase().includes(targetTitleLower)) ||
        lines[0] ||
        other.title;

      linkedBacklinks.push({
        sourceNoteId: other.id,
        sourceNoteTitle: other.title,
        sourceFolder: other.folder,
        contextSnippet: matchingLine.slice(0, 140),
      });
    } else if (corePhraseLower.length >= 4) {
      // Check if other note's body mentions the target's title or core phrase without [[...]]
      const bodyLower = other.markdownBody.toLowerCase();
      let matchedPhrase = "";
      if (bodyLower.includes(targetTitleLower)) {
        matchedPhrase = targetNote.title;
      } else if (bodyLower.includes(corePhraseLower)) {
        matchedPhrase = corePhrase;
      } else {
        // Also check significant keyword overlap (>= 2 keywords of length >= 5)
        const keywords = corePhraseLower
          .split(/\s+/)
          .filter((w) => w.length >= 5);
        const foundWord = keywords.find((kw) => bodyLower.includes(kw));
        if (foundWord && other.id !== "obs_master_moc") {
          matchedPhrase = foundWord;
        }
      }

      if (matchedPhrase) {
        const idx = bodyLower.indexOf(matchedPhrase.toLowerCase());
        const start = Math.max(0, idx - 36);
        const end = Math.min(
          other.markdownBody.length,
          idx + matchedPhrase.length + 54
        );
        const snippet = other.markdownBody
          .slice(start, end)
          .replace(/\n+/g, " ")
          .trim();

        unlinkedMentions.push({
          id: `unlinked_${other.id}_${targetNote.id}`,
          sourceNoteId: other.id,
          sourceNoteTitle: other.title,
          targetNoteTitle: targetNote.title,
          matchedPhrase,
          contextSnippet: `…${snippet}…`,
        });
      }
    }
  }

  return {
    linkedBacklinks,
    unlinkedMentions: unlinkedMentions.slice(0, 12),
  };
}
