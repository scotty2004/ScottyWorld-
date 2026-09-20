import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { commentCreateSchema } from "@/lib/community/validation";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  if (!rateLimit(`community-comment:${user.id}`, 20, 60_000).allowed) return bad("Commenting too quickly. Try again later.", 429);

  const { id } = await context.params;
  const post = await db.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post) return bad("Post not found.", 404);

  const parsed = commentCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return bad("Write a reply first.");

  let parentAuthor: string | null = null;
  if (parsed.data.parentId) {
    const parent = await db.comment.findFirst({ where: { id: parsed.data.parentId, postId: id }, select: { authorId: true } });
    if (!parent) return bad("The comment you're replying to no longer exists.", 404);
    parentAuthor = parent.authorId;
  }

  const comment = await db.comment.create({ data: { postId: id, authorId: user.id, content: parsed.data.content, parentId: parsed.data.parentId ?? null } });

  const notify = new Set([post.authorId, parentAuthor].filter((x): x is string => Boolean(x) && x !== user.id));
  for (const uid of notify) {
    await db.notification.create({ data: { userId: uid, type: "COMMUNITY", title: parentAuthor === uid ? "New reply to your comment" : "New comment on your post", body: `${user.displayName}: ${parsed.data.content.slice(0, 80)}` } }).catch(() => null);
  }
  return NextResponse.json({ comment }, { status: 201 });
}
