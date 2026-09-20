import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { getEntitlements } from "@/lib/pro/plans";

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const [tasks, ent] = await Promise.all([
    db.coinTask.findMany({
      where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      include: { submissions: { where: { userId: user.id }, select: { id: true, status: true, aiVerdict: true, createdAt: true }, take: 1 } },
    }),
    getEntitlements(user.id),
  ]);
  return NextResponse.json({
    bonusPct: ent.taskBonusPct,
    tasks: tasks.map((t) => ({
      id: t.id, title: t.title, description: t.description, platform: t.platform, kind: t.kind, url: t.url,
      rewardCoins: t.rewardCoins, expiresAt: t.expiresAt, mine: t.submissions[0] ?? null,
    })),
  });
}
