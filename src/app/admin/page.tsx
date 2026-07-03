"use client";

import { useState } from "react";
import { useData, postJSON } from "@/lib/useData";
import { useToast } from "@/components/RealtimeProvider";
import { SectionTitle } from "@/components/ui";
import { fmtPoints, fmtTime } from "@/lib/format";
import type { Entry, Preset, Reward } from "@/lib/types";

export default function AdminPage() {
  const { data, refetch } = useData();

  if (!data) {
    return <div className="py-16 text-center text-sm text-plum/40">讀取中…</div>;
  }
  if (!data.isAdmin) {
    return <PinForm onSuccess={refetch} />;
  }
  return <AdminPanel />;
}

/* ---------- PIN 登入 ---------- */
function PinForm({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const r = await postJSON("/api/admin/login", { pin });
    setBusy(false);
    if (r.ok) onSuccess();
    else setError(r.error);
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="text-4xl">🔐</div>
        <h1 className="mt-2 text-lg font-black">管理者模式</h1>
        <form onSubmit={submit} className="mt-4">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="輸入 PIN"
            className="w-full rounded-xl border border-gold/40 bg-white px-4 py-3 text-center outline-none focus:border-gold"
            autoFocus
          />
          {error && <div className="mt-2 text-sm text-coral">{error}</div>}
          <button
            type="submit"
            className="pressable mt-4 w-full rounded-xl bg-plum py-3 font-bold text-cream"
            disabled={busy || !pin}
          >
            {busy ? "驗證中…" : "解鎖"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- 主面板 ---------- */
function AdminPanel() {
  const { data, refetch } = useData();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const presets = data?.presets ?? [];
  const activePresets = presets.filter((p) => p.active);
  const rewards = data?.rewards ?? [];
  const entries = data?.entries ?? [];
  const pendings = entries.filter((e) => e.status === "pending");
  const redeems = entries.filter((e) => e.kind === "redeem" && e.fulfilled === false);

  async function act(id: string, fn: () => Promise<{ ok: boolean; error: string | null }>) {
    if (busyId) return;
    setBusyId(id);
    const r = await fn();
    setBusyId(null);
    if (!r.ok) toast(r.error!);
    refetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">⚙️ 管理後台</h1>
        <button
          className="pressable rounded-lg border border-plum/20 px-3 py-1.5 text-xs"
          onClick={() => act("logout", () => postJSON("/api/admin/logout"))}
        >
          退出管理模式
        </button>
      </div>

      {/* 快速加/扣分 */}
      <SectionTitle>快速記帳</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {activePresets.map((p) => (
          <button
            key={p.id}
            className="card pressable flex items-center justify-between p-3 text-left"
            onClick={() =>
              act(p.id, () => postJSON("/api/entries", { presetId: p.id, actor: "admin" }))
            }
            disabled={busyId === p.id}
          >
            <span className="truncate text-xs font-medium">{p.label}</span>
            <span
              className={`ml-1 shrink-0 text-sm font-black ${
                Number(p.points) > 0 ? "text-mint" : "text-coral"
              }`}
            >
              {fmtPoints(Number(p.points))}
            </span>
          </button>
        ))}
      </div>

      <CustomEntryForm onDone={refetch} />

      {/* 待審核 */}
      <SectionTitle>待審核（{pendings.length}）</SectionTitle>
      {pendings.length === 0 && <div className="card p-4 text-center text-sm text-plum/40">目前沒有待審核項目</div>}
      <div className="space-y-2">
        {pendings.map((e) => (
          <ReviewCard key={e.id} entry={e} onDone={refetch} />
        ))}
      </div>

      {/* 待出貨 */}
      <SectionTitle>待出貨兌換（{redeems.length}）</SectionTitle>
      {redeems.length === 0 && <div className="card p-4 text-center text-sm text-plum/40">沒有待出貨的兌換</div>}
      <div className="space-y-2">
        {redeems.map((e) => (
          <div key={e.id} className="card flex items-center gap-3 p-3.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{e.label}</div>
              <div className="text-xs text-plum/50">{fmtTime(e.created_at)}</div>
            </div>
            <button
              className="pressable rounded-lg bg-mint px-3 py-1.5 text-xs font-bold text-white"
              onClick={() => act(e.id, () => postJSON(`/api/entries/${e.id}/fulfill`, { fulfilled: true }))}
              disabled={busyId === e.id}
            >
              標記完成 📦
            </button>
          </div>
        ))}
      </div>

      <PresetManager presets={presets} onDone={refetch} />
      <RewardManager rewards={rewards} onDone={refetch} />

      {/* 匯出 / 重置 */}
      <SectionTitle>資料</SectionTitle>
      <div className="card space-y-3 p-4">
        <a
          href="/api/export.csv"
          className="pressable block w-full rounded-xl border border-plum/20 py-2.5 text-center text-sm font-medium"
        >
          ⬇️ 匯出帳本 CSV
        </a>
        <ResetButton onDone={refetch} />
      </div>
    </div>
  );
}

/* ---------- 自訂記帳 ---------- */
function CustomEntryForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [points, setPoints] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const p = Number(points);
    if (!label.trim() || !Number.isFinite(p) || p === 0) {
      toast("請填名稱與非零分數（負數＝扣分）");
      return;
    }
    setBusy(true);
    const r = await postJSON("/api/entries", {
      actor: "admin",
      kind: p > 0 ? "bonus" : "deduct",
      label,
      points: p,
    });
    setBusy(false);
    if (r.ok) {
      setLabel("");
      setPoints("");
      toast("已記帳 ✅");
      onDone();
    } else toast(r.error!);
  }

  return (
    <form onSubmit={submit} className="card mt-3 flex gap-2 p-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="自訂項目"
        className="min-w-0 flex-1 rounded-xl border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <input
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        type="number"
        step="0.1"
        placeholder="±分數"
        className="w-20 rounded-xl border border-gold/30 bg-white px-2 py-2 text-sm outline-none focus:border-gold"
      />
      <button
        type="submit"
        className="pressable shrink-0 rounded-xl bg-plum px-3 py-2 text-sm font-bold text-cream"
        disabled={busy}
      >
        記帳
      </button>
    </form>
  );
}

/* ---------- 審核卡 ---------- */
function ReviewCard({ entry, onDone }: { entry: Entry; onDone: () => void }) {
  const toast = useToast();
  const [points, setPoints] = useState(String(Number(entry.points)));
  const [busy, setBusy] = useState(false);

  async function review(action: "approve" | "reject") {
    if (busy) return;
    setBusy(true);
    const r = await postJSON(`/api/proposals/${entry.id}/review`, {
      action,
      points: action === "approve" ? Number(points) : undefined,
    });
    setBusy(false);
    toast(r.ok ? (action === "approve" ? "已核准 ✅" : "已拒絕") : r.error!);
    onDone();
  }

  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-plum/10 px-2 py-0.5 text-[11px] text-plum/70">
          {entry.kind === "proposal" ? "提案" : "需審核項目"}
        </span>
        <span className="truncate text-sm font-medium">{entry.label}</span>
      </div>
      <div className="mt-0.5 text-xs text-plum/50">
        {fmtTime(entry.created_at)}
        {entry.note && `・「${entry.note}」`}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          type="number"
          step="0.1"
          className="w-20 rounded-lg border border-gold/30 bg-white px-2 py-1.5 text-sm outline-none focus:border-gold"
        />
        <span className="text-xs text-plum/50">分</span>
        <div className="flex-1" />
        <button
          className="pressable rounded-lg bg-mint px-3 py-1.5 text-xs font-bold text-white"
          onClick={() => review("approve")}
          disabled={busy}
        >
          核准
        </button>
        <button
          className="pressable rounded-lg border border-coral/40 px-3 py-1.5 text-xs text-coral"
          onClick={() => review("reject")}
          disabled={busy}
        >
          拒絕
        </button>
      </div>
    </div>
  );
}

