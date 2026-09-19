import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { db } from "../../../../lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await db.session.findMany({
    where: { userId: user.id },
    select: { id: true, createdAt: true, lastSeenAt: true, expiresAt: true, userAgent: true },
    orderBy: { lastSeenAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await request.json();
  if (typeof sessionId !== "string") return NextResponse.json({ error: "Invalid session." }, { status: 400 });

  await db.session.deleteMany({ where: { id: sessionId, userId: user.id } });
  return NextResponse.json({ ok: true });
}