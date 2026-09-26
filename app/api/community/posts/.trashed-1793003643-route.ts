import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { postCreateSchema } from "@/lib/community/validation";
import { authorSelect, blockedIds, shapePost } from "@/lib/community/feed";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const user = await me();
  if (!user) return unauth();

  const url = new URL(request.url);
  const feed = url.searchParams.get("feed") || "for-you";
  const type = url.searchParams.get("type");
  const author = url.searchParams.get("author");
  const q = url.searchParams.get("q")?.trim();
  const cursor = url.searchParams.get("cursor");

  const [blocked, following] = await Promise.all([
    blockedIds(user.id),
    db.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }),
  ]);
  const followingIds = following.map((f) => f.followingId);

  const where: any = {
    isStory: false,
    authorId: { notIn: blocked },
    // private accounts are visible only to themselves and their followers
    OR: [{ author: { profile: { is: { public: true } } } }, { author: { profile: { is: null } } }, { authorId: user.id }, { authorId: { in: followingIds } }],
    ...(type && ["POST", "QUESTION", "PROJECT"].includes(type) ? { type } : {}),
    ...(author ? { author: { username: author } } : {}),
    ...(q ? { AND: [{ OR: [{ content: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }] }] } : {}),
  };
  if (feed === "following") where.AND = [...(where.AND ?? []), { authorId: { in: [...followingIds, user.id] } }];
  if (feed === "trending") where.createdAt = { gt: new Date(Date.now() - 7 * 86_400_000) };

  const take = 20;
  const rows = await db.post.findMany({
    where,
    orderBy: feed === "trending" ? [{ likes: { _count: "desc" } }, { comments: { _count: "desc" } }, { createdAt: "desc" }] : { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: { select: authorSelect },
      sharedPost: { include: { author: { select: { username: true, displayName: true } } } },
      _count: { select: { comments: true, likes: true } },
    },
  });
  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;
  const ids = page.map((p) => p.id);
  const [likes, saves] = await Promise.all([
    db.postLike.findMany({ where: { userId: user.id, postId: { in: ids } }, select: { postId: true } }),
    db.bookmark.findMany({ where: { userId: user.id, postId: { in: ids } }, select: { postId: true } }),
  ]);
  const liked = new Set(likes.map((l) => l.postId));
  const saved = new Set(saves.map((s) => s.postId));

  return NextResponse.json({ posts: page.map((p) => shapePost(p, user.id, liked, saved)), nextCursor: hasMore ? page[page.length - 1].id : null });
}

export async function POST(request: Request) {
  const user = await me();
  if (!user) return unauth();
  if (!rateLimit(`community-post:${user.id}`, 10, 60_000).allowed) return bad("Posting too quickly. Try again in a minute.", 429);

  const parsed = postCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message || "Invalid post.");
  const d = parsed.data;

  if (d.sharedPostId) {
    const original = await db.post.findUnique({ where: { id: d.sharedPostId }, select: { id: true, authorId: true } });
    if (!original) return bad("The post you're sharing no longer exists.", 404);
  }

  const post = await db.post.create({
    data: {
      authorId: user.id, type: d.type, title: d.title || null, content: d.content, tags: d.tags || [],
      mediaUrl: d.mediaUrl ?? null, mediaType: d.mediaType ?? null,
      isStory: Boolean(d.isStory), expiresAt: d.isStory ? new Date(Date.now() + 24 * 3600_000) : null,
      sharedPostId: d.sharedPostId ?? null,
    },
    select: { id: true },
  });
  if (d.sharedPostId) await db.post.update({ where: { id: d.sharedPostId }, data: { shareCount: { increment: 1 } } }).catch(() => null);
  return NextResponse.json({ post }, { status: 201 });
}
