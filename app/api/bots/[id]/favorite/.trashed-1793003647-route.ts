import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.botFavorite.findUnique({ where: { userId_botId: { userId: user.id, botId: id } } });

    if (existing) {
      await db.botFavorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await db.botFavorite.create({ data: { userId: user.id, botId: id } });
    return NextResponse.json({ favorited: true });
  } catch {
    return NextResponse.json({ error: "Could not update favorite" }, { status: 400 });
  }
}
