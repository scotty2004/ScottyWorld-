import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";

const BADGES = [
  { min: 1, name: "Champion", tone: "gold" },
  { min: 2, name: "Elite", tone: "silver" },
  { min: 3, name: "Rising Star", tone: "bronze" },
];

/** Weekly leaderboard. score = posts×3 + comments×1 + likes received×1 + approved tasks×2 + referrals×5 */
export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const since = new Date(Date.now() - 7 * 86_400_000);

  const [posts, comments, likes, tasks, refs, users, totals] = await Promise.all([
    db.post.groupBy({ by: ["authorId"], where: { createdAt: { gt: since }, isStory: false }, _count: { _all: true } }),
    db.comment.groupBy({ by: ["authorId"], where: { createdAt: { gt: since } }, _count: { _all: true } }),
    db.postLike.findMany({ where: { createdAt: { gt: since } }, select: { post: { select: { authorId: true } } } }),
    db.coinTaskSubmission.groupBy({ by: ["userId"], where: { status: "APPROVED", reviewedAt: { gt: since } }, _count: { _all: true } }),
    db.referral.groupBy({ by: ["referrerId"], where: { status: "REWARDED", rewardedAt: { gt: since } }, _count: { _all: true } }),
    db.user.count(),
    Promise.all([db.post.count(), db.bot.count(), db.marketplaceProduct.count({ where: { status: "PUBLISHED" } }), db.course.count({ where: { status: "PUBLISHED" } })]),
  ]);

  const score = new Map<string, { score: number; posts: number; tasks: number; referrals: number }>();
  const bump = (id: string, pts: number, key?: "posts" | "tasks" | "referrals", n = 0) => {
    const s = score.get(id) ?? { score: 0, posts: 0, tasks: 0, referrals: 0 };
    s.score += pts; if (key) s[key] += n; score.set(id, s);
  };
  posts.forEach((r) => bump(r.authorId, r._count._all * 3, "posts", r._count._all));
  comments.forEach((r) => bump(r.authorId, r._count._all));
  likes.forEach((l) => bump(l.post.authorId, 1));
  tasks.forEach((r) => bump(r.userId, r._count._all * 2, "tasks", r._count._all));
  refs.forEach((r) => bump(r.referrerId, r._count._all * 5, "referrals", r._count._all));

  const ranked = [...score.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 10);
  const people = await db.user.findMany({ where: { id: { in: ranked.map(([id]) => id) } }, select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true } } } });
  const byId = new Map(people.map((p) => [p.id, p]));

  const top = ranked.map(([id, s], i) => {
    const p = byId.get(id)!;
    const badge = BADGES.find((b) => b.min === i + 1) ?? (i < 10 ? { name: "Top 10", tone: "blue" } : null);
    return { rank: i + 1, username: p.username, displayName: p.displayName, avatarUrl: p.profile?.avatarUrl ?? null, score: s.score, posts: s.posts, tasks: s.tasks, referrals: s.referrals, badge, isMe: id === user.id };
  });
  const mine = score.get(user.id)?.score ?? 0;
  const myRank = [...score.entries()].sort((a, b) => b[1].score - a[1].score).findIndex(([id]) => id === user.id);

  return NextResponse.json({
    top,
    me: { score: mine, rank: myRank >= 0 ? myRank + 1 : null },
    platform: { users, posts: totals[0], bots: totals[1], products: totals[2], courses: totals[3] },
    comingSoon: [
      { title: "Creator earnings", description: "Get paid in Scotty Coins when your posts perform." },
      { title: "Bot analytics", description: "Message counts and uptime for every bot you host." },
      { title: "Seller insights", description: "Views, conversions and revenue per marketplace item." },
      { title: "Live rooms", description: "Audio rooms for the community." },
    ],
  });
}
