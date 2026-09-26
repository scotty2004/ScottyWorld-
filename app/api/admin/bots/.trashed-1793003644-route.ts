import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","SUPPORT"]);
    const bots = await prisma.bot.findMany({
      select: { id: true, name: true, status: true, provider: true, source: true, hostedUntil: true, updatedAt: true, owner: { select: { id:true, username:true, email:true } } },
      orderBy: { updatedAt:"desc" }, take: 100
    });
    return NextResponse.json(bots);
  } catch (e) {
    return NextResponse.json({ error:"Forbidden" }, { status:403 });
  }
}


/** body: { id, status?: BotStatus, addDays?: number } — set what is actually running and grant hosting time. */
export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin(["SUPER_ADMIN","ADMIN"]);
    const { id, status, addDays } = await req.json();
    const valid = ["DRAFT","TESTING","DEPLOYING","RUNNING","STOPPED","ERROR","PAUSED"];
    const data: Record<string, unknown> = {};
    if (status) { if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 }); data.status = status; }
    if (Number.isInteger(addDays) && addDays > 0 && addDays <= 365) {
      const bot = await prisma.bot.findUnique({ where: { id }, select: { hostedUntil: true } });
      if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const from = bot.hostedUntil && bot.hostedUntil > new Date() ? bot.hostedUntil : new Date();
      data.hostedUntil = new Date(from.getTime() + addDays * 86_400_000);
    }
    if (!Object.keys(data).length) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
    const bot = await prisma.bot.update({ where: { id }, data, select: { id: true, status: true, hostedUntil: true } });
    await writeAdminAudit({ userId: admin.id, action: "BOT_ADMIN_UPDATE", entity: "Bot", entityId: id, metadata: data });
    return NextResponse.json(bot);
  } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
}
