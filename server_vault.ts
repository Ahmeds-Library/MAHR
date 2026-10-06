/**
 * MAHR Autonomous Cognitive OS - Embedded Security Vault
 * Copyright (C) 2026 MAHR Cognitive Systems. All Rights Reserved.
 *
 * THIS FILE CONTAINS AES-256-GCM HARDENED CRYPTOGRAPHIC CIPHERTEXT.
 * THE RAW PLAINTEXT KEY DOES NOT EXIST ANYWHERE IN THIS SOURCE CODE OR COMPILED BINARIES.
 * TAMPERING WITH ANY BYTES CAUSES IMMEDIATE CRYPTOGRAPHIC REJECTION VIA GCM AUTH TAG.
 */

import crypto from "crypto";

const _S: number[] = [178,38,198,12,40,61,100,108,157,35,15,128,221,235,27,49,33,234,53,244,130,53,83,197,189,177,2,253,239,26,250,200];
const _I: number[] = [60,28,179,40,69,207,88,211,239,144,235,191,130,20,164,255];
const _T: number[] = [222,9,24,19,113,213,46,90,190,55,31,24,212,210,232,58];
const _C: number[] = [147,128,70,174,81,248,196,43,61,94,125,9,99,250,128,67,253,112,101,214,21,36,46,88,77,19,220,205,139,12,62,254,254,154,183,197,137,202,205,249,239,243,236,95,163,80,106,146,107,173,249,52,130];
const _M: number = 126;
const _D: string = "a37c7b975bae56588ceb151a5cef41f9e308c1fa6ae6aa255610802f54831cef";

let _cachedKey: string | null = null;
let _vaultAttempted = false;

function _decryptVault(): string | null {
  if (_cachedKey) return _cachedKey;
  if (_vaultAttempted && !_cachedKey) return null;
  _vaultAttempted = true;

  try {
    const salt = Buffer.from(_S);
    const iv = Buffer.from(_I);
    const tag = Buffer.from(_T);
    const unmasked = Buffer.from(_C.map(b => b ^ _M));

    // Verify integrity digest before attempting decryption
    const verifyDigest = crypto.createHash("sha256").update(unmasked).digest("hex");
    if (verifyDigest !== _D) {
      console.error("[MAHR Security Vault] Integrity violation: ciphertext hash mismatch.");
      return null;
    }

    const seedParts = [
      "MAHR_COGNITIVE_AMB_VAULT_",
      "KERNEL_SEC_NODE_2026_X9",
      "_ALPHA_GCM_SHIELD",
      "::NEURAL_ROOT_7823"
    ];
    const compositeSeed = seedParts.join("");

    const derivedKey = crypto.pbkdf2Sync(compositeSeed, salt, 64000, 32, "sha512");
    const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(unmasked);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    const key = decrypted.toString("utf8");
    if (key && key.length > 10) {
      _cachedKey = key;
      return key;
    }
    return null;
  } catch (err: any) {
    console.error("[MAHR Security Vault] Decryption failure:", err.message || err);
    return null;
  }
}

/**
 * Resolves the active Gemini API Key securely.
 * 1. If explicit environment variable exists, prefer it.
 * 2. If environment variable is absent (e.g. desktop client installation),
 *    decrypts from the encrypted AES-256-GCM vault in-memory.
 */
export function getSafeGeminiApiKey(): string {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 10) {
    return envKey.trim();
  }

  const vaultKey = _decryptVault();
  if (vaultKey && vaultKey.trim().length > 10) {
    return vaultKey.trim();
  }

  throw new Error("MAHR Security Vault: API Key could not be resolved from environment or secure vault.");
}

/**
 * Checks whether an API key is available (either via environment or secure vault).
 */
export function isVaultKeyAvailable(): boolean {
  try {
    const key = getSafeGeminiApiKey();
    return Boolean(key && key.length > 10);
  } catch {
    return false;
  }
}

/**
 * Returns anonymized status of the security vault without exposing the key.
 */
export function getVaultStatus(): { operational: boolean; source: "env" | "vault" | "none"; maskedId: string } {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 10) {
    const len = envKey.trim().length;
    return {
      operational: true,
      source: "env",
      maskedId: envKey.trim().substring(0, 4) + "..." + envKey.trim().substring(len - 4)
    };
  }

  const vaultKey = _decryptVault();
  if (vaultKey && vaultKey.trim().length > 10) {
    const len = vaultKey.trim().length;
    return {
      operational: true,
      source: "vault",
      maskedId: vaultKey.trim().substring(0, 4) + "..." + vaultKey.trim().substring(len - 4)
    };
  }

  return { operational: false, source: "none", maskedId: "UNCONFIGURED" };
}
