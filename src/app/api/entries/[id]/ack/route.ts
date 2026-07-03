import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 關心事件標記「已關心」
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const { error } = await admin()
    .from("entries")
    .update({ reviewed_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("kind", "care");
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
