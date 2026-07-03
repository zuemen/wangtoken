import type { Metadata, Viewport } from "next";
import "./globals.css";
import RealtimeProvider from "@/components/RealtimeProvider";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: { default: "胖呆積點器", template: "%s｜胖呆積點器" },
  description: "我們兩個人的點數存摺",
  manifest: "/manifest.webmanifest",
  // 私人應用：不讓搜尋引擎索引
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "胖呆積點器", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3E1F3D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RealtimeProvider>
          <main className="mx-auto max-w-md px-4 pt-4 pb-28 min-h-screen">{children}</main>
          <BottomNav />
        </RealtimeProvider>
      </body>
    </html>
  );
}
