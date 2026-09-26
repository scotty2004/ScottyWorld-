import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  // types the user switched off in Settings → Notifications are hidden
  const off = (await db.notificationPreference.findMany({ where: { userId: user.id, channel: "IN_APP", enabled: false }, select: { type: true } })).map((p) => p.type);
  const [notifications, unread] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id, type: { notIn: off } }, orderBy: { createdAt: "desc" }, take: 60 }),
    db.notification.count({ where: { userId: user.id, readAt: null, type: { notIn: off } } }),
  ]);
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(request: Request) {
  const user = await me();
  if (!user) return unauth();
  const { id, all } = await request.json().catch(() => ({}));
  if (all === true) {
    await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  if (typeof id !== "string") return bad("Invalid notification.");
  await db.notification.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}
