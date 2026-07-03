import { NextRequest, NextResponse } from "next/server";
import { createToken, GATE_COOKIE, GATE_MAX_AGE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "");
  if (!process.env.COUPLE_CODE || code !== process.env.COUPLE_CODE) {
    return NextResponse.json({ error: "通行碼不對喔" }, { status: 401 });
  }
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
