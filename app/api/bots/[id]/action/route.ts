import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getOwnedBot } from "@/lib/bots/authorization";
import { recordBotEvent } from "@/lib/bots/events";

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
    message = "Bot start requested.";
  }
  if (action === "stop") {
    status = "STOPPED";
    event = "STOPPED";
    message = "Bot stop requested.";
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
