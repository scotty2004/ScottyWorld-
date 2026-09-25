import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getOwnedBot } from "@/lib/bots/authorization";
import { recordBotEvent } from "@/lib/bots/events";
import { hostingState } from "@/lib/bots/hosting";
import { runtimeAction } from "@/lib/integrations/bot-runtime";

const allowed = new Set(["test", "start", "stop", "deploy"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const bot = await getOwnedBot(user.id, id);
  if (!bot) return NextResponse.json({ error: "Bot not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";
  if (!allowed.has(action)) return NextResponse.json({ error: "Unsupported bot action." }, { status: 400 });

  if ((action === "start" || action === "deploy") && hostingState(bot.hostedUntil).state === "EXPIRED") {
    await db.bot.update({ where: { id }, data: { status: "PAUSED" } }).catch(() => null);
    return NextResponse.json({ error: "Hosting expired. Renew with Scotty Coins to run this bot." }, { status: 402 });
  }

  // Actually control the live WhatsApp session on the panel for start/stop —
  // this used to only flip our own status flag and never touched the bot.
  if ((action === "start" || action === "stop") && bot.phone) {
    try {
      await runtimeAction(bot.phone, action === "start" ? "start" : "stop");
    } catch (e) {
      return NextResponse.json({ error: `Couldn't reach the bot panel: ${(e as Error).message}` }, { status: 502 });
    }
  }

  let status = bot.status;
  let event: "STARTED" | "STOPPED" | "DEPLOYED" | "UPDATED" = "UPDATED";
  let message = "";

  if (action === "test") {
    status = "TESTING";
    message = "Bot test initiated.";
  }
  if (action === "start") {
    status = "RUNNING";
    event = "STARTED";
    message = "Bot started.";
  }
  if (action === "stop") {
    status = "STOPPED";
    event = "STOPPED";
    message = "Bot stopped.";
  }
  if (action === "deploy") {
    status = "DEPLOYING";
    event = "DEPLOYED";
    message = "Bot deployment requested.";
  }

  const updated = await db.bot.update({
    where: { id },
    data: {
      status,
      deployedAt: action === "deploy" ? new Date() : undefined,
    },
  });

  await recordBotEvent(id, event, message);
  return NextResponse.json({ bot: updated, message });
}
