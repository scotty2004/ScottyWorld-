import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me } from "@/lib/api";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await ctx.params;

  const bot = await db.bot.findFirst({ where: { id, ownerId: user.id }, select: { generatedFile: true, generatedFileName: true } });
  if (!bot?.generatedFile) return NextResponse.json({ error: "No generated file for this bot." }, { status: 404 });
  return new NextResponse(bot.generatedFile, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Content-Disposition": `attachment; filename="${(bot.generatedFileName || "bot.js").replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
