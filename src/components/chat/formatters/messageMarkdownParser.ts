export interface InlineToken {
  type: "text" | "bold" | "italic" | "code";
  value: string;
}

export type RichMessageBlock =
  | {
      type: "code";
      language: string;
      content: string;
    }
  | {
      type: "heading";
      level: 1 | 2 | 3;
      text: string;
    }
  | {
      type: "bullet_list";
      items: string[];
    }
  | {
      type: "ordered_list";
      items: Array<{ numberLabel: string; text: string }>;
    }
  | {
      type: "blockquote";
      lines: string[];
    }
  | {
      type: "divider";
    }
  | {
      type: "paragraph";
      text: string;
    };

/**
 * Splits inline text into structured tokens: **bold**, `code`, and *italic*
 */
export function parseInlineTokens(text: string): InlineToken[] {
  if (!text) return [];
  const tokens: InlineToken[] = [];
  const tokenRegex = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    const raw = match[0];
    if (raw.startsWith("**") && raw.endsWith("**") && raw.length > 4) {
      tokens.push({
        type: "bold",
        value: raw.slice(2, -2),
      });
    } else if (raw.startsWith("`") && raw.endsWith("`") && raw.length > 2) {
      tokens.push({
        type: "code",
        value: raw.slice(1, -1),
      });
    } else if (raw.startsWith("*") && raw.endsWith("*") && raw.length > 2) {
      tokens.push({
        type: "italic",
        value: raw.slice(1, -1),
      });
    } else {
      tokens.push({
        type: "text",
        value: raw,
      });
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Parses non-code markdown text into structured blocks (headings, bullet lists,
 * ordered lists, blockquotes, dividers, and clean paragraphs).
 */
function parseMarkdownTextChunk(chunk: string): RichMessageBlock[] {
  const blocks: RichMessageBlock[] = [];
  const lines = chunk.replace(/\r\n/g, "\n").split("\n");

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal divider
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // Heading (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const hashLen = headingMatch[1].length;
      const level: 1 | 2 | 3 = hashLen === 1 ? 1 : hashLen === 2 ? 2 : 3;
      blocks.push({
        type: "heading",
        level,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Bullet list (-, *, •)
    if (/^([-*•])\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const currentTrimmed = lines[i].trim();
        const bulletMatch = currentTrimmed.match(/^([-*•])\s+(.+)$/);
        if (bulletMatch) {
          items.push(bulletMatch[2].trim());
          i++;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        blocks.push({ type: "bullet_list", items });
      }
      continue;
    }

    // Ordered list (1., 2., etc.)
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: Array<{ numberLabel: string; text: string }> = [];
      while (i < lines.length) {
        const currentTrimmed = lines[i].trim();
        const orderedMatch = currentTrimmed.match(/^(\d+)[.)]\s+(.+)$/);
        if (orderedMatch) {
          items.push({
            numberLabel: orderedMatch[1],
            text: orderedMatch[2].trim(),
          });
          i++;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        blocks.push({ type: "ordered_list", items });
      }
      continue;
    }

    // Blockquote (>)
    if (/^>\s*/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const currentTrimmed = lines[i].trim();
        const quoteMatch = currentTrimmed.match(/^>\s*(.+)$/);
        if (quoteMatch) {
          quoteLines.push(quoteMatch[1].trim());
          i++;
        } else {
          break;
        }
      }
      if (quoteLines.length > 0) {
        blocks.push({ type: "blockquote", lines: quoteLines });
      }
      continue;
    }

    // Regular paragraph (group consecutive non-empty plain lines)
    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const lineTrimmed = lines[i].trim();
      if (
        !lineTrimmed ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(lineTrimmed) ||
        /^(#{1,4})\s+/.test(lineTrimmed) ||
        /^([-*•])\s+/.test(lineTrimmed) ||
        /^\d+[.)]\s+/.test(lineTrimmed) ||
        /^>\s*/.test(lineTrimmed)
      ) {
        break;
      }
      paragraphLines.push(lineTrimmed);
      i++;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paragraphLines.join("\n"),
      });
    }
  }

  return blocks;
}

/**
 * Full message parser that extracts fenced code blocks and parses surrounding markdown blocks.
 */
export function parseRichMessageBlocks(rawText: string): RichMessageBlock[] {
  if (!rawText) return [];
  const blocks: RichMessageBlock[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      const precedingText = rawText.slice(lastIndex, match.index);
      blocks.push(...parseMarkdownTextChunk(precedingText));
    }

    blocks.push({
      type: "code",
      language: (match[1] || "code").trim(),
      content: (match[2] || "").replace(/\n$/, ""),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    blocks.push(...parseMarkdownTextChunk(rawText.slice(lastIndex)));
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: rawText }];
}
