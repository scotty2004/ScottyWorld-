import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { db } from "../../../../../lib/db";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const post = await db.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const existing = await db.postLike.findUnique({ where: { postId_userId: { postId: id, userId: user.id } } });
  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await db.postLike.create({ data: { postId: id, userId: user.id } });
  return NextResponse.json({ liked: true });
}
