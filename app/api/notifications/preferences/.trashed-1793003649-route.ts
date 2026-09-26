import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

const NOTIFICATION_TYPES = ["COMMUNITY", "MARKETPLACE", "BOT", "ACADEMY", "REFERRAL", "PRO", "SYSTEM"] as const;

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const rows = await db.notificationPreference.findMany({ where: { userId: user.id, channel: "IN_APP" } });
  const off = new Set(rows.filter((r) => !r.enabled).map((r) => r.type));
  return NextResponse.json({ preferences: NOTIFICATION_TYPES.map((t) => ({ type: t, enabled: !off.has(t) })) });
}

export async function PATCH(req: Request) {
  const user = await me();
  if (!user) return unauth();
  const { type, enabled } = await req.json().catch(() => ({}));
  if (!NOTIFICATION_TYPES.includes(type) || typeof enabled !== "boolean") return bad("Invalid preference.");
  await db.notificationPreference.upsert({
    where: { userId_type_channel: { userId: user.id, type, channel: "IN_APP" } },
    update: { enabled }, create: { userId: user.id, type, channel: "IN_APP", enabled },
  });
  return NextResponse.json({ ok: true });
}
