import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 上傳照片到私有 proofs bucket，回傳 storage path
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof Blob)) return jsonError("缺少檔案");
  if (file.size > 2 * 1024 * 1024) return jsonError("檔案太大（上限 2MB）");

  const contentType = file.type || "image/jpeg";
  if (!contentType.startsWith("image/")) return jsonError("只接受圖片");
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await admin().storage.from("proofs").upload(path, buf, { contentType });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ path });
}
