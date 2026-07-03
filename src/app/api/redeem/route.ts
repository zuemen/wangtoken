import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rewardId = String(body.rewardId ?? "");
  if (!rewardId) return jsonError("缺少 rewardId");

  const { error } = await admin().rpc("redeem_reward", { p_reward_id: rewardId });
  if (error) {
    if (error.message.includes("INSUFFICIENT_BALANCE")) {
      return jsonError("點數不夠喔，再努力一下 💪", 400);
    }
    if (error.message.includes("REWARD_NOT_FOUND")) {
      return jsonError("找不到這個獎品", 404);
    }
    return jsonError(error.message, 500);
  }
  return NextResponse.json({ ok: true });
}
