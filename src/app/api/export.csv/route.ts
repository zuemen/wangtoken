import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";
import { jsonError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { data, error } = await admin()
    .from("entries")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return jsonError(error.message, 500);

  const header = ["id", "created_at", "actor", "kind", "label", "points", "status", "note", "photo_path", "fulfilled", "reviewed_at"];
  const rows = (data ?? []).map((e) => header.map((h) => csvCell((e as Record<string, unknown>)[h])).join(","));
  const csv = "﻿" + [header.join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="love-passbook-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
