import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validators/auth";
import { verifyTotp } from "@/lib/security/totp";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login details." }, { status: 400 });
    }

    // slow down password guessing: 10 attempts / 10 min per IP + email
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(`login:${ip}:${parsed.data.email.toLowerCase()}`, 10, 10 * 60_000).allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!parsed.data.code) return NextResponse.json({ twoFactorRequired: true }, { status: 200 });
      if (!rateLimit(`2fa:${user.id}`, 8, 5 * 60_000).allowed) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
      if (!verifyTotp(user.twoFactorSecret, parsed.data.code)) return NextResponse.json({ error: "Invalid authentication code." }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
