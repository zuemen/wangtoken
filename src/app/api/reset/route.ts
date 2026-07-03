import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 清空帳本（entries）＋願望清單；presets / rewards 保留
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "確認重置") return jsonError("確認文字不正確");

  const sb = admin();
  const { error: e1 } = await sb.from("entries").delete().gte("created_at", "1970-01-01");
  if (e1) return jsonError(e1.message, 500);
  const { error: e2 } = await sb.from("wishes").delete().gte("created_at", "1970-01-01");
  if (e2) return jsonError(e2.message, 500);
  return NextResponse.json({ ok: true });
}
