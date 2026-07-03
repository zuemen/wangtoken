import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 簽發 1 小時 signed URL 並轉址
export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const { data, error } = await admin().storage.from("proofs").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return jsonError("找不到照片", 404);
  return NextResponse.redirect(data.signedUrl);
}
