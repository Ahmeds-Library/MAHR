/**
 * Layer 2 (Business Logic Hook):
 * Central React hook for managing MAHR's modular plugins, 1-click bundles,
 * real-time hot-swapping, live memory footprint telemetry, Pure Voice Agent mode reset,
 * and polite voice-triggered 1-click install prompts.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HotSwapEvent,
  InstalledPluginsMap,
  MahrPluginDefinition,
  MahrPluginId,
  PendingVoicePluginPrompt,
} from "../layer1_data/pluginTypes";
import {
  MAHR_PLUGIN_CATALOG,
  MAHR_PLUGIN_BUNDLES,
  getPluginDefinitionById,
} from "../layer1_data/pluginCatalog";
import {
  loadInstalledPluginsFromStorage,
  saveInstalledPluginsToStorage,
  isPluginActiveInMap,
  isPluginInstalledInMap,
  countActivePlugins,
  countInstalledPlugins,
  PLUGIN_STATE_CHANGED_EVENT,
} from "./pluginStorageService";
import { buildPolitePluginOfferSpeech } from "./voicePluginIntentGuard";
import { calculatePluginMemoryStats } from "./lazyPluginRegistry";

export function useMahrPluginManager() {
  const [pluginsMap, setPluginsMap] = useState<InstalledPluginsMap>(() =>
    loadInstalledPluginsFromStorage()
  );
  const [isPluginStoreOpen, setIsPluginStoreOpen] = useState(false);
  const [pendingVoicePrompt, setPendingVoicePrompt] =
    useState<PendingVoicePluginPrompt | null>(null);
  const [lastHotSwapEvent, setLastHotSwapEvent] = useState<HotSwapEvent | null>(
    null
  );

  // Sync across tabs or custom events
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ plugins?: InstalledPluginsMap }>;
      if (customEvent.detail?.plugins) {
        setPluginsMap(customEvent.detail.plugins);
      } else {
        setPluginsMap(loadInstalledPluginsFromStorage());
      }
    };
    window.addEventListener(PLUGIN_STATE_CHANGED_EVENT, handleStorageChange);
    return () =>
      window.removeEventListener(PLUGIN_STATE_CHANGED_EVENT, handleStorageChange);
  }, []);

  const isPluginActive = useCallback(
    (pluginId: MahrPluginId): boolean => {
      return isPluginActiveInMap(pluginsMap, pluginId);
    },
    [pluginsMap]
  );

  const isPluginInstalled = useCallback(
    (pluginId: MahrPluginId): boolean => {
      return isPluginInstalledInMap(pluginsMap, pluginId);
    },
    [pluginsMap]
  );

  const installPlugin = useCallback((pluginId: MahrPluginId) => {
    const def = getPluginDefinitionById(pluginId);
    setPluginsMap((prev) => {
      const wasActive = isPluginActiveInMap(prev, pluginId);
      const next: InstalledPluginsMap = {
        ...prev,
        [pluginId]: {
          installed: true,
          enabled: true,
          installedAt: prev[pluginId]?.installedAt || new Date().toISOString(),
        },
      };
      saveInstalledPluginsToStorage(next);
      const nextStats = calculatePluginMemoryStats(next);
      setLastHotSwapEvent({
        id: `hs_${Date.now()}_${pluginId}`,
        pluginId,
        pluginName: def?.shortTitle || def?.name || pluginId,
        action: "installed",
        deltaKb: wasActive ? 0 : def?.estimatedChunkKb ?? 48,
        activeMemoryKb: nextStats.activeMemoryKb,
        timestamp: Date.now(),
      });
      return next;
    });
  }, []);

  const uninstallPlugin = useCallback((pluginId: MahrPluginId) => {
    const def = getPluginDefinitionById(pluginId);
    setPluginsMap((prev) => {
      const wasActive = isPluginActiveInMap(prev, pluginId);
      const next: InstalledPluginsMap = { ...prev };
      delete next[pluginId];
      saveInstalledPluginsToStorage(next);
      const nextStats = calculatePluginMemoryStats(next);
      setLastHotSwapEvent({
        id: `hs_${Date.now()}_${pluginId}`,
        pluginId,
        pluginName: def?.shortTitle || def?.name || pluginId,
        action: "uninstalled",
        deltaKb: wasActive ? -(def?.estimatedChunkKb ?? 48) : 0,
        activeMemoryKb: nextStats.activeMemoryKb,
        timestamp: Date.now(),
      });
      return next;
    });
  }, []);

  const togglePluginEnabled = useCallback((pluginId: MahrPluginId) => {
    const def = getPluginDefinitionById(pluginId);
    setPluginsMap((prev) => {
      const current = prev[pluginId];
      const nextEnabled = current ? !current.enabled : true;
      const next: InstalledPluginsMap = {
        ...prev,
        [pluginId]: {
          installed: true,
          enabled: nextEnabled,
          installedAt: current?.installedAt || new Date().toISOString(),
        },
      };
      saveInstalledPluginsToStorage(next);
      const nextStats = calculatePluginMemoryStats(next);
      const chunkKb = def?.estimatedChunkKb ?? 48;
      setLastHotSwapEvent({
        id: `hs_${Date.now()}_${pluginId}`,
        pluginId,
        pluginName: def?.shortTitle || def?.name || pluginId,
        action: nextEnabled ? "enabled" : "disabled",
        deltaKb: nextEnabled ? chunkKb : -chunkKb,
        activeMemoryKb: nextStats.activeMemoryKb,
        timestamp: Date.now(),
      });
      return next;
    });
  }, []);

  const applyPluginBundle = useCallback((bundleId: string) => {
    const bundle = MAHR_PLUGIN_BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) return;
    setPluginsMap((prev) => {
      const prevStats = calculatePluginMemoryStats(prev);
      const next: InstalledPluginsMap = { ...prev };
      const now = new Date().toISOString();
      for (const pid of bundle.pluginIds) {
        next[pid] = {
          installed: true,
          enabled: true,
          installedAt: prev[pid]?.installedAt || now,
        };
      }
      saveInstalledPluginsToStorage(next);
      const nextStats = calculatePluginMemoryStats(next);
      setLastHotSwapEvent({
        id: `hs_${Date.now()}_${bundleId}`,
        pluginName: bundle.name,
        action: "bundle-applied",
        deltaKb: Math.max(0, nextStats.activeMemoryKb - prevStats.activeMemoryKb),
        activeMemoryKb: nextStats.activeMemoryKb,
        timestamp: Date.now(),
      });
      return next;
    });
  }, []);

  const installAllPlugins = useCallback(() => {
    setPluginsMap((prev) => {
      const prevStats = calculatePluginMemoryStats(prev);
      const now = new Date().toISOString();
      const next: InstalledPluginsMap = {};
      for (const plugin of MAHR_PLUGIN_CATALOG) {
        next[plugin.id] = {
          installed: true,
          enabled: true,
          installedAt: now,
        };
      }
      saveInstalledPluginsToStorage(next);
      const nextStats = calculatePluginMemoryStats(next);
      setLastHotSwapEvent({
        id: `hs_${Date.now()}_all`,
        pluginName: "All 15 Extensions",
        action: "bundle-applied",
        deltaKb: Math.max(0, nextStats.activeMemoryKb - prevStats.activeMemoryKb),
        activeMemoryKb: nextStats.activeMemoryKb,
        timestamp: Date.now(),
      });
      return next;
    });
  }, []);

  const resetToPureVoiceAgent = useCallback(() => {
    setPluginsMap((prev) => {
      const prevStats = calculatePluginMemoryStats(prev);
      const empty: InstalledPluginsMap = {};
      saveInstalledPluginsToStorage(empty);
      setLastHotSwapEvent({
        id: `hs_${Date.now()}_reset`,
        pluginName: "Pure Voice Agent",
        action: "reset-pure-voice",
        deltaKb: -prevStats.activeMemoryKb,
        activeMemoryKb: 0,
        ejectedActiveWorkspace: true,
        timestamp: Date.now(),
      });
      return empty;
    });
  }, []);

  const markHotSwapWorkspaceEjected = useCallback((pluginId: MahrPluginId) => {
    const def = getPluginDefinitionById(pluginId);
    setLastHotSwapEvent((prev) => {
      if (!prev) {
        return {
          id: `hs_${Date.now()}_eject_${pluginId}`,
          pluginId,
          pluginName: def?.shortTitle || def?.name || pluginId,
          action: "disabled",
          deltaKb: -(def?.estimatedChunkKb ?? 48),
          activeMemoryKb: 0,
          ejectedActiveWorkspace: true,
          timestamp: Date.now(),
        };
      }
      return {
        ...prev,
        ejectedActiveWorkspace: true,
      };
    });
  }, []);

  const dismissHotSwapEvent = useCallback(() => {
    setLastHotSwapEvent(null);
  }, []);

  /**
   * Checks if `pluginId` is installed & enabled.
   * - If active: runs `onExecute()` immediately and returns `true`.
   * - If not active: speaks a polite offer and displays the 1-Click Install & Open toast.
   */
  const requestPluginOrRun = useCallback(
    (
      pluginId: MahrPluginId,
      onExecute: () => void,
      speakNotification?: (msg: string) => void
    ): boolean => {
      if (isPluginActiveInMap(pluginsMap, pluginId)) {
        onExecute();
        return true;
      }

      const def = getPluginDefinitionById(pluginId);
      const spokenMessage = buildPolitePluginOfferSpeech(pluginId);
      if (speakNotification) {
        speakNotification(spokenMessage);
      }

      setPendingVoicePrompt({
        pluginId,
        pluginName: def?.name || pluginId,
        spokenMessage,
        triggeredAt: Date.now(),
        onConfirmInstallAndRun: () => {
          installPlugin(pluginId);
          setPendingVoicePrompt(null);
          setTimeout(() => {
            onExecute();
          }, 80);
        },
      });
      return false;
    },
    [pluginsMap, installPlugin]
  );

  const dismissPendingVoicePrompt = useCallback(() => {
    setPendingVoicePrompt(null);
  }, []);

  const activeCount = useMemo(() => countActivePlugins(pluginsMap), [pluginsMap]);
  const installedCount = useMemo(
    () => countInstalledPlugins(pluginsMap),
    [pluginsMap]
  );
  const totalAvailableCount = MAHR_PLUGIN_CATALOG.length;
  const isPureVoiceMode = activeCount === 0;

  const memoryStats = useMemo(
    () => calculatePluginMemoryStats(pluginsMap),
    [pluginsMap]
  );

  const activePluginsList = useMemo<MahrPluginDefinition[]>(() => {
    return MAHR_PLUGIN_CATALOG.filter((p) => isPluginActiveInMap(pluginsMap, p.id));
  }, [pluginsMap]);

  return {
    pluginsMap,
    activeCount,
    installedCount,
    totalAvailableCount,
    isPureVoiceMode,
    activePluginsList,
    activeMemoryKb: memoryStats.activeMemoryKb,
    dormantSavedKb: memoryStats.dormantSavedKb,
    totalEcosystemKb: memoryStats.totalEcosystemKb,
    lastHotSwapEvent,
    dismissHotSwapEvent,
    markHotSwapWorkspaceEjected,
    isPluginStoreOpen,
    setIsPluginStoreOpen,
    pendingVoicePrompt,
    dismissPendingVoicePrompt,
    isPluginActive,
    isPluginInstalled,
    installPlugin,
    uninstallPlugin,
    togglePluginEnabled,
    applyPluginBundle,
    installAllPlugins,
    resetToPureVoiceAgent,
    requestPluginOrRun,
  };
}

