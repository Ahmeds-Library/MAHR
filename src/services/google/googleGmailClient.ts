import { GoogleGmailMessageItem } from "./googleWorkspaceTypes";

/**
 * Industrial Gmail Client
 * Communicates directly with https://gmail.googleapis.com/gmail/v1
 */

export async function listRecentEmails(
  accessToken: string,
  maxResults: number = 6
): Promise<GoogleGmailMessageItem[]> {
  if (!accessToken) {
    throw new Error("Gmail access requires user authentication. Zero-default mode is active.");
  }

  // 1. List message IDs
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=category:primary`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!listRes.ok) {
    const errorText = await listRes.text();
    throw new Error(`Gmail list request failed (${listRes.status}): ${errorText}`);
  }

  const listData = await listRes.json();
  const messages = listData.messages || [];

  // 2. Fetch snippets for each
  const detailedMessages: GoogleGmailMessageItem[] = await Promise.all(
    messages.map(async (msg: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId, snippet: "" };

        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
        const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
        const isUnread = detail.labelIds?.includes("UNREAD") || false;

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet || "",
          subject,
          from,
          date,
          unread: isUnread,
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId, snippet: "" };
      }
    })
  );

  return detailedMessages;
}

/**
 * Send an email via Gmail API
 * NOTE: UI must obtain explicit user confirmation before calling this.
 */
export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string; threadId: string }> {
  if (!accessToken) {
    throw new Error("Gmail sending requires user authentication.");
  }

  // Format RFC 2822 email
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    bodyText,
  ];
  const message = messageParts.join("\r\n");

  // Base64url encode
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}
