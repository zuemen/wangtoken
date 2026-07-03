"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/useData";

export default function GatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await postJSON("/api/gate", { code });
    if (r.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setError(r.error);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="text-5xl">💞</div>
        <h1 className="mt-3 text-2xl font-black tracking-widest">胖呆積點器</h1>
        <p className="mt-1 text-sm text-plum/60">我們兩個人的小小銀行</p>
        <form onSubmit={submit} className="mt-6">
          <input
            type="password"
            inputMode="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="輸入我們的通行碼"
            className="w-full rounded-xl border border-gold/40 bg-white px-4 py-3 text-center text-base outline-none focus:border-gold"
            autoFocus
          />
          {error && <div className="mt-2 text-sm text-coral-ink">{error}</div>}
          <button
            type="submit"
            className="pressable mt-4 w-full rounded-xl bg-plum py-3 font-bold text-cream"
            disabled={busy || !code}
          >
            {busy ? "確認中…" : "開啟存摺 🔑"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-center text-xs text-plum/40">
        為我們兩個人打造的小小銀行
        <br />
        可加入手機主畫面當 App 使用 📱
      </p>
    </div>
  );
}
