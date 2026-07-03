import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.icon != null) patch.icon = String(body.icon);
  if (body.name != null) patch.name = String(body.name).trim();
  if (body.cost != null) patch.cost = Math.round(Number(body.cost) * 10) / 10;
  if ("marketPrice" in body) patch.market_price = body.marketPrice === null || body.marketPrice === "" ? null : Number(body.marketPrice);
  if (body.active != null) patch.active = Boolean(body.active);
  const { error } = await admin().from("rewards").update(patch).eq("id", params.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  // 軟刪除：entries 可能引用，停用即可
  const { error } = await admin().from("rewards").update({ active: false }).eq("id", params.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
