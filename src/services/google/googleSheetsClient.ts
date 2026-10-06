/**
 * Industrial Google Sheets Client
 * Communicates directly with https://sheets.googleapis.com/v4
 */

export interface GoogleSheetResult {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
}

export async function createGoogleSheet(
  accessToken: string,
  title: string,
  headers?: string[]
): Promise<GoogleSheetResult> {
  if (!accessToken) {
    throw new Error("Google Sheets creation requires user authentication.");
  }

  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Sheets creation failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  if (headers && headers.length > 0) {
    await appendSheetRow(accessToken, spreadsheetId, "Sheet1!A1", headers);
  }

  return {
    spreadsheetId,
    title,
    spreadsheetUrl,
  };
}

export async function appendSheetRow(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number)[]
): Promise<void> {
  if (!accessToken) throw new Error("Authentication required for Google Sheets.");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append row to Google Sheet: ${errText}`);
  }
}
