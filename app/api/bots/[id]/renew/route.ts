import { NextResponse } from "next/server";
import { me, unauth, bad } from "@/lib/api";
import { renewBotHosting, hostingState } from "@/lib/bots/hosting";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const r = await renewBotHosting(user.id, id);
  if (!r.ok) return NextResponse.json({ error: r.error, balance: (r as any).balance }, { status: r.status });
  return NextResponse.json({ bot: { id: r.bot.id, hostedUntil: r.bot.hostedUntil, hosting: hostingState(r.bot.hostedUntil) } });
}
