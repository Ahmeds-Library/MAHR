export type ObsidianFolderId =
  | "00_MOC_Index"
  | "01_Memories"
  | "02_Journal"
  | "03_StudyPad"
  | "04_Whiteboard"
  | "05_Custom_Notes";

export interface ObsidianNoteFile {
  id: string;
  title: string;
  fileName: string;
  folder: ObsidianFolderId;
  relativePath: string;
  category: string;
  yamlFrontmatter: string;
  markdownBody: string;
  fullMarkdown: string;
  wikiLinks: string[]; // Outgoing [[Note Title]] links
  backlinks: string[]; // Incoming [[Note Title]] links from other notes
  tags: string[];
  clusterColor: string;
  importance: number;
  updatedAt: string;
  isCustomOrEdited?: boolean;
}

export interface ObsidianGraphNode {
  id: string;
  title: string;
  folder: ObsidianFolderId;
  category: string;
  color: string;
  radius: number;
  wikiLinksCount: number;
  backlinksCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ObsidianGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  isExplicitWikiLink: boolean;
  similarity: number;
}

export interface ObsidianGraphPhysicsConfig {
  repulsion: number; // 40 - 300, default 140
  linkDistance: number; // 50 - 220, default 110
  gravity: number; // 0.002 - 0.030, default 0.008
  frozen: boolean;
  hopFilter: "all" | "1hop" | "2hop";
}

export interface ObsidianShortestPathResult {
  found: boolean;
  nodeIds: string[];
  edgeIds: string[];
  titles: string[];
}

export interface ObsidianLinkedBacklink {
  sourceNoteId: string;
  sourceNoteTitle: string;
  sourceFolder: ObsidianFolderId;
  contextSnippet: string;
}

export interface ObsidianUnlinkedMention {
  id: string;
  sourceNoteId: string;
  sourceNoteTitle: string;
  targetNoteTitle: string;
  matchedPhrase: string;
  contextSnippet: string;
}

export interface ObsidianNoteTemplate {
  id: string;
  name: string;
  folder: ObsidianFolderId;
  category: string;
  tags: string[];
  buildMarkdown: (title: string, dateStr: string) => string;
}

export interface ObsidianDeltaSyncEvent {
  syncState: "idle" | "syncing" | "synced" | "error";
  writtenFiles: string[];
  deletedFiles: string[];
  newMemoriesSynced: number;
  newJournalTurnsSynced: number;
  totalNotes: number;
  totalWikiLinks: number;
  timestamp: string;
}

export interface ObsidianSystemStatus {
  installed: boolean;
  binaryPath: string | null;
  platform: "linux" | "win32" | "darwin" | "web";
  vaultName: string;
  vaultPath: string;
  vaultInitialized: boolean;
  totalNotesSynced: number;
  totalWikiLinks: number;
  obsidianUri: string;
  officialInstallerUrl: string;
  installerFilename: string;
  autoSetupStatus:
    | "idle"
    | "detecting"
    | "downloading"
    | "configuring"
    | "ready"
    | "launched";
  statusMessage: string;
  lastSyncedAt: string;
  lastDeltaEvent?: ObsidianDeltaSyncEvent;
}
