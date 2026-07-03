"use client";

import { useRef, useState } from "react";

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("壓縮失敗"))), "image/jpeg", quality);
  });
}

/** client 端壓縮到 ≤1MB */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法建立 canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > 1024 * 1024 && quality > 0.3) {
    quality -= 0.15;
    blob = await canvasToBlob(canvas, quality);
  }
  return blob;
}

export default function PhotoInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const blob = await compressImage(file);
      const form = new FormData();
      form.append("file", blob, "photo.jpg");
      const r = await fetch("/api/photos", { method: "POST", body: form });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "上傳失敗");
      onChange(json.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/${value}`}
            alt="已上傳照片"
            className="h-16 w-16 rounded-lg border border-gold/30 object-cover"
          />
          <button
            type="button"
            className="pressable rounded-lg border border-coral/40 px-3 py-1.5 text-xs text-coral-ink"
            onClick={() => onChange(null)}
          >
            移除
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="pressable rounded-lg border border-dashed border-gold/50 px-3 py-2 text-xs text-plum/60"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "壓縮上傳中…" : "📷 附上照片（選填）"}
        </button>
      )}
      {error && <div className="mt-1 text-xs text-coral-ink">{error}</div>}
    </div>
  );
}
