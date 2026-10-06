/**
 * Industrial Google Docs Client
 * Communicates with https://docs.googleapis.com/v1
 * Requires active bearer token and valid permissions.
 */

export interface GoogleDocResult {
  documentId: string;
  title: string;
  documentUrl: string;
}

export async function createGoogleDoc(
  accessToken: string,
  title: string,
  initialContent?: string
): Promise<GoogleDocResult> {
  if (!accessToken) {
    throw new Error("Google Docs creation requires user authentication. Zero-default mode is active.");
  }

  // 1. Create empty document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Google Docs creation failed (${createRes.status}): ${errorText}`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // 2. Insert initial content if provided
  if (initialContent && initialContent.trim().length > 0) {
    await insertTextIntoGoogleDoc(accessToken, documentId, initialContent);
  }

  return {
    documentId,
    title: docData.title || title,
    documentUrl,
  };
}

export async function insertTextIntoGoogleDoc(
  accessToken: string,
  documentId: string,
  text: string
): Promise<void> {
  if (!accessToken) throw new Error("Authentication required for Google Docs.");

  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: `${text}\n`,
            },
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to insert text in Google Doc: ${errText}`);
  }
}
