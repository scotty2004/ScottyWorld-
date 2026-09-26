import { Prisma } from "@prisma/client";
import { randomInt } from "crypto";
import { db } from "../db";
import { ECONOMY } from "../economy";

export async function getCoinBalance(userId: string) {
  const result = await db.coinTransaction.aggregate({ where: { userId }, _sum: { amount: true } });
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
  return db.coinTransaction.create({ data: { userId, amount, type, reason, reference } });
}

/** 6-digit wallet number used for transfers. Created lazily for old accounts. */
export async function ensureAccountNumber(userId: string): Promise<string> {
  const existing = await db.user.findUnique({ where: { id: userId }, select: { accountNumber: true } });
  if (existing?.accountNumber) return existing.accountNumber;
  for (let i = 0; i < 25; i++) {
    const candidate = String(randomInt(100000, 1000000));
    try {
      const u = await db.user.update({ where: { id: userId }, data: { accountNumber: candidate }, select: { accountNumber: true } });
      return u.accountNumber!;
    } catch (e: any) {
      if (e?.code !== "P2002") throw e; // collision → try again
    }
  }
  throw new Error("Could not allocate an account number.");
}

export async function ensureReferralCode(userId: string, username: string): Promise<string> {
  const existing = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (existing?.referralCode) return existing.referralCode;
  const base = username.replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase() || "scotty";
  for (let i = 0; i < 20; i++) {
    const code = i === 0 ? base : `${base}${randomInt(10, 9999)}`;
    try {
      const u = await db.user.update({ where: { id: userId }, data: { referralCode: code }, select: { referralCode: true } });
      return u.referralCode!;
    } catch (e: any) {
      if (e?.code !== "P2002") throw e;
    }
  }
  throw new Error("Could not allocate a referral code.");
}

export type TransferResult =
  | { ok: true; toName: string; toUsername: string; amount: number }
  | { ok: false; error: string };

export async function transferCoins(fromId: string, toAccountNumber: string, amount: number, note?: string): Promise<TransferResult> {
  if (!/^\d{6}$/.test(toAccountNumber)) return { ok: false, error: "Account numbers have 6 digits." };
  if (!Number.isInteger(amount) || amount < ECONOMY.MIN_TRANSFER || amount > ECONOMY.MAX_TRANSFER)
    return { ok: false, error: `Amount must be between ${ECONOMY.MIN_TRANSFER} and ${ECONOMY.MAX_TRANSFER} coins.` };

  try {
    return await db.$transaction(
      async (tx) => {
        const to = await tx.user.findUnique({ where: { accountNumber: toAccountNumber }, select: { id: true, displayName: true, username: true } });
        if (!to) return { ok: false as const, error: "No wallet found with that account number." };
        if (to.id === fromId) return { ok: false as const, error: "You can't send coins to yourself." };

        const sum = await tx.coinTransaction.aggregate({ where: { userId: fromId }, _sum: { amount: true } });
        if ((sum._sum.amount ?? 0) < amount) return { ok: false as const, error: "Insufficient Scotty Coins." };

        const transfer = await tx.coinTransfer.create({ data: { fromUserId: fromId, toUserId: to.id, amount, note: note?.slice(0, 140) || null } });
        const sender = await tx.user.findUnique({ where: { id: fromId }, select: { displayName: true } });
        await tx.coinTransaction.create({ data: { userId: fromId, amount: -amount, type: "SPEND", reason: `Sent to ${to.displayName}`, reference: `transfer:${transfer.id}` } });
        await tx.coinTransaction.create({ data: { userId: to.id, amount, type: "EARN", reason: `Received from ${sender?.displayName ?? "a user"}`, reference: `transfer:${transfer.id}` } });
        await tx.notification.create({ data: { userId: to.id, type: "SYSTEM", title: "You received Scotty Coins", body: `${sender?.displayName ?? "Someone"} sent you ${amount} SC.` } }).catch(() => null);
        return { ok: true as const, toName: to.displayName, toUsername: to.username, amount };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch {
    return { ok: false, error: "Transfer could not be completed. Please try again." };
  }
}

/** Pays the referrer once (idempotent). Called when the referred user verifies email or gets a first task approved. */
export async function rewardReferralIfDue(referredUserId: string) {
  const ref = await db.referral.findUnique({ where: { referredId: referredUserId } });
  if (!ref || ref.status === "REWARDED" || ref.status === "REJECTED") return null;
  return db.$transaction(async (tx) => {
    const claimed = await tx.referral.updateMany({
      where: { id: ref.id, status: { in: ["PENDING", "QUALIFIED"] } },
      data: { status: "REWARDED", rewardCoins: ECONOMY.REFERRAL_REWARD, qualifiedAt: new Date(), rewardedAt: new Date() },
    });
    if (claimed.count === 0) return null;
    await tx.coinTransaction.create({
      data: { userId: ref.referrerId, amount: ECONOMY.REFERRAL_REWARD, type: "BONUS", reason: "Successful referral", reference: `referral:${ref.id}` },
    });
    await tx.notification.create({
      data: { userId: ref.referrerId, type: "REFERRAL", title: "Referral reward", body: `+${ECONOMY.REFERRAL_REWARD} SC — someone you invited joined ScottyWorld.` },
    }).catch(() => null);
    return ECONOMY.REFERRAL_REWARD;
  });
}
