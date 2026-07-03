"use client";

import { useState } from "react";
import type { Entry } from "@/lib/types";
import { fmtPoints, fmtTime } from "@/lib/format";

export function StatusBadge({ status }: { status: Entry["status"] }) {
  if (status === "pending")
    return <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-medium text-gold">待審核</span>;
  if (status === "rejected")
    return <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[11px] font-medium text-coral">已拒絕</span>;
  return null;
}

export function ActorBadge({ actor }: { actor: Entry["actor"] }) {
  return (
    <span className="rounded-full bg-plum/10 px-2 py-0.5 text-[11px] text-plum/70">
      {actor === "gf" ? "她" : "管理者"}
    </span>
  );
}

/** 照片縮圖 + 點開看大圖（signed URL 由 /api/photos/[path] 轉址） */
export function PhotoThumb({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const src = `/api/photos/${path}`;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="照片"
        className="h-12 w-12 cursor-pointer rounded-lg border border-gold/30 object-cover"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum/80 p-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="照片大圖" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </>
  );
}

/** 單筆帳目列 */
export function EntryRow({ entry }: { entry: Entry }) {
  const positive = Number(entry.points) > 0;
  return (
    <div className="passbook-divider flex items-center gap-3 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{entry.label}</span>
          <StatusBadge status={entry.status} />
          {entry.kind === "redeem" && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                entry.fulfilled ? "bg-mint/15 text-mint" : "bg-gold/20 text-gold"
              }`}
            >
              {entry.fulfilled ? "已完成" : "待出貨"}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-plum/50">
          <span>{fmtTime(entry.created_at)}</span>
          <ActorBadge actor={entry.actor} />
          {entry.note && <span className="truncate">「{entry.note}」</span>}
        </div>
      </div>
      {entry.photo_path && <PhotoThumb path={entry.photo_path} />}
      <div
        className={`shrink-0 text-right text-base font-bold ${
          positive ? "text-mint" : Number(entry.points) < 0 ? "text-coral" : "text-plum/40"
        }`}
      >
        {fmtPoints(Number(entry.points))}
      </div>
    </div>
  );
}

/** 二次確認 modal */
export function ConfirmModal({
  title,
  body,
  confirmText = "確認",
  onConfirm,
  onCancel,
  busy,
}: {
  title: string;
  body?: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum/60 p-6" onClick={onCancel}>
      <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-bold">{title}</div>
        {body && <div className="mt-2 text-sm text-plum/70">{body}</div>}
        <div className="mt-4 flex gap-2">
          <button
            className="pressable flex-1 rounded-xl border border-plum/20 py-2.5 text-sm"
            onClick={onCancel}
            disabled={busy}
          >
            再想想
          </button>
          <button
            className="pressable flex-1 rounded-xl bg-plum py-2.5 text-sm font-bold text-cream"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "處理中…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-6 text-sm font-bold tracking-wide text-plum/70">{children}</h2>;
}
