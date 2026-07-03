import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, GATE_COOKIE, verifyToken } from "./session";

export async function isGated(req: NextRequest): Promise<boolean> {
  return verifyToken(req.cookies.get(GATE_COOKIE)?.value, "gate");
}

export async function isAdminReq(req: NextRequest): Promise<boolean> {
  return verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, "admin");
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  if (!(await isAdminReq(req))) return jsonError("需要管理者權限", 403);
  return null;
}
