/**
 * Layer 2 (Business Logic Hook):
 * Manages category filtering ('all' | 'productivity' | 'research' | 'visuals' | 'utilities' | 'installed'),
 * live search query matching, sort ordering, and dynamic per-category item counts
 * for the MAHR Extensions & Add-ons Marketplace Modal.
 */

import { useState, useMemo, useCallback } from "react";
import {
  InstalledPluginsMap,
  MarketplaceFilterCategory,
  MarketplaceSortOrder,
  MahrPluginDefinition,
  MahrPluginCategoryMeta,
} from "../layer1_data/pluginTypes";
import {
  MAHR_PLUGIN_CATALOG,
  MAHR_PLUGIN_CATEGORIES,
} from "../layer1_data/pluginCatalog";
import {
  isPluginInstalledInMap,
  isPluginActiveInMap,
} from "./pluginStorageService";

export interface UseMarketplaceFilterResult {
  selectedCategory: MarketplaceFilterCategory;
  setSelectedCategory: (category: MarketplaceFilterCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: MarketplaceSortOrder;
  setSortOrder: (order: MarketplaceSortOrder) => void;
  categoryCounts: Record<MarketplaceFilterCategory, number>;
  filteredPlugins: MahrPluginDefinition[];
  featuredPlugins: MahrPluginDefinition[];
  activeCategoryMeta: MahrPluginCategoryMeta;
  resetFilters: () => void;
}

export function useMarketplaceFilter(
  pluginsMap: InstalledPluginsMap
): UseMarketplaceFilterResult {
  const [selectedCategory, setSelectedCategory] =
    useState<MarketplaceFilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<MarketplaceSortOrder>("featured");

  const categoryCounts = useMemo<Record<MarketplaceFilterCategory, number>>(() => {
    const counts: Record<MarketplaceFilterCategory, number> = {
      all: MAHR_PLUGIN_CATALOG.length,
      productivity: 0,
      research: 0,
      visuals: 0,
      utilities: 0,
      installed: 0,
    };

    for (const plugin of MAHR_PLUGIN_CATALOG) {
      counts[plugin.category] = (counts[plugin.category] || 0) + 1;
      if (isPluginInstalledInMap(pluginsMap, plugin.id)) {
        counts.installed += 1;
      }
    }

    return counts;
  }, [pluginsMap]);

  const featuredPlugins = useMemo<MahrPluginDefinition[]>(() => {
    return MAHR_PLUGIN_CATALOG.filter((p) => p.featured);
  }, []);

  const filteredPlugins = useMemo<MahrPluginDefinition[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    const matched = MAHR_PLUGIN_CATALOG.filter((plugin) => {
      // 1. Category / Installed Filter
      if (selectedCategory === "installed") {
        if (!isPluginInstalledInMap(pluginsMap, plugin.id)) {
          return false;
        }
      } else if (selectedCategory !== "all") {
        if (plugin.category !== selectedCategory) {
          return false;
        }
      }

      // 2. Live Search Filter
      if (query.length > 0) {
        const matchesName = plugin.name.toLowerCase().includes(query);
        const matchesShort = plugin.shortTitle.toLowerCase().includes(query);
        const matchesTagline = plugin.tagline.toLowerCase().includes(query);
        const matchesDesc = plugin.description.toLowerCase().includes(query);
        const matchesCategory = plugin.categoryLabel.toLowerCase().includes(query);
        const matchesCaps = plugin.capabilities.some((c) =>
          c.toLowerCase().includes(query)
        );
        const matchesTriggers = plugin.voiceTriggers.some((t) =>
          t.toLowerCase().includes(query)
        );

        return (
          matchesName ||
          matchesShort ||
          matchesTagline ||
          matchesDesc ||
          matchesCategory ||
          matchesCaps ||
          matchesTriggers
        );
      }

      return true;
    });

    // 3. Sort Order
    return [...matched].sort((a, b) => {
      if (sortOrder === "alphabetical") {
        return a.name.localeCompare(b.name);
      }

      if (sortOrder === "installed") {
        const aActive = isPluginActiveInMap(pluginsMap, a.id) ? 2 : isPluginInstalledInMap(pluginsMap, a.id) ? 1 : 0;
        const bActive = isPluginActiveInMap(pluginsMap, b.id) ? 2 : isPluginInstalledInMap(pluginsMap, b.id) ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return a.name.localeCompare(b.name);
      }

      // Default: "featured"
      const aFeat = a.featured ? 1 : 0;
      const bFeat = b.featured ? 1 : 0;
      if (bFeat !== aFeat) return bFeat - aFeat;
      return 0;
    });
  }, [selectedCategory, searchQuery, sortOrder, pluginsMap]);

  const activeCategoryMeta = useMemo<MahrPluginCategoryMeta>(() => {
    return (
      MAHR_PLUGIN_CATEGORIES.find((c) => c.id === selectedCategory) ||
      MAHR_PLUGIN_CATEGORIES[0]
    );
  }, [selectedCategory]);

  const resetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSortOrder("featured");
  }, []);

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    categoryCounts,
    filteredPlugins,
    featuredPlugins,
    activeCategoryMeta,
    resetFilters,
  };
}
