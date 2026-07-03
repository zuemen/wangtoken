import { NextRequest, NextResponse } from "next/server";
import { GATE_COOKIE, verifyToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 閘門本身與其 API 放行
  if (pathname === "/gate" || pathname === "/api/gate") {
    return NextResponse.next();
  }

  const ok = await verifyToken(req.cookies.get(GATE_COOKIE)?.value, "gate");
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "請先輸入通行碼" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // 放行 Next 靜態資源與 PWA 資產（manifest／圖示），其餘一律過閘門
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-touch-icon.png|icons/|.*\\.svg|.*\\.png).*)",
  ],
};
