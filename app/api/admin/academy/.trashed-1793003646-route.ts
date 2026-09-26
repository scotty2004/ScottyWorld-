import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","CONTENT_MANAGER"]);
    const courses = await prisma.course.findMany({
      select:{id:true,title:true,slug:true,level:true,status:true,createdAt:true,updatedAt:true},
      orderBy:{updatedAt:"desc"}, take:50
    });
    return NextResponse.json(courses);
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
