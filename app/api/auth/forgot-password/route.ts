import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPasswordReset } from "@/lib/auth/password-reset";
import { rateLimit } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/integrations/email";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`forgot:${ip}`, 5, 60_000);
  if (!limit.allowed) return NextResponse.json({ ok: true });

  try {
    const { email } = await request.json();
    if (typeof email !== "string") return NextResponse.json({ ok: true });

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (user) {
      const token = await createPasswordReset(user.id);
      const base = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
      const link = `${base.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await sendEmail({
          to: email.toLowerCase(),
          subject: "Reset your ScottyWorld password",
          text: `We received a request to reset your ScottyWorld password. This link expires in 30 minutes:\n\n${link}\n\nIf you didn't request this, you can ignore this email.`,
          html: `<p>We received a request to reset your ScottyWorld password. This link expires in 30 minutes.</p><p><a href="${link}">Reset your password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
        });
      } catch (err) {
        // Email provider not configured or delivery failed. Do not leak
        // this to the client — the response stays generic either way.
        console.error("PASSWORD_RESET_EMAIL_FAILED", (err as Error).message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}