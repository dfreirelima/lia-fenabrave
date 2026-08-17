import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const DEFAULT_INTERVAL_MS = 2000;

type PollOptions<T> = {
  fetcher: () => Promise<T>;
  intervalMs?: number;
  enabled?: boolean;
};

export function usePolling<T>({
  fetcher,
  intervalMs = DEFAULT_INTERVAL_MS,
  enabled = true,
}: PollOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);

  fetcherRef.current = fetcher;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const next = await fetcherRef.current();
      if (!mountedRef.current) return;
      setData(next);
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Falha ao carregar dados");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let appState: AppStateStatus = AppState.currentState;

    const start = () => {
      void load(false);
      timer = setInterval(() => void load(false), intervalMs);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();

    const sub = AppState.addEventListener("change", (next) => {
      if (appState.match(/inactive|background/) && next === "active") {
        start();
      } else if (next.match(/inactive|background/)) {
        stop();
      }
      appState = next;
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [enabled, intervalMs, load]);

  return {
    data,
    error,
    loading,
    refreshing,
    updatedAt,
    refresh: () => load(true),
  };
}
