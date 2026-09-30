import { useState, useEffect, useCallback } from "react";
import { FmcMarketSnapshot } from "../../services/slides/infographics/infographicTypes";
import { fetchLiveFmcMarketIntelligence } from "../../services/slides/fmcMarketIntelligenceService";

export function useFmcMarketData(autoFetch = true) {
  const [data, setData] = useState<FmcMarketSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async (force = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const snapshot = await fetchLiveFmcMarketIntelligence(force);
      setData(snapshot);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err?.message || "Failed to load live FMC market intelligence");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      refreshData(false);
    }
  }, [autoFetch, refreshData]);

  return {
    data,
    isLoading,
    lastRefreshed,
    error,
    refreshData
  };
}
