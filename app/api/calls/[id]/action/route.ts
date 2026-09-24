import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

const ALLOWED = new Set(["decline", "end"]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const call = await db.call.findUnique({ where: { id }, select: { callerId: true, calleeId: true, status: true } });
  if (!call) return bad("Call not found.", 404);
  if (call.callerId !== user.id && call.calleeId !== user.id) return bad("Not allowed.", 403);

  const { action } = await req.json().catch(() => ({}) as any);
  if (!ALLOWED.has(action)) return bad("Invalid action.");

  const status = action === "decline" ? "DECLINED" : "ENDED";
  await db.call.update({ where: { id }, data: { status, endedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
