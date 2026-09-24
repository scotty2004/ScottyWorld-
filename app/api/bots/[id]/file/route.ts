import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me } from "@/lib/api";
import { verifyBotFileToken } from "@/lib/bots/file-token";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token");

  // Either the owner's own browser session, or a short-lived signed token issued for the
  // bot-hosting panel to fetch the file it needs to actually run (see lib/bots/file-token.ts).
  let ownerId: string | null = null;
  if (token && verifyBotFileToken(id, token)) {
    ownerId = null; // token already proves the request is authorized for this exact bot id
  } else {
    const user = await me();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    ownerId = user.id;
  }

  const bot = await db.bot.findFirst({ where: ownerId ? { id, ownerId } : { id }, select: { generatedFile: true, generatedFileName: true } });
  if (!bot?.generatedFile) return NextResponse.json({ error: "No generated file for this bot." }, { status: 404 });
  return new NextResponse(bot.generatedFile, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Content-Disposition": `attachment; filename="${(bot.generatedFileName || "bot.js").replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
