/**
 * Layer 3: Version & Auto-Updater Types
 * Typed data contracts for GitHub Releases, version diffing, and in-app update progress.
 */

export interface VersionManifest {
  version: string;
  releaseName?: string;
  releaseTag?: string;
  releaseDate: string;
  commit?: string;
  minSupportedVersion?: string;
  mandatory?: boolean;
  releaseNotes: string[];
  downloadUrls: {
    windows?: string;
    linux?: string;
    github?: string;
  };
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  isMandatory: boolean;
  releaseNotes: string[];
  releaseName: string;
  releaseDate: string;
  downloadUrl: string;
  githubReleaseUrl?: string;
  assets: {
    windowsExe?: string;
    linuxDeb?: string;
    linuxAppImage?: string;
  };
}

export type UpdateStatus = 
  | "idle"
  | "checking"
  | "available"
  | "up-to-date"
  | "downloading"
  | "ready-to-install"
  | "error";

export interface DownloadProgress {
  percent: number;
  transferredBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number;
}
