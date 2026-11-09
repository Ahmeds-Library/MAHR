/**
 * Layer 2 — Document Parser Service for Presenton
 * Extracts readable text from uploaded .txt, .md, .csv, .json, and .pdf files.
 */

export interface ParsedDocumentResult {
  fileName: string;
  charCount: number;
  extractedText: string;
}

export async function parseUploadedDocument(file: File): Promise<ParsedDocumentResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") {
    const buffer = await file.arrayBuffer();
    const extracted = extractTextFromPdfBuffer(buffer);
    return {
      fileName: file.name,
      charCount: extracted.length,
      extractedText: extracted
    };
  }

  const rawText = await file.text();
  let cleaned = rawText;

  if (ext === "json") {
    try {
      const obj = JSON.parse(rawText);
      cleaned = JSON.stringify(obj, null, 2);
    } catch {
      cleaned = rawText;
    }
  } else if (ext === "csv") {
    cleaned = rawText
      .split(/\r?\n/)
      .slice(0, 120)
      .map((line) => line.replace(/,/g, " | "))
      .join("\n");
  }

  const trimmed = cleaned.trim().slice(0, 20000);
  return {
    fileName: file.name,
    charCount: trimmed.length,
    extractedText: trimmed
  };
}

/**
 * Lightweight client-side PDF text stream extractor for standard text-based PDFs.
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(bytes);

  const chunks: string[] = [];
  const textRegex = /\(([^()\\]{2,200})\)/g;
  let match: RegExpExecArray | null;

  while ((match = textRegex.exec(raw)) !== null) {
    const candidate = match[1]
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/[^\x20-\x7E]/g, " ")
      .trim();
    if (candidate.length > 2 && /[a-zA-Z]{2,}/.test(candidate)) {
      chunks.push(candidate);
    }
    if (chunks.join(" ").length > 18000) break;
  }

  const joined = chunks.join(" ").replace(/\s+/g, " ").trim();
  if (joined.length > 60) {
    return joined;
  }

  return `Document Reference: Uploaded PDF (${Math.round(buffer.byteLength / 1024)} KB). Use the file title and user topic to structure the presentation.`;
}
