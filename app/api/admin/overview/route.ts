import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin();
    const [
      users, bots, products, posts, reports, courses,
      subscriptions, securityEvents, auditLogs
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
    ]);
    return NextResponse.json({
      users, bots, products, posts, reports, courses,
      subscriptions, securityEvents, auditLogs
    });
  } catch (e) {
    const status = (e as Error).message === "ADMIN_FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Failed to load overview" }, { status });
  }
}
