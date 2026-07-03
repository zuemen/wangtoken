import Link from "next/link";

export const metadata = { title: "找不到頁面" };

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="text-5xl">🔍</div>
        <h1 className="mt-3 text-lg font-black">找不到這一頁</h1>
        <p className="mt-2 text-sm text-plum/60">這裡沒有存摺的紀錄喔。</p>
        <Link
          href="/"
          className="pressable mt-5 block w-full rounded-xl bg-plum py-3 text-sm font-bold text-cream"
        >
          回到總覽 📖
        </Link>
      </div>
    </div>
  );
}
