import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(_: Request, context: { params: Promise<{ username: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { username } = await context.params;
  const target = await db.user.findUnique({ where: { username }, select: { id: true, username: true } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await db.follow.create({ data: { followerId: user.id, followingId: target.id } });
  return NextResponse.json({ following: true });
}
