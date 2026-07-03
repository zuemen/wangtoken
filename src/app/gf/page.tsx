"use client";

import { useState } from "react";
import { useData, postJSON } from "@/lib/useData";
import { useToast } from "@/components/RealtimeProvider";
import { SectionTitle, StatusBadge } from "@/components/ui";
import PhotoInput from "@/components/PhotoInput";
import { fmtPoints, fmtTime } from "@/lib/format";
import type { Preset } from "@/lib/types";

export default function GfPage() {
  const { data, refetch } = useData();
  const toast = useToast();

  const [recordPreset, setRecordPreset] = useState<Preset | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 提案表單
  const [propName, setPropName] = useState("");
  const [propPoints, setPropPoints] = useState("");
  const [propPhoto, setPropPhoto] = useState<string | null>(null);
  const [propBusy, setPropBusy] = useState(false);

  const bonusPresets = (data?.presets ?? []).filter((p) => p.active && p.type === "bonus");
  const todayCounts = data?.todayCounts ?? {};
  const myProposals = (data?.entries ?? []).filter((e) => e.kind === "proposal");

  function remaining(p: Preset): number | null {
    if (p.daily_limit == null) return null;
    return Math.max(0, p.daily_limit - (todayCounts[p.label] ?? 0));
  }

  async function submitRecord() {
    if (!recordPreset || busy) return;
    setBusy(true);
    const r = await postJSON("/api/entries", {
      presetId: recordPreset.id,
      note: note || null,
      photoPath: photo,
    });
    setBusy(false);
    if (r.ok) {
      const pending = (r.json as { status?: string }).status === "pending";
      toast(pending ? "已送出，等他審核 💌" : `記好了 ${fmtPoints(Number(recordPreset.points))} 🎉`);
      setRecordPreset(null);
      setNote("");
      setPhoto(null);
      refetch();
    } else {
      toast(r.error!);
      setBusy(false);
    }
  }

  async function submitProposal(e: React.FormEvent) {
    e.preventDefault();
    if (propBusy) return;
    setPropBusy(true);
    const r = await postJSON("/api/proposals", {
      name: propName,
      points: Number(propPoints),
      photoPath: propPhoto,
    });
    setPropBusy(false);
    if (r.ok) {
      setPropName(""); setPropPoints(""); setPropPhoto(null);
      toast("提案送出，等他審核 💌");
      refetch();
    } else toast(r.error!);
  }

  return (
    <div>
      <h1 className="text-xl font-black">💕 女友專區</h1>
      <p className="mt-1 text-sm text-plum/60">做了好事就來記一筆吧！</p>

      {/* 好事快速按鈕 */}
      <SectionTitle>今天做了什麼好事？</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {bonusPresets.map((p) => {
          const left = remaining(p);
          const locked = left !== null && left <= 0;
          return (
            <button
              key={p.id}
              className={`card pressable p-3.5 text-left ${locked ? "opacity-50" : ""}`}
              onClick={() => !locked && setRecordPreset(p)}
              disabled={locked}
            >
              <div className="text-sm font-bold leading-snug">{p.label}</div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-base font-black text-mint">{fmtPoints(Number(p.points))}</span>
                <span className="text-[10px] text-plum/50">
                  {locked ? "🔒 今日已達上限" : left !== null ? `今日還可 ${left} 次` : p.requires_review ? "需審核" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 提案表單 */}
      <SectionTitle>我做了別的好事（提案）</SectionTitle>
      <form onSubmit={submitProposal} className="card space-y-2.5 p-4">
        <input
          value={propName}
          onChange={(e) => setPropName(e.target.value)}
          placeholder="做了什麼呢？"
          className="w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <input
          value={propPoints}
          onChange={(e) => setPropPoints(e.target.value)}
          type="number"
          step="0.1"
          min="0.1"
          placeholder="建議分數（例：0.5）"
          className="w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <PhotoInput value={propPhoto} onChange={setPropPhoto} />
        <button
          type="submit"
          className="pressable w-full rounded-xl bg-plum py-2.5 text-sm font-bold text-cream"
          disabled={propBusy || !propName.trim() || !propPoints}
        >
          {propBusy ? "送出中…" : "送出提案 💌"}
        </button>
      </form>

      {/* 我的提案 */}
      <SectionTitle>我的提案</SectionTitle>
      <div className="card px-4 py-1">
        {myProposals.length === 0 && (
          <div className="py-6 text-center text-sm text-plum/40">還沒有提案</div>
        )}
        {myProposals.map((e) => (
          <div key={e.id} className="passbook-divider flex items-center gap-2 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">{e.label}</span>
                <StatusBadge status={e.status} />
                {e.status === "approved" && (
                  <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[11px] text-mint">已核准</span>
                )}
              </div>
              <div className="text-xs text-plum/50">{fmtTime(e.created_at)}</div>
            </div>
            <div className="text-sm font-bold text-mint">{fmtPoints(Number(e.points))}</div>
          </div>
        ))}
      </div>

      {/* 快速記錄 modal */}
      {recordPreset && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-plum/60 sm:items-center"
          onClick={() => !busy && setRecordPreset(null)}
        >
          <div
            className="card w-full max-w-md rounded-b-none p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-baseline justify-between">
              <div className="text-base font-bold">{recordPreset.label}</div>
              <div className="text-lg font-black text-mint">{fmtPoints(Number(recordPreset.points))}</div>
            </div>
            {recordPreset.requires_review && (
              <div className="mt-1 text-xs text-gold">此項目需要他審核後才入帳</div>
            )}
            <div className="mt-3 space-y-2.5">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="備註（選填）"
                rows={2}
                className="w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
              <PhotoInput value={photo} onChange={setPhoto} />
              <button
                className="pressable w-full rounded-xl bg-plum py-3 text-sm font-bold text-cream"
                onClick={submitRecord}
                disabled={busy}
              >
                {busy ? "記錄中…" : "記一筆 ✍️"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
