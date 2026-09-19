import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (typeof id !== "string") return NextResponse.json({ error: "Invalid notification." }, { status: 400 });

  await db.notification.updateMany({
    where: { id, userId: user.id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}