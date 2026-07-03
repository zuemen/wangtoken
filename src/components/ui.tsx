"use client";

import { useEffect, useState } from "react";
import type { Entry } from "@/lib/types";
import { fmtPoints, fmtTime } from "@/lib/format";

export function StatusBadge({ status }: { status: Entry["status"] }) {
  if (status === "pending")
    return <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-medium text-gold-ink">待審核</span>;
  if (status === "rejected")
    return <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[11px] font-medium text-coral-ink">已拒絕</span>;
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="pressable shrink-0"
        onClick={() => setOpen(true)}
        aria-label="查看照片大圖"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="照片"
          className="h-12 w-12 rounded-lg border border-gold/30 object-cover"
        />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="照片大圖（點擊或按 Esc 關閉）"
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
                entry.fulfilled ? "bg-mint/15 text-mint-ink" : "bg-gold/20 text-gold-ink"
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
          positive ? "text-mint-ink" : Number(entry.points) < 0 ? "text-coral-ink" : "text-plum/40"
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

/** 底部彈出表單容器（手機 bottom sheet / 桌面置中），Esc 可關閉 */
export function SheetModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-plum/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="card max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-b-none p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-base font-bold">{title}</div>
          <button
            type="button"
            className="pressable -mr-2 rounded-lg px-2 py-1 text-lg text-plum/50"
            onClick={onClose}
            aria-label="關閉"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/** 表單欄位標籤（正式表單一律有可見 label） */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-plum/70">{label}</span>
      {children}
    </label>
  );
}

/** 骨架屏 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-plum/10 ${className}`} aria-hidden="true" />;
}
