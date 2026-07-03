"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "📖", label: "總覽" },
  { href: "/rewards", icon: "🎁", label: "兌換所" },
  { href: "/gf", icon: "💕", label: "女友專區" },
  { href: "/admin", icon: "⚙️", label: "管理" },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/gate") return null;
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-gold/30 bg-cream/95 backdrop-blur">
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                active ? "font-bold text-plum" : "text-plum/50"
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span>{t.label}</span>
              <span className={`h-1 w-8 rounded-full ${active ? "bg-gold" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
