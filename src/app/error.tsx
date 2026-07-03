"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="text-5xl">🥺</div>
        <h1 className="mt-3 text-lg font-black">哎呀，出了點小狀況</h1>
        <p className="mt-2 text-sm leading-relaxed text-plum/60">
          頁面暫時鬧脾氣了，稍等一下再試試看。
          {error.digest && (
            <span className="mt-1 block text-xs text-plum/40">錯誤代碼：{error.digest}</span>
          )}
        </p>
        <button
          className="pressable mt-5 w-full rounded-xl bg-plum py-3 text-sm font-bold text-cream"
          onClick={reset}
        >
          再試一次
        </button>
      </div>
    </div>
  );
}
