import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

const RING_TIMEOUT_MS = 30_000;

/** Start a call. The callee finds out via the realtime tick (see /api/realtime) and polls this call's signals. */
export async function POST(req: Request) {
  const user = await me();
  if (!user) return unauth();
  const { username, video } = await req.json().catch(() => ({}) as any);
  if (typeof username !== "string" || !username) return bad("A username is required.");

  const callee = await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
  if (!callee) return bad("User not found.", 404);
  if (callee.id === user.id) return bad("You can't call yourself.");

  const block = await db.userBlock.findFirst({ where: { OR: [{ blockerId: user.id, blockedId: callee.id }, { blockerId: callee.id, blockedId: user.id }] } });
  if (block) return bad("You can't call this user.", 403);

  // Avoid stacking duplicate rings if the caller double-taps.
  const existing = await db.call.findFirst({ where: { callerId: user.id, calleeId: callee.id, status: "RINGING", startedAt: { gt: new Date(Date.now() - RING_TIMEOUT_MS) } } });
  if (existing) return NextResponse.json({ call: existing });

  const call = await db.call.create({ data: { callerId: user.id, calleeId: callee.id, video: Boolean(video) } });
  return NextResponse.json({ call });
}