/* ---------- 預設項目 CRUD ---------- */
function PresetManager({ presets, onDone }: { presets: Preset[]; onDone: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "bonus", label: "", points: "", dailyLimit: "", requiresReview: false });
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const r = await postJSON("/api/presets", {
      type: form.type,
      label: form.label,
      points: Number(form.points),
      dailyLimit: form.dailyLimit || null,
      requiresReview: form.requiresReview,
    });
    setBusy(false);
    if (r.ok) {
      setForm({ type: "bonus", label: "", points: "", dailyLimit: "", requiresReview: false });
      toast("已新增項目 ✅");
      onDone();
    } else toast(r.error!);
  }

  async function update(p: Preset) {
    const label = window.prompt("項目名稱", p.label);
    if (label == null) return;
    const pts = window.prompt("分數（負數＝扣分）", String(Number(p.points)));
    if (pts == null) return;
    const limit = window.prompt("每日上限（留空＝無限制）", p.daily_limit == null ? "" : String(p.daily_limit));
    if (limit == null) return;
    const r = await postJSON(`/api/presets/${p.id}`, {
      label,
      points: Number(pts),
      dailyLimit: limit === "" ? null : Number(limit),
    }, "PATCH");
    toast(r.ok ? "已更新 ✅" : r.error!);
    onDone();
  }

  async function remove(p: Preset) {
    if (!window.confirm(`停用「${p.label}」？`)) return;
    const r = await postJSON(`/api/presets/${p.id}`, undefined, "DELETE");
    toast(r.ok ? "已停用" : r.error!);
    onDone();
  }

  return (
    <>
      <SectionTitle>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1">
          預設項目管理 {open ? "▾" : "▸"}
        </button>
      </SectionTitle>
      {open && (
        <div className="space-y-2">
          <form onSubmit={create} className="card space-y-2 p-3.5">
            <div className="flex gap-2">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-lg border border-gold/30 bg-white px-2 py-2 text-sm"
              >
                <option value="bonus">加分</option>
                <option value="deduct">扣分</option>
              </select>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="項目名稱"
                className="min-w-0 flex-1 rounded-lg border border-gold/30 bg-white px-2 py-2 text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                type="number" step="0.1" placeholder="分數"
                className="w-20 rounded-lg border border-gold/30 bg-white px-2 py-2 text-sm outline-none"
              />
              <input
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
                type="number" min="1" placeholder="每日上限"
                className="w-24 rounded-lg border border-gold/30 bg-white px-2 py-2 text-sm outline-none"
              />
              <label className="flex items-center gap-1 text-xs text-plum/70">
                <input
                  type="checkbox"
                  checked={form.requiresReview}
                  onChange={(e) => setForm({ ...form, requiresReview: e.target.checked })}
                />
                需審核
              </label>
              <button
                type="submit"
                className="pressable ml-auto rounded-lg bg-plum px-3 py-2 text-xs font-bold text-cream"
                disabled={busy || !form.label.trim() || !form.points}
              >
                新增
              </button>
            </div>
          </form>
          {presets.filter((p) => p.active).map((p) => (
            <div key={p.id} className="card flex items-center gap-2 p-3">
              <span className={`text-sm font-black ${p.type === "bonus" ? "text-mint" : "text-coral"}`}>
                {fmtPoints(Number(p.points))}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{p.label}</span>
              <span className="text-[10px] text-plum/40">
                {p.daily_limit != null && `限${p.daily_limit}/日`}
                {p.requires_review && "・審"}
              </span>
              <button className="pressable text-xs text-gold" onClick={() => update(p)}>編輯</button>
              <button className="pressable text-xs text-coral" onClick={() => remove(p)}>停用</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- 獎品 CRUD ---------- */
function RewardManager({ rewards, onDone }: { rewards: Reward[]; onDone: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ icon: "", name: "", cost: "", marketPrice: "" });
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const r = await postJSON("/api/rewards", {
      icon: form.icon || "🎁",
      name: form.name,
      cost: Number(form.cost),
      marketPrice: form.marketPrice || null,
    });
    setBusy(false);
    if (r.ok) {
      setForm({ icon: "", name: "", cost: "", marketPrice: "" });
      toast("已新增獎品 ✅");
      onDone();
    } else toast(r.error!);
  }

  async function update(rw: Reward) {
    const name = window.prompt("獎品名稱", rw.name);
    if (name == null) return;
    const cost = window.prompt("兌換點數", String(Number(rw.cost)));
    if (cost == null) return;
    const r = await postJSON(`/api/rewards/${rw.id}`, { name, cost: Number(cost) }, "PATCH");
    toast(r.ok ? "已更新 ✅" : r.error!);
    onDone();
  }

  async function remove(rw: Reward) {
    if (!window.confirm(`下架「${rw.name}」？`)) return;
    const r = await postJSON(`/api/rewards/${rw.id}`, undefined, "DELETE");
    toast(r.ok ? "已下架" : r.error!);
    onDone();
  }

  return (
    <>
      <SectionTitle>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1">
          獎品管理 {open ? "▾" : "▸"}
        </button>
      </SectionTitle>
      {open && (
        <div className="space-y-2">
          <form onSubmit={create} className="card flex flex-wrap items-center gap-2 p-3.5">
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="🎁"
              className="w-12 rounded-lg border border-gold/30 bg-white px-2 py-2 text-center text-sm outline-none"
            />
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="獎品名稱"
              className="min-w-0 flex-1 rounded-lg border border-gold/30 bg-white px-2 py-2 text-sm outline-none"
            />
            <input
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              type="number" step="0.1" min="0.1" placeholder="點數"
              className="w-16 rounded-lg border border-gold/30 bg-white px-2 py-2 text-sm outline-none"
            />
            <input
              value={form.marketPrice}
              onChange={(e) => setForm({ ...form, marketPrice: e.target.value })}
              type="number" placeholder="市值NT$"
              className="w-20 rounded-lg border border-gold/30 bg-white px-2 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              className="pressable rounded-lg bg-plum px-3 py-2 text-xs font-bold text-cream"
              disabled={busy || !form.name.trim() || !form.cost}
            >
              新增
            </button>
          </form>
          {rewards.filter((r) => r.active).map((rw) => (
            <div key={rw.id} className="card flex items-center gap-2 p-3">
              <span className="text-lg">{rw.icon ?? "🎁"}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{rw.name}</span>
              <span className="text-sm font-black text-gold">{Number(rw.cost).toFixed(1)}</span>
              <button className="pressable text-xs text-gold" onClick={() => update(rw)}>編輯</button>
              <button className="pressable text-xs text-coral" onClick={() => remove(rw)}>下架</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- 重置（雙重確認） ---------- */
function ResetButton({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [step, setStep] = useState<0 | 1>(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function doReset() {
    if (busy) return;
    setBusy(true);
    const r = await postJSON("/api/reset", { confirm: text });
    setBusy(false);
    setStep(0);
    setText("");
    toast(r.ok ? "帳本已重置" : r.error!);
    onDone();
  }

  return (
    <>
      <button
        className="pressable w-full rounded-xl border border-coral/40 py-2.5 text-sm font-medium text-coral"
        onClick={() => setStep(1)}
      >
        🗑️ 重置帳本資料
      </button>
      {step === 1 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum/60 p-6"
          onClick={() => { if (!busy) { setStep(0); setText(""); } }}
        >
          <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-bold text-coral">確定要清空所有帳本紀錄？</div>
            <p className="mt-2 text-sm text-plum/70">
              此動作無法復原。預設項目與獎品會保留。請輸入「確認重置」四個字。
            </p>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="確認重置"
              className="mt-3 w-full rounded-xl border border-coral/50 bg-white px-3 py-2.5 text-center text-sm outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                className="pressable flex-1 rounded-xl border border-plum/20 py-2.5 text-sm"
                onClick={() => { setStep(0); setText(""); }}
                disabled={busy}
              >
                取消
              </button>
              <button
                className="pressable flex-1 rounded-xl bg-coral py-2.5 text-sm font-bold text-white"
                onClick={doReset}
                disabled={busy || text !== "確認重置"}
              >
                {busy ? "刪除中…" : "永久刪除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
