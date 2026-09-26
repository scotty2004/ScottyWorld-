import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

const KINDS = new Set(["offer", "answer", "candidate", "hangup"]);

/** Relays one WebRTC signaling message (offer/answer/ICE candidate/hangup) to the other side of the call. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const call = await db.call.findUnique({ where: { id }, select: { callerId: true, calleeId: true, status: true } });
  if (!call) return bad("Call not found.", 404);
  if (call.callerId !== user.id && call.calleeId !== user.id) return bad("Not allowed.", 403);

  const { kind, payload } = await req.json().catch(() => ({}) as any);
  if (!KINDS.has(kind) || typeof payload !== "string" || payload.length > 20_000) return bad("Invalid signal.");

  await db.callSignal.create({ data: { callId: id, fromId: user.id, kind, payload } });

  if (kind === "answer" && call.status === "RINGING") await db.call.update({ where: { id }, data: { status: "ACCEPTED", answeredAt: new Date() } });
  if (kind === "hangup") await db.call.update({ where: { id }, data: { status: call.status === "RINGING" ? "DECLINED" : "ENDED", endedAt: new Date() } });

  return NextResponse.json({ ok: true });
}
