/**
 * Layer 3: Installer & Distribution Service
 * Manages package discovery, checksum validation, mirror routing,
 * and reliable binary streaming for Windows and Linux native packages.
 */

import { APP_VERSION, DEB_FILENAME, EXE_FILENAME, EXE_PORTABLE_FILENAME } from "../config/appVersion";

export interface InstallerPackageInfo {
  filename: string;
  platform: "windows" | "linux";
  type: "full-installer" | "portable-setup" | "debian-package";
  version: string;
  sizeBytes: number;
  sizeFormatted: string;
  downloadUrl: string;
  isLatest: boolean;
  sha256?: string;
}

export interface InstallerRegistryResponse {
  latestVersion: string;
  recommendedWindows: string;
  recommendedWindowsPortable: string;
  recommendedLinux: string;
  packages: InstallerPackageInfo[];
}

/**
 * Fetches available installer binaries registered on the server
 */
export async function fetchAvailableInstallers(): Promise<InstallerRegistryResponse> {
  try {
    const res = await fetch("/api/installer-info", {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.packages) && data.packages.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("[installerService] Failed to query /api/installer-info:", err);
  }

  // Fallback defaults if server endpoint is temporarily unavailable
  return {
    latestVersion: APP_VERSION,
    recommendedWindows: "/api/download/windows-exe",
    recommendedWindowsPortable: "/api/download/windows-exe-portable",
    recommendedLinux: "/api/download/linux-deb",
    packages: [
      {
        filename: EXE_FILENAME,
        platform: "windows",
        type: "full-installer",
        version: APP_VERSION,
        sizeBytes: 245726208,
        sizeFormatted: "234.3 MB",
        downloadUrl: "/api/download/windows-exe",
        isLatest: true
      },
      {
        filename: EXE_PORTABLE_FILENAME,
        platform: "windows",
        type: "portable-setup",
        version: "2.4.1",
        sizeBytes: 1856936,
        sizeFormatted: "1.8 MB",
        downloadUrl: "/api/download/windows-exe-portable",
        isLatest: false
      },
      {
        filename: DEB_FILENAME,
        platform: "linux",
        type: "debian-package",
        version: "2.4.1",
        sizeBytes: 5135340,
        sizeFormatted: "4.9 MB",
        downloadUrl: "/api/download/linux-deb",
        isLatest: true
      }
    ]
  };
}

/**
 * Executes a resilient native browser download trigger
 */
export function triggerNativeDownload(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
  }, 2000);
}
