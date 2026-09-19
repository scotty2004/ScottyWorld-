import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","CONTENT_MANAGER","FINANCE_MANAGER"]);
    const products = await prisma.marketplaceProduct.findMany({
      include:{ seller:{select:{id:true,username:true,email:true}} },
      orderBy:{updatedAt:"desc"}, take:50
    });
    return NextResponse.json(products);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin(["SUPER_ADMIN","ADMIN","CONTENT_MANAGER"]);
    const { id, status } = await req.json();
    const allowed = ["DRAFT","PUBLISHED","ARCHIVED","SUSPENDED"];
    if (!id || !allowed.includes(status)) return NextResponse.json({error:"Invalid input"},{status:400});
    const product = await prisma.marketplaceProduct.update({ where:{id}, data:{status} });
    await writeAdminAudit({ userId:user.id, action:"MARKETPLACE_STATUS_CHANGED", entity:"MarketplaceProduct", entityId:id, metadata:{status} });
    return NextResponse.json(product);
  } catch (e) { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
