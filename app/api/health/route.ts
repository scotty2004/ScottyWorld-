import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "scottyworld", database: "ok", time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, service: "scottyworld", database: "unavailable" }, { status: 503 });
  }
}
