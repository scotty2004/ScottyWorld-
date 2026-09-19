import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth/session";
import { db } from "../../../lib/db";
import { botCreateSchema } from "../../../lib/bots/validation";
import { recordBotEvent } from "../../../lib/bots/events";
import { rateLimit } from "../../../lib/security/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const bots = await db.bot.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { commands: true, events: true } } },
  });

  return NextResponse.json({ bots });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const limit = rateLimit(`bot-create:${user.id}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many bot creation requests." }, { status: 429 });

  try {
    const parsed = botCreateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid bot configuration.", issues: parsed.error.flatten() }, { status: 400 });

    const slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || `bot-${Date.now()}`;

    const bot = await db.bot.create({
      data: {
        ownerId: user.id,
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        provider: parsed.data.provider,
        commandPrefix: parsed.data.commandPrefix,
        status: "DRAFT",
      },
    });

    await recordBotEvent(bot.id, "CREATED", "Bot created.");
    return NextResponse.json({ bot }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "A bot with that name already exists." }, { status: 409 });
    console.error("BOT_CREATE_ERROR", error);
    return NextResponse.json({ error: "Could not create bot." }, { status: 500 });
  }
}
