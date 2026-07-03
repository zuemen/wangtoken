"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useData, postJSON } from "@/lib/useData";
import { fmtNTD, fmtPoints } from "@/lib/format";
import { EntryRow, SectionTitle } from "@/components/ui";
import Confetti from "@/components/Confetti";
import type { Entry } from "@/lib/types";

type Filter = "all" | "bonus" | "deduct" | "redeem" | "pending";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "bonus", label: "加分" },
  { key: "deduct", label: "扣分" },
  { key: "redeem", label: "兌換" },
  { key: "pending", label: "待審核" },
];

function weekdayShort(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00+08:00`).toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    weekday: "narrow",
  });
}

export default function OverviewPage() {
  const { data, loading, refetch } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  const [celebrate, setCelebrate] = useState(false);
  const streakChecked = useRef(false);

  // 進總覽時檢查 streak，發放則慶祝
  useEffect(() => {
    if (streakChecked.current) return;
    streakChecked.current = true;
    postJSON("/api/streak").then((r) => {
      if (r.ok && (r.json as { awarded?: boolean }).awarded) {
        setCelebrate(true);
        refetch();
        setTimeout(() => setCelebrate(false), 4500);
      }
    });
  }, [refetch]);

  const entries = data?.entries ?? [];

  const filtered = useMemo(() => {
    return entries.filter((e: Entry) => {
      if (filter === "all") return true;
      if (filter === "pending") return e.status === "pending";
      if (filter === "bonus") return (e.kind === "bonus" || e.kind === "proposal") && Number(e.points) > 0 && e.status !== "rejected";
      if (filter === "deduct") return e.kind === "deduct";
      if (filter === "redeem") return e.kind === "redeem";
      return true;
    });
  }, [entries, filter]);

  // 本週（近 7 天）每日加減分
  const weekly = useMemo(() => {
    const days: { date: string; plus: number; minus: number }[] = [];
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" });
    const today = new Date(`${fmt.format(new Date())}T00:00:00+08:00`);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      days.push({ date: fmt.format(d), plus: 0, minus: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const e of entries) {
      if (e.status !== "approved" || e.kind === "redeem" || e.kind === "care") continue;
      const key = fmt.format(new Date(e.created_at));
      const i = idx.get(key);
      if (i === undefined) continue;
      const p = Number(e.points);
      if (p > 0) days[i].plus += p;
      else days[i].minus += -p;
    }
    return days;
  }, [entries]);

  const maxBar = Math.max(0.5, ...weekly.flatMap((d) => [d.plus, d.minus]));
  const balance = Number(data?.balance ?? 0);

  return (
    <div>
      {celebrate && (
        <>
          <Confetti />
          <div className="card mb-4 border border-gold/50 p-4 text-center text-sm font-bold text-gold">
            🔥 連續 7 天乖乖聽話達成！+1.0 分入帳 🎉
          </div>
        </>
      )}

      {/* 餘額大卡 */}
      <div className="card relative overflow-hidden p-6">
        <div className="absolute right-4 top-4 text-3xl opacity-20">💞</div>
        <div className="text-xs tracking-widest text-plum/50">PANGDAI POINTS・目前餘額</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-black tabular-nums">{balance.toFixed(1)}</span>
          <span className="text-lg font-bold text-plum/60">分</span>
        </div>
        <div className="mt-1 text-sm font-medium text-gold">約 {fmtNTD(balance)}</div>
      </div>

      {/* 本週迷你長條圖 */}
      <SectionTitle>本週加減分</SectionTitle>
      <div className="card flex items-end justify-between gap-2 p-4">
        {weekly.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full flex-col items-center justify-end gap-0.5">
              {d.plus > 0 && (
                <div
                  className="w-3.5 rounded-t bg-mint"
                  style={{ height: `${Math.max(6, (d.plus / maxBar) * 56)}px` }}
                  title={`+${d.plus.toFixed(1)}`}
                />
              )}
              {d.minus > 0 && (
                <div
                  className="w-3.5 rounded-b bg-coral"
                  style={{ height: `${Math.max(6, (d.minus / maxBar) * 56)}px` }}
                  title={`-${d.minus.toFixed(1)}`}
                />
              )}
              {d.plus === 0 && d.minus === 0 && <div className="h-1.5 w-3.5 rounded bg-plum/10" />}
            </div>
            <div className="text-[10px] text-plum/50">{weekdayShort(d.date)}</div>
            <div className="text-[10px] font-medium tabular-nums text-plum/70">
              {d.plus - d.minus === 0 ? "·" : fmtPoints(d.plus - d.minus)}
            </div>
          </div>
        ))}
      </div>

      {/* 帳本 */}
      <SectionTitle>存摺明細</SectionTitle>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`pressable shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              filter === f.key ? "bg-plum text-cream" : "bg-cream text-plum/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="card px-4 py-1">
        {loading && <div className="py-8 text-center text-sm text-plum/40">讀取中…</div>}
        {!loading && filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-plum/40">還沒有紀錄，快去記一筆吧 ✍️</div>
        )}
        {filtered.map((e) => (
          <EntryRow key={e.id} entry={e} />
        ))}
      </div>
    </div>
  );
}
