import { db } from "@/lib/db";
import { ECONOMY } from "@/lib/economy";

export type HostingState = { state: "ACTIVE" | "EXPIRING" | "EXPIRED"; msLeft: number; daysLeft: number };

export function hostingState(hostedUntil: Date | null | undefined): HostingState {
  const msLeft = hostedUntil ? hostedUntil.getTime() - Date.now() : 0;
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));
  if (msLeft <= 0) return { state: "EXPIRED", msLeft: 0, daysLeft: 0 };
  return { state: msLeft < 2 * 86_400_000 ? "EXPIRING" : "ACTIVE", msLeft, daysLeft };
}

export const freeTrialEnd = () => new Date(Date.now() + ECONOMY.BOT_FREE_DAYS * 86_400_000);

/** Pay ECONOMY.BOT_RENEW_COINS to extend hosting by BOT_RENEW_DAYS (stacks on remaining time). */
export async function renewBotHosting(userId: string, botId: string) {
  return db.$transaction(async (tx) => {
    const bot = await tx.bot.findFirst({ where: { id: botId, ownerId: userId } });
    if (!bot) return { ok: false as const, status: 404, error: "Bot not found." };
    const sum = await tx.coinTransaction.aggregate({ where: { userId }, _sum: { amount: true } });
    const balance = sum._sum.amount ?? 0;
    if (balance < ECONOMY.BOT_RENEW_COINS) return { ok: false as const, status: 402, error: `You need ${ECONOMY.BOT_RENEW_COINS} SC to renew. Earn coins from tasks.`, balance };
    const from = bot.hostedUntil && bot.hostedUntil > new Date() ? bot.hostedUntil : new Date();
    const hostedUntil = new Date(from.getTime() + ECONOMY.BOT_RENEW_DAYS * 86_400_000);
    await tx.coinTransaction.create({ data: { userId, amount: -ECONOMY.BOT_RENEW_COINS, type: "SPEND", reason: `Bot hosting renewal: ${bot.name}`, reference: `bot:${bot.id}` } });
    const updated = await tx.bot.update({ where: { id: bot.id }, data: { hostedUntil } });
    return { ok: true as const, bot: updated };
  });
}
