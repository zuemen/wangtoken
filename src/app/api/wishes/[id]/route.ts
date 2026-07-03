import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 管理者處理願望：accept（轉成獎品）/ reject（婉拒）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const sb = admin();
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  const { data: wish, error: wErr } = await sb.from("wishes").select("*").eq("id", params.id).single();
  if (wErr || !wish) return jsonError("找不到願望", 404);

  if (action === "accept") {
    const cost = Number(body.cost);
    if (!Number.isFinite(cost) || cost <= 0) return jsonError("請填兌換點數");
    const { error: rErr } = await sb.from("rewards").insert({
      icon: body.icon ? String(body.icon) : "🎁",
      name: wish.name,
      cost: Math.round(cost * 10) / 10,
      market_price: body.marketPrice != null && body.marketPrice !== "" ? Number(body.marketPrice) : null,
    });
    if (rErr) return jsonError(rErr.message, 500);
    const { error } = await sb.from("wishes").update({ status: "added" }).eq("id", params.id);
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    const { error } = await sb.from("wishes").update({ status: "rejected" }).eq("id", params.id);
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  return jsonError("action 不正確");
}
