import { db } from "../db";
import { BotEventType } from "@prisma/client";

export async function recordBotEvent(
  botId: string,
  type: BotEventType,
  message: string,
  metadata?: Record<string, unknown>,
) {
  return db.botEvent.create({
    data: {
      botId,
      type,
      message,
      metadata: (metadata ?? {}) as any,
    },
  });
}
