export type GoogleProductId =
  | "slides"
  | "drive"
  | "docs"
  | "sheets"
  | "calendar"
  | "gmail"
  | "tasks";

export type GoogleConnectionStatus =
  | "connected"
  | "needs_auth"
  | "syncing"
  | "error";

export interface GoogleProductInfo {
  id: GoogleProductId;
  name: string;
  category: "Office & Documents" | "Communication & Schedule" | "Storage & Tasks";
  iconName: string;
  description: string;
  status: GoogleConnectionStatus;
  lastSyncedAt?: string;
  itemCount?: number;
  itemLabel?: string;
  errorMessage?: string;
}

export interface GoogleUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  connectedAt: string;
}

export interface GoogleDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  location?: string;
}

export interface GoogleGmailMessageItem {
  id: string;
  threadId: string;
  snippet: string;
  from?: string;
  subject?: string;
  date?: string;
  unread?: boolean;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: "needsAction" | "completed";
  updated?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleWorkspaceOverview {
  user: GoogleUserProfile | null;
  isAuthenticated: boolean;
  products: Record<GoogleProductId, GoogleProductInfo>;
  zeroDefaultEnforced: boolean;
}
