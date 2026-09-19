import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth/session";
import { db } from "../../../lib/db";
import { getCoinBalance } from "../../../lib/coins/service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const [balance, transactions] = await Promise.all([
    getCoinBalance(user.id),
    db.coinTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return NextResponse.json({ balance, transactions });
}
