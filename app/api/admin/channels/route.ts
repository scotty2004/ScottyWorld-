import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","CONTENT_MANAGER"]);
    return NextResponse.json({ status:"FOUNDATION", channels:[] });
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
