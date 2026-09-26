import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ECONOMY } from "@/lib/economy";
import { getClientIp, hashIdentifier } from "@/lib/security/device";

/**
 * Public referral link: scottyworld.com/r/<code>
 * Records a click (2 SC to the referrer — deduped per visitor and capped per day), then sends the visitor to sign-up.
 */
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params;
  const code = raw.toLowerCase();
  const url = new URL(req.url);
  const dest = new URL(`/register?ref=${encodeURIComponent(code)}`, url.origin);

  try {
    if (!/^[a-z0-9_-]{2,40}$/.test(code)) return NextResponse.redirect(new URL("/register", url.origin));
    const referrer = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (referrer) {
      const ipHash = hashIdentifier(`${getClientIp(req) ?? "unknown"}|${req.headers.get("user-agent") ?? ""}`) ?? "unknown";
      const since = new Date(Date.now() - 86_400_000);
      const seen = await db.referralClick.findFirst({ where: { code, ipHash, createdAt: { gt: since } }, select: { id: true } });
      if (!seen) {
        const rewardedToday = await db.referralClick.count({ where: { code, rewarded: true, createdAt: { gt: since } } });
        const rewarded = rewardedToday < ECONOMY.REFERRAL_CLICK_DAILY_CAP;
        await db.$transaction(async (tx) => {
          await tx.referralClick.create({ data: { code, ipHash, rewarded } });
          if (rewarded) await tx.coinTransaction.create({ data: { userId: referrer.id, amount: ECONOMY.REFERRAL_CLICK_REWARD, type: "BONUS", reason: "Referral link click", reference: `click:${code}` } });
        });
      }
    }
  } catch { /* never block the visitor */ }
  return NextResponse.redirect(dest);
}
