import { NextResponse } from "next/server";
import { me, unauth, bad } from "@/lib/api";
import { getOwnedBot } from "@/lib/bots/authorization";
import { freeTrialEnd } from "@/lib/bots/hosting";
import { runtimePair } from "@/lib/integrations/bot-runtime";
import { db } from "@/lib/db";
import { recordBotEvent } from "@/lib/bots/events";
import { enforceRateLimit } from "@/lib/security/request";

/**
 * Pairs this bot's WhatsApp number straight onto the Scotty_C panel — no generated file
 * needed, matching how world.scottyhub.co.zw actually works (one shared bot codebase,
 * pairing is per phone number). Requires BOT_RUNTIME_ENDPOINT (e.g. https://world.scottyhub.co.zw).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  try { await enforceRateLimit(`bot-pair:${user.id}`, 10, 60_000); } catch (e) { if ((e as Error).message === "RATE_LIMITED") return bad("Too many attempts. Wait a moment and try again.", 429); throw e; }

  const { id } = await ctx.params;
  const bot = await getOwnedBot(user.id, id);
  if (!bot) return bad("Bot not found.", 404);

  const { phone } = await req.json().catch(() => ({}) as any);
  const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  if (digits.length < 7 || digits.length > 15) return bad("Enter a valid WhatsApp number in international format, e.g. 263771234567.");

  try {
    const result = await runtimePair(digits);
    if ("alreadyConnected" in result) {
      await db.bot.update({ where: { id: bot.id }, data: { phone: digits, status: "RUNNING" } });
      return NextResponse.json({ alreadyConnected: true });
    }

    const updates: Record<string, unknown> = { phone: digits, status: "DEPLOYING" };
    if (!bot.hostedUntil) updates.hostedUntil = freeTrialEnd(); // 5-day free clock starts the first time this bot is ever paired
    await db.bot.update({ where: { id: bot.id }, data: updates });
    await recordBotEvent(id, "DEPLOYED", `Pairing started for ${digits}`);

    return NextResponse.json({ pairingCode: result.code, expiresIn: 300 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "BOT_RUNTIME_NOT_CONFIGURED") return bad("Bot hosting isn't connected yet — set BOT_RUNTIME_ENDPOINT to your panel's URL (e.g. https://world.scottyhub.co.zw).", 503);
    return bad(msg || "Couldn't reach the hosting panel. Try again in a moment.", 502);
  }
}
