import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const [mine, trendingRaw] = await Promise.all([
    db.searchHistory.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30, select: { query: true } }),
    db.searchHistory.groupBy({ by: ["query"], where: { createdAt: { gt: new Date(Date.now() - 7 * 86_400_000) } }, _count: { _all: true }, orderBy: { _count: { query: "desc" } }, take: 6 }),
  ]);
  const recent = [...new Set(mine.map((m) => m.query))].slice(0, 8);
  return NextResponse.json({ recent, trending: trendingRaw.map((t) => t.query) });
}

export async function DELETE() {
  const user = await me();
  if (!user) return unauth();
  await db.searchHistory.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
