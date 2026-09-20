import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { ensureAccountNumber, getCoinBalance } from "@/lib/coins/service";
import { ECONOMY, coinsToUsd } from "@/lib/economy";

export async function GET() {
  const user = await me();
  if (!user) return unauth();

  const [accountNumber, balance, transactions, earned, spent] = await Promise.all([
    ensureAccountNumber(user.id),
    getCoinBalance(user.id),
    db.coinTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.coinTransaction.aggregate({ where: { userId: user.id, amount: { gt: 0 } }, _sum: { amount: true } }),
    db.coinTransaction.aggregate({ where: { userId: user.id, amount: { lt: 0 } }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    balance,
    usd: Number(coinsToUsd(balance).toFixed(2)),
    accountNumber,
    holder: user.displayName,
    totalEarned: earned._sum.amount ?? 0,
    totalSpent: Math.abs(spent._sum.amount ?? 0),
    rate: { coins: 20, usd: 0.5, coinsPerUsd: ECONOMY.COINS_PER_USD },
    transactions,
  });
}
