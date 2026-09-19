import { db } from "../db";

export async function getCoinBalance(userId: string) {
  const result = await db.coinTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function addCoinTransaction(
  userId: string,
  amount: number,
  type: "EARN" | "SPEND" | "BONUS" | "REFUND" | "ADJUSTMENT",
  reason: string,
  reference?: string,
) {
  if (!Number.isInteger(amount) || amount === 0) throw new Error("Invalid coin amount.");

  if (amount < 0) {
    const balance = await getCoinBalance(userId);
    if (balance + amount < 0) throw new Error("Insufficient Scotty Coins.");
  }

  return db.coinTransaction.create({
    data: { userId, amount, type, reason, reference },
  });
}
