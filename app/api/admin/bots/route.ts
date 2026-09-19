import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","SUPPORT"]);
    const bots = await prisma.bot.findMany({
      include: { owner: { select: { id:true, username:true, email:true } } },
      orderBy: { updatedAt:"desc" }, take: 50
    });
    return NextResponse.json(bots);
  } catch (e) {
    return NextResponse.json({ error:"Forbidden" }, { status:403 });
  }
}
