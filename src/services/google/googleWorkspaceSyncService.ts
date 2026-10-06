import { GoogleProductId, GoogleProductInfo } from "./googleWorkspaceTypes";

export const INITIAL_PRODUCTS_STATE: Record<GoogleProductId, GoogleProductInfo> = {
  slides: {
    id: "slides",
    name: "Google Slides",
    category: "Office & Documents",
    iconName: "Presentation",
    description: "Generate slide decks, visual outlines & Manim mathematical animations",
    status: "needs_auth",
  },
  drive: {
    id: "drive",
    name: "Google Drive",
    category: "Storage & Tasks",
    iconName: "HardDrive",
    description: "Cloud file synchronization, asset search & secure user folder access",
    status: "needs_auth",
  },
  docs: {
    id: "docs",
    name: "Google Docs",
    category: "Office & Documents",
    iconName: "FileText",
    description: "Synthesize study summaries, research documents & interactive lesson notes",
    status: "needs_auth",
  },
  sheets: {
    id: "sheets",
    name: "Google Sheets",
    category: "Office & Documents",
    iconName: "Table",
    description: "Spreadsheet analytics, numerical grade tables & dataset syncing",
    status: "needs_auth",
  },
  calendar: {
    id: "calendar",
    name: "Google Calendar",
    category: "Communication & Schedule",
    iconName: "Calendar",
    description: "Live schedule overview, agenda tracking & autonomous class reminders",
    status: "needs_auth",
  },
  gmail: {
    id: "gmail",
    name: "Gmail",
    category: "Communication & Schedule",
    iconName: "Mail",
    description: "Assistant inbox summaries, message drafting & communication management",
    status: "needs_auth",
  },
  tasks: {
    id: "tasks",
    name: "Google Tasks",
    category: "Storage & Tasks",
    iconName: "CheckSquare",
    description: "To-do lists, homework assignments & autonomous task scheduling",
    status: "needs_auth",
  },
};

/**
 * Checks connection status across Google products using the active OAuth bearer token.
 * If token is invalid or missing, marks as needs_auth (strictly zero mock data).
 */
export async function verifyAllGoogleProducts(
  accessToken: string | null
): Promise<Record<GoogleProductId, GoogleProductInfo>> {
  if (!accessToken) {
    const unauth: Record<GoogleProductId, GoogleProductInfo> = { ...INITIAL_PRODUCTS_STATE };
    (Object.keys(unauth) as GoogleProductId[]).forEach((key) => {
      unauth[key] = {
        ...unauth[key],
        status: "needs_auth",
        lastSyncedAt: undefined,
        itemCount: undefined,
        itemLabel: undefined,
        errorMessage: undefined,
      };
    });
    return unauth;
  }

  const updated: Record<GoogleProductId, GoogleProductInfo> = { ...INITIAL_PRODUCTS_STATE };
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 1. Google Drive Check
  try {
    const driveRes = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(id)", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (driveRes.ok) {
      const data = await driveRes.json();
      updated.drive = {
        ...updated.drive,
        status: "connected",
        lastSyncedAt: now,
        itemCount: data.files?.length || 0,
        itemLabel: "Files Accessible",
      };
    } else {
      updated.drive.status = "error";
      updated.drive.errorMessage = "Permission missing or token expired";
    }
  } catch (err: any) {
    updated.drive.status = "error";
    updated.drive.errorMessage = err.message;
  }

  // 2. Google Calendar Check
  try {
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&timeMin=${new Date().toISOString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (calRes.ok) {
      const data = await calRes.json();
      updated.calendar = {
        ...updated.calendar,
        status: "connected",
        lastSyncedAt: now,
        itemCount: data.items?.length || 0,
        itemLabel: "Upcoming Events",
      };
    } else {
      updated.calendar.status = "error";
    }
  } catch {
    updated.calendar.status = "error";
  }

  // 3. Gmail Check
  try {
    const mailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (mailRes.ok) {
      const data = await mailRes.json();
      updated.gmail = {
        ...updated.gmail,
        status: "connected",
        lastSyncedAt: now,
        itemCount: data.messages?.length || 0,
        itemLabel: "Recent Messages",
      };
    } else {
      updated.gmail.status = "error";
    }
  } catch {
    updated.gmail.status = "error";
  }

  // 4. Google Tasks Check
  try {
    const tasksRes = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=5", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (tasksRes.ok) {
      const data = await tasksRes.json();
      updated.tasks = {
        ...updated.tasks,
        status: "connected",
        lastSyncedAt: now,
        itemCount: data.items?.length || 0,
        itemLabel: "Pending Tasks",
      };
    } else {
      updated.tasks.status = "error";
    }
  } catch {
    updated.tasks.status = "error";
  }

  // 5. Google Slides, Docs, Sheets share the Drive & Office token scope
  if (updated.drive.status === "connected") {
    updated.slides = {
      ...updated.slides,
      status: "connected",
      lastSyncedAt: now,
      itemLabel: "Slides Engine Ready",
    };
    updated.docs = {
      ...updated.docs,
      status: "connected",
      lastSyncedAt: now,
      itemLabel: "Docs Writer Ready",
    };
    updated.sheets = {
      ...updated.sheets,
      status: "connected",
      lastSyncedAt: now,
      itemLabel: "Sheets Ready",
    };
  } else {
    updated.slides.status = updated.drive.status;
    updated.docs.status = updated.drive.status;
    updated.sheets.status = updated.drive.status;
  }

  return updated;
}
