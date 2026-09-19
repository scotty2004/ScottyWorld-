import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { commentCreateSchema } from "@/lib/community/validation";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const limit = rateLimit(`community-comment:${user.id}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Commenting too quickly. Try again later." }, { status: 429 });

  const { id } = await context.params;
  const post = await db.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const parsed = commentCreateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid comment." }, { status: 400 });

  const comment = await db.comment.create({
    data: { postId: id, authorId: user.id, content: parsed.data.content },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
