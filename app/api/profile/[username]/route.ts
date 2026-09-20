import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

export async function GET(_: Request, ctx: { params: Promise<{ username: string }> }) {
  const viewer = await me();
  if (!viewer) return unauth();
  const { username } = await ctx.params;
  const u = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true, username: true, displayName: true, role: true, createdAt: true, emailVerified: true,
      profile: { select: { bio: true, avatarUrl: true, public: true } },
      _count: { select: { posts: true, followsTo: true, followsFrom: true } },
    },
  });
  if (!u) return bad("User not found.", 404);

  const block = await db.userBlock.findFirst({ where: { OR: [{ blockerId: viewer.id, blockedId: u.id }, { blockerId: u.id, blockedId: viewer.id }] }, select: { blockerId: true } });
  if (block) return bad("This profile isn't available.", 404);

  const [following, subscription] = await Promise.all([
    db.follow.findUnique({ where: { followerId_followingId: { followerId: viewer.id, followingId: u.id } }, select: { id: true } }),
    db.subscription.findFirst({ where: { userId: u.id, status: "ACTIVE" }, include: { plan: { select: { slug: true, name: true } } }, orderBy: { plan: { priceCents: "desc" } } }),
  ]);
  return NextResponse.json({
    profile: {
      username: u.username, displayName: u.displayName, bio: u.profile?.bio ?? "", avatarUrl: u.profile?.avatarUrl ?? null,
      joined: u.createdAt, verified: Boolean(u.emailVerified), staff: u.role !== "USER", plan: subscription?.plan?.slug ?? null,
      private: u.profile?.public === false,
      counts: { posts: u._count.posts, followers: u._count.followsTo, following: u._count.followsFrom },
      isMe: u.id === viewer.id, following: Boolean(following),
    },
  });
}
