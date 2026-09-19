import { db } from "../db";

export async function getOwnedBot(userId: string, botId: string) {
  return db.bot.findFirst({
    where: { id: botId, ownerId: userId },
  });
}
