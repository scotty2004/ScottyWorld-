import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN"]);
    const events = await prisma.securityEventV2.findMany({
      include:{user:{select:{id:true,username:true,email:true}}},
      orderBy:{createdAt:"desc"}, take:100
    });
    return NextResponse.json(events);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
