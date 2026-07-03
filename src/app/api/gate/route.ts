import { NextRequest, NextResponse } from "next/server";
import { createToken, GATE_COOKIE, GATE_MAX_AGE } from "@/lib/session";

export const dynamic = "force-dynamic";

// 暴力嘗試限流：每 IP 15 分鐘最多 10 次錯誤。
// serverless 每個 instance 各自計數（best-effort），仍能大幅提高暴力破解成本。
const attempts = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.windowStart > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
  } else {
    rec.count += 1;
  }
  // 防止 Map 無限成長
  if (attempts.size > 10000) attempts.clear();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (tooManyAttempts(ip)) {
    return NextResponse.json({ error: "嘗試太多次了，請 15 分鐘後再試" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "");
  if (!process.env.COUPLE_CODE || code !== process.env.COUPLE_CODE) {
    recordFailure(ip);
    return NextResponse.json({ error: "通行碼不對喔" }, { status: 401 });
  }
  attempts.delete(ip);
  const token = await createToken("gate", GATE_MAX_AGE);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GATE_MAX_AGE,
    path: "/",
  });
  return res;
}
