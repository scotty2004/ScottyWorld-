import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

const ROLES = ["SUPER_ADMIN", "ADMIN", "SUPPORT"] as const;

export async function GET() {
  try { await requireAdmin([...ROLES]); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const tickets = await db.supportTicket.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100, include: { user: { select: { username: true, email: true, displayName: true } } } });
  return NextResponse.json({ tickets });
}

/** body: { id, status: OPEN|IN_PROGRESS|RESOLVED|CLOSED, reply? } — a reply is delivered to the user as a notification. */
export async function PATCH(req: Request) {
  let admin; try { admin = await requireAdmin([...ROLES]); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id, status, reply } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const t = await db.supportTicket.update({ where: { id }, data: { status } }).catch(() => null);
  if (!t) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  if (typeof reply === "string" && reply.trim()) {
    await db.notification.create({ data: { userId: t.userId, type: "SYSTEM", title: `Reply to your ticket: ${t.subject.slice(0, 60)}`, body: reply.trim().slice(0, 900) } });
  }
  await writeAdminAudit({ userId: admin.id, action: "TICKET_UPDATED", entity: "SupportTicket", entityId: id, metadata: { status } });
  return NextResponse.json({ ok: true });
}
