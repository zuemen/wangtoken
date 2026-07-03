"use client";

import { useState } from "react";
import { useData, postJSON } from "@/lib/useData";
import { useToast } from "@/components/RealtimeProvider";
import { ConfirmModal, SectionTitle } from "@/components/ui";
import { fmtTime } from "@/lib/format";
import type { Reward, Wish } from "@/lib/types";

export default function RewardsPage() {
  const { data, refetch } = useData();
  const toast = useToast();
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [busy, setBusy] = useState(false);

  // 願望表單
  const [wishName, setWishName] = useState("");
  const [wishUrl, setWishUrl] = useState("");
  const [wishNote, setWishNote] = useState("");
  const [wishBusy, setWishBusy] = useState(false);

  const balance = Number(data?.balance ?? 0);
  const rewards = (data?.rewards ?? []).filter((r) => r.active);
  const wishes = data?.wishes ?? [];
  const redeems = (data?.entries ?? []).filter((e) => e.kind === "redeem");
  const isAdmin = data?.isAdmin ?? false;

  async function doRedeem() {
    if (!confirmReward || busy) return;
    setBusy(true);
    const r = await postJSON("/api/redeem", { rewardId: confirmReward.id });
    setBusy(false);
    setConfirmReward(null);
    toast(r.ok ? `兌換成功 🎉 ${confirmReward.name}` : r.error!);
    if (r.ok) refetch();
  }

  async function submitWish(e: React.FormEvent) {
    e.preventDefault();
    if (wishBusy || !wishName.trim()) return;
    setWishBusy(true);
    const r = await postJSON("/api/wishes", { name: wishName, url: wishUrl || null, note: wishNote || null });
    setWishBusy(false);
    if (r.ok) {
      setWishName(""); setWishUrl(""); setWishNote("");
      toast("願望已送出 🌠");
      refetch();
    } else toast(r.error!);
  }

  async function handleWish(w: Wish, action: "accept" | "reject") {
    if (action === "accept") {
      const cost = window.prompt(`「${w.name}」要幾分兌換？`, "5");
      if (cost == null) return;
      const r = await postJSON(`/api/wishes/${w.id}`, { action, cost: Number(cost) });
      toast(r.ok ? "已上架成獎品 🎁" : r.error!);
    } else {
      const r = await postJSON(`/api/wishes/${w.id}`, { action });
      toast(r.ok ? "已婉拒" : r.error!);
    }
    refetch();
  }

  return (
    <div>
      <h1 className="text-xl font-black">🎁 兌換所</h1>
      <div className="mt-1 text-sm text-plum/60">
        目前餘額 <span className="font-bold text-gold">{balance.toFixed(1)} 分</span>
      </div>

      {/* 獎品牆 */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {rewards.map((r) => {
          const afford = balance >= Number(r.cost);
          return (
            <button
              key={r.id}
              className={`card pressable p-4 text-left ${afford ? "" : "opacity-60 grayscale"}`}
              onClick={() => afford && setConfirmReward(r)}
              disabled={!afford}
            >
              <div className="text-3xl">{r.icon ?? "🎁"}</div>
              <div className="mt-2 text-sm font-bold leading-tight">{r.name}</div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-lg font-black text-gold">{Number(r.cost).toFixed(1)}</span>
                <span className="text-xs text-plum/50">分</span>
              </div>
              {r.market_price != null && (
                <div className="text-[11px] text-plum/40">市值約 NT${r.market_price.toLocaleString()}</div>
              )}
              {!afford && <div className="mt-1 text-[11px] text-coral">🔒 還差 {(Number(r.cost) - balance).toFixed(1)} 分</div>}
            </button>
          );
        })}
      </div>

      {/* 兌換紀錄 */}
      <SectionTitle>兌換紀錄</SectionTitle>
      <div className="card px-4 py-1">
        {redeems.length === 0 && <div className="py-6 text-center text-sm text-plum/40">還沒有兌換過</div>}
        {redeems.map((e) => (
          <div key={e.id} className="passbook-divider flex items-center gap-3 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{e.label}</div>
              <div className="text-xs text-plum/50">{fmtTime(e.created_at)}</div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                e.fulfilled ? "bg-mint/15 text-mint" : "bg-gold/20 text-gold"
              }`}
            >
              {e.fulfilled ? "已完成" : "待出貨"}
            </span>
            <div className="text-sm font-bold text-coral">{Number(e.points).toFixed(1)}</div>
          </div>
        ))}
      </div>

      {/* 願望清單 */}
      <SectionTitle>願望清單 🌠</SectionTitle>
      <form onSubmit={submitWish} className="card space-y-2 p-4">
        <input
          value={wishName}
          onChange={(e) => setWishName(e.target.value)}
          placeholder="想要什麼呢？"
          className="w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <input
          value={wishUrl}
          onChange={(e) => setWishUrl(e.target.value)}
          placeholder="商品連結（選填）"
          className="w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <input
          value={wishNote}
          onChange={(e) => setWishNote(e.target.value)}
          placeholder="備註（選填）"
          className="w-full rounded-xl border border-gold/30 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          className="pressable w-full rounded-xl bg-plum py-2.5 text-sm font-bold text-cream"
          disabled={wishBusy || !wishName.trim()}
        >
          {wishBusy ? "送出中…" : "許願 ✨"}
        </button>
      </form>
      <div className="mt-3 space-y-2">
        {wishes.map((w) => (
          <div key={w.id} className="card flex items-center gap-3 p-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">{w.name}</span>
                {w.status === "added" && (
                  <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[11px] text-mint">已上架</span>
                )}
                {w.status === "rejected" && (
                  <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[11px] text-coral">婉拒</span>
                )}
              </div>
              {w.url && (
                <a href={w.url} target="_blank" rel="noreferrer" className="text-xs text-gold underline">
                  查看連結
                </a>
              )}
              {w.note && <div className="text-xs text-plum/50">{w.note}</div>}
            </div>
            {isAdmin && w.status === "open" && (
              <div className="flex shrink-0 gap-1.5">
                <button
                  className="pressable rounded-lg bg-mint px-2.5 py-1.5 text-xs font-bold text-white"
                  onClick={() => handleWish(w, "accept")}
                >
                  轉成獎品
                </button>
                <button
                  className="pressable rounded-lg border border-coral/40 px-2.5 py-1.5 text-xs text-coral"
                  onClick={() => handleWish(w, "reject")}
                >
                  婉拒
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {confirmReward && (
        <ConfirmModal
          title={`兌換「${confirmReward.name}」？`}
          body={`將扣 ${Number(confirmReward.cost).toFixed(1)} 分（餘額 ${balance.toFixed(1)} 分）`}
          confirmText="確認兌換 🎁"
          busy={busy}
          onConfirm={doRedeem}
          onCancel={() => setConfirmReward(null)}
        />
      )}
    </div>
  );
}
