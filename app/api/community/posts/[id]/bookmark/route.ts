import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await context.params;
  const existing = await db.bookmark.findUnique({ where: { userId_postId: { userId: user.id, postId: id } } });
  if (existing) { await db.bookmark.delete({ where: { id: existing.id } }); return NextResponse.json({ saved: false }); }
  await db.bookmark.create({ data: { userId: user.id, postId: id } });
  return NextResponse.json({ saved: true });
}
