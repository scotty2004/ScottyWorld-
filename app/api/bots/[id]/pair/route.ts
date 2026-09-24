import { NextResponse } from "next/server";
import { me, unauth, bad } from "@/lib/api";
import { getOwnedBot } from "@/lib/bots/authorization";
import { freeTrialEnd } from "@/lib/bots/hosting";
import { runtimePair } from "@/lib/integrations/bot-runtime";
import { signBotFileToken } from "@/lib/bots/file-token";
import { db } from "@/lib/db";
import { recordBotEvent } from "@/lib/bots/events";
import { enforceRateLimit } from "@/lib/security/request";

/**
 * Starts real WhatsApp pairing for a bot via the runtime panel (BOT_RUNTIME_ENDPOINT — e.g.
 * http://panel.scottyhub.co.zw:3002 — and BOT_RUNTIME_SECRET; see lib/integrations/bot-runtime.ts
 * for the exact contract the panel needs to implement). Until those two env vars are set this
 * returns 503 with a clear message instead of pretending to pair.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  try { await enforceRateLimit(`bot-pair:${user.id}`, 10, 60_000); } catch (e) { if ((e as Error).message === "RATE_LIMITED") return bad("Too many attempts. Wait a moment and try again.", 429); throw e; }

  const { id } = await ctx.params;
  const bot = await getOwnedBot(user.id, id);
  if (!bot) return bad("Bot not found.", 404);
  if (!bot.generatedFile) return bad("Generate this bot's file first.", 400);

  const { phone } = await req.json().catch(() => ({}) as any);
  const digits = typeof phone === "string" ? phone.replace(/[^\d+]/g, "") : "";
  if (!/^\+?\d{9,15}$/.test(digits)) return bad("Enter a valid WhatsApp number with country code, e.g. +263771234567.");

  try {
    const fileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/bots/${bot.id}/file?token=${signBotFileToken(bot.id)}`;
    const result = await runtimePair(bot.id, digits, fileUrl);

    const updates: Record<string, unknown> = { status: "DEPLOYING", panelSessionId: result.sessionId ?? null };
    if (!bot.hostedUntil) updates.hostedUntil = freeTrialEnd(); // starts the 5-day free clock the first time a bot is ever paired
    await db.bot.update({ where: { id: bot.id }, data: updates });
    await recordBotEvent(id, "DEPLOYED", `Pairing started for ${digits}`);

    return NextResponse.json({ pairingCode: result.pairingCode, expiresIn: result.expiresIn ?? 60 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "BOT_RUNTIME_NOT_CONFIGURED") return bad("Bot hosting isn't connected yet — BOT_RUNTIME_ENDPOINT and BOT_RUNTIME_SECRET need to be set to your panel.", 503);
    console.error("BOT_PAIR_FAILED", msg);
    return bad("Couldn't reach the hosting panel. Try again in a moment.", 502);
  }
}
