import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getClientIp, hashIdentifier } from "@/lib/security/device";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const [events, sessions] = await Promise.all([
    db.securityEventV2.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.session.findMany({ where: { userId: user.id }, orderBy: { lastSeenAt: "desc" }, select: { id: true, userAgent: true, ipHash: true, createdAt: true, lastSeenAt: true, expiresAt: true } }),
  ]);

  return NextResponse.json({ events, sessions });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const event = typeof body.event === "string" ? body.event.trim().slice(0, 120) : "SECURITY_CHECK";
  const level = body.level === "WARNING" || body.level === "CRITICAL" ? body.level : "INFO";

  const created = await db.securityEventV2.create({
    data: {
      userId: user.id,
      event,
      level,
      ipHash: hashIdentifier(getClientIp(request)),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
    },
  });

  return NextResponse.json({ event: created }, { status: 201 });
}
