"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Toast = { id: number; msg: string };
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

/** 通知所有頁面 refetch /api/data */
export function triggerRefetch() {
  window.dispatchEvent(new Event("lp:refetch"));
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const sb = createClient(url, key, { auth: { persistSession: false } });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const debouncedRefetch = () => {
      clearTimeout(timer);
      timer = setTimeout(() => triggerRefetch(), 300);
    };

    const ch = sb.channel("lp-sync");
    for (const table of ["entries", "rewards", "presets", "wishes"]) {
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: { eventType: string; new?: Record<string, unknown> }) => {
          debouncedRefetch();
          if (table === "entries" && payload.eventType === "INSERT" && payload.new) {
            const p = Number(payload.new.points ?? 0);
            const label = String(payload.new.label ?? "");
            addToast(
              p !== 0
                ? `對方剛記了一筆 ${p > 0 ? "+" : ""}${p.toFixed(1)}｜${label}`
                : `新紀錄：${label}`
            );
          }
        }
      );
    }
    ch.subscribe();

    return () => {
      clearTimeout(timer);
      sb.removeChannel(ch);
    };
  }, [addToast]);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div className="fixed bottom-24 left-1/2 z-50 flex w-[92%] max-w-md -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-item rounded-xl bg-plum/95 px-4 py-2.5 text-sm text-cream shadow-lg"
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
