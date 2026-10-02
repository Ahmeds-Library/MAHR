/**
 * Layer 3: GitHub Release Service
 * Handles querying GitHub API and local update proxy endpoints,
 * semver comparison, and asset target resolution.
 */

import { VersionManifest, UpdateCheckResult } from "./versionTypes";

export const CURRENT_APP_VERSION = "2.4.0";
export const GITHUB_REPO = "Ahmeds-Library/MAHR";

/**
 * Parses and compares two semantic version strings (e.g., "2.4.1" > "2.4.0")
 * Returns 1 if vA > vB, -1 if vA < vB, 0 if equal
 */
export function compareSemver(vA: string, vB: string): number {
  const cleanA = vA.replace(/^v/, "").split("-")[0];
  const cleanB = vB.replace(/^v/, "").split("-")[0];

  const partsA = cleanA.split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = cleanB.split(".").map((n) => parseInt(n, 10) || 0);

  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

/**
 * Checks for updates from the server proxy or fallback GitHub API
 */
export async function checkForAppUpdates(currentVer: string = CURRENT_APP_VERSION): Promise<UpdateCheckResult> {
  let manifest: VersionManifest | null = null;

  // 1. Try local server-side check-update endpoint first (fast, cached, CORS-free)
  try {
    const res = await fetch(`/api/check-update?currentVersion=${encodeURIComponent(currentVer)}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version) {
        manifest = data;
      }
    }
  } catch (err) {
    console.warn("[githubReleaseService] /api/check-update unreachable, trying fallback:", err);
  }

  // 2. Try static public /version.json
  if (!manifest) {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });
      if (res.ok) {
        manifest = await res.json();
      }
    } catch (e) {
      console.warn("[githubReleaseService] /version.json fetch note:", e);
    }
  }

  // 3. Fallback direct GitHub Releases API
  if (!manifest) {
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { "Accept": "application/vnd.github.v3+json" }
      });
      if (ghRes.ok) {
        const gh = await ghRes.json();
        const tagVer = (gh.tag_name || "2.4.0").replace(/^v/, "");
        manifest = {
          version: tagVer,
          releaseName: gh.name || `MAHR v${tagVer}`,
          releaseTag: gh.tag_name,
          releaseDate: gh.published_at || new Date().toISOString(),
          releaseNotes: gh.body
            ? gh.body.split("\n").filter((l: string) => l.trim().length > 0).slice(0, 5)
            : ["Continuous release improvements and stability updates."],
          downloadUrls: {
            github: gh.html_url,
            windows: gh.assets?.find((a: any) => a.name.endsWith(".exe"))?.browser_download_url || `/api/download/windows-exe`,
            linux: gh.assets?.find((a: any) => a.name.endsWith(".deb"))?.browser_download_url || `/api/download/linux-deb`
          }
        };
      }
    } catch (e) {
      console.warn("[githubReleaseService] GitHub releases API note:", e);
    }
  }

  // Fallback defaults if offline
  if (!manifest) {
    manifest = {
      version: currentVer,
      releaseName: `MAHR v${currentVer}`,
      releaseDate: new Date().toISOString(),
      releaseNotes: ["App is currently running latest local build."],
      downloadUrls: {
        windows: "/api/download/windows-exe",
        linux: "/api/download/linux-deb",
        github: `https://github.com/${GITHUB_REPO}/releases`
      }
    };
  }

  const hasUpdate = compareSemver(manifest.version, currentVer) > 0;
  const isPlatformWin = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("win");
  const targetDownloadUrl = isPlatformWin
    ? manifest.downloadUrls.windows || "/api/download/windows-exe"
    : manifest.downloadUrls.linux || "/api/download/linux-deb";

  return {
    currentVersion: currentVer,
    latestVersion: manifest.version,
    hasUpdate,
    isMandatory: Boolean(manifest.mandatory),
    releaseNotes: manifest.releaseNotes || [],
    releaseName: manifest.releaseName || `MAHR v${manifest.version}`,
    releaseDate: manifest.releaseDate || new Date().toISOString(),
    downloadUrl: targetDownloadUrl,
    githubReleaseUrl: manifest.downloadUrls.github,
    assets: {
      windowsExe: manifest.downloadUrls.windows,
      linuxDeb: manifest.downloadUrls.linux
    }
  };
}
