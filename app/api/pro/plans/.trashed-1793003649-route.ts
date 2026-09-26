import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { PLAN_CATALOG } from "@/lib/pro/plans";
import { ECONOMY } from "@/lib/economy";

/** Self-seeds the four tiers the first time it is called, so the page is never empty. */
export async function GET() {
  const user = await me();
  if (!user) return unauth();

  const count = await db.proPlan.count({ where: { active: true } });
  if (count === 0) {
    for (const p of PLAN_CATALOG) {
      await db.proPlan.upsert({
        where: { slug: p.slug }, update: {},
        create: { slug: p.slug, name: p.name, description: p.description, interval: "MONTHLY", priceCents: p.priceCents, features: p.features, limits: p.limits },
      });
    }
  }
  const plans = await db.proPlan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } });
  return NextResponse.json({ plans: plans.map((p) => ({ ...p, priceCoins: Math.round((p.priceCents / 100) * ECONOMY.COINS_PER_USD) })) });
}
