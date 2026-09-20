import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { blockedIds } from "@/lib/community/feed";

/** "People you may know": public accounts you don't follow yet, most followed first. */
export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const [blocked, following] = await Promise.all([blockedIds(user.id), db.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } })]);
  const exclude = [user.id, ...blocked, ...following.map((f) => f.followingId)];
  const people = await db.user.findMany({
    where: { id: { notIn: exclude }, OR: [{ profile: { is: { public: true } } }, { profile: { is: null } }] },
    orderBy: [{ followsTo: { _count: "desc" } }, { createdAt: "desc" }],
    take: 8,
    select: { username: true, displayName: true, profile: { select: { avatarUrl: true, bio: true } }, _count: { select: { followsTo: true } } },
  });
  return NextResponse.json({ people: people.map((p) => ({ username: p.username, displayName: p.displayName, avatarUrl: p.profile?.avatarUrl ?? null, bio: p.profile?.bio ?? null, followers: p._count.followsTo })) });
}
