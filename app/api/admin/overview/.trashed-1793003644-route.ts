import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin();
    const [
      users, bots, products, posts, reports, courses,
      subscriptions, securityEvents, auditLogs,
      pendingTasks, pendingDeposits, openTickets, fees, coinsInCirculation
    ] = await Promise.all([
      prisma.user.count(),
      prisma.bot.count(),
      prisma.marketplaceProduct.count(),
      prisma.post.count(),
      prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
      prisma.course.count(),
      prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
      prisma.securityEventV2.count({ where: { level: { in: ["WARNING", "CRITICAL"] } } }),
      prisma.auditLog.count(),
      prisma.coinTaskSubmission.count({ where: { status: { in: ["PENDING", "FLAGGED"] } } }),
      prisma.coinDeposit.count({ where: { status: "PENDING" } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { feeCoins: true } }),
      prisma.coinTransaction.aggregate({ _sum: { amount: true } }),
    ]);
    return NextResponse.json({
      users, bots, products, posts, reports, courses,
      subscriptions, securityEvents, auditLogs,
      pendingTasks, pendingDeposits, openTickets,
      marketFees: fees._sum.feeCoins ?? 0,
      coinsInCirculation: coinsInCirculation._sum.amount ?? 0,
    });
  } catch (e) {
    const status = (e as Error).message === "ADMIN_FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Failed to load overview" }, { status });
  }
}
