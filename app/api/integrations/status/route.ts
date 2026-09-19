import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { integrationConfig } from "@/lib/integrations/config";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(integrationConfig);
}
