import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 審核待審項目（提案或需審核的預設項目）：可修改分數後核准，或拒絕
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  if (!["approve", "reject"].includes(action)) return jsonError("action 不正確");

  const patch: Record<string, unknown> = {
    status: action === "approve" ? "approved" : "rejected",
    reviewed_at: new Date().toISOString(),
  };
  if (action === "approve" && body.points != null) {
    const p = Number(body.points);
    if (!Number.isFinite(p)) return jsonError("分數不正確");
    patch.points = Math.round(p * 10) / 10;
  }

  const { error } = await admin()
    .from("entries")
    .update(patch)
    .eq("id", params.id)
    .eq("status", "pending");
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
