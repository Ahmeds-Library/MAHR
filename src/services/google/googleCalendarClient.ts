import { GoogleCalendarEventItem } from "./googleWorkspaceTypes";

/**
 * Industrial Google Calendar Client
 * Communicates directly with https://www.googleapis.com/calendar/v3
 */

export async function listUpcomingCalendarEvents(
  accessToken: string,
  maxResults: number = 8
): Promise<GoogleCalendarEventItem[]> {
  if (!accessToken) {
    throw new Error("Google Calendar access requires user authentication. Zero-default mode is active.");
  }

  const now = new Date().toISOString();
  const queryParams = new URLSearchParams({
    timeMin: now,
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar request failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || "Untitled Event",
    description: item.description,
    start: item.start || {},
    end: item.end || {},
    htmlLink: item.htmlLink,
    location: item.location,
  }));
}

export interface NewCalendarEventPayload {
  summary: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  location?: string;
}

/**
 * Create calendar event.
 * NOTE: UI must obtain explicit user confirmation before calling this.
 */
export async function createCalendarEvent(
  accessToken: string,
  payload: NewCalendarEventPayload
): Promise<{ id: string; htmlLink: string }> {
  if (!accessToken) {
    throw new Error("Google Calendar creation requires user authentication.");
  }

  const body = {
    summary: payload.summary,
    description: payload.description || "Created via MAHR AI Personal Assistant",
    start: {
      dateTime: payload.startTime,
    },
    end: {
      dateTime: payload.endTime,
    },
    location: payload.location,
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create calendar event (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    htmlLink: data.htmlLink,
  };
}
