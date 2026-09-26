import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { integrationConfig } from "@/lib/integrations/config";
import { isOwnerAccount } from "@/lib/admin/owner";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isOwnerAccount(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(integrationConfig);
}
