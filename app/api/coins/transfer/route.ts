import { NextResponse } from "next/server";
import { z } from "zod";
import { me, unauth, bad } from "@/lib/api";
import { transferCoins } from "@/lib/coins/service";
import { rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({ accountNumber: z.string().regex(/^\d{6}$/), amount: z.number().int().positive(), note: z.string().max(140).optional() });

export async function POST(req: Request) {
  const user = await me();
  if (!user) return unauth();
  if (!rateLimit(`transfer:${user.id}`, 10, 60_000).allowed) return bad("Too many transfers. Slow down.", 429);
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Enter a valid 6-digit account number and amount.");
  const r = await transferCoins(user.id, parsed.data.accountNumber, parsed.data.amount, parsed.data.note);
  return r.ok ? NextResponse.json(r) : bad(r.error);
}
