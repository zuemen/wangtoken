import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 女友提案：名稱 + 建議分數 + 照片，狀態 pending
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const points = Number(body.points);
  if (!name) return jsonError("請填提案名稱");
  if (!Number.isFinite(points) || points <= 0) return jsonError("建議分數要是正數");
  const { error } = await admin().from("entries").insert({
    actor: "gf",
    kind: "proposal",
    label: name,
    points: Math.round(points * 10) / 10,
    status: "pending",
    note: body.note ? String(body.note) : null,
    photo_path: body.photoPath ? String(body.photoPath) : null,
  });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
