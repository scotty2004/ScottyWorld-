import { NextResponse } from "next/server";
import { me, unauth, bad } from "@/lib/api";
import { db } from "@/lib/db";
import { runtimePair } from "@/lib/integrations/bot-runtime";
import { freeTrialEnd } from "@/lib/bots/hosting";
import { recordBotEvent } from "@/lib/bots/events";
import { enforceRateLimit } from "@/lib/security/request";
import { getEntitlements } from "@/lib/pro/plans";

/**
 * One-tap "Connect Scotty_C": enter a number, get a pairing code — no bot-creation form.
 * Reuses an existing bot row for this exact number if the user already has one, otherwise
 * creates one automatically so hosting/renewal (already built) applies to it as normal.
 */
export async function POST(req: Request) {
  const user = await me();
  if (!user) return unauth();
  try { await enforceRateLimit(`bot-pair:${user.id}`, 10, 60_000); } catch (e) { if ((e as Error).message === "RATE_LIMITED") return bad("Too many attempts. Wait a moment and try again.", 429); throw e; }

  const { phone } = await req.json().catch(() => ({}) as any);
  const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  if (digits.length < 7 || digits.length > 15) return bad("Enter a valid WhatsApp number in international format, e.g. 263771234567.");

  try {
    let bot = await db.bot.findFirst({ where: { ownerId: user.id, phone: digits } });
    if (!bot) {
      const ent = await getEntitlements(user.id);
      const owned = await db.bot.count({ where: { ownerId: user.id } });
      if (ent.bots !== -1 && owned >= ent.bots) return bad(`Your ${ent.tier.toLowerCase()} plan allows ${ent.bots} bot${ent.bots === 1 ? "" : "s"}. Upgrade to Pro for more.`, 403);

      const slug = `scotty-c-${digits}`.slice(0, 50);
      bot = await db.bot.create({ data: { ownerId: user.id, name: `Scotty_C (${digits})`, slug, provider: "whatsapp", source: "scotty_c", phone: digits, status: "DRAFT" } });
      await recordBotEvent(bot.id, "CREATED", "Connected via Scotty_C panel.");
    }

    const result = await runtimePair(digits);
    if ("alreadyConnected" in result) {
      await db.bot.update({ where: { id: bot.id }, data: { status: "RUNNING" } });
      return NextResponse.json({ alreadyConnected: true, botId: bot.id });
    }

    const updates: Record<string, unknown> = { status: "DEPLOYING" };
    if (!bot.hostedUntil) updates.hostedUntil = freeTrialEnd();
    await db.bot.update({ where: { id: bot.id }, data: updates });
    await recordBotEvent(bot.id, "DEPLOYED", `Pairing started for ${digits}`);

    return NextResponse.json({ pairingCode: result.code, expiresIn: 300, botId: bot.id });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "BOT_RUNTIME_NOT_CONFIGURED") return bad("Bot hosting isn't connected yet — set BOT_RUNTIME_ENDPOINT to your panel's URL (e.g. https://world.scottyhub.co.zw).", 503);
    return bad(msg || "Couldn't reach the hosting panel. Try again in a moment.", 502);
  }
}
