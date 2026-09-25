import { NextResponse } from "next/server";
import { me, unauth, bad } from "@/lib/api";
import { renewBotHosting, hostingState } from "@/lib/bots/hosting";
import { runtimeRenew } from "@/lib/integrations/bot-runtime";
import { db } from "@/lib/db";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const r = await renewBotHosting(user.id, id);
  if (!r.ok) return NextResponse.json({ error: r.error, balance: (r as any).balance }, { status: r.status });

  // Bring the actual WhatsApp session back to life on the panel too — the
  // coin spend above only extended our own record of the hosting window.
  if (r.bot.phone) {
    try { await runtimeRenew(r.bot.phone, user.id); }
    catch (e) { console.error("BOT_RUNTIME_RENEW_FAILED", (e as Error).message); }
  }

  if (r.bot.status === "PAUSED") await db.bot.update({ where: { id: r.bot.id }, data: { status: "RUNNING" } }).catch(() => null);

  return NextResponse.json({ bot: { id: r.bot.id, hostedUntil: r.bot.hostedUntil, hosting: hostingState(r.bot.hostedUntil) } });
}
