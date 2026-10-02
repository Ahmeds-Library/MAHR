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
    version: "2.4.0",
    releaseName: "MAHR Horizon v2.4.0",
    releaseDate: new Date().toISOString(),
    releaseNotes: [
      "Autonomous Presentation Pipeline with Gemini & Vector Infographics",
      "Continuous GitHub Actions CI/CD with automated update notifications",
      "PixiJS v8 idempotent extension handlers and desktop optimizations"
    ],
    downloadUrls: {
      windows: "/api/download/windows-exe",
      linux: "/api/download/linux-deb",
      github: "https://github.com/Ahmeds-Library/MAHR/releases/latest"
    }
  };
}

function compareSemver(vA: string, vB: string): number {
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

// GET /api/check-update
updaterRouter.get("/check-update", (req: Request, res: Response) => {
  const currentVersion = (req.query.currentVersion as string) || "2.4.0";
  const manifest = getLocalManifest();

  const hasUpdate = compareSemver(manifest.version, currentVersion) > 0;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({
    currentVersion,
    latestVersion: manifest.version,
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
