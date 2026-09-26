import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.productFavorite.findUnique({ where: { userId_productId: { userId: user.id, productId: id } } });

    if (existing) {
      await db.productFavorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await db.productFavorite.create({ data: { userId: user.id, productId: id } });
    return NextResponse.json({ favorited: true });
  } catch {
    return NextResponse.json({ error: "Could not update favorite" }, { status: 400 });
  }
}
