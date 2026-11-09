/**
 * LAYER 2: Custom Asset Upload & Ingestion Service
 * Supports:
 * 1. Direct local file upload & desktop drag-and-drop (PNG, JPG, WEBP, SVG, GIF, MP4, WEBM)
 * 2. Clipboard image & media URL paste (Ctrl+V / Cmd+V)
 * 3. Direct external image / GIF / video URL import
 * 4. LocalStorage persistence across sessions
 */

import {
  AutonomousAssetItem,
  UploadedMediaKind
} from "../layer1_data/autonomousAssetTypes";
import { AutonomousMediaKind } from "../layer1_data/presentonTypes";

const CUSTOM_UPLOAD_STORAGE_KEY = "mahr_custom_uploaded_slide_assets_v1";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function detectUploadedMediaKind(mimeType: string, filenameOrUrl: string): UploadedMediaKind {
  const lower = filenameOrUrl.toLowerCase();
  if (mimeType.startsWith("video/") || /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(lower)) {
    return "video";
  }
  if (mimeType === "image/gif" || /\.gif(\?.*)?$/i.test(lower)) {
    return "gif";
  }
  if (mimeType === "image/svg+xml" || /\.svg(\?.*)?$/i.test(lower)) {
    return "svg";
  }
  return "image";
}

function mapUploadedKindToAutonomousKind(uploadedKind: UploadedMediaKind): AutonomousMediaKind {
  switch (uploadedKind) {
    case "video":
      return "procedural_60fps_video";
    case "gif":
      return "animated_gif_loop";
    case "svg":
      return "svg_infographic";
    case "image":
    default:
      return "ai_concept_image";
  }
}

/**
 * Reads a File into a Data URL (for images/GIFs/SVGs <= 4MB) or Object URL (for larger files/videos).
 */
function readFileToMediaUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 4 * 1024 * 1024 || file.type.startsWith("video/")) {
      const objUrl = URL.createObjectURL(file);
      resolve(objUrl);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        resolve(URL.createObjectURL(file));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read uploaded file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a browser File object into a draggable, auto-layout-ready AutonomousAssetItem.
 */
export async function ingestUploadedFile(
  file: File,
  accentHex: string = "#f59e0b"
): Promise<AutonomousAssetItem> {
  const uploadedKind = detectUploadedMediaKind(file.type, file.name);
  const autonomousKind = mapUploadedKindToAutonomousKind(uploadedKind);
  const mediaUrl = await readFileToMediaUrl(file);
  const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ") || "Custom Uploaded Media";
  const sizeLabel = formatFileSize(file.size);

  const asset: AutonomousAssetItem = {
    id: `user-upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: cleanTitle.slice(0, 42),
    subtitle: `Custom ${uploadedKind.toUpperCase()} · ${sizeLabel}`,
    kind: autonomousKind,
    promptUsed: `User uploaded ${uploadedKind}: ${file.name}`,
    previewDataUrl: mediaUrl,
    customMediaUrl: mediaUrl,
    accentHex,
    isCustomUpload: true,
    uploadedMediaType: uploadedKind,
    mimeType: file.type || "application/octet-stream",
    fileSizeLabel: sizeLabel
  };

  saveCustomUploadedAssetToStorage(asset);
  return asset;
}

/**
 * Ingests multiple files (e.g. from desktop drag-and-drop or multi-file input).
 */
export async function ingestUploadedFileList(
  files: FileList | File[],
  accentHex: string = "#f59e0b"
): Promise<AutonomousAssetItem[]> {
  const fileArray = Array.from(files).filter(
    (f) =>
      f.type.startsWith("image/") ||
      f.type.startsWith("video/") ||
      /\.(png|jpe?g|webp|gif|svg|mp4|webm|mov)$/i.test(f.name)
  );
  const results: AutonomousAssetItem[] = [];
  for (const file of fileArray) {
    try {
      const item = await ingestUploadedFile(file, accentHex);
      results.push(item);
    } catch {
      // Skip unreadable file
    }
  }
  return results;
}

/**
 * Creates a custom AutonomousAssetItem from an external image, GIF, SVG, or video URL.
 */
export function ingestCustomMediaUrl(
  rawUrl: string,
  customTitle?: string,
  accentHex: string = "#f59e0b"
): AutonomousAssetItem | null {
  const trimmed = rawUrl.trim();
  if (!trimmed || (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:"))) {
    return null;
  }

  const uploadedKind = detectUploadedMediaKind("", trimmed);
  const autonomousKind = mapUploadedKindToAutonomousKind(uploadedKind);

  let derivedTitle = customTitle?.trim();
  if (!derivedTitle) {
    try {
      const urlObj = new URL(trimmed);
      const lastSeg = urlObj.pathname.split("/").filter(Boolean).pop() || urlObj.hostname;
      derivedTitle = decodeURIComponent(lastSeg).replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
    } catch {
      derivedTitle = "Imported Web Media";
    }
  }

  const asset: AutonomousAssetItem = {
    id: `url-upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: (derivedTitle || "Imported Media").slice(0, 42),
    subtitle: `Custom ${uploadedKind.toUpperCase()} · URL Import`,
    kind: autonomousKind,
    promptUsed: `Imported from URL: ${trimmed}`,
    previewDataUrl: trimmed,
    customMediaUrl: trimmed,
    accentHex,
    isCustomUpload: true,
    uploadedMediaType: uploadedKind,
    fileSizeLabel: "URL Stream"
  };

  saveCustomUploadedAssetToStorage(asset);
  return asset;
}

/**
 * Loads previously uploaded custom assets from localStorage.
 */
export function loadCustomUploadedAssetsFromStorage(): AutonomousAssetItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_UPLOAD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out ephemeral blob: URLs from older sessions that are no longer valid
    return parsed.filter(
      (item: AutonomousAssetItem) =>
        item &&
        typeof item.id === "string" &&
        typeof item.previewDataUrl === "string" &&
        !item.previewDataUrl.startsWith("blob:")
    );
  } catch {
    return [];
  }
}

/**
 * Persists a custom uploaded asset to localStorage (skipping ephemeral blob: URLs over quota).
 */
export function saveCustomUploadedAssetToStorage(asset: AutonomousAssetItem): void {
  if (asset.previewDataUrl.startsWith("blob:")) return;
  try {
    const existing = loadCustomUploadedAssetsFromStorage();
    const updated = [asset, ...existing.filter((a) => a.id !== asset.id)].slice(0, 18);
    localStorage.setItem(CUSTOM_UPLOAD_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota exceeded for large base64 images
  }
}

/**
 * Deletes a custom uploaded asset from localStorage.
 */
export function removeCustomUploadedAssetFromStorage(assetId: string): AutonomousAssetItem[] {
  try {
    const existing = loadCustomUploadedAssetsFromStorage();
    const updated = existing.filter((a) => a.id !== assetId);
    localStorage.setItem(CUSTOM_UPLOAD_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
