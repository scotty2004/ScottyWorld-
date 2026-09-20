import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { blockedIds } from "@/lib/community/feed";

/** Active (24h) stories grouped by author, people you follow first. */
export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const [blocked, following] = await Promise.all([blockedIds(user.id), db.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } })]);
  const fset = new Set(following.map((f) => f.followingId));
  const rows = await db.post.findMany({
    where: { isStory: true, expiresAt: { gt: new Date() }, authorId: { notIn: blocked } },
    orderBy: { createdAt: "desc" }, take: 80,
    select: { id: true, content: true, mediaUrl: true, mediaType: true, createdAt: true, authorId: true, author: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true, public: true } } } } },
  });
  const groups = new Map<string, any>();
  for (const r of rows) {
    if (r.author.profile?.public === false && !fset.has(r.authorId) && r.authorId !== user.id) continue;
    const g = groups.get(r.authorId) ?? { userId: r.authorId, username: r.author.username, displayName: r.author.displayName, avatarUrl: r.author.profile?.avatarUrl ?? null, mine: r.authorId === user.id, stories: [] };
    g.stories.push({ id: r.id, content: r.content, mediaUrl: r.mediaUrl, mediaType: r.mediaType, createdAt: r.createdAt });
    groups.set(r.authorId, g);
  }
  const list = [...groups.values()].sort((a, b) => Number(b.mine) - Number(a.mine) || Number(fset.has(b.userId)) - Number(fset.has(a.userId)));
  return NextResponse.json({ groups: list });
}
