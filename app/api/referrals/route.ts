import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const referrals = await db.referral.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { referred: { select: { username: true, displayName: true } } },
  });

  return NextResponse.json({ referrals });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!/^[a-zA-Z0-9_-]{3,40}$/.test(code)) return NextResponse.json({ error: "Invalid referral code." }, { status: 400 });

  return NextResponse.json({ message: "Referral attribution endpoint is ready. Apply the code during registration in the next auth iteration.", code });
}
