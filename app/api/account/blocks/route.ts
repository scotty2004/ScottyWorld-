import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const rows = await db.userBlock.findMany({ where: { blockerId: user.id }, orderBy: { createdAt: "desc" }, include: { blocked: { select: { username: true, displayName: true } } } });
  return NextResponse.json({ blocked: rows.map((r) => ({ username: r.blocked.username, displayName: r.blocked.displayName, since: r.createdAt })) });
}

/** Toggle: POST {username}. Blocking also removes follows both ways. */
export async function POST(req: Request) {
  const user = await me();
  if (!user) return unauth();
  const { username } = await req.json().catch(() => ({}));
  if (typeof username !== "string") return bad("Username required.");
  const target = await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
  if (!target) return bad("User not found.", 404);
  if (target.id === user.id) return bad("You can't block yourself.");
  const existing = await db.userBlock.findUnique({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: target.id } } });
  if (existing) { await db.userBlock.delete({ where: { id: existing.id } }); return NextResponse.json({ blocked: false }); }
  await db.$transaction([
    db.userBlock.create({ data: { blockerId: user.id, blockedId: target.id } }),
    db.follow.deleteMany({ where: { OR: [{ followerId: user.id, followingId: target.id }, { followerId: target.id, followingId: user.id }] } }),
  ]);
  return NextResponse.json({ blocked: true });
}
