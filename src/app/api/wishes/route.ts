import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 女友新增願望
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return jsonError("請填願望名稱");
  const { error } = await admin().from("wishes").insert({
    name,
    url: body.url ? String(body.url) : null,
    note: body.note ? String(body.note) : null,
  });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
