import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { isAdminReq, jsonError } from "@/lib/auth";
import { taipeiStartOfTodayISO } from "@/lib/taipei";

export const dynamic = "force-dynamic";

// 建立紀錄：
// 1) { presetId, note?, photoPath? } 女友快速記錄 / 管理者快速記帳
// 2) { kind:'bonus'|'deduct', label, points } 管理者自訂記帳
export async function POST(req: NextRequest) {
  const sb = admin();
  const body = await req.json().catch(() => ({}));
  const asAdmin = await isAdminReq(req);
  const actor: "gf" | "admin" = asAdmin && body.actor === "admin" ? "admin" : "gf";

  // ---- 預設項目記錄 ----
  if (body.presetId) {
    const { data: preset, error: pErr } = await sb
      .from("presets")
      .select("*")
      .eq("id", body.presetId)
      .eq("active", true)
      .single();
    if (pErr || !preset) return jsonError("找不到這個項目");

    // 每日上限（只對女友端計）
    if (actor === "gf" && preset.daily_limit != null) {
      const { count } = await sb
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("actor", "gf")
        .eq("label", preset.label)
        .neq("status", "rejected")
        .gte("created_at", taipeiStartOfTodayISO());
      if ((count ?? 0) >= preset.daily_limit) {
        return jsonError(`「${preset.label}」今天已達上限（${preset.daily_limit} 次）`, 429);
      }
    }

    const status = actor === "gf" && preset.requires_review ? "pending" : "approved";
    const { error } = await sb.from("entries").insert({
      actor,
      kind: preset.type,
      label: preset.label,
      points: preset.points,
      status,
      note: body.note ? String(body.note) : null,
      photo_path: body.photoPath ? String(body.photoPath) : null,
    });
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true, status });
  }

  // ---- 管理者自訂記帳 ----
  if (!asAdmin) return jsonError("需要管理者權限", 403);
  const kind = String(body.kind ?? "");
  if (!["bonus", "deduct"].includes(kind)) return jsonError("kind 不正確");
  const label = String(body.label ?? "").trim();
  const points = Number(body.points);
  if (!label || !Number.isFinite(points)) return jsonError("請填項目名稱與分數");
  const { error } = await sb.from("entries").insert({
    actor: "admin",
    kind,
    label,
    points: Math.round(points * 10) / 10,
    status: "approved",
    note: body.note ? String(body.note) : null,
  });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
