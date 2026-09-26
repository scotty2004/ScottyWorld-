import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { enforceRateLimit } from "@/lib/security/request";

/** Confirm who owns an account number before sending coins. */
export async function GET(req: Request) {
  const user = await me();
  if (!user) return unauth();
  try { await enforceRateLimit(`lookup:${user.id}`, 30, 60_000); } catch { return bad("Too many lookups.", 429); }
  const n = new URL(req.url).searchParams.get("account") || "";
  if (!/^\d{6}$/.test(n)) return bad("Enter a 6-digit account number.");
  const to = await db.user.findUnique({ where: { accountNumber: n }, select: { id: true, displayName: true, username: true } });
  if (!to) return bad("No wallet with that number.", 404);
  if (to.id === user.id) return bad("That's your own wallet.");
  return NextResponse.json({ displayName: to.displayName, username: to.username });
}
