import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const cost = Number(body.cost);
  if (!name || !Number.isFinite(cost) || cost <= 0) return jsonError("請填名稱與正確點數");
  const { error } = await admin().from("rewards").insert({
    icon: body.icon ? String(body.icon) : null,
    name,
    cost: Math.round(cost * 10) / 10,
    market_price: body.marketPrice != null && body.marketPrice !== "" ? Number(body.marketPrice) : null,
  });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
