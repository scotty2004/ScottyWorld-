import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN"]);
    const logs = await prisma.auditLog.findMany({
      include:{actor:{select:{id:true,username:true,email:true,role:true}}},
      orderBy:{createdAt:"desc"}, take:150
    });
    return NextResponse.json(logs);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
