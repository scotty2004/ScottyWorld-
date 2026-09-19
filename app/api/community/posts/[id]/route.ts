import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { db } from "../../../../lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { username: true, displayName: true, profile: true } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { username: true, displayName: true } } } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json({ post });
}
