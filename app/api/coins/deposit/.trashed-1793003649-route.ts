import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { ECONOMY, usdToCoins, SUPPORT } from "@/lib/economy";

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const deposits = await db.coinDeposit.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ deposits, packages: [1, 2, 5, 10, 25].map((usd) => ({ usd, coins: usdToCoins(usd) })), coinsPerUsd: ECONOMY.COINS_PER_USD });
}

/**
 * Creates a deposit request. It is credited only when a payment provider webhook
 * (deposit.completed) or an admin confirms payment — never on the client's word.
 */
export async function POST(req: Request) {
  const user = await me();
  if (!user) return unauth();
  const parsed = z.object({ usd: z.number().min(ECONOMY.MIN_DEPOSIT_USD).max(ECONOMY.MAX_DEPOSIT_USD), method: z.string().max(30).optional() }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad(`Deposit between $${ECONOMY.MIN_DEPOSIT_USD} and $${ECONOMY.MAX_DEPOSIT_USD}.`);
  const pending = await db.coinDeposit.count({ where: { userId: user.id, status: "PENDING" } });
  if (pending >= 3) return bad("You already have 3 pending deposits. Wait for confirmation or contact support.");
  const usdCents = Math.round(parsed.data.usd * 100);
  const deposit = await db.coinDeposit.create({ data: { userId: user.id, usdCents, coins: usdToCoins(parsed.data.usd), method: parsed.data.method || "manual" } });
  return NextResponse.json({
    deposit,
    instructions: process.env.PAYMENT_PROVIDER
      ? "Complete the payment in the provider window. Coins are added automatically after confirmation."
      : `Send payment as instructed by support on WhatsApp ${SUPPORT.whatsapp} and quote reference ${deposit.id.slice(-8).toUpperCase()}. Coins are added once payment is confirmed.`,
  }, { status: 201 });
}
