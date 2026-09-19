import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { db } from "../../../../lib/db";
import { postCreateSchema } from "../../../../lib/community/validation";
import { rateLimit } from "../../../../lib/security/rate-limit";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const where = type && ["POST", "QUESTION", "PROJECT"].includes(type) ? { type: type as any } : {};

  const posts = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true, public: true } } } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const limit = rateLimit(`community-post:${user.id}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Posting too quickly. Try again later." }, { status: 429 });

  const parsed = postCreateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid post.", issues: parsed.error.flatten() }, { status: 400 });

  const post = await db.post.create({
    data: {
      authorId: user.id,
      type: parsed.data.type,
      title: parsed.data.title || null,
      content: parsed.data.content,
      tags: parsed.data.tags || [],
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
