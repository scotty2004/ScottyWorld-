import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/verification";
import { rewardReferralIfDue } from "@/lib/coins/service";

export async function POST(request: Request) {
  const { token } = await request.json().catch(() => ({}));
  if (typeof token !== "string") return NextResponse.json({ error: "Invalid token." }, { status: 400 });

  const userId = await verifyEmailToken(token);
  if (!userId) return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });

  // A verified email is what turns a referral into a paid referral.
  await rewardReferralIfDue(userId).catch(() => null);
  return NextResponse.json({ ok: true });
}
