import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();

  const { id } = await context.params;
  const post = await db.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post) return bad("Post not found.", 404);

  const existing = await db.postLike.findUnique({ where: { postId_userId: { postId: id, userId: user.id } } });
  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
  } else {
    await db.postLike.create({ data: { postId: id, userId: user.id } });
    if (post.authorId !== user.id) await db.notification.create({ data: { userId: post.authorId, type: "COMMUNITY", title: "New like", body: `${user.displayName} liked your post.` } }).catch(() => null);
  }
  const likes = await db.postLike.count({ where: { postId: id } });
  return NextResponse.json({ liked: !existing, likes });
}
