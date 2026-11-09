import JSZip from "jszip";
import {
  ObsidianNoteFile,
  ObsidianFolderId,
} from "../layer1_data/obsidianTypes";
import { buildCustomObsidianNote } from "./obsidianBacklinksAndTemplatesService";

/**
 * Packages the entire Obsidian Vault (.md files + .obsidian/graph.json & app.json)
 * into a downloadable .zip archive.
 */
export async function exportObsidianVaultAsZip(
  notes: ObsidianNoteFile[],
  vaultName = "MAHR_Obsidian_Vault"
): Promise<{ fileCount: number; fileName: string }> {
  const zip = new JSZip();
  const root = zip.folder(vaultName) || zip;

  // 1. Add .obsidian configuration files so opening the unzipped folder in Obsidian works out of the box
  const obsidianConfig = root.folder(".obsidian");
  if (obsidianConfig) {
    obsidianConfig.file(
      "app.json",
      JSON.stringify(
        {
          alwaysUpdateLinks: true,
          newFileLocation: "folder",
          newFileFolderPath: "05_Custom_Notes",
          attachmentFolderPath: "attachments",
          showFrontmatter: true,
        },
        null,
        2
      )
    );
    obsidianConfig.file(
      "graph.json",
      JSON.stringify(
        {
          "collapse-filter": false,
          search: "",
          showTags: true,
          showAttachments: false,
          hideUnresolved: false,
          showOrphans: true,
          "collapse-color-groups": false,
          colorGroups: [
            { query: 'path:"00_MOC_Index"', color: { a: 1, rgb: 11032055 } },
            { query: 'path:"01_Memories"', color: { a: 1, rgb: 3718648 } },
            { query: 'path:"02_Journal"', color: { a: 1, rgb: 8489976 } },
            { query: 'path:"03_StudyPad"', color: { a: 1, rgb: 3462041 } },
            { query: 'path:"04_Whiteboard"', color: { a: 1, rgb: 16498468 } },
            { query: 'path:"05_Custom_Notes"', color: { a: 1, rgb: 16019894 } },
          ],
          "collapse-display": false,
          showArrow: true,
          textFadeMultiplier: 0,
          nodeSizeMultiplier: 1.1,
          lineSizeMultiplier: 1,
          "collapse-forces": false,
          centerStrength: 0.5,
          repelStrength: 10,
          linkStrength: 1,
          linkDistance: 250,
        },
        null,
        2
      )
    );
  }

  // 2. Write every note's fullMarkdown (YAML frontmatter + Markdown body)
  for (const note of notes) {
    const cleanPath = note.relativePath || `${note.folder}/${note.fileName}`;
    root.file(cleanPath, note.fullMarkdown);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const dlFileName = `${vaultName}_${new Date().toISOString().slice(0, 10)}.zip`;

  if (typeof window !== "undefined") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = dlFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return { fileCount: notes.length, fileName: dlFileName };
}

/**
 * Imports a .zip Obsidian Vault archive, parsing all .md files into ObsidianNoteFile records.
 */
export async function importObsidianVaultFromZip(
  file: File
): Promise<ObsidianNoteFile[]> {
  const zip = await JSZip.loadAsync(file);
  const importedNotes: ObsidianNoteFile[] = [];

  const entries = Object.entries(zip.files);
  for (const [relativePath, zipEntry] of entries) {
    if (zipEntry.dir) continue;
    if (!relativePath.toLowerCase().endsWith(".md")) continue;
    if (relativePath.includes(".obsidian/")) continue;

    const rawText = await zipEntry.async("string");
    const parsed = parseRawMarkdownFileIntoNote(relativePath, rawText);
    importedNotes.push(parsed);
  }

  return importedNotes;
}

/**
 * Parses a raw .md file (with optional YAML frontmatter) into an ObsidianNoteFile.
 */
export function parseRawMarkdownFileIntoNote(
  filePath: string,
  rawMarkdown: string
): ObsidianNoteFile {
  const parts = filePath.split("/").filter(Boolean);
  const fileName = parts[parts.length - 1] || "Imported_Note.md";
  const rawTitle = fileName.replace(/\.md$/i, "");

  let folder: ObsidianFolderId = "05_Custom_Notes";
  const pathJoined = parts.join("/");
  if (pathJoined.includes("00_MOC_Index")) folder = "00_MOC_Index";
  else if (pathJoined.includes("01_Memories")) folder = "01_Memories";
  else if (pathJoined.includes("02_Journal")) folder = "02_Journal";
  else if (pathJoined.includes("03_StudyPad")) folder = "03_StudyPad";
  else if (pathJoined.includes("04_Whiteboard")) folder = "04_Whiteboard";

  let markdownBody = rawMarkdown.trim();
  if (markdownBody.startsWith("---")) {
    const endYaml = markdownBody.indexOf("---", 3);
    if (endYaml !== -1) {
      markdownBody = markdownBody.slice(endYaml + 3).trim();
    }
  }

  return buildCustomObsidianNote({
    id: `obs_import_${rawTitle.replace(/\W+/g, "_").toLowerCase()}`,
    title: rawTitle,
    folder,
    category: "imported-note",
    markdownBody,
  });
}

/**
 * Two-Way Local Folder Sync using the Browser File System Access API (showDirectoryPicker).
 * Writes all vault .md files into the selected folder and reads any new local .md files back.
 */
export async function syncObsidianVaultWithLocalDirectory(
  currentNotes: ObsidianNoteFile[]
): Promise<{
  supported: boolean;
  writtenCount: number;
  importedNotes: ObsidianNoteFile[];
  folderName: string;
}> {
  if (
    typeof window === "undefined" ||
    typeof (window as any).showDirectoryPicker !== "function"
  ) {
    return {
      supported: false,
      writtenCount: 0,
      importedNotes: [],
      folderName: "",
    };
  }

  const dirHandle = await (window as any).showDirectoryPicker({
    mode: "readwrite",
  });
  const folderName = dirHandle.name || "Local_Obsidian_Folder";

  let writtenCount = 0;
  const existingTitles = new Set(
    currentNotes.map((n) => n.title.toLowerCase())
  );
  const importedNotes: ObsidianNoteFile[] = [];

  // 1. Write current vault notes into subfolders
  for (const note of currentNotes) {
    const subDir = await dirHandle.getDirectoryHandle(note.folder, {
      create: true,
    });
    const fileHandle = await subDir.getFileHandle(note.fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(note.fullMarkdown);
    await writable.close();
    writtenCount++;
  }

  // 2. Scan top-level and known subfolders for any user-added .md files
  for await (const [entryName, entryHandle] of dirHandle.entries()) {
    if (
      entryHandle.kind === "file" &&
      entryName.toLowerCase().endsWith(".md")
    ) {
      const titleCandidate = entryName.replace(/\.md$/i, "");
      if (!existingTitles.has(titleCandidate.toLowerCase())) {
        const fileObj = await entryHandle.getFile();
        const text = await fileObj.text();
        importedNotes.push(parseRawMarkdownFileIntoNote(entryName, text));
      }
    }
  }

  return {
    supported: true,
    writtenCount,
    importedNotes,
    folderName,
  };
}
