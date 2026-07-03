import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { isAdminReq } from "@/lib/auth";
import { taipeiStartOfTodayISO } from "@/lib/taipei";
import type { Entry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sb = admin();
  const [entriesQ, presetsQ, rewardsQ, wishesQ, balanceQ, adminFlag] = await Promise.all([
    sb.from("entries").select("*").order("created_at", { ascending: false }).limit(500),
    sb.from("presets").select("*").order("created_at", { ascending: true }),
    sb.from("rewards").select("*").order("created_at", { ascending: true }),
    sb.from("wishes").select("*").order("created_at", { ascending: false }),
    sb.rpc("ledger_balance"),
    isAdminReq(req),
  ]);

  const err = entriesQ.error || presetsQ.error || rewardsQ.error || wishesQ.error || balanceQ.error;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  const entries = (entriesQ.data ?? []) as Entry[];
  const todayStart = taipeiStartOfTodayISO();
  const todayCounts: Record<string, number> = {};
  for (const e of entries) {
    if (e.actor !== "gf" || e.status === "rejected") continue;
    if (e.created_at < todayStart) continue;
    todayCounts[e.label] = (todayCounts[e.label] ?? 0) + 1;
  }

  return NextResponse.json({
    balance: Number(balanceQ.data ?? 0),
    entries,
    presets: presetsQ.data ?? [],
    rewards: rewardsQ.data ?? [],
    wishes: wishesQ.data ?? [],
    todayCounts,
    isAdmin: adminFlag,
  });
}
