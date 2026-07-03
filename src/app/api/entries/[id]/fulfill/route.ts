import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 兌換出貨狀態切換
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  const { error } = await admin()
    .from("entries")
    .update({ fulfilled: Boolean(body.fulfilled) })
    .eq("id", params.id)
    .eq("kind", "redeem");
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
