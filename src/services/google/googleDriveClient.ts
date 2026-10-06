import { GoogleDriveFileItem } from "./googleWorkspaceTypes";

/**
 * Industrial Google Drive Client
 * Communicates directly with https://www.googleapis.com/drive/v3
 * Strictly rejects mock fallbacks: requires valid active user bearer token.
 */
export async function listUserDriveFiles(
  accessToken: string,
  pageSize: number = 10
): Promise<GoogleDriveFileItem[]> {
  if (!accessToken) {
    throw new Error("Google Drive access requires user authentication. Zero-default mode is active.");
  }

  const queryParams = new URLSearchParams({
    pageSize: String(pageSize),
    fields: "files(id, name, mimeType, webViewLink, iconLink, modifiedTime, size)",
    orderBy: "modifiedTime desc",
    q: "trashed = false",
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    iconLink: file.iconLink,
    webViewLink: file.webViewLink,
    modifiedTime: file.modifiedTime,
    size: file.size,
  }));
}

/**
 * Searches user Drive files by text query
 */
export async function searchUserDriveFiles(
  accessToken: string,
  query: string,
  pageSize: number = 5
): Promise<GoogleDriveFileItem[]> {
  if (!accessToken) {
    throw new Error("Google Drive access requires user authentication.");
  }

  const cleanQuery = query.replace(/'/g, "\\'");
  const queryParams = new URLSearchParams({
    pageSize: String(pageSize),
    fields: "files(id, name, mimeType, webViewLink, modifiedTime)",
    q: `name contains '${cleanQuery}' and trashed = false`,
    orderBy: "modifiedTime desc",
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive search failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    webViewLink: file.webViewLink,
    modifiedTime: file.modifiedTime,
  }));
}
