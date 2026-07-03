import { NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { taipeiDateStr, taipeiLastNDates, taipeiStartOfDaysAgoISO } from "@/lib/taipei";

export const dynamic = "force-dynamic";

const STREAK_LABEL = "連續7天乖乖聽話🔥";
const TARGET_LABEL = "乖乖聽話一天";

// 近 7 天每天都有「乖乖聽話一天」approved 紀錄且本週尚未領過 → 自動 +1.0
export async function POST() {
  const sb = admin();
  const windowStart = taipeiStartOfDaysAgoISO(6); // 今天往前推 6 天的 00:00（含今天共 7 天）

  const [targetQ, awardQ] = await Promise.all([
    sb.from("entries").select("created_at")
      .eq("label", TARGET_LABEL).eq("status", "approved")
      .gte("created_at", windowStart),
    sb.from("entries").select("id", { count: "exact", head: true })
      .eq("label", STREAK_LABEL)
      .gte("created_at", windowStart),
  ]);
  if (targetQ.error || awardQ.error) {
    return NextResponse.json({ awarded: false });
  }

  const have = new Set((targetQ.data ?? []).map((e) => taipeiDateStr(new Date(e.created_at))));
  const allSeven = taipeiLastNDates(7).every((d) => have.has(d));
  const alreadyAwarded = (awardQ.count ?? 0) > 0;

  if (!allSeven || alreadyAwarded) return NextResponse.json({ awarded: false });

  const { error } = await sb.from("entries").insert({
    actor: "admin",
    kind: "bonus",
    label: STREAK_LABEL,
    points: 1.0,
    status: "approved",
    note: "系統自動發放",
  });
  if (error) return NextResponse.json({ awarded: false });
  return NextResponse.json({ awarded: true });
}
