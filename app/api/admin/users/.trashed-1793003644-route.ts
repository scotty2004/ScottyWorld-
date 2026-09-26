import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","SUPPORT"]);
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";
    const users = await prisma.user.findMany({
      where: q ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      } : undefined,
      select: { id:true, email:true, username:true, role:true, createdAt:true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(users);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message === "ADMIN_FORBIDDEN" ? "Forbidden" : "Failed" },
      { status: (e as Error).message === "ADMIN_FORBIDDEN" ? 403 : 500 });
  }
}
