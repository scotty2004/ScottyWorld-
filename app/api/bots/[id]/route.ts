import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getOwnedBot } from "@/lib/bots/authorization";
import { botUpdateSchema } from "@/lib/bots/validation";
import { recordBotEvent } from "@/lib/bots/events";
import { runtimeStatus, runtimeUnpair } from "@/lib/integrations/bot-runtime";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const bot = await db.bot.findFirst({
    where: { id, ownerId: user.id },
    include: {
      commands: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!bot) return NextResponse.json({ error: "Bot not found." }, { status: 404 });

  // Live status straight from the panel running the WhatsApp session —
  // best-effort: if the panel is unreachable we still return the bot.
  let device = null;
  if (bot.phone) {
    try { device = await runtimeStatus(bot.phone); } catch { /* panel offline or not configured */ }
  }

  return NextResponse.json({ bot: { ...bot, device } });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const existing = await getOwnedBot(user.id, id);
  if (!existing) return NextResponse.json({ error: "Bot not found." }, { status: 404 });

  const parsed = botUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid bot configuration." }, { status: 400 });

  const bot = await db.bot.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      provider: parsed.data.provider,
      commandPrefix: parsed.data.commandPrefix,
      version: parsed.data.version,
    },
  });

  await recordBotEvent(id, "UPDATED", "Bot configuration updated.");
  return NextResponse.json({ bot });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const bot = await getOwnedBot(user.id, id);
  if (!bot) return NextResponse.json({ error: "Bot not found." }, { status: 404 });

  // Free the device slot on the panel too, not just our own record.
  if (bot.phone) { try { await runtimeUnpair(bot.phone, user.id); } catch (e) { console.error("BOT_RUNTIME_UNPAIR_FAILED", (e as Error).message); } }

  await db.bot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
