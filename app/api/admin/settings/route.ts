import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN"]);
    return NextResponse.json(await prisma.platformSetting.findMany({orderBy:{key:"asc"}}));
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(["SUPER_ADMIN","ADMIN"]);
    const {key,value}=await req.json();
    if (!key || typeof key !== "string" || key.length > 100) return NextResponse.json({error:"Invalid key"},{status:400});
    const setting=await prisma.platformSetting.upsert({
      where:{key},
      create:{key,value,updatedById:admin.id},
      update:{value,updatedById:admin.id}
    });
    await writeAdminAudit({userId:admin.id,action:"SETTING_UPDATED",entity:"PlatformSetting",entityId:setting.id,metadata:{key}});
    return NextResponse.json(setting);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
