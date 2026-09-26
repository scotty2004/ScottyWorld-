import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","FINANCE_MANAGER"]);
    const subscriptions = await prisma.subscription.findMany({
      include:{user:{select:{id:true,username:true,email:true}}, plan:true},
      orderBy:{createdAt:"desc"}, take:100
    });
    return NextResponse.json(subscriptions);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
