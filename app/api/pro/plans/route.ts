import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const plans = await db.proPlan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } });
  return NextResponse.json({ plans });
}
