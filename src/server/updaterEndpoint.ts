import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const updaterRouter = express.Router();

interface VersionManifest {
  version: string;
  releaseName?: string;
  releaseDate: string;
  minSupportedVersion?: string;
  mandatory?: boolean;
  releaseNotes: string[];
  downloadUrls: {
    windows?: string;
    windowsPortable?: string;
    linux?: string;
    github?: string;
  };
}

function getLocalManifest(): VersionManifest {
  try {
    const versionPath = path.join(process.cwd(), "public", "version.json");
    if (fs.existsSync(versionPath)) {
      const content = fs.readFileSync(versionPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("[updaterEndpoint] Failed to read version.json:", err);
  }

  return {
    version: "2.4.1-build-2",
    releaseName: "MAHR Horizon v2.4.1-build-2",
    releaseDate: new Date().toISOString(),
    releaseNotes: [
      "Latest full autonomous release v2.4.1-build-2 with native MAHR.exe engine",
      "Autonomous Smart Layout Engine for Whiteboard & Mind Map with fluid GSAP physics",
      "Seamless in-place desktop upgrade engine preserving all user brain memories and cognitive states",
      "Continuous GitHub Actions CI/CD with automated update notifications"
    ],
    downloadUrls: {
      windows: "/api/download/windows-exe",
      windowsPortable: "/api/download/windows-exe-portable",
      linux: "/api/download/linux-deb",
      github: "https://github.com/Ahmeds-Library/MAHR/releases/latest"
    }
  };
}

export function compareSemver(vA: string, vB: string): number {
  if (!vA || !vB) return 0;
  const cleanA = vA.replace(/^v/, "").trim();
  const cleanB = vB.replace(/^v/, "").trim();

  // Extract core and build number
  const [coreA, buildA] = cleanA.split("-build-");
  const [coreB, buildB] = cleanB.split("-build-");

  const partsA = (coreA || "").split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = (coreB || "").split(".").map((n) => parseInt(n, 10) || 0);

  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }

  // If core semver matches, compare build numbers
  const bNumA = buildA ? parseInt(buildA, 10) || 0 : 0;
  const bNumB = buildB ? parseInt(buildB, 10) || 0 : 0;
  if (bNumA > bNumB) return 1;
  if (bNumA < bNumB) return -1;

  return 0;
}

// GET /api/check-update
updaterRouter.get("/check-update", (req: Request, res: Response) => {
  const currentVersion = (req.query.currentVersion as string) || "2.4.0";
  const manifest = getLocalManifest();

  const hasUpdate = compareSemver(manifest.version, currentVersion) > 0;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({
    currentVersion,
    latestVersion: manifest.version,
    version: manifest.version,
    hasUpdate,
    isMandatory: Boolean(manifest.mandatory),
    releaseName: manifest.releaseName || `MAHR v${manifest.version}`,
    releaseDate: manifest.releaseDate,
    releaseNotes: manifest.releaseNotes,
    downloadUrls: manifest.downloadUrls,
    githubReleaseUrl: manifest.downloadUrls.github
  });
});

// GET /api/version
updaterRouter.get("/version", (req: Request, res: Response) => {
  const manifest = getLocalManifest();
  res.json(manifest);
});

// GET /api/installer-info - Lists all verified installer packages available on this server
updaterRouter.get("/installer-info", (req: Request, res: Response) => {
  const downloadsDir = path.join(process.cwd(), "public", "downloads");
  const packages: Array<{
    filename: string;
    platform: "windows" | "linux";
    type: "full-installer" | "portable-setup" | "debian-package";
    version: string;
    sizeBytes: number;
    sizeFormatted: string;
    downloadUrl: string;
    isLatest: boolean;
  }> = [];

  if (fs.existsSync(downloadsDir)) {
    const files = fs.readdirSync(downloadsDir);
    for (const f of files) {
      if (f.endsWith(".sig") || f.endsWith(".asc") || f.endsWith(".txt") || f.includes(".unsigned.")) continue;
      const fullPath = path.join(downloadsDir, f);
      const stat = fs.statSync(fullPath);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);

      if (f.endsWith(".exe")) {
        const isBuild2 = f.includes("2.4.1-build-2");
        const isFull = f.includes("MAHR-v2.4.1-build-2") || f.includes("MAHR-Setup-v2.4.1-build-2");
        packages.push({
          filename: f,
          platform: "windows",
          type: isFull ? "full-installer" : "portable-setup",
          version: isBuild2 ? "2.4.1-build-2" : f.includes("2.4.1") ? "2.4.1" : "2.4.0",
          sizeBytes: stat.size,
          sizeFormatted: `${sizeMB} MB`,
          downloadUrl: isFull ? "/api/download/windows-exe" : `/downloads/${f}`,
          isLatest: isBuild2
        });
      } else if (f.endsWith(".deb")) {
        const is241 = f.includes("2.4.1");
        packages.push({
          filename: f,
          platform: "linux",
          type: "debian-package",
          version: is241 ? "2.4.1" : "2.4.0",
          sizeBytes: stat.size,
          sizeFormatted: `${sizeMB} MB`,
          downloadUrl: is241 ? "/api/download/linux-deb" : `/downloads/${f}`,
          isLatest: is241
        });
      }
    }
  }

  res.json({
    latestVersion: "2.4.1-build-2",
    recommendedWindows: "/api/download/windows-exe",
    recommendedWindowsPortable: "/api/download/windows-exe-portable",
    recommendedLinux: "/api/download/linux-deb",
    packages
  });
});
