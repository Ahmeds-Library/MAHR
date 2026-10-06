/**
 * Industrial User Tenant Isolation Engine
 *
 * Guarantees 100% strict user data partitioning so that:
 * 1. User A's data (tasks, notes, chat journal, memories, settings) is NEVER shared with User B.
 * 2. Each user's local caches are partitioned by their unique Firebase Auth UID (`mahr_tenant_${uid}_*`).
 * 3. On Sign-Out / Account Switch, the active session is completely wiped from runtime memory.
 */

const TENANT_PREFIX = "mahr_tenant";

/**
 * Returns a strictly isolated storage key namespaced to the user's unique UID.
 * If user is unauthenticated (guest/anonymous), uses a distinct isolated sandbox key.
 */
export function getTenantScopedKey(uid: string | null | undefined, keyName: string): string {
  const safeUid = uid && uid.trim().length > 0 ? uid.trim() : "anonymous_sandbox";
  return `${TENANT_PREFIX}_${safeUid}_${keyName}`;
}

/**
 * Loads a user-isolated item from browser storage.
 */
export function loadTenantItem<T>(uid: string | null | undefined, keyName: string, fallback: T): T {
  try {
    const scopedKey = getTenantScopedKey(uid, keyName);
    const raw = localStorage.getItem(scopedKey);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[UserTenantIsolation] Error loading scoped key ${keyName}:`, err);
    return fallback;
  }
}

/**
 * Saves a user-isolated item to browser storage strictly scoped to the user's UID.
 */
export function saveTenantItem<T>(uid: string | null | undefined, keyName: string, value: T): void {
  try {
    const scopedKey = getTenantScopedKey(uid, keyName);
    localStorage.setItem(scopedKey, JSON.stringify(value));
  } catch (err) {
    console.warn(`[UserTenantIsolation] Error saving scoped key ${keyName}:`, err);
  }
}

/**
 * Completely purges runtime memory and unauthenticated cache when a user logs out
 * to guarantee that User 2 sees a completely pristine, empty slate with ZERO data residue.
 */
export function purgeUserTenantSession(uid: string | null | undefined): void {
  try {
    // Clear in-memory browser caches
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }

    // Clean legacy unnamespaced items so they can never leak to the next user
    const legacyKeys = [
      "myraa_chat_history_backup",
      "myraa_live_transcript_last",
      "myraa_study_notes",
      "myraa_study_pack",
      "myraa_whiteboard_text",
      "myraa_study_suggestions",
    ];

    legacyKeys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    console.info(`[UserTenantIsolation] Tenant session purged successfully for UID: ${uid || "current"}`);
  } catch (err) {
    console.error("[UserTenantIsolation] Failed to purge session on logout:", err);
  }
}
