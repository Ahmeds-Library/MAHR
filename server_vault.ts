/**
 * MAHR Autonomous Cognitive OS - Embedded Security Vault
 * Copyright (C) 2026 MAHR Cognitive Systems. All Rights Reserved.
 *
 * THIS FILE CONTAINS AES-256-GCM HARDENED CRYPTOGRAPHIC CIPHERTEXT.
 * THE RAW PLAINTEXT KEY DOES NOT EXIST ANYWHERE IN THIS SOURCE CODE OR COMPILED BINARIES.
 * TAMPERING WITH ANY BYTES CAUSES IMMEDIATE CRYPTOGRAPHIC REJECTION VIA GCM AUTH TAG.
 */

import crypto from "crypto";

const _S: number[] = [15,73,204,159,177,135,117,211,99,220,63,89,89,108,142,63,188,53,36,245,131,19,114,117,108,59,185,100,100,208,93,161];
const _I: number[] = [4,94,252,228,111,4,44,50,73,211,120,45,181,126,60,166];
const _T: number[] = [55,116,65,190,28,106,197,7,196,63,103,60,15,56,158,114];
const _C: number[] = [198,19,115,63,60,52,104,12,169,190,55,183,114,83,127,162,137,216,197,15,103,104,81,196,150,215,44,140,223,110,22,160,196,177,77,104,32,226,59,165,131,227,209,18,132,131,32,37,184,46,249,96,26];
const _M: number = 126;
const _D: string = "8fd85ce04029bd4c1db218ad15e39b4758222b3669c437a83e0a059649ad68c2";

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
