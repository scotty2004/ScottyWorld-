import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

const RING_TIMEOUT_MS = 30_000;

/** Poll a call's status and any signals newer than `?since=<ms epoch>` (defaults to everything). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const since = Number(new URL(req.url).searchParams.get("since") || 0);

  const call = await db.call.findUnique({
    where: { id },
    include: { caller: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true } } } }, callee: { select: { username: true, displayName: true, profile: { select: { avatarUrl: true } } } } },
  });
  if (!call) return bad("Call not found.", 404);
  if (call.callerId !== user.id && call.calleeId !== user.id) return bad("Not allowed.", 403);

  // Auto-expire a ring nobody answered.
  if (call.status === "RINGING" && Date.now() - call.startedAt.getTime() > RING_TIMEOUT_MS) {
    await db.call.update({ where: { id }, data: { status: "MISSED", endedAt: new Date() } }).catch(() => null);
    call.status = "MISSED";
  }

  const signals = await db.callSignal.findMany({ where: { callId: id, createdAt: { gt: new Date(since) }, NOT: { fromId: user.id } }, orderBy: { createdAt: "asc" }, take: 100 });

  return NextResponse.json({
    call: {
      id: call.id, status: call.status, video: call.video,
      isCaller: call.callerId === user.id,
      peer: call.callerId === user.id
        ? { username: call.callee.username, displayName: call.callee.displayName, avatarUrl: call.callee.profile?.avatarUrl ?? null }
        : { username: call.caller.username, displayName: call.caller.displayName, avatarUrl: call.caller.profile?.avatarUrl ?? null },
    },
    signals: signals.map((s) => ({ kind: s.kind, payload: s.payload, at: s.createdAt.getTime() })),
    serverNow: Date.now(),
  });
}
