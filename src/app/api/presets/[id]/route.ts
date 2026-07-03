import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.label != null) patch.label = String(body.label).trim();
  if (body.points != null) patch.points = Math.round(Number(body.points) * 10) / 10;
  if (body.requiresReview != null) patch.requires_review = Boolean(body.requiresReview);
  if ("dailyLimit" in body) patch.daily_limit = body.dailyLimit === null || body.dailyLimit === "" ? null : Number(body.dailyLimit);
  if (body.active != null) patch.active = Boolean(body.active);
  if (body.type != null && ["bonus", "deduct"].includes(body.type)) patch.type = body.type;
  const { error } = await admin().from("presets").update(patch).eq("id", params.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  // 軟刪除：停用
  const { error } = await admin().from("presets").update({ active: false }).eq("id", params.id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
