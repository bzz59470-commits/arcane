import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MAX_PRICE_USD, DEFAULT_RANKS } from "../lib/funpay.js";

const DEFAULT_INTERVAL_MS = 30_000;

/**
 * Polls `/api/funpay` (server-side FunPay scrape) and keeps the latest
 * result. Polling pauses while the tab is hidden and aborts in-flight
 * requests on filter changes / unmount.
 */
export function useFunpayFeed({
  maxPrice = DEFAULT_MAX_PRICE_USD,
  ranks = DEFAULT_RANKS,
  servers = [],
  intervalMs = DEFAULT_INTERVAL_MS,
  enabled = true,
} = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: enabled,
    updatedAt: null,
  });
  const controllerRef = useRef(null);
  const ranksKey = ranks.join(",");
  const serversKey = servers.join(",");

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((s) => ({ ...s, loading: true }));
    const params = new URLSearchParams({ max: String(maxPrice), ranks: ranksKey });
    if (serversKey) params.set("servers", serversKey);
    try {
      const response = await fetch(`/api/funpay?${params}`, {
        signal: controller.signal,
        headers: { accept: "application/json" },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) {
        throw new Error(body?.error || `Feed unavailable (HTTP ${response.status})`);
      }
      setState({ data: body, error: null, loading: false, updatedAt: Date.now() });
    } catch (error) {
      if (error?.name === "AbortError") return;
      setState((s) => ({
        ...s,
        error: error?.message || "Feed unavailable",
        loading: false,
      }));
    }
  }, [maxPrice, ranksKey, serversKey]);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    let timer = null;
    const start = () => {
      if (timer) return;
      timer = window.setInterval(() => {
        if (document.visibilityState === "visible") load();
      }, intervalMs);
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        load();
        start();
      } else {
        stop();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      controllerRef.current?.abort();
    };
  }, [enabled, intervalMs, load]);

  return { ...state, refresh: load };
}
