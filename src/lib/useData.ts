"use client";

import { useCallback, useEffect, useState } from "react";
import type { DataPayload } from "./types";

export function useData() {
  const [data, setData] = useState<DataPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } catch {
      // 離線等情況下靜默失敗，下次事件再試
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const handler = () => refetch();
    window.addEventListener("lp:refetch", handler);
    return () => window.removeEventListener("lp:refetch", handler);
  }, [refetch]);

  return { data, loading, refetch };
}

/** POST JSON helper：回傳 { ok, error, json } */
export async function postJSON(url: string, body?: unknown, method = "POST") {
  try {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, error: r.ok ? null : (json.error ?? "發生錯誤"), json };
  } catch {
    return { ok: false, error: "連線失敗", json: {} };
  }
}
