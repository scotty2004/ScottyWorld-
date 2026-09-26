import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { ECONOMY } from "@/lib/economy";

/**
 * Pay for a Pro plan with Scotty Coins (30 days). Charged atomically; the plan is only
 * activated if the coins were actually deducted. Real-money checkout goes through the
 * payment-provider webhook instead (subscription stays TRIALING until confirmed).
 */
export async function POST(request: Request) {
  const user = await me();
  if (!user) return unauth();

  const body = await request.json().catch(() => ({}));
  const plan = await db.proPlan.findFirst({ where: { id: String(body.planId || ""), active: true } });
  if (!plan) return bad("Plan not found.", 404);
  const price = Math.round((plan.priceCents / 100) * ECONOMY.COINS_PER_USD);

  try {
    const sub = await db.$transaction(
      async (tx) => {
        const sum = await tx.coinTransaction.aggregate({ where: { userId: user.id }, _sum: { amount: true } });
        const balance = sum._sum.amount ?? 0;
        if (balance < price) throw new Error(`INSUFFICIENT:${balance}`);
        const current = await tx.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" } });
        // same plan → extend; different plan → switch (old one is cancelled)
        const base = current && current.planId === plan.id && current.currentPeriodEnd && current.currentPeriodEnd > new Date() ? current.currentPeriodEnd : new Date();
        const end = new Date(base.getTime() + 30 * 86_400_000);
        if (current) await tx.subscription.update({ where: { id: current.id }, data: { status: "CANCELLED" } });
        await tx.coinTransaction.create({ data: { userId: user.id, amount: -price, type: "SPEND", reason: `Pro ${plan.name} (30 days)`, reference: `plan:${plan.slug}` } });
        return tx.subscription.create({ data: { userId: user.id, planId: plan.id, status: "ACTIVE", provider: "coins", currentPeriodEnd: end } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await db.notification.create({ data: { userId: user.id, type: "PRO", title: `Welcome to ${plan.name}`, body: "Your Pro benefits are active for 30 days." } }).catch(() => null);
    return NextResponse.json({ subscription: sub, message: `${plan.name} activated for 30 days.` }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.startsWith("INSUFFICIENT")) return NextResponse.json({ error: `You need ${price} SC for ${plan.name}. Earn coins from tasks or deposit.`, balance: Number(msg.split(":")[1]), required: price }, { status: 402 });
    return bad("Could not activate the plan.", 500);
  }
}
