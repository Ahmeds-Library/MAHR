/**
 * Layer 2 (Business Logic & Storage Persistence):
 * Manages reading, saving, and synchronizing installed/enabled plugins in localStorage.
 * Defaults to an empty map `{}` so MAHR runs as a Pure Voice Agent with zero plugins installed initially.
 */

import { InstalledPluginsMap, MahrPluginId } from "../layer1_data/pluginTypes";
import { MAHR_PLUGIN_CATALOG } from "../layer1_data/pluginCatalog";

const STORAGE_KEY = "mahr_installed_plugins_v1";
export const PLUGIN_STATE_CHANGED_EVENT = "mahr-plugins-updated";

export function loadInstalledPluginsFromStorage(): InstalledPluginsMap {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default: Pure Voice Agent with zero plugins installed initially
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as InstalledPluginsMap;
    }
  } catch (err) {
    console.warn("[PluginStorageService] Failed to parse installed plugins:", err);
  }
  return {};
}

export function saveInstalledPluginsToStorage(map: InstalledPluginsMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(
      new CustomEvent(PLUGIN_STATE_CHANGED_EVENT, {
        detail: { plugins: map },
      })
    );
  } catch (err) {
    console.warn("[PluginStorageService] Failed to save installed plugins:", err);
  }
}

export function isPluginActiveInMap(map: InstalledPluginsMap, pluginId: MahrPluginId): boolean {
  const entry = map[pluginId];
  return Boolean(entry && entry.installed && entry.enabled);
}

export function isPluginInstalledInMap(map: InstalledPluginsMap, pluginId: MahrPluginId): boolean {
  const entry = map[pluginId];
  return Boolean(entry && entry.installed);
}

export function countActivePlugins(map: InstalledPluginsMap): number {
  return MAHR_PLUGIN_CATALOG.reduce((acc, plugin) => {
    return acc + (isPluginActiveInMap(map, plugin.id) ? 1 : 0);
  }, 0);
}

export function countInstalledPlugins(map: InstalledPluginsMap): number {
  return MAHR_PLUGIN_CATALOG.reduce((acc, plugin) => {
    return acc + (isPluginInstalledInMap(map, plugin.id) ? 1 : 0);
  }, 0);
}
