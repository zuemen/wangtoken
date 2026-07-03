import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  const type = String(body.type ?? "");
  const label = String(body.label ?? "").trim();
  const points = Number(body.points);
  if (!["bonus", "deduct"].includes(type)) return jsonError("type 不正確");
  if (!label || !Number.isFinite(points)) return jsonError("請填名稱與分數");
  const { error } = await admin().from("presets").insert({
    type,
    label,
    points: Math.round(points * 10) / 10,
    requires_review: Boolean(body.requiresReview),
    daily_limit: body.dailyLimit != null && body.dailyLimit !== "" ? Number(body.dailyLimit) : null,
  });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
