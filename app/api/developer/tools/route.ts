import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { developerTools } from "../../../../lib/developer/tools";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ tools: developerTools });
}
