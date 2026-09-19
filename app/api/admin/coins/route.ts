import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","FINANCE_MANAGER"]);
    const tx = await prisma.coinTransaction.findMany({
      include:{user:{select:{id:true,username:true,email:true}}},
      orderBy:{createdAt:"desc"}, take:100
    });
    return NextResponse.json(tx);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(["SUPER_ADMIN","ADMIN","FINANCE_MANAGER"]);
    const body = await req.json();
    const userId = String(body.userId || "");
    const amount = Number(body.amount);
    const reason = String(body.reason || "").trim();
    if (!userId || !Number.isInteger(amount) || amount === 0 || !reason || reason.length > 240)
      return NextResponse.json({error:"Invalid adjustment"},{status:400});

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.coinTransaction.aggregate({
        where:{userId}, _sum:{amount:true}
      });
      const balance = existing._sum.amount || 0;
      if (balance + amount < 0) throw new Error("INSUFFICIENT_BALANCE");
      const created = await tx.coinTransaction.create({
        data:{userId, amount, type:"ADJUSTMENT", description:reason, reference:`admin:${admin.id}`}
      });
      return created;
    });
    await writeAdminAudit({
      userId:admin.id, action:"COIN_ADJUSTMENT", entity:"CoinTransaction",
      entityId:result.id, metadata:{targetUserId:userId,amount,reason}
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg=(e as Error).message;
    return NextResponse.json({error:msg==="INSUFFICIENT_BALANCE"?"Insufficient balance":"Forbidden"},
      {status:msg==="INSUFFICIENT_BALANCE"?400:403});
  }
}
