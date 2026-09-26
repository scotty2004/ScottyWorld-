import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      status: "ready",
      service: "scottyworld",
      database: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      responseMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "not_ready",
        service: "scottyworld",
        database: "unavailable",
        responseMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
