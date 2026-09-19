import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guards";

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN","ADMIN","CONTENT_MANAGER"]);
    return NextResponse.json({
      status:"FOUNDATION",
      message:"News management is reserved for the dedicated News content model in a later iteration."
    });
  } catch { return NextResponse.json({error:"Forbidden"},{status:403}); }
}
