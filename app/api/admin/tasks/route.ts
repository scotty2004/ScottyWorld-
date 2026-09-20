import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { addCoinTransaction, rewardReferralIfDue } from "@/lib/coins/service";
import { getEntitlements } from "@/lib/pro/plans";
import { writeAdminAudit } from "@/lib/admin/audit";

const ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER", "MODERATOR"] as const;
const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET() {
  try { await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const [tasks, queue] = await Promise.all([
    db.coinTask.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { submissions: true } } } }),
    db.coinTaskSubmission.findMany({
      where: { status: { in: ["PENDING", "FLAGGED"] } }, orderBy: [{ status: "desc" }, { createdAt: "asc" }], take: 60,
      include: { user: { select: { username: true, displayName: true, createdAt: true } }, task: { select: { title: true, platform: true, rewardCoins: true } } },
    }),
  ]);
  return NextResponse.json({ tasks, queue });
}

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(400).optional(),
  platform: z.enum(["TIKTOK", "YOUTUBE", "FACEBOOK", "WHATSAPP", "TELEGRAM", "OTHER"]),
  kind: z.enum(["WATCH", "FOLLOW", "JOIN", "SUBSCRIBE"]),
  url: z.string().url().max(500),
  rewardCoins: z.number().int().min(1).max(500),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  let admin; try { admin = await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid task." }, { status: 400 });
  const task = await db.coinTask.create({ data: { ...parsed.data, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null } });
  await writeAdminAudit({ userId: admin.id, action: "TASK_CREATED", entity: "CoinTask", entityId: task.id, metadata: { title: task.title } });
  return NextResponse.json({ task }, { status: 201 });
}

/** body: { submissionId, decision: "APPROVE" | "REJECT" } or { taskId, active } */
export async function PATCH(req: Request) {
  let admin; try { admin = await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const body = await req.json().catch(() => ({}));

  if (typeof body.taskId === "string" && typeof body.active === "boolean") {
    await db.coinTask.update({ where: { id: body.taskId }, data: { active: body.active } });
    return NextResponse.json({ ok: true });
  }

  const decision = body.decision;
  if (typeof body.submissionId !== "string" || !["APPROVE", "REJECT"].includes(decision)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const sub = await db.coinTaskSubmission.findUnique({ where: { id: body.submissionId }, include: { task: true } });
  if (!sub || !["PENDING", "FLAGGED"].includes(sub.status)) return NextResponse.json({ error: "Submission already handled." }, { status: 409 });

  if (decision === "REJECT") {
    await db.coinTaskSubmission.update({ where: { id: sub.id }, data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() } });
    await db.notification.create({ data: { userId: sub.userId, type: "SYSTEM", title: "Task not approved", body: `"${sub.task.title}" couldn't be verified. You can resubmit a clearer screenshot.` } });
    await writeAdminAudit({ userId: admin.id, action: "TASK_REJECTED", entity: "CoinTaskSubmission", entityId: sub.id });
    return NextResponse.json({ ok: true });
  }

  // claim first (prevents double-pay on double-click), then pay
  const claimed = await db.coinTaskSubmission.updateMany({ where: { id: sub.id, status: { in: ["PENDING", "FLAGGED"] } }, data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() } });
  if (claimed.count === 0) return NextResponse.json({ error: "Submission already handled." }, { status: 409 });

  const ent = await getEntitlements(sub.userId);
  const reward = Math.round(sub.task.rewardCoins * (1 + ent.taskBonusPct / 100));
  await addCoinTransaction(sub.userId, reward, "EARN", `Task: ${sub.task.title}`, `task:${sub.id}`);
  await db.notification.create({ data: { userId: sub.userId, type: "SYSTEM", title: "Task approved", body: `+${reward} SC for "${sub.task.title}".` } });
  await rewardReferralIfDue(sub.userId);
  await writeAdminAudit({ userId: admin.id, action: "TASK_APPROVED", entity: "CoinTaskSubmission", entityId: sub.id, metadata: { reward } });
  return NextResponse.json({ ok: true, reward });
}
