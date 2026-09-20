import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { ensureReferralCode } from "@/lib/coins/service";
import { ECONOMY } from "@/lib/economy";

export async function GET(req: Request) {
  const user = await me();
  if (!user) return unauth();
  const code = await ensureReferralCode(user.id, user.username);
  const origin = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const [referrals, clicks, rewardedClicks, paid] = await Promise.all([
    db.referral.findMany({ where: { referrerId: user.id }, orderBy: { createdAt: "desc" }, take: 50, include: { referred: { select: { username: true, displayName: true } } } }),
    db.referralClick.count({ where: { code } }),
    db.referralClick.count({ where: { code, rewarded: true } }),
    db.referral.aggregate({ where: { referrerId: user.id, status: "REWARDED" }, _sum: { rewardCoins: true }, _count: true }),
  ]);

  return NextResponse.json({
    code,
    link: `${origin.replace(/\/$/, "")}/r/${code}`,
    rewards: { perReferral: ECONOMY.REFERRAL_REWARD, perClick: ECONOMY.REFERRAL_CLICK_REWARD },
    stats: {
      clicks,
      signups: referrals.length,
      successful: paid._count,
      earned: (paid._sum.rewardCoins ?? 0) + rewardedClicks * ECONOMY.REFERRAL_CLICK_REWARD,
    },
    referrals,
  });
}
