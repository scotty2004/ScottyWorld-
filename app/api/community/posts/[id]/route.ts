import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { authorSelect, shapePost } from "@/lib/community/feed";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await context.params;

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: authorSelect },
      sharedPost: { include: { author: { select: { username: true, displayName: true } } } },
      _count: { select: { comments: true, likes: true } },
    },
  });
  if (!post) return bad("Post not found.", 404);

  const [comments, like, save] = await Promise.all([
    db.comment.findMany({ where: { postId: id }, orderBy: { createdAt: "asc" }, take: 300, include: { author: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true } } } } } }),
    db.postLike.findUnique({ where: { postId_userId: { postId: id, userId: user.id } }, select: { id: true } }),
    db.bookmark.findUnique({ where: { userId_postId: { userId: user.id, postId: id } }, select: { id: true } }),
  ]);

  return NextResponse.json({
    post: shapePost(post, user.id, new Set(like ? [id] : []), new Set(save ? [id] : [])),
    comments: comments.map((c) => ({ id: c.id, parentId: c.parentId, content: c.content, createdAt: c.createdAt, isMine: c.authorId === user.id, author: { username: c.author.username, displayName: c.author.displayName, avatarUrl: c.author.profile?.avatarUrl ?? null } })),
  });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await context.params;
  const post = await db.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return bad("Post not found.", 404);
  const staff = ["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(user.role);
  if (post.authorId !== user.id && !staff) return bad("Not allowed.", 403);
  await db.post.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
