import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { runtimeAction } from "@/lib/integrations/bot-runtime";
import { enforceRateLimit } from "@/lib/security/request";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await enforceRateLimit(`bot-runtime:${user.id}`, 30, 60_000);

    const bot = await prisma.bot.findUnique({ where: { id } });
    if (!bot || bot.ownerId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!bot.phone) return NextResponse.json({ error: "This bot isn't paired to a WhatsApp number yet." }, { status: 400 });

    const { action } = await req.json();
    if (!["start", "stop", "restart", "status"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const result = await runtimeAction(bot.phone, action);
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "RATE_LIMITED") return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    if (msg === "BOT_RUNTIME_NOT_CONFIGURED") return NextResponse.json({ error: "Bot runtime is not configured" }, { status: 503 });
    return NextResponse.json({ error: "Runtime request failed" }, { status: 502 });
  }
}
