import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","MODERATOR"]);
    const reports = await prisma.report.findMany({
      include:{ reporter:{select:{id:true,username:true}}, post:{select:{id:true,title:true,type:true}} },
      orderBy:{createdAt:"desc"}, take:50
    });
    return NextResponse.json(reports);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin(["SUPER_ADMIN","ADMIN","MODERATOR"]);
    const { id, status } = await req.json();
    const allowed = ["OPEN","REVIEWING","RESOLVED","DISMISSED"];
    if (!id || !allowed.includes(status)) return NextResponse.json({error:"Invalid input"},{status:400});
    const report = await prisma.report.update({where:{id},data:{status}});
    await writeAdminAudit({userId:user.id,action:"REPORT_STATUS_CHANGED",entity:"Report",entityId:id,metadata:{status}});
    return NextResponse.json(report);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
