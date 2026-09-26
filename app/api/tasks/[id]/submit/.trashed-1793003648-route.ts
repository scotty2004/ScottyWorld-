import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { hashImage, screenSubmission, validateScreenshot } from "@/lib/tasks/screening";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  if (!rateLimit(`task-submit:${user.id}`, 8, 60_000).allowed) return bad("Too many submissions. Wait a minute.", 429);

  const { id } = await ctx.params;
  const task = await db.coinTask.findFirst({ where: { id, active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
  if (!task) return bad("Task not found or expired.", 404);

  const body = await req.json().catch(() => ({}));
  const err = validateScreenshot(body.screenshot);
  if (err) return bad(err);

  const already = await db.coinTaskSubmission.findUnique({ where: { taskId_userId: { taskId: id, userId: user.id } } });
  if (already && already.status !== "REJECTED") return bad("You already submitted this task.", 409);

  const hash = hashImage(body.screenshot);
  const screening = await screenSubmission({ userId: user.id, taskTitle: task.title, platform: task.platform, kind: task.kind, dataUrl: body.screenshot, hash });
  const status = screening.verdict === "SUSPICIOUS" && screening.score < 25 ? "FLAGGED" : "PENDING";

  const data = { screenshotData: body.screenshot, imageHash: hash, status: status as any, aiScore: screening.score, aiVerdict: screening.verdict, aiReasons: screening.reasons, reviewedById: null, reviewedAt: null };
  const submission = already
    ? await db.coinTaskSubmission.update({ where: { id: already.id }, data })
    : await db.coinTaskSubmission.create({ data: { taskId: id, userId: user.id, ...data } });

  return NextResponse.json({ ok: true, status: submission.status, message: status === "FLAGGED" ? "Submitted — flagged for manual security review." : "Submitted! An admin will verify it shortly and your coins will be added." }, { status: 201 });
}
