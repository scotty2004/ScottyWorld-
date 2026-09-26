import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { getEntitlements } from "@/lib/pro/plans";

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const [ent, sub] = await Promise.all([
    getEntitlements(user.id),
    db.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, include: { plan: { select: { slug: true, name: true, priceCents: true } } }, orderBy: { plan: { priceCents: "desc" } } }),
  ]);
  return NextResponse.json({ entitlements: ent, subscription: sub ? { plan: sub.plan, renewsAt: sub.currentPeriodEnd } : null });
}
