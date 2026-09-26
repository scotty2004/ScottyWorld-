import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

const ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER"] as const;

export async function GET() {
  try { await requireAdmin([...ROLES]); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const deposits = await db.coinDeposit.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { username: true, email: true } } } });
  return NextResponse.json({ deposits });
}

/** body: { id, decision: "CONFIRM" | "REJECT" } — CONFIRM credits the coins exactly once. */
export async function PATCH(req: Request) {
  let admin; try { admin = await requireAdmin([...ROLES]); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id, decision } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !["CONFIRM", "REJECT"].includes(decision)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const result = await db.$transaction(async (tx) => {
    const claimed = await tx.coinDeposit.updateMany({ where: { id, status: "PENDING" }, data: { status: decision === "CONFIRM" ? "PAID" : "REJECTED", paidAt: decision === "CONFIRM" ? new Date() : null } });
    if (claimed.count === 0) return null;
    const dep = await tx.coinDeposit.findUniqueOrThrow({ where: { id } });
    if (decision === "CONFIRM") {
      await tx.coinTransaction.create({ data: { userId: dep.userId, amount: dep.coins, type: "EARN", reason: `Deposit $${(dep.usdCents / 100).toFixed(2)}`, reference: `deposit:${dep.id}` } });
      await tx.notification.create({ data: { userId: dep.userId, type: "SYSTEM", title: "Deposit confirmed", body: `+${dep.coins} SC added to your wallet.` } });
    }
    return dep;
  });
  if (!result) return NextResponse.json({ error: "Deposit already handled." }, { status: 409 });
  await writeAdminAudit({ userId: admin.id, action: `DEPOSIT_${decision}`, entity: "CoinDeposit", entityId: id, metadata: { coins: result.coins } });
  return NextResponse.json({ ok: true });
}
