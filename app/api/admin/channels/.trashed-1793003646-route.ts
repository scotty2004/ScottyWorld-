import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

const ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"] as const;
const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET() {
  try { await requireAdmin([...ROLES]); } catch { return forbidden(); }
  return NextResponse.json({ channels: await db.channel.findMany({ orderBy: { createdAt: "asc" } }) });
}

const schema = z.object({ name: z.string().trim().min(2).max(80), platform: z.enum(["WHATSAPP", "TELEGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK", "OTHER"]), url: z.string().url().max(500), description: z.string().trim().max(200).optional() });

export async function POST(req: Request) {
  let admin; try { admin = await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Enter a name, platform and a valid link." }, { status: 400 });
  const channel = await db.channel.create({ data: parsed.data });
  await writeAdminAudit({ userId: admin.id, action: "CHANNEL_CREATED", entity: "Channel", entityId: channel.id });
  return NextResponse.json({ channel }, { status: 201 });
}

export async function PATCH(req: Request) {
  try { await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const { id, active } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || typeof active !== "boolean") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await db.channel.update({ where: { id }, data: { active } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  let admin; try { admin = await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await db.channel.delete({ where: { id } });
  await writeAdminAudit({ userId: admin.id, action: "CHANNEL_DELETED", entity: "Channel", entityId: id });
  return NextResponse.json({ ok: true });
}
