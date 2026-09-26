import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { consumePasswordReset } from "@/lib/auth/password-reset";
import { hashPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`reset:${ip}`, 10, 10 * 60_000).allowed) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const parsed = z.object({ token: z.string().min(20).max(2000), password: z.string().min(8).max(128) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const userId = await consumePasswordReset(parsed.data.token);
  if (!userId) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });

  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  // sign out every device after a password reset
  await db.session.deleteMany({ where: { userId } });
  return NextResponse.json({ ok: true });
}
